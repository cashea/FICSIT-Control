import { useState } from "react";
import { Plug, Unplug, Loader2 } from "lucide-react";
import { useConnectionStore } from "../../stores/connection-store";

export function ConnectionSetup() {
  const { host, port, status, error, setHost, setPort, connect, disconnect } =
    useConnectionStore();
  const [localHost, setLocalHost] = useState(host);
  const [localPort, setLocalPort] = useState(port.toString());

  const handleConnect = async () => {
    setHost(localHost);
    setPort(parseInt(localPort, 10) || 8080);
    await connect();
  };

  const isConnecting = status === "connecting";
  const isConnected = status === "connected";

  return (
    <div className="p-4 bg-[var(--color-satisfactory-panel)] rounded-lg border border-[var(--color-satisfactory-border)]">
      <h3 className="text-sm font-semibold mb-3 text-[var(--color-satisfactory-text)]">
        FRM Connection
      </h3>
      <p className="text-xs text-[var(--color-satisfactory-text-dim)] mb-3">
        Connect to FICSIT Remote Monitoring mod. Start FRM in-game with{" "}
        <code className="bg-[var(--color-satisfactory-dark)] px-1 rounded">
          /frm http start
        </code>
      </p>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={localHost}
          onChange={(e) => setLocalHost(e.target.value)}
          placeholder="localhost"
          disabled={isConnected || isConnecting}
          className="flex-1 px-3 py-1.5 text-sm bg-[var(--color-satisfactory-dark)] border border-[var(--color-satisfactory-border)] rounded text-[var(--color-satisfactory-text)] placeholder:text-[var(--color-satisfactory-text-dim)] disabled:opacity-50"
        />
        <input
          type="text"
          value={localPort}
          onChange={(e) => setLocalPort(e.target.value)}
          placeholder="8080"
          disabled={isConnected || isConnecting}
          className="w-20 px-3 py-1.5 text-sm bg-[var(--color-satisfactory-dark)] border border-[var(--color-satisfactory-border)] rounded text-[var(--color-satisfactory-text)] placeholder:text-[var(--color-satisfactory-text-dim)] disabled:opacity-50"
        />
      </div>

      {isConnected ? (
        <button
          onClick={disconnect}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-[var(--color-disconnected)]/20 text-[var(--color-disconnected)] border border-[var(--color-disconnected)]/30 rounded hover:bg-[var(--color-disconnected)]/30 transition-colors"
        >
          <Unplug className="w-4 h-4" />
          Disconnect
        </button>
      ) : (
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-[var(--color-satisfactory-orange)]/20 text-[var(--color-satisfactory-orange)] border border-[var(--color-satisfactory-orange)]/30 rounded hover:bg-[var(--color-satisfactory-orange)]/30 transition-colors disabled:opacity-50"
        >
          {isConnecting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plug className="w-4 h-4" />
          )}
          {isConnecting ? "Connecting..." : "Connect"}
        </button>
      )}

      {error && (
        <p className="mt-2 text-xs text-[var(--color-disconnected)]">{error}</p>
      )}
    </div>
  );
}
