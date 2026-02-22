import { FocusResultSchema, type FocusResult } from "./types";

const BRIDGE_BASE = "http://127.0.0.1:3001";
const TIMEOUT_MS = 5000;

/**
 * Calls the bridge server to bring the Satisfactory window to the foreground.
 * Returns a full FocusResult with diagnostics.
 */
export async function focusSatisfactory(): Promise<FocusResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${BRIDGE_BASE}/window/focus/satisfactory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(
        `Bridge server error: ${response.status} ${response.statusText}`
      );
    }

    const json: unknown = await response.json();
    return FocusResultSchema.parse(json);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Focus request timed out after 5s");
    }
    if (err instanceof TypeError) {
      throw new Error(
        "Bridge server not reachable at http://127.0.0.1:3001. " +
          'Ensure "node scripts/teleport-server.js" is running.'
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
