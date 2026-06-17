import { describe, it, expect } from "vitest";
import type { CellData, RowData, Spreadsheet } from "@/lib/google-sheets";
import {
  parseTimeline,
  extractSegments,
  categoryToEventType,
  DEFAULT_CONFIG,
  toFightPayload,
} from "@/lib/timeline-parser";

function cell(
  value: string,
  options?: {
    color?: string;
    backgroundColor?: string;
    runs?: Array<{ text: string; color: string }>;
  },
): CellData {
  const hexToColor = (hex: string) => ({
    red: Number.parseInt(hex.slice(1, 3), 16) / 255,
    green: Number.parseInt(hex.slice(3, 5), 16) / 255,
    blue: Number.parseInt(hex.slice(5, 7), 16) / 255,
  });

  const data: CellData = {
    formattedValue: value,
  };

  if (options?.color) {
    data.effectiveFormat = {
      textFormat: {
        foregroundColor: hexToColor(options.color),
      },
    };
  }

  if (options?.backgroundColor) {
    data.effectiveFormat ??= {};
    data.effectiveFormat.backgroundColor = hexToColor(options.backgroundColor);
  }

  if (options?.runs) {
    let index = 0;
    data.textFormatRuns = options.runs.map((run) => {
      const startIndex = index;
      index += run.text.length;
      return {
        startIndex,
        format: {
          foregroundColor: hexToColor(run.color),
        },
      };
    });
  }

  return data;
}

function makeRows(rows: (CellData | string | null)[][]): RowData[] {
  return rows.map((row) => ({
    values: row.map((item) => {
      if (item === null || item === undefined) return {};
      if (typeof item === "string") return cell(item);
      return item;
    }),
  }));
}

function buildSpreadsheet(rows: RowData[]): Spreadsheet {
  return {
    spreadsheetId: "test-id",
    properties: {
      title: "DT Raid Timelines",
    },
    sheets: [
      {
        properties: {
          title: "The Lyndwurm",
        },
        data: [
          {
            rowData: rows,
          },
        ],
      },
    ],
  };
}

describe("categoryToEventType", () => {
  it("maps known categories to EventType values", () => {
    expect(categoryToEventType("Raid Damage")).toBe("RAID_DAMAGE");
    expect(categoryToEventType("Tank Damage")).toBe("TANK_DAMAGE");
    expect(categoryToEventType("Positioning Required")).toBe("POSITIONING_REQUIRED");
    expect(categoryToEventType("Avoidable AoE")).toBe("AVOIDABLE_AOE");
    expect(categoryToEventType("Debuffs")).toBe("DEBUFFS");
    expect(categoryToEventType("Targeted AoE")).toBe("TARGETED_AOE");
    expect(categoryToEventType("Mechanics")).toBe("MECHANICS");
  });

  it("falls back to OTHER for unknown categories", () => {
    expect(categoryToEventType(undefined)).toBe("OTHER");
    expect(categoryToEventType("Anything")).toBe("OTHER");
  });
});

describe("extractSegments", () => {
  it("returns a single segment when no text runs are present", () => {
    const result = extractSegments(cell("Arcadia Aflame", { color: "#ff0000" }), DEFAULT_CONFIG);
    expect(result).toEqual([{ text: "Arcadia Aflame", color: "#ff0000", category: "Raid Damage" }]);
  });

  it("splits composite mechanics by text format runs", () => {
    const result = extractSegments(
      cell("Winged Scourge+Top-tier Slam+Mighty Magic", {
        runs: [
          { text: "Winged Scourge", color: "#00ff00" },
          { text: "+", color: "#ffffff" },
          { text: "Top-tier Slam", color: "#00bfff" },
          { text: "+", color: "#ffffff" },
          { text: "Mighty Magic", color: "#00bfff" },
        ],
      }),
      DEFAULT_CONFIG,
    );

    expect(result).toHaveLength(5);
    expect(result[0]).toEqual({
      text: "Winged Scourge",
      color: "#00ff00",
      category: "Avoidable AoE",
    });
    expect(result[1]).toEqual({
      text: "+",
      color: "#ffffff",
      category: "Default",
    });
    expect(result[2]).toEqual({
      text: "Top-tier Slam",
      color: "#00bfff",
      category: "Targeted AoE",
    });
  });
});

