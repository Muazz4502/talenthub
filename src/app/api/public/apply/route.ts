import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { candidates, jobs, pipelineStages } from "@/db/schema";
import { eq } from "drizzle-orm";

// Public endpoint — candidates apply via careers page
export async function POST(request: NextRequest) {
  const body = await request.json() as {
    jobId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    resumeUrl?: string;
    linkedinUrl?: string;
    answers?: Record<string, string>;
  };

  const { jobId, firstName, lastName, email, phone, resumeUrl, linkedinUrl, answers } = body;

  if (!jobId || !firstName || !lastName || !email?.includes("@")) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Verify job is open
  const job = await db.query.jobs.findFirst({
    where: eq(jobs.id, jobId),
    columns: { id: true, status: true },
  });

  if (!job || job.status !== "OPEN") {
    return NextResponse.json({ error: "Job is not accepting applications" }, { status: 400 });
  }

  const firstStage = await db.query.pipelineStages.findFirst({
    where: eq(pipelineStages.jobId, jobId),
    orderBy: (s, { asc }) => [asc(s.order)],
  });

  try {
    const [candidate] = await db
      .insert(candidates)
      .values({
        jobId,
        stageId: firstStage?.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim(),
        resumeUrl: resumeUrl?.trim(),
        linkedinUrl: linkedinUrl?.trim(),
        source: "WEBSITE",
        tags: [],
        applicationAnswers: answers ?? {},
      })
      .returning({ id: candidates.id });

    return NextResponse.json({ data: { candidateId: candidate.id } }, { status: 201 });
  } catch (err: any) {
    if (err.message?.includes("unique") || err.code === "23505") {
      return NextResponse.json(
        { error: "An application with this email already exists for this job." },
        { status: 409 }
      );
    }
    throw err;
  }
}
