export function generateLlmId(): string {
  const digits = () =>
    String(Math.floor(Math.random() * 1000)).padStart(3, "0");
  const letter = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    return chars[Math.floor(Math.random() * chars.length)];
  };

  return `${digits()}${letter()}${digits()}${letter()}`;
}
