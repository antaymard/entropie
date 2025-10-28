import { useFormikContext } from "formik";
import type { LayoutElement, NodeField, NodeTemplate } from "../../types";
import {
  fieldDefinitions,
  type FieldDefinition,
} from "../fields/fieldDefinitions";

export function addElementToLayout(
  elementToAdd: LayoutElement,
  targetElementId: string,
  layout: LayoutElement
): LayoutElement {
  const findAndAddElement = (currentLayout: LayoutElement): LayoutElement => {
    if (currentLayout.id === targetElementId) {
      // Si on a trouvé l'élément cible, on l'ajoute
      return {
        ...currentLayout,
        children: [...(currentLayout.children || []), elementToAdd],
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
  layout: LayoutElement
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
    layout = addElementToLayout(elementToMove, newParentId, layout);
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
      const fieldDefinition = fieldDefinitions.find(
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
