import { LayoutDashboard, Calculator, BookOpen, Activity, Bot, Warehouse, Package, Zap, Network, Timer, Star } from "lucide-react";
import { useUIStore, type ActiveTab } from "../../stores/ui-store";

const tabs: Array<{ id: ActiveTab; label: string; icon: typeof LayoutDashboard }> = [
  { id: "status", label: "Factory Status", icon: Activity },
  { id: "assets", label: "Assets", icon: Warehouse },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "power", label: "Power Grid", icon: Zap },
  { id: "oneline", label: "One-Line", icon: Network },
  { id: "planner", label: "Planner", icon: Calculator },
  { id: "takt", label: "Takt Time", icon: Timer },
  { id: "recipes", label: "Recipes", icon: BookOpen },
  { id: "favorites", label: "Favorites", icon: Star },
  { id: "ai", label: "AI", icon: Bot },
];

export function TabNav() {
  const { activeTab, setActiveTab } = useUIStore();

  return (
    <nav className="flex border-b border-[var(--color-satisfactory-border)] bg-[var(--color-satisfactory-panel)]">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setActiveTab(id)}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
            activeTab === id
              ? "border-[var(--color-satisfactory-orange)] text-[var(--color-satisfactory-orange)]"
              : "border-transparent text-[var(--color-satisfactory-text-dim)] hover:text-[var(--color-satisfactory-text)]"
          }`}
        >
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}
    </nav>
  );
}
