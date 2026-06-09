"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FightSelector } from "@/components/plan/fight-selector";
import { PartyRoster } from "@/components/plan/party-roster";
import { TimelineGrid } from "@/components/plan/timeline-grid";
import { ValidationPanel } from "@/components/plan/validation-panel";
import { validatePlan } from "@/lib/cooldown-validator";
import type { PlanWithRelations, ValidationIssue, TimestampEntry } from "@/types";

type PlanCharacter = {
  id: string;
  jobId: string;
  jobName: string;
  label: string;
  slotIndex: number;
  iconUrl?: string | null;
  abilities: Array<{ id: string; name: string; cooldown: number; duration: number | null; category: string; sharedSlot: string | null; iconUrl?: string | null }>;
  events: Array<{ id: string; timestampIndex: number; abilityId: string; note: string | null }>;
};

type FightData = {
  id: string;
  slug: string;
  name: string;
  patch: string;
  bossName: string;
  expansion: string;
  tier: string;
  timestamps: TimestampEntry[];
};

export default function NewPlanPage() {
  const router = useRouter();
  const [fights, setFights] = useState<FightData[]>([]);
  const [selectedFight, setSelectedFight] = useState<FightData | null>(null);
  const [characters, setCharacters] = useState<PlanCharacter[]>([]);
  const [validation, setValidation] = useState<ValidationIssue[]>([]);
  const [saving, setSaving] = useState(false);
  const [planId, setPlanId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/fights")
      .then((r) => r.json())
      .then(setFights)
      .catch(console.error);
  }, []);

  const runValidation = useCallback(() => {
    const fakePlan = {
      id: planId ?? "new",
      title: null,
      shareId: null,
      fightId: selectedFight?.id ?? "",
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      fight: selectedFight!,
      characters: characters.map((c) => ({
        id: c.id,
        planId: planId ?? "new",
        jobId: c.jobId,
        label: c.label,
        slotIndex: c.slotIndex,
        job: { id: c.jobId, name: c.jobName, role: "TANK" as any, iconUrl: c.iconUrl ?? null, abilities: c.abilities.map(a => ({ id: a.id, name: a.name, cooldown: a.cooldown, duration: a.duration, description: null, jobId: c.jobId, role: null, category: a.category as any, sharedSlot: a.sharedSlot as any, iconUrl: a.iconUrl ?? null, createdAt: new Date() })) },
        events: c.events.map((e) => ({
          id: e.id,
          planCharacterId: c.id,
          planId: null,
          timestampIndex: e.timestampIndex,
          abilityId: e.abilityId,
          note: e.note,
          ability: c.abilities.find((a) => a.id === e.abilityId) ?? {
            id: e.abilityId,
            name: e.abilityId,
            cooldown: 0,
            duration: null,
            description: null,
            jobId: null,
            role: null,
            category: "PERSONAL" as any,
            sharedSlot: null,
            iconUrl: null,
            createdAt: new Date(),
          },
        })),
      })),
      events: [],
    } as unknown as PlanWithRelations;
    setValidation(validatePlan(fakePlan));
  }, [characters, selectedFight, planId]);

  useEffect(() => {
    if (selectedFight && characters.length > 0) {
      const timer = setTimeout(runValidation, 300);
      return () => clearTimeout(timer);
    }
  }, [characters, selectedFight, runValidation]);

  const addCharacter = (jobId: string, jobName: string, abilities: PlanCharacter["abilities"], iconUrl?: string | null) => {
    if (characters.length >= 8) return;
    const newChar: PlanCharacter = {
      id: crypto.randomUUID(),
      jobId,
      jobName,
      label: jobName,
      slotIndex: characters.length,
      abilities,
      events: [],
      iconUrl,
    };
    setCharacters([...characters, newChar]);
  };

  const removeCharacter = (id: string) => {
    setCharacters(characters.filter((c) => c.id !== id));
  };

  const updateCharacterJob = (charId: string, jobId: string, jobName: string, abilities: PlanCharacter["abilities"], iconUrl?: string | null) => {
    setCharacters(characters.map((c) =>
      c.id === charId ? { ...c, jobId, jobName, label: jobName, abilities, events: [], iconUrl } : c
    ));
  };

  const assignAbility = (charId: string, timestampIndex: number, abilityId: string) => {
    setCharacters(characters.map((c) => {
      if (c.id !== charId) return c;
      const existing = c.events.find((e) => e.timestampIndex === timestampIndex);
      const newEvents = existing
        ? c.events.map((e) => e.timestampIndex === timestampIndex ? { ...e, abilityId } : e)
        : [...c.events, { id: crypto.randomUUID(), timestampIndex, abilityId, note: null }];
      return { ...c, events: newEvents };
    }));
  };

  const removeAbility = (charId: string, timestampIndex: number) => {
    setCharacters(characters.map((c) =>
      c.id === charId
        ? { ...c, events: c.events.filter((e) => e.timestampIndex !== timestampIndex) }
        : c
    ));
  };

  const moveAbility = (sourceCharId: string, sourceTimestampIndex: number, targetCharId: string, targetTimestampIndex: number, abilityId: string) => {
    setCharacters(characters.map((c) => {
      if (c.id === sourceCharId && c.id === targetCharId) {
        const filtered = c.events.filter((e) => e.timestampIndex !== sourceTimestampIndex);
        const existing = filtered.find((e) => e.timestampIndex === targetTimestampIndex);
        const newEvents = existing
          ? filtered.map((e) => e.timestampIndex === targetTimestampIndex ? { ...e, abilityId } : e)
          : [...filtered, { id: crypto.randomUUID(), timestampIndex: targetTimestampIndex, abilityId, note: null }];
        return { ...c, events: newEvents };
      }
      if (c.id === sourceCharId) {
        return { ...c, events: c.events.filter((e) => e.timestampIndex !== sourceTimestampIndex) };
      }
      if (c.id === targetCharId) {
        const existing = c.events.find((e) => e.timestampIndex === targetTimestampIndex);
        const newEvents = existing
          ? c.events.map((e) => e.timestampIndex === targetTimestampIndex ? { ...e, abilityId } : e)
          : [...c.events, { id: crypto.randomUUID(), timestampIndex: targetTimestampIndex, abilityId, note: null }];
        return { ...c, events: newEvents };
      }
      return c;
    }));
  };

  const savePlan = async () => {
    setSaving(true);
    try {
      const allEvents = characters.flatMap((c) =>
        c.events.map((e) => ({
          planCharacterId: c.id,
          timestampIndex: e.timestampIndex,
          abilityId: e.abilityId,
          note: e.note,
        }))
      );

      const body = {
        title: `${selectedFight?.name ?? "Untitled"} Plan`,
        fightId: selectedFight?.id,
        characters: characters.map((c) => ({
          jobId: c.jobId,
          label: c.label,
          slotIndex: c.slotIndex,
        })),
        events: allEvents,
      };

      const method = planId ? "PUT" : "POST";
      const url = planId ? `/api/plans/${planId}` : "/api/plans";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to save");
      const plan = await res.json();
      setPlanId(plan.id);
      router.push(`/plan/${plan.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const timestamps = selectedFight?.timestamps ?? [];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Create Mitigation Plan</h1>
        <div className="flex gap-2">
          <Button onClick={savePlan} disabled={saving || !selectedFight}>
            {saving ? "Saving..." : "Save Plan"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <FightSelector
            fights={fights}
            selected={selectedFight}
            onSelect={setSelectedFight}
          />

          {selectedFight && (
            <>
              <PartyRoster
                characters={characters}
                onAdd={addCharacter}
                onRemove={removeCharacter}
                onChangeJob={updateCharacterJob}
              />

              {characters.length > 0 && (
                <TimelineGrid
                  characters={characters}
                  timestamps={timestamps}
                  validation={validation}
                  onAssign={assignAbility}
                  onRemove={removeAbility}
                  onMoveAbility={moveAbility}
                />
              )}
            </>
          )}
        </div>

        <div className="space-y-6">
          {validation.length > 0 && (
            <ValidationPanel issues={validation} timestamps={timestamps} />
          )}
        </div>
      </div>
    </div>
  );
}
