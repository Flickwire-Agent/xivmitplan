import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  try {
    const { PrismaLibSql } = require("@prisma/adapter-libsql") as typeof import("@prisma/adapter-libsql");
    const path = require("path");
    const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
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
