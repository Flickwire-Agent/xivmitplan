import { PrismaClient } from "@prisma/client";

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
  if (dbUrl.startsWith("postgresql") || dbUrl.startsWith("postgres://")) {
    const { PrismaPg } = require("@prisma/adapter-pg") as typeof import("@prisma/adapter-pg");
    const adapter = new PrismaPg({ connectionString: dbUrl });
    return new PrismaClient({ adapter });
  }
  const { PrismaLibSql } = require("@prisma/adapter-libsql") as typeof import("@prisma/adapter-libsql");
  const path = require("path");
  const filePath = dbUrl.replace("file:", "").trim();
  const absolutePath = path.resolve(filePath);
  const adapter = new PrismaLibSql({ url: `file://${absolutePath}` });
  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

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
    // ── AAC Light-heavyweight (Savage) ──────────────────────
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
    // ── AAC Cruiserweight (Savage) ──────────────────────────
    {
      slug: "m5s", name: "M5S - Dancing Green", patch: "7.2", bossName: "Dancing Green",
      expansion: "Dawntrail", tier: "AAC Cruiserweight",
      timestamps: [
        { time: 0, label: "Pull", type: "OTHER" },
        { time: 12, label: "Disco Inferno", type: "RAIDWIDE" },
        { time: 35, label: "Ensemble Assemble", type: "STACK" },
        { time: 60, label: "Ride the Waves", type: "SPREAD" },
        { time: 90, label: "Frogtourage", type: "ADD_PHASE" },
        { time: 120, label: "Disco Inferno", type: "RAIDWIDE" },
        { time: 155, label: "Ensemble Assemble", type: "STACK" },
        { time: 190, label: "Frogtourage", type: "ADD_PHASE" },
        { time: 220, label: "Finale", type: "ENRAGE" },
      ],
    },
    {
      slug: "m6s", name: "M6S - Sugar Riot", patch: "7.2", bossName: "Sugar Riot",
      expansion: "Dawntrail", tier: "AAC Cruiserweight",
      timestamps: [
        { time: 0, label: "Pull", type: "OTHER" },
        { time: 15, label: "Sugar Shock", type: "RAIDWIDE" },
        { time: 40, label: "Candy Crush", type: "TANKBUSTER" },
        { time: 70, label: "Sweet Tooth", type: "STACK" },
        { time: 100, label: "Sugar Shock", type: "RAIDWIDE" },
        { time: 135, label: "Candy Crush", type: "TANKBUSTER" },
        { time: 170, label: "Riot Rush", type: "SPREAD" },
        { time: 210, label: "Finale", type: "ENRAGE" },
      ],
    },
    {
      slug: "m7s", name: "M7S - Brute Abombinator", patch: "7.2", bossName: "Brute Abombinator",
      expansion: "Dawntrail", tier: "AAC Cruiserweight",
      timestamps: [
        { time: 0, label: "Pull", type: "OTHER" },
        { time: 10, label: "Brutal Impact", type: "RAIDWIDE" },
        { time: 35, label: "Stoneringer", type: "TANKBUSTER" },
        { time: 65, label: "Smash Here/There", type: "STACK" },
        { time: 100, label: "Sinister Seeds", type: "ADD_PHASE" },
        { time: 140, label: "Brutal Impact", type: "RAIDWIDE" },
        { time: 175, label: "Stoneringer", type: "TANKBUSTER" },
        { time: 210, label: "Smash Here/There", type: "SPREAD" },
        { time: 250, label: "Finale", type: "ENRAGE" },
      ],
    },
    {
      slug: "m8s", name: "M8S - Howling Blade", patch: "7.2", bossName: "Howling Blade",
      expansion: "Dawntrail", tier: "AAC Cruiserweight",
      timestamps: [
        { time: 0, label: "Pull", type: "OTHER" },
        { time: 10, label: "Stonefang", type: "TANKBUSTER" },
        { time: 35, label: "Windfang", type: "RAIDWIDE" },
        { time: 70, label: "Millennial Decay", type: "STACK" },
        { time: 110, label: "Ravenous Saber", type: "TANKBUSTER" },
        { time: 150, label: "Wolves' Reign", type: "ADD_PHASE" },
        { time: 200, label: "Terrestrial Titans", type: "RAIDWIDE" },
        { time: 260, label: "Phase Change", type: "OTHER" },
        { time: 280, label: "Stonefang", type: "TANKBUSTER" },
        { time: 320, label: "Windfang", type: "RAIDWIDE" },
        { time: 370, label: "Millennial Decay", type: "STACK" },
        { time: 420, label: "Finale", type: "ENRAGE" },
      ],
    },
    // ── AAC Heavyweight (Savage) ────────────────────────────
    {
      slug: "m9s", name: "M9S - Vamp Fatale", patch: "7.4", bossName: "Vamp Fatale",
      expansion: "Dawntrail", tier: "AAC Heavyweight",
      timestamps: [
        { time: 0, label: "Pull", type: "OTHER" },
        { time: 10, label: "Killer Voice", type: "RAIDWIDE" },
        { time: 35, label: "Hardcore", type: "TANKBUSTER" },
        { time: 65, label: "Vamp Stomp", type: "STACK" },
        { time: 100, label: "Sadistic Screech", type: "RAIDWIDE" },
        { time: 135, label: "Half Moon", type: "SPREAD" },
        { time: 170, label: "Vampette", type: "ADD_PHASE" },
        { time: 210, label: "Killer Voice", type: "RAIDWIDE" },
        { time: 250, label: "Crowd Kill", type: "ENRAGE" },
      ],
    },
    {
      slug: "m10s", name: "M10S - Red Hot & Deep Blue", patch: "7.4", bossName: "The Xtremes",
      expansion: "Dawntrail", tier: "AAC Heavyweight",
      timestamps: [
        { time: 0, label: "Pull", type: "OTHER" },
        { time: 10, label: "Hot Impact", type: "TANKBUSTER" },
        { time: 35, label: "Alley-oop Inferno", type: "RAIDWIDE" },
        { time: 65, label: "Cutback Blaze", type: "STACK" },
        { time: 100, label: "Deep Blue", type: "RAIDWIDE" },
        { time: 135, label: "Hot Impact", type: "TANKBUSTER" },
        { time: 170, label: "Brotherly Love", type: "STACK" },
        { time: 210, label: "Alley-oop Inferno", type: "RAIDWIDE" },
        { time: 260, label: "Finale", type: "ENRAGE" },
      ],
    },
    {
      slug: "m11s", name: "M11S - The Tyrant", patch: "7.4", bossName: "The Tyrant",
      expansion: "Dawntrail", tier: "AAC Heavyweight",
      timestamps: [
        { time: 0, label: "Pull", type: "OTHER" },
        { time: 15, label: "Ecliptic Stampede", type: "RAIDWIDE" },
        { time: 45, label: "Flatliner", type: "TANKBUSTER" },
        { time: 80, label: "Meteor Rain", type: "STACK" },
        { time: 120, label: "Weapon Spawn", type: "ADD_PHASE" },
        { time: 165, label: "Ecliptic Stampede", type: "RAIDWIDE" },
        { time: 210, label: "Flatliner", type: "TANKBUSTER" },
        { time: 260, label: "Portal", type: "SPREAD" },
        { time: 310, label: "Finale", type: "ENRAGE" },
      ],
    },
    {
      slug: "m12s", name: "M12S - Lindwurm", patch: "7.4", bossName: "Lindwurm",
      expansion: "Dawntrail", tier: "AAC Heavyweight",
      timestamps: [
        { time: 0, label: "Pull", type: "OTHER" },
        { time: 10, label: "Mortal Slayer", type: "TANKBUSTER" },
        { time: 40, label: "Replication", type: "RAIDWIDE" },
        { time: 75, label: "Idyllic", type: "STACK" },
        { time: 115, label: "Mortal Slayer", type: "TANKBUSTER" },
        { time: 155, label: "Replication", type: "RAIDWIDE" },
        { time: 200, label: "Phase Change", type: "OTHER" },
        { time: 220, label: "Mortal Slayer", type: "TANKBUSTER" },
        { time: 265, label: "Idyllic", type: "SPREAD" },
        { time: 315, label: "Replication", type: "RAIDWIDE" },
        { time: 370, label: "Finale", type: "ENRAGE" },
      ],
    },
    // ── Extreme Trials ──────────────────────────────────────
    {
      slug: "ex1", name: "EX1 - Worqor Lar Dor", patch: "7.0", bossName: "Valigarmanda",
      expansion: "Dawntrail", tier: "Extreme Trials",
      timestamps: [
        { time: 0, label: "Pull", type: "OTHER" },
        { time: 10, label: "Scratch", type: "TANKBUSTER" },
        { time: 30, label: "Ruinous Blast", type: "RAIDWIDE" },
        { time: 55, label: "Roar of the Tural Vidraal", type: "STACK" },
        { time: 85, label: "Scratch", type: "TANKBUSTER" },
        { time: 115, label: "Ruinous Blast", type: "RAIDWIDE" },
        { time: 150, label: "Roar of the Tural Vidraal", type: "SPREAD" },
        { time: 190, label: "Enrage", type: "ENRAGE" },
      ],
    },
    {
      slug: "ex2", name: "EX2 - Everkeep", patch: "7.0", bossName: "Zoraal Ja",
      expansion: "Dawntrail", tier: "Extreme Trials",
      timestamps: [
        { time: 0, label: "Pull", type: "OTHER" },
        { time: 10, label: "Resilient Son", type: "TANKBUSTER" },
        { time: 35, label: "Double-Edged Sword", type: "RAIDWIDE" },
        { time: 65, label: "Duty's Edge", type: "STACK" },
        { time: 100, label: "Resilient Son", type: "TANKBUSTER" },
        { time: 135, label: "Double-Edged Sword", type: "RAIDWIDE" },
        { time: 175, label: "Duty's Edge", type: "SPREAD" },
        { time: 220, label: "Enrage", type: "ENRAGE" },
      ],
    },
    {
      slug: "ex3", name: "EX3 - Sphene's Burden", patch: "7.1", bossName: "Queen Eternal",
      expansion: "Dawntrail", tier: "Extreme Trials",
      timestamps: [
        { time: 0, label: "Pull", type: "OTHER" },
        { time: 12, label: "Royal Domain", type: "TANKBUSTER" },
        { time: 38, label: "Eternal Stasis", type: "RAIDWIDE" },
        { time: 68, label: "Crystalline", type: "STACK" },
        { time: 105, label: "Royal Domain", type: "TANKBUSTER" },
        { time: 140, label: "Eternal Stasis", type: "RAIDWIDE" },
        { time: 180, label: "Crystalline", type: "SPREAD" },
        { time: 225, label: "Enrage", type: "ENRAGE" },
      ],
    },
    {
      slug: "ex4", name: "EX4 - Recollection", patch: "7.2", bossName: "Zelenia",
      expansion: "Dawntrail", tier: "Extreme Trials",
      timestamps: [
        { time: 0, label: "Pull", type: "OTHER" },
        { time: 10, label: "Knight's Resolve", type: "TANKBUSTER" },
        { time: 35, label: "Queen's Decree", type: "RAIDWIDE" },
        { time: 65, label: "Recollection", type: "STACK" },
        { time: 100, label: "Knight's Resolve", type: "TANKBUSTER" },
        { time: 135, label: "Queen's Decree", type: "RAIDWIDE" },
        { time: 175, label: "Recollection", type: "SPREAD" },
        { time: 220, label: "Enrage", type: "ENRAGE" },
      ],
    },
    {
      slug: "ex5", name: "EX5 - Necron's Embrace", patch: "7.3", bossName: "Necron",
      expansion: "Dawntrail", tier: "Extreme Trials",
      timestamps: [
        { time: 0, label: "Pull", type: "OTHER" },
        { time: 12, label: "Void Grasp", type: "TANKBUSTER" },
        { time: 38, label: "Primordial Fear", type: "RAIDWIDE" },
        { time: 70, label: "Embrace of Nihility", type: "STACK" },
        { time: 110, label: "Void Grasp", type: "TANKBUSTER" },
        { time: 150, label: "Primordial Fear", type: "RAIDWIDE" },
        { time: 195, label: "Embrace of Nihility", type: "SPREAD" },
        { time: 245, label: "Enrage", type: "ENRAGE" },
      ],
    },
    {
      slug: "ex6", name: "EX6 - Hell on Rails", patch: "7.4", bossName: "Doomtrain",
      expansion: "Dawntrail", tier: "Extreme Trials",
      timestamps: [
        { time: 0, label: "Pull", type: "OTHER" },
        { time: 10, label: "Levin Charge", type: "TANKBUSTER" },
        { time: 35, label: "Phantom Express", type: "RAIDWIDE" },
        { time: 70, label: "Derailment", type: "STACK" },
        { time: 110, label: "Levin Charge", type: "TANKBUSTER" },
        { time: 150, label: "Phantom Express", type: "RAIDWIDE" },
        { time: 195, label: "Derailment", type: "SPREAD" },
        { time: 245, label: "Enrage", type: "ENRAGE" },
      ],
    },
    {
      slug: "ex7", name: "EX7 - The Unmaking", patch: "7.5", bossName: "Enuo",
      expansion: "Dawntrail", tier: "Extreme Trials",
      timestamps: [
        { time: 0, label: "Pull", type: "OTHER" },
        { time: 12, label: "Void Sovereign", type: "TANKBUSTER" },
        { time: 40, label: "Unmaking", type: "RAIDWIDE" },
        { time: 75, label: "Nihility", type: "STACK" },
        { time: 115, label: "Void Sovereign", type: "TANKBUSTER" },
        { time: 155, label: "Unmaking", type: "RAIDWIDE" },
        { time: 200, label: "Nihility", type: "SPREAD" },
        { time: 250, label: "Enrage", type: "ENRAGE" },
      ],
    },
    // ── Collaboration Extreme ───────────────────────────────
    {
      slug: "ex-windward", name: "The Windward Wilds (Extreme)", patch: "7.35", bossName: "Guardian Arkveld",
      expansion: "Dawntrail", tier: "Extreme Trials",
      timestamps: [
        { time: 0, label: "Pull", type: "OTHER" },
        { time: 15, label: "White Wraith", type: "RAIDWIDE" },
        { time: 45, label: "Arkveld's Fury", type: "TANKBUSTER" },
        { time: 80, label: "Wilds Hunt", type: "STACK" },
        { time: 120, label: "White Wraith", type: "RAIDWIDE" },
        { time: 160, label: "Arkveld's Fury", type: "TANKBUSTER" },
        { time: 200, label: "Wilds Hunt", type: "SPREAD" },
        { time: 250, label: "Enrage", type: "ENRAGE" },
      ],
    },
    // ── Ultimates ────────────────────────────────────────────
    {
      slug: "fru", name: "Futures Rewritten (Ultimate)", patch: "7.11", bossName: "Pandora",
      expansion: "Dawntrail", tier: "Ultimate",
      timestamps: [
        { time: 0, label: "Pull", type: "OTHER" },
        { time: 20, label: "Fatebreaker: Burnished Glory", type: "RAIDWIDE" },
        { time: 55, label: "Fatebreaker: Condemnation", type: "TANKBUSTER" },
        { time: 95, label: "Fatebreaker: Fulgent Blade", type: "STACK" },
        { time: 140, label: "Phase Change → Usurper of Frost", type: "OTHER" },
        { time: 160, label: "Usurper: Absolute Zero", type: "RAIDWIDE" },
        { time: 200, label: "Usurper: Ice Tomb", type: "SPREAD" },
        { time: 245, label: "Usurper: Diamond Dust", type: "RAIDWIDE" },
        { time: 295, label: "Phase Change → Oracle of Darkness", type: "OTHER" },
        { time: 315, label: "Oracle: Dark Pulse", type: "RAIDWIDE" },
        { time: 355, label: "Oracle: Nightfall", type: "TANKBUSTER" },
        { time: 400, label: "Oracle: Akh Morn", type: "STACK" },
        { time: 460, label: "Phase Change → Enter the Dragon", type: "OTHER" },
        { time: 480, label: "Dragon: Dual Akh Morn", type: "RAIDWIDE" },
        { time: 540, label: "Dragon: Polarizing Strikes", type: "TANKBUSTER" },
        { time: 600, label: "Phase Change → Pandora", type: "OTHER" },
        { time: 620, label: "Pandora: Paradise Regained", type: "RAIDWIDE" },
        { time: 680, label: "Pandora: Fulgent Blade Exa", type: "STACK" },
        { time: 750, label: "Pandora: Paradise Lost", type: "ENRAGE" },
      ],
    },
    {
      slug: "dmu", name: "Dancing Mad (Ultimate)", patch: "7.51", bossName: "Kefka",
      expansion: "Dawntrail", tier: "Ultimate",
      timestamps: [
        { time: 0, label: "Pull", type: "OTHER" },
        { time: 15, label: "Kefka: Hyperdrive", type: "RAIDWIDE" },
        { time: 50, label: "Kefka: Havoc", type: "TANKBUSTER" },
        { time: 90, label: "Kefka: Trickster", type: "STACK" },
        { time: 140, label: "Phase Change → God Kefka", type: "OTHER" },
        { time: 160, label: "God Kefka: Havoc", type: "RAIDWIDE" },
        { time: 210, label: "God Kefka: Hyperdrive", type: "TANKBUSTER" },
        { time: 270, label: "God Kefka: Timely Teleport", type: "SPREAD" },
        { time: 330, label: "God Kefka: Havoc", type: "RAIDWIDE" },
        { time: 400, label: "God Kefka: Hyperdrive", type: "TANKBUSTER" },
        { time: 480, label: "Dancing Mad", type: "ENRAGE" },
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
