import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { candidates, pipelineStages, candidateStageHistory } from "@/db/schema";
import { eq } from "drizzle-orm";

interface BulkCandidate {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  source?: string;
  resumeUrl?: string;
  linkedinUrl?: string;
  tags?: string[];
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "RECRUITER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { jobId, candidates: bulkCandidates } = await request.json() as {
    jobId: string;
    candidates: BulkCandidate[];
  };

  if (!jobId || !Array.isArray(bulkCandidates)) {
    return NextResponse.json({ error: "jobId and candidates array required" }, { status: 400 });
  }

  // Get first stage (Lead)
  const firstStage = await db.query.pipelineStages.findFirst({
    where: eq(pipelineStages.jobId, jobId),
    orderBy: (s, { asc }) => [asc(s.order)],
  });

  let success = 0;
  const failed: { row: number; error: string }[] = [];

  for (let i = 0; i < bulkCandidates.length; i++) {
    const c = bulkCandidates[i];

    try {
      if (!c.firstName?.trim()) throw new Error("firstName is required");
      if (!c.lastName?.trim()) throw new Error("lastName is required");
      if (!c.email?.includes("@")) throw new Error("Valid email is required");

      const [inserted] = await db
        .insert(candidates)
        .values({
          jobId,
          stageId: firstStage?.id,
          firstName: c.firstName.trim(),
          lastName: c.lastName.trim(),
          email: c.email.trim().toLowerCase(),
          phone: c.phone?.trim(),
          source: (c.source as any) ?? "BULK_UPLOAD",
          resumeUrl: c.resumeUrl?.trim(),
          linkedinUrl: c.linkedinUrl?.trim(),
          tags: c.tags ?? [],
        })
        .returning();

      if (firstStage) {
        await db.insert(candidateStageHistory).values({
          candidateId: inserted.id,
          toStageId: firstStage.id,
          actorId: session.user.id,
          note: "Bulk upload",
        });
      }

      success++;
    } catch (e: any) {
      failed.push({ row: i + 1, error: e.message });
    }
  }

  return NextResponse.json({ success, failed: failed.length, errors: failed });
}
