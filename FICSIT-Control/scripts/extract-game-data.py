#!/usr/bin/env python3
"""
Extract game data from Satisfactory's Docs/en-US.json and generate TypeScript data files.

Usage:
    python scripts/extract-game-data.py [path-to-en-US.json]

Defaults to the Steam install path if no argument provided.
"""

import json
import re
import sys
import os
from typing import Any

# ---------- Configuration ----------

DEFAULT_DOCS_PATH = r"D:/Program Files (x86)/Steam/steamapps/common/Satisfactory/CommunityResources/Docs/en-US.json"

STACK_SIZE_MAP = {
    "SS_ONE": 1,
    "SS_SMALL": 50,
    "SS_MEDIUM": 100,
    "SS_BIG": 200,
    "SS_HUGE": 500,
    "SS_FLUID": 0,
}

FORM_MAP = {
    "RF_SOLID": "solid",
    "RF_LIQUID": "liquid",
    "RF_GAS": "gas",
    "RF_HEAT": "solid",  # fallback
    "RF_INVALID": "solid",  # fallback
}

ITEM_DESCRIPTOR_CLASSES = {
    "FGItemDescriptor",
    "FGResourceDescriptor",
    "FGItemDescriptorBiomass",
    "FGItemDescriptorNuclearFuel",
    "FGPowerShardDescriptor",
    "FGConsumableDescriptor",
    "FGItemDescriptorPowerBoosterFuel",
    "FGAmmoTypeProjectile",
    "FGAmmoTypeSpreadshot",
    "FGAmmoTypeInstantHit",
    "FGEquipmentDescriptor",
}

MACHINE_CLASS_NAMES = {
    "Build_SmelterMk1_C",
    "Build_FoundryMk1_C",
    "Build_ConstructorMk1_C",
    "Build_AssemblerMk1_C",
    "Build_ManufacturerMk1_C",
    "Build_OilRefinery_C",
    "Build_Packager_C",
    "Build_Blender_C",
    "Build_HadronCollider_C",
    "Build_QuantumEncoder_C",
    "Build_Converter_C",
}

# Building input/output slot counts (from game knowledge)
BUILDING_SLOTS = {
    "SmelterMk1": (1, 1),
    "FoundryMk1": (2, 1),
    "ConstructorMk1": (1, 1),
    "AssemblerMk1": (2, 1),
    "ManufacturerMk1": (4, 1),
    "OilRefinery": (2, 2),
    "Packager": (2, 2),
    "Blender": (4, 2),
    "HadronCollider": (2, 1),
    "QuantumEncoder": (4, 2),
    "Converter": (2, 2),
}


# ---------- Helpers ----------

def strip_id(class_name: str, prefix: str) -> str:
    """Strip prefix and _C suffix from a ClassName."""
    name = class_name
    if name.startswith(prefix):
        name = name[len(prefix):]
    if name.endswith("_C"):
        name = name[:-2]
    return name


def get_native_class_name(native_class: str) -> str:
    """Extract the class name from NativeClass string."""
    return native_class.split(".")[-1].rstrip("'")


def parse_io_list(raw: str) -> list[dict[str, Any]]:
    """Parse mIngredients or mProduct string into list of {itemId, amount}."""
    results = []
    # Pattern: Desc_XXX.Desc_XXX_C'",Amount=N
    pattern = re.compile(r"Desc_(\w+)\.Desc_\w+_C['\"]*\s*,\s*Amount=(\d+)")
    for match in pattern.finditer(raw):
        item_class = match.group(1)
        amount = int(match.group(2))
        results.append({"itemId": item_class, "amount": amount})
    return results


def extract_machine_class(produced_in: str) -> str | None:
    """Extract the first machine class name from mProducedIn."""
    for part in produced_in.split(","):
        part = part.strip().strip("(").strip(")").strip('"')
        if "BuildGun" in part or "WorkBench" in part or "AutomatedWorkBench" in part:
            continue
        if part:
            class_name = part.split(".")[-1].rstrip("'").rstrip('"')
            if class_name in MACHINE_CLASS_NAMES:
                return class_name
    return None


