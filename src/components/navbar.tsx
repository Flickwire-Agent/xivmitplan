"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

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
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Shield className="h-5 w-5 text-primary" />
          <span>xivmitplan</span>
        </Link>
        <nav className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" render={<Link href="/plan/new" />}>
            New Plan
          </Button>
          {loading ? null : user ? (
            <>
              <Link
                href="/auth/logout"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Avatar size="sm">
                  {user.picture && <AvatarImage src={user.picture} alt={user.name} />}
                  <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline">{user.name}</span>
                <LogOut className="h-4 w-4" />
              </Link>
            </>
          ) : (
            <Button variant="ghost" size="sm" render={<a href="/auth/login" />}>
              Sign In
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
