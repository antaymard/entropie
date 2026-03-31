"use node";

import { v } from "convex/values";
import { internalAction } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { generateText } from "ai";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { plateJsonToMarkdown } from "./plateMarkdownConverter";
import { uploadBuffer } from "../../lib/r2";

// -- transcribeNode ------------------------------------------------------

export const transcribeNode = internalAction({
  args: { nodeDataId: v.id("nodeDatas") },
  returns: v.null(),
  handler: async (ctx, { nodeDataId }) => {
    // 1. Fetch nodeData
    const nodeData = await ctx.runQuery(
      internal.wrappers.nodeDataWrappers.readNodeData,
      { _id: nodeDataId },
    );
    if (!nodeData) return null;

    // 2. Staleness guard : skip if transcript is already up-to-date
    const existing = await ctx.runQuery(
      internal.wrappers.metadataWrappers.read,
      { subjectId: nodeDataId, type: "transcript" },
    );
    if (existing && existing.updatedAt >= (nodeData.updatedAt ?? 0)) {
      return null;
    }

    // 3. Branch by node type
    let content: string | null = null;

    switch (nodeData.type) {
      case "image":
        content = await transcribeImage(nodeData.values);
        break;
      case "file":
        content = await transcribeFile(nodeData.values, nodeDataId);
        break;
      case "document":
        content = transcribeDocument(nodeData.values);
        break;
      default:
        return null;
    }

    if (!content || content.trim().length === 0) return null;

    // 4. Upsert metadata
    await ctx.runMutation(internal.wrappers.metadataWrappers.upsert, {
      subjectType: "nodeData",
      subjectId: nodeDataId,
      type: "transcript",
      content,
    });

    console.log(
      `? Transcript generated for nodeData ${nodeDataId} (${nodeData.type})`,
    );
    return null;
  },
});

// -- Branch: ImageNode ---------------------------------------------------

async function transcribeImage(
  values: Record<string, unknown>,
): Promise<string | null> {
  const images = values.images as Array<{ url: string }> | undefined;
  if (!images || images.length === 0) return null;

  const descriptions = await Promise.all(
    images.map(async (img) => {
      if (!img.url) return null;

      const filename = img.url.split("/").pop() ?? "image";

      const result = await generateText({
        model: openrouter("anthropic/claude-haiku-4-5"),
        messages: [
          {
            role: "user",
            content: [
              { type: "image", image: img.url },
              {
                type: "text",
                text: `Describe this image in detail. Include:
1. A complete visual description (subjects, setting, colors, composition)
2. Any visible text (OCR)
3. If it is a chart, graph, or data visualization: extract the key data points and trends

Respond in the same language as any visible text, or in French if no text is visible.`,
              },
            ],
          },
        ],
      });

      return `[Image: ${filename}]\n${result.text}`;
    }),
  );

  const validDescriptions = descriptions.filter(Boolean);
  return validDescriptions.length > 0 ? validDescriptions.join("\n\n") : null;
}

// -- Branch: FileNode (PDF) ----------------------------------------------

interface MistralOcrPage {
  index: number;
  markdown: string;
  images: Array<{
    id: string;
    image_base64?: string;
  }>;
}

interface MistralOcrResponse {
  pages: MistralOcrPage[];
}

async function transcribeFile(
  values: Record<string, unknown>,
  nodeDataId: string,
): Promise<string | null> {
  const files = values.files as
    | Array<{ url: string; filename: string; mimeType: string }>
    | undefined;
  if (!files || files.length === 0) return null;

  const pdfFiles = files.filter((f) => f.mimeType === "application/pdf");
  if (pdfFiles.length === 0) return null;

  const transcripts = await Promise.all(
    pdfFiles.map(async (pdf) => {
      const apiKey = process.env.MISTRAL_API_KEY;
      if (!apiKey) throw new Error("MISTRAL_API_KEY is not configured");

      const response = await fetch("https://api.mistral.ai/v1/ocr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "mistral-ocr-latest",
          document: {
            type: "document_url",
            document_url: pdf.url,
          },
          include_image_base64: true,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Mistral OCR error (${response.status}): ${errorBody}`);
        return null;
      }

      const ocrResult = (await response.json()) as MistralOcrResponse;

      // Upload extracted images to R2 and build placeholder ? URL mapping
      const imageMap = new Map<string, string>();

      for (const page of ocrResult.pages) {
        for (const img of page.images) {
          if (!img.image_base64) continue;

          const base64Data = img.image_base64.replace(
            /^data:image\/[^;]+;base64,/,
            "",
          );
          const buffer = Buffer.from(base64Data, "base64");

          const mimeMatch = img.image_base64.match(/^data:(image\/[^;]+);/);
          const mimeType = mimeMatch?.[1] ?? "image/jpeg";
          const ext = mimeType.split("/")[1] ?? "jpeg";

          const key = `${nodeDataId}/${img.id}.${ext}`;
          const publicUrl = await uploadBuffer(
            key,
            buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength,
            ),
            mimeType,
          );
          imageMap.set(img.id, publicUrl);
        }
      }

      // Assemble markdown : replace Mistral image placeholders with R2 URLs
      const pageMarkdowns = ocrResult.pages.map((page) => {
        let md = page.markdown;

        for (const [imageId, url] of imageMap) {
          const escapedId = imageId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const pattern = new RegExp(
            `!\\[([^\\]]*)\\]\\(${escapedId}[^)]*\\)`,
            "g",
          );
          md = md.replace(pattern, `![$1](${url})`);
        }

        return md;
      });

      return pageMarkdowns.join("\n\n---\n\n");
    }),
  );

  const validTranscripts = transcripts.filter(Boolean);
  return validTranscripts.length > 0
    ? validTranscripts.join("\n\n---\n\n")
    : null;
}

// -- Branch: DocumentNode ------------------------------------------------

function transcribeDocument(values: Record<string, unknown>): string | null {
  const doc = values.doc;
  if (!Array.isArray(doc) || doc.length === 0) return null;

  const markdown = plateJsonToMarkdown(doc);
  return markdown && markdown.trim().length > 0 ? markdown : null;
}
