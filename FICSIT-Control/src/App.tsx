import { useEffect } from "react";
import { Header } from "./components/layout/Header";
import { TabNav } from "./components/layout/TabNav";
import { ConnectionSetup } from "./components/connection/ConnectionSetup";
import { FactoryStatus } from "./components/status/FactoryStatus";
import { PowerDashboard } from "./components/dashboard/PowerDashboard";
import { ProductionDashboard } from "./components/dashboard/ProductionDashboard";
import { InventoryPanel } from "./components/dashboard/InventoryPanel";
import { AIChat } from "./components/ai/AIChat";
import { PlannerView } from "./components/planner/PlannerView";
import { AssetsView } from "./components/assets/AssetsView";
import { PowerGridView } from "./components/power/PowerGridView";
import { useUIStore } from "./stores/ui-store";

function DashboardView() {
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

function RecipesView() {
  return (
    <div className="p-6 text-center text-[var(--color-satisfactory-text-dim)]">
      Recipe Browser — coming in Phase 5
    </div>
  );
}

function App() {
  const { activeTab } = useUIStore();

  useEffect(() => {
    navigator.clipboard.writeText("/frm http start").catch(() => {});
  }, []);

  return (
    <div className="h-screen flex flex-col bg-[var(--color-satisfactory-dark)]">
      <Header />
      <TabNav />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 p-4 border-r border-[var(--color-satisfactory-border)] bg-[var(--color-satisfactory-dark)] overflow-y-auto shrink-0">
          <ConnectionSetup />
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto min-h-0">
          {activeTab === "ai" ? (
            <AIChat />
          ) : (
            <div className="p-6">
              {activeTab === "status" && <FactoryStatus />}
              {activeTab === "assets" && <AssetsView />}
              {activeTab === "dashboard" && <DashboardView />}
              {activeTab === "power" && <PowerGridView />}
              {activeTab === "planner" && <PlannerView />}
              {activeTab === "recipes" && <RecipesView />}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
