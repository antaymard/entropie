import { useFormikContext } from "formik";
import { getFieldFromId } from "../utils/editorUtils";

// Where the field element settings will be defined
export default function FieldElementSettings({
  elementPath,
  elementId,
}: {
  elementPath: string;
  elementId: string;
}) {
  const { values } = useFormikContext<any>();
  const { fieldDefinition, nodeField } = getFieldFromId(elementId, values); // Hypothetical hook to get field definitions

  return (
    <div className="space-y-4 divide-y divide-gray-300">
      <div className="px-5 py-4 space-y-2">
        <h3 className="font-semibold flex items-center gap-2">
          Paramètres de{" "}
          <span className="flex items-center gap-1 bg-gray-100 px-2 rounded-sm">
            {fieldDefinition?.icon && <fieldDefinition.icon />}
            {nodeField?.name}
          </span>
        </h3>

        <div>
          {fieldDefinition?.settings?.map((setting, i) => (
            // <setting.component key={i} />
            <div key={i}>Setting component placeholder</div>
          ))}
        </div>
      </div>
      <pre>{JSON.stringify(fieldDefinition, null, 2)}</pre>
      <pre>{JSON.stringify(nodeField, null, 2)}</pre>
    </div>
  );
}
