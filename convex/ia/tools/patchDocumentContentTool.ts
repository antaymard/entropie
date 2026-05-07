import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { toolAgentNames, type ThreadCtx } from "../agentConfig";
import { internal } from "../../_generated/api";
import {
  markdownToPlateJson,
} from "../helpers/plateMarkdownConverter";
import {
  parseStoredPlateDocument,
  stringifyPlateDocumentForStorage,
} from "../../lib/plateDocumentStorage";
import {
  ensureBlockIds,
  findBlockIndexById,
} from "../../lib/plateBlockHelpers";
import { toolError, ToolConfig } from "./toolHelpers";

export const patchDocumentContentToolConfig: ToolConfig = {
  name: "patch_document_content",
  authorized_agents: [
    toolAgentNames.nole,
    toolAgentNames.clone,
    toolAgentNames.supervisor,
    toolAgentNames.worker,
  ],
};

const BEGIN_MARKER = "*** Begin Patch";
const END_MARKER = "*** End Patch";

const ERROR_TARGET_NOT_DOCUMENT = toolError("Target node must be a document.");
const ERROR_INVALID_PLATE_DOC = toolError(
  "Document content is not valid PlateJSON.",
);

type PlateBlock = Record<string, unknown> & { id?: string };

type Operation =
  | { kind: "replace"; index: number; blockId: string; body: string }
  | {
      kind: "insertBefore";
      index: number;
      anchorId: string;
      body: string;
    }
  | {
      kind: "insertAfter";
      index: number;
      anchorId: string;
      body: string;
    }
  | { kind: "insertStart"; body: string }
  | { kind: "insertEnd"; body: string }
  | { kind: "delete"; index: number; blockId: string };

type RawHunk = {
  hunkIndex: number;
  header: string;
  bodyLines: string[];
};

type ParseResult =
  | { ok: true; hunks: RawHunk[] }
  | { ok: false; error: string };

function parsePatchHunks(rawPatch: string): ParseResult {
  const patch = rawPatch.replace(/\r\n/g, "\n").trim();

  if (patch.length === 0) {
    return { ok: false, error: "Patch is empty." };
  }

  const lines = patch.split("\n");

  if (lines[0].trim() !== BEGIN_MARKER) {
    return {
      ok: false,
      error: `Patch must start with "${BEGIN_MARKER}" on its own line.`,
    };
  }
  if (lines[lines.length - 1].trim() !== END_MARKER) {
    return {
      ok: false,
      error: `Patch must end with "${END_MARKER}" on its own line.`,
    };
  }

  const body = lines.slice(1, -1);

  for (const line of body) {
    const trimmed = line.trim();
    if (trimmed === BEGIN_MARKER || trimmed === END_MARKER) {
      return {
        ok: false,
        error: `Only one "${BEGIN_MARKER}" / "${END_MARKER}" block is allowed per call. Put all your hunks (separated by "@@") inside a single block.`,
      };
    }
  }

  const hunks: RawHunk[] = [];
  let current: RawHunk | null = null;

  for (const line of body) {
    if (line.startsWith("@@")) {
      if (current !== null) hunks.push(current);
      current = {
        hunkIndex: hunks.length,
        header: line.slice(2).trim(),
        bodyLines: [],
      };
      continue;
    }
    if (current === null) {
      if (line.trim() !== "") {
        return {
          ok: false,
          error: `Unexpected content before the first hunk header "@@": "${line}". Every hunk must start with a "@@" line.`,
        };
      }
      continue;
    }
    current.bodyLines.push(line);
  }
  if (current !== null) hunks.push(current);

  if (hunks.length === 0) {
    return {
      ok: false,
      error: 'No hunks found. Each hunk must start with a "@@" line.',
    };
  }

  return { ok: true, hunks };
}

function trimTrailingBlankLines(lines: string[]): string[] {
  const out = [...lines];
  while (out.length > 0 && out[out.length - 1].trim() === "") out.pop();
  return out;
}

function trimLeadingBlankLines(lines: string[]): string[] {
  const out = [...lines];
  while (out.length > 0 && out[0].trim() === "") out.shift();
  return out;
}

const HEADER_BLOCK_REGEX = /^block:([a-z0-9-]+)$/;

