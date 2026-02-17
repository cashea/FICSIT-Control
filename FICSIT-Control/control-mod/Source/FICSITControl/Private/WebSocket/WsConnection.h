#pragma once

#include "CoreMinimal.h"
#include "Sockets.h"

/**
 * Represents a single WebSocket client connection.
 * Handles RFC 6455 frame encoding/decoding.
 */
class FWsConnection : public TSharedFromThis<FWsConnection>
{
public:
    FWsConnection(FSocket* InSocket, const FString& InToken);
    ~FWsConnection();

    /** Check if the connection is still open */
    bool IsOpen() const { return bOpen && Socket != nullptr; }

    /** Send a text message (UTF-8 JSON) */
    void Send(const FString& Message);

    /** Close the connection */
    void Close(uint16 Code = 1000, const FString& Reason = TEXT(""));

    /** Read and process incoming frames. Returns false if connection should be removed. */
    bool Tick();

    /** Get the auth token this connection provided */
    const FString& GetToken() const { return Token; }

private:
    /** Encode a text frame per RFC 6455 */
    TArray<uint8> EncodeTextFrame(const FString& Text);

    /** Decode a WebSocket frame. Returns opcode, or -1 on error. */
    int32 DecodeFrame(const TArray<uint8>& Data, int32& OutPayloadStart, int32& OutPayloadLen, bool& OutMasked, uint8 OutMaskKey[4]);

    /** Process a complete frame */
    void ProcessFrame(uint8 Opcode, const TArray<uint8>& Payload);

    /** Send a pong frame */
    void SendPong(const TArray<uint8>& Payload);

    /** Send raw bytes */
    void SendRaw(const TArray<uint8>& Data);

    FSocket* Socket;
    FString Token;
    bool bOpen;
    TArray<uint8> ReceiveBuffer;
};
