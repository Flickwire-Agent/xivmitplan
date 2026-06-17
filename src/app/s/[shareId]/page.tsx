"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Button,
  Card,
  Group,
  Stack,
  Badge,
  Text,
  Title,
  Container,
  Table,
  Box,
} from "@mantine/core";
import { Shield, Copy } from "lucide-react";
import { formatTime } from "@/lib/utils";
import type { PlanWithRelations, TimestampEntry } from "@/types";

const categoryColors: Record<string, string> = {
  MITIGATION: "blue",
  HEALING: "green",
  SHIELD: "yellow",
  INVULN: "red",
  PERSONAL: "gray",
};

const eventTypeColors: Record<string, string> = {
  RAID_DAMAGE: "red",
  TANK_DAMAGE: "orange",
  POSITIONING_REQUIRED: "yellow",
  AVOIDABLE_AOE: "green",
  DEBUFFS: "cyan",
  TARGETED_AOE: "sky",
  MECHANICS: "violet",
  OTHER: "gray",
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
    return (
      <Text ta="center" c="dimmed" py="xl">
        Loading plan...
      </Text>
    );
  }

  if (!plan) {
    return (
      <Container size="xl" py="xl">
        <Stack align="center" gap="lg">
          <Shield size={48} />
          <Title order={1}>Plan Not Found</Title>
          <Text c="dimmed">This share link may have expired or the plan was deleted.</Text>
          <Button component={Link} href="/plan/new">
            Create Your Own Plan
          </Button>
        </Stack>
      </Container>
    );
  }

  const timestamps = plan.fight.timestamps as TimestampEntry[];
  const characters = plan.characters.sort((a, b) => a.slotIndex - b.slotIndex);

  return (
    <Container size="xl" py="lg">
      <Stack gap="xl">
        <Group justify="space-between">
          <Stack gap={2}>
            <Title order={1}>{plan.title ?? "Shared Plan"}</Title>
            <Text size="sm" c="dimmed">
              {plan.fight.name} &middot; {plan.fight.tier}
            </Text>
          </Stack>
          <Group>
            <Button variant="outline" size="xs" onClick={copyLink}>
              <Copy size={14} style={{ marginRight: 4 }} />
              {copied ? "Copied!" : "Copy Link"}
            </Button>
            <Button size="xs" component={Link} href={`/plan/${plan.id}`}>
              Fork this Plan
            </Button>
          </Group>
        </Group>

        <Card withBorder>
          <Card.Section withBorder inheritPadding py="xs">
            <Title order={3} size="h4">
              Party
            </Title>
          </Card.Section>
          <Card.Section inheritPadding py="md">
            <Group wrap="wrap">
              {characters.map((char) => (
                <Badge key={char.id} variant="light">
                  {char.label ?? char.job.name} ({char.job.id})
                </Badge>
              ))}
            </Group>
          </Card.Section>
        </Card>

        <div
          style={{
            overflowX: "auto",
            borderRadius: "var(--mantine-radius-md)",
            border: "1px solid var(--mantine-color-gray-3)",
          }}
        >
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ position: "sticky", left: 0, zIndex: 10, minWidth: 140 }}>
                  Character
                </Table.Th>
                {timestamps.map((ts, i) => (
                  <Table.Th key={i} style={{ textAlign: "center", minWidth: 100 }}>
                    <Stack gap={2}>
                      <Text size="xs" c="dimmed">
                        {formatTime(ts.time)}
                      </Text>
                      <Text size="xs">{ts.label}</Text>
                      <Badge
                        size="xs"
                        variant="outline"
                        color={eventTypeColors[ts.type] ?? eventTypeColors.OTHER}
                      >
                        {ts.type}
                      </Badge>
                    </Stack>
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {characters.map((char) => (
                <Table.Tr key={char.id}>
                  <Table.Td
                    style={{
                      position: "sticky",
                      left: 0,
                      zIndex: 10,
                      background: "var(--mantine-color-body)",
                    }}
                  >
                    <Stack gap={0}>
                      <Text fw={500}>{char.label ?? char.job.name}</Text>
                      <Text size="xs" c="dimmed">
                        {char.job.name}
                      </Text>
                    </Stack>
                  </Table.Td>
                  {timestamps.map((_ts, i) => {
                    const event = char.events.find((e) => e.timestampIndex === i);
                    const ability = event
                      ? char.job.abilities.find((a) => a.id === event.abilityId)
                      : null;
                    return (
                      <Table.Td
                        key={i}
                        style={{
                          textAlign: "center",
                          background: ability
                            ? "var(--mantine-color-green-0)"
                            : "var(--mantine-color-gray-0)",
                        }}
                      >
                        {ability && (
                          <Group justify="center" gap={4}>
                            <Box
                              style={{
                                display: "inline-block",
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                backgroundColor: categoryColors[ability.category] ?? "#9ca3af",
                              }}
                            />
                            <Text size="xs">{ability.name}</Text>
                          </Group>
                        )}
                      </Table.Td>
                    );
                  })}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      </Stack>
    </Container>
  );
}
