import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth0 } from "@/lib/auth0";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { auth0Id: session.user.sub },
    });

    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const fight = await prisma.fight.update({
      where: { id },
      data: {
        slug: body.slug,
        name: body.name,
        patch: body.patch,
        bossName: body.bossName,
        expansion: body.expansion,
        tier: body.tier,
        timestamps: body.timestamps,
      },
    });

    return NextResponse.json(fight);
  } catch {
    return NextResponse.json({ error: "Failed to update fight" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { auth0Id: session.user.sub },
    });

    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.fight.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete fight" }, { status: 500 });
  }
}
