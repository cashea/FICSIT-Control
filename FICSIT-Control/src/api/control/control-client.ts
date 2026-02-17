import type { z } from "zod";
import type { CapabilitiesResponse, CommandResponse, CommandStatusEvent, CommandType } from "../../types/control";
import { CapabilitiesResponseSchema, CommandResponseSchema, CommandStatusEventSchema } from "./control-schemas";

export type ControlEventHandler = (event: CommandStatusEvent) => void;

export class ControlClient {
  private ws: WebSocket | null = null;
  private baseUrl: string;
  private token: string;
  private handlers: Set<ControlEventHandler> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private shouldReconnect = false;

  constructor(host: string, port: number, token: string) {
    this.baseUrl = `${host}:${port}`;
    this.token = token;
  }

  get httpUrl(): string {
    return `http://${this.baseUrl}`;
  }

  get wsUrl(): string {
    return `ws://${this.baseUrl}`;
  }

  // --- REST methods ---

  async fetchCapabilities(): Promise<CapabilitiesResponse> {
    return this.getEndpoint("/control/v1/capabilities", CapabilitiesResponseSchema, false);
  }

  async submitCommand(request: {
    idempotencyKey: string;
    type: CommandType;
    payload: unknown;
  }): Promise<CommandResponse> {
    return this.postEndpoint("/control/v1/commands", request, CommandResponseSchema);
  }

  async getCommandStatus(commandId: string): Promise<CommandResponse> {
    return this.getEndpoint(`/control/v1/commands/${commandId}`, CommandResponseSchema, true);
  }

  // --- Private REST helpers ---

  private async getEndpoint<T>(path: string, schema: z.ZodType<T>, auth: boolean): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
      const headers: Record<string, string> = {};
      if (auth) headers["Authorization"] = `Bearer ${this.token}`;
      const response = await fetch(`${this.httpUrl}${path}`, {
        signal: controller.signal,
        headers,
      });
      if (response.status === 401) {
        throw new Error("Authentication failed: invalid token");
      }
      if (!response.ok) {
        throw new Error(`Control request failed: ${response.status} ${response.statusText}`);
      }
      const json: unknown = await response.json();
      return schema.parse(json);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new Error(`Control request to ${path} timed out after 8s`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async postEndpoint<T>(path: string, body: unknown, schema: z.ZodType<T>): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(`${this.httpUrl}${path}`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.token}`,
        },
        body: JSON.stringify(body),
      });
      if (response.status === 401) {
        throw new Error("Authentication failed: invalid token");
      }
      if (!response.ok) {
        throw new Error(`Control request failed: ${response.status} ${response.statusText}`);
      }
      const json: unknown = await response.json();
      return schema.parse(json);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new Error(`Control request to ${path} timed out after 8s`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // --- WebSocket for event streaming ---

  async connectStream(): Promise<void> {
    this.shouldReconnect = true;
    this.reconnectAttempts = 0;
    return this.createWebSocket();
  }

  private createWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const url = `${this.wsUrl}/control/v1/stream?token=${encodeURIComponent(this.token)}`;
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data as string);
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
            reject(new Error("Failed to connect control stream"));
          }
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  private handleMessage(data: unknown) {
    const parsed = CommandStatusEventSchema.safeParse(data);
    if (parsed.success) {
      for (const handler of this.handlers) {
        handler(parsed.data);
      }
    }
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

  onEvent(handler: ControlEventHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
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
    this.handlers.clear();
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
