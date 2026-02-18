import { Loader2 } from "lucide-react";

export function TabLoadingFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-[var(--color-satisfactory-orange)]" />
    </div>
  );
}
