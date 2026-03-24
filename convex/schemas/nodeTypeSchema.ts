import { v, type Infer } from "convex/values";

const nodeTypeValues = [
  "link",
  "image",
  "document",
  "value",
  "embed",
  "floatingText",
  "file",
] as const;

const nodeTypeValidator = v.union(
  ...nodeTypeValues.map((type) => v.literal(type)),
);

type NodeType = Infer<typeof nodeTypeValidator>;

export { nodeTypeValues, nodeTypeValidator };
export type { NodeType };
