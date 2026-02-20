import { useFormikContext } from "formik";
import get from "lodash/get";
import { BsArrowDownSquare, BsArrowRightSquare } from "react-icons/bs";
import { LuAlignVerticalSpaceAround } from "react-icons/lu";
import { MdFlashAuto } from "react-icons/md";
import { TbArrowAutofitContent } from "react-icons/tb";
import { RiMergeCellsVertical, RiMergeCellsHorizontal } from "react-icons/ri";
import { AiOutlineColumnWidth, AiOutlineColumnHeight } from "react-icons/ai";
import { StyleClickButton, StyleValueInput } from "./SettingsButtons";

export default function DivElementSettings({
  elementPath,
}: {
  elementPath: string;
}) {
  const { values } = useFormikContext<any>();

  return (
    <div className="divide-y divide-gray-300">
      <div className="px-5 py-4 space-y-3">
        <h3 className="font-semibold">Dimensions</h3>
        <div className="space-y-2">
          <h4 className="text-sm">Width/Height</h4>
          <div className="grid grid-cols-2 gap-2">
            <StyleValueInput
              elementPath={elementPath}
              styleName="width"
              label="Width"
              icon={<AiOutlineColumnWidth />}
            />
            <StyleValueInput
              elementPath={elementPath}
              styleName="height"
              label="Height"
              icon={<AiOutlineColumnHeight />}
            />
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm">Minimum dimensions</h4>
          <div className="grid grid-cols-2 gap-2">
            <StyleValueInput
              elementPath={elementPath}
              styleName="minWidth"
              label="Min width"
              icon={<AiOutlineColumnWidth />}
            />
            <StyleValueInput
              elementPath={elementPath}
              styleName="minHeight"
              label="Min height"
              icon={<AiOutlineColumnHeight />}
            />
          </div>
        </div>
      </div>
      <div className="px-5 py-4 space-y-4">
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
