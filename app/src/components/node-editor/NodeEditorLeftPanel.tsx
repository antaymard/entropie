import { useState } from "react";
import { useFormikContext } from "formik";
import TextArea from "../form-ui/TextArea";
import TextInput from "../form-ui/TextInput";
import type { NodeField, NodeTemplate } from "../../types";
import { HiMiniPlusCircle, HiCog8Tooth } from "react-icons/hi2";
import {
  fieldDefinitions,
  type FieldDefinition,
} from "../fields/fieldDefinitions";
import FieldSelectionDropdown from "./FieldSelectionDropdown";

// Where to describe the node, edit properties and set the fields for the node
export default function NodeEditorLeftPanel() {
  const [infoIsOpen, setInfoIsOpen] = useState<boolean>(true);
  const [fieldDropdownOpen, setFieldDropdownOpen] = useState<boolean>(false);

  const { values } = useFormikContext<NodeTemplate>();

  // Observe le champ "name" en temps réel
  const blockName = values.name;

  return (
    <div className="px-5 py-4 border-r-2 border-gray-300">
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
        {infoIsOpen ? "Infos générales" : blockName || "Nom du bloc"}
      </h3>
      {infoIsOpen && (
        <div className="flex flex-col gap-4">
          <TextInput
            label="Nom du bloc"
            name="name"
            required
            placeholder="Ex: Carte produit"
          />

          <TextArea
            label="Description"
            name="description"
            placeholder="Expliquer à quoi sert ce bloc..."
            minRows={5}
            maxRows={5}
          />
        </div>
      )}

      <div className="w-full border-t border-gray-300 my-5" />

      {/* Fields selection */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold ">Champs du bloc</h3>
          <div className="relative">
            <button
              type="button"
              title="Ajouter un champ"
              className=" bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm h-7 px-2 flex items-center justify-center"
              onClick={() => setFieldDropdownOpen(true)}
            >
              Ajouter <HiMiniPlusCircle className="ml-1" size={20} />
            </button>
            {fieldDropdownOpen && (
              <FieldSelectionDropdown
                setFieldDropdownOpen={setFieldDropdownOpen}
              />
            )}
          </div>
        </div>

        {/* Render de la liste des fields du node */}
        <div className="flex flex-col gap-1">
          {values.fields.length === 0 ? (
            <i onClick={() => setFieldDropdownOpen(true)}>Aucun champ ajouté</i>
          ) : (
            values.fields.map((field, i) => {
              // Trouve l'icône depuis fieldList (côté front uniquement)
              const fieldDefinition = fieldDefinitions.find(
                (f: FieldDefinition) => f.type === field.type
              );

              if (!fieldDefinition) return null;

              return (
                <FieldListItem
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

function FieldListItem({
  field,
  fieldDefinition,
}: {
  field: NodeField;
  fieldDefinition: FieldDefinition;
  icon?: React.ComponentType<{ size?: number }>;
}) {
  const IconComponent = fieldDefinition.icon;
  const { values, setFieldValue } = useFormikContext<NodeTemplate>();

  const [isRenaming, setIsRenaming] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string>(field.label);

  const handleRename = () => {
    // Trouve l'index du champ dans le tableau
    const fieldIndex = values.fields.findIndex((f) => f.id === field.id);
    if (fieldIndex !== -1 && tempName.trim() !== "") {
      setFieldValue(`fields.${fieldIndex}.label`, tempName.trim());
    }
    setIsRenaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleRename();
    } else if (e.key === "Escape") {
      setTempName(field.label);
      setIsRenaming(false);
    }
  };

  return (
    <div className="rounded-md bg-gray-100 px-3 py-2 hover:bg-gray-200 flex items-center justify-between">
      <div className="flex items-center justify-between flex-1">
        <div className="flex gap-2 items-center">
          {IconComponent && <IconComponent size={18} />}
          {isRenaming ? (
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={handleKeyDown}
              autoFocus
              className="outline-none"
            />
          ) : (
            <p
              className="cursor-text"
              onDoubleClick={() => setIsRenaming(true)}
            >
              {field.label}
            </p>
          )}
        </div>
        <button type="button">
          <HiCog8Tooth size={20} />
        </button>
      </div>
    </div>
  );
}
