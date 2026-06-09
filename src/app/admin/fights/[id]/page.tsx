"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";

type Fight = {
  id: string;
  slug: string;
  name: string;
  patch: string;
  bossName: string;
  expansion: string;
  tier: string;
  timestamps: Array<{ time: number; label: string; type: string }>;
};

export default function EditFightPage() {
  const params = useParams();
  const router = useRouter();
  const [fight, setFight] = useState<Fight | null>(null);
  const [timestamps, setTimestamps] = useState<Array<{ time: number; label: string; type: string }>>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const id = params.id as string;
    if (!id) return;
    fetch(`/api/fights/${id}`)
      .then((r) => r.json())
      .then((data: Fight) => {
        setFight(data);
        setTimestamps(data.timestamps);
      })
      .catch(console.error);
  }, [params.id]);

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

  const handleSave = async () => {
    if (!fight) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/fights/${fight.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fight, timestamps }),
      });
      if (!res.ok) throw new Error("Failed to update");
      router.push("/admin");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!fight || !confirm("Delete this fight?")) return;
    await fetch(`/api/admin/fights/${fight.id}`, { method: "DELETE" });
    router.push("/admin");
  };

  if (!fight) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Edit Fight: {fight.name}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Timestamps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button onClick={addTimestamp} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
          {timestamps.map((ts, i) => (
            <div key={i} className="flex gap-2 items-center mt-2">
              <input
                type="number"
                className="w-20 rounded-md border px-2 py-1.5 text-sm"
                value={ts.time}
                onChange={(e) => updateTimestamp(i, "time", parseInt(e.target.value) || 0)}
              />
              <input
                className="flex-1 rounded-md border px-2 py-1.5 text-sm"
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

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
        <Button variant="destructive" onClick={handleDelete}>
          Delete Fight
        </Button>
      </div>
    </div>
  );
}
