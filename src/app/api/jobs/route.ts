import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { id: "asc" },
    });

    const allAbilities = await prisma.ability.findMany();

    const jobsWithRoleAbilities = jobs.map((job) => ({
      ...job,
      abilities: allAbilities.filter(
        (a) => a.jobId === job.id || (a.jobId === null && a.role === job.role),
      ),
    }));

    return NextResponse.json(jobsWithRoleAbilities);
  } catch {
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}
