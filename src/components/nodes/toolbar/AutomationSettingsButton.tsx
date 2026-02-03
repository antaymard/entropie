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
import { TbBolt } from "react-icons/tb";
import { useForm } from "@tanstack/react-form";
import Selector from "@/components/ts-form/Selector";
import { cn } from "@/lib/utils";

const sectionClassName = "flex flex-col gap-2";

export default function AutomationSettingsButton({ xyNode }: { xyNode: Node }) {
  const form = useForm({
    defaultValues: {
      automationMode: "off",
      dependencies: [],
      agent: {
        model: "small",
        instructions: "",
        touchableFields: [],
      },
      dataProcessing: [],
    },
    onSubmit: ({ value }) => {
      console.log("Form submitted with values:", value);
    },
  });

  function renderConnectedNodes(type: "source" | "target") {}

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <TbBolt />
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
          <div className={cn(sectionClassName)}>
            <h2 className="font-bold">Blocs sources</h2>
            {renderConnectedNodes("source")}
          </div>
        </>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Annuler</Button>
          </DialogClose>
          <Button onClick={form.handleSubmit}>Valider</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
