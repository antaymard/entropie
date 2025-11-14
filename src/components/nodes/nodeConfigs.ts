import type { NodeColors } from "../../types/node.types";

const colors: Record<
  NodeColors,
  { border: string; bg: string; plain: string; text: string; label: string }
> = {
  blue: {
    label: "Bleu",
    border: "border-blue-300",
    bg: "bg-blue-100",
    plain: "bg-blue-600",
    text: "text-blue-600",
  },
  green: {
    label: "Vert",
    border: "border-green-300",
    bg: "bg-green-100",
    plain: "bg-green-600",
    text: "text-green-600",
  },
  red: {
    label: "Rouge",
    border: "border-red-300",
    bg: "bg-red-100",
    plain: "bg-red-600",
    text: "text-red-600",
  },
  yellow: {
    label: "Jaune",
    border: "border-yellow-300",
    bg: "bg-yellow-100",
    plain: "bg-yellow-600",
    text: "text-yellow-600",
  },
  purple: {
    label: "Violet",
    border: "border-purple-300",
    bg: "bg-purple-100",
    plain: "bg-purple-600",
    text: "text-purple-600",
  },
  default: {
    label: "Par défaut",
    border: "border-gray-300",
    bg: "bg-gray-100",
    plain: "bg-gray-600",
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