def categorize_item(item_id: str, nc_type: str, form: str) -> str:
    """Determine item category from NativeClass type and item properties."""
    if nc_type == "FGResourceDescriptor":
        if form in ("liquid", "gas"):
            return "fluid"
        return "ore"
    if nc_type == "FGItemDescriptorBiomass":
        return "biomass"
    if nc_type == "FGItemDescriptorNuclearFuel":
        return "nuclear"
    if nc_type == "FGPowerShardDescriptor":
        return "quantum"
    if nc_type == "FGItemDescriptorPowerBoosterFuel":
        return "quantum"
    if nc_type == "FGConsumableDescriptor":
        return "component"

    # Heuristic categorization for FGItemDescriptor
    lid = item_id.lower()
    if "ingot" in lid:
        return "ingot"
    if lid.startswith("spaceelevatorpart"):
        return "space-elevator"
    if "nuclear" in lid or "uranium" in lid or "plutonium" in lid or "ficsoniun" in lid:
        return "nuclear"
    if "ficsite" in lid or "ficsonium" in lid or "sam" in lid and lid != "sam":
        return "ficsit"
    if lid.startswith("sam"):
        return "ficsit"
    if "darkmatter" in lid or "darkenergy" in lid or "timecr" in lid or "quantumosc" in lid or "singularity" in lid or "temporalproc" in lid or "quantumenergy" in lid:
        return "quantum"
    if "alien" in lid:
        return "alien"
    if lid.startswith("packaged"):
        return "packaged"
    if lid.startswith("cartridge") or lid.startswith("nobelisk") or lid.startswith("rebar") or lid.startswith("spikedrebar") or "projectile" in lid:
        return "ammo"
    if form in ("liquid", "gas"):
        return "fluid"
    if any(w in lid for w in ["modularframe", "motor", "computer", "circuitboard",
                               "highspeedconnector", "electromagneticcontrolrod",
                               "coolingdevice", "coolingsystem", "pressureconversioncube",
                               "crystaloscillator", "supercomputer"]):
        return "industrial"
    if any(w in lid for w in ["communicat", "radiocontrol"]):
        return "communication"
    return "component"


# ---------- Main extraction ----------

