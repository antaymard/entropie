"use client";

import { TrailingBlockPlugin } from "platejs";

import { AlignKit } from "@/components/plate/align-kit";
import { AutoformatKit } from "@/components/plate/autoformat-kit";
import { BasicBlocksKit } from "@/components/plate/basic-blocks-kit";
import { BasicMarksKit } from "@/components/plate/basic-marks-kit";
import { BlockPlaceholderKit } from "@/components/plate/block-placeholder-kit";
import { CalloutKit } from "@/components/plate/callout-kit";
import { CodeBlockKit } from "@/components/plate/code-block-kit";
import { ColumnKit } from "@/components/plate/column-kit";
import { CursorOverlayKit } from "@/components/plate/cursor-overlay-kit";
import { DateKit } from "@/components/plate/date-kit";
import { DndKit } from "@/components/plate/dnd-kit";
import { DocxKit } from "@/components/plate/docx-kit";
import { EmojiKit } from "@/components/plate/emoji-kit";
import { ExitBreakKit } from "@/components/plate/exit-break-kit";
import { FloatingToolbarKit } from "@/components/plate/floating-toolbar-kit";
import { FontKit } from "@/components/plate/font-kit";
import { LineHeightKit } from "@/components/plate/line-height-kit";
import { LinkKit } from "@/components/plate/link-kit";
import { ListKit } from "@/components/plate/list-kit";
import { MarkdownKit } from "@/components/plate/markdown-kit";
import { MathKit } from "@/components/plate/math-kit";
import { MediaKit } from "@/components/plate/media-kit";
import { MentionKit } from "@/components/plate/mention-kit";
import { SlashKit } from "@/components/plate/slash-kit";
import { TableKit } from "@/components/plate/table-kit";
import { TocKit } from "@/components/plate/toc-kit";
import { ToggleKit } from "@/components/plate/toggle-kit";

// EditorKit pour les nodes canvas - utilise FloatingToolbar au lieu de FixedToolbar
export const CanvasEditorKit = [
  // Elements
  ...BasicBlocksKit,
  ...CodeBlockKit,
  ...TableKit,
  ...ToggleKit,
  ...TocKit,
  ...MediaKit,
  ...CalloutKit,
  ...ColumnKit,
  ...MathKit,
  ...DateKit,
  ...LinkKit,
  ...MentionKit,

  // Marks
  ...BasicMarksKit,
  ...FontKit,

  // Block Style
  ...ListKit,
  ...AlignKit,
  ...LineHeightKit,

  // Editing
  ...SlashKit,
  ...AutoformatKit,
  ...CursorOverlayKit,
  ...DndKit,
  ...EmojiKit,
  ...ExitBreakKit,
  TrailingBlockPlugin,

  // Parsers
  ...DocxKit,
  ...MarkdownKit,

  // UI - Floating toolbar pour le canvas
  ...BlockPlaceholderKit,
  ...FloatingToolbarKit,
];
