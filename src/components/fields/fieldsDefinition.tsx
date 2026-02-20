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
    label: "Short text",
    type: "short_text",
    icon: RiTextBlock,
    description: "Short, unformatted text. Useful for titles.",
    fieldOptions: [
      {
        key: "placeholder",
        label: "Placeholder (shown in empty field)",
        type: "input",
      },
      {
        key: "defaultValue",
        label: "Default value",
        type: "input",
      },
    ],
    visuals: {
      commonSettingsList: [
        {
          key: "showLabel",
          label: "Show label above the field",
          type: "boolean",
          defaultValue: false,
        },
        {
          key: "readOnly",
          label: "Read only",
          type: "boolean",
          defaultValue: false,
        },
      ],
      variants: [
        {
          name: "default",
          label: "Default",
          visualType: "both",
          component: TextField,
          settingsList: [
            {
              key: "displayAs",
              label: "Text formatting",
              type: "toggleGroup",
              props: {
                type: "single",
                options: [
                  { value: "h1", label: "h1" },
                  { value: "h2", label: "h2" },
                  { value: "h3", label: "h3" },
                  { value: "p", label: "Paragraph" },
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
    label: "Number",
    type: "number",
    icon: GoNumber,
    description: "Field for entering numeric values.",
    fieldOptions: [
      {
        key: "placeholder",
        label: "Placeholder (shown in empty field)",
        type: "input",
      },
      {
        key: "defaultValue",
        label: "Default value",
        type: "input",
        props: {
          type: "number",
        },
      },
      {
        key: "minValue",
        label: "Minimum value",
        type: "input",
        props: {
          type: "number",
        },
      },
      {
        key: "maxValue",
        label: "Maximum value",
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
          label: "Show label",
          type: "boolean",
          defaultValue: false,
        },
      ],
      variants: [
        {
          name: "number",
          label: "Number field",
          description: "Classic number field display",
          icon: TbNumber123,
          visualType: "both",
          component: ClassicNumberField,
          settingsList: [],
        },
        {
          name: "progress",
          label: "Progress bar",
          description: "Displays the number as a progress bar",
          icon: HiOutlineChartBar,
          visualType: "both",
          component: ProgressNumberField,
          settingsList: [],
        },
      ],
    },
  },

  {
    label: "Checkbox",
    type: "boolean",
    icon: HiOutlineCheckCircle,
    description: "Boolean field for yes/no or true/false answers.",
    visuals: {
      commonSettingsList: [],
      variants: [
        {
          name: "default",
          label: "Default",
          visualType: "both",
          component: TextField, // Temporaire
          settingsList: [],
        },
      ],
    },
  },
  {
    label: "Selector",
    type: "select",
    icon: TbSelect,
    description:
      "Field for selecting one or more options from a dropdown list.",
    fieldOptions: [
      {
        key: "isMultipleSelect",
        label: "Allow multiple choices",
        type: "boolean",
        defaultValue: false,
      },
      {
        key: "selectChoices",
        label: "Available choices",
        type: "selectBuilder",
      },
    ],
    visuals: {
      commonSettingsList: [],
      variants: [
        {
          name: "default",
          label: "Default",
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
    description: "Field for inserting an image.",
    fieldOptions: [],
    visuals: {
      commonSettingsList: [
        {
          key: "enableInImageNavigation",
          label: "In-image navigation",
          type: "boolean",
          defaultValue: false,
        },
      ],
      variants: [
        {
          name: "default",
          label: "Default",
          visualType: "both",
          component: ImageField,
          settingsList: [],
        },
      ],
    },
  },
  {
    label: "File",
    type: "file",
    icon: RiAttachment2,
    description: "Field for inserting a file.",
    fieldOptions: [],
    visuals: {
      commonSettingsList: [],
      variants: [
        {
          name: "default",
          label: "Default",
          visualType: "both",
          component: FileField,
          settingsList: [],
        },
      ],
    },
  },
  {
    label: "Link",
    type: "url",
    icon: TbLink,
    description: "Field for inserting a URL or web link.",
    fieldOptions: [],
    visuals: {
      commonSettingsList: [],
      variants: [
        {
          name: "pageTitle",
          label: "Page title",
          visualType: "both",
          component: LinkField,
          settingsList: [],
        },
        {
          name: "icon",
          label: "Icon",
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
    description: "Field for inserting and editing formatted text documents.",
    fieldOptions: [],
    visuals: {
      commonSettingsList: [],
      variants: [
        {
          name: "editor",
          label: "Full editor",
          visualType: "window",
          component: DocumentEditorField, // Temporaire
          settingsList: [],
        },
        {
          name: "nameOnly",
          label: "Document name only",
          visualType: "node",
          component: DocumentNameField, // Temporaire
          settingsList: [],
        },
        {
          name: "staticReader",
          label: "Read-only display",
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
    description: "Field for inserting and editing dates.",
    fieldOptions: [
      {
        key: "isDateTime",
        label: "Include time",
        type: "boolean",
        defaultValue: false,
      },
    ],
    visuals: {
      commonSettingsList: [],
      variants: [
        {
          name: "relative",
          label: "Relative date",
          visualType: "both",
          component: DateField,
          componentProps: { isRelative: true },
          settingsList: [
            {
              key: "format",
              label: "Display format",
              type: "select",
              props: {
                options: [
                  { value: "automatic", label: "Automatic" },
                  { value: "weeks", label: "Weeks" },
                  { value: "days", label: "Days" },
                ],
              },
              defaultValue: "automatic",
            },
          ],
        },
        {
          name: "absolute",
          label: "Absolute date",
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
