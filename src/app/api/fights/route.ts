import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const fights = await prisma.fight.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(fights);
  } catch {
    return NextResponse.json({ error: "Failed to fetch fights" }, { status: 500 });
  }
}
