import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("Prisma schemas", () => {
  it("sqlite and postgresql schemas are in sync (only provider differs)", () => {
    const sqlite = readFileSync(
      join(import.meta.dirname, "../../../prisma/schema.prisma"),
      "utf-8",
    );
    const pg = readFileSync(join(import.meta.dirname, "../../../prisma/schema.pg.prisma"), "utf-8");

    const normalize = (s: string) =>
      s
        .split("\n")
        .map((l) => l.trimEnd())
        .filter((l) => l !== "")
        .filter((l) => !l.trim().startsWith("provider"))
        .join("\n");

    expect(normalize(pg)).toBe(normalize(sqlite));
  });
});
