import type { CanvasNode, NodeConfig } from "../../../types/node.types";
import LinkNode from "./LinkNode";
import FloatingTextNode from "./FloatingTextNode";
import ImageNode from "./ImageNode";
import FileNode from "./FileNode";
import DocumentNode from "./DocumentNode";
import DocumentWindow from "@/components/windows/prebuilt/DocumentWindow";
import ImageWindow from "@/components/windows/prebuilt/ImageWindow";
import FileWindow from "@/components/windows/prebuilt/FileWindow";

// Icons
import {
  RiTextBlock,
  RiImageLine,
  RiLink,
  RiAttachment2,
  RiFileList3Line,
} from "react-icons/ri";
import type { Value } from "platejs";

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
    windowComponent: ImageWindow,
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
      width: 220,
    },
  },
  {
    nodeLabel: "Fichier attaché",
    nodeIcon: RiAttachment2,
    type: "file",
    nodeComponent: FileNode,
    windowComponent: FileWindow,
    node: {
      // minWidth: 150,
      // minHeight: 150, // notResizable
    },
    initialNodeValues: {
      ...defaultValues,
      name: "Bloc Fichier",
      type: "file",
      data: {
        files: [
          {
            url: "",
            filename: "",
            mimeType: "",
            size: 0,
            uploadedAt: 0,
            key: "",
          },
        ],
      },
      height: 40,
      width: 220,
    },
  },
  {
    nodeLabel: "Document",
    nodeIcon: RiFileList3Line,
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
