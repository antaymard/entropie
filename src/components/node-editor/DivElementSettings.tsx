import { useFormikContext } from "formik";
import { get } from "lodash";
import { BsArrowDownSquare, BsArrowRightSquare } from "react-icons/bs";
import { LuAlignVerticalSpaceAround } from "react-icons/lu";
import { MdFlashAuto } from "react-icons/md";
import {
  TbArrowAutofitContent,
  TbBoxAlignBottom,
  TbBoxAlignLeft,
  TbBoxAlignRight,
  TbBoxAlignTop,
} from "react-icons/tb";
import { AiOutlineColumnWidth, AiOutlineColumnHeight } from "react-icons/ai";

export function DivElementSettings({ elementPath }: { elementPath: string }) {
  const { values } = useFormikContext<any>();

  return (
    <div className="divide-y divide-gray-300">
      <div className="px-5 py-4 space-y-2">
        <h3 className="font-semibold">Dimensions</h3>
        <div className="grid grid-cols-2 gap-2">
          <StyleValueInput
            elementPath={elementPath}
            styleName="width"
            label="Largeur"
            icon={<AiOutlineColumnWidth />}
          />
          <StyleValueInput
            elementPath={elementPath}
            styleName="height"
            label="Hauteur"
            icon={<AiOutlineColumnHeight />}
          />
        </div>
        <p className="text-xs">TODO : Redimensionnable ?</p>
      </div>
      <div className="px-5 py-4 space-y-4">
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

        {/* Gestion des paddings */}
        <div className="space-y-2">
          <h4>Marges intérieures</h4>
          <div className="grid grid-cols-4 gap-2">
            <StyleValueInput
              elementPath={elementPath}
              styleName="paddingTop"
              label="Espacement entre éléments"
              icon={<TbBoxAlignTop />}
            />
            <StyleValueInput
              elementPath={elementPath}
              styleName="paddingRight"
              label="Espacement entre éléments"
              icon={<TbBoxAlignRight />}
            />
            <StyleValueInput
              elementPath={elementPath}
              styleName="paddingLeft"
              label="Espacement entre éléments"
              icon={<TbBoxAlignLeft />}
            />
            <StyleValueInput
              elementPath={elementPath}
              styleName="paddingBottom"
              label="Espacement entre éléments"
              icon={<TbBoxAlignBottom />}
            />
          </div>
          <p className="text-xs">
            TODO : changer tout à la fois ou individuellement ?
          </p>
        </div>
      </div>
    </div>
  );
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
  unit = "px",
}: {
  elementPath: string;
  styleName: string;
  label: string;
  icon: React.ReactNode;
  valueType?: "number" | "text";
  disabled?: boolean;
  unit?: string;
}) {
  const { values, setFieldValue } = useFormikContext<any>();
  const stylePath = elementPath + ".style." + styleName;

  const currentValue = get(values, stylePath) || "0";

  return (
    <div className="relative">
      <span className="absolute left-3 top-3">{icon}</span>
      <input
        disabled={disabled}
        className="bg-gray-100 not-disabled:hover:bg-gray-200 h-10 rounded-md w-full pl-10 pr-2 disabled:opacity-50 disabled:cursor-not-allowed "
        title={label}
        type={valueType}
        value={String(currentValue)?.replace(unit, "") || 0}
        onChange={(e) =>
          setFieldValue(stylePath, String(e.target.value) + unit)
        }
      />
    </div>
  );
}
