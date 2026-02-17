#pragma once

#include "CoreMinimal.h"
#include "Subsystem/ModSubsystem.h"
#include "ControlSubsystem.generated.h"

class FControlHttpServer;
class FCommandRouter;
class FWsServer;

UCLASS()
class FICSITCONTROL_API AControlSubsystem : public AModSubsystem
{
    GENERATED_BODY()

public:
    AControlSubsystem();

    /** Get the singleton instance */
    static AControlSubsystem* Get(UWorld* World);

    /** Get the command router */
    FCommandRouter* GetCommandRouter() const { return CommandRouter.Get(); }

    virtual void BeginPlay() override;
    virtual void EndPlay(const EEndPlayReason::Type EndPlayReason) override;
    virtual void Tick(float DeltaTime) override;

private:
    TSharedPtr<FControlHttpServer> HttpServer;
    TSharedPtr<FCommandRouter> CommandRouter;
    TSharedPtr<FWsServer> WsServer;
};
