import type { Prisma } from "@prisma/client";

export type { RoleName, Role, Category, SharedSlot, EventType } from "@prisma/client";

export type FightWithTimestamps = Prisma.FightGetPayload<{}>;

export type JobWithAbilities = Prisma.JobGetPayload<{
  include: { abilities: true };
}>;

export type PlanWithRelations = Prisma.PlanGetPayload<{
  include: {
    fight: true;
    characters: {
      include: {
        job: { include: { abilities: true } };
        events: { include: { ability: true } };
      };
    };
    events: { include: { ability: true } };
  };
}>;

export type TimestampEntry = {
  time: number;
  label: string;
  type: string;
};

export type ValidationIssue = {
  type: "COOLDOWN" | "SHARED_SLOT" | "MISSING";
  severity: "ERROR" | "WARNING";
  message: string;
  timestampIndex: number;
  timestampLabel: string;
  time: number;
  character?: { id: string; label: string; job: string };
  ability?: { id: string; name: string };
  conflicting?: { character: string; ability: string }[];
};

export type PlanWithValidation = PlanWithRelations & {
  validation: ValidationIssue[];
};
