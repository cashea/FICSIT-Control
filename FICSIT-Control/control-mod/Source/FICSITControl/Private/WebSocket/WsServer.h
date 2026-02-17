#pragma once

#include "CoreMinimal.h"
#include "Common/TcpListener.h"
#include "Sockets.h"
#include "Auth/TokenAuth.h"
#include "WsConnection.h"
#include "Models/ControlModels.h"

/**
 * WebSocket server for real-time command status events.
 * Accepts connections on a separate port (default 9091), performs
 * RFC 6455 handshake, and pushes COMMAND_STATUS events to all clients.
 */
class FICSITCONTROL_API FWsServer
{
public:
    FWsServer();
    ~FWsServer();

    /** Start the WebSocket server on the given port */
    bool Start(int32 Port, FTokenAuth* InAuth);

    /** Stop and close all connections */
    void Stop();

    /** Broadcast a command status event to all connected clients */
    void BroadcastCommandStatus(const FControlCommand& Command);

    /** Tick — process incoming frames, remove dead connections */
    void Tick();

    /** Get the number of connected clients */
    int32 GetConnectionCount() const { return Connections.Num(); }

private:
    /** Called when a new TCP connection arrives */
    bool HandleConnection(FSocket* ClientSocket, const FIPv4Endpoint& Endpoint);

    /** Perform the WebSocket upgrade handshake */
    bool PerformHandshake(FSocket* Socket, FString& OutToken);

    /** Compute Sec-WebSocket-Accept from client key */
    FString ComputeAcceptKey(const FString& ClientKey);

    TUniquePtr<FTcpListener> Listener;
    TArray<TSharedPtr<FWsConnection>> Connections;
    FTokenAuth* Auth = nullptr;
    bool bRunning = false;

    FCriticalSection ConnectionsMutex;
};
