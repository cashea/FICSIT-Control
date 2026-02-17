#pragma once

#include "CoreMinimal.h"
#include "Models/ControlModels.h"
#include "ICommandExecutor.h"

DECLARE_MULTICAST_DELEGATE_OneParam(FOnCommandStatusChanged, const FControlCommand& /* Command */);

/**
 * Routes incoming commands to the appropriate executor.
 * Manages command lifecycle, idempotency deduplication, and rate limiting.
 */
class FICSITCONTROL_API FCommandRouter
{
public:
    FCommandRouter();
    ~FCommandRouter();

    /** Register an executor for a command type */
    void RegisterExecutor(TSharedRef<ICommandExecutor> Executor);

    /** Set the world reference for game thread operations */
    void SetWorld(UWorld* InWorld) { World = InWorld; }

    /** Set rate limit (commands per second) */
    void SetRateLimit(int32 InLimit) { RateLimit = InLimit; }

    /**
     * Submit a new command. Returns the created command with QUEUED status.
     * If an idempotency key collision is found, returns the existing command.
     */
    FControlCommand SubmitCommand(const FString& IdempotencyKey, const FString& Type,
        TSharedPtr<FJsonObject> Payload);

    /** Look up a command by ID */
    TSharedPtr<FControlCommand> GetCommand(const FString& CommandId) const;

    /** Broadcast delegate for status changes (used by WebSocket server) */
    FOnCommandStatusChanged OnStatusChanged;

private:
    /** Generate a unique command ID */
    FString GenerateCommandId() const;

    /** Check rate limit. Returns true if the command is allowed. */
    bool CheckRateLimit();

    /** Update a command's status and broadcast the change */
    void UpdateStatus(TSharedRef<FControlCommand> Command, EControlCommandStatus NewStatus,
        const FString& Error = TEXT(""));

    /** All registered executors, keyed by command type */
    TMap<FString, TSharedRef<ICommandExecutor>> Executors;

    /** All commands, keyed by command ID */
    TMap<FString, TSharedRef<FControlCommand>> Commands;

    /** Idempotency index: idempotency key -> command ID */
    TMap<FString, FString> IdempotencyIndex;

    /** Timestamps of recent commands for rate limiting */
    TArray<double> RecentCommandTimes;

    UWorld* World = nullptr;
    int32 RateLimit = 5;

    mutable FCriticalSection Mutex;
};
