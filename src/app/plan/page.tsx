"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

type PlanSummary = {
  id: string;
  title: string | null;
  shareId: string | null;
  createdAt: string;
  fight: { name: string };
  characters: Array<{ job: { name: string } }>;
};

export default function PlansPage() {
  const [plans, setPlans] = useState<PlanSummary[]>([]);

  useEffect(() => {
    fetch("/api/plans")
      .then((r) => r.json())
      .then(setPlans)
      .catch(console.error);
  }, []);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Plans</h1>
        <Button render={<Link href="/plan/new" />}>
          <Plus className="h-4 w-4" /> New Plan
        </Button>
      </div>

      {plans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No plans yet. Create your first one!
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan) => (
            <Link key={plan.id} href={`/plan/${plan.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">{plan.title ?? "Untitled Plan"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{plan.fight.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {plan.characters.length} characters &middot;{" "}
                    {new Date(plan.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
