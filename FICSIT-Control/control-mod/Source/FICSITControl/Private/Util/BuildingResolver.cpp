#include "BuildingResolver.h"
#include "EngineUtils.h"

DEFINE_LOG_CATEGORY_STATIC(LogBuildingResolver, Log, All);

FString FBuildingResolver::GetBuildingId(AActor* Actor)
{
    if (!Actor) return TEXT("");

    FString ClassName = Actor->GetClass()->GetName();
    FVector Location = Actor->GetActorLocation();

    return FString::Printf(TEXT("%s_%d_%d_%d"),
        *ClassName,
        FMath::RoundToInt(Location.X),
        FMath::RoundToInt(Location.Y),
        FMath::RoundToInt(Location.Z));
}

AFGBuildableFactory* FBuildingResolver::FindFactory(UWorld* World, const FString& BuildingId)
{
    if (!World) return nullptr;

    FString ClassName;
    FVector TargetLocation;
    if (!ParseBuildingId(BuildingId, ClassName, TargetLocation))
    {
        UE_LOG(LogBuildingResolver, Warning, TEXT("Invalid building ID format: %s"), *BuildingId);
        return nullptr;
    }

    const float Tolerance = 10.0f; // 10 units tolerance for float precision

    for (TActorIterator<AFGBuildableFactory> It(World); It; ++It)
    {
        AFGBuildableFactory* Factory = *It;
        if (!Factory) continue;

        FString ActorClassName = Factory->GetClass()->GetName();
        if (ActorClassName != ClassName) continue;

        FVector ActorLocation = Factory->GetActorLocation();
        if (FVector::Dist(ActorLocation, TargetLocation) < Tolerance)
        {
            return Factory;
        }
    }

    UE_LOG(LogBuildingResolver, Warning, TEXT("Factory not found for building ID: %s"), *BuildingId);
    return nullptr;
}

AActor* FBuildingResolver::FindActor(UWorld* World, const FString& BuildingId)
{
    if (!World) return nullptr;

    FString ClassName;
    FVector TargetLocation;
    if (!ParseBuildingId(BuildingId, ClassName, TargetLocation))
    {
        return nullptr;
    }

    const float Tolerance = 10.0f;

    for (TActorIterator<AActor> It(World); It; ++It)
    {
        AActor* Actor = *It;
        if (!Actor) continue;

        FString ActorClassName = Actor->GetClass()->GetName();
        if (ActorClassName != ClassName) continue;

        FVector ActorLocation = Actor->GetActorLocation();
        if (FVector::Dist(ActorLocation, TargetLocation) < Tolerance)
        {
            return Actor;
        }
    }

    return nullptr;
}

bool FBuildingResolver::ParseBuildingId(const FString& BuildingId, FString& OutClassName,
    FVector& OutLocation)
{
    // Format: ClassName_X_Y_Z
    // Parse from the right to handle class names that might contain underscores
    TArray<FString> Parts;
    BuildingId.ParseIntoArray(Parts, TEXT("_"));

    if (Parts.Num() < 4) return false;

    // Last 3 parts are X, Y, Z coordinates
    int32 X, Y, Z;
    if (!LexFromString(X, *Parts[Parts.Num() - 3]) ||
        !LexFromString(Y, *Parts[Parts.Num() - 2]) ||
        !LexFromString(Z, *Parts[Parts.Num() - 1]))
    {
        return false;
    }

    OutLocation = FVector(X, Y, Z);

    // Everything before the last 3 parts is the class name
    OutClassName = TEXT("");
    for (int32 i = 0; i < Parts.Num() - 3; ++i)
    {
        if (i > 0) OutClassName += TEXT("_");
        OutClassName += Parts[i];
    }

    return !OutClassName.IsEmpty();
}
