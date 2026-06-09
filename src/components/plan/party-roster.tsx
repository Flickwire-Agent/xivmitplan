"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, UserPlus } from "lucide-react";

type Ability = {
  id: string;
  name: string;
  cooldown: number;
  duration: number | null;
  category: string;
  sharedSlot: string | null;
};

type Job = {
  id: string;
  name: string;
  role: string;
  abilities: Ability[];
};

type Character = {
  id: string;
  jobId: string;
  jobName: string;
  label: string;
  slotIndex: number;
  abilities: Ability[];
  events: Array<{ id: string; timestampIndex: number; abilityId: string; note: string | null }>;
};

interface PartyRosterProps {
  characters: Character[];
  onAdd: (jobId: string, jobName: string, abilities: Ability[]) => void;
  onRemove: (id: string) => void;
  onChangeJob: (charId: string, jobId: string, jobName: string, abilities: Ability[]) => void;
}

const roleColors: Record<string, string> = {
  TANK: "bg-blue-100 text-blue-800",
  HEALER: "bg-green-100 text-green-800",
  MELEE: "bg-red-100 text-red-800",
  RANGED: "bg-yellow-100 text-yellow-800",
  CASTER: "bg-purple-100 text-purple-800",
};

export function PartyRoster({ characters, onAdd, onRemove, onChangeJob }: PartyRosterProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedJob, setSelectedJob] = useState<string>("");

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then(setJobs)
      .catch(console.error);
  }, []);

  const roles = Array.from(new Set(jobs.map((j) => j.role)));
  const filteredJobs = selectedRole
    ? jobs.filter((j) => j.role === selectedRole)
    : jobs;

  const handleAdd = () => {
    if (!selectedJob) return;
    const job = jobs.find((j) => j.id === selectedJob);
    if (job) {
      onAdd(job.id, job.name, job.abilities);
      setSelectedJob("");
    }
  };

  const roleLabel = (role: string) => {
    const labels: Record<string, string> = {
      TANK: "Tank", HEALER: "Healer", MELEE: "Melee", RANGED: "Ranged", CASTER: "Caster",
    };
    return labels[role] ?? role;
  };

  if (characters.length >= 8) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserPlus className="h-5 w-5" />
          Party Roster ({characters.length}/8)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {characters.map((char) => {
            const job = jobs.find((j) => j.id === char.jobId);
            const role = job?.role ?? "";
            return (
              <div
                key={char.id}
                className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm"
              >
                <Badge className={roleColors[role] ?? ""} variant="secondary">
                  {roleLabel(role)}
                </Badge>
                <Select
                  value={char.jobId}
                  onValueChange={(newJobId) => {
                    if (newJobId === null) return;
                    const newJob = jobs.find((j) => j.id === newJobId);
                    if (newJob) {
                      onChangeJob(char.id, newJob.id, newJob.name, newJob.abilities);
                    }
                  }}
                >
                  <SelectTrigger className="h-7 border-0 p-0 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs.map((j) => (
                      <SelectItem key={j.id} value={j.id}>
                        {j.name} ({j.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  onClick={() => onRemove(char.id)}
                  className="ml-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>

        {characters.length < 8 && (
          <div className="flex gap-2">
            <Select value={selectedRole} onValueChange={(v) => v !== null && setSelectedRole(v)}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r} value={r}>{roleLabel(r)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedJob} onValueChange={(v) => v !== null && setSelectedJob(v)}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a job..." />
              </SelectTrigger>
              <SelectContent>
                {filteredJobs.map((j) => (
                  <SelectItem key={j.id} value={j.id}>
                    {j.name} ({j.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAdd} disabled={!selectedJob} size="sm">
              Add
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
