import type { NodeConfig } from "../../../types/node.types";
import FloatingTextNode from "./FloatingTextNode";
import UrlNode from "./UrlNode";

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
  // {
  //   addButtonLabel: "Node par défaut",
  //   addButtonIcon: "📦",
  //   type: "default",
  //   component: FloatingTextNode,
  //   initialValues: defaultValues,
  //   minWidth: 150,
  //   minHeight: 100,
  // },
  {
    addButtonLabel: "Texte flottant",
    addButtonIcon: "📝",
    type: "floatingText",
    component: FloatingTextNode,

    // nodeClassName: "w-fit", // TODO

    initialValues: {
      ...defaultValues,
      color: "transparent",
      name: "Bloc de texte",
      data: { text: "Texte flottant", level: "p" },
      height: 28,
    },
    minWidth: 100,
    minHeight: 28,
  },
  {
    addButtonLabel: "URL",
    addButtonIcon: "🔗",
    type: "url",
    component: UrlNode,
    initialValues: {
      ...defaultValues,
      color: "default",
      name: "Bloc d'URL",
      data: { url: "https://example.com" },
      height: 100,
    },
    minWidth: 100,
    minHeight: 100,
  },
] as NodeConfig[];

export default prebuiltNodesList;
