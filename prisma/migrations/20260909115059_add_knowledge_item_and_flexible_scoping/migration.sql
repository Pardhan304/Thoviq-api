/*
  Warnings:

  - You are about to drop the column `assetId` on the `quizzes` table. All the data in the column will be lost.
  - Added the required column `workspaceId` to the `knowledge_assets` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "knowledge_assets" DROP CONSTRAINT "knowledge_assets_projectId_fkey";

-- DropForeignKey
ALTER TABLE "quizzes" DROP CONSTRAINT "quizzes_assetId_fkey";

-- DropIndex
DROP INDEX "knowledge_assets_projectId_bucket_idx";

-- DropIndex
DROP INDEX "quizzes_projectId_dueDate_idx";

-- AlterTable
ALTER TABLE "knowledge_assets" ADD COLUMN     "authorName" VARCHAR(100),
ADD COLUMN     "knowledgeItemId" UUID,
ADD COLUMN     "thumbnailUrl" TEXT,
ADD COLUMN     "workspaceId" UUID NOT NULL,
ALTER COLUMN "projectId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "originKnowledgeId" UUID;

-- AlterTable
ALTER TABLE "quizzes" DROP COLUMN "assetId",
ADD COLUMN     "knowledgeItemId" UUID,
ALTER COLUMN "projectId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "knowledge_items" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "projectId" UUID,
    "title" VARCHAR(200) NOT NULL,
    "technology" VARCHAR(50) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'INTERMEDIATE',
    "summary" TEXT NOT NULL,
    "keyPoints" JSONB NOT NULL DEFAULT '[]',
    "codeExamples" JSONB NOT NULL DEFAULT '[]',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "knowledge_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "knowledge_items_workspaceId_category_idx" ON "knowledge_items"("workspaceId", "category");

-- CreateIndex
CREATE INDEX "knowledge_items_workspaceId_technology_idx" ON "knowledge_items"("workspaceId", "technology");

-- CreateIndex
CREATE INDEX "knowledge_assets_workspaceId_bucket_idx" ON "knowledge_assets"("workspaceId", "bucket");

-- CreateIndex
CREATE INDEX "knowledge_assets_knowledgeItemId_idx" ON "knowledge_assets"("knowledgeItemId");

-- CreateIndex
CREATE INDEX "quizzes_dueDate_idx" ON "quizzes"("dueDate");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_originKnowledgeId_fkey" FOREIGN KEY ("originKnowledgeId") REFERENCES "knowledge_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_items" ADD CONSTRAINT "knowledge_items_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_items" ADD CONSTRAINT "knowledge_items_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_assets" ADD CONSTRAINT "knowledge_assets_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_assets" ADD CONSTRAINT "knowledge_assets_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_assets" ADD CONSTRAINT "knowledge_assets_knowledgeItemId_fkey" FOREIGN KEY ("knowledgeItemId") REFERENCES "knowledge_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_knowledgeItemId_fkey" FOREIGN KEY ("knowledgeItemId") REFERENCES "knowledge_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
