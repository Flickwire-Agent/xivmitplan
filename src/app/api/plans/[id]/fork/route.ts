import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const original = await prisma.plan.findUnique({
      where: { id },
      include: {
        fight: true,
        characters: { include: { events: { include: { ability: true } } } },
        events: { include: { ability: true } },
      },
    });

    if (!original) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const forked = await prisma.plan.create({
      data: {
        title: `${original.title ?? "Plan"} (forked)`,
        fightId: original.fightId,
        characters: {
          create: original.characters.map((char) => ({
            jobId: char.jobId,
            label: char.label,
            slotIndex: char.slotIndex,
            events: {
              create: char.events.map((ev) => ({
                timestampIndex: ev.timestampIndex,
                time: ev.time,
                abilityId: ev.abilityId,
                note: ev.note,
              })),
            },
          })),
        },
        events: {
          create: original.events.map((ev) => ({
            timestampIndex: ev.timestampIndex,
            time: ev.time,
            abilityId: ev.abilityId,
            note: ev.note,
          })),
        },
      },
      include: {
        fight: true,
        characters: {
          include: {
            job: { include: { abilities: true } },
            events: { include: { ability: true } },
          },
        },
        events: { include: { ability: true } },
      },
    });

    return NextResponse.json(forked, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to fork plan" }, { status: 500 });
  }
}
