/** 文本工具 */
export function truncate(text: string, max: number): string {
  const value = text.replace(/\s+/g, ' ').trim();
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(max - 1, 0))}…`;
}

export function firstNameChar(name: string): string {
  return name.trim().slice(0, 1) || '?';
}
