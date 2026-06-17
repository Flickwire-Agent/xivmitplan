import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Shield, BarChart3, Users, Sword } from "lucide-react";
import { cn } from "@/lib/utils";
import { auth0Server as auth0 } from "@/lib/auth0-server";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Admin - xivmitplan",
};

const navItems = [
  { href: "/admin", label: "Stats", icon: BarChart3 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/fights/new", label: "New Fight", icon: Sword },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth0.getSession();
  if (!session?.user) {
    redirect("/auth/login");
  }

  const user = await prisma.user.findUnique({
    where: { auth0Id: session.user.sub },
  });

  if (!user || user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r bg-muted/30 p-4 hidden md:block">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-semibold">Admin Panel</span>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted transition-colors",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
