#include "SetRecipeExecutor.h"
#include "Util/BuildingResolver.h"
#include "Buildables/FGBuildableManufacturer.h"
#include "FGRecipeManager.h"
#include "FGRecipe.h"
#include "Async/Async.h"

DEFINE_LOG_CATEGORY_STATIC(LogSetRecipe, Log, All);

void FSetRecipeExecutor::Execute(TSharedRef<FControlCommand> Command, UWorld* World)
{
    if (!World)
    {
        Command->Status = EControlCommandStatus::Failed;
        Command->Error = TEXT("World not available");
        return;
    }

    if (!Command->Payload.IsValid())
    {
        Command->Status = EControlCommandStatus::Failed;
        Command->Error = TEXT("Missing payload");
        return;
    }

    FString MachineId;
    FString RecipeId;
    if (!Command->Payload->TryGetStringField(TEXT("machineId"), MachineId))
    {
        Command->Status = EControlCommandStatus::Failed;
        Command->Error = TEXT("Missing machineId in payload");
        return;
    }
    if (!Command->Payload->TryGetStringField(TEXT("recipeId"), RecipeId))
    {
        Command->Status = EControlCommandStatus::Failed;
        Command->Error = TEXT("Missing recipeId in payload");
        return;
    }

    TSharedRef<FControlCommand> CmdRef = Command;

    AsyncTask(ENamedThreads::GameThread, [CmdRef, MachineId, RecipeId, World]()
    {
        // Find the manufacturer
        AFGBuildableFactory* Factory = FBuildingResolver::FindFactory(World, MachineId);
        AFGBuildableManufacturer* Manufacturer = Cast<AFGBuildableManufacturer>(Factory);
        if (!Manufacturer)
        {
            CmdRef->Status = EControlCommandStatus::Failed;
            CmdRef->Error = FString::Printf(TEXT("Manufacturer not found: %s"), *MachineId);
            return;
        }

        // Find the recipe class by name/path
        TSubclassOf<UFGRecipe> RecipeClass = nullptr;

        // Try to find by short name first (iterate all recipe classes)
        AFGRecipeManager* RecipeManager = AFGRecipeManager::Get(World);
        if (RecipeManager)
        {
            TArray<TSubclassOf<UFGRecipe>> AvailableRecipes;
            RecipeManager->GetAllAvailableRecipes(AvailableRecipes);

            for (const auto& Recipe : AvailableRecipes)
            {
                if (Recipe)
                {
                    FString RecipeName = Recipe->GetName();
                    if (RecipeName == RecipeId || RecipeName.Contains(RecipeId))
                    {
                        RecipeClass = Recipe;
                        break;
                    }
                }
            }
        }

        // Fallback: try loading by path
        if (!RecipeClass)
        {
            RecipeClass = LoadClass<UFGRecipe>(nullptr, *RecipeId);
        }

        if (!RecipeClass)
        {
            CmdRef->Status = EControlCommandStatus::Failed;
            CmdRef->Error = FString::Printf(TEXT("Recipe not found: %s"), *RecipeId);
            return;
        }

        // Set the recipe on the manufacturer
        Manufacturer->SetRecipe(RecipeClass);

        CmdRef->Status = EControlCommandStatus::Succeeded;
        auto Result = MakeShared<FJsonObject>();
        Result->SetStringField(TEXT("message"),
            FString::Printf(TEXT("Set recipe %s on %s"), *RecipeId, *MachineId));
        CmdRef->Result = MakeShared<FJsonValueObject>(Result);

        UE_LOG(LogSetRecipe, Log, TEXT("Set recipe %s on %s"), *RecipeId, *MachineId);
    });
}
