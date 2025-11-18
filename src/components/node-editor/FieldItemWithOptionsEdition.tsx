import { useFormikContext } from "formik";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { RxDragHandleDots2 } from "react-icons/rx";
import { HiMiniTrash } from "react-icons/hi2";
import type { LayoutElement, NodeField, NodeTemplate } from "../../types";
import type { FieldDefinition } from "@/types/field.types";
import InlineEditableText from "@/components/common/InlineEditableText";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/shadcn/popover";
import { HiOutlineCog } from "react-icons/hi";
import TextInput from "../form-ui/TextInput";

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

  function deleteNodeField(fieldId: string) {
    const updatedFields = values.fields.filter((f) => f.id !== fieldId);
    setFieldValue("fields", updatedFields);
  }

  // Trouve l'index du champ dans le tableau pour construire le chemin Formik
  const fieldIndex = values.fields.findIndex((f) => f.id === field.id);

  // Here goes the component JSX, here because used in two places (normal and drag preview)
  const component = (
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
          placeholder="Nom du champ..."
          className="flex-1 truncate"
        />
      </div>
      <Popover>
        <PopoverTrigger>
          <HiOutlineCog size={16} />
        </PopoverTrigger>
        <PopoverContent align="start" data-no-dnd="true">
          <FieldOptions
            fieldIndex={fieldIndex}
            fieldDefinition={fieldDefinition}
            field={field}
          />
        </PopoverContent>
      </Popover>
    </div>
  );

  return (
    <div className="relative">
      <div style={style}>{component}</div>
      {isDragging && (
        <div className="absolute top-0 w-full">
          <div className="rounded-md bg-gray-100 px-3 py-2 hover:bg-gray-200 flex items-center gap-2 cursor-grab active:cursor-grabbing">
            <div className="flex gap-2 items-center flex-1 min-w-0">
              <RxDragHandleDots2 size={18} />
              {IconComponent && <IconComponent size={18} />}
              <InlineEditableText
                name={`fields.${fieldIndex}.name`}
                placeholder="Nom du champ..."
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
  console.log(fieldDefinition);

  function renderOption(option, i) {
    switch (option.type) {
      case "text":
      case "string":
        return (
          <TextInput
            key={i}
            label={option.label}
            name={`fields.${fieldIndex}.options.${option.key}`}
          />
        );
      default:
        return "NOMATCH";
    }
  }

  return (
    <div>
      {fieldDefinition.optionsList?.length &&
        fieldDefinition.optionsList?.map(renderOption)}
    </div>
  );
}

{
  /* <button
  type="button"
  className="shrink-0hover:text-pink-400 text-gray-400"
  onClick={() => deleteNodeField(field.id)}
>
  <HiMiniTrash size={18} />
</button>; */
}
