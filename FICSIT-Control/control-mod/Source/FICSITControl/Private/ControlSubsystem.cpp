#include "ControlSubsystem.h"
#include "Http/ControlHttpServer.h"
#include "Commands/CommandRouter.h"
#include "Commands/ResetFuseExecutor.h"
#include "Commands/ToggleBuildingExecutor.h"
#include "Commands/SetRecipeExecutor.h"
#include "Commands/SetOverclockExecutor.h"
#include "Commands/ToggleGeneratorGroupExecutor.h"
#include "WebSocket/WsServer.h"
#include "Config/ControlConfig.h"
#include "Kismet/GameplayStatics.h"

DEFINE_LOG_CATEGORY_STATIC(LogControlSubsystem, Log, All);

AControlSubsystem::AControlSubsystem()
{
    PrimaryActorTick.bCanEverTick = true;
    PrimaryActorTick.TickInterval = 0.1f; // 10 Hz for WS housekeeping
}

AControlSubsystem* AControlSubsystem::Get(UWorld* World)
{
    if (!World) return nullptr;

    TArray<AActor*> Found;
    UGameplayStatics::GetAllActorsOfClass(World, AControlSubsystem::StaticClass(), Found);

    return Found.Num() > 0 ? Cast<AControlSubsystem>(Found[0]) : nullptr;
}

void AControlSubsystem::BeginPlay()
{
    Super::BeginPlay();

    // Load configuration from ini
    FControlConfig Config;
    Config.LoadFromIni();
    const int32 HttpPort = Config.HttpPort;
    const int32 WsPort = Config.WsPort;

    // Initialize command router
    CommandRouter = MakeShared<FCommandRouter>();
    CommandRouter->SetWorld(GetWorld());
    CommandRouter->SetRateLimit(Config.RateLimit);

    // Register command executors
    CommandRouter->RegisterExecutor(MakeShared<FResetFuseExecutor>());
    CommandRouter->RegisterExecutor(MakeShared<FToggleBuildingExecutor>());
    CommandRouter->RegisterExecutor(MakeShared<FSetRecipeExecutor>());
    CommandRouter->RegisterExecutor(MakeShared<FSetOverclockExecutor>());
    CommandRouter->RegisterExecutor(MakeShared<FToggleGeneratorGroupExecutor>());

    // Initialize WebSocket server
    WsServer = MakeShared<FWsServer>();

    // Wire command router status changes -> WS broadcast
    CommandRouter->OnStatusChanged.AddLambda(
        [this](const FControlCommand& Command)
        {
            if (WsServer.IsValid())
            {
                WsServer->BroadcastCommandStatus(Command);
            }
        });

    // Initialize HTTP server
    HttpServer = MakeShared<FControlHttpServer>();

    // Configure auth token and capabilities from config
    if (!Config.AuthToken.IsEmpty())
    {
        HttpServer->GetAuth().SetToken(Config.AuthToken);
    }
    {
        FControlCapabilities& Caps = HttpServer->GetCapabilities();
        Caps.bResetFuse = Config.bResetFuse;
        Caps.bToggleBuilding = Config.bToggleBuilding;
        Caps.bSetRecipe = Config.bSetRecipe;
        Caps.bSetOverclock = Config.bSetOverclock;
        Caps.bToggleGeneratorGroup = Config.bToggleGeneratorGroup;
        Caps.CommandsPerSecond = Config.RateLimit;
    }

    // Wire up HTTP server -> command router delegates
    HttpServer->OnCommandReceived.BindLambda(
        [this](const FString& Type, TSharedPtr<FJsonObject> Payload) -> FControlCommand
        {
            return CommandRouter->SubmitCommand(FGuid::NewGuid().ToString(), Type, Payload);
        });

    HttpServer->OnCommandQuery.BindLambda(
        [this](const FString& CommandId) -> TSharedPtr<FControlCommand>
        {
            return CommandRouter->GetCommand(CommandId);
        });

    if (HttpServer->Start(HttpPort))
    {
        UE_LOG(LogControlSubsystem, Log, TEXT("FICSIT Control HTTP server started on port %d"), HttpPort);
    }
    else
    {
        UE_LOG(LogControlSubsystem, Error, TEXT("Failed to start FICSIT Control HTTP server on port %d"), HttpPort);
    }

    if (WsServer->Start(WsPort, &HttpServer->GetAuth()))
    {
        UE_LOG(LogControlSubsystem, Log, TEXT("FICSIT Control WebSocket server started on port %d"), WsPort);
    }
    else
    {
        UE_LOG(LogControlSubsystem, Error, TEXT("Failed to start FICSIT Control WebSocket server on port %d"), WsPort);
    }
}

void AControlSubsystem::EndPlay(const EEndPlayReason::Type EndPlayReason)
{
    if (WsServer.IsValid())
    {
        WsServer->Stop();
        WsServer.Reset();
        UE_LOG(LogControlSubsystem, Log, TEXT("FICSIT Control WebSocket server stopped"));
    }

    if (HttpServer.IsValid())
    {
        HttpServer->Stop();
        HttpServer.Reset();
        UE_LOG(LogControlSubsystem, Log, TEXT("FICSIT Control HTTP server stopped"));
    }

    if (CommandRouter.IsValid())
    {
        CommandRouter.Reset();
    }

    Super::EndPlay(EndPlayReason);
}

void AControlSubsystem::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);

    // Tick WebSocket server to process incoming frames and clean up dead connections
    if (WsServer.IsValid())
    {
        WsServer->Tick();
    }
}