describe("parseTimeline", () => {
  it("parses metadata from the header rows", () => {
    const rows = makeRows([
      [null, "The Lyndwurm"],
      [null, null, null, null, "(01/13/2026) Exia"],
      [null, "M12S Part II"],
      [null, "Rotation & Timeline"],
    ]);

    const spreadsheet = buildSpreadsheet(rows);
    const result = parseTimeline(spreadsheet);

    expect(result.meta).toEqual({
      title: "The Lyndwurm",
      subtitle: "Rotation & Timeline",
      encounter: "M12S Part II",
      date: "01/13/2026",
      author: "Exia",
      spreadsheetTitle: "DT Raid Timelines",
      spreadsheetId: "test-id",
    });
  });

  it("extracts the mechanic glossary", () => {
    const rows = makeRows([
      [null, "The Lyndwurm"],
      [null, null, null, null, "(01/13/2026) Exia"],
      [null, "M12S Part II"],
      [null, "Rotation & Timeline"],
      [null, cell("Arcadia Aflame", { color: "#ff0000" }), null, "- Raid damage"],
      [null, cell("Snaking Kick", { color: "#00ff00" }), null, "- Half room cleave"],
      [null, "Color Codes", null, null],
    ]);

    const spreadsheet = buildSpreadsheet(rows);
    const result = parseTimeline(spreadsheet);

    expect(result.mechanics["Arcadia Aflame"]).toEqual({
      name: "Arcadia Aflame",
      description: "Raid damage",
      color: "#ff0000",
      category: "Raid Damage",
    });
    expect(result.mechanics["Snaking Kick"]).toEqual({
      name: "Snaking Kick",
      description: "Half room cleave",
      color: "#00ff00",
      category: "Avoidable AoE",
    });
  });

  it("extracts timeline events from both blocks", () => {
    const rows = makeRows([
      [null, "The Lyndwurm"],
      [null, null, null, null, "(01/13/2026) Exia"],
      [null, "M12S Part II"],
      [null, "Rotation & Timeline"],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        "0:10",
        "0:15",
        cell("Arcadia Aflame", { color: "#ff0000" }),
        null,
        "4:01",
        "4:06",
        cell("Double Sabat", { color: "#ff9900" }),
      ],
    ]);

    const spreadsheet = buildSpreadsheet(rows);
    const result = parseTimeline(spreadsheet);

    expect(result.blocks).toHaveLength(2);
    expect(result.blocks[0]?.events).toHaveLength(1);
    expect(result.blocks[0]?.events[0]).toMatchObject({
      row: 5,
      block: 1,
      castTime: "0:10",
      effectTime: "0:15",
      castSeconds: 10,
      effectSeconds: 15,
      label: "Arcadia Aflame",
      dominantCategory: "Raid Damage",
      type: "RAID_DAMAGE",
    });

    expect(result.blocks[1]?.events[0]).toMatchObject({
      row: 5,
      block: 2,
      castTime: "4:01",
      effectTime: "4:06",
      castSeconds: 241,
      effectSeconds: 246,
      label: "Double Sabat",
      dominantCategory: "Tank Damage",
      type: "TANK_DAMAGE",
    });
  });

  it("splits composite mechanics into segments", () => {
    const rows = makeRows([
      [null, "The Lyndwurm"],
      [null, null, null, null, "(01/13/2026) Exia"],
      [null, "M12S Part II"],
      [null, "Rotation & Timeline"],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        "0:36",
        "0:40",
        cell("Winged Scourge+Top-tier Slam+Mighty Magic", {
          runs: [
            { text: "Winged Scourge", color: "#00ff00" },
            { text: "+", color: "#ffffff" },
            { text: "Top-tier Slam", color: "#00bfff" },
            { text: "+", color: "#ffffff" },
            { text: "Mighty Magic", color: "#00bfff" },
          ],
        }),
      ],
    ]);

    const spreadsheet = buildSpreadsheet(rows);
    const result = parseTimeline(spreadsheet);

    const event = result.blocks[0]?.events[0];
    expect(event?.segments).toHaveLength(5);
    expect(event?.dominantCategory).toBe("Targeted AoE");
    expect(event?.type).toBe("TARGETED_AOE");
  });

  it("produces a flattened, sorted list of timestamps", () => {
    const rows = makeRows([
      [null, "The Lyndwurm"],
      [null, null, null, null, "(01/13/2026) Exia"],
      [null, "M12S Part II"],
      [null, "Rotation & Timeline"],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        "1:00",
        null,
        cell("Late Block 1", { color: "#7663ff" }),
        null,
        "0:30",
        null,
        cell("Early Block 2", { color: "#7663ff" }),
      ],
    ]);

    const spreadsheet = buildSpreadsheet(rows);
    const result = parseTimeline(spreadsheet);

    expect(result.timestamps).toEqual([
      { time: 30, label: "Early Block 2", type: "MECHANICS" },
      { time: 60, label: "Late Block 1", type: "MECHANICS" },
    ]);
  });

  it("ignores rows without cast times", () => {
    const rows = makeRows([
      [null, "The Lyndwurm"],
      [null, null, null, null, "(01/13/2026) Exia"],
      [null, "M12S Part II"],
      [null, "Rotation & Timeline"],
      [null, null, null, null, null, null, null, null, null, "Replication 2"],
    ]);

    const spreadsheet = buildSpreadsheet(rows);
    const result = parseTimeline(spreadsheet);

    expect(result.blocks[0]?.events).toHaveLength(0);
  });
});

