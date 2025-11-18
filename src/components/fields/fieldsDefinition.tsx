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
    optionsList: [
      { key: "placeholder", label: "Texte indicatif", type: "string" },
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
