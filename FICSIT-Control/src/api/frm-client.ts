import type { z } from "zod";
import type {
  FRMPowerCircuit,
  FRMProdStat,
  FRMStorageContainer,
  FRMMachine,
  FRMPlayer,
  FRMGenerator,
  FRMBelt,
  FRMCable,
  FRMSwitch,
  FRMRecipe,
} from "../types";
import {
  PowerCircuitArraySchema,
  ProdStatArraySchema,
  StorageContainerArraySchema,
  MachineArraySchema,
  PlayerArraySchema,
  GeneratorArraySchema,
  BeltArraySchema,
  CableArraySchema,
  SwitchArraySchema,
  RecipeArraySchema,
} from "./frm-schemas";

export type FRMEndpoint =
  | "getPower"
  | "getProdStats"
  | "getStorageInv"
  | "getWorldInv"
  | "getAssembler"
  | "getSmelter"
  | "getConstructor"
  | "getRefinery"
  | "getManufacturer"
  | "getFoundry"
  | "getBlender"
  | "getPackager"
  | "getParticleAccelerator"
  | "getBelts"
  | "getPipes"
  | "getPlayer"
  | "getRecipes"
  | "getSessionInfo"
  | "getGenerators"
  | "getCables"
  | "getSwitches";

export type FRMEventHandler = (endpoint: FRMEndpoint, data: unknown) => void;

export class FRMClient {
  private ws: WebSocket | null = null;
  private baseUrl: string;
  private subscriptions: Set<FRMEndpoint> = new Set();
  private handlers: Set<FRMEventHandler> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private shouldReconnect = false;

  constructor(host: string = "localhost", port: number = 8080) {
    this.baseUrl = `${host}:${port}`;
  }

  get httpUrl(): string {
    return `http://${this.baseUrl}`;
  }

  get wsUrl(): string {
    return `ws://${this.baseUrl}`;
  }

