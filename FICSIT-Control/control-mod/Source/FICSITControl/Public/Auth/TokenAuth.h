#pragma once

#include "CoreMinimal.h"

/**
 * Simple Bearer token authentication.
 * Validates the Authorization header against a configured token.
 */
class FICSITCONTROL_API FTokenAuth
{
public:
    /** Set the expected token */
    void SetToken(const FString& InToken) { Token = InToken; }

    /** Get the configured token */
    const FString& GetToken() const { return Token; }

    /** Check if a token is configured */
    bool IsConfigured() const { return !Token.IsEmpty(); }

    /**
     * Validate an Authorization header value.
     * Expected format: "Bearer <token>"
     * Returns true if auth is disabled (no token set) or if the token matches.
     */
    bool ValidateAuthHeader(const FString& AuthHeader) const
    {
        // No token configured = auth disabled
        if (!IsConfigured()) return true;

        if (!AuthHeader.StartsWith(TEXT("Bearer "))) return false;

        FString ProvidedToken = AuthHeader.Mid(7); // Skip "Bearer "
        return ProvidedToken == Token;
    }

    /**
     * Validate a token string directly (for WebSocket query param).
     * Returns true if auth is disabled or if the token matches.
     */
    bool ValidateToken(const FString& ProvidedToken) const
    {
        if (!IsConfigured()) return true;
        return ProvidedToken == Token;
    }

private:
    FString Token;
};
