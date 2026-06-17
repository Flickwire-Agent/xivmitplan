import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchSpreadsheet, getFirstGridData } from "@/lib/google-sheets";

describe("fetchSpreadsheet", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves a gid to a sheet title before fetching grid data", async () => {
    const fetchMock = vi.mocked(globalThis.fetch);

    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            sheets: [
              { properties: { sheetId: 123, title: "Other" } },
              { properties: { sheetId: 196243635, title: "The Lyndwurm" } },
            ],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            sheets: [
              {
                properties: { title: "The Lyndwurm" },
                data: [{ rowData: [{ values: [{ formattedValue: "test" }] }] }],
              },
            ],
          }),
          { status: 200 },
        ),
      );

    const result = await fetchSpreadsheet({
      spreadsheetId: "test-id",
      gid: 196243635,
      apiKey: "test-key",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);

    const gridUrl = new URL(fetchMock.mock.calls[1]?.[0] as string);
    expect(gridUrl.searchParams.getAll("ranges")).toEqual(["The Lyndwurm"]);
    expect(gridUrl.searchParams.get("includeGridData")).toBe("true");

    expect(getFirstGridData(result)?.rowData?.[0]?.values?.[0]?.formattedValue).toBe("test");
  });

  it("throws when the gid cannot be found", async () => {
    const fetchMock = vi.mocked(globalThis.fetch);

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          sheets: [{ properties: { sheetId: 1, title: "Other" } }],
        }),
        { status: 200 },
      ),
    );

    await expect(
      fetchSpreadsheet({
        spreadsheetId: "test-id",
        gid: 999,
        apiKey: "test-key",
      }),
    ).rejects.toThrow("Sheet with gid 999 not found");
  });

  it("uses the provided range directly", async () => {
    const fetchMock = vi.mocked(globalThis.fetch);

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          sheets: [
            {
              properties: { title: "Sheet1" },
              data: [{ rowData: [] }],
            },
          ],
        }),
        { status: 200 },
      ),
    );

    await fetchSpreadsheet({
      spreadsheetId: "test-id",
      range: "Sheet1!A1:Z100",
      apiKey: "test-key",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = new URL(fetchMock.mock.calls[0]?.[0] as string);
    expect(url.searchParams.getAll("ranges")).toEqual(["Sheet1!A1:Z100"]);
  });
});
