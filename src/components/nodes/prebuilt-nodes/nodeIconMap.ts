import type { IconType } from "react-icons";
import {
  TbFileTypePdf,
  TbAbc,
  TbPhoto,
  TbLink,
  TbTag,
  TbApi,
  TbNews,
  TbCode,
  TbTable,
} from "react-icons/tb";

export const NODE_TYPE_ICON_MAP: Record<string, IconType> = {
  text: TbAbc,
  document: TbNews,
  image: TbPhoto,
  link: TbLink,
  pdf: TbFileTypePdf,
  value: TbTag,
  fetch: TbApi,
  embed: TbCode,
  table: TbTable,
};
