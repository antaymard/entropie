import { memo, useState } from "react";
import type { Node } from "@xyflow/react";
import NodeFrame from "../NodeFrame";
import CanvasNodeToolbar from "../toolbar/CanvasNodeToolbar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { TbNumbers } from "react-icons/tb";
import { useUpdateNodeDataValues } from "@/hooks/useUpdateNodeDataValues";
import { useNodeDataValues } from "@/hooks/useNodeDataValues";
import type { Id } from "@/../convex/_generated/dataModel";

export type NumberValueType = {
  number: number | null;
  unit: string;
  label: string;
};

const defaultValue: NumberValueType = {
  number: null,
  unit: "",
  label: "",
};

function NumberNode(xyNode: Node) {
  const nodeDataId = xyNode.data?.nodeDataId as Id<"nodeDatas"> | undefined;
  const values = useNodeDataValues(nodeDataId);
  const { updateNodeDataValues } = useUpdateNodeDataValues();

  const [inputNumber, setInputNumber] = useState("");
  const [inputUnit, setInputUnit] = useState("");
  const [inputLabel, setInputLabel] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const numberValue =
    (values?.number as NumberValueType | undefined) ?? defaultValue;

  const handleSave = () => {
    if (!nodeDataId) return;

    const parsedNumber = inputNumber.trim()
      ? parseFloat(inputNumber.trim())
      : null;

    updateNodeDataValues({
      nodeDataId,
      values: {
        number: {
          number: parsedNumber,
          unit: inputUnit.trim(),
          label: inputLabel.trim(),
        },
      },
    });
    setIsPopoverOpen(false);
  };

  const handlePopoverOpenChange = (open: boolean) => {
    setIsPopoverOpen(open);
    if (open) {
      setInputNumber(
        numberValue.number !== null ? String(numberValue.number) : "",
      );
      setInputUnit(numberValue.unit);
      setInputLabel(numberValue.label);
    }
  };

  const hasContent = numberValue.number !== null;
  const hasUnit = numberValue.unit.length > 0;
  const hasLabel = numberValue.label.length > 0;

  return (
    <>
      <CanvasNodeToolbar xyNode={xyNode}>
        <Popover open={isPopoverOpen} onOpenChange={handlePopoverOpenChange}>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <TbNumbers />
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <div className="flex flex-col gap-2">
              <Input
                onDoubleClick={(e) => e.stopPropagation()}
                type="number"
                placeholder="Nombre"
                value={inputNumber}
                onChange={(e) => setInputNumber(e.target.value)}
              />
              <Input
                onDoubleClick={(e) => e.stopPropagation()}
                type="text"
                placeholder="Unité (kg, €, %...)"
                value={inputUnit}
                onChange={(e) => setInputUnit(e.target.value)}
              />
              <Input
                onDoubleClick={(e) => e.stopPropagation()}
                type="text"
                placeholder="Label"
                value={inputLabel}
                onChange={(e) => setInputLabel(e.target.value)}
              />
              <Button onClick={handleSave} size="sm">
                Valider
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </CanvasNodeToolbar>
      <NodeFrame xyNode={xyNode}>
        <div className="flex flex-col items-center justify-center h-full px-2">
          {hasContent ? (
            <>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{numberValue.number}</span>
                {hasUnit && (
                  <span className="text-sm text-muted-foreground">
                    {numberValue.unit}
                  </span>
                )}
              </div>
              {hasLabel && (
                <span className="text-sm text-muted-foreground">
                  {numberValue.label}
                </span>
              )}
            </>
          ) : (
            <span className="text-muted-foreground flex items-center gap-2">
              <TbNumbers size={18} />
              Pas de nombre
            </span>
          )}
        </div>
      </NodeFrame>
    </>
  );
}

export default memo(NumberNode);
