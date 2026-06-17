import type { CellData, Spreadsheet } from "@/lib/google-sheets";
import { colorToHex, getCellForeground, getFirstGridData } from "@/lib/google-sheets";
import type { TimestampEntry } from "@/types";

/**
 * Default colour categories observed in Exia's FFXIV timeline sheets.
 * Colours are keyed by 6-digit hex foreground colour.
 */
export const DEFAULT_COLOR_CATEGORIES: Record<string, string> = {
  "#ff0000": "Raid Damage",
  "#ff9900": "Tank Damage",
  "#ffff00": "Positioning Required",
  "#00ff00": "Avoidable AoE",
  "#43ccc2": "Debuffs",
  "#00bfff": "Targeted AoE",
  "#7663ff": "Mechanics",
};

/**
 * Colours used for non-mechanic annotations.
 */
export const DEFAULT_SPECIAL_COLORS: Record<string, string> = {
  "#ffffff": "Default",
  "#b7b7b7": "Info annotation",
  "#999999": "Phase label",
};

/**
 * Map a colour category to the app's `EventType` enum.
 */
export function categoryToEventType(category?: string): string {
  switch (category) {
    case "Raid Damage":
      return "RAIDWIDE";
    case "Tank Damage":
      return "TANKBUSTER";
    case "Positioning Required":
      return "STACK";
    case "Targeted AoE":
      return "SPREAD";
    case "Avoidable AoE":
    case "Debuffs":
    case "Mechanics":
    default:
      return "OTHER";
  }
}

export type TimelineBlockConfig = {
  castColumn: number;
  effectColumn: number;
  mechanicColumn: number;
  label?: string;
};

export type ParserConfig = {
  /** Number of leading header rows to skip (1-based sheet rows). */
  headerRows: number;
  mechanicNameColumn: number;
  mechanicDescriptionColumn: number;
  blocks: TimelineBlockConfig[];
  colorCategories: Record<string, string>;
  specialColors: Record<string, string>;
};

export const DEFAULT_CONFIG: ParserConfig = {
  headerRows: 4,
  mechanicNameColumn: 1,
  mechanicDescriptionColumn: 3,
  blocks: [
    { castColumn: 9, effectColumn: 10, mechanicColumn: 11, label: "Opening" },
    { castColumn: 13, effectColumn: 14, mechanicColumn: 15, label: "Late" },
  ],
  colorCategories: DEFAULT_COLOR_CATEGORIES,
  specialColors: DEFAULT_SPECIAL_COLORS,
};

export type TextSegment = {
  text: string;
  color?: string;
  category?: string;
};

export type MechanicInfo = {
  name: string;
  description: string;
  color?: string;
  category?: string;
};

export type TimelineEvent = {
  /** 1-based row number in the source sheet. */
  row: number;
  /** Which timeline block this event belongs to. */
  block: number;
  castTime: string;
  effectTime?: string;
  /** Cast time converted to seconds since pull. */
  castSeconds: number;
  /** Effect time converted to seconds since pull, when present. */
  effectSeconds?: number;
  label: string;
  segments: TextSegment[];
  dominantCategory?: string;
  type: string;
};

export type TimelineBlock = {
  index: number;
  label?: string;
  events: TimelineEvent[];
};

export type ParsedTimeline = {
  meta: {
    title?: string;
    subtitle?: string;
    encounter?: string;
    author?: string;
    date?: string;
    spreadsheetTitle?: string;
    spreadsheetId?: string;
  };
  colorEncoding: Record<string, string>;
  mechanics: Record<string, MechanicInfo>;
  blocks: TimelineBlock[];
  /** Flattened, app-compatible list for direct import into a `Fight`. */
  timestamps: TimestampEntry[];
};

export type FightCreatePayload = {
  slug: string;
  name: string;
  bossName: string;
  expansion: string;
  tier: string;
  patch: string;
  timestamps: TimestampEntry[];
};

function getCellValue(cell: CellData | undefined): string | undefined {
  return cell?.formattedValue?.trim() || undefined;
}

