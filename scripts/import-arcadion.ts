/**
 * Import every tab of a Google Sheet (except the first "Timelines" tab) as a
 * separate Fight under a shared tier, defaulting to Arcadion (Savage).
 *
 * Usage:
 *   GOOGLE_SHEETS_API_KEY=xxx pnpm import:arcadion
 *
 * Options:
 *   --spreadsheet <id>   Google Sheet id (defaults to the DT Raid Timelines sheet)
 *   --key <key>          Google Sheets API key (defaults to GOOGLE_SHEETS_API_KEY)
 *   --tier <tier>        Tier/category to assign (defaults to "Arcadion (Savage)")
 *   --expansion <name>   Expansion to assign (defaults to "Dawntrail")
 *   --dry-run            Print payloads without writing to the database
 *   --include-first      Include the first sheet even if it is named "Timelines"
 */

import { fetchSpreadsheet, type Spreadsheet } from "@/lib/google-sheets";
import { parseTimeline, toFightPayload } from "@/lib/timeline-parser";
import { prisma } from "@/lib/prisma";

type Args = {
  spreadsheetId?: string;
  apiKey?: string;
  tier?: string;
  expansion?: string;
  dryRun?: boolean;
  includeFirst?: boolean;
};

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const result: Args = {};

  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    switch (key) {
      case "--spreadsheet":
        result.spreadsheetId = args[++i];
        break;
      case "--key":
        result.apiKey = args[++i];
        break;
      case "--tier":
        result.tier = args[++i];
        break;
      case "--expansion":
        result.expansion = args[++i];
        break;
      case "--dry-run":
        result.dryRun = true;
        break;
      case "--include-first":
        result.includeFirst = true;
        break;
    }
  }

  return result;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function inferPatch(sheetTitle: string): string {
  const match = sheetTitle.match(/^M(\d+)/i);
  const num = match ? Number.parseInt(match[1], 10) : null;

  if (!num) return "7.2";
  if (num <= 4) return "7.05";
  if (num <= 8) return "7.2";
  return "7.4";
}

async function fetchSheetTitles(
  spreadsheetId: string,
  apiKey: string,
): Promise<Array<{ title: string; sheetId: number }>> {
  const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString());
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google Sheets API error (${response.status}): ${body.slice(0, 500)}`);
  }

  const metadata = (await response.json()) as Spreadsheet;
  const sheets = metadata.sheets ?? [];

  return sheets
    .map((sheet) => ({
      title: sheet.properties?.title ?? "",
      sheetId: sheet.properties?.sheetId ?? 0,
    }))
    .filter((sheet) => sheet.title);
}

async function main() {
  const args = parseArgs();

  const spreadsheetId = args.spreadsheetId ?? "1oG1SwNQ_Ncz2-1pOZrE9Y_A-2yECKD2ULNGpwvKtKho";
  const apiKey = args.apiKey ?? process.env.GOOGLE_SHEETS_API_KEY;
  const tier = args.tier ?? "Arcadion (Savage)";
  const expansion = args.expansion ?? "Dawntrail";
  const dryRun = args.dryRun ?? false;

  if (!apiKey) {
    console.error("Missing API key. Provide --key or set GOOGLE_SHEETS_API_KEY.");
    process.exit(1);
  }

  const sheets = await fetchSheetTitles(spreadsheetId, apiKey);
  const targets = args.includeFirst
    ? sheets
    : sheets.filter((sheet) => sheet.title !== "Timelines");

  console.log(
    `Found ${sheets.length} sheet(s). Importing ${targets.length} fight(s) under tier "${tier}".`,
  );

  for (const sheet of targets) {
    const spreadsheet = await fetchSpreadsheet({
      spreadsheetId,
      range: sheet.title,
      apiKey,
    });

    const timeline = parseTimeline(spreadsheet);
    const encounter = timeline.meta.encounter ?? sheet.title;
    const title = timeline.meta.title ?? sheet.title;

    const slug = slugify(encounter);
    const name = encounter !== title ? `${encounter} - ${title}` : title;
    const patch = inferPatch(sheet.title);

    const payload = toFightPayload(timeline, {
      slug,
      name,
      bossName: title,
      expansion,
      tier,
      patch,
    });

    if (dryRun) {
      console.log(
        `[dry-run] ${sheet.title}: slug=${payload.slug}, name=${payload.name}, patch=${payload.patch}, timestamps=${payload.timestamps.length}`,
      );
      continue;
    }

    await prisma.fight.upsert({
      where: { slug: payload.slug },
      update: {
        name: payload.name,
        bossName: payload.bossName,
        expansion: payload.expansion,
        tier: payload.tier,
        patch: payload.patch,
        timestamps: payload.timestamps as never,
      },
      create: {
        slug: payload.slug,
        name: payload.name,
        bossName: payload.bossName,
        expansion: payload.expansion,
        tier: payload.tier,
        patch: payload.patch,
        timestamps: payload.timestamps as never,
      },
    });

    console.log(
      `Imported ${sheet.title}: ${payload.name} (${payload.timestamps.length} timestamps)`,
    );
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
