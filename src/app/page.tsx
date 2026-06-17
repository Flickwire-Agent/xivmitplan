import Link from "next/link";
import { Shield, Sword, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      <section className="flex flex-col items-center gap-6 py-24 px-4 text-center">
        <Shield className="h-12 w-12 text-primary" />
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">FFXIV Mitigation Planner</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Plan and optimize your raid party&apos;s mitigation and healing cooldowns across any
          encounter. Assign abilities, validate cooldowns, and share plans with your static.
        </p>
        <div className="flex gap-4">
          <Button size="lg" render={<Link href="/plan/new" />}>
            Create a Plan
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/plan" />}>
            Browse Plans
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 w-full max-w-4xl px-4 pb-24 md:grid-cols-3">
        <Card>
          <CardHeader>
            <Sword className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="text-lg">Job Abilities</CardTitle>
            <CardDescription>
              All 21 jobs with their role-appropriate mitigation, shielding, healing, and personal
              cooldowns.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Clock className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="text-lg">Cooldown Validation</CardTitle>
            <CardDescription>
              Real-time validation catches double-taps, shared slot collisions, and missing
              assignments.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Users className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="text-lg">Share & Fork</CardTitle>
            <CardDescription>
              Share read-only plans with your party or fork existing plans to create your own
              version.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    </div>
  );
}
