-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auth0Id" TEXT,
    "email" TEXT,
    "displayName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "bannedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Fight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "patch" TEXT NOT NULL,
    "bossName" TEXT NOT NULL,
    "expansion" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "timestamps" JSONB NOT NULL,
    "icon" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "iconUrl" TEXT
);

-- CreateTable
CREATE TABLE "Ability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "cooldown" INTEGER NOT NULL,
    "duration" INTEGER,
    "description" TEXT,
    "jobId" TEXT,
    "role" TEXT,
    "category" TEXT NOT NULL,
    "sharedSlot" TEXT
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "shareId" TEXT,
    "fightId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Plan_fightId_fkey" FOREIGN KEY ("fightId") REFERENCES "Fight" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Plan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlanCharacter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "label" TEXT,
    "slotIndex" INTEGER NOT NULL,
    CONSTRAINT "PlanCharacter_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PlanCharacter_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlanEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planCharacterId" TEXT,
    "planId" TEXT,
    "timestampIndex" INTEGER NOT NULL,
    "abilityId" TEXT NOT NULL,
    "note" TEXT,
    CONSTRAINT "PlanEvent_planCharacterId_fkey" FOREIGN KEY ("planCharacterId") REFERENCES "PlanCharacter" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PlanEvent_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PlanEvent_abilityId_fkey" FOREIGN KEY ("abilityId") REFERENCES "Ability" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_AbilityToJob" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_AbilityToJob_A_fkey" FOREIGN KEY ("A") REFERENCES "Ability" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_AbilityToJob_B_fkey" FOREIGN KEY ("B") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_auth0Id_key" ON "User"("auth0Id");

-- CreateIndex
CREATE UNIQUE INDEX "Fight_slug_key" ON "Fight"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_shareId_key" ON "Plan"("shareId");

-- CreateIndex
CREATE UNIQUE INDEX "_AbilityToJob_AB_unique" ON "_AbilityToJob"("A", "B");

-- CreateIndex
CREATE INDEX "_AbilityToJob_B_index" ON "_AbilityToJob"("B");
