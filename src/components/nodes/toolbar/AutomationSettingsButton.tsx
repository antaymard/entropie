import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/shadcn/dialog";
import type { Node } from "@xyflow/react";
import { TbBolt, TbBoltFilled } from "react-icons/tb";
import { useForm } from "@tanstack/react-form";
import Selector from "@/components/ts-form/Selector";
import { cn } from "@/lib/utils";
import { useConnectedNodes } from "@/hooks/useConnectedNodes";
import TextArea from "@/components/ts-form/TextArea";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import toast from "react-hot-toast";
import { useState } from "react";
import type { NodeData } from "@/types/node.types";
import { useNodeData } from "@/hooks/useNodeData";

const sectionClassName = "flex flex-col gap-2";

export default function AutomationSettingsButton({ xyNode }: { xyNode: Node }) {
  const updateAutomationSettings = useMutation(
    api.nodeDatas.updateAutomationSettings,
  );
  const [open, setOpen] = useState(false);

  const nodeDataId = xyNode.data?.nodeDataId as Id<"nodeDatas"> | undefined;
  const nodeData = useNodeData(nodeDataId);
  const sourceNodes = useConnectedNodes("source");

  const form = useForm({
    defaultValues: {
      automationMode: (nodeData?.automationMode || "off") as
        | "agent"
        | "dataProcessing"
        | "off",
      dependencies:
        nodeData?.dependencies ||
        (sourceNodes.length > 0
          ? (sourceNodes
              .map(({ nodeData }) => ({
                nodeDataId: nodeData?._id,
                type: "input" as const,
              }))
              .filter((dep) => dep.nodeDataId != null) as {
              nodeDataId: Id<"nodeDatas">;
              type: "input";
            }[])
          : []),
      agent: {
        model: nodeData?.agent?.model || "small",
        instructions: nodeData?.agent?.instructions || "",
        touchableFields: nodeData?.agent?.touchableFields || [],
      },
      dataProcessing: nodeData?.dataProcessing || [],
    } as Pick<
      NodeData,
      "automationMode" | "agent" | "dataProcessing" | "dependencies"
    >,
    onSubmit: async ({ value }) => {
      if (!nodeDataId) return toast.error("Le nodeDataId est manquant.");
      await updateAutomationSettings({
        _id: nodeDataId,
        ...value,
      });
      return setOpen(false);
    },
  });

  const hasAutomationEnabled = nodeData && nodeData.automationMode !== "off";

  return (
    <Dialog
      open={open}
      onOpenChange={(e) => {
        setOpen(e);
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn(hasAutomationEnabled && "text-amber-500")}
        >
          {hasAutomationEnabled ? <TbBoltFilled /> : <TbBolt />}
        </Button>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="flex flex-row items-center justify-between ">
          <DialogTitle>Automation</DialogTitle>
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
        </DialogHeader>

        <>
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
        </>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Annuler</Button>
          </DialogClose>
          <Button onClick={form.handleSubmit}>OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
