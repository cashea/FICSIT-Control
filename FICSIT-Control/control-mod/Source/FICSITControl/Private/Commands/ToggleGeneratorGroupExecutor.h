#pragma once

#include "CoreMinimal.h"
#include "ICommandExecutor.h"

/**
 * Executor for TOGGLE_GENERATOR_GROUP commands.
 * Finds all generators of a given type/group and toggles them on/off.
 */
class FToggleGeneratorGroupExecutor : public ICommandExecutor
{
public:
    virtual void Execute(TSharedRef<FControlCommand> Command, UWorld* World) override;
    virtual FString GetCommandType() const override { return TEXT("TOGGLE_GENERATOR_GROUP"); }
};
