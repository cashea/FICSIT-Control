#pragma once

#include "CoreMinimal.h"
#include "Common/TcpListener.h"
#include "Sockets.h"
#include "SocketSubsystem.h"
#include "Auth/TokenAuth.h"
#include "Models/ControlModels.h"

/**
 * Lightweight HTTP server for the FICSIT Control API.
 * Uses FTcpListener for accepting connections and manual HTTP parsing.
 * Supports GET and POST with JSON bodies, CORS, and Bearer auth.
 */
class FICSITCONTROL_API FControlHttpServer
{
public:
    FControlHttpServer();
    ~FControlHttpServer();

    /** Start listening on the given port. Returns true on success. */
    bool Start(int32 Port);

    /** Stop the server and close all connections. */
    void Stop();

    /** Get auth helper for external validation */
    FTokenAuth& GetAuth() { return Auth; }

    /** Get capabilities */
    FControlCapabilities& GetCapabilities() { return Capabilities; }

    /** Delegate for command submission — set by ControlSubsystem */
    DECLARE_DELEGATE_RetVal_TwoParams(FControlCommand, FOnCommandReceived,
        const FString& /* Type */, TSharedPtr<FJsonObject> /* Payload */);
    FOnCommandReceived OnCommandReceived;

    /** Delegate for command status query */
    DECLARE_DELEGATE_RetVal_OneParam(TSharedPtr<FControlCommand>, FOnCommandQuery,
        const FString& /* CommandId */);
    FOnCommandQuery OnCommandQuery;

private:
    /** Called by FTcpListener when a new connection arrives */
    bool HandleConnection(FSocket* ClientSocket, const FIPv4Endpoint& Endpoint);

    /** Process a single HTTP request on a client socket */
    void ProcessRequest(FSocket* ClientSocket);

    /** Parse an HTTP request into method, path, headers, body */
    bool ParseHttpRequest(const FString& RawRequest,
        FString& OutMethod, FString& OutPath,
        TMap<FString, FString>& OutHeaders, FString& OutBody);

    /** Send an HTTP response */
    void SendResponse(FSocket* Socket, int32 StatusCode, const FString& StatusText,
        const FString& ContentType, const FString& Body);

    /** Send a JSON response with CORS headers */
    void SendJsonResponse(FSocket* Socket, int32 StatusCode, const TSharedRef<FJsonObject>& Json);

    /** Send a JSON error */
    void SendJsonError(FSocket* Socket, int32 StatusCode, const FString& ErrorMessage);

    /** Route handlers */
    void HandleCapabilities(FSocket* Socket);
    void HandlePostCommand(FSocket* Socket, const TMap<FString, FString>& Headers,
        const FString& Body);
    void HandleGetCommand(FSocket* Socket, const TMap<FString, FString>& Headers,
        const FString& CommandId);

    TUniquePtr<FTcpListener> Listener;
    FTokenAuth Auth;
    FControlCapabilities Capabilities;
    bool bRunning = false;
};
