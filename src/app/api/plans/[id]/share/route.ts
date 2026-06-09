import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth0 } from "@/lib/auth0";
import { generateShareId } from "@/lib/utils";

export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const plan = await prisma.plan.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    if (plan.userId && plan.userId !== session.user.sub) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const shareId = generateShareId();

    const updated = await prisma.plan.update({
      where: { id },
      data: {
        shareId,
        userId: session.user.sub,
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to share plan" }, { status: 500 });
  }
}
