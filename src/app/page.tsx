"use client";

import Link from "next/link";
import { Shield, Sword, Users, Clock } from "lucide-react";
import { Button, Text, Card, Group, Stack, SimpleGrid, Title, Container } from "@mantine/core";

export default function Home() {
  return (
    <Container size="xl" py="xl">
      <Stack align="center" gap="xl" py="xl">
        <Shield size={48} />
        <Title order={1} ta="center">
          FFXIV Mitigation Planner
        </Title>
        <Text size="lg" c="dimmed" maw={600} ta="center">
          Plan and optimize your raid party&apos;s mitigation and healing cooldowns across any
          encounter. Assign abilities, validate cooldowns, and share plans with your static.
        </Text>
        <Group>
          <Button size="md" component={Link} href="/plan/new">
            Create a Plan
          </Button>
          <Button size="md" variant="outline" component={Link} href="/plan">
            Browse Plans
          </Button>
        </Group>
      </Stack>

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg" mt="xl">
        <Card withBorder>
          <Card.Section p="md">
            <Stack gap="md">
              <Sword size={32} />
              <Title order={3} size="h4">
                Job Abilities
              </Title>
              <Text c="dimmed" size="sm">
                All 21 jobs with their role-appropriate mitigation, shielding, healing, and personal
                cooldowns.
              </Text>
            </Stack>
          </Card.Section>
        </Card>
        <Card withBorder>
          <Card.Section p="md">
            <Stack gap="md">
              <Clock size={32} />
              <Title order={3} size="h4">
                Cooldown Validation
              </Title>
              <Text c="dimmed" size="sm">
                Real-time validation catches double-taps, shared slot collisions, and missing
                assignments.
              </Text>
            </Stack>
          </Card.Section>
        </Card>
        <Card withBorder>
          <Card.Section p="md">
            <Stack gap="md">
              <Users size={32} />
              <Title order={3} size="h4">
                Share & Fork
              </Title>
              <Text c="dimmed" size="sm">
                Share read-only plans with your party or fork existing plans to create your own
                version.
              </Text>
            </Stack>
          </Card.Section>
        </Card>
      </SimpleGrid>
    </Container>
  );
}
