import { useNodeData } from "@/hooks/useNodeData";
import { Spinner } from "@/components/shadcn/spinner";
import { NodeToolbar, type Node } from "@xyflow/react";
import { useEffect, useRef, useState } from "react";
import { TbCheck, TbExclamationMark } from "react-icons/tb";
import { automationMapping } from "./automationTypesToLabelsMapping";
import type { AutomationStepType } from "@/types";

type TransitionState = "none" | "success" | "error";

function AutomationIndicator({ xyNode }: { xyNode: Node<any> }) {
  const nodeData = useNodeData(xyNode.data?.nodeDataId);
  const prevStatusRef = useRef<string | undefined>(nodeData?.status);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [transitionState, setTransitionState] =
    useState<TransitionState>("none");

  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    const currentStatus = nodeData?.status;
    prevStatusRef.current = currentStatus;

    // Detect transition from "working" to "idle" or "error"
    if (prevStatus === "working" && currentStatus !== "working") {
      // Clear any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      if (currentStatus === "idle") {
        setTransitionState("success");
      } else if (currentStatus === "error") {
        setTransitionState("error");
      }

      // Auto-hide after 3 seconds
      timerRef.current = setTimeout(() => {
        setTransitionState("none");
        timerRef.current = null;
      }, 3000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [nodeData?.status]);

  const isWorking =
    nodeData?.automationMode === "agent" && nodeData?.status === "working";

  const showTransition =
    !xyNode?.selected &&
    nodeData?.automationMode === "agent" &&
    transitionState !== "none";

  return (
    <>
      {/* Working indicator */}
      <NodeToolbar isVisible={!xyNode?.selected && isWorking}>
        <span className="text-slate-500 flex gap-2 items-center">
          <Spinner />
          {automationMapping[
            nodeData?.automationProgress?.currentStepType as AutomationStepType
          ] || "En cours..."}
        </span>
      </NodeToolbar>

      {/* Transition indicator (success/error) */}
      <NodeToolbar isVisible={showTransition && !isWorking}>
        {transitionState === "success" && (
          <span className="text-green-500 flex gap-2 items-center">
            <TbCheck />
            Terminé !
          </span>
        )}
        {transitionState === "error" && (
          <span className="text-red-500 flex gap-2 items-center">
            <TbExclamationMark />
            Erreur
          </span>
        )}
      </NodeToolbar>
    </>
  );
}

export default AutomationIndicator;
