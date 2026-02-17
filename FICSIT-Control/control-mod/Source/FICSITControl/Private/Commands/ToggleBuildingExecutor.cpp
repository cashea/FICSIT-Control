#include "ToggleBuildingExecutor.h"
#include "Util/BuildingResolver.h"
#include "Buildables/FGBuildableFactory.h"
#include "Async/Async.h"

DEFINE_LOG_CATEGORY_STATIC(LogToggleBuilding, Log, All);

void FToggleBuildingExecutor::Execute(TSharedRef<FControlCommand> Command, UWorld* World)
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

    FString BuildingId;
    if (!Command->Payload->TryGetStringField(TEXT("buildingId"), BuildingId))
    {
        Command->Status = EControlCommandStatus::Failed;
        Command->Error = TEXT("Missing buildingId in payload");
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

    AsyncTask(ENamedThreads::GameThread, [CmdRef, BuildingId, bEnabled, World]()
    {
        AFGBuildableFactory* Factory = FBuildingResolver::FindFactory(World, BuildingId);
        if (!Factory)
        {
            CmdRef->Status = EControlCommandStatus::Failed;
            CmdRef->Error = FString::Printf(TEXT("Building not found: %s"), *BuildingId);
            return;
        }

        // SetIsProductionPaused takes the inverse: true = paused, false = running
        Factory->SetIsProductionPaused(!bEnabled);

        CmdRef->Status = EControlCommandStatus::Succeeded;
        auto Result = MakeShared<FJsonObject>();
        Result->SetStringField(TEXT("message"),
            FString::Printf(TEXT("%s building %s"),
                bEnabled ? TEXT("Enabled") : TEXT("Disabled"), *BuildingId));
        CmdRef->Result = MakeShared<FJsonValueObject>(Result);

        UE_LOG(LogToggleBuilding, Log, TEXT("%s building %s"),
            bEnabled ? TEXT("Enabled") : TEXT("Disabled"), *BuildingId);
    });
}
