import type { FieldDefinition } from "@/types/field.types";
import TextField from "./TextField";

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
          component: TextField,
          settingsList: [
            {
              key: "showLabel",
              label: "Afficher le label au dessus du champ",
              type: "boolean",
            },
          ],
        },
        commonSettingsList: [],
      },
      window: {
        default: {
          component: TextField,
          settingsList: [
            {
              key: "showLabel",
              label: "Afficher le label au dessus du champ",
              type: "boolean",
            },
          ],
        },
        commonSettingsList: [],
      },
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
    visuals: {
      node: {
        default: {
          component: TextField, // Temporaire, à remplacer par NumberField
          settingsList: [
            {
              key: "showLabel",
              label: "Afficher le label",
              type: "boolean",
            },
          ],
        },
        commonSettingsList: [],
      },
      window: {
        default: {
          component: TextField, // Temporaire
          settingsList: [],
        },
        commonSettingsList: [],
      },
    },
  },
  {
    label: "Date",
    type: "date",
    icon: HiMiniCalendarDateRange,
    description: "Sélecteur de date pour choisir une date spécifique.",
    visuals: {
      node: {
        default: {
          component: TextField, // Temporaire
          settingsList: [],
        },
        commonSettingsList: [],
      },
      window: {
        default: {
          component: TextField, // Temporaire
          settingsList: [],
        },
        commonSettingsList: [],
      },
    },
  },
  {
    label: "Case à cocher",
    type: "boolean",
    icon: HiOutlineCheckCircle,
    description: "Champ booléen pour des réponses oui/non ou vrai/faux.",
    visuals: {
      node: {
        default: {
          component: TextField, // Temporaire
          settingsList: [],
        },
        commonSettingsList: [],
      },
      window: {
        default: {
          component: TextField, // Temporaire
          settingsList: [],
        },
        commonSettingsList: [],
      },
    },
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
    visuals: {
      node: {
        default: {
          component: TextField, // Temporaire
          settingsList: [],
        },
        commonSettingsList: [],
      },
      window: {
        default: {
          component: TextField, // Temporaire
          settingsList: [],
        },
        commonSettingsList: [],
      },
    },
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
    visuals: {
      node: {
        default: {
          component: TextField, // Temporaire
          settingsList: [],
        },
        commonSettingsList: [],
      },
      window: {
        default: {
          component: TextField, // Temporaire
          settingsList: [],
        },
        commonSettingsList: [],
      },
    },
  },
];

export default fieldsDefinition;
