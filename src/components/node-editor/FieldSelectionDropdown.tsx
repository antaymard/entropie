import { useFormikContext } from "formik";
import type { NodeField, NodeTemplate } from "../../types";
import {
  fieldDefinitions,
  type FieldDefinition,
} from "../_fields/fieldDefinitions";

interface FieldSelectionDropdownProps {
  setFieldDropdownOpen?: (open: boolean) => void;
}

export default function FieldSelectionDropdown({
  setFieldDropdownOpen,
}: FieldSelectionDropdownProps) {
  const { values, setFieldValue } = useFormikContext<NodeTemplate>();

  // Add field to the formik values
  function addField(newField: NodeField) {
    setFieldValue("fields", [...values.fields, newField]);
  }

  const fieldsOptions = fieldDefinitions.map((field: FieldDefinition) => ({
    ...field,
    onclick: () =>
      addField({
        id: crypto.randomUUID(),
        name: field.label,
        type: field.type,
        options: field.options,
      }),
  }));

  return (
    <div className="absolute bg-white border-2 border-gray-300 rounded-lg shadow-lg -right-72 w-72 divide-y overflow-clip">
      {fieldsOptions.map((field, i) => {
        const Icon = field.icon;
        return (
          <div
            key={i}
            className="p-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
            onClick={() => {
              field.onclick?.();
              setFieldDropdownOpen?.(false);
            }}
          >
            <div className="space-y-1">
              <span className="flex items-center gap-2">
                {Icon && <Icon size={18} />}
                <p className="font-medium">{field.label}</p>
              </span>
              <p className="text-xs italic opacity-70">{field.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
