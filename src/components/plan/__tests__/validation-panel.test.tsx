import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ValidationPanel } from "@/components/plan/validation-panel";
import type { ValidationIssue, TimestampEntry } from "@/types";

const timestamps: TimestampEntry[] = [
  { time: 0, label: "Pull", type: "OTHER" },
  { time: 10, label: "Raidwide", type: "RAIDWIDE" },
  { time: 30, label: "Tankbuster", type: "TANKBUSTER" },
];

describe("ValidationPanel", () => {
  it("shows empty state when no issues", () => {
    render(<ValidationPanel issues={[]} timestamps={timestamps} />);
    expect(screen.getByText("No validation issues found.")).toBeTruthy();
  });

  it("shows error issues with XCircle icon", () => {
    const issues: ValidationIssue[] = [
      {
        type: "COOLDOWN",
        severity: "ERROR",
        message: "Rampart is on cooldown",
        timestampIndex: 1,
        timestampLabel: "Raidwide",
        time: 10,
        character: { id: "pld", label: "Paladin", job: "Paladin" },
        ability: { id: "Rampart", name: "Rampart" },
      },
    ];
    render(<ValidationPanel issues={issues} timestamps={timestamps} />);
    expect(screen.getByText("Rampart is on cooldown")).toBeTruthy();
  });

  it("shows warning issues with Info icon", () => {
    const issues: ValidationIssue[] = [
      {
        type: "MISSING",
        severity: "WARNING",
        message: "No ability assigned for Paladin",
        timestampIndex: 1,
        timestampLabel: "Raidwide",
        time: 10,
        character: { id: "pld", label: "Paladin", job: "Paladin" },
      },
    ];
    render(<ValidationPanel issues={issues} timestamps={timestamps} />);
    expect(screen.getByText("No ability assigned for Paladin")).toBeTruthy();
  });

  it("groups multiple issues by timestamp", () => {
    const issues: ValidationIssue[] = [
      {
        type: "MISSING",
        severity: "WARNING",
        message: "Missing at Raidwide",
        timestampIndex: 1,
        timestampLabel: "Raidwide",
        time: 10,
        character: { id: "pld", label: "Paladin", job: "Paladin" },
      },
      {
        type: "MISSING",
        severity: "WARNING",
        message: "Missing at Tankbuster",
        timestampIndex: 2,
        timestampLabel: "Tankbuster",
        time: 30,
        character: { id: "pld", label: "Paladin", job: "Paladin" },
      },
    ];
    render(<ValidationPanel issues={issues} timestamps={timestamps} />);
    expect(screen.getByText("Missing at Raidwide")).toBeTruthy();
    expect(screen.getByText("Missing at Tankbuster")).toBeTruthy();
    expect(screen.getAllByText((c) => c.includes("Raidwide"))).toHaveLength(2);
    expect(screen.getAllByText((c) => c.includes("Tankbuster"))).toHaveLength(2);
    expect(screen.getByText("Missing at Tankbuster")).toBeTruthy();
  });

  it("shows issue count in header", () => {
    const issues: ValidationIssue[] = [
      {
        type: "COOLDOWN",
        severity: "ERROR",
        message: "Error 1",
        timestampIndex: 1,
        timestampLabel: "Raidwide",
        time: 10,
        character: { id: "pld", label: "Paladin", job: "Paladin" },
        ability: { id: "R", name: "Reprisal" },
      },
      {
        type: "MISSING",
        severity: "WARNING",
        message: "Warning 1",
        timestampIndex: 2,
        timestampLabel: "Tankbuster",
        time: 30,
        character: { id: "pld", label: "Paladin", job: "Paladin" },
      },
    ];
    render(<ValidationPanel issues={issues} timestamps={timestamps} />);
    expect(screen.getByText((c) => c.includes("2"))).toBeTruthy();
  });
});
