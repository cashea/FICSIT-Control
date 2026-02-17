#include "FICSITControlModule.h"

DEFINE_LOG_CATEGORY_STATIC(LogFICSITControl, Log, All);

void FFICSITControlModule::StartupModule() {
	UE_LOG(LogFICSITControl, Log, TEXT("FICSIT Control module starting up"));
}

void FFICSITControlModule::ShutdownModule() {
	UE_LOG(LogFICSITControl, Log, TEXT("FICSIT Control module shutting down"));
}

IMPLEMENT_GAME_MODULE(FFICSITControlModule, FICSITControl);
