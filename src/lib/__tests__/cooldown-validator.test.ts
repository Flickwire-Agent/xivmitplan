import { describe, it, expect } from "vitest";
import { validatePlan } from "@/lib/cooldown-validator";
import type { PlanWithRelations, TimestampEntry } from "@/types";

function ts(time: number, label: string, type: string): TimestampEntry {
  return { time, label, type };
}

function ability(
  id: string,
  name: string,
  cooldown: number,
  category = "MITIGATION",
  sharedSlot: string | null = null,
) {
  return {
    id,
    name,
    cooldown,
    duration: 10,
    description: null,
    jobId: null,
    role: null,
    category: category as any,
    sharedSlot,
    createdAt: new Date(),
  };
}

function makePlan(
  timestamps: TimestampEntry[],
  characters: Array<{
    id: string;
    label: string;
    jobName: string;
    role: string;
    abilities: ReturnType<typeof ability>[];
    events: Array<{ timestampIndex: number; abilityId: string }>;
  }>,
): PlanWithRelations {
  return {
    id: "test-plan",
    title: null,
    shareId: null,
    fightId: "test-fight",
    userId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    fight: {
      id: "test-fight",
      slug: "test",
      name: "Test Fight",
      patch: "7.0",
      bossName: "Test Boss",
      expansion: "Dawntrail",
      tier: "Test",
      timestamps: timestamps as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    characters: characters.map((c) => ({
      id: c.id,
      planId: "test-plan",
      jobId: c.abilities[0]?.jobId ?? "",
      label: c.label,
      slotIndex: 0,
      job: {
        id: c.abilities[0]?.jobId ?? "",
        name: c.jobName,
        role: c.role as any,
        iconUrl: null,
        abilities: c.abilities,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      events: c.events.map((e) => {
        const abil = c.abilities.find((a) => a.id === e.abilityId)!;
        return {
          id: `evt-${e.timestampIndex}-${e.abilityId}`,
          planCharacterId: c.id,
          planId: null,
          timestampIndex: e.timestampIndex,
          abilityId: e.abilityId,
          note: null,
          ability: abil,
        };
      }),
    })),
    events: [],
  };
}

describe("validatePlan", () => {
  describe("empty / no assignments", () => {
    it("returns empty array when plan has no characters", () => {
      const issues = validatePlan(makePlan([ts(0, "Pull", "OTHER")], []));
      expect(issues).toEqual([]);
    });

    it("returns empty array when no abilities assigned", () => {
      const issues = validatePlan(makePlan(
        [ts(0, "Pull", "OTHER"), ts(10, "Raidwide", "RAIDWIDE")],
        [
          { id: "pld", label: "Paladin", jobName: "Paladin", role: "TANK", abilities: [], events: [] },
        ],
      ));
      expect(issues).toEqual([]);
    });
  });

  describe("cooldown violations", () => {
    const reprisal = ability("Reprisal", "Reprisal", 60, "MITIGATION", "REPRISAL");

    it("returns no issues when ability used once", () => {
      const issues = validatePlan(makePlan(
        [ts(0, "Pull", "OTHER"), ts(10, "Raidwide", "RAIDWIDE")],
        [
          {
            id: "pld", label: "Paladin", jobName: "Paladin", role: "TANK",
            abilities: [reprisal],
            events: [{ timestampIndex: 1, abilityId: "Reprisal" }],
          },
        ],
      ));
      // Only the RAIDWIDE at t=10 is assigned with Reprisal — no conflicts
      expect(issues.filter((i) => i.type === "COOLDOWN")).toHaveLength(0);
    });

    it("detects COOLDOWN error when same ability used before cooldown expires", () => {
      const issues = validatePlan(makePlan(
        [ts(0, "Pull", "OTHER"), ts(10, "First", "RAIDWIDE"), ts(30, "Second", "RAIDWIDE")],
        [
          {
            id: "pld", label: "Paladin", jobName: "Paladin", role: "TANK",
            abilities: [reprisal],
            events: [
              { timestampIndex: 1, abilityId: "Reprisal" },  // t=10
              { timestampIndex: 2, abilityId: "Reprisal" },  // t=30 — only 20s later, CD is 60s
            ],
          },
        ],
      ));
      const cooldowns = issues.filter((i) => i.type === "COOLDOWN");
      expect(cooldowns).toHaveLength(1);
      expect(cooldowns[0].severity).toBe("ERROR");
      expect(cooldowns[0].message).toContain("Reprisal");
      expect(cooldowns[0].message).toContain("cooldown");
    });

    it("allows same ability when cooldown has elapsed", () => {
      const issues = validatePlan(makePlan(
        [ts(0, "Pull", "OTHER"), ts(10, "First", "RAIDWIDE"), ts(120, "Second", "RAIDWIDE")],
        [
          {
            id: "pld", label: "Paladin", jobName: "Paladin", role: "TANK",
            abilities: [reprisal],
            events: [
              { timestampIndex: 1, abilityId: "Reprisal" },  // t=10
              { timestampIndex: 2, abilityId: "Reprisal" },  // t=120, 110s > 60s CD
            ],
          },
        ],
      ));
      expect(issues.filter((i) => i.type === "COOLDOWN")).toHaveLength(0);
    });
  });

  describe("shared slot collisions", () => {
    const reprisal = ability("Reprisal", "Reprisal", 60, "MITIGATION", "REPRISAL");

    it("detects SHARED_SLOT error when two characters use same slot at same timestamp", () => {
      const issues = validatePlan(makePlan(
        [ts(0, "Pull", "OTHER"), ts(10, "Raidwide", "RAIDWIDE")],
        [
          {
            id: "pld", label: "Paladin", jobName: "Paladin", role: "TANK",
            abilities: [reprisal],
            events: [{ timestampIndex: 1, abilityId: "Reprisal" }],
          },
          {
            id: "war", label: "Warrior", jobName: "Warrior", role: "TANK",
            abilities: [reprisal],
            events: [{ timestampIndex: 1, abilityId: "Reprisal" }],
          },
        ],
      ));
      const slots = issues.filter((i) => i.type === "SHARED_SLOT");
      expect(slots).toHaveLength(1);
      expect(slots[0].severity).toBe("ERROR");
      expect(slots[0].message).toContain("Reprisal");
    });

    it("allows shared slot usage at different timestamps", () => {
      const issues = validatePlan(makePlan(
        [ts(0, "Pull", "OTHER"), ts(10, "First", "RAIDWIDE"), ts(50, "Second", "RAIDWIDE")],
        [
          {
            id: "pld", label: "Paladin", jobName: "Paladin", role: "TANK",
            abilities: [reprisal],
            events: [{ timestampIndex: 1, abilityId: "Reprisal" }],
          },
          {
            id: "war", label: "Warrior", jobName: "Warrior", role: "TANK",
            abilities: [reprisal],
            events: [{ timestampIndex: 2, abilityId: "Reprisal" }],
          },
        ],
      ));
      expect(issues.filter((i) => i.type === "SHARED_SLOT")).toHaveLength(0);
    });
  });

  describe("missing assignment warnings", () => {
    it("no longer warns for unassigned critical mechanics", () => {
      const issues = validatePlan(makePlan(
        [ts(0, "Pull", "OTHER"), ts(10, "Raidwide", "RAIDWIDE")],
        [
          {
            id: "pld", label: "Paladin", jobName: "Paladin", role: "TANK",
            abilities: [],
            events: [],
          },
        ],
      ));
      expect(issues.filter((i) => i.type === "MISSING")).toHaveLength(0);
    });
  });

  describe("mixed / edge cases", () => {
    const reprisal = ability("Reprisal", "Reprisal", 60, "MITIGATION", "REPRISAL");
    const rampart = ability("Rampart", "Rampart", 90, "MITIGATION");

    it("detects cooldown and shared-slot issues simultaneously", () => {
      const issues = validatePlan(makePlan(
        [ts(0, "Pull", "OTHER"), ts(10, "Raidwide", "RAIDWIDE"), ts(30, "Tankbuster", "TANKBUSTER")],
        [
          {
            id: "pld", label: "Paladin", jobName: "Paladin", role: "TANK",
            abilities: [rampart, reprisal],
            events: [
              { timestampIndex: 1, abilityId: "Rampart" },
              { timestampIndex: 2, abilityId: "Rampart" },  // CD violation (20s < 90s)
              { timestampIndex: 1, abilityId: "Reprisal" },  // shared slot collision
            ],
          },
          {
            id: "war", label: "Warrior", jobName: "Warrior", role: "TANK",
            abilities: [reprisal],
            events: [
              { timestampIndex: 1, abilityId: "Reprisal" },  // shared slot collision
            ],
          },
        ],
      ));
      expect(issues.some((i) => i.type === "COOLDOWN")).toBe(true);
      expect(issues.some((i) => i.type === "SHARED_SLOT")).toBe(true);
    });

    it("allows ability with 0 cooldown at any frequency", () => {
      const instant = ability("Benediction", "Benediction", 0, "HEALING");
      const issues = validatePlan(makePlan(
        [ts(0, "Pull", "OTHER"), ts(5, "Hit 1", "RAIDWIDE"), ts(6, "Hit 2", "RAIDWIDE")],
        [
          {
            id: "whm", label: "White Mage", jobName: "White Mage", role: "HEALER",
            abilities: [instant],
            events: [
              { timestampIndex: 1, abilityId: "Benediction" },
              { timestampIndex: 2, abilityId: "Benediction" },
            ],
          },
        ],
      ));
      expect(issues.filter((i) => i.type === "COOLDOWN")).toHaveLength(0);
    });

    it("handles ability with short cooldown used rapidly", () => {
      const sheltron = ability("Sheltron", "Sheltron", 5, "MITIGATION");
      const issues = validatePlan(makePlan(
        [ts(0, "Pull", "OTHER"), ts(5, "Buster 1", "TANKBUSTER"), ts(8, "Buster 2", "TANKBUSTER")],
        [
          {
            id: "pld", label: "Paladin", jobName: "Paladin", role: "TANK",
            abilities: [sheltron],
            events: [
              { timestampIndex: 1, abilityId: "Sheltron" },
              { timestampIndex: 2, abilityId: "Sheltron" },
            ],
          },
        ],
      ));
      // CD is 5s, used at t=5 and t=8 (3s gap) — violation
      expect(issues.filter((i) => i.type === "COOLDOWN")).toHaveLength(1);
    });

    it("ignores events with out-of-bounds timestampIndex", () => {
      const issues = validatePlan(makePlan(
        [ts(0, "Pull", "OTHER"), ts(10, "Raidwide", "RAIDWIDE")],
        [
          {
            id: "pld", label: "Paladin", jobName: "Paladin", role: "TANK",
            abilities: [rampart],
            events: [
              { timestampIndex: 99, abilityId: "Rampart" }, // out of bounds
            ],
          },
        ],
      ));
      // The out-of-bounds event is silently ignored, but MISSING for the RAIDWIDE
      const cooldowns = issues.filter((i) => i.type === "COOLDOWN");
      expect(cooldowns).toHaveLength(0);
    });

    it("tracks cooldown per-character, not globally", () => {
      const issues = validatePlan(makePlan(
        [ts(0, "Pull", "OTHER"), ts(10, "First", "RAIDWIDE"), ts(20, "Second", "RAIDWIDE")],
        [
          {
            id: "pld", label: "Paladin", jobName: "Paladin", role: "TANK",
            abilities: [rampart],
            events: [{ timestampIndex: 1, abilityId: "Rampart" }],
          },
          {
            id: "war", label: "Warrior", jobName: "Warrior", role: "TANK",
            abilities: [rampart],
            events: [{ timestampIndex: 2, abilityId: "Rampart" }],
          },
        ],
      ));
      // Each character uses Rampart once — no cooldown issue (per-character tracking)
      expect(issues.filter((i) => i.type === "COOLDOWN")).toHaveLength(0);
    });
  });
});
