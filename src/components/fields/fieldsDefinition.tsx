import type { FieldDefinition } from "@/types/field.types";

import { RiTextBlock } from "react-icons/ri";

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
        type: "string",
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
          component: lazyField("@/components/fields/TextField"),
        },
      },
      window: {},
    },
  },
];

export default fieldsDefinition;
