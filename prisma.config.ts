import { defineConfig } from "@prisma/config";

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error("DATABASE_URL is required");
}

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: dbUrl,
  },
});
