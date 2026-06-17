"use client";

import { Select, Text } from "@mantine/core";
import type { TimestampEntry } from "@/types";

type Fight = {
  id: string;
  slug: string;
  name: string;
  patch: string;
  bossName: string;
  expansion: string;
  tier: string;
  timestamps: TimestampEntry[];
};

interface FightSelectorProps {
  fights: Fight[];
  selected: Fight | null;
  onSelect: (fight: Fight) => void;
}

export function FightSelector({ fights, selected, onSelect }: FightSelectorProps) {
  return (
    <div>
      <Select
        label="Select Encounter"
        placeholder="Choose a fight..."
        value={selected?.id ?? null}
        onChange={(id) => {
          if (id) {
            const fight = fights.find((f) => f.id === id);
            if (fight) onSelect(fight);
          }
        }}
        data={fights.map((fight) => ({
          value: fight.id,
          label: `${fight.name} (${fight.patch})`,
        }))}
      />
      {selected && (
        <Text mt="xs" size="xs" c="dimmed">
          {selected.tier} &middot; {selected.expansion} &middot; {selected.timestamps.length}{" "}
          mechanics
        </Text>
      )}
    </div>
  );
}
