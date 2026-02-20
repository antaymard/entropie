import { useFormikContext } from "formik";
import get from "lodash/get";
import { BsArrowDownSquare, BsArrowRightSquare } from "react-icons/bs";
import { LuAlignVerticalSpaceAround } from "react-icons/lu";
import { MdFlashAuto } from "react-icons/md";
import {
  TbArrowAutofitContent,
  TbBoxAlignRight,
  TbBoxAlignTop,
} from "react-icons/tb";
import { RiMergeCellsVertical, RiMergeCellsHorizontal } from "react-icons/ri";
import { AiOutlineColumnWidth, AiOutlineColumnHeight } from "react-icons/ai";
import { StyleClickButton, StyleValueInput, ValueInput } from "./SettingsButtons";
import Toggle from "@/components/form-ui/Toggle";

export default function RootElementSettings({
  elementPath,
}: {
  elementPath: string;
}) {
  const { values } = useFormikContext<any>();
  const visualType = elementPath.includes("visuals.window") ? "window" : "node";

  return (
    <div className="divide-y divide-gray-300">
      {visualType === "node" && (
        <>
          <div className="px-5 py-4 space-y-5">
            <h3 className="font-semibold">Block appearance</h3>
            <Toggle
              label="Show block name"
              name={`${elementPath}.data.headerless`}
            />
            <Toggle
              label="Disable opening window on double-click"
              name={`${elementPath}.data.disableDoubleClickToOpenWindow`}
            />
          </div>
          <div className="px-5 py-4 space-y-5">
            <h3 className="font-semibold">Default block dimensions</h3>
            <div className="grid grid-cols-2 gap-2">
              <ValueInput
                elementPath={elementPath}
                propertyName="defaultWidth"
                label="Width"
                icon={<AiOutlineColumnWidth />}
                targetType="data"
              />
              <ValueInput
                elementPath={elementPath}
                propertyName="defaultHeight"
                label="Height"
                icon={<AiOutlineColumnHeight />}
                targetType="data"
              />
            </div>
            <Toggle
              label="Resizable"
              name={`${elementPath}.data.resizable`}
            />
          </div>
        </>
      )}
      <div className="px-5 py-4 space-y-5">
        <h3 className="font-semibold">Layout</h3>
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
            label="Spacing between elements"
            icon={<LuAlignVerticalSpaceAround />}
          />
        </div>

        {/* Gestion des paddings */}
        <div className="space-y-2">
          <h4>Inner margins</h4>
          <div className="grid grid-cols-2 gap-2">
            <StyleValueInput
              elementPath={elementPath}
              styleName={["paddingTop", "paddingBottom"]}
              label="Vertical margins"
              icon={<RiMergeCellsVertical />}
            />
            <StyleValueInput
              elementPath={elementPath}
              styleName={["paddingLeft", "paddingRight"]}
              label="Horizontal margins"
              icon={<RiMergeCellsHorizontal />}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
