import { components } from "../_generated/api";
import { Agent } from "@convex-dev/agent";
import { openrouter } from "@openrouter/ai-sdk-provider";

// Minimal agent used for utility operations (e.g. saveMessage) that don't require a specific model.
export const baseAgent = new Agent(components.agent, {
  name: "base",
  languageModel: openrouter("minimax/minimax-m2.7"),
});

export function createNoleAgent({
  readCanvasInternal,
  model, // To dep ?
}: {
  readCanvasInternal: any;
  model?: any;
}) {
  return new Agent(components.agent, {
    name: "Nolë",
    maxSteps: 15,
    languageModel: openrouter("minimax/minimax-m2.7"),
  });
}

export function createAutomationAgent({
  model,
  updateNodeDataValuesTool,
}: {
  model?: any;
  updateNodeDataValuesTool?: any;
}) {
  return new Agent(components.agent, {
    name: "automation-agent",
    languageModel: openrouter("minimax/minimax-m2.7"),
    maxSteps: 5,
    instructions: `Tu es un agent d'automatisation, lié à un node sur une app canvas-base type miro. Tu peux utiliser les outils à ta disposition pour accomplir les tâches demandées. Le noeud auquel tu es lié peut contenir des données d'entrée d'autres noeuds (input) que tu devras le plus souvent utiliser pour accomplir ta tâche. Utilise les outils à ta disposition pour trouver l'information.
      
    Ne réponds pas à l'utilisateur directement comme un chat. Utilise l'outil update_node_data_values pour mettre à jour les données du noeud auquel tu es lié en guise de réponse et de livraison de ton travail. 
    
    Sois le plus concis possible, exact et factuel. Ne fabrique pas d'informations. Ne sois pas verbeux.`,
  });
}
