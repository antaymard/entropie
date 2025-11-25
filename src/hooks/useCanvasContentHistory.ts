import { createTravels, type Travels } from "travels";
import { useCallback, useEffect, useRef } from "react";
import type { Node, Edge } from "@xyflow/react";

interface CanvasHistoryState {
  nodes: Node[];
  edges: Edge[];
}

/** Crée une empreinte unique de l'état en ignorant les propriétés transitoires */
function createFingerprint(nodes: Node[], edges: Edge[]): string {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const cleanNodes = nodes.map(({ selected, dragging, ...rest }) => rest);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const cleanEdges = edges.map(({ selected, ...rest }) => rest);
  return JSON.stringify({ nodes: cleanNodes, edges: cleanEdges });
}

export function useCanvasContentHistory(
  nodes: Node[],
  edges: Edge[],
  setNodes: (nodes: Node[]) => void,
  setEdges: (edges: Edge[]) => void,
  isInitialized: boolean
) {
  // Utiliser useRef pour l'instance travels (pas une variable globale)
  const travelsRef = useRef<Travels<CanvasHistoryState> | null>(null);
  const isUndoRedoRef = useRef(false);
  const lastRecordedRef = useRef<string>("");

  // Init travels quand le canvas est chargé
  useEffect(() => {
    if (isInitialized && !travelsRef.current) {
      travelsRef.current = createTravels<CanvasHistoryState>(
        { nodes, edges },
        { maxHistory: 50 }
      );
      // Initialize fingerprint to avoid duplicate initial entry
      lastRecordedRef.current = createFingerprint(nodes, edges);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized]);

  // Enregistre un changement (appelé après une action complète)
  const recordChange = useCallback(
    (currentNodes?: Node[], currentEdges?: Edge[]) => {
      if (!travelsRef.current || isUndoRedoRef.current) return;

      const nodesToRecord = currentNodes || nodes;
      const edgesToRecord = currentEdges || edges;

      const fingerprint = createFingerprint(nodesToRecord, edgesToRecord);

      if (fingerprint === lastRecordedRef.current) return;
      lastRecordedRef.current = fingerprint;

      travelsRef.current.setState({
        nodes: nodesToRecord,
        edges: edgesToRecord,
      });
    },
    [nodes, edges]
  );

  const applyHistoryChange = useCallback(
    (direction: "back" | "forward") => {
      const controls = travelsRef.current?.getControls();
      const canMove =
        direction === "back" ? controls?.canBack() : controls?.canForward();
      if (!travelsRef.current || !canMove) return;

      isUndoRedoRef.current = true;
      travelsRef.current[direction]();
      const state = travelsRef.current.getState();

      // Mettre à jour le fingerprint pour éviter un re-record
      lastRecordedRef.current = createFingerprint(state.nodes, state.edges);

      setNodes(state.nodes);
      setEdges(state.edges);

      setTimeout(() => {
        isUndoRedoRef.current = false;
      }, 50);
    },
    [setNodes, setEdges]
  );

  const undo = useCallback(
    () => applyHistoryChange("back"),
    [applyHistoryChange]
  );
  const redo = useCallback(
    () => applyHistoryChange("forward"),
    [applyHistoryChange]
  );

  return {
    recordChange,
    undo,
    redo,
    canUndo: () => travelsRef.current?.getControls().canBack() ?? false,
    canRedo: () => travelsRef.current?.getControls().canForward() ?? false,
    isUndoRedo: isUndoRedoRef,
  };
}
