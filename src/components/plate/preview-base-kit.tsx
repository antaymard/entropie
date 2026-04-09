import { BaseAlignKit } from "./align-base-kit";
import { BaseBasicBlocksKit } from "./basic-blocks-base-kit";
import { BaseBasicMarksKit } from "./basic-marks-base-kit";
import { BaseCalloutKit } from "./callout-base-kit";
import { BaseCodeBlockKit } from "./code-block-base-kit";
import { BaseColumnKit } from "./column-base-kit";
import { BaseDateKit } from "./date-base-kit";
import { BaseFontKit } from "./font-base-kit";
import { BaseLineHeightKit } from "./line-height-base-kit";
import { BaseLinkKit } from "./link-base-kit";
import { BaseListKit } from "./list-base-kit";
import { BaseMediaKit } from "./media-base-kit";
import { BaseMentionKit } from "./mention-base-kit";
import { BaseTableKit } from "./table-base-kit";
import { BaseToggleKit } from "./toggle-base-kit";

/**
 * Lighter plugin kit for read-only canvas preview.
 * Excludes: Comment, Suggestion, Toc, Markdown, Math
 */
export const BasePreviewKit = [
  ...BaseBasicBlocksKit,
  ...BaseCodeBlockKit,
  ...BaseTableKit,
  ...BaseToggleKit,
  ...BaseMediaKit,
  ...BaseCalloutKit,
  ...BaseColumnKit,
  ...BaseDateKit,
  ...BaseLinkKit,
  ...BaseMentionKit,
  ...BaseBasicMarksKit,
  ...BaseFontKit,
  ...BaseListKit,
  ...BaseAlignKit,
  ...BaseLineHeightKit,
];
