import { createSlateEditor, normalizeNodeId, type Value } from "platejs";
import { MarkdownPlugin, remarkMdx, remarkMention } from "@platejs/markdown";
import { BaseListPlugin } from "@platejs/list";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { pillMarkdownRules } from "@/components/plate/pillMarkdownRules";

const converter = createSlateEditor({
  plugins: [
    BaseListPlugin,
    MarkdownPlugin.configure({
      options: {
        remarkPlugins: [remarkMath, remarkGfm, remarkMdx, remarkMention],
        rules: {
          ...pillMarkdownRules,
        },
      },
    }),
  ],
});

const fallbackDocument = (text: string): Value => {
  const lines = text.split("\n");
  return normalizeNodeId(
    lines.map((line) => ({
      type: "p",
      children: [{ text: line }],
    })),
  );
};

export function markdownToPlateValue(markdown: string): Value {
  if (!markdown.trim()) {
    return normalizeNodeId([
      {
        type: "p",
        children: [{ text: "" }],
      },
    ]);
  }

  try {
    const deserialized = converter.api.markdown.deserialize(markdown);
    if (!Array.isArray(deserialized) || deserialized.length === 0) {
      return fallbackDocument(markdown);
    }

    return normalizeNodeId(deserialized as Value);
  } catch {
    return fallbackDocument(markdown);
  }
}
