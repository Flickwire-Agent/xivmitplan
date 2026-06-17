import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const plan = await prisma.plan.findUnique({
      where: { id },
      include: {
        fight: true,
        characters: {
          include: {
            job: { include: { abilities: true } },
            events: { include: { ability: true } },
          },
          orderBy: { slotIndex: "asc" },
        },
        events: { include: { ability: true } },
      },
    });
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }
    return NextResponse.json(plan);
  } catch {
    return NextResponse.json({ error: "Failed to fetch plan" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const events = body.events || [];

    await prisma.planCharacter.deleteMany({ where: { planId: id } });
    await prisma.planEvent.deleteMany({ where: { planId: id } });

    const plan = await prisma.plan.update({
      where: { id },
      data: {
        title: body.title,
        fightId: body.fightId,
        characters: {
          create: (body.characters || []).map(
            (
              char: { id?: string; jobId: string; label?: string; slotIndex: number },
              i: number,
            ) => ({
              id: char.id,
              jobId: char.jobId,
              label: char.label || null,
              slotIndex: char.slotIndex ?? i,
              events: {
                create: events
                  .filter((ev: { planCharacterId?: string }) => ev.planCharacterId === char.id)
                  .map(
                    (ev: {
                      timestampIndex: number;
                      time?: number;
                      abilityId: string;
                      note?: string;
                    }) => ({
                      timestampIndex: ev.timestampIndex,
                      time: ev.time ?? 0,
                      abilityId: ev.abilityId,
                      note: ev.note || null,
                    }),
                  ),
              },
            }),
          ),
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

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Update plan error:", error);
    return NextResponse.json({ error: "Failed to update plan" }, { status: 500 });
  }
}