  onData(handler: FRMEventHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  private emit(endpoint: FRMEndpoint, data: unknown) {
    for (const handler of this.handlers) {
      handler(endpoint, data);
    }
  }

  async connect(): Promise<void> {
    this.shouldReconnect = true;
    this.reconnectAttempts = 0;
    return this.createWebSocket();
  }

  private createWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsUrl);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          // Re-subscribe to any previously active subscriptions
          if (this.subscriptions.size > 0) {
            this.sendSubscription();
          }
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            // FRM sends messages with endpoint identification
            // The format varies — try to detect the endpoint from the data shape
            this.handleMessage(data);
          } catch {
            // Ignore malformed messages
          }
        };

        this.ws.onclose = () => {
          this.ws = null;
          if (this.shouldReconnect) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = () => {
          if (this.reconnectAttempts === 0) {
            reject(new Error(`Failed to connect to FRM at ${this.wsUrl}`));
          }
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  private handleMessage(data: unknown) {
    // FRM WebSocket pushes data for each subscribed endpoint
    // We need to identify which endpoint this data belongs to
    if (!Array.isArray(data) && typeof data === "object" && data !== null) {
      // Single object responses — wrap in array for uniform handling
      const obj = data as Record<string, unknown>;
      if ("CircuitGroupID" in obj && "PowerProduction" in obj) {
        const parsed = PowerCircuitArraySchema.safeParse([obj]);
        if (parsed.success) this.emit("getPower", parsed.data);
        return;
      }
    }

    if (Array.isArray(data) && data.length > 0) {
      const first = data[0];
      if ("PowerProduction" in first) {
        const parsed = PowerCircuitArraySchema.safeParse(data);
        if (parsed.success) this.emit("getPower", parsed.data);
      } else if ("ProdPerMin" in first) {
        const parsed = ProdStatArraySchema.safeParse(data);
        if (parsed.success) this.emit("getProdStats", parsed.data);
      } else if ("Inventory" in first) {
        const parsed = StorageContainerArraySchema.safeParse(data);
        if (parsed.success) this.emit("getStorageInv", parsed.data);
      } else if ("RegulatedDemandProd" in first) {
        const parsed = GeneratorArraySchema.safeParse(data);
        if (parsed.success) this.emit("getGenerators", parsed.data);
      } else if ("IsProducing" in first) {
        // Machine data — can't determine specific type from WS payload shape alone,
        // so skip emitting here. REST polling handles per-type machine data correctly.
      } else if ("PlayerHP" in first) {
        const parsed = PlayerArraySchema.safeParse(data);
        if (parsed.success) this.emit("getPlayer", parsed.data);
      } else if ("ItemsPerMinute" in first) {
        const parsed = BeltArraySchema.safeParse(data);
        if (parsed.success) this.emit("getBelts", parsed.data);
      } else if ("location0" in first && "location1" in first) {
        const parsed = CableArraySchema.safeParse(data);
        if (parsed.success) this.emit("getCables", parsed.data);
      } else if ("SwitchTag" in first || ("Primary" in first && "Secondary" in first)) {
        const parsed = SwitchArraySchema.safeParse(data);
        if (parsed.success) this.emit("getSwitches", parsed.data);
      }
    }
  }

  subscribe(endpoints: FRMEndpoint[]) {
    for (const ep of endpoints) {
      this.subscriptions.add(ep);
    }
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendSubscription();
    }
  }

  unsubscribe(endpoints: FRMEndpoint[]) {
    for (const ep of endpoints) {
      this.subscriptions.delete(ep);
    }
  }

  private sendSubscription() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        action: "subscribe",
        endpoints: Array.from(this.subscriptions),
      })
    );
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.shouldReconnect = false;
      return;
    }
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.createWebSocket().catch(() => {
        // Will retry via onclose
      });
    }, delay);
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
    this.handlers.clear();
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // REST fallback methods for one-off queries

  private async fetchEndpoint<T>(endpoint: FRMEndpoint, schema: z.ZodType<T>): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(`${this.httpUrl}/${endpoint}`, {
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`FRM request failed: ${response.status} ${response.statusText}`);
      }
      const json: unknown = await response.json();
      return schema.parse(json);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new Error(`FRM request to ${endpoint} timed out after 8s`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async getPower(): Promise<FRMPowerCircuit[]> {
    return this.fetchEndpoint("getPower", PowerCircuitArraySchema);
  }

  async getProdStats(): Promise<FRMProdStat[]> {
    return this.fetchEndpoint("getProdStats", ProdStatArraySchema);
  }

  async getStorageInv(): Promise<FRMStorageContainer[]> {
    return this.fetchEndpoint("getStorageInv", StorageContainerArraySchema);
  }

  async getMachines(
    type: "getAssembler" | "getSmelter" | "getConstructor" | "getRefinery" | "getManufacturer" | "getFoundry" | "getBlender" | "getPackager"
  ): Promise<FRMMachine[]> {
    return this.fetchEndpoint(type, MachineArraySchema);
  }

  async getPlayer(): Promise<FRMPlayer[]> {
    return this.fetchEndpoint("getPlayer", PlayerArraySchema);
  }

  async getGenerators(): Promise<FRMGenerator[]> {
    return this.fetchEndpoint("getGenerators", GeneratorArraySchema);
  }

  async getCables(): Promise<FRMCable[]> {
    return this.fetchEndpoint("getCables", CableArraySchema);
  }

  async getSwitches(): Promise<FRMSwitch[]> {
    return this.fetchEndpoint("getSwitches", SwitchArraySchema);
  }

  async getBelts(): Promise<FRMBelt[]> {
    return this.fetchEndpoint("getBelts", BeltArraySchema);
  }

  async getRecipes(): Promise<FRMRecipe[]> {
    return this.fetchEndpoint("getRecipes", RecipeArraySchema);
  }
}
