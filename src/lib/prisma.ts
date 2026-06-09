import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL || "file:./dev.db";

  if (dbUrl.startsWith("postgresql") || dbUrl.startsWith("postgres://")) {
    const { PrismaPg } = require("@prisma/adapter-pg") as typeof import("@prisma/adapter-pg");
    const adapter = new PrismaPg({ connectionString: dbUrl });
    return new PrismaClient({ adapter });
  }

  try {
    const { PrismaLibSql } = require("@prisma/adapter-libsql") as typeof import("@prisma/adapter-libsql");
    const path = require("path");
    const filePath = dbUrl.replace("file:", "").trim();
    const absolutePath = path.resolve(filePath);
    const adapter = new PrismaLibSql({ url: `file://${absolutePath}` });
    return new PrismaClient({ adapter });
  } catch {
    return new PrismaClient();
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
