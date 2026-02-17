using UnrealBuildTool;

public class FICSITControl : ModuleRules
{
    public FICSITControl(ReadOnlyTargetRules Target) : base(Target)
    {
        CppStandard = CppStandardVersion.Cpp20;
        DefaultBuildSettings = BuildSettingsVersion.Latest;
        PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;
        bLegacyPublicIncludePaths = false;

        // FactoryGame transitive dependencies
        PublicDependencyModuleNames.AddRange(new[] {
            "Core",
            "CoreUObject",
            "Engine"
        });

        // SML + FactoryGame
        PublicDependencyModuleNames.AddRange(new[] {
            "SML",
            "FactoryGame"
        });

        // Our direct dependencies
        PublicDependencyModuleNames.AddRange(new[] {
            "Json",
            "JsonUtilities",
            "Networking",
            "Sockets"
        });
    }
}
