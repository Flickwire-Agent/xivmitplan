"use client";

import Link from "next/link";
import { Shield, BarChart3, Users, Sword } from "lucide-react";
import { AppShell, Group, Text, Anchor, Stack } from "@mantine/core";

const navItems = [
  { href: "/admin", label: "Stats", icon: BarChart3 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/fights/new", label: "New Fight", icon: Sword },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell navbar={{ width: 220, breakpoint: "sm" }} padding="md">
      <AppShell.Navbar p="md">
        <Group mb="xl">
          <Shield size={20} />
          <Text fw={600}>Admin Panel</Text>
        </Group>
        <Stack gap={4}>
          {navItems.map((item) => (
            <Anchor
              key={item.href}
              component={Link}
              href={item.href}
              underline="never"
              c="inherit"
              px="xs"
              py={8}
              style={{ borderRadius: "var(--mantine-radius-sm)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--mantine-color-gray-1)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <Group gap="xs">
                <item.icon size={16} />
                <Text size="sm">{item.label}</Text>
              </Group>
            </Anchor>
          ))}
        </Stack>
      </AppShell.Navbar>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
