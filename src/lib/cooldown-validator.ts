import type { PlanWithRelations, ValidationIssue, TimestampEntry } from "@/types";

export function validatePlan(plan: PlanWithRelations): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const timestamps = plan.fight.timestamps as TimestampEntry[];
  const lastUsedMap = new Map<string, number>();

  const characters = plan.characters.sort((a, b) => a.slotIndex - b.slotIndex);

  for (const character of characters) {
    const events = character.events.sort(
      (a, b) => getEventTime(a, timestamps) - getEventTime(b, timestamps),
    );

    for (const event of events) {
      const ts = timestamps[event.timestampIndex];
      if (!ts) continue;

      const currentTime = getEventTime(event, timestamps);
      const ability = event.ability;
      const lastUsed = lastUsedMap.get(character.id) ?? -Infinity;

      if (currentTime - lastUsed < ability.cooldown && ability.cooldown > 0) {
        issues.push({
          type: "COOLDOWN",
          severity: "ERROR",
          message: `${ability.name} is on cooldown (${ability.cooldown}s, only ${currentTime - lastUsed}s since last use)`,
          timestampIndex: event.timestampIndex,
          timestampLabel: ts.label,
          time: currentTime,
          character: {
            id: character.id,
            label: character.label ?? character.job.name,
            job: character.job.name,
          },
          ability: { id: ability.id, name: ability.name },
        });
      }

      lastUsedMap.set(character.id, currentTime);
    }
  }

  // Check shared slot collisions
  const sharedSlotGroups = new Map<
    string,
    Array<{
      timestampIndex: number;
      time: number;
      character: { id: string; label: string; job: string };
      ability: { id: string; name: string };
    }>
  >();

  for (const character of characters) {
    for (const event of character.events) {
      const ability = event.ability;
      if (!ability.sharedSlot) continue;

      const currentTime = getEventTime(event, timestamps);
      const key = `${currentTime}-${ability.sharedSlot}`;
      if (!sharedSlotGroups.has(key)) {
        sharedSlotGroups.set(key, []);
      }
      sharedSlotGroups.get(key)!.push({
        timestampIndex: event.timestampIndex,
        time: currentTime,
        character: {
          id: character.id,
          label: character.label ?? character.job.name,
          job: character.job.name,
        },
        ability: { id: ability.id, name: ability.name },
      });
    }
  }

  for (const conflicting of sharedSlotGroups.values()) {
    if (conflicting.length > 1) {
      const timestampIndex = conflicting[0].timestampIndex;
      const ts = timestamps[timestampIndex];
      if (!ts) continue;

      issues.push({
        type: "SHARED_SLOT",
        severity: "ERROR",
        message: `Multiple ${conflicting[0].ability.name} abilities assigned at the same time (${conflicting.map((c) => c.character.label).join(", ")})`,
        timestampIndex,
        timestampLabel: ts.label,
        time: conflicting[0].time,
        conflicting: conflicting.map((c) => ({
          character: c.character.label,
          ability: c.ability.name,
        })),
      });
    }
  }

  return issues;
}

function getEventTime(
  event: { timestampIndex: number; time?: number | null },
  timestamps: TimestampEntry[],
) {
  if (event.time && event.time > 0) return event.time;
  return timestamps[event.timestampIndex]?.time ?? event.time ?? 0;
}
