-- 删除操作改为物理删除后，不再需要 deleted 状态。
-- PostgreSQL 不支持直接删除枚举值，这里重建类型并迁移列。

ALTER TYPE "RecruitStatus" RENAME TO "RecruitStatus_old";
CREATE TYPE "RecruitStatus" AS ENUM ('recruiting', 'full', 'ended', 'cancelled');

ALTER TABLE "recruitments" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "recruitments"
  ALTER COLUMN "status" TYPE "RecruitStatus" USING ("status"::text::"RecruitStatus");
ALTER TABLE "recruitments" ALTER COLUMN "status" SET DEFAULT 'recruiting';

DROP TYPE "RecruitStatus_old";
