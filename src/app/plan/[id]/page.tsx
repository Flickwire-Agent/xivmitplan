"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Button,
  Group,
  Title,
  Container,
  Stack,
  SimpleGrid,
  Text,
  Modal,
  TextInput,
  ActionIcon,
} from "@mantine/core";
import { PartyRoster } from "@/components/plan/party-roster";
import { TimelineGrid } from "@/components/plan/timeline-grid";
import { ValidationPanel } from "@/components/plan/validation-panel";
import { validatePlan } from "@/lib/cooldown-validator";
import { Share2, Copy, Check } from "lucide-react";
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

export default function EditPlanPage() {
  const params = useParams();
  const [plan, setPlan] = useState<PlanWithRelations | null>(null);
  const [characters, setCharacters] = useState<PlanCharacter[]>([]);
  const [selectedFight, setSelectedFight] = useState<FightData | null>(null);
  const [validation, setValidation] = useState<ValidationIssue[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState("");

  useEffect(() => {
    const id = params.id as string;
    if (!id) return;
    fetch(`/api/plans/${id}`)
      .then((r) => r.json())
      .then((data: PlanWithRelations) => {
        setPlan(data);
        setSelectedFight({ ...data.fight, timestamps: data.fight.timestamps as TimestampEntry[] });
        const fightTimestamps = data.fight.timestamps as TimestampEntry[];
        setCharacters(
          data.characters.map((c) => ({
            id: c.id,
            jobId: c.jobId,
            jobName: c.job.name,
            label: c.label ?? c.job.name,
            slotIndex: c.slotIndex,
            iconUrl: c.job.iconUrl,
            abilities: c.job.abilities.map((a) => ({
              id: a.id,
              name: a.name,
              cooldown: a.cooldown,
              duration: a.duration,
              category: a.category,
              sharedSlot: a.sharedSlot,
              iconUrl: a.iconUrl,
            })),
            events: c.events.map((e) => ({
              id: e.id,
              timestampIndex: e.timestampIndex,
              time:
                e.time === 0 && e.timestampIndex > 0
                  ? (fightTimestamps[e.timestampIndex]?.time ?? 0)
                  : e.time,
              abilityId: e.abilityId,
              note: e.note,
            })),
          })),
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  useEffect(() => {
    if (plan && characters.length > 0) {
      const timer = setTimeout(() => {
        const fakePlan = {
          ...plan,
          characters: characters.map((c) => ({
            id: c.id,
            planId: plan.id,
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
        } as unknown as PlanWithRelations;
        setValidation(validatePlan(fakePlan));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [characters, plan]);

  const addCharacter = (
    jobId: string,
    jobName: string,
    abilities: PlanCharacter["abilities"],
    iconUrl?: string | null,
  ) => {
    if (characters.length >= 8) return;
    setCharacters([
      ...characters,
      {
        id: crypto.randomUUID(),
        jobId,
        jobName,
        label: jobName,
        slotIndex: characters.length,
        abilities,
        events: [],
        iconUrl,
      },
    ]);
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

  const timestamps = selectedFight?.timestamps ?? [];

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

  const sharePlan = async () => {
    if (!plan) return;
    setSharing(true);
    setShareError("");
    try {
      const res = await fetch(`/api/plans/${plan.id}/share`, { method: "PUT" });
      if (res.status === 401) {
        setShareError("Sign in required to share plans");
        setShareDialogOpen(true);
        return;
      }
      if (!res.ok) throw new Error("Failed to share");
      const updated = await res.json();
      setPlan({ ...plan, shareId: updated.shareId });
      setShareUrl(`${window.location.origin}/s/${updated.shareId}`);
      setShareDialogOpen(true);
    } catch (err) {
      console.error(err);
      setShareError("Failed to share plan");
      setShareDialogOpen(true);
    } finally {
      setSharing(false);
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const savePlan = async () => {
    if (!plan) return;
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
        title: plan.title,
        fightId: plan.fightId,
        characters: characters.map((c) => ({
          id: c.id,
          jobId: c.jobId,
          label: c.label,
          slotIndex: c.slotIndex,
        })),
        events: allEvents,
      };

      const res = await fetch(`/api/plans/${plan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to save");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Text ta="center" c="dimmed" py="xl">
        Loading plan...
      </Text>
    );
  }

  if (!plan) {
    return (
      <Text ta="center" c="dimmed" py="xl">
        Plan not found
      </Text>
    );
  }

  return (
    <Container size="xl" py="lg">
      <Stack gap="xl">
        <Group justify="space-between">
          <Title order={1}>{plan.title ?? "Edit Plan"}</Title>
          <Group>
            <Button variant="outline" onClick={sharePlan} disabled={sharing}>
              <Share2 size={16} style={{ marginRight: 4 }} />
              {sharing ? "Sharing..." : "Share"}
            </Button>
            <Button onClick={savePlan} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </Group>
        </Group>

        <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="xl">
          <Stack gap="xl" style={{ gridColumn: "span 2" }}>
            <Text size="sm" c="dimmed">
              {selectedFight?.name} &middot; {selectedFight?.tier}
            </Text>

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
          </Stack>

          <Stack gap="xl">
            {validation.length > 0 && (
              <ValidationPanel issues={validation} timestamps={timestamps} />
            )}
          </Stack>
        </SimpleGrid>

        <Modal
          opened={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
          title={shareError ? "Share Failed" : "Share Plan"}
        >
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              {shareError ? shareError : "Anyone with this link can view your mitigation plan."}
            </Text>
            {!shareError && shareUrl && (
              <Group>
                <TextInput
                  readOnly
                  value={shareUrl}
                  flex={1}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <ActionIcon variant="outline" onClick={copyShareLink}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </ActionIcon>
              </Group>
            )}
          </Stack>
        </Modal>
      </Stack>
    </Container>
  );
}
