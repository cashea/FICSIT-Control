import { PowerDashboard } from "./PowerDashboard";
import { ProductionDashboard } from "./ProductionDashboard";
import { InventoryPanel } from "./InventoryPanel";

export default function DashboardView() {
  return (
    <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto lg:overflow-hidden lg:grid-rows-[1fr_auto]">
      <div className="min-h-0 lg:overflow-y-auto">
        <PowerDashboard />
      </div>
      <div className="min-h-0 lg:overflow-y-auto">
        <ProductionDashboard />
      </div>
      <div className="lg:col-span-2 min-h-0 lg:overflow-y-auto">
        <InventoryPanel />
      </div>
    </div>
  );
}
