import type { z } from "zod";
import type {
  ControlFeatureMapSchema,
  CapabilitiesResponseSchema,
  CommandTypeSchema,
  CommandStatusSchema,
  CommandResponseSchema,
  CommandStatusEventSchema,
} from "../api/control/control-schemas";

export type ControlFeatureMap = z.infer<typeof ControlFeatureMapSchema>;
export type CapabilitiesResponse = z.infer<typeof CapabilitiesResponseSchema>;
export type CommandType = z.infer<typeof CommandTypeSchema>;
export type CommandStatus = z.infer<typeof CommandStatusSchema>;
export type CommandResponse = z.infer<typeof CommandResponseSchema>;
export type CommandStatusEvent = z.infer<typeof CommandStatusEventSchema>;

export interface CommandLogEntry {
  commandId: string;
  idempotencyKey: string;
  type: CommandType;
  payload: unknown;
  status: CommandStatus;
  result: unknown | null;
  error: string | null;
  submittedAt: number;
  updatedAt: number;
}
