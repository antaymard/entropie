import type { NodeColors } from "../../types/node.types";

const colors: Record<
  NodeColors,
  {
    border: string;
    bg: string;
    darkBg: string;
    plain: string;
    text: string;
    label: string;
    transparentBg?: string;
  }
> = {
  blue: {
    label: "Bleu",
    border: "border-blue-300",
    bg: "bg-blue-100",
    darkBg: "bg-blue-200",
    plain: "bg-blue-600",
    text: "text-blue-600",
    transparentBg: "bg-blue-500/20",
  },
  green: {
    label: "Vert",
    border: "border-green-300",
    bg: "bg-green-100",
    darkBg: "bg-green-200",
    plain: "bg-green-600",
    text: "text-green-600",
    transparentBg: "bg-green-500/20",
  },
  red: {
    label: "Rouge",
    border: "border-red-300",
    bg: "bg-red-100",
    darkBg: "bg-red-200",
    plain: "bg-red-600",
    text: "text-red-600",
    transparentBg: "bg-red-500/20",
  },
  yellow: {
    label: "Jaune",
    border: "border-yellow-300",
    bg: "bg-yellow-100",
    darkBg: "bg-yellow-200",
    plain: "bg-yellow-600",
    text: "text-yellow-600",
    transparentBg: "bg-yellow-500/20",
  },
  purple: {
    label: "Violet",
    border: "border-purple-300",
    bg: "bg-purple-100",
    darkBg: "bg-purple-200",
    plain: "bg-purple-600",
    text: "text-purple-600",
    transparentBg: "bg-purple-500/20",
  },
  default: {
    label: "Par défaut",
    border: "border-slate-300",
    bg: "bg-slate-100",
    darkBg: "bg-slate-200",
    plain: "bg-slate-600",
    text: "text-slate-500",
    transparentBg: "bg-slate-500/20",
  },
  transparent: {
    label: "Transparent",
    border: "border-transparent",
    bg: "bg-transparent",
    darkBg: "bg-transparent",
    plain: "bg-transparent",
    text: "",
  },
};

export default colors;
