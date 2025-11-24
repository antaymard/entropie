import type { LayoutElement, NodeField, NodeTemplate } from "../../types";
import fieldsDefinition from "../fields/fieldsDefinition";
import type { FieldDefinition } from "@/types/field.types";

/**
 * Helper pour déterminer le nom du variant visuel à utiliser
 * en fonction du contexte (node/window) et de la définition du champ
 */
export function getDefaultVisualName(
  fieldId: string,
  visualType: "node" | "window",
  nodeTemplate: NodeTemplate
): string {
  const { fieldDefinition } = getFieldFromId(fieldId, nodeTemplate);

  if (!fieldDefinition?.visuals) {
    return "default";
  }

  // Trouver le premier variant qui correspond au visualType
  const matchingVariant = fieldDefinition.visuals.variants.find(
    (variant) =>
      variant.visualType === visualType || variant.visualType === "both"
  );

  return matchingVariant?.name || "default";
}

/**
 * Helper pour récupérer les settings par défaut d'un variant
 * Construit l'objet à partir des defaultValue de chaque setting
 */
export function getDefaultSettingsForVariant(
  fieldId: string,
  variantName: string,
  nodeTemplate: NodeTemplate
): Record<string, unknown> {
  const { fieldDefinition } = getFieldFromId(fieldId, nodeTemplate);

  if (!fieldDefinition?.visuals) {
    return {};
  }

  // Trouver le variant par son nom
  const variant = fieldDefinition.visuals.variants.find(
    (v) => v.name === variantName
  );

  if (!variant) {
    return {};
  }

  // Construire l'objet des settings par défaut à partir des settingsList
  const defaultSettings: Record<string, unknown> = {};

  // Ajouter les settings communs
  fieldDefinition.visuals.commonSettingsList?.forEach((setting) => {
    if (setting.defaultValue !== undefined) {
      defaultSettings[setting.key] = setting.defaultValue;
    }
  });

  // Ajouter les settings spécifiques au variant (écrasent les communs si même clé)
  variant.settingsList?.forEach((setting) => {
    if (setting.defaultValue !== undefined) {
      defaultSettings[setting.key] = setting.defaultValue;
    }
  });

  return defaultSettings;
}

export function addElementToLayout(
  elementToAdd: LayoutElement,
  targetElementId: string,
  layout: LayoutElement,
  visualType: "node" | "window",
  nodeTemplate: NodeTemplate
): LayoutElement {
  const findAndAddElement = (currentLayout: LayoutElement): LayoutElement => {
    if (currentLayout.id === targetElementId) {
      // Déterminer le nom du variant visuel approprié
      const visualName =
        elementToAdd.element === "field"
          ? getDefaultVisualName(elementToAdd.id, visualType, nodeTemplate)
          : "default";

      // Récupérer les settings par défaut pour ce variant
      const defaultSettings =
        elementToAdd.element === "field"
          ? getDefaultSettingsForVariant(
              elementToAdd.id,
              visualName,
              nodeTemplate
            )
          : {};

      // Si on a trouvé l'élément cible, on l'ajoute
      return {
        ...currentLayout,
        children: [
          ...(currentLayout.children || []),
          {
            ...elementToAdd,
            visual: { name: visualName, settings: defaultSettings },
          },
        ],
      };
    }

    // Sinon, on cherche dans les enfants
    if (currentLayout.children) {
      return {
        ...currentLayout,
        children: currentLayout.children.map((child) =>
          findAndAddElement(child)
        ),
      };
    }

    return currentLayout;
  };

  return findAndAddElement(layout);
}

