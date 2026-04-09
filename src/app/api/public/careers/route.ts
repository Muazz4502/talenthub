import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jobs, applicationFormConfigs } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// Public endpoint — no auth required
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (slug) {
    // Single job by applicationUrl slug
    const job = await db.query.jobs.findFirst({
      where: and(eq(jobs.applicationUrl, slug), eq(jobs.status, "OPEN")),
      with: {
        formConfig: true,
        stages: { orderBy: (s, { asc }) => [asc(s.order)] },
      },
    });

    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    return NextResponse.json({ data: job });
  }

  // List open jobs
  const openJobs = await db.query.jobs.findMany({
    where: eq(jobs.status, "OPEN"),
    orderBy: (j, { desc }) => [desc(j.createdAt)],
    columns: {
      id: true,
      title: true,
      department: true,
      locationType: true,
      location: true,
      applicationUrl: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ data: openJobs });
}
