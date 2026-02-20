import { useFormikContext } from "formik";
import { useNodeEditorContext } from "../../hooks/useNodeEditorContext";
import { returnElementPathInLayout } from "../utils/editorUtils";
import type { LayoutElement } from "@/types/domain";
import get from "lodash/get";
import FieldElementVisualsSettings from "./FieldElementVisualsSettings";
import DivElementSettings from "./elements-settings/DivElementSettings";
import RootElementSettings from "./elements-settings/RootElementSettings";

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
    if (selectedElementId === "root") {
      return <RootElementSettings elementPath={elementPath} />;
    } else if (selectedElementId?.startsWith("div-")) {
      return <DivElementSettings elementPath={elementPath} />;
    } else if (selectedElementId) {
      return (
        <FieldElementVisualsSettings
          elementPath={elementPath}
          elementId={selectedElementId}
        />
      );
    } else {
      return (
        <div className="px-5 py-4">
          <i className="text-sm opacity-60">
            Select an element to edit its settings.
          </i>
        </div>
      );
    }
  }

  return <div className="border-l border-gray-300 ">{renderSettings()}</div>;
}
