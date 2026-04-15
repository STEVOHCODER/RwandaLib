/*
  Warnings:

  - A unique constraint covering the columns `[userId,documentId]` on the table `DownloadRequest` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "DownloadRequest_userId_documentId_key" ON "DownloadRequest"("userId", "documentId");
