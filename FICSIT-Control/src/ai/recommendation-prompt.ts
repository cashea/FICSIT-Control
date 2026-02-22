import type { FactorySnapshot } from "./system-prompt";
import {
  summarizePower,
  summarizeProduction,
  summarizeInventory,
  summarizeMachines,
} from "./system-prompt";

interface PreviousRecommendation {
  text: string;
  timestamp: number;
  factorySnapshot: FactorySnapshot;
}

const SYSTEM_PROMPT = `You are an expert Satisfactory factory advisor. Based on the live factory data below, provide ONE concise, actionable recommendation to improve the factory. Focus on the highest-impact issue: tripped fuses, idle machines, production bottlenecks, power headroom, or storage problems. Be specific with numbers. Do NOT use markdown formatting or bullet points. Respond with a single sentence of 20-40 words.

IMPORTANT: You will be shown recent recommendations you already made. Do NOT repeat or rephrase any of them. Always suggest something NEW and different. If the factory data has not changed much, look at a different aspect (e.g., if you already covered power, look at production efficiency or idle machines instead).

When you reference a specific machine type, wrap it with double brackets containing the endpoint name and display label separated by a pipe, like: [[getSmelter|Smelters]]. Valid endpoint names: getAssembler, getSmelter, getConstructor, getRefinery, getManufacturer, getFoundry, getBlender, getPackager, getParticleAccelerator, getExtractor. Example: "3 of your [[getSmelter|Smelters]] are idle — assign recipes or pause them to save 45 MW."

IMPORTANT: If a previous recommendation was provided, you MUST verify whether the issue still exists by comparing the previous factory state with the current state. Only make the same suggestion if the problem persists. If the previous issue has been resolved or improved, acknowledge this briefly and suggest a different improvement, or state "No critical issues detected" if factory performance is good.`;

export function buildRecommendationPrompt(
  factory: FactorySnapshot,
  previousRecommendation: PreviousRecommendation | null,
  recentRecommendations?: string[],
): {
  systemPrompt: string;
  userMessage: string;
} {
  const sections = [
    `<power>\n${summarizePower(factory.powerCircuits)}\n</power>`,
    `<production>\n${summarizeProduction(factory.productionStats)}\n</production>`,
    `<inventory>\n${summarizeInventory(factory.inventory)}\n</inventory>`,
    `<machines>\n${summarizeMachines(factory.machines)}\n</machines>`,
  ].join("\n\n");

  let userMessage = `Here is the current factory state:\n\n${sections}`;

  if (recentRecommendations && recentRecommendations.length > 0) {
    userMessage +=
      "\n\n<recent-recommendations>\nYou already suggested these — do NOT repeat or rephrase any of them:\n" +
      recentRecommendations.map((r, i) => `${i + 1}. ${r}`).join("\n") +
      "\n</recent-recommendations>";
  }

  if (previousRecommendation) {
    const prevSections = [
      `<power>\n${summarizePower(previousRecommendation.factorySnapshot.powerCircuits)}\n</power>`,
      `<production>\n${summarizeProduction(previousRecommendation.factorySnapshot.productionStats)}\n</production>`,
      `<inventory>\n${summarizeInventory(previousRecommendation.factorySnapshot.inventory)}\n</inventory>`,
      `<machines>\n${summarizeMachines(previousRecommendation.factorySnapshot.machines)}\n</machines>`,
    ].join("\n\n");

    userMessage += `\n\n<previous-recommendation>
My previous recommendation was: "${previousRecommendation.text}"

Factory state when that recommendation was made:
${prevSections}
</previous-recommendation>

First, check if the issue I mentioned previously still exists by comparing the previous factory state with the current state. If the problem has been resolved or significantly improved, acknowledge this. Then provide your recommendation.`;
  } else {
    userMessage += `\n\nWhat is the single most impactful action I should take right now?`;
  }

  return {
    systemPrompt: SYSTEM_PROMPT,
    userMessage,
  };
}
