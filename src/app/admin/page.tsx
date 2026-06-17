"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

type Stats = {
  totalPlans: number;
  totalUsers: number;
  anonymousPlans: number;
  plansToday: number;
  plansPerFight: Array<{ fightId: string; _count: number }>;
  plansPerDay: Array<{ createdAt: string; _count: number }>;
};

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [fights, setFights] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/fights")
      .then((r) => r.json())
      .then((data: Array<{ id: string; name: string }>) => {
        const map: Record<string, string> = {};
        data.forEach((f) => {
          map[f.id] = f.name;
        });
        setFights(map);
      });

    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  if (!stats) {
    return <div className="text-muted-foreground">Loading stats...</div>;
  }

  const fightChartData = stats.plansPerFight.map((pf) => ({
    name: fights[pf.fightId] ?? pf.fightId.slice(0, 8),
    plans: pf._count,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalPlans}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Anonymous Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.anonymousPlans}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Plans Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.plansToday}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Plans per Fight</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={fightChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="plans" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
