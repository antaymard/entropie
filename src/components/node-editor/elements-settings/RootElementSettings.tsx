import { useFormikContext } from "formik";
import { get } from "lodash";
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
import { StyleClickButton, StyleValueInput } from "./SettingsButtons";
import Toggle from "@/components/form-ui/Toggle";

export default function DivElementSettings({
  elementPath,
}: {
  elementPath: string;
}) {
  const { values } = useFormikContext<any>();

  return (
    <div className="divide-y divide-gray-300">
      <div className="px-5 py-4 space-y-5">
        <h3 className="font-semibold">Apparence du bloc</h3>
        <Toggle
          label="Afficher le nom du bloc"
          name={`${elementPath}.data.headerless`}
        />
        <Toggle
          label="Désactiver l'ouverture de la fenêtre au double-clic"
          name={`${elementPath}.data.disableDoubleClickToOpenWindow`}
        />
      </div>
      <div className="px-5 py-4 space-y-5">
        <h3 className="font-semibold">Dimensions minimales du bloc</h3>
        <div className="grid grid-cols-2 gap-2">
          <StyleValueInput
            elementPath={elementPath}
            styleName="minWidth"
            label="Largeur"
            icon={<AiOutlineColumnWidth />}
          />
          <StyleValueInput
            elementPath={elementPath}
            styleName="minHeight"
            label="Hauteur"
            icon={<AiOutlineColumnHeight />}
          />
        </div>
        <Toggle
          label="Redimensionnable"
          name={`${elementPath}.data.resizable`}
        />
      </div>
      <div className="px-5 py-4 space-y-5">
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
          <div className="grid grid-cols-2 gap-2">
            <StyleValueInput
              elementPath={elementPath}
              styleName={["paddingTop", "paddingBottom"]}
              label="Marges verticales"
              icon={<RiMergeCellsVertical />}
            />
            <StyleValueInput
              elementPath={elementPath}
              styleName={["paddingLeft", "paddingRight"]}
              label="Marges horizontales"
              icon={<RiMergeCellsHorizontal />}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
