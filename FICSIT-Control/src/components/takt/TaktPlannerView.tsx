import { Timer } from "lucide-react";
import { TaktPlanList } from "./TaktPlanList";
import { TaktPlanEditor } from "./TaktPlanEditor";

export function TaktPlannerView() {
  return (
    <div className="flex flex-col h-full min-h-0">
      <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 shrink-0">
        <Timer className="w-5 h-5 text-[var(--color-satisfactory-orange)]" />
        Takt Time Planner
      </h2>

      <div className="flex flex-1 gap-4 min-h-0">
        {/* Plan List Sidebar */}
        <div className="w-64 shrink-0 overflow-y-auto">
          <TaktPlanList />
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 border-l border-[var(--color-satisfactory-border)] pl-4">
          <TaktPlanEditor />
        </div>
      </div>
    </div>
  );
}

export default TaktPlannerView;
