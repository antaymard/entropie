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
import { StyleClickButton, StyleValueInput } from "./SettingsButtons";

export default function DivElementSettings({
  elementPath,
}: {
  elementPath: string;
}) {
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
        <p className="text-xs">TODO : ff ?</p>
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
