import { CONTACT_TYPE_MAP } from '@/constants/options';
import type {
  FormErrors,
  LoginFormValues,
  RecruitmentFormValues,
} from '@/types/forms';
import type { ContactType } from '@/types/models';

/** 表单校验（前端第一道校验；后端会再次校验） */

export const CONTACT_HINT = '支持 QQ、微信、电话三种联系方式';

const PHONE_RE = /^1[3-9]\d{9}$/;
const LANDLINE_RE = /^0\d{2,3}-?\d{7,8}$/;
const QQ_RE = /^[1-9]\d{4,10}$/;
const WECHAT_RE = /^[a-zA-Z][-_a-zA-Z0-9]{5,19}$/;

export function isPhone(value: string): boolean {
  return PHONE_RE.test(value.trim());
}

export function validateRealName(value: string): string | null {
  const name = value.trim();
  if (!name) return '请填写真实姓名';
  if (name.length < 2 || name.length > 20) return '姓名长度需在 2-20 个字符之间';
  if (/\d/.test(name)) return '姓名不能包含数字';
  return null;
}

export function validateStudentId(value: string): string | null {
  const id = value.trim();
  if (!id) return '请填写学号';
  if (!/^[A-Za-z0-9]{4,20}$/.test(id)) return '学号应为 4-20 位字母或数字';
  return null;
}

export function validateCollege(value: string): string | null {
  if (!value.trim()) return '请选择二级学院';
  return null;
}

export function validateTitle(value: string): string | null {
  const title = value.trim();
  if (!title) return '请填写活动名称';
  if (title.length < 2) return '活动名称至少 2 个字符';
  if (title.length > 40) return '活动名称最多 40 个字符';
  return null;
}

export function validateNeededCount(value: string): string | null {
  const raw = value.trim();
  if (!raw) return '请填写需要人数';
  if (!/^\d+$/.test(raw)) return '需要人数必须是正整数';
  const count = Number(raw);
  if (count < 1) return '需要人数至少为 1';
  if (count > 100) return '需要人数不能超过 100';
  return null;
}

export function validateRequirements(value: string): string | null {
  const text = value.trim();
  if (!text) return '请填写队员要求';
  if (text.length < 5) return '要求描述至少 5 个字符';
  if (text.length > 300) return '要求描述最多 300 个字符';
  return null;
}

/** 联系方式按所选类型分别校验，避免出现“填了 QQ 号却标成电话”的情况 */
export function validateContact(value: string, type: ContactType = 'wechat'): string | null {
  const contact = value.trim();
  const meta = CONTACT_TYPE_MAP[type];
  if (!contact) return `请填写${meta.label}联系方式`;

  switch (type) {
    case 'phone':
      if (PHONE_RE.test(contact) || LANDLINE_RE.test(contact)) return null;
      return '电话格式不正确：11 位手机号，或带区号的座机号（如 010-12345678）';
    case 'qq':
      if (QQ_RE.test(contact)) return null;
      return 'QQ 号格式不正确：5-11 位数字，首位不能为 0';
    case 'wechat':
    default:
      if (WECHAT_RE.test(contact)) return null;
      return '微信号格式不正确：6-20 位字母、数字、下划线或减号，需以字母开头';
  }
}

export function validateActivityUrl(value: string): string | null {
  const url = value.trim();
  if (!url) return '请填写活动链接';
  if (!/^https?:\/\//i.test(url)) return '活动链接需以 http:// 或 https:// 开头';
  try {
    new URL(url);
  } catch {
    return '活动链接格式不正确';
  }
  return null;
}

export function validateExtra(value: string): string | null {
  if (value.trim().length > 500) return '补充内容最多 500 个字符';
  return null;
}

export function validateDeadline(value: string | null): string | null {
  if (!value) return '请选择报名截止时间';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '截止时间格式不正确';
  if (date.getTime() < Date.now()) return '截止时间需晚于当前时间';
  return null;
}

export function validateLoginForm(values: LoginFormValues): FormErrors<LoginFormValues> {
  const errors: FormErrors<LoginFormValues> = {};
  const realName = validateRealName(values.realName);
  const studentId = validateStudentId(values.studentId);
  const college = validateCollege(values.college);
  if (realName) errors.realName = realName;
  if (studentId) errors.studentId = studentId;
  if (college) errors.college = college;
  return errors;
}

export function validateRecruitmentForm(
  values: RecruitmentFormValues,
): FormErrors<RecruitmentFormValues> {
  const errors: FormErrors<RecruitmentFormValues> = {};
  const title = validateTitle(values.title);
  const college = validateCollege(values.college);
  const neededCount = validateNeededCount(values.neededCount);
  const requirements = validateRequirements(values.requirements);
  const contact = validateContact(values.contact, values.contactType);
  const activityUrl = validateActivityUrl(values.activityUrl);
  const extra = validateExtra(values.extra);
  const deadline = validateDeadline(values.deadline);

  if (title) errors.title = title;
  if (college) errors.college = college;
  if (neededCount) errors.neededCount = neededCount;
  if (requirements) errors.requirements = requirements;
  if (contact) errors.contact = contact;
  if (activityUrl) errors.activityUrl = activityUrl;
  if (extra) errors.extra = extra;
  if (deadline) errors.deadline = deadline;

  return errors;
}

export function hasErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some(Boolean);
}