def main():
    docs_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_DOCS_PATH
    output_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src", "data")

    print(f"Reading: {docs_path}")
    with open(docs_path, "rb") as f:
        raw = f.read()
    data = json.loads(raw.decode("utf-16"))
    print(f"Loaded {len(data)} top-level entries")

    # ---- 1. Extract all item descriptors ----
    all_items: dict[str, dict[str, Any]] = {}
    for section in data:
        nc_type = get_native_class_name(section["NativeClass"])
        if nc_type not in ITEM_DESCRIPTOR_CLASSES:
            continue
        for cls in section.get("Classes", []):
            item_id = strip_id(cls["ClassName"], "Desc_")
            form_raw = cls.get("mForm", "RF_SOLID")
            form = FORM_MAP.get(form_raw, "solid")
            stack_raw = cls.get("mStackSize", "SS_MEDIUM")
            stack_size = STACK_SIZE_MAP.get(stack_raw, 100)
            sink_points = int(cls.get("mResourceSinkPoints", "0"))
            is_raw = nc_type == "FGResourceDescriptor"
            category = categorize_item(item_id, nc_type, form)

            all_items[item_id] = {
                "id": item_id,
                "name": cls.get("mDisplayName", item_id),
                "category": category,
                "form": form,
                "stackSize": stack_size,
                "sinkPoints": sink_points,
                "isRawResource": is_raw,
            }

    print(f"Found {len(all_items)} total item descriptors")

    # ---- 2. Extract recipes ----
    recipe_sections = [s for s in data
                       if "FGRecipe" in s["NativeClass"]
                       and "Customization" not in s["NativeClass"]]
    all_raw_recipes = recipe_sections[0]["Classes"] if recipe_sections else []
    print(f"Found {len(all_raw_recipes)} total FGRecipe entries")

    recipes: dict[str, dict[str, Any]] = {}
    items_in_recipes: set[str] = set()

    for r in all_raw_recipes:
        produced_in = r.get("mProducedIn", "")
        machine_class = extract_machine_class(produced_in)
        if not machine_class:
            continue

        # Skip event/FICSMAS recipes
        events = r.get("mRelevantEvents", "")
        cn = r["ClassName"]
        if events or "Xmas" in cn or "Fireworks" in cn:
            continue

        recipe_id = strip_id(cn, "Recipe_")
        building_id = strip_id(machine_class, "Build_")
        cycle_duration = float(r.get("mManufactoringDuration", "1"))
        is_alternate = cn.startswith("Recipe_Alternate_") or r.get("mDisplayName", "").startswith("Alternate:")

        inputs = parse_io_list(r.get("mIngredients", ""))
        outputs = parse_io_list(r.get("mProduct", ""))

        if not outputs:
            continue

        # Normalize liquid/gas amounts (game stores them in mL, we want m^3)
        for io in inputs + outputs:
            item_data = all_items.get(io["itemId"])
            if item_data and item_data["form"] in ("liquid", "gas"):
                io["amount"] = io["amount"] / 1000.0
            io["ratePerMinute"] = round(io["amount"] * (60.0 / cycle_duration), 4)
            # Clean up amount to int if whole number
            if io["amount"] == int(io["amount"]):
                io["amount"] = int(io["amount"])
            items_in_recipes.add(io["itemId"])

        primary_output_id = outputs[0]["itemId"]

        recipes[recipe_id] = {
            "id": recipe_id,
            "name": r.get("mDisplayName", recipe_id),
            "buildingId": building_id,
            "cycleDuration": cycle_duration,
            "inputs": inputs,
            "outputs": outputs,
            "primaryOutputId": primary_output_id,
            "isAlternate": is_alternate,
            "defaultRecipeId": None,  # filled in below
        }

    # Link alternate recipes to their defaults
    # Build map: primaryOutputId -> default recipe id
    default_for_output: dict[str, str] = {}
    for rid, recipe in recipes.items():
        if not recipe["isAlternate"]:
            out_id = recipe["primaryOutputId"]
            if out_id not in default_for_output:
                default_for_output[out_id] = rid

    for rid, recipe in recipes.items():
        if recipe["isAlternate"]:
            recipe["defaultRecipeId"] = default_for_output.get(recipe["primaryOutputId"])

    print(f"Extracted {len(recipes)} machine recipes ({sum(1 for r in recipes.values() if not r['isAlternate'])} default, {sum(1 for r in recipes.values() if r['isAlternate'])} alternate)")
    print(f"Items referenced in recipes: {len(items_in_recipes)}")

    # Filter items to only those referenced in recipes
    filtered_items = {k: v for k, v in all_items.items() if k in items_in_recipes}
    # Also check for missing items
    missing = items_in_recipes - set(all_items.keys())
    if missing:
        print(f"WARNING: {len(missing)} items referenced in recipes but missing descriptors: {missing}")
    print(f"Final item count: {len(filtered_items)}")

    # ---- 3. Extract buildings ----
    buildings: dict[str, dict[str, Any]] = {}

    for section in data:
        nc_type = get_native_class_name(section["NativeClass"])
        if nc_type == "FGBuildableManufacturer":
            for cls in section.get("Classes", []):
                bid = strip_id(cls["ClassName"], "Build_")
                slots = BUILDING_SLOTS.get(bid, (2, 1))
                power_mw = float(cls.get("mPowerConsumption", "0"))
                buildings[bid] = {
                    "id": bid,
                    "name": cls.get("mDisplayName", bid),
                    "power": {"mode": "constant", "baseMW": power_mw},
                    "inputSlots": slots[0],
                    "outputSlots": slots[1],
                    "canOverclock": True,
                }
        elif nc_type == "FGBuildableManufacturerVariablePower":
            for cls in section.get("Classes", []):
                bid = strip_id(cls["ClassName"], "Build_")
                slots = BUILDING_SLOTS.get(bid, (2, 1))
                min_mw = float(cls.get("mEstimatedMininumPowerConsumption", "0"))
                max_mw = float(cls.get("mEstimatedMaximumPowerConsumption", "0"))
                avg_mw = round((min_mw + max_mw) / 2)
                buildings[bid] = {
                    "id": bid,
                    "name": cls.get("mDisplayName", bid),
                    "power": {
                        "mode": "variable",
                        "baseMW": min_mw,
                        "minMW": min_mw,
                        "maxMW": max_mw,
                        "averageMW": avg_mw,
                    },
                    "inputSlots": slots[0],
                    "outputSlots": slots[1],
                    "canOverclock": True,
                }

    print(f"Extracted {len(buildings)} buildings")

    # ---- 4. Generate TypeScript files ----
    generate_items_ts(filtered_items, output_dir)
    generate_recipes_ts(recipes, output_dir)
    generate_buildings_ts(buildings, output_dir)

    print("\nDone! Generated files in", output_dir)


