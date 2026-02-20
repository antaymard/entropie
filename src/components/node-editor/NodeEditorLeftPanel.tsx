import { useState } from "react";
import { useFormikContext } from "formik";
import TextArea from "../form-ui/TextArea";
import TextInput from "../form-ui/TextInput";
import type { NodeTemplate } from "@/types/domain";
import { HiMiniPlusCircle } from "react-icons/hi2";

import FieldSelectionDropdown from "./FieldSelectionDropdown";
import fieldsDefinition from "../fields/fieldsDefinition";
import FieldItemWithOptionsEdition from "./FieldItemWithOptionsEdition";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../shadcn/dropdown-menu";
import { Button } from "../shadcn/button";

// Where to describe the node, edit properties and set the fields for the node
export default function NodeEditorLeftPanel() {
  const [infoIsOpen, setInfoIsOpen] = useState<boolean>(true);
  const [fieldDropdownOpen, setFieldDropdownOpen] = useState<boolean>(false);

  const { values } = useFormikContext<NodeTemplate>();

  // Observe le champ "name" en temps réel
  const blockName = values.name;

  return (
    <div className="px-5 py-4 border-r border-gray-300">
      {fieldDropdownOpen && (
        <div
          className="absolute inset-0"
          onClick={() => setFieldDropdownOpen(false)}
        />
      )}
      <h3
        className="font-semibold mb-4 cursor-pointer hover:text-gray-700"
        onClick={() => setInfoIsOpen(!infoIsOpen)}
      >
        {infoIsOpen ? "General info" : blockName || "Block name"}
      </h3>
      {infoIsOpen && (
        <div className="flex flex-col gap-4">
          <TextInput
            label="Block name"
            name="name"
            required
            placeholder="E.g.: Product card"
          />

          <TextArea
            label="Description"
            name="description"
            placeholder="Explain what this block is for..."
            minRows={5}
            maxRows={5}
          />
        </div>
      )}

      <div className="w-full border-t border-gray-300 my-5" />

      {/* Fields selection */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold ">Block fields</h3>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button size="sm">
                Add <HiMiniPlusCircle className="ml-1" size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <FieldSelectionDropdown />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Render de la liste des fields du node */}
        <div className="flex flex-col gap-1">
          {values.fields.length === 0 ? (
            <i>No fields added</i>
          ) : (
            values.fields.map((field, i) => {
              // Trouve l'icône depuis fieldList (côté front uniquement)
              const fieldDefinition = fieldsDefinition.find(
                (f) => f.type === field.type
              );

              if (!fieldDefinition) return null;

              return (
                <FieldItemWithOptionsEdition
                  key={i}
                  field={field}
                  fieldDefinition={fieldDefinition}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
