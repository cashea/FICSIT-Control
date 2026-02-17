#pragma once

#include "CoreMinimal.h"
#include "ICommandExecutor.h"

/**
 * Executor for RESET_FUSE commands.
 * Finds the power circuit by ID and calls ResetFuse() on the game thread.
 */
class FResetFuseExecutor : public ICommandExecutor
{
public:
    virtual void Execute(TSharedRef<FControlCommand> Command, UWorld* World) override;
    virtual FString GetCommandType() const override { return TEXT("RESET_FUSE"); }
};
