import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import { FightSelector } from "@/components/plan/fight-selector";
import type { TimestampEntry } from "@/types";

function renderWithMantine(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }) => <MantineProvider>{children}</MantineProvider>,
  });
}

function makeFight(id: string, name: string, patch: string, tier: string) {
  return {
    id,
    slug: id,
    name,
    patch,
    bossName: name,
    expansion: "Dawntrail",
    tier,
    timestamps: [{ time: 0, label: "Pull", type: "OTHER" } as TimestampEntry],
  };
}

const fights = [
  makeFight("m1s", "M1S - Black Cat", "7.05", "AAC Light-heavyweight"),
  makeFight("m2s", "M2S - Honey B. Lovely", "7.05", "AAC Light-heavyweight"),
  makeFight("m5s", "M5S - Dancing Green", "7.2", "AAC Cruiserweight"),
];

describe("FightSelector", () => {
  it("renders with placeholder when no fight selected", () => {
    const onSelect = vi.fn();
    renderWithMantine(<FightSelector fights={fights} selected={null} onSelect={onSelect} />);

    expect(screen.getByText("Select Encounter")).toBeTruthy();
    const input = screen.getByRole("combobox");
    expect(input).toHaveAttribute("placeholder", "Choose a fight...");
  });

  it("shows selected fight metadata", () => {
    const onSelect = vi.fn();
    renderWithMantine(<FightSelector fights={fights} selected={fights[0]} onSelect={onSelect} />);

    expect(screen.getByText(/AAC Light-heavyweight/)).toBeTruthy();
    expect(screen.getByText(/1 mechanics/)).toBeTruthy();
  });

  it("calls onSelect when a fight is chosen", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderWithMantine(<FightSelector fights={fights} selected={null} onSelect={onSelect} />);

    const trigger = screen.getByRole("combobox");
    await user.click(trigger);

    const option = screen.getByText("M2S - Honey B. Lovely (7.05)");
    await user.click(option);

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "m2s", name: "M2S - Honey B. Lovely" }),
    );
  });

  it("renders all fights in the dropdown", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderWithMantine(<FightSelector fights={fights} selected={null} onSelect={onSelect} />);

    const trigger = screen.getByRole("combobox");
    await user.click(trigger);

    expect(screen.getByText("M1S - Black Cat (7.05)")).toBeTruthy();
    expect(screen.getByText("M5S - Dancing Green (7.2)")).toBeTruthy();
  });
});
