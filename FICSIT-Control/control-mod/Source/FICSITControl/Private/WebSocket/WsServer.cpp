#include "WsServer.h"
#include "SocketSubsystem.h"
#include "Interfaces/IPv4/IPv4Endpoint.h"
#include "Misc/Base64.h"
#include "Misc/SecureHash.h"
#include "Async/Async.h"

DEFINE_LOG_CATEGORY_STATIC(LogWsServer, Log, All);

// RFC 6455 magic GUID for Sec-WebSocket-Accept computation
static const FString WebSocketMagicGuid = TEXT("258EAFA5-E914-47DA-95CA-C5AB0DC85B11");

FWsServer::FWsServer()
{
}

FWsServer::~FWsServer()
{
    Stop();
}

bool FWsServer::Start(int32 Port, FTokenAuth* InAuth)
{
    if (bRunning) return true;

    Auth = InAuth;

    FIPv4Endpoint Endpoint(FIPv4Address::Any, Port);
    Listener = MakeUnique<FTcpListener>(Endpoint, FTimespan::FromSeconds(1.0), false);
    Listener->OnConnectionAccepted().BindRaw(this, &FWsServer::HandleConnection);

    if (!Listener->Init())
    {
        UE_LOG(LogWsServer, Error, TEXT("Failed to start WebSocket server on port %d"), Port);
        Listener.Reset();
        return false;
    }

    bRunning = true;
    UE_LOG(LogWsServer, Log, TEXT("WebSocket server listening on port %d"), Port);
    return true;
}

void FWsServer::Stop()
{
    bRunning = false;

    {
        FScopeLock Lock(&ConnectionsMutex);
        for (auto& Conn : Connections)
        {
            if (Conn.IsValid() && Conn->IsOpen())
            {
                Conn->Close(1001, TEXT("Server shutting down"));
            }
        }
        Connections.Empty();
    }

    if (Listener.IsValid())
    {
        Listener.Reset();
    }

    UE_LOG(LogWsServer, Log, TEXT("WebSocket server stopped"));
}

void FWsServer::BroadcastCommandStatus(const FControlCommand& Command)
{
    FString Json = JsonToString(Command.ToEventJson());

    FScopeLock Lock(&ConnectionsMutex);
    for (auto& Conn : Connections)
    {
        if (Conn.IsValid() && Conn->IsOpen())
        {
            Conn->Send(Json);
        }
    }
}

void FWsServer::Tick()
{
    FScopeLock Lock(&ConnectionsMutex);

    // Tick all connections and remove dead ones
    Connections.RemoveAll([](const TSharedPtr<FWsConnection>& Conn)
    {
        if (!Conn.IsValid() || !Conn->IsOpen()) return true;
        return !Conn->Tick();
    });
}

bool FWsServer::HandleConnection(FSocket* ClientSocket, const FIPv4Endpoint& Endpoint)
{
    if (!bRunning || !ClientSocket)
    {
        if (ClientSocket)
        {
            ClientSocket->Close();
            ISocketSubsystem::Get(PLATFORM_SOCKETSUBSYSTEM)->DestroySocket(ClientSocket);
        }
        return false;
    }

    // Perform handshake async to avoid blocking the listener
    Async(EAsyncExecution::ThreadPool, [this, ClientSocket]()
    {
        FString Token;
        if (PerformHandshake(ClientSocket, Token))
        {
            // Validate token
            if (Auth && !Auth->ValidateToken(Token))
            {
                UE_LOG(LogWsServer, Warning, TEXT("WebSocket connection rejected: invalid token"));
                // Send 4001 close
                ClientSocket->Close();
                ISocketSubsystem::Get(PLATFORM_SOCKETSUBSYSTEM)->DestroySocket(ClientSocket);
                return;
            }

            auto Connection = MakeShared<FWsConnection>(ClientSocket, Token);

            FScopeLock Lock(&ConnectionsMutex);
            Connections.Add(Connection);
            UE_LOG(LogWsServer, Log, TEXT("WebSocket client connected (total: %d)"), Connections.Num());
        }
        else
        {
            UE_LOG(LogWsServer, Warning, TEXT("WebSocket handshake failed"));
            ClientSocket->Close();
            ISocketSubsystem::Get(PLATFORM_SOCKETSUBSYSTEM)->DestroySocket(ClientSocket);
        }
    });

    return true;
}

