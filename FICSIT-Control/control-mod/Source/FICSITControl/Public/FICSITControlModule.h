#pragma once

#include "Modules/ModuleManager.h"

class FICSITCONTROL_API FFICSITControlModule : public FDefaultGameModuleImpl {
public:
	virtual void StartupModule() override;
	virtual void ShutdownModule() override;
};
