import type { NodeConfig } from "../../../types/node.types";
import FileUploadNode from "./FileUploadNode";
import FloatingTextNode from "./FloatingTextNode";
import ImageNode from "./ImageNode";

const defaultValues = {
  name: "default node",
  data: {},
  width: 150,
  height: 100,
  locked: false,
  hidden: false,
  zIndex: 0,
};

const prebuiltNodesConfig = [
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
    nodeIcon: "📝",
    type: "floatingText",
    component: FloatingTextNode,
    initialValues: {
      ...defaultValues,
      data: {
        name: "Bloc de texte",
        color: "transparent",
        text: "Texte flottant",
        level: "p",
      },
      height: 28,
    },
    minWidth: 100,
    minHeight: 28,
    disableDoubleClickToOpenWindow: true,
  },
  {
    addButtonLabel: "Image",
    nodeIcon: "🖼️",
    type: "image",
    component: ImageNode,
    initialValues: {
      ...defaultValues,
      data: {
        name: "Bloc d'image",
        color: "default",
        frameless: false,
        // Actual data
        url: "",
      },
      height: 200,
      width: 250,
    },
    minWidth: 100,
    minHeight: 100,
    disableDoubleClickToOpenWindow: true,
    canSwitchFrameless: true,
  },
  // {
  //   addButtonLabel: "Image",
  //   addButtonIcon: "🖼️",
  //   type: "imageUrl",
  //   component: ImageUrlNode,
  // nodeClassName: "w-fit", // TODO

  //   initialValues: {
  //     ...defaultValues,
  //     color: "default",
  //     name: "Bloc d'image",
  //     data: { url: "https://example.com/image.png" },
  //     height: 100,
  //   },
  //   minWidth: 100,
  //   minHeight: 100,
  // },
] as NodeConfig[];

export default prebuiltNodesConfig;
