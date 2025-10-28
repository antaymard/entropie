import { useFormikContext } from "formik";
import { useNodeEditorContext } from "../../hooks/useNodeEditorContext";
import { returnElementPathInLayout } from "../utils/editorUtils";
import type { LayoutElement } from "../../types";
import { get } from "lodash";
import FieldElementSettings from "./FieldElementSettings";
import { DivElementSettings } from "./DivElementSettings";

export default function NodeEditorRightPanel() {
  const { selectedElementId, currentVisualLayoutPath } = useNodeEditorContext();
  const { values } = useFormikContext<any>();
  const layout = get(values, currentVisualLayoutPath) as LayoutElement;

  // Si le dernier caractère est un ".", on le retire
  const elementPath = (
    currentVisualLayoutPath +
    "." +
    returnElementPathInLayout(layout, selectedElementId ?? undefined)
  ).replace(/\.$/, "");

  function renderSettings() {
    if (selectedElementId?.startsWith("div-") || selectedElementId === "root") {
      return <DivElementSettings elementPath={elementPath} />;
    } else if (selectedElementId) {
      return (
        <FieldElementSettings
          elementPath={elementPath}
          elementId={selectedElementId}
        />
      );
    } else {
      return (
        <div className="px-5 py-4">
          <i className="text-sm opacity-60">
            Sélectionnez un élément pour modifier ses paramètres.
          </i>
        </div>
      );
    }
  }

  return <div className="border-l border-gray-300 ">{renderSettings()}</div>;
}
