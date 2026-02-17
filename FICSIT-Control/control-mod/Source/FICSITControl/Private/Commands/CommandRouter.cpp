#include "CommandRouter.h"
#include "Misc/Guid.h"

DEFINE_LOG_CATEGORY_STATIC(LogCommandRouter, Log, All);

FCommandRouter::FCommandRouter()
{
}

FCommandRouter::~FCommandRouter()
{
}

void FCommandRouter::RegisterExecutor(TSharedRef<ICommandExecutor> Executor)
{
    FString Type = Executor->GetCommandType();
    Executors.Add(Type, Executor);
    UE_LOG(LogCommandRouter, Log, TEXT("Registered executor for command type: %s"), *Type);
}

FControlCommand FCommandRouter::SubmitCommand(const FString& IdempotencyKey,
    const FString& Type, TSharedPtr<FJsonObject> Payload)
{
    FScopeLock Lock(&Mutex);

    // Idempotency check
    if (const FString* ExistingId = IdempotencyIndex.Find(IdempotencyKey))
    {
        if (TSharedRef<FControlCommand>* ExistingCmd = Commands.Find(*ExistingId))
        {
            UE_LOG(LogCommandRouter, Verbose, TEXT("Idempotency hit for key %s -> %s"),
                *IdempotencyKey, **ExistingId);
            return **ExistingCmd;
        }
    }

    // Rate limit check
    if (!CheckRateLimit())
    {
        FControlCommand RateLimited;
        RateLimited.CommandId = TEXT("");
        RateLimited.Status = EControlCommandStatus::Failed;
        RateLimited.Error = TEXT("Rate limit exceeded");
        return RateLimited;
    }

    // Validate command type
    TSharedRef<ICommandExecutor>* Executor = Executors.Find(Type);
    if (!Executor)
    {
        FControlCommand Unknown;
        Unknown.CommandId = TEXT("");
        Unknown.Status = EControlCommandStatus::Failed;
        Unknown.Error = FString::Printf(TEXT("Unknown command type: %s"), *Type);
        return Unknown;
    }

    // Create command
    auto Command = MakeShared<FControlCommand>();
    Command->CommandId = GenerateCommandId();
    Command->IdempotencyKey = IdempotencyKey;
    Command->Type = Type;
    Command->Payload = Payload;
    Command->Status = EControlCommandStatus::Queued;

    Commands.Add(Command->CommandId, Command);
    IdempotencyIndex.Add(IdempotencyKey, Command->CommandId);
    RecentCommandTimes.Add(FPlatformTime::Seconds());

    UE_LOG(LogCommandRouter, Log, TEXT("Command %s queued: type=%s"), *Command->CommandId, *Type);

    // Broadcast QUEUED status
    OnStatusChanged.Broadcast(*Command);

    // Execute asynchronously — executor is responsible for game thread scheduling
    TSharedRef<ICommandExecutor> ExecRef = *Executor;
    TSharedRef<FControlCommand> CmdRef = Command;
    UWorld* CapturedWorld = World;
    FCommandRouter* Self = this;

    // Mark as RUNNING
    UpdateStatus(CmdRef, EControlCommandStatus::Running);

    // Dispatch to executor
    ExecRef->Execute(CmdRef, CapturedWorld);

    return *Command;
}

TSharedPtr<FControlCommand> FCommandRouter::GetCommand(const FString& CommandId) const
{
    FScopeLock Lock(&Mutex);
    const TSharedRef<FControlCommand>* Found = Commands.Find(CommandId);
    return Found ? TSharedPtr<FControlCommand>(*Found) : nullptr;
}

FString FCommandRouter::GenerateCommandId() const
{
    return FString::Printf(TEXT("cmd-%s"), *FGuid::NewGuid().ToString(EGuidFormats::Short));
}

bool FCommandRouter::CheckRateLimit()
{
    double Now = FPlatformTime::Seconds();
    double WindowStart = Now - 1.0; // 1-second window

    // Remove expired entries
    RecentCommandTimes.RemoveAll([WindowStart](double Time) { return Time < WindowStart; });

    return RecentCommandTimes.Num() < RateLimit;
}

void FCommandRouter::UpdateStatus(TSharedRef<FControlCommand> Command,
    EControlCommandStatus NewStatus, const FString& Error)
{
    Command->Status = NewStatus;
    if (!Error.IsEmpty())
    {
        Command->Error = Error;
    }

    UE_LOG(LogCommandRouter, Log, TEXT("Command %s -> %s"),
        *Command->CommandId, *CommandStatusToString(NewStatus));

    OnStatusChanged.Broadcast(*Command);
}
