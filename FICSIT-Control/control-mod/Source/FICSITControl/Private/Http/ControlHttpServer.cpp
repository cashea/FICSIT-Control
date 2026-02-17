#include "ControlHttpServer.h"
#include "Interfaces/IPv4/IPv4Endpoint.h"
#include "Misc/ScopeLock.h"
#include "Async/Async.h"

DEFINE_LOG_CATEGORY_STATIC(LogControlHttp, Log, All);

FControlHttpServer::FControlHttpServer()
{
}

FControlHttpServer::~FControlHttpServer()
{
    Stop();
}

bool FControlHttpServer::Start(int32 Port)
{
    if (bRunning) return true;

    FIPv4Endpoint Endpoint(FIPv4Address::Any, Port);

    Listener = MakeUnique<FTcpListener>(
        Endpoint,
        FTimespan::FromSeconds(1.0),
        false /* bReusable */
    );

    Listener->OnConnectionAccepted().BindRaw(this, &FControlHttpServer::HandleConnection);

    if (!Listener->Init())
    {
        UE_LOG(LogControlHttp, Error, TEXT("Failed to initialize TCP listener on port %d"), Port);
        Listener.Reset();
        return false;
    }

    bRunning = true;
    UE_LOG(LogControlHttp, Log, TEXT("HTTP server listening on port %d"), Port);
    return true;
}

void FControlHttpServer::Stop()
{
    bRunning = false;
    if (Listener.IsValid())
    {
        Listener.Reset();
    }
    UE_LOG(LogControlHttp, Log, TEXT("HTTP server stopped"));
}

bool FControlHttpServer::HandleConnection(FSocket* ClientSocket, const FIPv4Endpoint& Endpoint)
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

    // Process request asynchronously to avoid blocking the listener
    Async(EAsyncExecution::ThreadPool, [this, ClientSocket]()
    {
        ProcessRequest(ClientSocket);
        ClientSocket->Close();
        ISocketSubsystem::Get(PLATFORM_SOCKETSUBSYSTEM)->DestroySocket(ClientSocket);
    });

    return true;
}

void FControlHttpServer::ProcessRequest(FSocket* ClientSocket)
{
    // Read data with a timeout
    ClientSocket->SetNonBlocking(false);
    ClientSocket->SetRecvErr();

    // Wait for data (up to 5 seconds)
    if (!ClientSocket->Wait(ESocketWaitConditions::WaitForRead, FTimespan::FromSeconds(5.0)))
    {
        return;
    }

    // Read the request
    TArray<uint8> Buffer;
    Buffer.SetNumUninitialized(65536);
    int32 BytesRead = 0;
    if (!ClientSocket->Recv(Buffer.GetData(), Buffer.Num(), BytesRead))
    {
        return;
    }

    if (BytesRead <= 0) return;

    FString RawRequest = FString(BytesRead, UTF8_TO_TCHAR(reinterpret_cast<const char*>(Buffer.GetData())));

    FString Method, Path;
    TMap<FString, FString> Headers;
    FString Body;

    if (!ParseHttpRequest(RawRequest, Method, Path, Headers, Body))
    {
        SendJsonError(ClientSocket, 400, TEXT("Bad Request"));
        return;
    }

    UE_LOG(LogControlHttp, Verbose, TEXT("%s %s"), *Method, *Path);

    // CORS preflight
    if (Method == TEXT("OPTIONS"))
    {
        SendResponse(ClientSocket, 204, TEXT("No Content"), TEXT(""), TEXT(""));
        return;
    }

    // Route: GET /control/v1/capabilities
    if (Method == TEXT("GET") && Path == TEXT("/control/v1/capabilities"))
    {
        HandleCapabilities(ClientSocket);
        return;
    }

    // Route: POST /control/v1/commands
    if (Method == TEXT("POST") && Path == TEXT("/control/v1/commands"))
    {
        HandlePostCommand(ClientSocket, Headers, Body);
        return;
    }

    // Route: GET /control/v1/commands/:id
    if (Method == TEXT("GET") && Path.StartsWith(TEXT("/control/v1/commands/")))
    {
        FString CommandId = Path.Mid(21); // Length of "/control/v1/commands/"
        HandleGetCommand(ClientSocket, Headers, CommandId);
        return;
    }

    SendJsonError(ClientSocket, 404, TEXT("Not found"));
}

