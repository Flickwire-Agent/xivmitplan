"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button, Group, Title, Container, Stack, SimpleGrid } from "@mantine/core";
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
  abilities: Array<{
    id: string;
    name: string;
    cooldown: number;
    duration: number | null;
    category: string;
    sharedSlot: string | null;
    iconUrl?: string | null;
  }>;
  events: Array<{
    id: string;
    timestampIndex: number;
    time: number;
    abilityId: string;
    note: string | null;
  }>;
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
        job: {
          id: c.jobId,
          name: c.jobName,
          role: "TANK" as any,
          iconUrl: c.iconUrl ?? null,
          abilities: c.abilities.map((a) => ({
            id: a.id,
            name: a.name,
            cooldown: a.cooldown,
            duration: a.duration,
            description: null,
            jobId: c.jobId,
            role: null,
            category: a.category as any,
            sharedSlot: a.sharedSlot as any,
            iconUrl: a.iconUrl ?? null,
            createdAt: new Date(),
          })),
        },
        events: c.events.map((e) => ({
          id: e.id,
          planCharacterId: c.id,
          planId: null,
          timestampIndex: e.timestampIndex,
          time: e.time,
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

  const addCharacter = (
    jobId: string,
    jobName: string,
    abilities: PlanCharacter["abilities"],
    iconUrl?: string | null,
  ) => {
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

  const updateCharacterJob = (
    charId: string,
    jobId: string,
    jobName: string,
    abilities: PlanCharacter["abilities"],
    iconUrl?: string | null,
  ) => {
    setCharacters(
      characters.map((c) =>
        c.id === charId
          ? { ...c, jobId, jobName, label: jobName, abilities, events: [], iconUrl }
          : c,
      ),
    );
  };

  const nearestTimestampIndex = (time: number) => {
    if (timestamps.length === 0) return 0;
    return timestamps.reduce(
      (nearest, ts, index) =>
        Math.abs(ts.time - time) < Math.abs(timestamps[nearest].time - time) ? index : nearest,
      0,
    );
  };

  const assignAbility = (charId: string, time: number, abilityId: string) => {
    const roundedTime = Math.max(0, Math.round(time));
    const timestampIndex = nearestTimestampIndex(roundedTime);
    setCharacters(
      characters.map((c) => {
        if (c.id !== charId) return c;
        const existing = c.events.find((e) => e.time === roundedTime);
        const newEvents = existing
          ? c.events.map((e) =>
              e.time === roundedTime ? { ...e, timestampIndex, time: roundedTime, abilityId } : e,
            )
          : [
              ...c.events,
              { id: crypto.randomUUID(), timestampIndex, time: roundedTime, abilityId, note: null },
            ];
        return { ...c, events: newEvents };
      }),
    );
  };

  const removeAbility = (charId: string, eventId: string) => {
    setCharacters(
      characters.map((c) =>
        c.id === charId ? { ...c, events: c.events.filter((e) => e.id !== eventId) } : c,
      ),
    );
  };

  const moveAbility = (
    sourceCharId: string,
    sourceEventId: string,
    targetCharId: string,
    targetTime: number,
    abilityId: string,
  ) => {
    const roundedTime = Math.max(0, Math.round(targetTime));
    const timestampIndex = nearestTimestampIndex(roundedTime);
    setCharacters(
      characters.map((c) => {
        if (c.id === sourceCharId && c.id === targetCharId) {
          const filtered = c.events.filter((e) => e.id !== sourceEventId);
          const existing = filtered.find((e) => e.time === roundedTime);
          const newEvents = existing
            ? filtered.map((e) =>
                e.time === roundedTime ? { ...e, timestampIndex, time: roundedTime, abilityId } : e,
              )
            : [
                ...filtered,
                {
                  id: sourceEventId,
                  timestampIndex,
                  time: roundedTime,
                  abilityId,
                  note: null,
                },
              ];
          return { ...c, events: newEvents };
        }
        if (c.id === sourceCharId) {
          return {
            ...c,
            events: c.events.filter((e) => e.id !== sourceEventId),
          };
        }
        if (c.id === targetCharId) {
          const existing = c.events.find((e) => e.time === roundedTime);
          const newEvents = existing
            ? c.events.map((e) =>
                e.time === roundedTime ? { ...e, timestampIndex, time: roundedTime, abilityId } : e,
              )
            : [
                ...c.events,
                {
                  id: sourceEventId,
                  timestampIndex,
                  time: roundedTime,
                  abilityId,
                  note: null,
                },
              ];
          return { ...c, events: newEvents };
        }
        return c;
      }),
    );
  };

  const savePlan = async () => {
    setSaving(true);
    try {
      const allEvents = characters.flatMap((c) =>
        c.events.map((e) => ({
          planCharacterId: c.id,
          timestampIndex: e.timestampIndex,
          time: e.time,
          abilityId: e.abilityId,
          note: e.note,
        })),
      );

      const body = {
        title: `${selectedFight?.name ?? "Untitled"} Plan`,
        fightId: selectedFight?.id,
        characters: characters.map((c) => ({
          id: c.id,
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
    <Container size="xl" py="lg">
      <Stack gap="xl">
        <Group justify="space-between">
          <Title order={1}>Create Mitigation Plan</Title>
          <Button onClick={savePlan} disabled={saving || !selectedFight}>
            {saving ? "Saving..." : "Save Plan"}
          </Button>
        </Group>

        <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="xl">
          <Stack gap="xl" style={{ gridColumn: "span 2" }}>
            <FightSelector fights={fights} selected={selectedFight} onSelect={setSelectedFight} />

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
          </Stack>

          <Stack gap="xl">
            {validation.length > 0 && (
              <ValidationPanel issues={validation} timestamps={timestamps} />
            )}
          </Stack>
        </SimpleGrid>
      </Stack>
    </Container>
  );
}
