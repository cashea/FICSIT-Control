#pragma once

#include "CoreMinimal.h"
#include "ICommandExecutor.h"

/**
 * Executor for SET_OVERCLOCK commands.
 * Finds a buildable factory by ID and sets its clock speed.
 */
class FSetOverclockExecutor : public ICommandExecutor
{
public:
    virtual void Execute(TSharedRef<FControlCommand> Command, UWorld* World) override;
    virtual FString GetCommandType() const override { return TEXT("SET_OVERCLOCK"); }
};
