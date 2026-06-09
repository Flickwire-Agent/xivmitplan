"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatTime } from "@/lib/utils";
import { Shield, Copy } from "lucide-react";
import type { PlanWithRelations, TimestampEntry } from "@/types";

const categoryColors: Record<string, string> = {
  MITIGATION: "bg-blue-500",
  HEALING: "bg-green-500",
  SHIELD: "bg-yellow-500",
  INVULN: "bg-red-500",
  PERSONAL: "bg-gray-500",
};

const eventTypeColors: Record<string, string> = {
  RAIDWIDE: "bg-orange-100 text-orange-800 border-orange-300",
  TANKBUSTER: "bg-red-100 text-red-800 border-red-300",
  STACK: "bg-blue-100 text-blue-800 border-blue-300",
  SPREAD: "bg-purple-100 text-purple-800 border-purple-300",
  KNOCKBACK: "bg-yellow-100 text-yellow-800 border-yellow-300",
  ADD_PHASE: "bg-gray-100 text-gray-800 border-gray-300",
  ENRAGE: "bg-rose-100 text-rose-800 border-rose-300",
  OTHER: "bg-zinc-100 text-zinc-800 border-zinc-300",
};

export default function SharedPlanPage() {
  const params = useParams();
  const [plan, setPlan] = useState<PlanWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const shareId = params.shareId as string;
    if (!shareId) return;
    fetch(`/api/plans/${shareId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data: PlanWithRelations) => {
        setPlan(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.shareId]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground">Loading plan...</div>;
  }

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <Shield className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Plan Not Found</h1>
        <p className="text-muted-foreground">
          This share link may have expired or the plan was deleted.
        </p>
        <Button render={<Link href="/plan/new" />}>
          Create Your Own Plan
        </Button>
      </div>
    );
  }

  const timestamps = plan.fight.timestamps as TimestampEntry[];
  const characters = plan.characters.sort((a, b) => a.slotIndex - b.slotIndex);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{plan.title ?? "Shared Plan"}</h1>
          <p className="text-sm text-muted-foreground">
            {plan.fight.name} &middot; {plan.fight.tier}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyLink}>
            <Copy className="h-4 w-4 mr-1" />
            {copied ? "Copied!" : "Copy Link"}
          </Button>
          <Button size="sm" render={<Link href={`/plan/${plan.id}`} />}>
            Fork this Plan
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Party</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {characters.map((char) => (
              <Badge key={char.id} variant="secondary">
                {char.label ?? char.job.name} ({char.job.id})
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="sticky left-0 z-10 bg-muted/50 px-3 py-2 text-left font-medium min-w-[140px]">
                Character
              </th>
              {timestamps.map((ts, i) => (
                <th key={i} className="px-2 py-2 text-center font-medium min-w-[100px]">
                  <div className="text-xs text-muted-foreground">
                    {formatTime(ts.time)}
                  </div>
                  <div className="text-xs leading-tight">{ts.label}</div>
                  <Badge
                    variant="outline"
                    className={`mt-1 text-[10px] px-1 py-0 ${eventTypeColors[ts.type] ?? eventTypeColors.OTHER}`}
                  >
                    {ts.type}
                  </Badge>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {characters.map((char) => (
              <tr key={char.id} className="border-b last:border-0">
                <td className="sticky left-0 z-10 bg-background px-3 py-2 font-medium">
                  <div className="flex flex-col">
                    <span>{char.label ?? char.job.name}</span>
                    <span className="text-xs text-muted-foreground">{char.job.name}</span>
                  </div>
                </td>
                {timestamps.map((_ts, i) => {
                  const event = char.events.find((e) => e.timestampIndex === i);
                  const ability = event
                    ? char.job.abilities.find((a) => a.id === event.abilityId)
                    : null;
                  return (
                    <td
                      key={i}
                      className={`px-2 py-2 text-center border-l ${
                        ability
                          ? "bg-green-50"
                          : "bg-gray-50"
                      }`}
                    >
                      {ability && (
                        <span className="flex items-center justify-center gap-1">
                          <span
                            className={`inline-block w-2 h-2 rounded-full ${
                              categoryColors[ability.category] ?? "bg-gray-500"
                            }`}
                          />
                          <span className="text-xs">{ability.name}</span>
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
