#include "SetOverclockExecutor.h"
#include "Util/BuildingResolver.h"
#include "Buildables/FGBuildableFactory.h"
#include "Async/Async.h"

DEFINE_LOG_CATEGORY_STATIC(LogSetOverclock, Log, All);

void FSetOverclockExecutor::Execute(TSharedRef<FControlCommand> Command, UWorld* World)
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

    FString MachineId;
    if (!Command->Payload->TryGetStringField(TEXT("machineId"), MachineId))
    {
        Command->Status = EControlCommandStatus::Failed;
        Command->Error = TEXT("Missing machineId in payload");
        return;
    }

    double ClockPercent = 0;
    if (!Command->Payload->TryGetNumberField(TEXT("clockPercent"), ClockPercent))
    {
        Command->Status = EControlCommandStatus::Failed;
        Command->Error = TEXT("Missing clockPercent in payload");
        return;
    }

    // Validate range: 0-250 (percent), converts to 0.0-2.5 potential
    if (ClockPercent < 0 || ClockPercent > 250)
    {
        Command->Status = EControlCommandStatus::Failed;
        Command->Error = FString::Printf(TEXT("clockPercent must be between 0 and 250, got %f"), ClockPercent);
        return;
    }

    float Potential = static_cast<float>(ClockPercent / 100.0);

    TSharedRef<FControlCommand> CmdRef = Command;

    AsyncTask(ENamedThreads::GameThread, [CmdRef, MachineId, Potential, ClockPercent, World]()
    {
        AFGBuildableFactory* Factory = FBuildingResolver::FindFactory(World, MachineId);
        if (!Factory)
        {
            CmdRef->Status = EControlCommandStatus::Failed;
            CmdRef->Error = FString::Printf(TEXT("Building not found: %s"), *MachineId);
            return;
        }

        Factory->SetPendingPotential(Potential);

        CmdRef->Status = EControlCommandStatus::Succeeded;
        auto Result = MakeShared<FJsonObject>();
        Result->SetStringField(TEXT("message"),
            FString::Printf(TEXT("Set overclock to %.0f%% on %s"), ClockPercent, *MachineId));
        CmdRef->Result = MakeShared<FJsonValueObject>(Result);

        UE_LOG(LogSetOverclock, Log, TEXT("Set overclock to %.0f%% (potential %.2f) on %s"),
            ClockPercent, Potential, *MachineId);
    });
}
