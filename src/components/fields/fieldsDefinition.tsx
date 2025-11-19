import type { FieldDefinition } from "@/types/field.types";

import { RiTextBlock } from "react-icons/ri";
import { GoNumber } from "react-icons/go";
import {
  HiOutlineStar,
  HiOutlineCurrencyEuro,
  HiMiniCalendarDateRange,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
import { RxSlider } from "react-icons/rx";
import { TbSelect } from "react-icons/tb";
import { CgImage } from "react-icons/cg";

// Helper pour simplifier les imports dynamiques de composants
const lazyField = (path: string) => () =>
  import(/* @vite-ignore */ path).then((mod) => mod.default);

const fieldsDefinition: FieldDefinition[] = [
  {
    label: "Texte court",
    type: "short_text",
    icon: RiTextBlock,
    description: "Texte court et non formatté. Pratique pour les titres.",
    fieldOptions: [
      {
        key: "placeholder",
        label: "Placeholder (affiché dans le champ vide)",
        type: "input",
      },
      {
        key: "defaultValue",
        label: "Valeur par défaut",
        type: "input",
      },
      {
        key: "showLabel",
        label: "Afficher le label au dessus du champ",
        type: "boolean",
      },
      {
        key: "displayAs",
        label: "Formattage du texte",
        type: "toggleGroup",
        props: {
          type: "single",
          options: [
            { value: "h1", label: "h1" },
            { value: "h2", label: "h2" },
            { value: "h3", label: "h3" },
            { value: "p", label: "Paragraphe" },
          ],
        },
      },
    ],
    visuals: {
      node: {
        default: {
          component: lazyField("@/components/fields/TextField"),
          props: {},
          settingsList: [], // Ce qui peut être configuré dans le nodeEditorRightPanel, quand ce variant est choisi (affichage notamment)
        },
        commonSettingsList: [], // Affiché pour tous les visuels node
      },
      window: {},
    },
  },
  {
    label: "Nombre",
    type: "number",
    icon: GoNumber,
    description: "Champ pour saisir des valeurs numériques.",
    fieldOptions: [
      {
        key: "displayAs",
        label: "Formattage du nombre",
        type: "select",
        props: {
          options: [
            {
              value: "number",
              label: (
                <>
                  <GoNumber /> Nombre entier
                </>
              ),
            },
            {
              value: "rating",
              label: (
                <>
                  <HiOutlineStar /> Note
                </>
              ),
            },
            {
              value: "currency",
              label: (
                <>
                  <HiOutlineCurrencyEuro /> Monétaire
                </>
              ),
            },
            {
              value: "slider",
              label: (
                <>
                  <RxSlider /> Curseur
                </>
              ),
            },
          ],
        },
      },
      {
        key: "placeholder",
        label: "Placeholder (affiché dans le champ vide)",
        type: "input",
      },
      {
        key: "showLabel",
        label: "Afficher le label au dessus du champ",
        type: "boolean",
      },
      {
        key: "defaultValue",
        label: "Valeur par défaut",
        type: "input",
        props: {
          type: "number",
        },
      },
      {
        key: "minValue",
        label: "Valeur minimale",
        type: "input",
        props: {
          type: "number",
        },
      },
      {
        key: "maxValue",
        label: "Valeur maximale",
        type: "input",
        props: {
          type: "number",
        },
      },
    ],
  },
  {
    label: "Date",
    type: "date",
    icon: HiMiniCalendarDateRange,
    description: "Sélecteur de date pour choisir une date spécifique.",
  },
  {
    label: "Case à cocher",
    type: "boolean",
    icon: HiOutlineCheckCircle,
    description: "Champ booléen pour des réponses oui/non ou vrai/faux.",
  },
  {
    label: "Sélecteur",
    type: "select",
    icon: TbSelect,
    description:
      "Champ pour sélectionner une ou plusieurs options parmi une liste déroulante.",
    fieldOptions: [
      {
        key: "isMultipleSelect",
        label: "Autoriser les choix multiples",
        type: "boolean",
      },
      {
        key: "selectChoices",
        label: "Choix disponibles",
        type: "selectBuilder",
      },
    ],
  },
  {
    label: "Image",
    type: "image",
    icon: CgImage,
    description: "Champ pour insérer une image.",
    fieldOptions: [
      {
        key: "imageSource",
        label: "Source de l'image",
        type: "select",
        props: {
          options: [
            { value: "upload", label: "Téléchargement" },
            { value: "url", label: "URL" },
            { value: "any", label: "Les deux" },
          ],
        },
      },
    ],
  },
];

export default fieldsDefinition;
