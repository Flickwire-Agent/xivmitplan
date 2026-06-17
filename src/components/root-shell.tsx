"use client";

import { AppShell } from "@mantine/core";
import { Navbar } from "@/components/navbar";

export function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell header={{ height: 56 }} padding="md">
      <Navbar />
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
