/** 脱敏工具：列表、非队伍成员场景下隐藏联系方式与学号。 */

export function maskContact(contact: string): string {
  const value = contact.trim();
  if (!value) return '—';

  // 手机号
  if (/^1[3-9]\d{9}$/.test(value)) {
    return `${value.slice(0, 3)}****${value.slice(7)}`;
  }

  // 邮箱
  if (value.includes('@')) {
    const [name, domain] = value.split('@');
    const head = name.slice(0, 1);
    return `${head}***@${domain}`;
  }

  // QQ / 纯数字
  if (/^\d{5,12}$/.test(value)) {
    if (value.length <= 4) return `${value.slice(0, 1)}***`;
    return `${value.slice(0, 2)}****${value.slice(-2)}`;
  }

  // 微信号等：保留前 2 位与后 2 位
  if (value.length <= 4) {
    return `${value.slice(0, 1)}***`;
  }
  return `${value.slice(0, 2)}****${value.slice(-2)}`;
}

export function maskStudentId(studentId: string): string {
  const value = studentId.trim();
  if (value.length <= 4) return value;
  return `${value.slice(0, 2)}${'*'.repeat(Math.max(value.length - 4, 2))}${value.slice(-2)}`;
}

export function maskName(name: string): string {
  const value = name.trim();
  if (value.length <= 1) return value;
  return `${value.slice(0, 1)}${'*'.repeat(value.length - 1)}`;
}
