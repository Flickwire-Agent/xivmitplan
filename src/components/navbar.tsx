"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield, LogOut } from "lucide-react";
import { AppShell, Group, Button, Text, Avatar, Anchor } from "@mantine/core";

type SessionUser = {
  sub: string;
  name: string;
  email: string;
  picture?: string;
};

export function Navbar() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <AppShell.Header>
      <Group h="100%" px="md" justify="space-between">
        <Group>
          <Anchor component={Link} href="/" underline="never" c="inherit">
            <Group gap="xs">
              <Shield size={20} />
              <Text fw={600}>xivmitplan</Text>
            </Group>
          </Anchor>
        </Group>
        <Group>
          <Button variant="subtle" size="compact-sm" component={Link} href="/plan/new">
            New Plan
          </Button>
          {loading ? null : user ? (
            <Anchor href="/auth/logout" underline="never" c="dimmed" fz="sm">
              <Group gap="xs">
                <Avatar size="sm" src={user.picture} radius="xl">
                  {user.name.charAt(0).toUpperCase()}
                </Avatar>
                <Text visibleFrom="sm">{user.name}</Text>
                <LogOut size={16} />
              </Group>
            </Anchor>
          ) : (
            <Button variant="subtle" size="compact-sm" component="a" href="/auth/login">
              Sign In
            </Button>
          )}
        </Group>
      </Group>
    </AppShell.Header>
  );
}