export function moveElementInLayout(
  elementId: string,
  newParentId: string,
  layout: LayoutElement,
  visualType: "node" | "window",
  nodeTemplate: NodeTemplate
): LayoutElement {
  let elementToMove: LayoutElement | null = null;

  // First, remove the element from its current position
  const findAndRemoveElement = (
    currentLayout: LayoutElement
  ): LayoutElement => {
    if (currentLayout.children) {
      const filteredChildren = currentLayout.children.filter((child) => {
        if (child.id === elementId) {
          elementToMove = child;
          return false; // Remove this child
        }
        return true;
      });

      return {
        ...currentLayout,
        children: filteredChildren.map((child) => findAndRemoveElement(child)),
      };
    }

    return currentLayout;
  };

  layout = findAndRemoveElement(layout);

  // If we found the element to move, we need to add it to the new parent
  if (elementToMove) {
    layout = addElementToLayout(
      elementToMove,
      newParentId,
      layout,
      visualType,
      nodeTemplate
    );
  }

  return layout;
}

// Delete an element from the layout by its ID (including its children)
export function deleteElementFromLayout(
  elementId: string,
  layout: LayoutElement
): LayoutElement {
  const findAndRemoveElement = (
    currentLayout: LayoutElement
  ): LayoutElement => {
    if (currentLayout.children) {
      const filteredChildren = currentLayout.children.filter((child) => {
        if (child.id === elementId) {
          return false; // Remove this child
        }
        return true;
      });

      return {
        ...currentLayout,
        children: filteredChildren.map((child) => findAndRemoveElement(child)),
      };
    }

    return currentLayout;
  };

  return findAndRemoveElement(layout);
}

export function reorderElementAmongSiblings(
  elementId: string,
  operation: "up" | "down",
  layout: LayoutElement
): LayoutElement {
  const findAndReorder = (currentLayout: LayoutElement): LayoutElement => {
    if (currentLayout.children) {
      const index = currentLayout.children.findIndex(
        (child) => child.id === elementId
      );
      if (index !== -1) {
        const newIndex = operation === "up" ? index - 1 : index + 1;
        if (newIndex >= 0 && newIndex < currentLayout.children.length) {
          // Créer une nouvelle copie du tableau au lieu de le modifier directement
          const newChildren = [...currentLayout.children];
          const [movedChild] = newChildren.splice(index, 1);
          newChildren.splice(newIndex, 0, movedChild);

          return {
            ...currentLayout,
            children: newChildren,
          };
        }
      }
      return {
        ...currentLayout,
        children: currentLayout.children.map((child) => findAndReorder(child)),
      };
    }

    return currentLayout;
  };

  return findAndReorder(layout);
}

// A transformer en hook si besoin d'utiliser useFormikContext
export function getFieldFromId(
  fieldId: string,
  nodeTemplate: NodeTemplate
): { nodeField: NodeField | null; fieldDefinition: FieldDefinition | null } {
  // Parcourir les champs du modèle de nœud pour trouver celui qui correspond à l'ID

  for (const field of nodeTemplate.fields) {
    if (field.id === fieldId) {
      // Récupérer l'icone depuis fieldDefinitions
      const fieldDefinition = fieldsDefinition.find(
        (def) => def.type === field.type
      );

      return {
        nodeField: field as NodeField,
        fieldDefinition: fieldDefinition || null,
      };
    }
  }
  return {
    nodeField: null,
    fieldDefinition: null,
  };
}

export function returnElementPathInLayout(
  layout: LayoutElement, // node or window layout
  elementId?: string
): string | null {
  if (!elementId) {
    return null;
  }

  // Helper function récursive qui retourne le chemin
  const findPath = (
    currentElement: LayoutElement,
    currentPath: string
  ): string | null => {
    // Si l'élément actuel est celui recherché, retourner le chemin
    if (currentElement.id === elementId) {
      return currentPath;
    }

    // Si l'élément a des enfants, chercher récursivement
    if (currentElement.children && currentElement.children.length > 0) {
      for (let i = 0; i < currentElement.children.length; i++) {
        const childPath = currentPath
          ? `${currentPath}.children[${i}]`
          : `children[${i}]`;
        const result = findPath(currentElement.children[i], childPath);
        if (result) {
          return result;
        }
      }
    }

    return null;
  };

  // Si on cherche le layout root lui-même
  if (layout.id === elementId) {
    return "";
  }

  // Sinon, chercher dans les enfants
  return findPath(layout, "");
}
