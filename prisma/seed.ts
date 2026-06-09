import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
const filePath = dbUrl.replace("file:", "").trim();
const absolutePath = path.resolve(filePath);

const adapter = new PrismaLibSql({ url: `file://${absolutePath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  const tanks = [
    { id: "PLD", name: "Paladin", role: "TANK" as const },
    { id: "WAR", name: "Warrior", role: "TANK" as const },
    { id: "DRK", name: "Dark Knight", role: "TANK" as const },
    { id: "GNB", name: "Gunbreaker", role: "TANK" as const },
  ];
  const healers = [
    { id: "WHM", name: "White Mage", role: "HEALER" as const },
    { id: "SCH", name: "Scholar", role: "HEALER" as const },
    { id: "AST", name: "Astrologian", role: "HEALER" as const },
    { id: "SGE", name: "Sage", role: "HEALER" as const },
  ];
  const melee = [
    { id: "MNK", name: "Monk", role: "MELEE" as const },
    { id: "DRG", name: "Dragoon", role: "MELEE" as const },
    { id: "NIN", name: "Ninja", role: "MELEE" as const },
    { id: "SAM", name: "Samurai", role: "MELEE" as const },
    { id: "RPR", name: "Reaper", role: "MELEE" as const },
    { id: "VPR", name: "Viper", role: "MELEE" as const },
  ];
  const ranged = [
    { id: "BRD", name: "Bard", role: "RANGED" as const },
    { id: "MCH", name: "Machinist", role: "RANGED" as const },
    { id: "DNC", name: "Dancer", role: "RANGED" as const },
  ];
  const caster = [
    { id: "BLM", name: "Black Mage", role: "CASTER" as const },
    { id: "SMN", name: "Summoner", role: "CASTER" as const },
    { id: "RDM", name: "Red Mage", role: "CASTER" as const },
    { id: "PCT", name: "Pictomancer", role: "CASTER" as const },
  ];

  const allJobs = [...tanks, ...healers, ...melee, ...ranged, ...caster];

  for (const job of allJobs) {
    await prisma.job.upsert({
      where: { id: job.id },
      update: { name: job.name, role: job.role },
      create: job,
    });
  }

  const abilities = [
    { name: "Reprisal", cooldown: 60, duration: 10, jobId: null, role: "TANK", category: "MITIGATION", sharedSlot: "REPRISAL" },
    { name: "Rampart", cooldown: 90, duration: 20, jobId: null, role: "TANK", category: "MITIGATION", sharedSlot: null },
    { name: "Hallowed Ground", cooldown: 420, duration: 10, jobId: "PLD", role: null, category: "INVULN", sharedSlot: null },
    { name: "Sentinel", cooldown: 120, duration: 15, jobId: "PLD", role: null, category: "MITIGATION", sharedSlot: null },
    { name: "Divine Veil", cooldown: 90, duration: 30, jobId: "PLD", role: null, category: "SHIELD", sharedSlot: null },
    { name: "Passage of Arms", cooldown: 120, duration: 18, jobId: "PLD", role: null, category: "MITIGATION", sharedSlot: null },
    { name: "Sheltron", cooldown: 5, duration: 4, jobId: "PLD", role: null, category: "MITIGATION", sharedSlot: null },
    { name: "Holmgang", cooldown: 420, duration: 10, jobId: "WAR", role: null, category: "INVULN", sharedSlot: null },
    { name: "Vengeance", cooldown: 120, duration: 15, jobId: "WAR", role: null, category: "MITIGATION", sharedSlot: null },
    { name: "Thrill of Battle", cooldown: 90, duration: 10, jobId: "WAR", role: null, category: "PERSONAL", sharedSlot: null },
    { name: "Shake It Off", cooldown: 90, duration: 30, jobId: "WAR", role: null, category: "SHIELD", sharedSlot: null },
    { name: "Bloodwhetting", cooldown: 25, duration: 4, jobId: "WAR", role: null, category: "MITIGATION", sharedSlot: null },
    { name: "Living Dead", cooldown: 420, duration: 10, jobId: "DRK", role: null, category: "INVULN", sharedSlot: null },
    { name: "Shadow Wall", cooldown: 120, duration: 15, jobId: "DRK", role: null, category: "MITIGATION", sharedSlot: null },
    { name: "The Blackest Night", cooldown: 15, duration: 5, jobId: "DRK", role: null, category: "SHIELD", sharedSlot: null },
    { name: "Dark Missionary", cooldown: 90, duration: 15, jobId: "DRK", role: null, category: "MITIGATION", sharedSlot: null },
    { name: "Oblation", cooldown: 30, duration: 5, jobId: "DRK", role: null, category: "MITIGATION", sharedSlot: null },
    { name: "Superbolide", cooldown: 420, duration: 10, jobId: "GNB", role: null, category: "INVULN", sharedSlot: null },
    { name: "Nebula", cooldown: 120, duration: 15, jobId: "GNB", role: null, category: "MITIGATION", sharedSlot: null },
    { name: "Heart of Corundum", cooldown: 25, duration: 4, jobId: "GNB", role: null, category: "MITIGATION", sharedSlot: null },
    { name: "Heart of Light", cooldown: 90, duration: 15, jobId: "GNB", role: null, category: "MITIGATION", sharedSlot: null },
    { name: "Benediction", cooldown: 180, duration: 0, jobId: "WHM", role: null, category: "HEALING", sharedSlot: null },
    { name: "Temperance", cooldown: 120, duration: 20, jobId: "WHM", role: null, category: "MITIGATION", sharedSlot: null },
    { name: "Divine Benison", cooldown: 30, duration: 15, jobId: "WHM", role: null, category: "SHIELD", sharedSlot: null },
    { name: "Aquaveil", cooldown: 60, duration: 8, jobId: "WHM", role: null, category: "MITIGATION", sharedSlot: null },
    { name: "Lustrate", cooldown: 30, duration: 0, jobId: "SCH", role: null, category: "HEALING", sharedSlot: null },
    { name: "Adloquium", cooldown: 2, duration: 15, jobId: "SCH", role: null, category: "SHIELD", sharedSlot: null },
    { name: "Succor", cooldown: 30, duration: 30, jobId: "SCH", role: null, category: "SHIELD", sharedSlot: null },
    { name: "Deployment Tactics", cooldown: 90, duration: 0, jobId: "SCH", role: null, category: "SHIELD", sharedSlot: null },
    { name: "Expedient", cooldown: 120, duration: 20, jobId: "SCH", role: null, category: "MITIGATION", sharedSlot: null },
    { name: "Protraction", cooldown: 60, duration: 10, jobId: "SCH", role: null, category: "HEALING", sharedSlot: null },
    { name: "Essential Dignity", cooldown: 40, duration: 0, jobId: "AST", role: null, category: "HEALING", sharedSlot: null },
    { name: "Neutral Sect", cooldown: 120, duration: 20, jobId: "AST", role: null, category: "SHIELD", sharedSlot: null },
    { name: "Collective Unconscious", cooldown: 60, duration: 15, jobId: "AST", role: null, category: "MITIGATION", sharedSlot: null },
    { name: "Celestial Opposition", cooldown: 60, duration: 15, jobId: "AST", role: null, category: "HEALING", sharedSlot: null },
    { name: "Physis II", cooldown: 60, duration: 15, jobId: "SGE", role: null, category: "HEALING", sharedSlot: null },
    { name: "Kerachole", cooldown: 30, duration: 15, jobId: "SGE", role: null, category: "MITIGATION", sharedSlot: null },
    { name: "Taurochole", cooldown: 45, duration: 0, jobId: "SGE", role: null, category: "HEALING", sharedSlot: null },
    { name: "Holos", cooldown: 120, duration: 20, jobId: "SGE", role: null, category: "SHIELD", sharedSlot: null },
    { name: "Panhaima", cooldown: 120, duration: 15, jobId: "SGE", role: null, category: "SHIELD", sharedSlot: null },
    { name: "Haima", cooldown: 120, duration: 15, jobId: "SGE", role: null, category: "SHIELD", sharedSlot: null },
    { name: "Mantra", cooldown: 90, duration: 15, jobId: "MNK", role: null, category: "HEALING", sharedSlot: null },
    { name: "Feint", cooldown: 120, duration: 15, jobId: null, role: "MELEE", category: "MITIGATION", sharedSlot: "FEINT" },
    { name: "Troubadour", cooldown: 90, duration: 15, jobId: "BRD", role: null, category: "MITIGATION", sharedSlot: "RANGED" },
    { name: "Nature's Minne", cooldown: 60, duration: 15, jobId: "BRD", role: null, category: "HEALING", sharedSlot: null },
    { name: "Tactician", cooldown: 90, duration: 15, jobId: "MCH", role: null, category: "MITIGATION", sharedSlot: "RANGED" },
    { name: "Shield Samba", cooldown: 90, duration: 15, jobId: "DNC", role: null, category: "MITIGATION", sharedSlot: "RANGED" },
    { name: "Addle", cooldown: 120, duration: 15, jobId: null, role: "CASTER", category: "MITIGATION", sharedSlot: "ADDLE" },
    { name: "Manaward", cooldown: 120, duration: 20, jobId: "BLM", role: null, category: "SHIELD", sharedSlot: null },
    { name: "Magick Barrier", cooldown: 120, duration: 10, jobId: "RDM", role: null, category: "MITIGATION", sharedSlot: null },
    { name: "Tempera Grassa", cooldown: 120, duration: 20, jobId: "PCT", role: null, category: "SHIELD", sharedSlot: null },
  ];

  for (const ability of abilities) {
    await prisma.ability.upsert({
      where: { id: ability.name },
      update: {
        cooldown: ability.cooldown,
        duration: ability.duration,
        jobId: ability.jobId,
        role: ability.role,
        category: ability.category as any,
        sharedSlot: ability.sharedSlot as any,
      },
      create: {
        id: ability.name,
        name: ability.name,
        cooldown: ability.cooldown,
        duration: ability.duration,
        jobId: ability.jobId,
        role: ability.role,
        category: ability.category as any,
        sharedSlot: ability.sharedSlot as any,
      },
    });
  }

  const fights = [
    {
      slug: "m1s", name: "M1S - Black Cat", patch: "7.05", bossName: "Black Cat",
      expansion: "Dawntrail", tier: "AAC Light-heavyweight",
      timestamps: [
        { time: 0, label: "Pull", type: "OTHER" },
        { time: 12, label: "Predaceous Pounce", type: "TANKBUSTER" },
        { time: 30, label: "Quadruple Crossing", type: "RAIDWIDE" },
        { time: 58, label: "Biscuit Maker", type: "TANKBUSTER" },
        { time: 80, label: "Elevate and Eviscerate", type: "RAIDWIDE" },
        { time: 110, label: "Nine Lives", type: "RAIDWIDE" },
        { time: 145, label: "Black Cat's Crossing", type: "STACK" },
        { time: 175, label: "One-Two Punch", type: "TANKBUSTER" },
        { time: 210, label: "Finale", type: "ENRAGE" },
      ],
    },
    {
      slug: "m2s", name: "M2S - Honey B. Lovely", patch: "7.05", bossName: "Honey B. Lovely",
      expansion: "Dawntrail", tier: "AAC Light-heavyweight",
      timestamps: [
        { time: 0, label: "Pull", type: "OTHER" },
        { time: 10, label: "Honey Behemoth", type: "ADD_PHASE" },
        { time: 35, label: "Honeyed Breeze", type: "RAIDWIDE" },
        { time: 60, label: "Blinding Love", type: "STACK" },
        { time: 90, label: "Tempting Twist", type: "TANKBUSTER" },
        { time: 120, label: "Love Me Tender", type: "RAIDWIDE" },
        { time: 155, label: "Splash of Venom", type: "SPREAD" },
        { time: 190, label: "Finale", type: "ENRAGE" },
      ],
    },
    {
      slug: "m3s", name: "M3S - Brute Bomber", patch: "7.05", bossName: "Brute Bomber",
      expansion: "Dawntrail", tier: "AAC Light-heavyweight",
      timestamps: [
        { time: 0, label: "Pull", type: "OTHER" },
        { time: 15, label: "Left/Right Punch", type: "TANKBUSTER" },
        { time: 40, label: "Chain Death", type: "RAIDWIDE" },
        { time: 70, label: "Double Punch", type: "TANKBUSTER" },
        { time: 100, label: "Bomber's Fury", type: "RAIDWIDE" },
        { time: 130, label: "Raging Claw", type: "STACK" },
        { time: 165, label: "Final Beat", type: "RAIDWIDE" },
        { time: 200, label: "Finale", type: "ENRAGE" },
      ],
    },
    {
      slug: "m4s", name: "M4S - Wicked Thunder", patch: "7.05", bossName: "Wicked Thunder",
      expansion: "Dawntrail", tier: "AAC Light-heavyweight",
      timestamps: [
        { time: 0, label: "Pull", type: "OTHER" },
        { time: 10, label: "Thunderous Kick", type: "TANKBUSTER" },
        { time: 35, label: "Forked Lightning", type: "RAIDWIDE" },
        { time: 65, label: "Wicked Bolt", type: "STACK" },
        { time: 100, label: "Electrocharge", type: "RAIDWIDE" },
        { time: 135, label: "Beast's Bane", type: "TANKBUSTER" },
        { time: 170, label: "Soul Surge", type: "SPREAD" },
        { time: 210, label: "Wrath of Thunder", type: "RAIDWIDE" },
        { time: 260, label: "Finale", type: "ENRAGE" },
      ],
    },
  ];

  for (const fight of fights) {
    await prisma.fight.upsert({
      where: { slug: fight.slug },
      update: { name: fight.name, patch: fight.patch, bossName: fight.bossName, expansion: fight.expansion, tier: fight.tier, timestamps: fight.timestamps },
      create: fight as any,
    });
  }

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
