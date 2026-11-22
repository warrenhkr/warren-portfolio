import { l, type L } from "@/lib/types";

/**
 * usage : "regular" | "experiment" | "unconfirmed" (à confirmer).
 * TODO : confirmer l'usage de chaque outil, ajouter ou retirer des outils.
 */
export type AiTool = { id: string; name: string; icon?: string; url: string; role: L; text: L; usage: "regular" | "experiment" | "unconfirmed" };

export const aiTools: AiTool[] = [
  { id: "claude", name: "Claude", icon: "claude", url: "https://claude.ai", role: l("Assistant de réflexion et de code", "Thinking and coding assistant"), text: l("Assistant d'Anthropic pour rédiger, raisonner, analyser et programmer.", "Anthropic's assistant for writing, reasoning, analysis and coding."), usage: "unconfirmed" },
  { id: "chatgpt", name: "ChatGPT", icon: "openai", url: "https://chatgpt.com", role: l("Assistant conversationnel", "Conversational assistant"), text: l("Assistant d'OpenAI pour explorer des idées, rédiger et prototyper.", "OpenAI's assistant for exploring ideas, writing and prototyping."), usage: "unconfirmed" },
  { id: "antigravity", name: "Antigravity", url: "https://antigravity.google", role: l("Environnement de développement agentique", "Agentic development environment"), text: l("Éditeur de code de Google où des agents IA aident à construire des projets.", "Google's code editor where AI agents help build projects."), usage: "unconfirmed" },
];
