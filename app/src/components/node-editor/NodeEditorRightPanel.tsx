import { useFormikContext } from "formik";
import { useNodeEditorContext } from "../../hooks/useNodeEditorContext";
import { returnElementPathInLayout } from "../utils/editorUtils";
import type { LayoutElement } from "../../types";
import { get, values } from "lodash";
import { BsArrowRightSquare, BsArrowDownSquare } from "react-icons/bs";
import { LuAlignVerticalSpaceAround } from "react-icons/lu";
import { MdFlashAuto } from "react-icons/md";
import { TbArrowAutofitContent } from "react-icons/tb";

export default function NodeEditorRightPanel() {
  const { selectedElementId, currentVisualLayoutPath } = useNodeEditorContext();
  const { values } = useFormikContext<any>();
  const layout = get(values, currentVisualLayoutPath) as LayoutElement;
  const elementPath =
    currentVisualLayoutPath +
    "." +
    returnElementPathInLayout(layout, selectedElementId);

  function renderSettings() {
    if (selectedElementId?.startsWith("div-")) {
      return <DivElementSettings elementPath={elementPath} />;
    } else if (selectedElementId) {
      return <FieldElementSettings />;
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

function DivElementSettings({ elementPath }: { elementPath: string }) {
  const { values } = useFormikContext<any>();

  return (
    <div className="space-y-4 divide-y divide-gray-300">
      <div className="px-5 py-4 space-y-2">
        <h3 className="font-semibold">Disposition</h3>
        <div className="grid grid-cols-2 gap-2">
          <StyleClickButton
            elementPath={elementPath}
            styleName="flexDirection"
            styleValue="row"
            icon={<BsArrowRightSquare />}
            label="Horizontal"
          />
          <StyleClickButton
            elementPath={elementPath}
            styleName="flexDirection"
            styleValue="column"
            icon={<BsArrowDownSquare />}
            label="Vertical"
          />
        </div>
        <div className="flex items-center gap-2">
          <StyleClickButton
            elementPath={elementPath}
            styleName="justifyContent"
            styleValue="space-between"
            icon={<MdFlashAuto />}
          />
          <StyleClickButton
            elementPath={elementPath}
            styleName="justifyContent"
            styleValue="start"
            icon={<TbArrowAutofitContent />}
          />
          <StyleValueInput
            disabled={
              get(values, elementPath + ".style.justifyContent") ==
              "space-between"
            }
            elementPath={elementPath}
            styleName="gap"
            label="Espacement entre éléments"
            icon={<LuAlignVerticalSpaceAround />}
          />
        </div>
      </div>
    </div>
  );
}

function FieldElementSettings() {
  return "element";
}

function StyleClickButton({
  elementPath,
  styleName,
  styleValue,
  label,
  icon,
}: {
  elementPath: string;
  styleName: string;
  styleValue: string | number;
  label?: string | React.ReactNode;
  icon: React.ReactNode;
}) {
  const { values, setFieldValue } = useFormikContext<any>();
  const stylePath = elementPath + ".style." + styleName;
  const isActive = get(values, stylePath) === styleValue;

  return (
    <button
      type="button"
      className={`bg-gray-100 hover:bg-gray-200 flex items-center gap-1.5 rounded-md px-3 h-10 border-2 ${
        isActive ? " border-gray-500 font-medium" : "border-transparent"
      }`}
      onClick={() => setFieldValue(stylePath, styleValue)}
    >
      {icon} {label}
    </button>
  );
}

function StyleValueInput({
  elementPath,
  styleName,
  label,
  icon,
  valueType = "number",
  disabled,
}: {
  elementPath: string;
  styleName: string;
  label: string;
  icon: React.ReactNode;
  valueType?: "number" | "text";
  disabled?: boolean;
}) {
  const { values, setFieldValue } = useFormikContext<any>();
  const stylePath = elementPath + ".style." + styleName;

  const currentValue = get(values, stylePath);

  return (
    <div className="relative">
      <span className="absolute left-3 top-3">{icon}</span>
      <input
        disabled={disabled}
        className="bg-gray-100 not-disabled:hover:bg-gray-200 h-10 rounded-md w-full pl-10 pr-2 disabled:opacity-50 disabled:cursor-not-allowed "
        title={label}
        type={valueType}
        value={currentValue}
        onChange={(e) => setFieldValue(stylePath, e.target.value)}
      />
    </div>
  );
}
