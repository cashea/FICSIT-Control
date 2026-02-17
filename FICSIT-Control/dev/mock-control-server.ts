/**
 * Mock Control Server for development/testing.
 * Simulates the SML companion mod's REST + WebSocket API.
 *
 * Usage: npx tsx dev/mock-control-server.ts
 * Default port: 9090
 */

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { WebSocketServer, WebSocket } from "ws";

const PORT = Number(process.env.PORT ?? 9090);
const TOKEN = process.env.TOKEN ?? "test";

// -- In-memory state --

interface StoredCommand {
  commandId: string;
  idempotencyKey: string;
  type: string;
  payload: unknown;
  status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED";
  result: unknown | null;
  error: string | null;
}

const commands = new Map<string, StoredCommand>();
const idempotencyIndex = new Map<string, string>(); // idempotencyKey -> commandId
const wsClients = new Set<WebSocket>();

const CAPABILITIES = {
  version: "1.0.0",
  features: {
    resetFuse: true,
    toggleGeneratorGroup: true,
    toggleBuilding: true,
    setRecipe: true,
    setOverclock: true,
  },
  limits: {
    commandsPerSecond: 5,
  },
};

// -- Helpers --

function generateId(): string {
  return `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function broadcast(msg: object) {
  const json = JSON.stringify(msg);
  for (const ws of wsClients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(json);
    }
  }
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk: Buffer) => (body += chunk.toString()));
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function json(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  });
  res.end(JSON.stringify(data));
}

function checkAuth(req: IncomingMessage): boolean {
  const auth = req.headers.authorization;
  if (!auth) return false;
  const parts = auth.split(" ");
  return parts[0] === "Bearer" && parts[1] === TOKEN;
}

// -- Simulate async command execution --

function simulateExecution(cmd: StoredCommand) {
  // QUEUED -> RUNNING after 200ms
  setTimeout(() => {
    cmd.status = "RUNNING";
    broadcast({ event: "COMMAND_STATUS", commandId: cmd.commandId, status: "RUNNING", result: null, error: null });

    // RUNNING -> SUCCEEDED after 300ms
    setTimeout(() => {
      cmd.status = "SUCCEEDED";
      cmd.result = { message: `${cmd.type} executed successfully` };
      broadcast({
        event: "COMMAND_STATUS",
        commandId: cmd.commandId,
        status: "SUCCEEDED",
        result: cmd.result,
        error: null,
      });
    }, 300);
  }, 200);
}

// -- HTTP Server --

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  // CORS preflight
  if (req.method === "OPTIONS") {
    json(res, 204, null);
    return;
  }

  // GET /control/v1/capabilities (no auth)
  if (req.method === "GET" && url.pathname === "/control/v1/capabilities") {
    json(res, 200, CAPABILITIES);
    return;
  }

  // POST /control/v1/commands (auth required)
  if (req.method === "POST" && url.pathname === "/control/v1/commands") {
    if (!checkAuth(req)) {
      json(res, 401, { error: "Unauthorized" });
      return;
    }

    const body = await readBody(req);
    let parsed: { idempotencyKey?: string; type?: string; payload?: unknown };
    try {
      parsed = JSON.parse(body);
    } catch {
      json(res, 400, { error: "Invalid JSON" });
      return;
    }

    if (!parsed.idempotencyKey || !parsed.type) {
      json(res, 400, { error: "Missing required fields: idempotencyKey, type" });
      return;
    }

    // Idempotency check
    const existingId = idempotencyIndex.get(parsed.idempotencyKey);
    if (existingId) {
      const existing = commands.get(existingId)!;
      json(res, 200, { commandId: existing.commandId, status: existing.status });
      return;
    }

    const cmd: StoredCommand = {
      commandId: generateId(),
      idempotencyKey: parsed.idempotencyKey,
      type: parsed.type,
      payload: parsed.payload ?? null,
      status: "QUEUED",
      result: null,
      error: null,
    };

    commands.set(cmd.commandId, cmd);
    idempotencyIndex.set(cmd.idempotencyKey, cmd.commandId);

    json(res, 202, { commandId: cmd.commandId, status: "QUEUED" });
    simulateExecution(cmd);
    return;
  }

  // GET /control/v1/commands/:id (auth required)
  const cmdMatch = url.pathname.match(/^\/control\/v1\/commands\/(.+)$/);
  if (req.method === "GET" && cmdMatch) {
    if (!checkAuth(req)) {
      json(res, 401, { error: "Unauthorized" });
      return;
    }

    const cmd = commands.get(cmdMatch[1]);
    if (!cmd) {
      json(res, 404, { error: "Command not found" });
      return;
    }

    json(res, 200, {
      commandId: cmd.commandId,
      status: cmd.status,
      result: cmd.result,
      error: cmd.error,
    });
    return;
  }

  json(res, 404, { error: "Not found" });
});

// -- WebSocket Server --

const wss = new WebSocketServer({ server, path: "/control/v1/stream" });

wss.on("connection", (ws, req) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const wsToken = url.searchParams.get("token");

  if (wsToken !== TOKEN) {
    ws.close(4001, "Unauthorized");
    return;
  }

  wsClients.add(ws);
  console.log(`[WS] Client connected (total: ${wsClients.size})`);

  ws.on("close", () => {
    wsClients.delete(ws);
    console.log(`[WS] Client disconnected (total: ${wsClients.size})`);
  });
});

// -- Start --

server.listen(PORT, () => {
  console.log(`Mock Control Server running on http://localhost:${PORT}`);
  console.log(`  Token: ${TOKEN}`);
  console.log(`  Capabilities: GET http://localhost:${PORT}/control/v1/capabilities`);
  console.log(`  Commands:     POST http://localhost:${PORT}/control/v1/commands`);
  console.log(`  WS Stream:    ws://localhost:${PORT}/control/v1/stream?token=${TOKEN}`);
});