function parseTimeString(value?: string): number {
  if (!value) return 0;

  const cleaned = value.trim();
  const parts = cleaned.split(":").map((part) => Number.parseInt(part, 10));

  if (parts.length === 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
    return parts[0] * 60 + parts[1];
  }

  if (parts.length === 1 && !Number.isNaN(parts[0])) {
    return parts[0];
  }

  return 0;
}

function normalizeDescription(raw?: string): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (trimmed.startsWith("-")) {
    return trimmed.slice(1).trim();
  }
  return trimmed;
}

function categoryForColor(hex: string | undefined, config: ParserConfig): string | undefined {
  if (!hex) return undefined;
  return config.colorCategories[hex] ?? config.specialColors[hex];
}

/**
 * Split a cell's text into coloured segments using `textFormatRuns`.
 * Falls back to a single segment with the cell's foreground colour.
 */
export function extractSegments(cell: CellData | undefined, config: ParserConfig): TextSegment[] {
  const text = getCellValue(cell) ?? "";
  if (!text) return [];

  const runs = cell?.textFormatRuns;
  if (!runs || runs.length === 0) {
    const color = getCellForeground(cell);
    return [
      {
        text,
        color,
        category: categoryForColor(color, config),
      },
    ];
  }

  const segments: TextSegment[] = [];
  let lastIndex = 0;

  for (let i = 0; i < runs.length; i++) {
    const run = runs[i];
    const start = run.startIndex ?? 0;
    const end = runs[i + 1]?.startIndex ?? text.length;

    if (start < lastIndex) continue;

    const segmentText = text.slice(start, end);
    if (!segmentText) continue;

    const color = colorToHex(
      run.format?.foregroundColorStyle?.rgbColor ?? run.format?.foregroundColor,
    );

    segments.push({
      text: segmentText,
      color,
      category: categoryForColor(color, config),
    });

    lastIndex = end;
  }

  if (segments.length === 0) {
    const color = getCellForeground(cell);
    return [{ text, color, category: categoryForColor(color, config) }];
  }

  return segments;
}

function inferDominantCategory(segments: TextSegment[]): string | undefined {
  const categoryCounts = new Map<string, number>();
  let totalWeight = 0;

  for (const segment of segments) {
    if (!segment.category) continue;
    // Treat joiners such as "+" and "/" as neutral.
    if (/^[+/\s]+$/.test(segment.text)) continue;

    const weight = segment.text.length;
    categoryCounts.set(segment.category, (categoryCounts.get(segment.category) ?? 0) + weight);
    totalWeight += weight;
  }

  if (totalWeight === 0) return undefined;

  let bestCategory: string | undefined;
  let bestWeight = 0;

  for (const [category, weight] of categoryCounts) {
    if (weight > bestWeight) {
      bestWeight = weight;
      bestCategory = category;
    }
  }

  return bestCategory;
}

function extractMechanics(
  rows: { values?: CellData[] }[],
  config: ParserConfig,
): Record<string, MechanicInfo> {
  const mechanics: Record<string, MechanicInfo> = {};

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    const name = getCellValue(row.values?.[config.mechanicNameColumn]);
    const description = normalizeDescription(
      getCellValue(row.values?.[config.mechanicDescriptionColumn]),
    );

    if (!name || !description) continue;
    if (name.toLowerCase().startsWith("color code")) continue;

    const cell = row.values?.[config.mechanicNameColumn];
    const color = getCellForeground(cell);

    mechanics[name] = {
      name,
      description,
      color,
      category: categoryForColor(color, config),
    };
  }

  return mechanics;
}

function extractTimelineEvents(
  rows: { values?: CellData[] }[],
  config: ParserConfig,
  headerRows: number,
): TimelineBlock[] {
  const blocks: TimelineBlock[] = config.blocks.map((block, index) => ({
    index: index + 1,
    label: block.label,
    events: [],
  }));

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    const sheetRow = rowIndex + 1 + headerRows;

    for (let blockIndex = 0; blockIndex < config.blocks.length; blockIndex++) {
      const blockConfig = config.blocks[blockIndex];
      const castValue = getCellValue(row.values?.[blockConfig.castColumn]);
      const mechanicValue = getCellValue(row.values?.[blockConfig.mechanicColumn]);

      if (!castValue || !mechanicValue) continue;
      // Skip phase labels and other non-time strings.
      if (!/\d/.test(castValue)) continue;

      const effectValue = getCellValue(row.values?.[blockConfig.effectColumn]);
      const mechanicCell = row.values?.[blockConfig.mechanicColumn];
      const segments = extractSegments(mechanicCell, config);
      const dominantCategory = inferDominantCategory(segments);

      const event: TimelineEvent = {
        row: sheetRow,
        block: blockIndex + 1,
        castTime: castValue,
        effectTime: effectValue,
        castSeconds: parseTimeString(castValue),
        effectSeconds: effectValue ? parseTimeString(effectValue) : undefined,
        label: mechanicValue,
        segments,
        dominantCategory,
        type: categoryToEventType(dominantCategory),
      };

      blocks[blockIndex]?.events.push(event);
    }
  }

  return blocks;
}

