import { PowerDashboard } from "./PowerDashboard";
import { ProductionDashboard } from "./ProductionDashboard";
import { InventoryPanel } from "./InventoryPanel";

export default function DashboardView() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <PowerDashboard />
      <ProductionDashboard />
      <div className="lg:col-span-2">
        <InventoryPanel />
      </div>
    </div>
  );
}
