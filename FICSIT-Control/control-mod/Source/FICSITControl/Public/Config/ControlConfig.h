#pragma once

#include "CoreMinimal.h"

/**
 * Configuration for FICSIT Control mod.
 * Reads from FICSITControl.ini in the mod's Config directory.
 * Not a UObject — pure C++ config reader using GConfig.
 */
struct FICSITCONTROL_API FControlConfig
{
    int32 HttpPort = 9090;
    int32 WsPort = 9091;
    FString AuthToken;
    int32 RateLimit = 5;

    bool bResetFuse = true;
    bool bToggleBuilding = true;
    bool bSetRecipe = true;
    bool bSetOverclock = true;
    bool bToggleGeneratorGroup = true;

    /** Load config from the mod's ini file */
    void LoadFromIni();
};
