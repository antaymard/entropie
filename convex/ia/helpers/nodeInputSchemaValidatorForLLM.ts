import { z } from "zod";
import { nodeDataConfig, nodeTypeZodValidator } from "../../config/nodeConfig";

type NodeType = z.infer<typeof nodeTypeZodValidator>;

function formatIssue(issue: z.ZodIssue): string {
  const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
  return `- ${path}: ${issue.message}`;
}

function getSchemaAsJsonString(schema: z.ZodTypeAny): string {
  try {
    const zodWithJson = z as unknown as {
      toJSONSchema?: (input: z.ZodTypeAny) => unknown;
    };

    if (typeof zodWithJson.toJSONSchema === "function") {
      return JSON.stringify(zodWithJson.toJSONSchema(schema), null, 2);
    }
  } catch {
    // Ignore serialization errors and return fallback message below.
  }

  return "Schema JSON serialization is unavailable.";
}

/**
 * Validates tool input against a node's schema and returns a readable string error for LLMs.
 * Returns null when input is valid.
 */
export function validateNodeInputSchemaForLLM({
  nodeType,
  input,
}: {
  nodeType: NodeType;
  input: unknown;
}): string | null {
  const nodeConfig = nodeDataConfig.find((config) => config.type === nodeType);

  if (!nodeConfig) {
    const supportedTypes = nodeTypeZodValidator.options.join(", ");
    return [
      "Input validation failed.",
      `Unknown node type: ${nodeType}.`,
      `Supported node types: ${supportedTypes}.`,
    ].join("\n");
  }

  const schema = nodeConfig.toolInputSchema ?? nodeConfig.dataValuesSchema;
  const parsed = schema.safeParse(input);
  if (parsed.success) {
    return null;
  }

  const incorrectFields = parsed.error.issues.map(formatIssue).join("\n");
  const schemaJson = getSchemaAsJsonString(schema);

  return [
    "Input validation failed for update_node_data_values.",
    `Node type: ${nodeType}`,
    "Incorrect fields:",
    incorrectFields || "- (unknown issue)",
    "Expected global schema (JSON Schema):",
    schemaJson,
    "Please provide only a JSON object that strictly matches this schema.",
  ].join("\n");
}
