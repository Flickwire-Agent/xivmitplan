import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth0 } from "@/lib/auth0";

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      include: {
        fight: true,
        characters: { include: { job: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });
    return NextResponse.json(plans);
  } catch {
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth0.getSession();
    const body = await request.json();
    const events = body.events || [];

    const plan = await prisma.plan.create({
      data: {
        title: body.title,
        fightId: body.fightId,
        userId: session?.user?.sub || null,
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

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("Create plan error:", error);
    return NextResponse.json({ error: "Failed to create plan" }, { status: 500 });
  }
}
