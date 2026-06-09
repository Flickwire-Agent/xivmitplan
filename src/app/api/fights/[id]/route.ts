import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const fight = await prisma.fight.findUnique({
      where: { id },
    });
    if (!fight) {
      return NextResponse.json({ error: "Fight not found" }, { status: 404 });
    }
    return NextResponse.json(fight);
  } catch {
    return NextResponse.json({ error: "Failed to fetch fight" }, { status: 500 });
  }
}
