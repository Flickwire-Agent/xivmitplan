"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    <div className="space-y-2">
      <label className="text-sm font-medium">Select Encounter</label>
      <Select
        value={selected?.id ?? ""}
        onValueChange={(id) => {
          const fight = fights.find((f) => f.id === id);
          if (fight) onSelect(fight);
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Choose a fight..." />
        </SelectTrigger>
        <SelectContent>
          {fights.map((fight) => (
            <SelectItem key={fight.id} value={fight.id}>
              {fight.name} ({fight.patch})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selected && (
        <p className="text-xs text-muted-foreground">
          {selected.tier} &middot; {selected.expansion} &middot; {selected.timestamps.length} mechanics
        </p>
      )}
    </div>
  );
}
