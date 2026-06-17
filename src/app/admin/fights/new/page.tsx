"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  Group,
  Stack,
  Title,
  TextInput,
  Select,
  NumberInput,
  ActionIcon,
} from "@mantine/core";
import { Trash2, Plus } from "lucide-react";

export default function NewFightPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    slug: "",
    name: "",
    patch: "",
    bossName: "",
    expansion: "Dawntrail",
    tier: "",
  });
  const [timestamps, setTimestamps] = useState<
    Array<{ time: number; label: string; type: string }>
  >([{ time: 0, label: "Pull", type: "OTHER" }]);
  const [saving, setSaving] = useState(false);

  const addTimestamp = () => {
    const lastTime = timestamps.length > 0 ? timestamps[timestamps.length - 1].time + 30 : 0;
    setTimestamps([...timestamps, { time: lastTime, label: "", type: "RAID_DAMAGE" }]);
  };

  const removeTimestamp = (index: number) => {
    setTimestamps(timestamps.filter((_, i) => i !== index));
  };

  const updateTimestamp = (index: number, field: string, value: string | number) => {
    setTimestamps(timestamps.map((ts, i) => (i === index ? { ...ts, [field]: value } : ts)));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/fights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, timestamps }),
      });
      if (!res.ok) throw new Error("Failed to create");
      router.push("/admin");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap="xl" maw={800}>
      <Title order={1}>New Fight</Title>

      <Card withBorder>
        <Card.Section withBorder inheritPadding py="xs">
          <Title order={3} size="h4">
            Details
          </Title>
        </Card.Section>
        <Card.Section inheritPadding py="md">
          <Stack gap="md">
            <Group grow>
              <TextInput
                label="Slug"
                placeholder="m5s"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.currentTarget.value })}
              />
              <TextInput
                label="Name"
                placeholder="M5S - Dancing Green"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.currentTarget.value })}
              />
            </Group>
            <Group grow>
              <TextInput
                label="Patch"
                placeholder="7.2"
                value={form.patch}
                onChange={(e) => setForm({ ...form, patch: e.currentTarget.value })}
              />
              <TextInput
                label="Boss Name"
                placeholder="Dancing Green"
                value={form.bossName}
                onChange={(e) => setForm({ ...form, bossName: e.currentTarget.value })}
              />
            </Group>
            <Group grow>
              <TextInput label="Expansion" value={form.expansion} readOnly />
              <TextInput
                label="Tier"
                placeholder="AAC Cruiserweight"
                value={form.tier}
                onChange={(e) => setForm({ ...form, tier: e.currentTarget.value })}
              />
            </Group>
          </Stack>
        </Card.Section>
      </Card>

      <Card withBorder>
        <Card.Section withBorder inheritPadding py="xs">
          <Group justify="space-between">
            <Title order={3} size="h4">
              Timestamps
            </Title>
            <Button onClick={addTimestamp} size="xs" variant="outline">
              <Plus size={14} style={{ marginRight: 4 }} /> Add
            </Button>
          </Group>
        </Card.Section>
        <Card.Section inheritPadding py="md">
          <Stack gap="xs">
            {timestamps.map((ts, i) => (
              <Group key={i} gap="xs">
                <NumberInput
                  w={100}
                  value={ts.time}
                  onChange={(v) => updateTimestamp(i, "time", typeof v === "number" ? v : 0)}
                />
                <TextInput
                  flex={1}
                  placeholder="Label"
                  value={ts.label}
                  onChange={(e) => updateTimestamp(i, "label", e.currentTarget.value)}
                />
                <Select
                  w={180}
                  value={ts.type}
                  onChange={(v) => v && updateTimestamp(i, "type", v)}
                  data={[
                    "RAID_DAMAGE",
                    "TANK_DAMAGE",
                    "POSITIONING_REQUIRED",
                    "AVOIDABLE_AOE",
                    "DEBUFFS",
                    "TARGETED_AOE",
                    "MECHANICS",
                    "OTHER",
                  ]}
                />
                <ActionIcon variant="subtle" color="red" onClick={() => removeTimestamp(i)}>
                  <Trash2 size={16} />
                </ActionIcon>
              </Group>
            ))}
          </Stack>
        </Card.Section>
      </Card>

      <Button onClick={handleSubmit} disabled={saving}>
        {saving ? "Creating..." : "Create Fight"}
      </Button>
    </Stack>
  );
}
