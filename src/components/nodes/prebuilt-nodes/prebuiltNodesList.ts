import type { NodeConfig } from "../../../types/node.types";
import FloatingTextNode from "./FloatingTextNode";

const defaultValues = {
  name: "default node",
  data: { text: "default text" },
  width: 150,
  height: 100,
  locked: false,
  hidden: false,
  zIndex: 0,
  color: "default",
};

const prebuiltNodesList = [
  {
    addButtonLabel: "Node par défaut",
    addButtonIcon: "📦",
    type: "default",
    component: FloatingTextNode,
    initialValues: defaultValues,
    minWidth: 150,
    minHeight: 100,
  },
  {
    addButtonLabel: "Texte flottant",
    addButtonIcon: "📝",
    type: "floatingText",
    component: FloatingTextNode,

    initialValues: {
      ...defaultValues,
      name: "Bloc de texte",
      data: { text: "Texte flottant" },
      height: 20,
    },
    minWidth: 100,
    minHeight: 20,
  },
] as NodeConfig[];

export default prebuiltNodesList;
