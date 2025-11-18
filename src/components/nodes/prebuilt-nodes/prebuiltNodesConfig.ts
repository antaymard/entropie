import type { CanvasNode, NodeConfig } from "../../../types/node.types";
import FloatingTextNode from "./FloatingTextNode";
import ImageNode from "./ImageNode";

const defaultValues: CanvasNode = {
  id: "",
  name: "",
  type: "default",
  position: { x: 0, y: 0 },
  width: 150,
  height: 100,
  hidden: false,
  zIndex: 0,
  locked: false,
  color: "default",
  data: {},
}; // On omet position, type, id, templateId

const prebuiltNodesConfig = [
  {
    nodeLabel: "Texte flottant",
    nodeIcon: "📝",
    type: "floatingText",
    component: FloatingTextNode,
    minWidth: 100,
    minHeight: 28,
    disableDoubleClickToOpenWindow: true,

    initialNodeValues: {
      ...defaultValues,
      name: "Bloc de texte",
      type: "floatingText",
      color: "transparent",
      frameless: true,
      height: 28,
      width: 150,
      data: {
        // Actual data
        text: "Texte flottant",
        level: "p",
      },
    },
  },
  {
    nodeLabel: "Image",
    nodeIcon: "🖼️",
    type: "image",
    component: ImageNode,
    minWidth: 100,
    minHeight: 100,
    canSwitchFrameless: true,
    initialNodeValues: {
      ...defaultValues,
      name: "Bloc image",
      type: "image",
      data: {
        // Actual data
        url: "",
      },
      height: 200,
      width: 250,
    },
  },
] as NodeConfig[];

export default prebuiltNodesConfig;
