"use client";

import { useEffect, useState } from "react";
import { Card, Stack, Text, Title, SimpleGrid } from "@mantine/core";
import { BarChart } from "@mantine/charts";

type Stats = {
  totalPlans: number;
  totalUsers: number;
  anonymousPlans: number;
  plansToday: number;
  plansPerFight: Array<{ fightId: string; _count: number }>;
  plansPerDay: Array<{ createdAt: string; _count: number }>;
};

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [fights, setFights] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/fights")
      .then((r) => r.json())
      .then((data: Array<{ id: string; name: string }>) => {
        const map: Record<string, string> = {};
        data.forEach((f) => {
          map[f.id] = f.name;
        });
        setFights(map);
      });

    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  if (!stats) {
    return <Text c="dimmed">Loading stats...</Text>;
  }

  const fightChartData = stats.plansPerFight.map((pf) => ({
    name: fights[pf.fightId] ?? pf.fightId.slice(0, 8),
    plans: pf._count,
  }));

  return (
    <Stack gap="xl">
      <Title order={1}>Dashboard</Title>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
        <Card withBorder>
          <Stack gap="xs">
            <Text size="sm" c="dimmed">
              Total Plans
            </Text>
            <Text size="xl" fw={700}>
              {stats.totalPlans}
            </Text>
          </Stack>
        </Card>
        <Card withBorder>
          <Stack gap="xs">
            <Text size="sm" c="dimmed">
              Total Users
            </Text>
            <Text size="xl" fw={700}>
              {stats.totalUsers}
            </Text>
          </Stack>
        </Card>
        <Card withBorder>
          <Stack gap="xs">
            <Text size="sm" c="dimmed">
              Anonymous Plans
            </Text>
            <Text size="xl" fw={700}>
              {stats.anonymousPlans}
            </Text>
          </Stack>
        </Card>
        <Card withBorder>
          <Stack gap="xs">
            <Text size="sm" c="dimmed">
              Plans Today
            </Text>
            <Text size="xl" fw={700}>
              {stats.plansToday}
            </Text>
          </Stack>
        </Card>
      </SimpleGrid>

      <Card withBorder>
        <Card.Section withBorder inheritPadding py="xs">
          <Title order={3} size="h4">
            Plans per Fight
          </Title>
        </Card.Section>
        <Card.Section p="md" style={{ height: 288 }}>
          <BarChart
            data={fightChartData}
            dataKey="name"
            series={[{ name: "plans", color: "blue.6" }]}
            gridAxis="xy"
            withLegend={false}
            h={240}
          />
        </Card.Section>
      </Card>
    </Stack>
  );
}