# ---------- TypeScript generation ----------

def ts_string(s: str) -> str:
    """Escape a string for TypeScript."""
    return json.dumps(s)


def generate_items_ts(items: dict[str, dict], output_dir: str):
    """Generate src/data/items.ts"""
    lines = [
        'import type { Item } from "../types";',
        "",
        "export const ITEMS: Record<string, Item> = {",
    ]

    # Group by category for readability
    categories_order = [
        "ore", "fluid", "ingot", "biomass", "component", "industrial",
        "communication", "space-elevator", "nuclear", "quantum", "ficsit",
        "alien", "ammo", "fuel", "packaged",
    ]
    categorized: dict[str, list] = {}
    for item in items.values():
        cat = item["category"]
        if cat not in categorized:
            categorized[cat] = []
        categorized[cat].append(item)

    for cat in categories_order:
        if cat not in categorized:
            continue
        cat_items = sorted(categorized[cat], key=lambda x: x["name"])
        lines.append(f"  // === {cat.upper().replace('-', ' ')} ===")
        for item in cat_items:
            lines.append(f"  {ts_string(item['id'])}: {{")
            lines.append(f"    id: {ts_string(item['id'])},")
            lines.append(f"    name: {ts_string(item['name'])},")
            lines.append(f"    category: {ts_string(item['category'])},")
            lines.append(f"    form: {ts_string(item['form'])},")
            lines.append(f"    stackSize: {item['stackSize']},")
            lines.append(f"    sinkPoints: {item['sinkPoints']},")
            lines.append(f"    isRawResource: {'true' if item['isRawResource'] else 'false'},")
            lines.append("  },")
        lines.append("")

    # Handle any uncategorized items
    remaining_cats = set(categorized.keys()) - set(categories_order)
    for cat in sorted(remaining_cats):
        cat_items = sorted(categorized[cat], key=lambda x: x["name"])
        lines.append(f"  // === {cat.upper()} ===")
        for item in cat_items:
            lines.append(f"  {ts_string(item['id'])}: {{")
            lines.append(f"    id: {ts_string(item['id'])},")
            lines.append(f"    name: {ts_string(item['name'])},")
            lines.append(f"    category: {ts_string(item['category'])},")
            lines.append(f"    form: {ts_string(item['form'])},")
            lines.append(f"    stackSize: {item['stackSize']},")
            lines.append(f"    sinkPoints: {item['sinkPoints']},")
            lines.append(f"    isRawResource: {'true' if item['isRawResource'] else 'false'},")
            lines.append("  },")
        lines.append("")

    lines.append("};")
    lines.append("")
    lines.append("export const ITEMS_LIST = Object.values(ITEMS);")
    lines.append("export const PRODUCIBLE_ITEMS = ITEMS_LIST.filter((i) => !i.isRawResource);")
    lines.append("")

    path = os.path.join(output_dir, "items.ts")
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"  Written: {path} ({len(items)} items)")


def format_rate(val: float) -> str:
    """Format a rate as clean number (no trailing zeros)."""
    if val == int(val):
        return str(int(val))
    # Round to 4 decimal places, strip trailing zeros
    s = f"{val:.4f}".rstrip("0").rstrip(".")
    return s


