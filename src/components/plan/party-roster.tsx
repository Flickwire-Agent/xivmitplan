"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Select,
  Card,
  Badge,
  Group,
  Text,
  Stack,
  ActionIcon,
  Image,
  Flex,
} from "@mantine/core";
import { X, UserPlus } from "lucide-react";

type Ability = {
  id: string;
  name: string;
  cooldown: number;
  duration: number | null;
  category: string;
  sharedSlot: string | null;
  iconUrl?: string | null;
};

type Job = {
  id: string;
  name: string;
  role: string;
  iconUrl?: string | null;
  abilities: Ability[];
};

type Character = {
  id: string;
  jobId: string;
  jobName: string;
  label: string;
  slotIndex: number;
  abilities: Ability[];
  events: Array<{
    id: string;
    timestampIndex: number;
    time: number;
    abilityId: string;
    note: string | null;
  }>;
};

interface PartyRosterProps {
  characters: Character[];
  onAdd: (jobId: string, jobName: string, abilities: Ability[], iconUrl?: string | null) => void;
  onRemove: (id: string) => void;
  onChangeJob: (
    charId: string,
    jobId: string,
    jobName: string,
    abilities: Ability[],
    iconUrl?: string | null,
  ) => void;
}

const roleColors: Record<string, string> = {
  TANK: "blue",
  HEALER: "green",
  MELEE: "red",
  RANGED: "yellow",
  CASTER: "violet",
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
  const filteredJobs = selectedRole ? jobs.filter((j) => j.role === selectedRole) : jobs;

  const handleAdd = () => {
    if (!selectedJob) return;
    const job = jobs.find((j) => j.id === selectedJob);
    if (job) {
      onAdd(job.id, job.name, job.abilities, job.iconUrl);
      setSelectedJob("");
    }
  };

  const roleLabel = (role: string) => {
    const labels: Record<string, string> = {
      TANK: "Tank",
      HEALER: "Healer",
      MELEE: "Melee",
      RANGED: "Ranged",
      CASTER: "Caster",
    };
    return labels[role] ?? role;
  };

  return (
    <Card withBorder>
      <Card.Section withBorder inheritPadding py="xs">
        <Group>
          <UserPlus size={20} />
          <Text fw={500} size="lg">
            Party Roster ({characters.length}/8)
          </Text>
        </Group>
      </Card.Section>

      <Card.Section inheritPadding mt="md">
        <Stack gap="md">
          <Group wrap="wrap">
            {characters.map((char) => {
              const job = jobs.find((j) => j.id === char.jobId);
              const role = job?.role ?? "";
              return (
                <Group
                  key={char.id}
                  gap="xs"
                  p="xs"
                  style={{
                    border: "1px solid var(--mantine-color-gray-3)",
                    borderRadius: "var(--mantine-radius-sm)",
                  }}
                >
                  <Badge color={roleColors[role]} variant="light">
                    {roleLabel(role)}
                  </Badge>
                  {job?.iconUrl && (
                    <Image src={job.iconUrl} alt={job.name} h={20} w={20} fit="contain" />
                  )}
                  <Select
                    value={char.jobId}
                    onChange={(newJobId) => {
                      if (!newJobId) return;
                      const newJob = jobs.find((j) => j.id === newJobId);
                      if (newJob) {
                        onChangeJob(
                          char.id,
                          newJob.id,
                          newJob.name,
                          newJob.abilities,
                          newJob.iconUrl,
                        );
                      }
                    }}
                    data={jobs.map((j) => ({
                      value: j.id,
                      label: `${j.name} (${j.id})`,
                    }))}
                    comboboxProps={{ withinPortal: true }}
                    size="xs"
                    w={120}
                  />
                  <ActionIcon variant="subtle" color="gray" onClick={() => onRemove(char.id)}>
                    <X size={14} />
                  </ActionIcon>
                </Group>
              );
            })}
          </Group>

          {characters.length < 8 ? (
            <Flex gap="sm">
              <Select
                value={selectedRole}
                onChange={(v) => v && setSelectedRole(v)}
                placeholder="Role"
                data={roles.map((r) => ({ value: r, label: roleLabel(r) }))}
                w={120}
              />
              <Select
                value={selectedJob}
                onChange={(v) => v && setSelectedJob(v)}
                placeholder="Select a job..."
                data={filteredJobs.map((j) => ({
                  value: j.id,
                  label: `${j.name} (${j.id})`,
                }))}
                flex={1}
              />
              <Button onClick={handleAdd} disabled={!selectedJob} size="xs">
                Add
              </Button>
            </Flex>
          ) : (
            <Text size="sm" c="dimmed" ta="center" py="sm">
              Party is full (8/8)
            </Text>
          )}
        </Stack>
      </Card.Section>
    </Card>
  );
}