bool FControlHttpServer::ParseHttpRequest(const FString& RawRequest,
    FString& OutMethod, FString& OutPath,
    TMap<FString, FString>& OutHeaders, FString& OutBody)
{
    // Split header section from body at \r\n\r\n
    int32 HeaderEnd;
    if (!RawRequest.FindChar('\r', HeaderEnd))
    {
        // Try to at least parse the first line
    }

    FString HeaderSection;
    int32 BodyStart = INDEX_NONE;

    int32 SepIndex = RawRequest.Find(TEXT("\r\n\r\n"));
    if (SepIndex != INDEX_NONE)
    {
        HeaderSection = RawRequest.Left(SepIndex);
        BodyStart = SepIndex + 4;
        OutBody = RawRequest.Mid(BodyStart);
    }
    else
    {
        HeaderSection = RawRequest;
        OutBody = TEXT("");
    }

    // Parse request line
    TArray<FString> Lines;
    HeaderSection.ParseIntoArray(Lines, TEXT("\r\n"));

    if (Lines.Num() == 0) return false;

    TArray<FString> RequestParts;
    Lines[0].ParseIntoArrayWS(RequestParts);

    if (RequestParts.Num() < 2) return false;

    OutMethod = RequestParts[0].ToUpper();
    OutPath = RequestParts[1];

    // Strip query string from path for routing
    int32 QueryIndex;
    if (OutPath.FindChar('?', QueryIndex))
    {
        OutPath = OutPath.Left(QueryIndex);
    }

    // Parse headers
    for (int32 i = 1; i < Lines.Num(); ++i)
    {
        int32 ColonIndex;
        if (Lines[i].FindChar(':', ColonIndex))
        {
            FString Key = Lines[i].Left(ColonIndex).TrimStartAndEnd();
            FString Value = Lines[i].Mid(ColonIndex + 1).TrimStartAndEnd();
            OutHeaders.Add(Key.ToLower(), Value);
        }
    }

    return true;
}

void FControlHttpServer::SendResponse(FSocket* Socket, int32 StatusCode,
    const FString& StatusText, const FString& ContentType, const FString& Body)
{
    FString Response = FString::Printf(
        TEXT("HTTP/1.1 %d %s\r\n"
             "Access-Control-Allow-Origin: *\r\n"
             "Access-Control-Allow-Headers: Content-Type, Authorization\r\n"
             "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n"
             "Connection: close\r\n"),
        StatusCode, *StatusText
    );

    if (!ContentType.IsEmpty())
    {
        Response += FString::Printf(TEXT("Content-Type: %s\r\n"), *ContentType);
    }

    FTCHARToUTF8 Utf8Body(*Body);
    Response += FString::Printf(TEXT("Content-Length: %d\r\n"), Utf8Body.Length());
    Response += TEXT("\r\n");

    // Send headers
    FTCHARToUTF8 Utf8Headers(*Response);
    int32 BytesSent = 0;
    Socket->Send(reinterpret_cast<const uint8*>(Utf8Headers.Get()), Utf8Headers.Length(), BytesSent);

    // Send body
    if (Utf8Body.Length() > 0)
    {
        Socket->Send(reinterpret_cast<const uint8*>(Utf8Body.Get()), Utf8Body.Length(), BytesSent);
    }
}

void FControlHttpServer::SendJsonResponse(FSocket* Socket, int32 StatusCode,
    const TSharedRef<FJsonObject>& Json)
{
    FString JsonStr = JsonToString(Json);
    FString StatusText;
    switch (StatusCode)
    {
    case 200: StatusText = TEXT("OK"); break;
    case 201: StatusText = TEXT("Created"); break;
    case 202: StatusText = TEXT("Accepted"); break;
    default:  StatusText = TEXT("OK"); break;
    }

    SendResponse(Socket, StatusCode, StatusText, TEXT("application/json"), JsonStr);
}

