import { z } from "zod";

// -- Sub-schemas --

export const WindowRectSchema = z.object({
  l: z.number(),
  t: z.number(),
  r: z.number(),
  b: z.number(),
});

export const WindowInfoSchema = z.object({
  hwnd: z.string(),
  pid: z.number(),
  title: z.string(),
  className: z.string(),
  isVisible: z.boolean(),
  rect: WindowRectSchema,
  exStyle: z.string().optional(),
  score: z.number(),
});

export const CandidateProcessSchema = z.object({
  pid: z.number(),
  processName: z.string(),
});

export const SelectedWindowSchema = z.object({
  pid: z.number().optional(),
  hwnd: z.string().optional(),
  processName: z.string().optional(),
});

export const FocusErrorSchema = z.object({
  step: z.string(),
  win32LastError: z.number().optional(),
  message: z.string(),
});

// -- Main result --

export const FocusResultSchema = z.object({
  ok: z.boolean(),
  selected: SelectedWindowSchema,
  candidates: z.array(CandidateProcessSchema),
  windows: z.array(WindowInfoSchema),
  steps: z.record(z.string(), z.unknown()),
  errors: z.array(FocusErrorSchema),
});

// -- Inferred types --

export type WindowRect = z.infer<typeof WindowRectSchema>;
export type WindowInfo = z.infer<typeof WindowInfoSchema>;
export type CandidateProcess = z.infer<typeof CandidateProcessSchema>;
export type SelectedWindow = z.infer<typeof SelectedWindowSchema>;
export type FocusError = z.infer<typeof FocusErrorSchema>;
export type FocusResult = z.infer<typeof FocusResultSchema>;
