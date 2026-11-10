/** REST 路径常量：与 docs/api.md 中的契约一一对应。 */
export const endpoints = {
  login: '/auth/login',
  me: '/auth/me',

  recruitments: '/recruitments',
  recruitment: (id: string) => `/recruitments/${id}`,
  join: (id: string) => `/recruitments/${id}/join`,
  leave: (id: string) => `/recruitments/${id}/leave`,
  removeMember: (id: string) => `/recruitments/${id}/remove`,
  cancel: (id: string) => `/recruitments/${id}/cancel`,
  reopen: (id: string) => `/recruitments/${id}/reopen`,

  myTeams: '/my/teams',
  myRecruitments: '/my/recruitments',
  myEnded: '/my/ended',

  notifications: '/notifications',
  notificationRead: (id: string) => `/notifications/${id}/read`,
} as const;