def generate_recipes_ts(recipes: dict[str, dict], output_dir: str):
    """Generate src/data/recipes.ts"""
    lines = [
        'import type { Recipe } from "../types";',
        "",
        "export const RECIPES: Record<string, Recipe> = {",
    ]

    # Group by building for readability
    building_order = [
        "SmelterMk1", "FoundryMk1", "ConstructorMk1", "AssemblerMk1",
        "ManufacturerMk1", "OilRefinery", "Packager", "Blender",
        "HadronCollider", "QuantumEncoder", "Converter",
    ]

    by_building: dict[str, list] = {}
    for recipe in recipes.values():
        bid = recipe["buildingId"]
        if bid not in by_building:
            by_building[bid] = []
        by_building[bid].append(recipe)

    for bid in building_order:
        if bid not in by_building:
            continue
        building_recipes = sorted(by_building[bid], key=lambda r: (r["isAlternate"], r["name"]))
        default_recipes = [r for r in building_recipes if not r["isAlternate"]]
        alt_recipes = [r for r in building_recipes if r["isAlternate"]]

        if default_recipes:
            lines.append(f"  // === {bid} (Default) ===")
            for recipe in default_recipes:
                write_recipe(lines, recipe)
            lines.append("")

        if alt_recipes:
            lines.append(f"  // === {bid} (Alternate) ===")
            for recipe in alt_recipes:
                write_recipe(lines, recipe)
            lines.append("")

    # Handle any buildings not in the order
    remaining = set(by_building.keys()) - set(building_order)
    for bid in sorted(remaining):
        building_recipes = sorted(by_building[bid], key=lambda r: (r["isAlternate"], r["name"]))
        lines.append(f"  // === {bid} ===")
        for recipe in building_recipes:
            write_recipe(lines, recipe)
        lines.append("")

    lines.append("};")
    lines.append("")
    lines.append("// Derived lookups")
    lines.append("export const RECIPES_LIST = Object.values(RECIPES);")
    lines.append("")
    lines.append("export const RECIPES_BY_OUTPUT: Record<string, Recipe[]> = {};")
    lines.append("for (const recipe of RECIPES_LIST) {")
    lines.append("  for (const output of recipe.outputs) {")
    lines.append("    if (!RECIPES_BY_OUTPUT[output.itemId]) {")
    lines.append("      RECIPES_BY_OUTPUT[output.itemId] = [];")
    lines.append("    }")
    lines.append("    RECIPES_BY_OUTPUT[output.itemId].push(recipe);")
    lines.append("  }")
    lines.append("}")
    lines.append("")
    lines.append("export const DEFAULT_RECIPE_FOR_ITEM: Record<string, Recipe> = {};")
    lines.append("for (const recipe of RECIPES_LIST) {")
    lines.append("  if (!recipe.isAlternate) {")
    lines.append("    DEFAULT_RECIPE_FOR_ITEM[recipe.primaryOutputId] = recipe;")
    lines.append("  }")
    lines.append("}")
    lines.append("")

    path = os.path.join(output_dir, "recipes.ts")
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"  Written: {path} ({len(recipes)} recipes)")


