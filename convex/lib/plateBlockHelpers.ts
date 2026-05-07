/**
 * Helpers for top-level Plate block manipulation by stable id.
 *
 * Used by `patch_document_content` to anchor edits on a per-block basis without
 * round-tripping the entire document through markdown (which loses Plate-specific
 * metadata like text color, font size, table column widths, etc.).
 *
 * IDs are short (6-char base36) for token efficiency in LLM payloads. Plate's
 * front-end `normalizeNodeId()` only assigns ids to blocks that lack one, so a
 * short id we put here survives the front-end load.
 */

const SHORT_ID_LENGTH = 6;
const SHORT_ID_REGEX = /^[a-z0-9]{6}$/;

export function generateBlockId(): string {
  // Math.random base36 yields ~10 chars after "0.". Slice to 6 for a compact id.
  // 36^6 ≈ 2.2 G — collision is negligible at <1k blocks/doc.
  let id = Math.random().toString(36).slice(2, 2 + SHORT_ID_LENGTH);
  while (id.length < SHORT_ID_LENGTH) {
    id += Math.random().toString(36).slice(2, 2 + SHORT_ID_LENGTH - id.length);
  }
  return id;
}

function isShortBlockId(value: unknown): value is string {
  return typeof value === "string" && SHORT_ID_REGEX.test(value);
}

export function findBlockIndexById(
  nodes: Array<Record<string, unknown>>,
  id: string,
): number {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i] && (nodes[i] as { id?: unknown }).id === id) return i;
  }
  return -1;
}

/**
 * Returns a new array where every top-level block has a string `id`.
 *
 * - Blocks without an id receive a freshly generated short id.
 * - Blocks with an existing id keep it by default. With `shortenExisting: true`,
 *   any non-short-form id (e.g. a Plate UUID v4) is replaced with a short one.
 *   We use that on every write so old documents converge to short ids.
 *
 * Uniqueness is enforced: if two blocks happen to share the same id (unlikely),
 * the second one is regenerated.
 */
export function ensureBlockIds<T extends Record<string, unknown>>(
  nodes: T[],
  opts?: { shortenExisting?: boolean },
): T[] {
  const shorten = opts?.shortenExisting ?? false;
  const seen = new Set<string>();
  return nodes.map((node) => {
    const existing = (node as { id?: unknown }).id;
    let nextId: string;
    if (typeof existing === "string" && existing.length > 0) {
      if (shorten && !isShortBlockId(existing)) {
        nextId = generateBlockId();
        while (seen.has(nextId)) nextId = generateBlockId();
      } else if (seen.has(existing)) {
        nextId = generateBlockId();
        while (seen.has(nextId)) nextId = generateBlockId();
      } else {
        nextId = existing;
      }
    } else {
      nextId = generateBlockId();
      while (seen.has(nextId)) nextId = generateBlockId();
    }
    seen.add(nextId);
    if (nextId === existing) return node;
    return { ...node, id: nextId };
  });
}
