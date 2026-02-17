#include "Config/ControlConfig.h"
#include "Interfaces/IPluginManager.h"

DEFINE_LOG_CATEGORY_STATIC(LogControlConfig, Log, All);

void FControlConfig::LoadFromIni()
{
    // Find our plugin's base directory
    FString ConfigPath;
    IPluginManager& PluginManager = IPluginManager::Get();
    TSharedPtr<IPlugin> Plugin = PluginManager.FindPlugin(TEXT("FICSITControl"));
    if (Plugin.IsValid())
    {
        ConfigPath = Plugin->GetBaseDir() / TEXT("Config") / TEXT("FICSITControl.ini");
    }
    else
    {
        UE_LOG(LogControlConfig, Warning, TEXT("Could not find FICSITControl plugin, using defaults"));
        return;
    }

    if (!FPaths::FileExists(ConfigPath))
    {
        UE_LOG(LogControlConfig, Log, TEXT("No config file at %s, using defaults"), *ConfigPath);
        return;
    }

    FConfigFile ConfigFile;
    ConfigFile.Read(ConfigPath);

    // Network
    FString Value;
    if (ConfigFile.GetString(TEXT("Network"), TEXT("HttpPort"), Value))
    {
        HttpPort = FCString::Atoi(*Value);
    }
    if (ConfigFile.GetString(TEXT("Network"), TEXT("WsPort"), Value))
    {
        WsPort = FCString::Atoi(*Value);
    }

    // Security
    if (ConfigFile.GetString(TEXT("Security"), TEXT("AuthToken"), Value))
    {
        AuthToken = Value;
    }

    // Limits
    if (ConfigFile.GetString(TEXT("Limits"), TEXT("RateLimit"), Value))
    {
        RateLimit = FCString::Atoi(*Value);
    }

    // Features
    bool BoolValue;
    if (ConfigFile.GetBool(TEXT("Features"), TEXT("ResetFuse"), BoolValue))
    {
        bResetFuse = BoolValue;
    }
    if (ConfigFile.GetBool(TEXT("Features"), TEXT("ToggleBuilding"), BoolValue))
    {
        bToggleBuilding = BoolValue;
    }
    if (ConfigFile.GetBool(TEXT("Features"), TEXT("SetRecipe"), BoolValue))
    {
        bSetRecipe = BoolValue;
    }
    if (ConfigFile.GetBool(TEXT("Features"), TEXT("SetOverclock"), BoolValue))
    {
        bSetOverclock = BoolValue;
    }
    if (ConfigFile.GetBool(TEXT("Features"), TEXT("ToggleGeneratorGroup"), BoolValue))
    {
        bToggleGeneratorGroup = BoolValue;
    }

    UE_LOG(LogControlConfig, Log,
        TEXT("Config loaded: HTTP=%d, WS=%d, Auth=%s, Rate=%d"),
        HttpPort, WsPort,
        AuthToken.IsEmpty() ? TEXT("disabled") : TEXT("enabled"),
        RateLimit);
}
