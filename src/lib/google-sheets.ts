/**
 * Google Sheets API v4 helpers for reading both cell values and formatting.
 *
 * The parser relies on the `includeGridData=true` flag so that every cell
 * carries its effective format (background/text colour, text runs, etc.).
 */

export type SheetsColor = {
  red?: number;
  green?: number;
  blue?: number;
  alpha?: number;
};

export type TextFormat = {
  foregroundColor?: SheetsColor;
  foregroundColorStyle?: {
    rgbColor?: SheetsColor;
  };
  bold?: boolean;
  italic?: boolean;
};

export type TextFormatRun = {
  startIndex?: number;
  format?: TextFormat;
};

export type CellFormat = {
  backgroundColor?: SheetsColor;
  backgroundColorStyle?: {
    rgbColor?: SheetsColor;
  };
  textFormat?: TextFormat;
};

export type CellData = {
  formattedValue?: string;
  effectiveFormat?: CellFormat;
  textFormatRuns?: TextFormatRun[];
};

export type RowData = {
  values?: CellData[];
};

export type GridData = {
  rowData?: RowData[];
};

export type Sheet = {
  properties?: {
    sheetId?: number;
    title?: string;
  };
  data?: GridData[];
};

export type Spreadsheet = {
  spreadsheetId?: string;
  properties?: {
    title?: string;
  };
  sheets?: Sheet[];
};

export type FetchSheetOptions = {
  spreadsheetId: string;
  gid?: number;
  range?: string;
  apiKey: string;
};

/**
 * Convert a Google Sheets API colour object to a 6-digit hex string.
 */
export function colorToHex(color?: SheetsColor): string | undefined {
  if (!color) return undefined;

  const toChannel = (value?: number) => {
    const clamped = Math.max(0, Math.min(1, value ?? 0));
    return Math.round(clamped * 255)
      .toString(16)
      .padStart(2, "0");
  };

  const hex = `#${toChannel(color.red)}${toChannel(color.green)}${toChannel(color.blue)}`;
  return hex;
}

/**
 * Resolve the foreground colour of a single cell, preferring the
 * `textFormatRuns` definition for rich-text cells.
 */
export function getCellForeground(cell: CellData | undefined): string | undefined {
  if (!cell) return undefined;

  const fromTextFormat = cell.effectiveFormat?.textFormat?.foregroundColor;
  const fromTextFormatStyle = cell.effectiveFormat?.textFormat?.foregroundColorStyle?.rgbColor;

  return colorToHex(fromTextFormatStyle ?? fromTextFormat);
}

async function resolveSheetTitle(
  spreadsheetId: string,
  gid: number,
  apiKey: string,
): Promise<string> {
  const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google Sheets API error (${response.status}): ${body.slice(0, 500)}`);
  }

  const metadata = (await response.json()) as Spreadsheet;
  const sheet = metadata.sheets?.find((s) => s.properties?.sheetId === gid);

  if (!sheet?.properties?.title) {
    throw new Error(`Sheet with gid ${gid} not found.`);
  }

  return sheet.properties.title;
}

/**
 * Fetch a public spreadsheet via the Google Sheets API v4.
 * Requires an API key with access to the Sheets API.
 */
export async function fetchSpreadsheet(options: FetchSheetOptions): Promise<Spreadsheet> {
  const { spreadsheetId, gid, range, apiKey } = options;

  if (!gid && !range) {
    throw new Error("Either a sheet range or gid must be provided.");
  }

  const ranges: string[] = [];

  if (range) {
    ranges.push(range);
  } else if (gid) {
    const title = await resolveSheetTitle(spreadsheetId, gid, apiKey);
    ranges.push(title);
  }

  const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`);
  url.searchParams.set("includeGridData", "true");
  url.searchParams.set("key", apiKey);

  for (const r of ranges) {
    url.searchParams.append("ranges", r);
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google Sheets API error (${response.status}): ${body.slice(0, 500)}`);
  }

  return (await response.json()) as Spreadsheet;
}

/**
 * Extract the first grid of sheet data from an API response.
 */
export function getFirstGridData(spreadsheet: Spreadsheet): GridData | undefined {
  return spreadsheet.sheets?.[0]?.data?.[0];
}
