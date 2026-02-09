import type { FieldDefinition } from "@/types/ui";
import TextField from "./TextField";
import { RiTextBlock, RiAttachment2, RiFileList3Line } from "react-icons/ri";
import { GoNumber } from "react-icons/go";
import { HiOutlineCheckCircle } from "react-icons/hi2";
import { CgImage } from "react-icons/cg";
import { ClassicNumberField, ProgressNumberField } from "./NumberField";
import { TbNumber123, TbCalendarTime, TbSelect, TbLink } from "react-icons/tb";
import { HiOutlineChartBar } from "react-icons/hi";
import LinkField from "./LinkField";
import ImageField from "./ImageField";
import DocumentEditorField from "./document-fields/DocumentEditorField";
import DocumentNameField from "./document-fields/DocumentNameField";
import DocumentStaticField from "./document-fields/DocumentStaticField";
import FileField from "./file-fields/FileNameField";
import SelectField from "./SelectField";
import DateField from "./DateField";

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
    ],
    visuals: {
      commonSettingsList: [
        {
          key: "showLabel",
          label: "Afficher le label au dessus du champ",
          type: "boolean",
          defaultValue: false,
        },
        {
          key: "readOnly",
          label: "Lecture seule",
          type: "boolean",
          defaultValue: false,
        },
      ],
      variants: [
        {
          name: "default",
          label: "Par défaut",
          visualType: "both",
          component: TextField,
          settingsList: [
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
              defaultValue: "p",
            },
          ],
        },
      ],
    },
  },
  {
    label: "Nombre",
    type: "number",
    icon: GoNumber,
    description: "Champ pour saisir des valeurs numériques.",
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
      commonSettingsList: [
        {
          key: "showLabel",
          label: "Afficher le label",
          type: "boolean",
          defaultValue: false,
        },
      ],
      variants: [
        {
          name: "number",
          label: "Champ numérique",
          description: "Affichage classique d'un champ de nombre",
          icon: TbNumber123,
          visualType: "both",
          component: ClassicNumberField,
          settingsList: [],
        },
        {
          name: "progress",
          label: "Barre de progression",
          description: "Affiche le nombre sous forme de barre de progression",
          icon: HiOutlineChartBar,
          visualType: "both",
          component: ProgressNumberField,
          settingsList: [],
        },
      ],
    },
  },

  {
    label: "Case à cocher",
    type: "boolean",
    icon: HiOutlineCheckCircle,
    description: "Champ booléen pour des réponses oui/non ou vrai/faux.",
    visuals: {
      commonSettingsList: [],
      variants: [
        {
          name: "default",
          label: "Par défaut",
          visualType: "both",
          component: TextField, // Temporaire
          settingsList: [],
        },
      ],
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
        defaultValue: false,
      },
      {
        key: "selectChoices",
        label: "Choix disponibles",
        type: "selectBuilder",
      },
    ],
    visuals: {
      commonSettingsList: [],
      variants: [
        {
          name: "default",
          label: "Par défaut",
          visualType: "both",
          component: SelectField, // Temporaire
          settingsList: [],
        },
      ],
    },
  },
  {
    label: "Image",
    type: "image",
    icon: CgImage,
    description: "Champ pour insérer une image.",
    fieldOptions: [],
    visuals: {
      commonSettingsList: [
        {
          key: "enableInImageNavigation",
          label: "Navigation dans l'image",
          type: "boolean",
          defaultValue: false,
        },
      ],
      variants: [
        {
          name: "default",
          label: "Par défaut",
          visualType: "both",
          component: ImageField,
          settingsList: [],
        },
      ],
    },
  },
  {
    label: "Fichier",
    type: "file",
    icon: RiAttachment2,
    description: "Champ pour insérer un fichier.",
    fieldOptions: [],
    visuals: {
      commonSettingsList: [],
      variants: [
        {
          name: "default",
          label: "Par défaut",
          visualType: "both",
          component: FileField,
          settingsList: [],
        },
      ],
    },
  },
  {
    label: "Lien",
    type: "url",
    icon: TbLink,
    description: "Champ pour insérer une URL ou un lien web.",
    fieldOptions: [],
    visuals: {
      commonSettingsList: [],
      variants: [
        {
          name: "pageTitle",
          label: "Titre de la page",
          visualType: "both",
          component: LinkField,
          settingsList: [],
        },
        {
          name: "icon",
          label: "Icône",
          visualType: "both",
          component: LinkField,
          componentProps: { iconOnly: true },
          settingsList: [],
        },
      ],
    },
  },
  {
    label: "Document",
    type: "document",
    icon: RiFileList3Line,
    description: "Champ pour insérer et éditer des documents texte formatés.",
    fieldOptions: [],
    visuals: {
      commonSettingsList: [],
      variants: [
        {
          name: "editor",
          label: "Editeur complet",
          visualType: "window",
          component: DocumentEditorField, // Temporaire
          settingsList: [],
        },
        {
          name: "nameOnly",
          label: "Nom du doc uniquement",
          visualType: "node",
          component: DocumentNameField, // Temporaire
          settingsList: [],
        },
        {
          name: "staticReader",
          label: "Affichage en lecture seule",
          visualType: "node",
          component: DocumentStaticField, // Temporaire
          settingsList: [],
        },
      ],
    },
  },
  {
    label: "Date",
    type: "date",
    icon: TbCalendarTime,
    description: "Champ pour insérer et éditer des dates.",
    fieldOptions: [
      {
        key: "isDateTime",
        label: "Inclure l'heure",
        type: "boolean",
        defaultValue: false,
      },
    ],
    visuals: {
      commonSettingsList: [],
      variants: [
        {
          name: "relative",
          label: "Date relative",
          visualType: "both",
          component: DateField,
          componentProps: { isRelative: true },
          settingsList: [
            {
              key: "format",
              label: "Format d'affichage",
              type: "select",
              props: {
                options: [
                  { value: "automatic", label: "Automatique" },
                  { value: "weeks", label: "Semaines" },
                  { value: "days", label: "Jours" },
                ],
              },
              defaultValue: "automatic",
            },
          ],
        },
        {
          name: "absolute",
          label: "Date absolue",
          visualType: "both",
          component: DateField,
          componentProps: { isRelative: false },
          settingsList: [],
        },
      ],
    },
  },
];

export default fieldsDefinition;
