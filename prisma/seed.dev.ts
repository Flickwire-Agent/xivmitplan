import { PrismaClient } from "@prisma/client";

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
  if (dbUrl.startsWith("postgresql") || dbUrl.startsWith("postgres://")) {
    const { PrismaPg } = require("@prisma/adapter-pg") as typeof import("@prisma/adapter-pg");
    const adapter = new PrismaPg({ connectionString: dbUrl });
    return new PrismaClient({ adapter });
  }
  const { PrismaLibSql } =
    require("@prisma/adapter-libsql") as typeof import("@prisma/adapter-libsql");
  const path = require("path");
  const filePath = dbUrl.replace("file:", "").trim();
  const absolutePath = path.resolve(filePath);
  const adapter = new PrismaLibSql({ url: `file://${absolutePath}` });
  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

async function main() {
  const fightCount = await prisma.fight.count();
  if (fightCount === 0) {
    console.log("No fights found — skipping dev plan seed. Import fights first.");
    return;
  }

  console.log("Dev seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
