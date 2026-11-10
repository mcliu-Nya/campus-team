import { defaultDeadlineIso } from '@/lib/date';
import type { ActivityType, ContactType, ISODateString } from './models';

/** 登录 / 注册表单（三者合一即为注册） */
export interface LoginFormValues {
  realName: string;
  studentId: string;
  college: string;
}

/** 发布 / 编辑招募表单：人数以字符串保存，便于输入与校验 */
export interface RecruitmentFormValues {
  title: string;
  college: string;
  activityType: ActivityType;
  neededCount: string;
  requirements: string;
  contactType: ContactType;
  contact: string;
  activityUrl: string;
  extra: string;
  deadline: ISODateString | null;
}

/** 加入队伍弹窗 */
export interface JoinFormValues {
  contactType: ContactType;
  contact: string;
}

export type FormErrors<T> = Partial<Record<keyof T, string>>;

export const EMPTY_LOGIN_FORM: LoginFormValues = {
  realName: '',
  studentId: '',
  college: '',
};

export const EMPTY_RECRUITMENT_FORM: RecruitmentFormValues = {
  title: '',
  college: '',
  activityType: 'competition',
  neededCount: '3',
  requirements: '',
  contactType: 'wechat',
  contact: '',
  activityUrl: '',
  extra: '',
  // 截止时间为必填项，默认明天 18:00
  deadline: defaultDeadlineIso(),
};
