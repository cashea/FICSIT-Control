import { lazy, Suspense, useEffect } from "react";
import { Header } from "./components/layout/Header";
import { TabNav } from "./components/layout/TabNav";
import { TabLoadingFallback } from "./components/layout/TabLoadingFallback";
import { ConnectionSetup } from "./components/connection/ConnectionSetup";
import { FactoryStatus } from "./components/status/FactoryStatus";
import { useUIStore } from "./stores/ui-store";

const AssetsView = lazy(() => import("./components/assets/AssetsView"));
const DashboardView = lazy(() => import("./components/dashboard/DashboardView"));
const PowerGridView = lazy(() => import("./components/power/PowerGridView"));
const OneLineDiagramView = lazy(() => import("./components/sld/OneLineDiagramView"));
const PlannerView = lazy(() => import("./components/planner/PlannerView"));
const AIChat = lazy(() => import("./components/ai/AIChat"));

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
        <main className="flex-1 flex flex-col overflow-hidden min-h-0 min-w-0">
          <Suspense fallback={<TabLoadingFallback />}>
            {activeTab === "ai" ? (
              <AIChat />
            ) : (
              <div className="flex-1 flex flex-col min-h-0 min-w-0 p-6">
                {activeTab === "status" && <FactoryStatus />}
                {activeTab === "assets" && <AssetsView />}
                {activeTab === "dashboard" && <DashboardView />}
                {activeTab === "power" && <PowerGridView />}
                {activeTab === "oneline" && <OneLineDiagramView />}
                {activeTab === "planner" && <PlannerView />}
                {activeTab === "recipes" && <RecipesView />}
              </div>
            )}
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default App;
