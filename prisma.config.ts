import { defineConfig } from "@prisma/config";

const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
const isPostgres = dbUrl.startsWith("postgresql") || dbUrl.startsWith("postgres://");

export default defineConfig({
  schema: isPostgres ? "./prisma/schema.pg.prisma" : "./prisma/schema.prisma",
  datasource: {
    url: dbUrl,
  },
});
