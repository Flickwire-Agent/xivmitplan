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
  const fight = await prisma.fight.findUnique({
    where: { slug: "m4s" },
  });
  if (!fight) {
    console.log("No fights found — run seed.ts first (npx tsx prisma/seed.ts)");
    return;
  }

  const timestamps = fight.timestamps as { time: number; label: string; type: string }[];

  const m1sFight = await prisma.fight.findUnique({ where: { slug: "m1s" } });
  const m2sFight = await prisma.fight.findUnique({ where: { slug: "m2s" } });
  const m3sFight = await prisma.fight.findUnique({ where: { slug: "m3s" } });
  const m4sFight = await prisma.fight.findUnique({ where: { slug: "m4s" } });

  if (!m1sFight || !m2sFight || !m3sFight || !m4sFight) {
    console.log("Not all fights found — aborting");
    return;
  }

  const m1sTimestamps = m1sFight.timestamps as { time: number; label: string; type: string }[];
  const m2sTimestamps = m2sFight.timestamps as { time: number; label: string; type: string }[];
  const m3sTimestamps = m3sFight.timestamps as { time: number; label: string; type: string }[];
  const m4sTimestamps = m4sFight.timestamps as { time: number; label: string; type: string }[];

  const abilities = await prisma.ability.findMany();
  const ab = Object.fromEntries(abilities.map((a) => [a.name, a]));

  const plans = [
    {
      title: "M1S — Week 1 Prog (PLD/WAR/WHM/SCH/MNK/NIN/BRD/SMN)",
      fightId: m1sFight.id,
      characters: [
        { jobId: "PLD", label: "Tank 1" },
        { jobId: "WAR", label: "Tank 2" },
        { jobId: "WHM", label: "Healer 1" },
        { jobId: "SCH", label: "Healer 2" },
        { jobId: "MNK", label: "Melee 1" },
        { jobId: "NIN", label: "Melee 2" },
        { jobId: "BRD", label: "Phys Ranged" },
        { jobId: "SMN", label: "Caster" },
      ],
      events: [
        { charIdx: 0, tsIdx: 1, abilityName: "Rampart" },
        { charIdx: 1, tsIdx: 1, abilityName: "Reprisal" },
        { charIdx: 3, tsIdx: 1, abilityName: "Succor" },
        { charIdx: 4, tsIdx: 1, abilityName: "Feint" },
        { charIdx: 7, tsIdx: 1, abilityName: "Addle" },
        { charIdx: 0, tsIdx: 0, abilityName: "Sentinel", note: "Pre-pull" },
        { charIdx: 0, tsIdx: 2, abilityName: "Sheltron" },
        { charIdx: 1, tsIdx: 2, abilityName: "Bloodwhetting" },
        { charIdx: 2, tsIdx: 2, abilityName: "Temperance" },
        { charIdx: 3, tsIdx: 2, abilityName: "Expedient" },
        { charIdx: 4, tsIdx: 2, abilityName: "Mantra" },
        { charIdx: 6, tsIdx: 2, abilityName: "Troubadour" },
        { charIdx: 6, tsIdx: 3, abilityName: "Nature's Minne" },
        { charIdx: 3, tsIdx: 3, abilityName: "Deployment Tactics", note: "Adlo deploy" },
        { charIdx: 0, tsIdx: 3, abilityName: "Divine Veil" },
        { charIdx: 1, tsIdx: 3, abilityName: "Shake It Off" },
        { charIdx: 2, tsIdx: 4, abilityName: "Aquaveil" },
        { charIdx: 7, tsIdx: 4, abilityName: "Addle" },
        { charIdx: 5, tsIdx: 4, abilityName: "Feint" },
        { charIdx: 1, tsIdx: 4, abilityName: "Reprisal" },
        { charIdx: 0, tsIdx: 5, abilityName: "Passage of Arms" },
        { charIdx: 2, tsIdx: 5, abilityName: "Benediction" },
        { charIdx: 4, tsIdx: 6, abilityName: "Feint" },
        { charIdx: 7, tsIdx: 6, abilityName: "Addle" },
        { charIdx: 0, tsIdx: 6, abilityName: "Sentinel" },
        { charIdx: 1, tsIdx: 6, abilityName: "Vengeance" },
      ],
    },
    {
      title: "M2S — Reclear (DRK/GNB/SGE/AST/DRG/SAM/DNC/BLM)",
      fightId: m2sFight.id,
      characters: [
        { jobId: "DRK", label: "MT" },
        { jobId: "GNB", label: "OT" },
        { jobId: "SGE", label: "H1" },
        { jobId: "AST", label: "H2" },
        { jobId: "DRG", label: "M1" },
        { jobId: "SAM", label: "M2" },
        { jobId: "DNC", label: "R1" },
        { jobId: "BLM", label: "C1" },
      ],
      events: [
        { charIdx: 0, tsIdx: 0, abilityName: "The Blackest Night", note: "Pre-pull" },
        { charIdx: 1, tsIdx: 0, abilityName: "Heart of Corundum", note: "Pre-pull" },
        { charIdx: 0, tsIdx: 1, abilityName: "Shadow Wall" },
        { charIdx: 1, tsIdx: 1, abilityName: "Nebula" },
        { charIdx: 2, tsIdx: 1, abilityName: "Kerachole" },
        { charIdx: 3, tsIdx: 1, abilityName: "Collective Unconscious" },
        { charIdx: 4, tsIdx: 1, abilityName: "Feint" },
        { charIdx: 7, tsIdx: 1, abilityName: "Addle" },
        { charIdx: 6, tsIdx: 1, abilityName: "Shield Samba" },
        { charIdx: 0, tsIdx: 2, abilityName: "Dark Missionary" },
        { charIdx: 1, tsIdx: 2, abilityName: "Heart of Light" },
        { charIdx: 2, tsIdx: 2, abilityName: "Holos" },
        { charIdx: 3, tsIdx: 2, abilityName: "Neutral Sect" },
        { charIdx: 4, tsIdx: 3, abilityName: "Feint" },
        { charIdx: 7, tsIdx: 3, abilityName: "Addle" },
        { charIdx: 0, tsIdx: 3, abilityName: "Oblation" },
        { charIdx: 1, tsIdx: 3, abilityName: "Heart of Corundum" },
        { charIdx: 2, tsIdx: 4, abilityName: "Panhaima" },
        { charIdx: 3, tsIdx: 4, abilityName: "Celestial Opposition" },
        { charIdx: 0, tsIdx: 4, abilityName: "The Blackest Night" },
        { charIdx: 1, tsIdx: 4, abilityName: "Reprisal" },
        { charIdx: 4, tsIdx: 5, abilityName: "Feint" },
        { charIdx: 7, tsIdx: 5, abilityName: "Addle" },
        { charIdx: 6, tsIdx: 5, abilityName: "Shield Samba" },
        { charIdx: 2, tsIdx: 5, abilityName: "Taurochole" },
        { charIdx: 0, tsIdx: 6, abilityName: "Living Dead" },
        { charIdx: 3, tsIdx: 6, abilityName: "Essential Dignity" },
        { charIdx: 2, tsIdx: 6, abilityName: "Physis II" },
      ],
    },
    {
      title: "M3S — Alt Job Fun (GNB/WAR/SCH/WHM/VPR/RPR/MCH/RDM)",
      fightId: m3sFight.id,
      characters: [
        { jobId: "GNB", label: "MT" },
        { jobId: "WAR", label: "OT" },
        { jobId: "SCH", label: "H1" },
        { jobId: "WHM", label: "H2" },
        { jobId: "VPR", label: "M1" },
        { jobId: "RPR", label: "M2" },
        { jobId: "MCH", label: "R1" },
        { jobId: "RDM", label: "C1" },
      ],
      events: [
        { charIdx: 0, tsIdx: 0, abilityName: "Heart of Corundum", note: "Pre-pull" },
        { charIdx: 1, tsIdx: 0, abilityName: "Thrill of Battle", note: "Pre-pull" },
        { charIdx: 0, tsIdx: 1, abilityName: "Nebula" },
        { charIdx: 1, tsIdx: 1, abilityName: "Reprisal" },
        { charIdx: 2, tsIdx: 1, abilityName: "Adloquium" },
        { charIdx: 4, tsIdx: 1, abilityName: "Feint" },
        { charIdx: 7, tsIdx: 1, abilityName: "Magick Barrier" },
        { charIdx: 6, tsIdx: 1, abilityName: "Tactician" },
        { charIdx: 0, tsIdx: 2, abilityName: "Heart of Light" },
        { charIdx: 1, tsIdx: 2, abilityName: "Shake It Off" },
        { charIdx: 2, tsIdx: 2, abilityName: "Expedient" },
        { charIdx: 3, tsIdx: 2, abilityName: "Temperance" },
        { charIdx: 4, tsIdx: 2, abilityName: "Feint" },
        { charIdx: 7, tsIdx: 2, abilityName: "Addle" },
        { charIdx: 0, tsIdx: 3, abilityName: "Heart of Corundum" },
        { charIdx: 1, tsIdx: 3, abilityName: "Bloodwhetting" },
        { charIdx: 0, tsIdx: 4, abilityName: "Superbolide" },
        { charIdx: 1, tsIdx: 4, abilityName: "Holmgang" },
        { charIdx: 2, tsIdx: 4, abilityName: "Deployment Tactics" },
        { charIdx: 0, tsIdx: 5, abilityName: "Reprisal" },
        { charIdx: 1, tsIdx: 5, abilityName: "Vengeance" },
        { charIdx: 3, tsIdx: 5, abilityName: "Divine Benison" },
        { charIdx: 4, tsIdx: 5, abilityName: "Feint" },
        { charIdx: 7, tsIdx: 5, abilityName: "Addle" },
        { charIdx: 2, tsIdx: 6, abilityName: "Succor" },
        { charIdx: 3, tsIdx: 6, abilityName: "Aquaveil" },
        { charIdx: 6, tsIdx: 6, abilityName: "Tactician" },
      ],
    },
    {
      title: "M4S — Week 1 Prog (PLD/DRK/SGE/AST/MNK/NIN/DNC/PCT)",
      fightId: m4sFight.id,
      characters: [
        { jobId: "PLD", label: "MT" },
        { jobId: "DRK", label: "OT" },
        { jobId: "SGE", label: "H1" },
        { jobId: "AST", label: "H2" },
        { jobId: "MNK", label: "M1" },
        { jobId: "NIN", label: "M2" },
        { jobId: "DNC", label: "R1" },
        { jobId: "PCT", label: "C1" },
      ],
      events: [
        { charIdx: 0, tsIdx: 0, abilityName: "Sentinel", note: "Pre-pull" },
        { charIdx: 1, tsIdx: 0, abilityName: "The Blackest Night", note: "Pre-pull" },
        { charIdx: 0, tsIdx: 1, abilityName: "Sheltron" },
        { charIdx: 1, tsIdx: 1, abilityName: "Shadow Wall" },
        { charIdx: 2, tsIdx: 1, abilityName: "Kerachole" },
        { charIdx: 4, tsIdx: 1, abilityName: "Feint" },
        { charIdx: 7, tsIdx: 1, abilityName: "Addle" },
        { charIdx: 6, tsIdx: 1, abilityName: "Shield Samba" },
        { charIdx: 0, tsIdx: 2, abilityName: "Reprisal" },
        { charIdx: 1, tsIdx: 2, abilityName: "Dark Missionary" },
        { charIdx: 2, tsIdx: 2, abilityName: "Holos" },
        { charIdx: 3, tsIdx: 2, abilityName: "Neutral Sect" },
        { charIdx: 4, tsIdx: 2, abilityName: "Mantra" },
        { charIdx: 0, tsIdx: 3, abilityName: "Passage of Arms" },
        { charIdx: 1, tsIdx: 3, abilityName: "Reprisal" },
        { charIdx: 2, tsIdx: 3, abilityName: "Panhaima" },
        { charIdx: 3, tsIdx: 3, abilityName: "Collective Unconscious" },
        { charIdx: 6, tsIdx: 3, abilityName: "Shield Samba" },
        { charIdx: 5, tsIdx: 3, abilityName: "Feint" },
        { charIdx: 0, tsIdx: 4, abilityName: "Divine Veil" },
        { charIdx: 1, tsIdx: 4, abilityName: "Oblation" },
        { charIdx: 2, tsIdx: 4, abilityName: "Haima" },
        { charIdx: 3, tsIdx: 4, abilityName: "Celestial Opposition" },
        { charIdx: 4, tsIdx: 4, abilityName: "Feint" },
        { charIdx: 7, tsIdx: 4, abilityName: "Addle" },
        { charIdx: 0, tsIdx: 5, abilityName: "Rampart" },
        { charIdx: 1, tsIdx: 5, abilityName: "The Blackest Night" },
        { charIdx: 2, tsIdx: 5, abilityName: "Taurochole" },
        { charIdx: 3, tsIdx: 5, abilityName: "Essential Dignity" },
        { charIdx: 0, tsIdx: 6, abilityName: "Sentinel" },
        { charIdx: 1, tsIdx: 6, abilityName: "Living Dead" },
        { charIdx: 2, tsIdx: 6, abilityName: "Kerachole" },
        { charIdx: 3, tsIdx: 6, abilityName: "Neutral Sect" },
        { charIdx: 6, tsIdx: 6, abilityName: "Shield Samba" },
        { charIdx: 5, tsIdx: 6, abilityName: "Feint" },
        { charIdx: 7, tsIdx: 6, abilityName: "Tempera Grassa" },
        { charIdx: 0, tsIdx: 7, abilityName: "Hallowed Ground", note: "Tank LB or invuln" },
        { charIdx: 1, tsIdx: 7, abilityName: "Dark Missionary" },
        { charIdx: 2, tsIdx: 7, abilityName: "Holos" },
        { charIdx: 3, tsIdx: 7, abilityName: "Collective Unconscious" },
        { charIdx: 4, tsIdx: 7, abilityName: "Feint" },
        { charIdx: 7, tsIdx: 7, abilityName: "Addle" },
        { charIdx: 0, tsIdx: 8, abilityName: "Sentinel" },
        { charIdx: 1, tsIdx: 8, abilityName: "Shadow Wall" },
        { charIdx: 2, tsIdx: 8, abilityName: "Panhaima" },
        { charIdx: 3, tsIdx: 8, abilityName: "Neutral Sect" },
        { charIdx: 6, tsIdx: 8, abilityName: "Shield Samba" },
        { charIdx: 4, tsIdx: 8, abilityName: "Mantra" },
      ],
    },
  ];

  for (const planData of plans) {
    const plan = await prisma.plan.create({
      data: {
        title: planData.title,
        fightId: planData.fightId,
        characters: {
          create: planData.characters.map((c, i) => ({
            jobId: c.jobId,
            label: c.label,
            slotIndex: i,
          })),
        },
      },
      include: { characters: true },
    });

    for (const evt of planData.events) {
      const character = plan.characters[evt.charIdx];
      if (!character) continue;
      const ability = ab[evt.abilityName];
      if (!ability) {
        console.warn(`  Unknown ability: ${evt.abilityName}`);
        continue;
      }
      await prisma.planEvent.create({
        data: {
          planCharacterId: character.id,
          timestampIndex: evt.tsIdx,
          abilityId: ability.id,
          note: evt.note ?? null,
        },
      });
    }

    console.log(`  Created "${plan.title}" (${planData.events.length} events)`);
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