def write_recipe(lines: list[str], recipe: dict):
    """Write a single recipe entry."""
    rid = recipe["id"]
    lines.append(f"  {ts_string(rid)}: {{")
    lines.append(f"    id: {ts_string(rid)},")
    lines.append(f"    name: {ts_string(recipe['name'])},")
    lines.append(f"    buildingId: {ts_string(recipe['buildingId'])},")

    # cycleDuration - format cleanly
    cd = recipe["cycleDuration"]
    cd_str = str(int(cd)) if cd == int(cd) else str(cd)
    lines.append(f"    cycleDuration: {cd_str},")

    # Inputs
    if len(recipe["inputs"]) == 1:
        io = recipe["inputs"][0]
        lines.append(f"    inputs: [{{ itemId: {ts_string(io['itemId'])}, amount: {io['amount']}, ratePerMinute: {format_rate(io['ratePerMinute'])} }}],")
    else:
        lines.append("    inputs: [")
        for io in recipe["inputs"]:
            lines.append(f"      {{ itemId: {ts_string(io['itemId'])}, amount: {io['amount']}, ratePerMinute: {format_rate(io['ratePerMinute'])} }},")
        lines.append("    ],")

    # Outputs
    if len(recipe["outputs"]) == 1:
        io = recipe["outputs"][0]
        lines.append(f"    outputs: [{{ itemId: {ts_string(io['itemId'])}, amount: {io['amount']}, ratePerMinute: {format_rate(io['ratePerMinute'])} }}],")
    else:
        lines.append("    outputs: [")
        for io in recipe["outputs"]:
            lines.append(f"      {{ itemId: {ts_string(io['itemId'])}, amount: {io['amount']}, ratePerMinute: {format_rate(io['ratePerMinute'])} }},")
        lines.append("    ],")

    lines.append(f"    primaryOutputId: {ts_string(recipe['primaryOutputId'])},")
    lines.append(f"    isAlternate: {'true' if recipe['isAlternate'] else 'false'},")

    default_id = recipe["defaultRecipeId"]
    if default_id:
        lines.append(f"    defaultRecipeId: {ts_string(default_id)},")
    else:
        lines.append("    defaultRecipeId: null,")

    lines.append("  },")


def generate_buildings_ts(buildings: dict[str, dict], output_dir: str):
    """Generate src/data/buildings.ts"""
    lines = [
        'import type { Building } from "../types";',
        "",
        "export const BUILDINGS = {",
    ]

    # Order: constant power first, then variable
    constant = [(k, v) for k, v in buildings.items() if v["power"]["mode"] == "constant"]
    variable = [(k, v) for k, v in buildings.items() if v["power"]["mode"] == "variable"]

    for bid, b in sorted(constant, key=lambda x: x[1]["name"]):
        p = b["power"]
        base = int(p["baseMW"]) if p["baseMW"] == int(p["baseMW"]) else p["baseMW"]
        lines.append(f"  {ts_string(bid)}: {{")
        lines.append(f"    id: {ts_string(bid)},")
        lines.append(f"    name: {ts_string(b['name'])},")
        lines.append(f"    power: {{ mode: \"constant\", baseMW: {base} }},")
        lines.append(f"    inputSlots: {b['inputSlots']},")
        lines.append(f"    outputSlots: {b['outputSlots']},")
        lines.append(f"    canOverclock: true,")
        lines.append("  },")

    for bid, b in sorted(variable, key=lambda x: x[1]["name"]):
        p = b["power"]
        base = int(p["baseMW"]) if p["baseMW"] == int(p["baseMW"]) else p["baseMW"]
        min_mw = int(p["minMW"]) if p["minMW"] == int(p["minMW"]) else p["minMW"]
        max_mw = int(p["maxMW"]) if p["maxMW"] == int(p["maxMW"]) else p["maxMW"]
        avg_mw = int(p["averageMW"]) if p["averageMW"] == int(p["averageMW"]) else p["averageMW"]
        lines.append(f"  {ts_string(bid)}: {{")
        lines.append(f"    id: {ts_string(bid)},")
        lines.append(f"    name: {ts_string(b['name'])},")
        lines.append("    power: {")
        lines.append(f"      mode: \"variable\",")
        lines.append(f"      baseMW: {base},")
        lines.append(f"      minMW: {min_mw},")
        lines.append(f"      maxMW: {max_mw},")
        lines.append(f"      averageMW: {avg_mw},")
        lines.append("    },")
        lines.append(f"    inputSlots: {b['inputSlots']},")
        lines.append(f"    outputSlots: {b['outputSlots']},")
        lines.append(f"    canOverclock: true,")
        lines.append("  },")

    lines.append("} as const satisfies Record<string, Building>;")
    lines.append("")

    path = os.path.join(output_dir, "buildings.ts")
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"  Written: {path} ({len(buildings)} buildings)")


if __name__ == "__main__":
    main()
