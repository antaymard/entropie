export function parseStoredPlateDocument(doc: unknown): Array<unknown> | null {
  if (Array.isArray(doc)) {
    return doc;
  }

  if (typeof doc === "string") {
    try {
      const parsed = JSON.parse(doc);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  return null;
}

export function stringifyPlateDocumentForStorage(doc: unknown): unknown {
  if (Array.isArray(doc)) {
    return JSON.stringify(doc);
  }

  return doc;
}
