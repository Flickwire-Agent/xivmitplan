import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { ensureUserInDb } from "@/lib/user-sync";
import { AdminShell } from "@/components/admin-shell";

export const metadata: Metadata = {
  title: "Admin - xivmitplan",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth0.getSession();
  if (!session?.user) {
    redirect("/auth/login");
  }

  const user = await ensureUserInDb();

  if (!user || user.role !== "ADMIN") {
    redirect("/");
  }

  return <AdminShell>{children}</AdminShell>;
}
