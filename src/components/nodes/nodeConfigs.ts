import type { NodeColors } from "../../types/node.types";

const colors: Record<
  NodeColors,
  { border: string; bg: string; plain: string; text: string; label: string }
> = {
  blue: {
    label: "Bleu",
    border: "border-blue-300",
    bg: "bg-blue-100",
    plain: "bg-blue-500",
    text: "text-blue-500",
  },
  green: {
    label: "Vert",
    border: "border-green-300",
    bg: "bg-green-100",
    plain: "bg-green-500",
    text: "text-green-500",
  },
  red: {
    label: "Rouge",
    border: "border-red-300",
    bg: "bg-red-100",
    plain: "bg-red-500",
    text: "text-red-500",
  },
  yellow: {
    label: "Jaune",
    border: "border-yellow-300",
    bg: "bg-yellow-100",
    plain: "bg-yellow-500",
    text: "text-yellow-500",
  },
  purple: {
    label: "Violet",
    border: "border-purple-300",
    bg: "bg-purple-100",
    plain: "bg-purple-500",
    text: "text-purple-500",
  },
  default: {
    label: "Par défaut",
    border: "border-gray-300",
    bg: "bg-gray-100",
    plain: "bg-gray-500",
    text: "",
  },
  transparent: {
    label: "Transparent",
    border: "border-transparent",
    bg: "bg-transparent",
    plain: "bg-transparent",
    text: "",
  },
};

export { colors };
