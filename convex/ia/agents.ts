import { components } from "../_generated/api";
import { Agent } from "@convex-dev/agent";
import { openrouter } from "@openrouter/ai-sdk-provider";

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
    languageModel: openrouter("mistralai/mistral-large-2512"),
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

export function createAbstractorAgent() {
  return new Agent(components.agent, {
    name: "abstractor",
    maxSteps: 5,
    languageModel: openrouter.chat("mistralai/mistral-small-2603"),
    instructions:
      "You are a concise summarizer. Extract the relevant information and provide a summary that can be used by an agent to understand the content and context of a node. Focus on key details such as the main topic, any important entities mentioned, and the overall purpose of the node. If the node is a url, extract the main content of the page. If it's a pdf, extract the main insights. If it's an image, describe its content. Be concise and factual. The abstract will be used by an agent to understand the content and context of a node, so include information that would be relevant for that purpose. !! The length of the summary should ideally be between 50 and 150 words. !! No formatting, and no title. Only the abstract in plain text.",
  });
}