type ResolveResult =
  | { ok: true; ops: Operation[] }
  | { ok: false; error: string };

function resolveHunks(
  hunks: RawHunk[],
  doc: PlateBlock[],
): ResolveResult {
  const ops: Operation[] = [];
  const referencedIds = new Set<string>();

  for (const hunk of hunks) {
    const header = hunk.header;
    const bodyLines = trimLeadingBlankLines(
      trimTrailingBlankLines(hunk.bodyLines),
    );
    const body = bodyLines.join("\n");

    const replaceMatch = header.match(/^replace\s+block:([a-z0-9-]+)$/);
    if (replaceMatch) {
      const blockId = replaceMatch[1];
      if (referencedIds.has(blockId)) {
        return {
          ok: false,
          error: `Hunk ${hunk.hunkIndex}: block:${blockId} is referenced by more than one operation in this patch.`,
        };
      }
      const index = findBlockIndexById(doc, blockId);
      if (index === -1) {
        return {
          ok: false,
          error: `Hunk ${hunk.hunkIndex}: block:${blockId} not found in document. Re-read the document and use a current block id.`,
        };
      }
      if (body.length === 0) {
        return {
          ok: false,
          error: `Hunk ${hunk.hunkIndex}: replace body is empty. Use "@@ delete block:${blockId}" instead.`,
        };
      }
      referencedIds.add(blockId);
      ops.push({ kind: "replace", index, blockId, body });
      continue;
    }

    const insertMatch = header.match(
      /^insert\s+(before|after)\s+block:([a-z0-9-]+)$/,
    );
    if (insertMatch) {
      const where = insertMatch[1] as "before" | "after";
      const anchorId = insertMatch[2];
      if (referencedIds.has(anchorId)) {
        return {
          ok: false,
          error: `Hunk ${hunk.hunkIndex}: block:${anchorId} is referenced by more than one operation in this patch.`,
        };
      }
      const index = findBlockIndexById(doc, anchorId);
      if (index === -1) {
        return {
          ok: false,
          error: `Hunk ${hunk.hunkIndex}: block:${anchorId} not found in document. Re-read the document and use a current block id.`,
        };
      }
      if (body.length === 0) {
        return {
          ok: false,
          error: `Hunk ${hunk.hunkIndex}: insert body is empty.`,
        };
      }
      referencedIds.add(anchorId);
      ops.push({
        kind: where === "before" ? "insertBefore" : "insertAfter",
        index,
        anchorId,
        body,
      });
      continue;
    }

    if (header === "insert start") {
      if (body.length === 0) {
        return {
          ok: false,
          error: `Hunk ${hunk.hunkIndex}: insert body is empty.`,
        };
      }
      ops.push({ kind: "insertStart", body });
      continue;
    }

    if (header === "insert end") {
      if (body.length === 0) {
        return {
          ok: false,
          error: `Hunk ${hunk.hunkIndex}: insert body is empty.`,
        };
      }
      ops.push({ kind: "insertEnd", body });
      continue;
    }

    const deleteMatch = header.match(/^delete\s+block:([a-z0-9-]+)$/);
    if (deleteMatch) {
      const blockId = deleteMatch[1];
      if (referencedIds.has(blockId)) {
        return {
          ok: false,
          error: `Hunk ${hunk.hunkIndex}: block:${blockId} is referenced by more than one operation in this patch.`,
        };
      }
      const index = findBlockIndexById(doc, blockId);
      if (index === -1) {
        return {
          ok: false,
          error: `Hunk ${hunk.hunkIndex}: block:${blockId} not found in document. Re-read the document and use a current block id.`,
        };
      }
      if (bodyLines.length > 0) {
        return {
          ok: false,
          error: `Hunk ${hunk.hunkIndex}: delete must have an empty body.`,
        };
      }
      referencedIds.add(blockId);
      ops.push({ kind: "delete", index, blockId });
      continue;
    }

    if (HEADER_BLOCK_REGEX.test(header)) {
      return {
        ok: false,
        error: `Hunk ${hunk.hunkIndex}: missing operation in "@@ ${header}". Expected "replace block:<id>", "insert before block:<id>", "insert after block:<id>", or "delete block:<id>".`,
      };
    }

    return {
      ok: false,
      error: `Hunk ${hunk.hunkIndex}: invalid header "@@ ${header}". Allowed: "replace block:<id>", "insert before block:<id>", "insert after block:<id>", "insert start", "insert end", "delete block:<id>".`,
    };
  }

  return { ok: true, ops };
}

