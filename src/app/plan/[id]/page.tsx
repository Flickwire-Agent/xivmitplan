"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PartyRoster } from "@/components/plan/party-roster";
import { TimelineGrid } from "@/components/plan/timeline-grid";
import { ValidationPanel } from "@/components/plan/validation-panel";
import { validatePlan } from "@/lib/cooldown-validator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Share2, Copy, Check } from "lucide-react";
import type { PlanWithRelations, ValidationIssue, TimestampEntry } from "@/types";

type PlanCharacter = {
  id: string;
  jobId: string;
  jobName: string;
  label: string;
  slotIndex: number;
  abilities: Array<{ id: string; name: string; cooldown: number; duration: number | null; category: string; sharedSlot: string | null }>;
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

export default function EditPlanPage() {
  const params = useParams();
  const router = useRouter();
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
        setCharacters(
          data.characters.map((c) => ({
            id: c.id,
            jobId: c.jobId,
            jobName: c.job.name,
            label: c.label ?? c.job.name,
            slotIndex: c.slotIndex,
            abilities: c.job.abilities.map((a) => ({
              id: a.id,
              name: a.name,
              cooldown: a.cooldown,
              duration: a.duration,
              category: a.category,
              sharedSlot: a.sharedSlot,
            })),
            events: c.events.map((e) => ({
              id: e.id,
              timestampIndex: e.timestampIndex,
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
              iconUrl: null,
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
                createdAt: new Date(),
              })),
            },
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

  const addCharacter = (jobId: string, jobName: string, abilities: PlanCharacter["abilities"]) => {
    if (characters.length >= 8) return;
    setCharacters([...characters, {
      id: crypto.randomUUID(), jobId, jobName, label: jobName,
      slotIndex: characters.length, abilities, events: [],
    }]);
  };

  const removeCharacter = (id: string) => {
    setCharacters(characters.filter((c) => c.id !== id));
  };

  const updateCharacterJob = (charId: string, jobId: string, jobName: string, abilities: PlanCharacter["abilities"]) => {
    setCharacters(characters.map((c) =>
      c.id === charId ? { ...c, jobId, jobName, label: jobName, abilities, events: [] } : c
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
          abilityId: e.abilityId,
          note: e.note,
        }))
      );

      const body = {
        title: plan.title,
        fightId: plan.fightId,
        characters: characters.map((c) => ({
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
    return <div className="p-6 text-center text-muted-foreground">Loading plan...</div>;
  }

  if (!plan) {
    return <div className="p-6 text-center text-muted-foreground">Plan not found</div>;
  }

  const timestamps = selectedFight?.timestamps ?? [];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{plan.title ?? "Edit Plan"}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={sharePlan} disabled={sharing}>
            <Share2 className="h-4 w-4 mr-1" />
            {sharing ? "Sharing..." : "Share"}
          </Button>
          <Button onClick={savePlan} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="text-sm text-muted-foreground">
            {selectedFight?.name} &middot; {selectedFight?.tier}
          </div>

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
            />
          )}
        </div>

        <div className="space-y-6">
          {validation.length > 0 && (
            <ValidationPanel issues={validation} timestamps={timestamps} />
          )}
        </div>
      </div>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{shareError ? "Share Failed" : "Share Plan"}</DialogTitle>
            <DialogDescription>
              {shareError
                ? shareError
                : "Anyone with this link can view your mitigation plan."}
            </DialogDescription>
          </DialogHeader>
          {!shareError && shareUrl && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 rounded-md border px-3 py-2 text-sm"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button size="sm" variant="outline" onClick={copyShareLink}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
