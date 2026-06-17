"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Button,
  Card,
  Group,
  Text,
  Stack,
  SimpleGrid,
  Title,
  Container,
  Skeleton,
} from "@mantine/core";
import { Plus } from "lucide-react";

type PlanSummary = {
  id: string;
  title: string | null;
  shareId: string | null;
  createdAt: string;
  fight: { name: string };
  characters: Array<{ job: { name: string } }>;
};

function PlanCardSkeleton() {
  return (
    <Card withBorder>
      <Skeleton height={24} width="66%" mb="md" />
      <Stack gap="xs">
        <Skeleton height={16} width="50%" />
        <Skeleton height={12} width="33%" />
      </Stack>
    </Card>
  );
}

export default function PlansPage() {
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/plans")
      .then((r) => r.json())
      .then((data) => {
        setPlans(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <Container size="xl" py="lg">
      <Stack gap="xl">
        <Group justify="space-between">
          <Title order={1}>Plans</Title>
          <Button component={Link} href="/plan/new">
            <Plus size={16} style={{ marginRight: 8 }} /> New Plan
          </Button>
        </Group>

        {loading ? (
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {[...Array(4)].map((_, i) => (
              <PlanCardSkeleton key={i} />
            ))}
          </SimpleGrid>
        ) : plans.length === 0 ? (
          <Card withBorder>
            <Card.Section p="xl" ta="center" c="dimmed">
              No plans yet. Create your first one!
            </Card.Section>
          </Card>
        ) : (
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                withBorder
                component={Link}
                href={`/plan/${plan.id}`}
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "var(--mantine-shadow-md)")}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
              >
                <Card.Section p="md">
                  <Stack gap="xs">
                    <Title order={3} size="h4">
                      {plan.title ?? "Untitled Plan"}
                    </Title>
                    <Text size="sm" c="dimmed">
                      {plan.fight.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {plan.characters.length} characters &middot;{" "}
                      {new Date(plan.createdAt).toLocaleDateString()}
                    </Text>
                  </Stack>
                </Card.Section>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Container>
  );
}
