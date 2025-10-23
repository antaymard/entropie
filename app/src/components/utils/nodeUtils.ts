import type { NodeField, NodeTemplate } from "../../types";
import { fieldDefinitions } from "../fields/fieldDefinitions";

export function getFieldDetailsFromId(fieldId: string, nodeTemplate: NodeTemplate) : {icon: React.ComponentType<any>, nodeField: NodeField} | null {
  // Parcourir les champs du modèle de nœud pour trouver celui qui correspond à l'ID
  for (const field of nodeTemplate.fields) {
    if (field.id === fieldId) {
      // Récupérer l'icone depuis fieldDefinitions
      const fieldDefinition = fieldDefinitions.find((def) => def.type === field.type);
      
      return {
        nodeField: field as NodeField, icon: fieldDefinition?.icon || (() => null)
      };
    }
  }
  return null;
}