describe("parseTimeline realistic fixture", () => {
  it("parses the Lyndwurm opening rotation layout", () => {
    // A condensed version of the actual CSV rows, with only values.
    const rows = makeRows([
      [null, "The Lyndwurm"],
      [null, null, null, null, "(01/13/2026) Exia"],
      [null, "M12S Part II"],
      [null, "Rotation & Timeline"],
      [
        null,
        "Arcadia Aflame",
        null,
        "- Raid damage",
        null,
        null,
        null,
        null,
        null,
        "0:10",
        "0:15",
        "Arcadia Aflame",
      ],
      [
        null,
        "Winged Scourge",
        null,
        "- Cone AoEs from clones",
        null,
        null,
        null,
        null,
        null,
        "0:36",
        "0:40",
        "Winged Scourge+Top-tier Slam+Mighty Magic",
      ],
      [null, null, null, null, null, null, null, null, null, "0:40", "0:45", "Snaking Kick"],
      [null, null, null, null, null, null, null, null, null, "Replication 2"],
      [
        null,
        "Staging",
        null,
        "- Spawns mannequins",
        null,
        null,
        null,
        null,
        null,
        "1:28",
        "1:31",
        "Staging",
      ],
    ]);

    const spreadsheet = buildSpreadsheet(rows);
    const result = parseTimeline(spreadsheet);

    expect(result.meta.encounter).toBe("M12S Part II");
    expect(result.mechanics["Arcadia Aflame"]?.description).toBe("Raid damage");
    expect(result.mechanics["Winged Scourge"]?.description).toBe("Cone AoEs from clones");

    const block1 = result.blocks[0];
    expect(block1?.events).toHaveLength(4);
    expect(block1?.events[0]).toMatchObject({
      castTime: "0:10",
      effectTime: "0:15",
      label: "Arcadia Aflame",
      castSeconds: 10,
      effectSeconds: 15,
    });
    expect(block1?.events[2]).toMatchObject({
      castTime: "0:40",
      effectTime: "0:45",
      label: "Snaking Kick",
      castSeconds: 40,
      effectSeconds: 45,
    });

    // Phase labels without cast times are skipped.
    expect(block1?.events.some((e) => e.label === "Replication 2")).toBe(false);
  });
});

describe("toFightPayload", () => {
  it("builds a fight payload from a parsed timeline", () => {
    const timeline = parseTimeline(
      buildSpreadsheet(
        makeRows([
          [null, "The Lyndwurm"],
          [null, null, null, null, "(01/13/2026) Exia"],
          [null, "M12S Part II"],
          [null, "Rotation & Timeline"],
          [
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            "0:10",
            "0:15",
            cell("Arcadia Aflame", { color: "#ff0000" }),
          ],
        ]),
      ),
    );

    const payload = toFightPayload(timeline, {
      patch: "7.2",
      expansion: "Dawntrail",
      tier: "Arcadion",
    });

    expect(payload).toMatchObject({
      slug: "m12s-part-ii-the-lyndwurm",
      name: "The Lyndwurm",
      bossName: "The Lyndwurm",
      expansion: "Dawntrail",
      tier: "Arcadion",
      patch: "7.2",
      timestamps: [{ time: 10, label: "Arcadia Aflame", type: "RAID_DAMAGE" }],
    });
  });

  it("allows overriding generated fields", () => {
    const timeline = parseTimeline(
      buildSpreadsheet(
        makeRows([
          [null, "The Lyndwurm"],
          [null, null, null, null, "(01/13/2026) Exia"],
          [null, "M12S Part II"],
          [null, "Rotation & Timeline"],
        ]),
      ),
    );

    const payload = toFightPayload(timeline, {
      slug: "custom-slug",
      name: "Custom Name",
      bossName: "Custom Boss",
      expansion: "Dawntrail",
      tier: "Arcadion",
      patch: "7.2",
    });

    expect(payload.slug).toBe("custom-slug");
    expect(payload.name).toBe("Custom Name");
    expect(payload.bossName).toBe("Custom Boss");
  });
});