void FControlHttpServer::SendJsonError(FSocket* Socket, int32 StatusCode,
    const FString& ErrorMessage)
{
    auto ErrorJson = MakeShared<FJsonObject>();
    ErrorJson->SetStringField(TEXT("error"), ErrorMessage);

    FString StatusText;
    switch (StatusCode)
    {
    case 400: StatusText = TEXT("Bad Request"); break;
    case 401: StatusText = TEXT("Unauthorized"); break;
    case 404: StatusText = TEXT("Not Found"); break;
    case 429: StatusText = TEXT("Too Many Requests"); break;
    case 500: StatusText = TEXT("Internal Server Error"); break;
    default:  StatusText = TEXT("Error"); break;
    }

    SendResponse(Socket, StatusCode, StatusText, TEXT("application/json"), JsonToString(ErrorJson));
}

// -- Route Handlers --

void FControlHttpServer::HandleCapabilities(FSocket* Socket)
{
    SendJsonResponse(Socket, 200, Capabilities.ToJson());
}

void FControlHttpServer::HandlePostCommand(FSocket* Socket,
    const TMap<FString, FString>& Headers, const FString& Body)
{
    // Auth check
    const FString* AuthHeader = Headers.Find(TEXT("authorization"));
    if (!Auth.ValidateAuthHeader(AuthHeader ? *AuthHeader : TEXT("")))
    {
        SendJsonError(Socket, 401, TEXT("Unauthorized"));
        return;
    }

    // Parse JSON body
    TSharedPtr<FJsonObject> JsonBody;
    auto Reader = TJsonReaderFactory<>::Create(Body);
    if (!FJsonSerializer::Deserialize(Reader, JsonBody) || !JsonBody.IsValid())
    {
        SendJsonError(Socket, 400, TEXT("Invalid JSON"));
        return;
    }

    // Extract fields
    FString IdempotencyKey;
    FString Type;
    if (!JsonBody->TryGetStringField(TEXT("idempotencyKey"), IdempotencyKey) ||
        !JsonBody->TryGetStringField(TEXT("type"), Type))
    {
        SendJsonError(Socket, 400, TEXT("Missing required fields: idempotencyKey, type"));
        return;
    }

    // Get payload object
    TSharedPtr<FJsonObject> Payload;
    const TSharedPtr<FJsonObject>* PayloadPtr;
    if (JsonBody->TryGetObjectField(TEXT("payload"), PayloadPtr))
    {
        Payload = *PayloadPtr;
    }

    // Delegate to command router
    if (OnCommandReceived.IsBound())
    {
        FControlCommand Cmd = OnCommandReceived.Execute(Type, Payload);

        // Set the idempotency key on the command
        Cmd.IdempotencyKey = IdempotencyKey;

        SendJsonResponse(Socket, 202, Cmd.ToResponseJson());
    }
    else
    {
        SendJsonError(Socket, 500, TEXT("Command router not available"));
    }
}

void FControlHttpServer::HandleGetCommand(FSocket* Socket,
    const TMap<FString, FString>& Headers, const FString& CommandId)
{
    // Auth check
    const FString* AuthHeader = Headers.Find(TEXT("authorization"));
    if (!Auth.ValidateAuthHeader(AuthHeader ? *AuthHeader : TEXT("")))
    {
        SendJsonError(Socket, 401, TEXT("Unauthorized"));
        return;
    }

    if (OnCommandQuery.IsBound())
    {
        TSharedPtr<FControlCommand> Cmd = OnCommandQuery.Execute(CommandId);
        if (Cmd.IsValid())
        {
            SendJsonResponse(Socket, 200, Cmd->ToResponseJson());
        }
        else
        {
            SendJsonError(Socket, 404, TEXT("Command not found"));
        }
    }
    else
    {
        SendJsonError(Socket, 500, TEXT("Command router not available"));
    }
}
