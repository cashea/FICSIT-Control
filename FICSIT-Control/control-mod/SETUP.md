# FICSIT Control Mod — Build Setup

## Prerequisites

You need these installed before building the mod:

### 1. Visual Studio 2022 Community (Free)
- Download: https://visualstudio.microsoft.com/downloads/
- Required workloads:
  - "Desktop development with C++"
  - "Game development with C++"
- Required individual components:
  - MSVC v143 (VS 2022 C++ x64/x86 build tools)
  - .NET 6.0 Runtime
  - .NET Framework 4.8.1 SDK

### 2. Custom Unreal Engine 5.3.2-CSS
- **First**: Link your GitHub to Epic Games at https://linker.ficsit.app/link
- **Then**: Download from https://github.com/satisfactorymodding/UnrealEngine/releases/latest
  - Download the .exe installer + both .bin files
  - Run the installer
  - ~30 GB disk space required

### 3. Wwise 2023.1.3.8471
- Download the Audiokinetic Launcher: https://www.audiokinetic.com/en/download/ (free account)
- In version dropdown, select "All" and pick **2023.1.3.8471** exactly
- Install packages: Authoring, SDK (C++)
- Install platforms: Visual Studio 2019 & 2022, Linux, Game Core

### 4. SatisfactoryModLoader (Already Cloned)
- Located at: `d:/Coding/Gaming/Satisfactory/SatisfactoryModLoader/`
- Our mod is already in: `Mods/FICSITControl/`

## Build Steps

### First-Time Setup

1. **Integrate Wwise** into the starter project:
   - Open Audiokinetic Launcher
   - Go to "Unreal Engine" tab
   - Click "Integrate Wwise into Project..."
   - Select `SatisfactoryModLoader/FactoryGame.uproject`
   - Use Wwise version 2023.1.3.8471

2. **Generate VS project files**:
   - Right-click `FactoryGame.uproject` → "Generate Visual Studio project files"
   - (Must use the custom UE 5.3.2-CSS context menu)

3. **Build the project**:
   - Open `FactoryGame.sln` in Visual Studio 2022
   - Set configuration to `Development Editor | Win64`
   - Set startup project to `FactoryGame`
   - Build (F7) — first build takes 10-20 minutes

### Opening the Editor

- Double-click `FactoryGame.uproject` to open in the custom UE editor
- First launch compiles shaders (can take 10-30 minutes)

### Creating the GameWorldModule Blueprint

The mod needs a `RootGameWorld_FICSITControl` Blueprint for SML to discover it:

1. In the editor, browse to `Mods/FICSITControl/Content/`
2. Right-click → Blueprint Class → search for `GameWorldModule` → select it
3. Name it `RootGameWorld_FICSITControl`
4. Open it, go to Details → check **Root Module**
5. In the **ModSubsystems** array, add `AControlSubsystem`
6. Compile and save

### Packaging with Alpakit

1. In the editor toolbar, click the **Alpakit** (alpaca icon)
2. Under "Dev Packaging Settings":
   - Enable **Windows**
   - Enable **Copy to Game Path** → set your Satisfactory install directory
3. Select `FICSITControl` in the mod list
4. Click **Alpakit!**

### Testing

1. Alpakit copies the mod to your Satisfactory `Mods/` folder
2. Launch Satisfactory (SML will load the mod)
3. Edit `Config/FICSITControl.ini` in the mod folder to set your auth token
4. Start the FICSIT-Control web app
5. Connect to `localhost:9090` with your token

## Project Structure

```
Mods/FICSITControl/
├── FICSITControl.uplugin          # Plugin metadata
├── Config/FICSITControl.ini       # Runtime configuration
├── Content/                       # Blueprint assets (created in editor)
│   └── RootGameWorld_FICSITControl.uasset
└── Source/FICSITControl/
    ├── FICSITControl.Build.cs     # Build rules (C#)
    ├── Public/                    # Headers exposed to other modules
    │   ├── FICSITControlModule.h
    │   ├── ControlSubsystem.h
    │   ├── Auth/TokenAuth.h
    │   ├── Config/ControlConfig.h
    │   └── Models/ControlModels.h
    └── Private/                   # Implementation files
        ├── FICSITControlModule.cpp
        ├── ControlSubsystem.cpp
        ├── ControlConfig.cpp
        ├── ControlModels.cpp
        ├── TokenAuth.cpp
        ├── Commands/              # Command executors
        ├── Http/                  # HTTP server
        ├── WebSocket/             # WS server
        └── Util/                  # Building resolver
```
