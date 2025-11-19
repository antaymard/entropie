import { useFormikContext } from "formik";
import { get } from "lodash";
import { getFieldFromId } from "../utils/editorUtils";
import TextInput from "../form-ui/TextInput";
import Toggle from "../form-ui/Toggle";
import Toggles from "../form-ui/Toggles";
import SelectBuilder from "../form-ui/SelectBuilder";
import Selector from "../form-ui/Selector";
import type { FieldSettingOption } from "@/types/field.types";
import type { LayoutElement, NodeTemplate } from "@/types/node.types";

export default function FieldElementVisualSettings({
  elementPath,
  elementId,
}: {
  elementPath: string;
  elementId: string;
}) {
  const { values } = useFormikContext<NodeTemplate>();
  const { fieldDefinition, nodeField } = getFieldFromId(elementId, values);

  if (!fieldDefinition || !nodeField) {
    return (
      <div className="px-5 py-4">
        <p className="text-sm text-gray-500">
          Impossible de charger les paramètres pour ce champ.
        </p>
      </div>
    );
  }

  const visualType = elementPath.includes("visuals.window") ? "window" : "node";
  const visualConfig = fieldDefinition.visuals?.[visualType]?.default;
  const settingsList = visualConfig?.settingsList || [];
  const commonSettingsList =
    fieldDefinition.visuals?.[visualType]?.commonSettingsList || [];
  const allSettings = [...settingsList, ...commonSettingsList];
  const layoutElement = get(values, elementPath) as LayoutElement | undefined;
  const currentSettings = layoutElement?.visual?.settings || {};

  function renderSetting(setting: FieldSettingOption, index: number) {
    const settingPath = `${elementPath}.visual.settings.${setting.key}`;

    switch (setting.type) {
      case "input":
        return (
          <TextInput
            key={index}
            label={setting.label}
            name={settingPath}
            {...(setting.props as Record<string, unknown>)}
          />
        );
      case "boolean":
        return <Toggle key={index} name={settingPath} label={setting.label} />;
      case "toggleGroup": {
        const props = setting.props as {
          type?: "single" | "multiple";
          options?: Array<{ value: string; label: string }>;
        };
        return (
          <Toggles
            key={index}
            name={settingPath}
            label={setting.label}
            type={props?.type || "single"}
            options={props?.options || []}
          />
        );
      }
      case "selectBuilder":
        return (
          <SelectBuilder key={index} name={settingPath} label={setting.label} />
        );
      case "select": {
        const props = setting.props as {
          options?: Array<{ value: string; label: string }>;
        };
        return (
          <Selector
            key={index}
            name={settingPath}
            label={setting.label}
            options={props?.options || []}
          />
        );
      }
      default:
        return null;
    }
  }

  return (
    <div className="space-y-4 divide-y divide-gray-300">
      <div className="px-5 py-4 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          Paramètres visuels de{" "}
          <span className="flex items-center gap-1 bg-gray-100 px-2 rounded-sm">
            {fieldDefinition.icon && <fieldDefinition.icon />}
            {nodeField.name}
          </span>
        </h3>

        {allSettings.length > 0 ? (
          <div className="space-y-3">
            {allSettings.map((setting, index) => renderSetting(setting, index))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">
            Aucun paramètre visuel configurable pour ce champ.
          </p>
        )}
      </div>

      {import.meta.env.DEV && (
        <>
          <div className="px-5 py-4">
            <details className="text-xs">
              <summary className="cursor-pointer font-medium">
                Debug: Settings actuels
              </summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                {JSON.stringify(currentSettings, null, 2)}
              </pre>
            </details>
          </div>
        </>
      )}
    </div>
  );
}
