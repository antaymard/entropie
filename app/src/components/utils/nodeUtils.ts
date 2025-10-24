import type { NodeField, NodeTemplate } from "../../types";
import {
  fieldDefinitions,
  type FieldDefinition,
} from "../fields/fieldDefinitions";

export function getFieldFromId(
  fieldId: string,
  nodeTemplate: NodeTemplate
): { nodeField: NodeField; fieldDefinition: FieldDefinition | null } | null {
  // Parcourir les champs du modèle de nœud pour trouver celui qui correspond à l'ID
  for (const field of nodeTemplate.fields) {
    if (field.id === fieldId) {
      // Récupérer l'icone depuis fieldDefinitions
      const fieldDefinition = fieldDefinitions.find(
        (def) => def.type === field.type
      );

      return {
        nodeField: field as NodeField,
        fieldDefinition: fieldDefinition || null,
      };
    }
  }
  return null;
}
