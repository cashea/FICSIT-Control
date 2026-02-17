#include "ResetFuseExecutor.h"
#include "Async/Async.h"

// FactoryGame power circuit includes
#include "FGPowerCircuit.h"
#include "FGPowerInfoComponent.h"
#include "Buildables/FGBuildablePowerPole.h"

DEFINE_LOG_CATEGORY_STATIC(LogResetFuse, Log, All);

void FResetFuseExecutor::Execute(TSharedRef<FControlCommand> Command, UWorld* World)
{
    if (!World)
    {
        Command->Status = EControlCommandStatus::Failed;
        Command->Error = TEXT("World not available");
        return;
    }

    // Extract circuit ID from payload
    if (!Command->Payload.IsValid())
    {
        Command->Status = EControlCommandStatus::Failed;
        Command->Error = TEXT("Missing payload");
        return;
    }

    int32 CircuitId = 0;
    if (!Command->Payload->TryGetNumberField(TEXT("circuitId"), CircuitId))
    {
        Command->Status = EControlCommandStatus::Failed;
        Command->Error = TEXT("Missing or invalid circuitId in payload");
        return;
    }

    // Schedule on game thread
    TSharedRef<FControlCommand> CmdRef = Command;

    AsyncTask(ENamedThreads::GameThread, [CmdRef, CircuitId, World]()
    {
        // Find the power circuit by iterating subsystem circuits
        UFGPowerCircuit* TargetCircuit = nullptr;

        // Get the power circuit subsystem
        AFGCircuitSubsystem* CircuitSubsystem = AFGCircuitSubsystem::Get(World);
        if (CircuitSubsystem)
        {
            // Find circuit by ID
            UFGCircuit* Circuit = CircuitSubsystem->FindCircuit(CircuitId);
            if (Circuit)
            {
                TargetCircuit = Cast<UFGPowerCircuit>(Circuit);
            }
        }

        if (!TargetCircuit)
        {
            CmdRef->Status = EControlCommandStatus::Failed;
            CmdRef->Error = FString::Printf(TEXT("Power circuit %d not found"), CircuitId);
            UE_LOG(LogResetFuse, Warning, TEXT("Circuit %d not found"), CircuitId);
            return;
        }

        if (!TargetCircuit->IsFuseTriggered())
        {
            // Not tripped — succeed silently (idempotent)
            CmdRef->Status = EControlCommandStatus::Succeeded;
            auto Result = MakeShared<FJsonObject>();
            Result->SetStringField(TEXT("message"), TEXT("Fuse was not tripped"));
            CmdRef->Result = MakeShared<FJsonValueObject>(Result);
            UE_LOG(LogResetFuse, Log, TEXT("Circuit %d fuse not tripped, no-op"), CircuitId);
            return;
        }

        TargetCircuit->ResetFuse();

        CmdRef->Status = EControlCommandStatus::Succeeded;
        auto Result = MakeShared<FJsonObject>();
        Result->SetStringField(TEXT("message"),
            FString::Printf(TEXT("Reset fuse on circuit %d"), CircuitId));
        CmdRef->Result = MakeShared<FJsonValueObject>(Result);

        UE_LOG(LogResetFuse, Log, TEXT("Reset fuse on circuit %d"), CircuitId);
    });
}
