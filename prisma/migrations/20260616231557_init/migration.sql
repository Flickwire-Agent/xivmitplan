-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('TANK', 'HEALER', 'MELEE', 'RANGED', 'CASTER');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('MITIGATION', 'HEALING', 'SHIELD', 'INVULN', 'PERSONAL');

-- CreateEnum
CREATE TYPE "SharedSlot" AS ENUM ('REPRISAL', 'FEINT', 'ADDLE', 'RANGED');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('RAIDWIDE', 'TANKBUSTER', 'STACK', 'SPREAD', 'KNOCKBACK', 'ADD_PHASE', 'ENRAGE', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "auth0Id" TEXT,
    "email" TEXT,
    "displayName" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "bannedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fight" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "patch" TEXT NOT NULL,
    "bossName" TEXT NOT NULL,
    "expansion" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "timestamps" JSONB NOT NULL,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "RoleName" NOT NULL,
    "iconUrl" TEXT,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ability" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cooldown" INTEGER NOT NULL,
    "duration" INTEGER,
    "description" TEXT,
    "iconUrl" TEXT,
    "jobId" TEXT,
    "role" "RoleName",
    "category" "Category" NOT NULL,
    "sharedSlot" "SharedSlot",

    CONSTRAINT "Ability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "shareId" TEXT,
    "fightId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanCharacter" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "label" TEXT,
    "slotIndex" INTEGER NOT NULL,

    CONSTRAINT "PlanCharacter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanEvent" (
    "id" TEXT NOT NULL,
    "planCharacterId" TEXT,
    "planId" TEXT,
    "timestampIndex" INTEGER NOT NULL,
    "abilityId" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "PlanEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AbilityToJob" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AbilityToJob_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_auth0Id_key" ON "User"("auth0Id");

-- CreateIndex
CREATE UNIQUE INDEX "Fight_slug_key" ON "Fight"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_shareId_key" ON "Plan"("shareId");

-- CreateIndex
CREATE INDEX "_AbilityToJob_B_index" ON "_AbilityToJob"("B");

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_fightId_fkey" FOREIGN KEY ("fightId") REFERENCES "Fight"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanCharacter" ADD CONSTRAINT "PlanCharacter_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanCharacter" ADD CONSTRAINT "PlanCharacter_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanEvent" ADD CONSTRAINT "PlanEvent_planCharacterId_fkey" FOREIGN KEY ("planCharacterId") REFERENCES "PlanCharacter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanEvent" ADD CONSTRAINT "PlanEvent_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanEvent" ADD CONSTRAINT "PlanEvent_abilityId_fkey" FOREIGN KEY ("abilityId") REFERENCES "Ability"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AbilityToJob" ADD CONSTRAINT "_AbilityToJob_A_fkey" FOREIGN KEY ("A") REFERENCES "Ability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AbilityToJob" ADD CONSTRAINT "_AbilityToJob_B_fkey" FOREIGN KEY ("B") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
