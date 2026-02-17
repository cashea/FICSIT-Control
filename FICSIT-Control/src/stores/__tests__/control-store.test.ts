import { describe, it, expect, beforeEach } from "vitest";
import { useControlStore } from "../control-store";

describe("control-store", () => {
  beforeEach(() => {
    // Reset the store to initial state between tests
    useControlStore.setState({
      controlHost: "localhost",
      controlPort: 9090,
      token: "",
      connectionStatus: "disconnected",
      error: null,
      capabilities: null,
      commandLog: [],
      client: null,
    });
  });

  it("initializes with disconnected status", () => {
    const state = useControlStore.getState();
    expect(state.connectionStatus).toBe("disconnected");
    expect(state.error).toBeNull();
    expect(state.capabilities).toBeNull();
    expect(state.commandLog).toHaveLength(0);
    expect(state.client).toBeNull();
  });

  it("has correct default host and port", () => {
    const state = useControlStore.getState();
    expect(state.controlHost).toBe("localhost");
    expect(state.controlPort).toBe(9090);
    expect(state.token).toBe("");
  });

  it("updates host", () => {
    useControlStore.getState().setControlHost("192.168.1.100");
    expect(useControlStore.getState().controlHost).toBe("192.168.1.100");
  });

  it("updates port", () => {
    useControlStore.getState().setControlPort(8888);
    expect(useControlStore.getState().controlPort).toBe(8888);
  });

  it("updates token", () => {
    useControlStore.getState().setToken("my-secret-token");
    expect(useControlStore.getState().token).toBe("my-secret-token");
  });

  it("reports feature as unavailable when disconnected", () => {
    expect(useControlStore.getState().isFeatureAvailable("resetFuse")).toBe(false);
  });

  it("reports feature as unavailable when no capabilities", () => {
    useControlStore.setState({ connectionStatus: "connected", capabilities: null });
    expect(useControlStore.getState().isFeatureAvailable("resetFuse")).toBe(false);
  });

  it("reports feature availability from capabilities", () => {
    useControlStore.setState({
      connectionStatus: "connected",
      capabilities: {
        version: "1.0.0",
        features: {
          resetFuse: true,
          toggleGeneratorGroup: false,
          toggleBuilding: true,
          setRecipe: false,
          setOverclock: false,
        },
        limits: { commandsPerSecond: 5 },
      },
    });
    expect(useControlStore.getState().isFeatureAvailable("resetFuse")).toBe(true);
    expect(useControlStore.getState().isFeatureAvailable("toggleGeneratorGroup")).toBe(false);
    expect(useControlStore.getState().isFeatureAvailable("toggleBuilding")).toBe(true);
    expect(useControlStore.getState().isFeatureAvailable("setRecipe")).toBe(false);
  });

  it("requires token to connect", async () => {
    useControlStore.setState({ token: "" });
    await useControlStore.getState().connect();
    expect(useControlStore.getState().connectionStatus).toBe("error");
    expect(useControlStore.getState().error).toBe("Token is required");
  });

  it("clears state on disconnect", () => {
    useControlStore.setState({
      connectionStatus: "connected",
      capabilities: {
        version: "1.0.0",
        features: {
          resetFuse: true,
          toggleGeneratorGroup: false,
          toggleBuilding: false,
          setRecipe: false,
          setOverclock: false,
        },
        limits: { commandsPerSecond: 5 },
      },
      commandLog: [{
        commandId: "cmd-1",
        idempotencyKey: "key-1",
        type: "RESET_FUSE",
        payload: { circuitId: 1 },
        status: "SUCCEEDED",
        result: null,
        error: null,
        submittedAt: Date.now(),
        updatedAt: Date.now(),
      }],
    });

    useControlStore.getState().disconnect();
    const state = useControlStore.getState();
    expect(state.connectionStatus).toBe("disconnected");
    expect(state.error).toBeNull();
    expect(state.capabilities).toBeNull();
    expect(state.commandLog).toHaveLength(0);
    expect(state.client).toBeNull();
  });

  it("returns null from submitCommand when disconnected", async () => {
    const result = await useControlStore.getState().submitCommand("RESET_FUSE", { circuitId: 1 });
    expect(result).toBeNull();
  });
});
