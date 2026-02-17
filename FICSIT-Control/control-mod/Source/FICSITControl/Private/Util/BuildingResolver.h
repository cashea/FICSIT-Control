#pragma once

#include "CoreMinimal.h"
#include "Buildables/FGBuildableFactory.h"

/**
 * Resolves building IDs to actor pointers.
 * Building ID format: ClassName_X_Y_Z (matching FRM convention)
 * where X, Y, Z are integer coordinates from GetActorLocation().
 */
class FICSITCONTROL_API FBuildingResolver
{
public:
    /**
     * Build a building ID from an actor.
     * Format: ClassName_X_Y_Z
     */
    static FString GetBuildingId(AActor* Actor);

    /**
     * Find a buildable factory by its building ID.
     * Iterates all AFGBuildableFactory actors in the world.
     */
    static AFGBuildableFactory* FindFactory(UWorld* World, const FString& BuildingId);

    /**
     * Find any actor by its building ID.
     * Iterates all actors and matches by class name + location.
     */
    static AActor* FindActor(UWorld* World, const FString& BuildingId);

private:
    /** Parse a building ID into class name and location */
    static bool ParseBuildingId(const FString& BuildingId, FString& OutClassName,
        FVector& OutLocation);
};
