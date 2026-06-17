"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  Text,
} from "@mantine/core";
import { Trash2, Plus } from "lucide-react";

type Fight = {
  id: string;
  slug: string;
  name: string;
  patch: string;
  bossName: string;
  expansion: string;
  tier: string;
  timestamps: Array<{ time: number; label: string; type: string }>;
};

export default function EditFightPage() {
  const params = useParams();
  const router = useRouter();
  const [fight, setFight] = useState<Fight | null>(null);
  const [timestamps, setTimestamps] = useState<
    Array<{ time: number; label: string; type: string }>
  >([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const id = params.id as string;
    if (!id) return;
    fetch(`/api/fights/${id}`)
      .then((r) => r.json())
      .then((data: Fight) => {
        setFight(data);
        setTimestamps(data.timestamps);
      })
      .catch(console.error);
  }, [params.id]);

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

  const handleSave = async () => {
    if (!fight) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/fights/${fight.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fight, timestamps }),
      });
      if (!res.ok) throw new Error("Failed to update");
      router.push("/admin");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!fight || !confirm("Delete this fight?")) return;
    await fetch(`/api/admin/fights/${fight.id}`, { method: "DELETE" });
    router.push("/admin");
  };

  if (!fight) return <Text c="dimmed">Loading...</Text>;

  return (
    <Stack gap="xl" maw={800}>
      <Title order={1}>Edit Fight: {fight.name}</Title>

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

      <Group>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
        <Button color="red" onClick={handleDelete}>
          Delete Fight
        </Button>
      </Group>
    </Stack>
  );
}
