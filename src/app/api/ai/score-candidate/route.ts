import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { candidates, jobs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { scoreCandidate } from "@/lib/ai";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { candidateId, jobId } = await request.json() as {
    candidateId: string;
    jobId: string;
  };

  if (!candidateId || !jobId) {
    return NextResponse.json({ error: "candidateId and jobId required" }, { status: 400 });
  }

  try {
    const [candidate, job] = await Promise.all([
      db.query.candidates.findFirst({ where: eq(candidates.id, candidateId) }),
      db.query.jobs.findFirst({ where: eq(jobs.id, jobId) }),
    ]);

    if (!candidate) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const parsed = candidate.aiParsedData as any;

    const result = await scoreCandidate(
      {
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        skills: parsed?.skills,
        experience: parsed?.experience,
        totalYearsExperience: parsed?.totalYearsExperience,
      },
      {
        title: job.title,
        description: job.description,
      }
    );

    await db
      .update(candidates)
      .set({
        aiScore: result.score,
        aiScoringData: result as any,
        updatedAt: new Date(),
      })
      .where(eq(candidates.id, candidateId));

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Scoring failed" }, { status: 500 });
  }
}
