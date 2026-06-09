import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth0 } from "@/lib/auth0";

export async function GET() {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { auth0Id: session.user.sub },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const totalPlans = await prisma.plan.count();
    const totalUsers = await prisma.user.count();
    const anonymousPlans = await prisma.plan.count({ where: { userId: null } });
    const plansToday = await prisma.plan.count({
      where: {
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    });

    const plansPerFight = await prisma.plan.groupBy({
      by: ["fightId"],
      _count: true,
    });

    const plansPerDay = await prisma.plan.groupBy({
      by: ["createdAt"],
      _count: true,
    });

    return NextResponse.json({
      totalPlans,
      totalUsers,
      anonymousPlans,
      plansToday,
      plansPerFight,
      plansPerDay,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
