/** 与前端 src/lib/mask.ts 保持一致的脱敏规则。 */

export function maskStudentId(studentId: string): string {
  if (studentId.length <= 4) return `${studentId.slice(0, 1)}***`;
  return `${studentId.slice(0, 4)}****${studentId.slice(-2)}`;
}

export function maskContact(contact: string): string {
  const value = contact.trim();
  if (value.length <= 2) return '***';
  if (/^1\d{10}$/.test(value)) return `${value.slice(0, 3)}****${value.slice(-4)}`;
  if (value.includes('@')) {
    const [name = '', domain = ''] = value.split('@');
    const head = name.slice(0, 1);
    return `${head}***@${domain}`;
  }
  if (value.length <= 4) return `${value.slice(0, 1)}***`;
  return `${value.slice(0, 2)}***${value.slice(-2)}`;
}
