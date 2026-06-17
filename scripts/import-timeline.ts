/**
 * CLI utility to fetch a Google Sheet timeline and emit structured JSON.
 *
 * Usage:
 *   GOOGLE_SHEETS_API_KEY=xxx tsx scripts/import-timeline.ts \
 *     --spreadsheet 1oG1SwNQ_Ncz2-1pOZrE9Y_A-2yECKD2ULNGpwvKtKho \
 *     --gid 196243635
 */

import { fetchSpreadsheet } from "@/lib/google-sheets";
import { parseTimeline } from "@/lib/timeline-parser";

function parseArgs() {
  const args = process.argv.slice(2);
  const result: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (key?.startsWith("--")) {
      result[key.slice(2)] = args[i + 1] ?? "";
      i++;
    }
  }

  return result;
}

async function main() {
  const args = parseArgs();
  const spreadsheetId = args.spreadsheet;
  const gid = args.gid ? Number.parseInt(args.gid, 10) : undefined;
  const apiKey = args.key ?? process.env.GOOGLE_SHEETS_API_KEY;

  if (!spreadsheetId) {
    console.error("Missing --spreadsheet argument.");
    process.exit(1);
  }

  if (!apiKey) {
    console.error("Missing API key. Provide --key or set GOOGLE_SHEETS_API_KEY.");
    process.exit(1);
  }

  const spreadsheet = await fetchSpreadsheet({
    spreadsheetId,
    gid,
    apiKey,
  });

  const timeline = parseTimeline(spreadsheet);
  console.log(JSON.stringify(timeline, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
