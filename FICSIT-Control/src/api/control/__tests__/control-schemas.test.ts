import { describe, it, expect } from "vitest";
import {
  CapabilitiesResponseSchema,
  CommandResponseSchema,
  CommandStatusEventSchema,
  ResetFusePayloadSchema,
  SetOverclockPayloadSchema,
  ToggleBuildingPayloadSchema,
  SetRecipePayloadSchema,
  ToggleGeneratorGroupPayloadSchema,
} from "../control-schemas";

describe("CapabilitiesResponseSchema", () => {
  it("parses valid capabilities with all features", () => {
    const input = {
      version: "1.0.0",
      features: {
        resetFuse: true,
        toggleGeneratorGroup: true,
        toggleBuilding: true,
        setRecipe: true,
        setOverclock: true,
      },
      limits: { commandsPerSecond: 5 },
    };
    const result = CapabilitiesResponseSchema.parse(input);
    expect(result.version).toBe("1.0.0");
    expect(result.features.resetFuse).toBe(true);
    expect(result.limits.commandsPerSecond).toBe(5);
  });

  it("defaults missing features to false", () => {
    const input = {
      version: "1.0.0",
      features: {},
      limits: {},
    };
    const result = CapabilitiesResponseSchema.parse(input);
    expect(result.features.resetFuse).toBe(false);
    expect(result.features.toggleGeneratorGroup).toBe(false);
    expect(result.features.toggleBuilding).toBe(false);
    expect(result.features.setRecipe).toBe(false);
    expect(result.features.setOverclock).toBe(false);
  });

  it("defaults commandsPerSecond to 5", () => {
    const input = {
      version: "1.0.0",
      features: {},
      limits: {},
    };
    const result = CapabilitiesResponseSchema.parse(input);
    expect(result.limits.commandsPerSecond).toBe(5);
  });

  it("rejects missing version", () => {
    const input = { features: {}, limits: {} };
    const result = CapabilitiesResponseSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe("CommandResponseSchema", () => {
  it("parses QUEUED response", () => {
    const input = {
      commandId: "abc-123",
      status: "QUEUED",
    };
    const result = CommandResponseSchema.parse(input);
    expect(result.commandId).toBe("abc-123");
    expect(result.status).toBe("QUEUED");
    expect(result.result).toBeNull();
    expect(result.error).toBeNull();
  });

  it("parses SUCCEEDED with result", () => {
    const input = {
      commandId: "abc-123",
      status: "SUCCEEDED",
      result: { message: "Fuse reset" },
      error: null,
    };
    const result = CommandResponseSchema.parse(input);
    expect(result.status).toBe("SUCCEEDED");
    expect(result.result).toEqual({ message: "Fuse reset" });
  });

  it("parses FAILED with error", () => {
    const input = {
      commandId: "abc-123",
      status: "FAILED",
      result: null,
      error: "Circuit not found",
    };
    const result = CommandResponseSchema.parse(input);
    expect(result.status).toBe("FAILED");
    expect(result.error).toBe("Circuit not found");
  });

  it("defaults result and error to null", () => {
    const input = { commandId: "abc-123", status: "RUNNING" };
    const result = CommandResponseSchema.parse(input);
    expect(result.result).toBeNull();
    expect(result.error).toBeNull();
  });

  it("rejects invalid status", () => {
    const input = { commandId: "abc-123", status: "INVALID" };
    const result = CommandResponseSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe("CommandStatusEventSchema", () => {
  it("parses valid event", () => {
    const input = {
      event: "COMMAND_STATUS",
      commandId: "abc-123",
      status: "SUCCEEDED",
      result: { message: "Done" },
    };
    const result = CommandStatusEventSchema.parse(input);
    expect(result.event).toBe("COMMAND_STATUS");
    expect(result.commandId).toBe("abc-123");
    expect(result.status).toBe("SUCCEEDED");
  });

  it("rejects event with wrong event type", () => {
    const input = {
      event: "WRONG_EVENT",
      commandId: "abc-123",
      status: "SUCCEEDED",
    };
    const result = CommandStatusEventSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("defaults result and error to null", () => {
    const input = {
      event: "COMMAND_STATUS",
      commandId: "abc-123",
      status: "RUNNING",
    };
    const result = CommandStatusEventSchema.parse(input);
    expect(result.result).toBeNull();
    expect(result.error).toBeNull();
  });
});

describe("payload schemas", () => {
  it("validates ResetFusePayload", () => {
    const result = ResetFusePayloadSchema.parse({ circuitId: 1 });
    expect(result.circuitId).toBe(1);
  });

  it("rejects ResetFusePayload without circuitId", () => {
    const result = ResetFusePayloadSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("validates ToggleGeneratorGroupPayload", () => {
    const result = ToggleGeneratorGroupPayloadSchema.parse({ groupId: "coal-1", enabled: false });
    expect(result.groupId).toBe("coal-1");
    expect(result.enabled).toBe(false);
  });

  it("validates ToggleBuildingPayload", () => {
    const result = ToggleBuildingPayloadSchema.parse({ buildingId: "smelter-3", enabled: true });
    expect(result.buildingId).toBe("smelter-3");
    expect(result.enabled).toBe(true);
  });

  it("validates SetRecipePayload", () => {
    const result = SetRecipePayloadSchema.parse({ machineId: "assembler-1", recipeId: "iron-plate" });
    expect(result.machineId).toBe("assembler-1");
    expect(result.recipeId).toBe("iron-plate");
  });

  it("validates SetOverclockPayload within range", () => {
    const result = SetOverclockPayloadSchema.parse({ machineId: "smelter-1", clockPercent: 150 });
    expect(result.clockPercent).toBe(150);
  });

  it("rejects overclock above 250", () => {
    const result = SetOverclockPayloadSchema.safeParse({ machineId: "smelter-1", clockPercent: 300 });
    expect(result.success).toBe(false);
  });

  it("rejects overclock below 0", () => {
    const result = SetOverclockPayloadSchema.safeParse({ machineId: "smelter-1", clockPercent: -10 });
    expect(result.success).toBe(false);
  });
});