function extractMeta(
  spreadsheet: Spreadsheet,
  rows: { values?: CellData[] }[],
): ParsedTimeline["meta"] {
  const spreadsheetTitle = spreadsheet.properties?.title;
  const title = getCellValue(rows[0]?.values?.[1]);
  const subtitle = getCellValue(rows[3]?.values?.[1]);
  const encounter = getCellValue(rows[2]?.values?.[1]);
  const authorCell = getCellValue(rows[1]?.values?.[4]);

  let date: string | undefined;
  let author: string | undefined;

  if (authorCell) {
    const match = authorCell.match(/\(([^)]+)\)\s*(.+)/s);
    if (match) {
      date = match[1]?.trim();
      author = match[2]?.trim();
    } else {
      author = authorCell.trim();
    }
  }

  return {
    title,
    subtitle,
    encounter,
    date,
    author,
    spreadsheetTitle,
    spreadsheetId: spreadsheet.spreadsheetId,
  };
}

/**
 * Parse a Google Sheets API spreadsheet response into a structured timeline.
 *
 * The default configuration matches Exia's FFXIV raid timeline layout:
 *   - Title in B1, author/date in E2, encounter in B3, subtitle in B4.
 *   - Mechanic glossary in columns B/D.
 *   - Timeline blocks at J/K/L and N/O/P.
 */
export function parseTimeline(
  spreadsheet: Spreadsheet,
  config: Partial<ParserConfig> = {},
): ParsedTimeline {
  const merged: ParserConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    colorCategories: {
      ...DEFAULT_CONFIG.colorCategories,
      ...config.colorCategories,
    },
    specialColors: {
      ...DEFAULT_CONFIG.specialColors,
      ...config.specialColors,
    },
    blocks: config.blocks ?? DEFAULT_CONFIG.blocks,
  };

  const grid = getFirstGridData(spreadsheet);
  const rows = grid?.rowData ?? [];
  const dataRows = rows.slice(merged.headerRows);

  const mechanics = extractMechanics(dataRows, merged);
  const blocks = extractTimelineEvents(dataRows, merged, merged.headerRows);

  const timestamps: TimestampEntry[] = blocks
    .flatMap((block) => block.events)
    .sort((a, b) => a.castSeconds - b.castSeconds)
    .map((event) => ({
      time: event.castSeconds,
      label: event.label,
      type: event.type,
    }));

  return {
    meta: extractMeta(spreadsheet, rows),
    colorEncoding: merged.colorCategories,
    mechanics,
    blocks,
    timestamps,
  };
}

/**
 * Convert a parsed timeline into a payload suitable for the admin fight API.
 *
 * `patch` is not present in the sheet, so callers must supply it.
 */
export function toFightPayload(
  timeline: ParsedTimeline,
  overrides: Partial<FightCreatePayload> & { patch: string },
): FightCreatePayload {
  const slug =
    overrides.slug ??
    [timeline.meta.encounter, timeline.meta.title]
      .filter(Boolean)
      .join("-")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  return {
    slug,
    name: overrides.name ?? timeline.meta.title ?? timeline.meta.encounter ?? slug,
    bossName: overrides.bossName ?? timeline.meta.title ?? timeline.meta.encounter ?? slug,
    expansion: overrides.expansion ?? "Unknown",
    tier: overrides.tier ?? "Unknown",
    patch: overrides.patch,
    timestamps: timeline.timestamps,
  };
}
