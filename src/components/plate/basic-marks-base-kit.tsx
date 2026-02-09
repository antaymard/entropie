import {
  BaseBoldPlugin,
  BaseCodePlugin,
  BaseHighlightPlugin,
  BaseItalicPlugin,
  BaseKbdPlugin,
  BaseStrikethroughPlugin,
  BaseSubscriptPlugin,
  BaseSuperscriptPlugin,
  BaseUnderlinePlugin,
} from "@platejs/basic-nodes";

import { CodeLeafStatic } from "@/components/plate/code-node-static";
import { HighlightLeafStatic } from "@/components/plate/highlight-node-static";
import { KbdLeafStatic } from "@/components/plate/kbd-node-static";
import { BasePillPlugin } from "@/components/plate/pill-base-kit";

export const BaseBasicMarksKit = [
  BaseBoldPlugin,
  BaseItalicPlugin,
  BaseUnderlinePlugin,
  BaseCodePlugin.withComponent(CodeLeafStatic),
  BaseStrikethroughPlugin,
  BaseSubscriptPlugin,
  BaseSuperscriptPlugin,
  BaseHighlightPlugin.withComponent(HighlightLeafStatic),
  BaseKbdPlugin.withComponent(KbdLeafStatic),
  BasePillPlugin,
];
