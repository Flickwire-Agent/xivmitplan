"use client";

import { useEffect, useState } from "react";
import { Button, Badge, Avatar, Card, Group, Stack, Text, Title, Table } from "@mantine/core";

type AdminUser = {
  id: string;
  auth0Id: string | null;
  email: string | null;
  displayName: string | null;
  role: string;
  bannedAt: string | null;
  createdAt: string;
  _count: { plans: number };
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleRole = async (user: AdminUser) => {
    const newRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    fetchUsers();
  };

  const toggleBan = async (user: AdminUser) => {
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bannedAt: user.bannedAt ? null : new Date().toISOString() }),
    });
    fetchUsers();
  };

  if (loading) return <Text c="dimmed">Loading users...</Text>;

  return (
    <Stack gap="xl">
      <Title order={1}>Users</Title>

      <Card withBorder p={0}>
        <Table.ScrollContainer minWidth={600}>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>User</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Role</Table.Th>
                <Table.Th>Plans</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {users.map((user) => (
                <Table.Tr key={user.id}>
                  <Table.Td>
                    <Group gap="sm">
                      <Avatar size="sm" radius="xl">
                        {(user.displayName ?? "?")[0].toUpperCase()}
                      </Avatar>
                      <Text>{user.displayName ?? "Anonymous"}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td c="dimmed">{user.email ?? "—"}</Table.Td>
                  <Table.Td>
                    <Badge color={user.role === "ADMIN" ? "blue" : "gray"}>{user.role}</Badge>
                  </Table.Td>
                  <Table.Td>{user._count.plans}</Table.Td>
                  <Table.Td>
                    <Badge color={user.bannedAt ? "red" : "green"}>
                      {user.bannedAt ? "Banned" : "Active"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group justify="flex-end">
                      <Button variant="outline" size="xs" onClick={() => toggleRole(user)}>
                        {user.role === "ADMIN" ? "Demote" : "Promote"}
                      </Button>
                      <Button variant="outline" size="xs" onClick={() => toggleBan(user)}>
                        {user.bannedAt ? "Unban" : "Ban"}
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Card>
    </Stack>
  );
}