type ApplyResult =
  | { ok: true; doc: PlateBlock[] }
  | { ok: false; hunkIndex: number; error: string };

function deserializeBody(body: string): PlateBlock[] {
  const blocks = markdownToPlateJson(body) as PlateBlock[];
  return blocks.filter(
    (block) => block && typeof block === "object" && !Array.isArray(block),
  );
}

function applyOps(
  doc: PlateBlock[],
  ops: Operation[],
): ApplyResult {
  // Operations are addressed by id, so we don't recompute indices after each op
  // (id-based lookup is stable). We still recompute lazily because deletions
  // shift array positions.
  let current: PlateBlock[] = [...doc];

  for (let i = 0; i < ops.length; i++) {
    const op = ops[i];

    switch (op.kind) {
      case "replace": {
        const index = findBlockIndexById(current, op.blockId);
        if (index === -1) {
          return {
            ok: false,
            hunkIndex: i,
            error: `block:${op.blockId} no longer in document at apply time.`,
          };
        }
        const newBlocks = deserializeBody(op.body);
        if (newBlocks.length !== 1) {
          return {
            ok: false,
            hunkIndex: i,
            error: `replace block:${op.blockId} body must produce exactly 1 top-level block (got ${newBlocks.length}). Use insert before/after to add adjacent blocks.`,
          };
        }
        const replacement: PlateBlock = { ...newBlocks[0], id: op.blockId };
        const next = [...current];
        next[index] = replacement;
        current = next;
        break;
      }
      case "insertBefore":
      case "insertAfter": {
        const index = findBlockIndexById(current, op.anchorId);
        if (index === -1) {
          return {
            ok: false,
            hunkIndex: i,
            error: `block:${op.anchorId} no longer in document at apply time.`,
          };
        }
        const newBlocks = deserializeBody(op.body);
        if (newBlocks.length === 0) {
          return {
            ok: false,
            hunkIndex: i,
            error: `insert body produced no Plate blocks.`,
          };
        }
        const insertAt = op.kind === "insertBefore" ? index : index + 1;
        const next = [
          ...current.slice(0, insertAt),
          ...newBlocks,
          ...current.slice(insertAt),
        ];
        current = next;
        break;
      }
      case "insertStart": {
        const newBlocks = deserializeBody(op.body);
        if (newBlocks.length === 0) {
          return {
            ok: false,
            hunkIndex: i,
            error: `insert start body produced no Plate blocks.`,
          };
        }
        current = [...newBlocks, ...current];
        break;
      }
      case "insertEnd": {
        const newBlocks = deserializeBody(op.body);
        if (newBlocks.length === 0) {
          return {
            ok: false,
            hunkIndex: i,
            error: `insert end body produced no Plate blocks.`,
          };
        }
        current = [...current, ...newBlocks];
        break;
      }
      case "delete": {
        const index = findBlockIndexById(current, op.blockId);
        if (index === -1) {
          return {
            ok: false,
            hunkIndex: i,
            error: `block:${op.blockId} no longer in document at apply time.`,
          };
        }
        current = [...current.slice(0, index), ...current.slice(index + 1)];
        break;
      }
    }
  }

  return { ok: true, doc: current };
}

function summarizeOps(ops: Operation[]): string {
  const counts = { replace: 0, insert: 0, delete: 0 };
  for (const op of ops) {
    if (op.kind === "replace") counts.replace++;
    else if (op.kind === "delete") counts.delete++;
    else counts.insert++;
  }
  const parts: string[] = [];
  if (counts.replace > 0) parts.push(`${counts.replace} replace`);
  if (counts.insert > 0) parts.push(`${counts.insert} insert`);
  if (counts.delete > 0) parts.push(`${counts.delete} delete`);
  return parts.join(", ") || "no-op";
}

