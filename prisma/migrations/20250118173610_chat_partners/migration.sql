-- CreateTable
CREATE TABLE "ChatPartner" (
    "userId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,

    CONSTRAINT "ChatPartner_pkey" PRIMARY KEY ("userId","partnerId")
);

-- AddForeignKey
ALTER TABLE "ChatPartner" ADD CONSTRAINT "ChatPartner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatPartner" ADD CONSTRAINT "ChatPartner_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
