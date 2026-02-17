#pragma once

#include "CoreMinimal.h"
#include "ICommandExecutor.h"

/**
 * Executor for TOGGLE_BUILDING commands.
 * Finds a buildable factory by ID and toggles production on/off.
 */
class FToggleBuildingExecutor : public ICommandExecutor
{
public:
    virtual void Execute(TSharedRef<FControlCommand> Command, UWorld* World) override;
    virtual FString GetCommandType() const override { return TEXT("TOGGLE_BUILDING"); }
};