bool FWsServer::PerformHandshake(FSocket* Socket, FString& OutToken)
{
    // Read the HTTP upgrade request
    Socket->SetNonBlocking(false);
    if (!Socket->Wait(ESocketWaitConditions::WaitForRead, FTimespan::FromSeconds(5.0)))
    {
        return false;
    }

    TArray<uint8> Buffer;
    Buffer.SetNumUninitialized(4096);
    int32 BytesRead = 0;
    if (!Socket->Recv(Buffer.GetData(), Buffer.Num(), BytesRead) || BytesRead <= 0)
    {
        return false;
    }

    FString Request = FString(BytesRead, UTF8_TO_TCHAR(reinterpret_cast<const char*>(Buffer.GetData())));

    // Parse the request to extract headers
    TArray<FString> Lines;
    Request.ParseIntoArray(Lines, TEXT("\r\n"));

    if (Lines.Num() == 0) return false;

    // Extract request path for token query param
    TArray<FString> RequestParts;
    Lines[0].ParseIntoArrayWS(RequestParts);
    if (RequestParts.Num() < 2) return false;

    FString Path = RequestParts[1];

    // Extract token from query param
    int32 QueryIndex;
    if (Path.FindChar('?', QueryIndex))
    {
        FString QueryString = Path.Mid(QueryIndex + 1);
        TArray<FString> Params;
        QueryString.ParseIntoArray(Params, TEXT("&"));
        for (const FString& Param : Params)
        {
            if (Param.StartsWith(TEXT("token=")))
            {
                OutToken = Param.Mid(6);
                break;
            }
        }
    }

    // Extract Sec-WebSocket-Key
    FString WebSocketKey;
    for (const FString& Line : Lines)
    {
        if (Line.StartsWith(TEXT("Sec-WebSocket-Key:"), ESearchCase::IgnoreCase))
        {
            WebSocketKey = Line.Mid(18).TrimStartAndEnd();
            break;
        }
    }

    if (WebSocketKey.IsEmpty())
    {
        return false;
    }

    // Compute accept key
    FString AcceptKey = ComputeAcceptKey(WebSocketKey);

    // Send the upgrade response
    FString Response = FString::Printf(
        TEXT("HTTP/1.1 101 Switching Protocols\r\n"
             "Upgrade: websocket\r\n"
             "Connection: Upgrade\r\n"
             "Sec-WebSocket-Accept: %s\r\n"
             "Access-Control-Allow-Origin: *\r\n"
             "\r\n"),
        *AcceptKey
    );

    FTCHARToUTF8 Utf8Response(*Response);
    int32 BytesSent = 0;
    Socket->Send(reinterpret_cast<const uint8*>(Utf8Response.Get()), Utf8Response.Length(), BytesSent);

    Socket->SetNonBlocking(true);

    return true;
}

FString FWsServer::ComputeAcceptKey(const FString& ClientKey)
{
    // SHA-1 hash of (ClientKey + Magic GUID), then base64 encode
    FString Combined = ClientKey + WebSocketMagicGuid;

    // Compute SHA-1
    FSHAHash Hash;
    FSHA1 Sha1;
    FTCHARToUTF8 Utf8Combined(*Combined);
    Sha1.Update(reinterpret_cast<const uint8*>(Utf8Combined.Get()), Utf8Combined.Length());
    Sha1.Final();
    Sha1.GetHash(Hash.Hash);

    // Base64 encode the 20-byte hash
    TArray<uint8> HashBytes;
    HashBytes.Append(Hash.Hash, 20);
    return FBase64::Encode(HashBytes);
}
