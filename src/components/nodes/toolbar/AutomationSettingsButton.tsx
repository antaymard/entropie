import { Button } from "@/components/shadcn/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import type { Node } from "@xyflow/react";
import {
  TbBolt,
  TbBoltFilled,
  TbExclamationMark,
  TbPlayerPlayFilled,
} from "react-icons/tb";
import { useForm } from "@tanstack/react-form";
import Selector from "@/components/ts-form/Selector";
import { cn } from "@/lib/utils";
import TextArea from "@/components/ts-form/TextArea";
import { useAction, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import toast from "react-hot-toast";
import { useState } from "react";
import type { AutomationStepType, NodeData } from "@/types/convex";
import { useNodeData } from "@/hooks/useNodeData";
import { ButtonGroup } from "@/components/shadcn/button-group";
import { Spinner } from "@/components/shadcn/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/shadcn/tooltip";
import { automationMapping } from "./automationTypesToLabelsMapping";

const sectionClassName = "flex flex-col gap-2";

export default function AutomationSettingsButton({
  xyNode,
  automationStepAlwaysVisible,
}: {
  xyNode: Node;
  automationStepAlwaysVisible?: boolean;
}) {
  const updateAutomationSettings = useMutation(
    api.nodeDatas.updateAutomationSettings,
  );
  const triggerAutomation = useAction(api.automations.trigger);
  const [open, setOpen] = useState(false);

  const nodeDataId = xyNode.data?.nodeDataId as Id<"nodeDatas"> | undefined;
  const nodeData = useNodeData(nodeDataId);
  // const sourceNodes = useConnectedNodes("source");

  const form = useForm({
    defaultValues: {
      automationMode: (nodeData?.automationMode || "off") as
        | "agent"
        | "dataProcessing"
        | "off",
      agent: {
        model: nodeData?.agent?.model || "small",
        instructions: nodeData?.agent?.instructions || "",
        touchableFields: nodeData?.agent?.touchableFields || [],
      },
      dataProcessing: nodeData?.dataProcessing || [],
    } as Pick<NodeData, "automationMode" | "agent" | "dataProcessing">,
    onSubmit: async ({ value }) => {
      if (!nodeDataId) return toast.error("Le nodeDataId est manquant.");
      await updateAutomationSettings({
        _id: nodeDataId,
        ...value,
      });
      return setOpen(false);
    },
  });

  const hasAutomationEnabled =
    nodeData?.automationMode && nodeData?.automationMode !== "off";
  const automationStatus = nodeData?.status;

  const handleTriggerAutomation = async () => {
    if (!nodeDataId) return toast.error("Le nodeDataId est manquant.");
    await triggerAutomation({ nodeDataId });
  };

  // Render

  if (!nodeDataId) {
    console.error(
      "Affichage bloqué : le nodeDataId est manquant pour le node :",
      xyNode,
    );
    return null;
  }

  const automationStep =
    automationMapping[
      nodeData.automationProgress?.currentStepType as AutomationStepType
    ];

  return (
    <ButtonGroup>
      <Popover
        open={open}
        onOpenChange={(e) => {
          setOpen(e);
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className={cn(hasAutomationEnabled && "text-amber-500")}
          >
            <Tooltip>
              <TooltipTrigger>
                {hasAutomationEnabled ? <TbBoltFilled /> : <TbBolt />}
              </TooltipTrigger>
              <TooltipContent>
                <p>Paramètres d'automation</p>
              </TooltipContent>
            </Tooltip>
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-96"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-row items-center justify-between">
              <h3 className="font-semibold">Automation</h3>
              <Selector
                form={form}
                name="automationMode"
                options={[
                  {
                    value: "off",
                    label: "Off",
                  },
                  {
                    value: "agent",
                    label: "Agent",
                  },
                  {
                    value: "dataProcessing",
                    label: "Data Processing",
                  },
                ]}
              />
            </div>

            <form.Subscribe
              selector={(state) => state.values.automationMode}
              children={(automationMode) =>
                automationMode === "agent" ? (
                  <div className={cn(sectionClassName)}>
                    <h2 className="font-bold">Instructions</h2>
                    <TextArea
                      form={form}
                      name="agent.instructions"
                      minRows={4}
                      placeholder="Résume les éléments clé du bloc source."
                    />
                  </div>
                ) : (
                  <i>Automation désactivée</i>
                )
              }
            />

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button onClick={form.handleSubmit}>OK</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {hasAutomationEnabled && (
        <Button
          variant="outline"
          size={
            automationStatus === "working" && automationStepAlwaysVisible
              ? "default"
              : "icon"
          }
          className={cn("text-green-500 disabled:opacity-100")}
          onClick={() => {
            if (automationStatus === "working") return;
            handleTriggerAutomation();
          }}
        >
          {(automationStatus === "idle" || !automationStatus) && (
            <Tooltip>
              <TooltipTrigger>
                <TbPlayerPlayFilled />
              </TooltipTrigger>
              <TooltipContent>
                <p>Lancer l'automation</p>
              </TooltipContent>
            </Tooltip>
          )}
          {automationStatus === "working" &&
            (automationStepAlwaysVisible ? (
              <span className="flex gap-2">
                <Spinner />
                <p>{automationStep}</p>
              </span>
            ) : (
              <Tooltip>
                <TooltipTrigger>
                  <Spinner />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{automationStep}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          {automationStatus === "error" && <TbExclamationMark />}
        </Button>
      )}
    </ButtonGroup>
  );
}
