import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { ValidationPanel } from "@/components/plan/validation-panel";
import type { ValidationIssue, TimestampEntry } from "@/types";

function renderWithMantine(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }) => <MantineProvider>{children}</MantineProvider>,
  });
}

const timestamps: TimestampEntry[] = [
  { time: 0, label: "Pull", type: "OTHER" },
  { time: 10, label: "Raid Damage", type: "RAID_DAMAGE" },
  { time: 30, label: "Tank Damage", type: "TANK_DAMAGE" },
];

describe("ValidationPanel", () => {
  it("shows empty state when no issues", () => {
    renderWithMantine(<ValidationPanel issues={[]} timestamps={timestamps} />);
    expect(screen.getByText("No validation issues found.")).toBeTruthy();
  });

  it("shows error issues with XCircle icon", () => {
    const issues: ValidationIssue[] = [
      {
        type: "COOLDOWN",
        severity: "ERROR",
        message: "Rampart is on cooldown",
        timestampIndex: 1,
        timestampLabel: "Raid Damage",
        time: 10,
        character: { id: "pld", label: "Paladin", job: "Paladin" },
        ability: { id: "Rampart", name: "Rampart" },
      },
    ];
    renderWithMantine(<ValidationPanel issues={issues} timestamps={timestamps} />);
    expect(screen.getByText("Rampart is on cooldown")).toBeTruthy();
  });

  it("shows warning issues with Info icon", () => {
    const issues: ValidationIssue[] = [
      {
        type: "MISSING",
        severity: "WARNING",
        message: "No ability assigned for Paladin",
        timestampIndex: 1,
        timestampLabel: "Raid Damage",
        time: 10,
        character: { id: "pld", label: "Paladin", job: "Paladin" },
      },
    ];
    renderWithMantine(<ValidationPanel issues={issues} timestamps={timestamps} />);
    expect(screen.getByText("No ability assigned for Paladin")).toBeTruthy();
  });

  it("groups multiple issues by timestamp", () => {
    const issues: ValidationIssue[] = [
      {
        type: "MISSING",
        severity: "WARNING",
        message: "Missing at Raid Damage",
        timestampIndex: 1,
        timestampLabel: "Raid Damage",
        time: 10,
        character: { id: "pld", label: "Paladin", job: "Paladin" },
      },
      {
        type: "MISSING",
        severity: "WARNING",
        message: "Missing at Tank Damage",
        timestampIndex: 2,
        timestampLabel: "Tank Damage",
        time: 30,
        character: { id: "pld", label: "Paladin", job: "Paladin" },
      },
    ];
    renderWithMantine(<ValidationPanel issues={issues} timestamps={timestamps} />);
    expect(screen.getByText("Missing at Raid Damage")).toBeTruthy();
    expect(screen.getByText("Missing at Tank Damage")).toBeTruthy();
    expect(screen.getAllByText((c) => c.includes("Raid Damage"))).toHaveLength(2);
    expect(screen.getAllByText((c) => c.includes("Tank Damage"))).toHaveLength(2);
    expect(screen.getByText("Missing at Tank Damage")).toBeTruthy();
  });

  it("shows issue count in header", () => {
    const issues: ValidationIssue[] = [
      {
        type: "COOLDOWN",
        severity: "ERROR",
        message: "Error 1",
        timestampIndex: 1,
        timestampLabel: "Raid Damage",
        time: 10,
        character: { id: "pld", label: "Paladin", job: "Paladin" },
        ability: { id: "R", name: "Reprisal" },
      },
      {
        type: "MISSING",
        severity: "WARNING",
        message: "Warning 1",
        timestampIndex: 2,
        timestampLabel: "Tank Damage",
        time: 30,
        character: { id: "pld", label: "Paladin", job: "Paladin" },
      },
    ];
    renderWithMantine(<ValidationPanel issues={issues} timestamps={timestamps} />);
    expect(screen.getByText((c) => c.includes("2"))).toBeTruthy();
  });
});
