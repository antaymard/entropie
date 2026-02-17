import type { AutomationStepType } from "@/types";

export const automationMapping: Record<AutomationStepType, string> = {
  "tool_launched=web_search": "Recherche web...",
  "tool_completed=web_search": "Analyse des résultats de la recherche web...",
  "tool_launched=web_extract": "Extraction de contenu web...",
  "tool_completed=web_extract": "Analyse des résultats de l'extraction web...",
  "tool_completed=update_node_data_values":
    "Mise à jour des données du noeud...",
  automation_launched: "Automatisation lancée...",
  automation_completed: "Automatisation terminée",
  automation_error: "Erreur d'automatisation",
  "tool_launched=view_image": "Lecture de l'image...",
  "tool_completed=view_image": "Image lue",
  "tool_launched=read_pdf": "Lecture du PDF...",
  "tool_completed=read_pdf": "PDF lu",
  "tool_error=read_pdf": "Erreur lors de la lecture du PDF",
  "tool_launched=update_node_data_values":
    "Mise à jour des données du noeud...",
};
