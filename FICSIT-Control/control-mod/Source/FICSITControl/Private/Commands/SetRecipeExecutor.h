#pragma once

#include "CoreMinimal.h"
#include "ICommandExecutor.h"

/**
 * Executor for SET_RECIPE commands.
 * Finds a manufacturer by ID and sets its recipe.
 */
class FSetRecipeExecutor : public ICommandExecutor
{
public:
    virtual void Execute(TSharedRef<FControlCommand> Command, UWorld* World) override;
    virtual FString GetCommandType() const override { return TEXT("SET_RECIPE"); }
};
