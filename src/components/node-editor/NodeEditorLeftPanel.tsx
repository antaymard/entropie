import { useState } from "react";
import { useFormikContext } from "formik";
import TextArea from "../form-ui/TextArea";
import TextInput from "../form-ui/TextInput";
import type { NodeTemplate } from "../../types";
import { HiMiniPlusCircle } from "react-icons/hi2";

import FieldSelectionDropdown from "./FieldSelectionDropdown";
import fieldsDefinition from "../fields/fieldsDefinition";
import FieldItemWithOptionsEdition from "./FieldItemWithOptionsEdition";

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