export default function patchDocumentContentTool({
  threadCtx,
}: {
  threadCtx: ThreadCtx;
}) {
  const { canvasId } = threadCtx;

  return createTool({
    description: [
      "Apply one or more block-level patches to a document node, anchored on stable block ids you got from `read_nodes`. Edits other than the targeted block(s) are left bit-for-bit untouched in the stored Plate JSON, so text colors, font sizes, table column widths, suggestions and other Plate-specific metadata of untouched blocks are preserved.",
      "",
      "Format (single block per call):",
      "*** Begin Patch",
      "@@ replace block:<id>",
      "<full markdown for the new block (must produce exactly one top-level block)>",
      "@@ insert after block:<id>",
      "<markdown for one or more new blocks>",
      "@@ insert before block:<id>",
      "<markdown for one or more new blocks>",
      "@@ insert start",
      "<markdown for one or more new blocks at the start of the doc>",
      "@@ insert end",
      "<markdown for one or more new blocks at the end of the doc>",
      "@@ delete block:<id>",
      "*** End Patch",
      "",
      "Rules:",
      "- Wrap everything in a single `*** Begin Patch` / `*** End Patch` block.",
      "- Each hunk starts with `@@ <op>` on its own line, followed by markdown body (no `+`/`-`/` ` prefixes).",
      "- For `delete`, the body must be empty.",
      "- For `replace`, the body must produce exactly 1 top-level block.",
      "- A given `block:<id>` can be referenced by at most one hunk in the patch.",
      "- All-or-nothing: any error aborts the whole patch and writes nothing.",
      "- Block ids are short stable strings of the form `[block:abc123]` you read in the document.",
      "",
      "Note: editing a block re-parses its body from markdown, so Plate-specific metadata inside the edited block (e.g. table column widths, custom date nodes) may be normalized away. Other blocks are unaffected.",
    ].join("\n"),
    inputSchema: z.object({
      nodeId: z.string().describe("The node ID in the current canvas."),
      patch: z
        .string()
        .min(1)
        .describe(
          "The patch payload, wrapped in `*** Begin Patch` / `*** End Patch`, with one or more `@@` operation hunks. See tool description for the exact format.",
        ),
      explanation: z.string().describe("3-5 words explaining the edit intent."),
    }),
    execute: async (ctx, input): Promise<string> => {
      console.log(
        `📝 Document patch requested on node ${input.nodeId} (${input.explanation})`,
      );

      try {
        const { nodeId, patch } = input;

        const parsed = parsePatchHunks(patch);
        if (!parsed.ok) {
          return toolError(parsed.error);
        }

        const { node, nodeData } = await ctx.runQuery(
          internal.wrappers.canvasNodeWrappers.getNodeWithNodeData,
          {
            canvasId,
            nodeId,
          },
        );

        if (node.type !== "document" || nodeData.type !== "document") {
          return ERROR_TARGET_NOT_DOCUMENT;
        }

        const storedDoc = nodeData.values.doc;
        const parsedDoc = parseStoredPlateDocument(storedDoc);
        if (!parsedDoc) {
          return ERROR_INVALID_PLATE_DOC;
        }

        const docWithIds = ensureBlockIds(parsedDoc as PlateBlock[]);

        const resolved = resolveHunks(parsed.hunks, docWithIds);
        if (!resolved.ok) {
          return toolError(`Patch aborted (no changes written). ${resolved.error}`);
        }

        const applied = applyOps(docWithIds, resolved.ops);
        if (!applied.ok) {
          return toolError(
            `Patch aborted (no changes written). Hunk ${applied.hunkIndex}: ${applied.error}`,
          );
        }

        // Normalize ids on write: any block missing an id (newly inserted) gets
        // one, and any non-short legacy id (e.g. UUID) is shortened so future
        // reads use the compact form.
        const finalDoc = ensureBlockIds(applied.doc, { shortenExisting: true });

        const serialized = stringifyPlateDocumentForStorage(finalDoc);

        await ctx.runMutation(internal.wrappers.nodeDataWrappers.updateValues, {
          _id: nodeData._id,
          values: {
            ...nodeData.values,
            doc: serialized,
          },
        });

        const summary = summarizeOps(resolved.ops);
        console.log(
          `✅ Document patch complete for node ${nodeId} (${summary})`,
        );

        return `Successfully applied patch to document (${summary}).`;
      } catch (error) {
        console.error("Document patch tool error:", error);
        return toolError(
          error instanceof Error ? error.message : String(error),
        );
      }
    },
  });
}
