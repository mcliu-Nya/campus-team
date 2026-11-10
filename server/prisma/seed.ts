// 开发环境种子数据：与前端 local 模式的演示数据保持一致，
// 便于 `DATA_MODE=remote` 时租到同样的界面效果。
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const now = Date.now();
const ago = (ms: number) => new Date(now - ms);
const ahead = (ms: number) => new Date(now + ms);

async function main(): Promise<void> {
  // 开发库可以安全清空：这是演示数据脚本，不用于生产环境。
  await prisma.notification.deleteMany();
  await prisma.joinRecord.deleteMany();
  await prisma.recruitment.deleteMany();
  await prisma.user.deleteMany();

  const [self, li, wang, chen, su, zhao] = await Promise.all([
    prisma.user.create({ data: { realName: '张三', studentId: '2021001', college: '通信与信息工程学院' } }),
    prisma.user.create({ data: { realName: '李思远', studentId: '2021003', college: '通信与信息工程学院' } }),
    prisma.user.create({ data: { realName: '王雨萌', studentId: '2021004', college: '电子技术与工程学院' } }),
    prisma.user.create({ data: { realName: '陈嘉禾', studentId: '2022033', college: '经济与管理学院' } }),
    prisma.user.create({ data: { realName: '苏雨桐', studentId: '2021118', college: '外语学院' } }),
    prisma.user.create({ data: { realName: '赵子昂', studentId: '2020077', college: '机械与能源工程学院' } }),
  ]);

  const modeling = await prisma.recruitment.create({
    data: {
      title: '全国大学生数学建模竞赛省赛组队',
      college: self.college,
      activityType: 'competition',
      neededCount: 3,
      requirements: '熟悉 MATLAB 或 Python，能承担建模、编程、论文写作中的一项；有数学建模竞赛经历优先。',
      contact: '13800001234',
      contactType: 'phone',
      activityUrl: 'https://www.mcm.edu.cn/',
      extra: '省赛一等奖可申请学院创新学分，暑期集中培训两周，提供机房和指导老师。',
      deadline: ahead(12 * DAY),
      publisherId: self.id,
      publisherName: self.realName,
      publisherCollege: self.college,
      createdAt: ago(3 * HOUR),
      updatedAt: ago(3 * HOUR),
    },
  });

  const garbage = await prisma.recruitment.create({
    data: {
      title: '校园智能垃圾分类小程序开发',
      college: '申安网络安全产业学院',
      activityType: 'innovation',
      neededCount: 2,
      requirements: '需要 1 名前端（React Native 或小程序）与 1 名后端（Node.js），能保证每周 6 小时投入。',
      contact: 'wangyumeng_wx',
      contactType: 'wechat',
      activityUrl: 'https://github.com/example/campus-garbage',
      extra: '项目已立项，指导老师为计算机学院王老师，成果可参加校级创新创业大赛。',
      deadline: ahead(20 * DAY),
      publisherId: wang.id,
      publisherName: wang.realName,
      publisherCollege: wang.college,
      createdAt: ago(9 * HOUR),
      updatedAt: ago(9 * HOUR),
    },
  });

  const challenge = await prisma.recruitment.create({
    data: {
      title: '“挑战杯”红色专项社会实践调研',
      college: '通信与信息工程学院',
      activityType: 'research',
      neededCount: 4,
      requirements: '会做问卷设计与数据分析，或擅长视频剪辑与调研报告撰写；能参加 3 天线下走访。',
      contact: '22334455',
      contactType: 'qq',
      activityUrl: 'https://www.tiaozhanbei.net/',
      extra: '调研地点为南京市内红色场馆，交通与餐费由学院统一报销。',
      deadline: ahead(6 * DAY),
      publisherId: li.id,
      publisherName: li.realName,
      publisherCollege: li.college,
      createdAt: ago(1 * DAY),
      updatedAt: ago(1 * DAY),
    },
  });

  const basketball = await prisma.recruitment.create({
    data: {
      title: '校运会篮球 3v3 缺 2 人',
      college: '机械与能源工程学院',
      activityType: 'sports',
      neededCount: 5,
      requirements: '有一定篮球基础，能参加每周两次傍晚训练，服从球队分工。',
      contact: 'zhaoza_2020',
      contactType: 'wechat',
      activityUrl: 'https://example.edu/sports/2026',
      extra: '比赛时间为 11 月下旬，队伍已组建 3 人，队服由学院提供。',
      deadline: ahead(4 * DAY),
      publisherId: zhao.id,
      publisherName: zhao.realName,
      publisherCollege: zhao.college,
      createdAt: ago(2 * DAY),
      updatedAt: ago(2 * DAY),
    },
  });

  const library = await prisma.recruitment.create({
    data: {
      title: '社区图书馆周末志愿讲解',
      college: '外语学院',
      activityType: 'volunteer',
      neededCount: 6,
      requirements: '普通话标准，喜欢与小朋友交流；每周六上午 9:00-11:30，可排班参加。',
      contact: 'suyutong_wx',
      contactType: 'wechat',
      activityUrl: 'https://example.edu/volunteer/library',
      extra: '提供志愿时长认定与午餐，学期末评选优秀志愿者。',
      deadline: ahead(9 * DAY),
      publisherId: su.id,
      publisherName: su.realName,
      publisherCollege: su.college,
      createdAt: ago(30 * HOUR),
      updatedAt: ago(30 * HOUR),
    },
  });

  const structure = await prisma.recruitment.create({
    data: {
      title: '结构设计大赛省赛招募建模手',
      college: '经济与管理学院',
      activityType: 'competition',
      neededCount: 3,
      requirements: '会使用 SAP2000 或 MIDAS 建模，了解结构力学基本概念，能配合完成加载试验。',
      contact: 'chenjh_2022',
      contactType: 'wechat',
      activityUrl: 'https://example.edu/structure',
      extra: '学院提供材料与模型制作场地，去年获省二等奖。',
      deadline: ahead(15 * DAY),
      publisherId: chen.id,
      publisherName: chen.realName,
      publisherCollege: chen.college,
      createdAt: ago(2 * DAY + 5 * HOUR),
      updatedAt: ago(2 * DAY + 5 * HOUR),
    },
  });

  const programContest = await prisma.recruitment.create({
    data: {
      title: '程序设计竞赛集训队（已结束）',
      college: self.college,
      activityType: 'competition',
      neededCount: 2,
      requirements: '熟悉 C++ 与基础算法，能坚持每周三次集训。',
      contact: '13800001234',
      contactType: 'phone',
      activityUrl: 'https://example.edu/icpc',
      extra: '集训已结束，队伍获得省赛银奖。',
      publisherId: self.id,
      publisherName: self.realName,
      publisherCollege: self.college,
      status: 'ended',
      createdAt: ago(9 * DAY),
      updatedAt: ago(8 * DAY),
    },
  });

  const startup = await prisma.recruitment.create({
    data: {
      title: '创业沙龙筹备组（已取消）',
      college: '创新创业（世赛）学院',
      activityType: 'practice',
      neededCount: 4,
      requirements: '对创业活动策划感兴趣，能参与场地对接与嘉宾邀请。',
      contact: '13800001234',
      contactType: 'phone',
      activityUrl: 'https://example.edu/startup',
      extra: '因场地调整，本次活动取消。',
      publisherId: self.id,
      publisherName: self.realName,
      publisherCollege: self.college,
      status: 'cancelled',
      createdAt: ago(6 * DAY),
      updatedAt: ago(5 * DAY),
    },
  });

  const joinData = [
    { recruitmentId: modeling.id, user: li, contact: 'lisiyuan_wx', contactType: 'wechat' as const, joinedAt: ago(2 * HOUR) },
    { recruitmentId: modeling.id, user: wang, contact: 'wangyumeng_wx', contactType: 'wechat' as const, joinedAt: ago(1 * HOUR) },
    { recruitmentId: garbage.id, user: self, contact: '13800001234', contactType: 'phone' as const, joinedAt: ago(5 * HOUR) },
    { recruitmentId: challenge.id, user: chen, contact: '22334455', contactType: 'qq' as const, joinedAt: ago(20 * HOUR) },
    { recruitmentId: basketball.id, user: self, contact: '13800001234', contactType: 'phone' as const, joinedAt: ago(30 * HOUR) },
    { recruitmentId: basketball.id, user: li, contact: 'lisiyuan_wx', contactType: 'wechat' as const, joinedAt: ago(28 * HOUR) },
    { recruitmentId: basketball.id, user: wang, contact: 'wangyumeng_wx', contactType: 'wechat' as const, joinedAt: ago(26 * HOUR) },
    { recruitmentId: basketball.id, user: chen, contact: 'chenjh_2022', contactType: 'wechat' as const, joinedAt: ago(24 * HOUR) },
    { recruitmentId: basketball.id, user: su, contact: 'suyutong_wx', contactType: 'wechat' as const, joinedAt: ago(22 * HOUR) },
    { recruitmentId: library.id, user: chen, contact: 'chenjh_2022', contactType: 'wechat' as const, joinedAt: ago(20 * HOUR) },
    { recruitmentId: structure.id, user: self, contact: '13800001234', contactType: 'phone' as const, joinedAt: ago(40 * HOUR) },
    { recruitmentId: programContest.id, user: li, contact: 'lisiyuan_wx', contactType: 'wechat' as const, joinedAt: ago(8 * DAY) },
    {
      recruitmentId: programContest.id,
      user: su,
      contact: 'suyutong_wx',
      contactType: 'wechat' as const,
      joinedAt: ago(8 * DAY),
      status: 'left' as const,
    },
  ];

  for (const item of joinData) {
    await prisma.joinRecord.create({
      data: {
        recruitmentId: item.recruitmentId,
        userId: item.user.id,
        realName: item.user.realName,
        studentId: item.user.studentId,
        college: item.user.college,
        contact: item.contact,
        contactType: item.contactType,
        joinedAt: item.joinedAt,
        updatedAt: item.joinedAt,
        status: item.status ?? 'active',
      },
    });
  }

  // joinedCount 与有效加入保持一致；满员招募置为 full。
  const activeCounts = await prisma.joinRecord.groupBy({
    by: ['recruitmentId'],
    where: { status: 'active' },
    _count: { _all: true },
  });
  for (const row of activeCounts) {
    const recruitment = await prisma.recruitment.findUnique({ where: { id: row.recruitmentId } });
    if (!recruitment) continue;
    const count = row._count._all;
    await prisma.recruitment.update({
      where: { id: row.recruitmentId },
      data: {
        joinedCount: count,
        status:
          recruitment.status === 'recruiting' && count >= recruitment.neededCount ? 'full' : recruitment.status,
      },
      // updatedAt 跟随改动，但种子数据的相对时间仍然直观可读。
    });
  }
  // 上面 update 会刷新 updatedAt，这里把演示数据的更新时间恢复成种子设定。
  await prisma.recruitment.update({ where: { id: modeling.id }, data: { updatedAt: ago(3 * HOUR) } });
  await prisma.recruitment.update({ where: { id: garbage.id }, data: { updatedAt: ago(9 * HOUR) } });
  await prisma.recruitment.update({ where: { id: challenge.id }, data: { updatedAt: ago(1 * DAY) } });
  await prisma.recruitment.update({ where: { id: basketball.id }, data: { updatedAt: ago(2 * DAY) } });
  await prisma.recruitment.update({ where: { id: library.id }, data: { updatedAt: ago(30 * HOUR) } });
  await prisma.recruitment.update({ where: { id: structure.id }, data: { updatedAt: ago(2 * DAY + 5 * HOUR) } });
  await prisma.recruitment.update({ where: { id: programContest.id }, data: { updatedAt: ago(8 * DAY) } });
  await prisma.recruitment.update({ where: { id: startup.id }, data: { updatedAt: ago(5 * DAY) } });

  await prisma.notification.createMany({
    data: [
      {
        recipientUserId: self.id,
        recruitmentId: modeling.id,
        recruitmentTitle: modeling.title,
        joinerUserId: wang.id,
        joinerName: wang.realName,
        joinerStudentId: wang.studentId,
        joinerCollege: wang.college,
        joinerContact: 'wangyumeng_wx',
        joinerContactType: 'wechat',
        content: `「${modeling.title}」有新成员加入`,
        read: false,
        createdAt: ago(1 * HOUR),
      },
      {
        recipientUserId: self.id,
        recruitmentId: modeling.id,
        recruitmentTitle: modeling.title,
        joinerUserId: li.id,
        joinerName: li.realName,
        joinerStudentId: li.studentId,
        joinerCollege: li.college,
        joinerContact: 'lisiyuan_wx',
        joinerContactType: 'wechat',
        content: `「${modeling.title}」有新成员加入`,
        read: false,
        createdAt: ago(2 * HOUR),
      },
      {
        recipientUserId: self.id,
        recruitmentId: programContest.id,
        recruitmentTitle: programContest.title,
        joinerUserId: li.id,
        joinerName: li.realName,
        joinerStudentId: li.studentId,
        joinerCollege: li.college,
        joinerContact: 'lisiyuan_wx',
        joinerContactType: 'wechat',
        content: `「${programContest.title}」有新成员加入`,
        read: true,
        createdAt: ago(8 * DAY),
      },
    ],
  });

  const counts = {
    users: await prisma.user.count(),
    recruitments: await prisma.recruitment.count(),
    joins: await prisma.joinRecord.count(),
    notifications: await prisma.notification.count(),
  };
  console.log('[seed] done', counts);
}

main()
  .catch((error) => {
    console.error('[seed] failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
