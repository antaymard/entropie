import { useFormikContext } from "formik";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { RxDragHandleDots2 } from "react-icons/rx";
import { HiMiniTrash } from "react-icons/hi2";
import type { LayoutElement, NodeField, NodeTemplate } from "@/types/domain";
import type { FieldDefinition } from "@/types/ui";
import InlineEditableText from "@/components/form-ui/InlineEditableText";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/shadcn/popover";
import { HiOutlineCog } from "react-icons/hi";
import TextInput from "../form-ui/TextInput";
import Toggle from "../form-ui/Toggle";
import Toggles from "../form-ui/Toggles";
import { Button } from "../shadcn/button";
import { deleteElementFromLayout } from "../utils/editorUtils";
import { useNodeEditorContext } from "@/hooks/useNodeEditorContext";
import get from "lodash/get";
import SelectBuilder from "../form-ui/SelectBuilder";
import Selector from "../form-ui/Selector";

export default function FieldItemWithOptionsEdition({
  field,
  fieldDefinition,
}: {
  field: NodeField;
  fieldDefinition: FieldDefinition;
}) {
  const { values, setFieldValue } = useFormikContext<NodeTemplate>();

  const IconComponent = fieldDefinition.icon;

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `add_${field.id}`, // id for dndkit, not for db. Is different to avoid simultaneous drag bc conflits
      data: {
        element: { id: field.id, element: "field" } as LayoutElement,
        action: "add",
      },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
  };

  // Trouve l'index du champ dans le tableau pour construire le chemin Formik
  const fieldIndex = values.fields.findIndex((f) => f.id === field.id);

  return (
    <div className="relative">
      <div style={style}>
        <div className="rounded-md bg-gray-100 px-3 py-2 hover:bg-gray-200 flex items-center gap-2 cursor-grab active:cursor-grabbing">
          <div
            className="flex gap-2 items-center flex-1 min-w-0"
            ref={setNodeRef}
            {...attributes}
            {...listeners}
          >
            <RxDragHandleDots2 size={18} />
            {IconComponent && <IconComponent size={18} />}
            <InlineEditableText
              name={`fields.${fieldIndex}.name`}
              placeholder="Field name..."
              className="flex-1 truncate"
            />
          </div>
          <Popover>
            <PopoverTrigger>
              <HiOutlineCog size={16} />
            </PopoverTrigger>
            <PopoverContent align="start">
              <FieldOptions
                fieldIndex={fieldIndex}
                fieldDefinition={fieldDefinition}
                field={field}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Ce qui reste en place quand on drag l'élément. Clone visuel simplifié */}
      {isDragging && (
        <div className="absolute top-0 w-full">
          <div className="rounded-md bg-gray-100 px-3 py-2 hover:bg-gray-200 flex items-center gap-2 cursor-grab active:cursor-grabbing">
            <div className="flex gap-2 items-center flex-1 min-w-0">
              <RxDragHandleDots2 size={18} />
              {IconComponent && <IconComponent size={18} />}
              <InlineEditableText
                name={`fields.${fieldIndex}.name`}
                placeholder="Field name..."
                className="flex-1 truncate"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldOptions({
  fieldIndex,
  fieldDefinition,
  field,
}: {
  fieldIndex: number;
  fieldDefinition: FieldDefinition;
  field: NodeField;
}) {
  const { values, setFieldValue } = useFormikContext<NodeTemplate>();
  const { currentVisualLayoutPath } = useNodeEditorContext();

  function deleteNodeField(fieldId: string) {
    const updatedFields = values.fields.filter((f) => f.id !== fieldId);
    setFieldValue("fields", updatedFields);

    // Delete from layout if present
    const nodeVisualLayoutToEdit = get(
      values,
      currentVisualLayoutPath
    ) as LayoutElement;
    const updatedLayout = deleteElementFromLayout(
      fieldId,
      nodeVisualLayoutToEdit
    );
    setFieldValue(currentVisualLayoutPath, updatedLayout);
  }

  function renderOption(option, i) {
    switch (option.type) {
      case "input":
        return (
          <TextInput
            key={i}
            label={option.label}
            name={`fields.${fieldIndex}.options.${option.key}`}
            {...option.props}
          />
        );
      case "boolean":
        return (
          <Toggle
            key={i}
            name={`fields.${fieldIndex}.options.${option.key}`}
            label={option.label}
          />
        );
      case "toggleGroup":
        return (
          <Toggles
            key={i}
            name={`fields.${fieldIndex}.options.${option.key}`}
            label={option.label}
            {...option.props}
          />
        );
      case "selectBuilder":
        return (
          <SelectBuilder
            key={i}
            name={`fields.${fieldIndex}.options.${option.key}`}
            label={option.label}
            {...option.props}
          />
        );
      case "select":
        return (
          <Selector
            key={i}
            name={`fields.${fieldIndex}.options.${option.key}`}
            label={option.label}
            {...option.props}
          />
        );
      default:
        return "NOMATCH";
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-semibold">Field options</h2>
      {fieldDefinition.fieldOptions?.length &&
        fieldDefinition.fieldOptions?.map(renderOption)}

      <div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => deleteNodeField(field.id)}
        >
          <HiMiniTrash size={18} />
          Delete
        </Button>
      </div>
    </div>
  );
}
