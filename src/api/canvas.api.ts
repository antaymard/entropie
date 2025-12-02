import type { ConvexReactClient } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { CanvasNode } from "../types/node.types";
import type { Edge } from "@xyflow/react";

// Instance Convex globale
let convexClient: ConvexReactClient | null = null;

// Timer pour le debounce
let saveTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Initialise le client Convex pour l'API canvas
 * À appeler au démarrage de l'application
 */
export const initializeCanvasApi = (client: ConvexReactClient) => {
  convexClient = client;
};

/**
 * Annule la sauvegarde en attente
 */
export const cancelPendingSave = () => {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
};

/**
 * Force la sauvegarde immédiate (sans debounce)
 */
export const saveCanvasToDbNow = async (
  canvasId: Id<"canvases">,
  nodes: CanvasNode[],
  edges: Edge[]
) => {
  // Annuler le timer en attente
  cancelPendingSave();

  if (!convexClient) {
    console.error(
      "Convex client not initialized. Call initializeCanvasApi first."
    );
    return;
  }

  try {
    await convexClient.mutation(api.canvases.updateCanvasContent, {
      canvasId,
      nodes,
      edges,
    });
    console.log("✅ Canvas saved immediately");
  } catch (error) {
    console.error("❌ Error saving canvas to DB:", error);
    throw error;
  }
};

/**
 * Sauvegarde le canvas dans la base de données avec debounce
 * Peut être appelée de n'importe où, réinitialise le timer à chaque appel
 *
 * @param canvasId - L'ID du canvas à sauvegarder
 * @param nodes - Les nodes du canvas
 * @param edges - Les edges du canvas
 * @param delay - Délai du debounce en ms (défaut: 1000ms)
 */
export const saveCanvasToDbDebounced = (
  canvasId: Id<"canvases">,
  nodes: CanvasNode[],
  edges: Edge[],
  delay: number = 1000
) => {
  // Annuler le timer précédent s'il existe
  if (saveTimer) {
    clearTimeout(saveTimer);
  }

  // Créer un nouveau timer qui appelle saveCanvasToDbNow
  saveTimer = setTimeout(() => {
    saveCanvasToDbNow(canvasId, nodes, edges);
  }, delay);
};
