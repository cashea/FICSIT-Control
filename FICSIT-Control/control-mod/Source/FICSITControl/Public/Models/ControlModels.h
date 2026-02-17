#pragma once

#include "CoreMinimal.h"
#include "Dom/JsonObject.h"
#include "Serialization/JsonSerializer.h"
#include "Serialization/JsonWriter.h"

/** Feature flags matching the web app's ControlFeatureMapSchema */
struct FControlCapabilities
{
    FString Version = TEXT("1.0.0");
    bool bResetFuse = true;
    bool bToggleGeneratorGroup = true;
    bool bToggleBuilding = true;
    bool bSetRecipe = true;
    bool bSetOverclock = true;
    int32 CommandsPerSecond = 5;

    TSharedRef<FJsonObject> ToJson() const
    {
        auto Root = MakeShared<FJsonObject>();
        Root->SetStringField(TEXT("version"), Version);

        auto Features = MakeShared<FJsonObject>();
        Features->SetBoolField(TEXT("resetFuse"), bResetFuse);
        Features->SetBoolField(TEXT("toggleGeneratorGroup"), bToggleGeneratorGroup);
        Features->SetBoolField(TEXT("toggleBuilding"), bToggleBuilding);
        Features->SetBoolField(TEXT("setRecipe"), bSetRecipe);
        Features->SetBoolField(TEXT("setOverclock"), bSetOverclock);
        Root->SetObjectField(TEXT("features"), Features);

        auto Limits = MakeShared<FJsonObject>();
        Limits->SetNumberField(TEXT("commandsPerSecond"), CommandsPerSecond);
        Root->SetObjectField(TEXT("limits"), Limits);

        return Root;
    }
};

/** Command status enum matching the web app's CommandStatusSchema */
enum class EControlCommandStatus : uint8
{
    Queued,
    Running,
    Succeeded,
    Failed
};

inline FString CommandStatusToString(EControlCommandStatus Status)
{
    switch (Status)
    {
    case EControlCommandStatus::Queued:    return TEXT("QUEUED");
    case EControlCommandStatus::Running:   return TEXT("RUNNING");
    case EControlCommandStatus::Succeeded: return TEXT("SUCCEEDED");
    case EControlCommandStatus::Failed:    return TEXT("FAILED");
    default:                               return TEXT("UNKNOWN");
    }
}

/** A command received from the web app */
struct FControlCommand
{
    FString CommandId;
    FString IdempotencyKey;
    FString Type;
    TSharedPtr<FJsonObject> Payload;
    EControlCommandStatus Status = EControlCommandStatus::Queued;
    TSharedPtr<FJsonValue> Result;
    FString Error;

    TSharedRef<FJsonObject> ToResponseJson() const
    {
        auto Root = MakeShared<FJsonObject>();
        Root->SetStringField(TEXT("commandId"), CommandId);
        Root->SetStringField(TEXT("status"), CommandStatusToString(Status));

        if (Result.IsValid())
        {
            Root->SetField(TEXT("result"), Result);
        }
        else
        {
            Root->SetField(TEXT("result"), MakeShared<FJsonValueNull>());
        }

        if (Error.IsEmpty())
        {
            Root->SetField(TEXT("error"), MakeShared<FJsonValueNull>());
        }
        else
        {
            Root->SetStringField(TEXT("error"), Error);
        }

        return Root;
    }

    TSharedRef<FJsonObject> ToEventJson() const
    {
        auto Root = MakeShared<FJsonObject>();
        Root->SetStringField(TEXT("event"), TEXT("COMMAND_STATUS"));
        Root->SetStringField(TEXT("commandId"), CommandId);
        Root->SetStringField(TEXT("status"), CommandStatusToString(Status));

        if (Result.IsValid())
        {
            Root->SetField(TEXT("result"), Result);
        }
        else
        {
            Root->SetField(TEXT("result"), MakeShared<FJsonValueNull>());
        }

        if (Error.IsEmpty())
        {
            Root->SetField(TEXT("error"), MakeShared<FJsonValueNull>());
        }
        else
        {
            Root->SetStringField(TEXT("error"), Error);
        }

        return Root;
    }
};

/** Serialize a JSON object to a compact string */
inline FString JsonToString(const TSharedRef<FJsonObject>& JsonObj)
{
    FString Output;
    auto Writer = TJsonWriterFactory<TCHAR, TCondensedJsonPrintPolicy<TCHAR>>::Create(&Output);
    FJsonSerializer::Serialize(JsonObj, Writer);
    return Output;
}
