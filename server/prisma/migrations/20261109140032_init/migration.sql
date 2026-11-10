-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('competition', 'research', 'innovation', 'practice', 'sports', 'volunteer', 'other');

-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('qq', 'wechat', 'phone');

-- CreateEnum
CREATE TYPE "RecruitStatus" AS ENUM ('recruiting', 'full', 'ended', 'cancelled', 'deleted');

-- CreateEnum
CREATE TYPE "JoinStatus" AS ENUM ('active', 'left', 'removed');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "real_name" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "college" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recruitments" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "college" TEXT NOT NULL,
    "activity_type" "ActivityType" NOT NULL,
    "needed_count" INTEGER NOT NULL,
    "joined_count" INTEGER NOT NULL DEFAULT 0,
    "requirements" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "contact_type" "ContactType" NOT NULL DEFAULT 'wechat',
    "activity_url" TEXT NOT NULL,
    "extra" TEXT NOT NULL DEFAULT '',
    "deadline" TIMESTAMP(3),
    "publisher_id" TEXT NOT NULL,
    "publisher_name" TEXT NOT NULL,
    "publisher_college" TEXT NOT NULL,
    "status" "RecruitStatus" NOT NULL DEFAULT 'recruiting',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recruitments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "join_records" (
    "id" TEXT NOT NULL,
    "recruitment_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "real_name" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "college" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "contact_type" "ContactType" NOT NULL DEFAULT 'wechat',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "JoinStatus" NOT NULL DEFAULT 'active',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "join_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "recipient_user_id" TEXT NOT NULL,
    "recruitment_id" TEXT NOT NULL,
    "recruitment_title" TEXT NOT NULL,
    "joiner_user_id" TEXT NOT NULL,
    "joiner_name" TEXT NOT NULL,
    "joiner_student_id" TEXT NOT NULL,
    "joiner_college" TEXT NOT NULL,
    "joiner_contact" TEXT NOT NULL,
    "joiner_contact_type" "ContactType" NOT NULL DEFAULT 'wechat',
    "content" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_student_id_key" ON "users"("student_id");

-- CreateIndex
CREATE INDEX "recruitments_status_created_at_idx" ON "recruitments"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "recruitments_publisher_id_status_idx" ON "recruitments"("publisher_id", "status");

-- CreateIndex
CREATE INDEX "join_records_recruitment_id_status_idx" ON "join_records"("recruitment_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "join_records_recruitment_id_user_id_key" ON "join_records"("recruitment_id", "user_id");

-- CreateIndex
CREATE INDEX "notifications_recipient_user_id_read_created_at_idx" ON "notifications"("recipient_user_id", "read", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "recruitments" ADD CONSTRAINT "recruitments_publisher_id_fkey" FOREIGN KEY ("publisher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "join_records" ADD CONSTRAINT "join_records_recruitment_id_fkey" FOREIGN KEY ("recruitment_id") REFERENCES "recruitments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "join_records" ADD CONSTRAINT "join_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recruitment_id_fkey" FOREIGN KEY ("recruitment_id") REFERENCES "recruitments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
