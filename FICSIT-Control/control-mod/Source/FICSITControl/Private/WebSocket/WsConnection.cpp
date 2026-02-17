#include "WsConnection.h"
#include "SocketSubsystem.h"

DEFINE_LOG_CATEGORY_STATIC(LogWsConnection, Log, All);

FWsConnection::FWsConnection(FSocket* InSocket, const FString& InToken)
    : Socket(InSocket)
    , Token(InToken)
    , bOpen(true)
{
}

FWsConnection::~FWsConnection()
{
    Close();
}

void FWsConnection::Send(const FString& Message)
{
    if (!IsOpen()) return;

    TArray<uint8> Frame = EncodeTextFrame(Message);
    SendRaw(Frame);
}

void FWsConnection::Close(uint16 Code, const FString& Reason)
{
    if (!bOpen) return;
    bOpen = false;

    if (Socket)
    {
        // Send close frame
        TArray<uint8> CloseFrame;
        CloseFrame.Add(0x88); // FIN + Close opcode
        CloseFrame.Add(0x02); // Payload length = 2 (just the code)
        CloseFrame.Add((Code >> 8) & 0xFF);
        CloseFrame.Add(Code & 0xFF);
        SendRaw(CloseFrame);

        Socket->Close();
        ISocketSubsystem::Get(PLATFORM_SOCKETSUBSYSTEM)->DestroySocket(Socket);
        Socket = nullptr;
    }
}

bool FWsConnection::Tick()
{
    if (!IsOpen()) return false;

    // Check for incoming data
    uint32 PendingSize = 0;
    if (!Socket->HasPendingData(PendingSize) || PendingSize == 0)
    {
        return true; // No data, still alive
    }

    TArray<uint8> Buffer;
    Buffer.SetNumUninitialized(FMath::Min(PendingSize, 65536u));
    int32 BytesRead = 0;

    if (!Socket->Recv(Buffer.GetData(), Buffer.Num(), BytesRead) || BytesRead <= 0)
    {
        UE_LOG(LogWsConnection, Log, TEXT("Connection closed by client"));
        bOpen = false;
        return false;
    }

    Buffer.SetNum(BytesRead);

    // Append to receive buffer
    ReceiveBuffer.Append(Buffer);

    // Try to decode frames from the buffer
    while (ReceiveBuffer.Num() >= 2)
    {
        int32 PayloadStart, PayloadLen;
        bool bMasked;
        uint8 MaskKey[4];

        int32 Opcode = DecodeFrame(ReceiveBuffer, PayloadStart, PayloadLen, bMasked, MaskKey);

        if (Opcode < 0)
        {
            break; // Need more data or error
        }

        int32 FrameLen = PayloadStart + PayloadLen;
        if (ReceiveBuffer.Num() < FrameLen)
        {
            break; // Need more data
        }

        // Extract and unmask payload
        TArray<uint8> Payload;
        Payload.SetNumUninitialized(PayloadLen);
        FMemory::Memcpy(Payload.GetData(), ReceiveBuffer.GetData() + PayloadStart, PayloadLen);

        if (bMasked)
        {
            for (int32 i = 0; i < PayloadLen; ++i)
            {
                Payload[i] ^= MaskKey[i % 4];
            }
        }

        // Remove consumed data
        ReceiveBuffer.RemoveAt(0, FrameLen);

        ProcessFrame(static_cast<uint8>(Opcode), Payload);
    }

    return IsOpen();
}

TArray<uint8> FWsConnection::EncodeTextFrame(const FString& Text)
{
    FTCHARToUTF8 Utf8(*Text);
    int32 Len = Utf8.Length();

    TArray<uint8> Frame;

    // FIN + Text opcode
    Frame.Add(0x81);

    // Payload length (server frames are unmasked)
    if (Len < 126)
    {
        Frame.Add(static_cast<uint8>(Len));
    }
    else if (Len < 65536)
    {
        Frame.Add(126);
        Frame.Add((Len >> 8) & 0xFF);
        Frame.Add(Len & 0xFF);
    }
    else
    {
        Frame.Add(127);
        // 8-byte length (big-endian)
        for (int32 i = 7; i >= 0; --i)
        {
            Frame.Add((Len >> (i * 8)) & 0xFF);
        }
    }

    // Payload
    Frame.Append(reinterpret_cast<const uint8*>(Utf8.Get()), Len);

    return Frame;
}

int32 FWsConnection::DecodeFrame(const TArray<uint8>& Data, int32& OutPayloadStart,
    int32& OutPayloadLen, bool& OutMasked, uint8 OutMaskKey[4])
{
    if (Data.Num() < 2) return -1;

    uint8 Byte0 = Data[0];
    uint8 Byte1 = Data[1];

    int32 Opcode = Byte0 & 0x0F;
    OutMasked = (Byte1 & 0x80) != 0;
    int32 PayloadLen = Byte1 & 0x7F;
    int32 HeaderLen = 2;

    if (PayloadLen == 126)
    {
        if (Data.Num() < 4) return -1;
        PayloadLen = (Data[2] << 8) | Data[3];
        HeaderLen = 4;
    }
    else if (PayloadLen == 127)
    {
        if (Data.Num() < 10) return -1;
        PayloadLen = 0;
        for (int32 i = 0; i < 8; ++i)
        {
            PayloadLen = (PayloadLen << 8) | Data[2 + i];
        }
        HeaderLen = 10;
    }

    if (OutMasked)
    {
        if (Data.Num() < HeaderLen + 4) return -1;
        FMemory::Memcpy(OutMaskKey, Data.GetData() + HeaderLen, 4);
        HeaderLen += 4;
    }

    OutPayloadStart = HeaderLen;
    OutPayloadLen = PayloadLen;

    return Opcode;
}

void FWsConnection::ProcessFrame(uint8 Opcode, const TArray<uint8>& Payload)
{
    switch (Opcode)
    {
    case 0x08: // Close
        UE_LOG(LogWsConnection, Log, TEXT("Received close frame"));
        bOpen = false;
        break;

    case 0x09: // Ping
        SendPong(Payload);
        break;

    case 0x0A: // Pong
        // Ignore
        break;

    case 0x01: // Text
    case 0x02: // Binary
        // We don't expect client-to-server data messages
        UE_LOG(LogWsConnection, Verbose, TEXT("Received data frame (opcode %d, %d bytes)"),
            Opcode, Payload.Num());
        break;

    default:
        UE_LOG(LogWsConnection, Warning, TEXT("Unknown opcode: %d"), Opcode);
        break;
    }
}

void FWsConnection::SendPong(const TArray<uint8>& Payload)
{
    TArray<uint8> Frame;
    Frame.Add(0x8A); // FIN + Pong
    Frame.Add(static_cast<uint8>(Payload.Num()));
    Frame.Append(Payload);
    SendRaw(Frame);
}

void FWsConnection::SendRaw(const TArray<uint8>& Data)
{
    if (!Socket) return;

    int32 BytesSent = 0;
    Socket->Send(Data.GetData(), Data.Num(), BytesSent);
}
