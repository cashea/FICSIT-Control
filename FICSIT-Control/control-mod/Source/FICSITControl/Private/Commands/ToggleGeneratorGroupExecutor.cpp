#include "ToggleGeneratorGroupExecutor.h"
#include "Buildables/FGBuildableGeneratorFuel.h"
#include "Buildables/FGBuildableGeneratorNuclear.h"
#include "EngineUtils.h"
#include "Async/Async.h"

DEFINE_LOG_CATEGORY_STATIC(LogToggleGenGroup, Log, All);

void FToggleGeneratorGroupExecutor::Execute(TSharedRef<FControlCommand> Command, UWorld* World)
{
    if (!World)
    {
        Command->Status = EControlCommandStatus::Failed;
        Command->Error = TEXT("World not available");
        return;
    }

    if (!Command->Payload.IsValid())
    {
        Command->Status = EControlCommandStatus::Failed;
        Command->Error = TEXT("Missing payload");
        return;
    }

    FString GroupId;
    if (!Command->Payload->TryGetStringField(TEXT("groupId"), GroupId))
    {
        Command->Status = EControlCommandStatus::Failed;
        Command->Error = TEXT("Missing groupId in payload");
        return;
    }

    bool bEnabled = false;
    if (!Command->Payload->TryGetBoolField(TEXT("enabled"), bEnabled))
    {
        Command->Status = EControlCommandStatus::Failed;
        Command->Error = TEXT("Missing enabled in payload");
        return;
    }

    TSharedRef<FControlCommand> CmdRef = Command;

    AsyncTask(ENamedThreads::GameThread, [CmdRef, GroupId, bEnabled, World]()
    {
        // GroupId is the class name of the generator type (e.g., "Build_GeneratorCoal_C")
        int32 ToggleCount = 0;

        for (TActorIterator<AFGBuildableGenerator> It(World); It; ++It)
        {
            AFGBuildableGenerator* Generator = *It;
            if (!Generator) continue;

            FString ClassName = Generator->GetClass()->GetName();
            if (ClassName == GroupId)
            {
                Generator->SetIsProductionPaused(!bEnabled);
                ToggleCount++;
            }
        }

        if (ToggleCount == 0)
        {
            CmdRef->Status = EControlCommandStatus::Failed;
            CmdRef->Error = FString::Printf(TEXT("No generators found for group: %s"), *GroupId);
            return;
        }

        CmdRef->Status = EControlCommandStatus::Succeeded;
        auto Result = MakeShared<FJsonObject>();
        Result->SetStringField(TEXT("message"),
            FString::Printf(TEXT("%s %d generators in group %s"),
                bEnabled ? TEXT("Enabled") : TEXT("Disabled"), ToggleCount, *GroupId));
        Result->SetNumberField(TEXT("count"), ToggleCount);
        CmdRef->Result = MakeShared<FJsonValueObject>(Result);

        UE_LOG(LogToggleGenGroup, Log, TEXT("%s %d generators in group %s"),
            bEnabled ? TEXT("Enabled") : TEXT("Disabled"), ToggleCount, *GroupId);
    });
}
