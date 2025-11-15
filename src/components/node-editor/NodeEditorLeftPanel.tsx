import { useState } from "react";
import { useFormikContext } from "formik";
import TextArea from "../form-ui/TextArea";
import TextInput from "../form-ui/TextInput";
import type { LayoutElement, NodeField, NodeTemplate } from "../../types";
import { HiMiniPlusCircle, HiMiniTrash } from "react-icons/hi2";
import { RxDragHandleDots2 } from "react-icons/rx";

import {
  fieldDefinitions,
  type FieldDefinition,
} from "../_fields/fieldDefinitions";
import FieldSelectionDropdown from "./FieldSelectionDropdown";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

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
  const [tempName, setTempName] = useState<string>(field.name);

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

  const handleRename = () => {
    // Trouve l'index du champ dans le tableau
    const fieldIndex = values.fields.findIndex((f) => f.id === field.id);
    if (fieldIndex !== -1 && tempName.trim() !== "") {
      setFieldValue(`fields.${fieldIndex}.name`, tempName.trim());
    }
    setIsRenaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleRename();
    } else if (e.key === "Escape") {
      setTempName(field.name);
      setIsRenaming(false);
    }
  };

  // Here goes the component JSX, here because used in two places (normal and drag preview)
  const component = (
    <div className="group rounded-md bg-gray-100 px-3 py-2 hover:bg-gray-200 flex items-center gap-2 cursor-grab active:cursor-grabbing">
      <div className="flex gap-2 items-center flex-1 min-w-0">
        <RxDragHandleDots2 size={18} />
        {IconComponent && <IconComponent size={18} />}
        {isRenaming ? (
          <input
            type="text"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={handleKeyDown}
            autoFocus
            className="outline-none flex-1"
          />
        ) : (
          <p
            className="cursor-text truncate flex-1"
            onDoubleClick={() => setIsRenaming(true)}
          >
            {field.name}
          </p>
        )}
      </div>
      <button
        type="button"
        className="shrink-0 group-hover:block hidden hover:text-pink-400 text-gray-400"
        onClick={() => deleteNodeField(field.id)}
      >
        <HiMiniTrash size={18} />
      </button>
    </div>
  );

  return (
    <div className="relative">
      <div ref={setNodeRef} {...attributes} {...listeners} style={style}>
        {component}
      </div>
      {isDragging && <div className="absolute top-0 w-full">{component}</div>}
    </div>
  );
}
