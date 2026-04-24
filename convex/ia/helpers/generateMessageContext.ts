import type { NoleMessageMetadata } from "../nole";

function sanitizeXmlTagName(value: string): string {
  const sanitized = value.replace(/[^A-Za-z0-9_-]/g, "_");
  return /^[A-Za-z_]/.test(sanitized) ? sanitized : `value_${sanitized}`;
}

function valueToXml(tagName: string, value: unknown, indent = 0): string {
  const safeTagName = sanitizeXmlTagName(tagName);
  const prefix = "  ".repeat(indent);

  if (value === null || value === undefined) {
    return `${prefix}<${safeTagName} />`;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return `${prefix}<${safeTagName} />`;
    }

    const items = value
      .map((item) => valueToXml("item", item, indent + 1))
      .join("\n");

    return `${prefix}<${safeTagName}>\n${items}\n${prefix}</${safeTagName}>`;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);

    if (entries.length === 0) {
      return `${prefix}<${safeTagName} />`;
    }

    const children = entries
      .map(([key, childValue]) => valueToXml(key, childValue, indent + 1))
      .join("\n");

    return `${prefix}<${safeTagName}>\n${children}\n${prefix}</${safeTagName}>`;
  }

  return `${prefix}<${safeTagName}>${String(value)}</${safeTagName}>`;
}

export function generateMessageContext({
  metadata,
  canvasChangesSinceLastMessage,
}: {
  metadata?: NoleMessageMetadata;
  canvasChangesSinceLastMessage: string;
}): string {
  const runtimeParts: string[] = [];
  const messageContext = metadata?.messageContext;

  if (typeof messageContext === "string") {
    const trimmedMessageContext = messageContext.trim();
    if (trimmedMessageContext) {
      runtimeParts.push(trimmedMessageContext);
    }
  } else if (messageContext !== null && messageContext !== undefined) {
    runtimeParts.push(valueToXml("message_context", messageContext));
  }

  const trimmedCanvasChangesSinceLastMessage =
    canvasChangesSinceLastMessage.trim();
  if (trimmedCanvasChangesSinceLastMessage) {
    runtimeParts.push(trimmedCanvasChangesSinceLastMessage);
  }

  return runtimeParts.join("\n\n");
}
