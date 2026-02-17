#pragma once

#include "CoreMinimal.h"
#include "Models/ControlModels.h"

/**
 * Interface for command executors.
 * Each command type (RESET_FUSE, TOGGLE_BUILDING, etc.) has its own executor.
 * Executors run on the game thread when they need to interact with game objects.
 */
class ICommandExecutor
{
public:
    virtual ~ICommandExecutor() = default;

    /**
     * Execute a command. Called from the command router.
     * Implementations must schedule game thread work via AsyncTask if needed.
     *
     * @param Command The command to execute (status will be updated in place)
     * @param World The game world for actor lookups
     */
    virtual void Execute(TSharedRef<FControlCommand> Command, UWorld* World) = 0;

    /** Return the command type this executor handles (e.g., "RESET_FUSE") */
    virtual FString GetCommandType() const = 0;
};
