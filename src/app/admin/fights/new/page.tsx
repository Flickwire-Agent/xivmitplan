"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";

export default function NewFightPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    slug: "",
    name: "",
    patch: "",
    bossName: "",
    expansion: "Dawntrail",
    tier: "",
  });
  const [timestamps, setTimestamps] = useState<Array<{ time: number; label: string; type: string }>>([
    { time: 0, label: "Pull", type: "OTHER" },
  ]);
  const [saving, setSaving] = useState(false);

  const addTimestamp = () => {
    const lastTime = timestamps.length > 0 ? timestamps[timestamps.length - 1].time + 30 : 0;
    setTimestamps([...timestamps, { time: lastTime, label: "", type: "RAIDWIDE" }]);
  };

  const removeTimestamp = (index: number) => {
    setTimestamps(timestamps.filter((_, i) => i !== index));
  };

  const updateTimestamp = (index: number, field: string, value: string | number) => {
    setTimestamps(timestamps.map((ts, i) =>
      i === index ? { ...ts, [field]: value } : ts
    ));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/fights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, timestamps }),
      });
      if (!res.ok) throw new Error("Failed to create");
      router.push("/admin");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">New Fight</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Slug</label>
              <input
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="m5s"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <input
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="M5S - Dancing Green"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Patch</label>
              <input
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="7.2"
                value={form.patch}
                onChange={(e) => setForm({ ...form, patch: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Boss Name</label>
              <input
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Dancing Green"
                value={form.bossName}
                onChange={(e) => setForm({ ...form, bossName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Expansion</label>
              <input
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={form.expansion}
                readOnly
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tier</label>
              <input
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="AAC Cruiserweight"
                value={form.tier}
                onChange={(e) => setForm({ ...form, tier: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Timestamps</CardTitle>
          <Button onClick={addTimestamp} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {timestamps.map((ts, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="number"
                className="w-20 rounded-md border px-2 py-1.5 text-sm"
                value={ts.time}
                onChange={(e) => updateTimestamp(i, "time", parseInt(e.target.value) || 0)}
              />
              <input
                className="flex-1 rounded-md border px-2 py-1.5 text-sm"
                placeholder="Label"
                value={ts.label}
                onChange={(e) => updateTimestamp(i, "label", e.target.value)}
              />
              <select
                className="rounded-md border px-2 py-1.5 text-sm"
                value={ts.type}
                onChange={(e) => updateTimestamp(i, "type", e.target.value)}
              >
                {["RAIDWIDE", "TANKBUSTER", "STACK", "SPREAD", "KNOCKBACK", "ADD_PHASE", "ENRAGE", "OTHER"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <button onClick={() => removeTimestamp(i)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button onClick={handleSubmit} disabled={saving}>
        {saving ? "Creating..." : "Create Fight"}
      </Button>
    </div>
  );
}
