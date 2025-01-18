-- AlterTable
ALTER TABLE "ChatPartner" ADD COLUMN "lastChatId" TEXT;

-- Add the new column "chatId" but do not make it NOT NULL immediately
ALTER TABLE "Message" ADD COLUMN "chatId" TEXT;

-- Add a default value or set existing rows to a valid chatId (for example, 'default-chat-id')
UPDATE "Message" SET "chatId" = 'default-chat-id' WHERE "chatId" IS NULL;

-- Now alter the column to make it NOT NULL
ALTER TABLE "Message" ALTER COLUMN "chatId" SET NOT NULL;

-- Drop the old column "receiverId"
ALTER TABLE "Message" DROP COLUMN "receiverId";

-- CreateTable (Chat and ChatParticipant tables as is)
CREATE TABLE "Chat" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "isGroup" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChatParticipant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (for uniqueness of userId and chatId)
CREATE UNIQUE INDEX "ChatParticipant_userId_chatId_key" ON "ChatParticipant"("userId", "chatId");

-- AddForeignKey (foreign key constraints as required)
ALTER TABLE "ChatPartner" ADD CONSTRAINT "ChatPartner_lastChatId_fkey" FOREIGN KEY ("lastChatId") REFERENCES "Chat"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ChatParticipant" ADD CONSTRAINT "ChatParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChatParticipant" ADD CONSTRAINT "ChatParticipant_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;