export function generateLlmId(): string {
  const digits = () =>
    String(Math.floor(Math.random() * 1000)).padStart(3, "0");
  const letter = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    return chars[Math.floor(Math.random() * chars.length)];
  };

  return `${digits()}${letter()}${digits()}${letter()}`;
}

const LLM_ID_PATTERN = "\\d{3}[A-Za-z]\\d{3}[A-Za-z]";
const LLM_ID_REGEX = new RegExp(`^${LLM_ID_PATTERN}$`);
const LLM_ID_GLOBAL_REGEX = new RegExp(`\\b${LLM_ID_PATTERN}\\b`, "g");

export function matchesLlmIdFormat(value: string): boolean {
  return LLM_ID_REGEX.test(value);
}

export function matchLlmIdsInText(text: string): string[] {
  const matches = text.match(LLM_ID_GLOBAL_REGEX) ?? [];
  return [...new Set(matches)].filter(matchesLlmIdFormat);
}
