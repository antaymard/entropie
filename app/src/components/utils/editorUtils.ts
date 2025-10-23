import type { LayoutElement } from "../../types";


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
                children: filteredChildren.map((child) =>
                    findAndRemoveElement(child)
                ),
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
                children: filteredChildren.map((child) =>
                    findAndRemoveElement(child)
                ),
            };
        }

        return currentLayout;
    };

    return findAndRemoveElement(layout);
}
