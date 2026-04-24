const ALPHA_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DEFAULT_CHUNK_COUNT = 4;
const CHUNK_PATTERN = "[A-Za-z]{3}\\d";

function assertValidChunkCount(chunkCount: number): void {
  if (!Number.isInteger(chunkCount) || chunkCount < 1) {
    throw new Error("chunkCount must be an integer greater than 0");
  }
}

function buildLlmIdPattern(chunkCount: number): string {
  assertValidChunkCount(chunkCount);
  return `(?:${CHUNK_PATTERN}){${chunkCount}}`;
}

function randomLetter(): string {
  return ALPHA_CHARS[Math.floor(Math.random() * ALPHA_CHARS.length)];
}

function randomDigit(): string {
  return String(Math.floor(Math.random() * 10));
}

export function generateLlmId(
  chunkCount: number = DEFAULT_CHUNK_COUNT,
): string {
  assertValidChunkCount(chunkCount);

  let value = "";
  for (let i = 0; i < chunkCount; i++) {
    value += `${randomLetter()}${randomLetter()}${randomLetter()}${randomDigit()}`;
  }
  return value;
}

export function matchesLlmIdFormat(
  value: string,
  chunkCount: number = DEFAULT_CHUNK_COUNT,
): boolean {
  const regex = new RegExp(`^${buildLlmIdPattern(chunkCount)}$`);
  return regex.test(value);
}

export function matchLlmIdsInText(
  text: string,
  chunkCount: number = DEFAULT_CHUNK_COUNT,
): string[] {
  const pattern = buildLlmIdPattern(chunkCount);
  const globalRegex = new RegExp(`\\b${pattern}\\b`, "g");
  const matches = text.match(globalRegex) ?? [];
  return [...new Set(matches)].filter((value) =>
    matchesLlmIdFormat(value, chunkCount),
  );
}
