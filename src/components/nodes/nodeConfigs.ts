import type { NodeColors } from "../../types/node.types";

const colors: Record<
  NodeColors,
  {
    border: string;
    nameBg: string;
    nodeBg: string;
    plain: string;
    text: string;
    label: string;
  }
> = {
  blue: {
    label: "Bleu",
    border: "border-blue-300",
    plain: "bg-blue-500",
    nameBg: "bg-blue-200",
    nodeBg: "bg-blue-100",
    text: "text-blue-500",
  },
  green: {
    label: "Vert",
    border: "border-green-300",
    plain: "bg-green-500",
    nameBg: "bg-green-200",
    nodeBg: "bg-green-100",
    text: "text-green-500",
  },
  red: {
    label: "Rouge",
    border: "border-red-300",
    plain: "bg-red-500",
    nameBg: "bg-red-200",
    nodeBg: "bg-red-100",
    text: "text-red-500",
  },
  yellow: {
    label: "Jaune",
    border: "border-yellow-300",
    plain: "bg-yellow-500",
    nameBg: "bg-yellow-200",
    nodeBg: "bg-yellow-100",
    text: "text-yellow-500",
  },
  purple: {
    label: "Violet",
    border: "border-purple-300",
    plain: "bg-purple-500",
    nameBg: "bg-purple-200",
    nodeBg: "bg-purple-100",
    text: "text-purple-500",
  },
  default: {
    label: "Par défaut",
    border: "border-slate-300",
    plain: "bg-slate-500",
    nameBg: "bg-slate-200",
    nodeBg: "bg-slate-100",
    text: "",
  },
  transparent: {
    label: "Transparent",
    border: "border-transparent",
    plain: "bg-transparent",
    nameBg: "bg-transparent",
    nodeBg: "bg-transparent",
    text: "",
  },
};

function getNodeColorClasses(color: NodeColors) {
  return colors[color] || colors["default"];
}

export { colors, getNodeColorClasses };
