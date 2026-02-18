import type { FactorySnapshot } from "./system-prompt";
import {
  summarizePower,
  summarizeProduction,
  summarizeInventory,
  summarizeMachines,
} from "./system-prompt";

const SYSTEM_PROMPT = `You are an expert Satisfactory factory advisor. Based on the live factory data below, provide ONE concise, actionable recommendation to improve the factory. Focus on the highest-impact issue: tripped fuses, idle machines, production bottlenecks, power headroom, or storage problems. Be specific with numbers. Do NOT use markdown formatting or bullet points. Respond with a single sentence of 20-40 words.

When you reference a specific machine type, wrap it with double brackets containing the endpoint name and display label separated by a pipe, like: [[getSmelter|Smelters]]. Valid endpoint names: getAssembler, getSmelter, getConstructor, getRefinery, getManufacturer, getFoundry, getBlender, getPackager, getParticleAccelerator. Example: "3 of your [[getSmelter|Smelters]] are idle — assign recipes or pause them to save 45 MW."`;

export function buildRecommendationPrompt(factory: FactorySnapshot): {
  systemPrompt: string;
  userMessage: string;
} {
  const sections = [
    `<power>\n${summarizePower(factory.powerCircuits)}\n</power>`,
    `<production>\n${summarizeProduction(factory.productionStats)}\n</production>`,
    `<inventory>\n${summarizeInventory(factory.inventory)}\n</inventory>`,
    `<machines>\n${summarizeMachines(factory.machines)}\n</machines>`,
  ].join("\n\n");

  return {
    systemPrompt: SYSTEM_PROMPT,
    userMessage: `Here is the current factory state:\n\n${sections}\n\nWhat is the single most impactful action I should take right now?`,
  };
}
