import type { CanvasNode, NodeConfig } from "../../../types/node.types";
import LinkNode from "./LinkNode";
import FloatingTextNode from "./FloatingTextNode";
import ImageNode from "./ImageNode";
import DocumentNode from "./DocumentNode";

// Icons
import { RiTextBlock, RiImageLine, RiLink } from "react-icons/ri";
import { RxReader } from "react-icons/rx";
import type { Value } from "platejs";
import DocumentWindow from "@/components/windows/prebuilt/DocumentWindow";

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
    nodeIcon: RiTextBlock,
    type: "floatingText",
    nodeComponent: FloatingTextNode,
    node: {
      minWidth: 100,
      minHeight: 28,
    },
    disableDoubleClickToOpenWindow: true,
    canBeTransparent: true,

    initialNodeValues: {
      ...defaultValues,
      name: "Bloc de texte",
      type: "floatingText",
      color: "transparent",
      headerless: true,
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
    nodeIcon: RiImageLine,
    type: "image",
    nodeComponent: ImageNode,
    node: {
      minWidth: 100,
      minHeight: 100,
    },
    canSwitchHeaderless: true,
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
  {
    nodeLabel: "Lien web",
    nodeIcon: RiLink,
    type: "link",
    nodeComponent: LinkNode,
    node: {
      // minWidth: 150,
      // minHeight: 150, // notResizable
    },
    initialNodeValues: {
      ...defaultValues,
      name: "Bloc Lien",
      type: "link",
      data: {
        // Actual data
        url: "",
      },
      height: 40,
      width: 190,
    },
  },
  {
    nodeLabel: "Document",
    nodeIcon: RxReader,
    type: "document",
    nodeComponent: DocumentNode,
    windowComponent: DocumentWindow,
    node: {
      minWidth: 100,
      minHeight: 100,
    },
    window: {
      initialWidth: 500,
      initialHeight: 900,
    },
    initialNodeValues: {
      ...defaultValues,
      name: "Bloc Document",
      type: "document",
      data: {
        doc: [
          {
            children: [{ text: "" }],
            type: "p",
          },
        ] as Value,
      },
      height: 250,
      width: 200,
    },
  },
] as NodeConfig[];

export default prebuiltNodesConfig;
