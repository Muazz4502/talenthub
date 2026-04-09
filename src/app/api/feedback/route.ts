import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { feedbacks, interviews, candidates, jobs } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const interviewId = searchParams.get("interviewId");
  const candidateId = searchParams.get("candidateId");

  const conditions: any[] = [];
  if (interviewId) conditions.push(eq(feedbacks.interviewId, interviewId));
  if (candidateId) conditions.push(eq(feedbacks.candidateId, candidateId));

  // Non-admins only see their own feedback
  if (!["ADMIN", "RECRUITER", "HIRING_MANAGER"].includes(session.user.role)) {
    conditions.push(eq(feedbacks.submittedById, session.user.id));
  }

  const list = await db.query.feedbacks.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [desc(feedbacks.createdAt)],
    with: {
      submittedBy: { columns: { name: true, image: true } },
      interview: { columns: { title: true, type: true } },
    },
  });

  return NextResponse.json({ data: list });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as {
    interviewId: string;
    candidateId: string;
    jobId: string;
    recommendation: string;
    overallScore?: number;
    fields: Record<string, any>;
    notes?: string;
  };

  const { interviewId, candidateId, jobId, recommendation, overallScore, fields, notes } = body;

  if (!interviewId || !candidateId || !jobId || !recommendation) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Check if already submitted by this user for this interview
  const existing = await db.query.feedbacks.findFirst({
    where: and(
      eq(feedbacks.interviewId, interviewId),
      eq(feedbacks.submittedById, session.user.id)
    ),
  });

  if (existing) {
    return NextResponse.json({ error: "Feedback already submitted for this interview" }, { status: 409 });
  }

  const [feedback] = await db
    .insert(feedbacks)
    .values({
      interviewId,
      candidateId,
      jobId,
      submittedById: session.user.id,
      recommendation: recommendation as any,
      overallScore,
      fields: fields ?? {},
      notes,
    })
    .returning();

  // Mark interview as completed if all interviewers have submitted
  await db
    .update(interviews)
    .set({ status: "COMPLETED", updatedAt: new Date() })
    .where(eq(interviews.id, interviewId));

  return NextResponse.json({ data: feedback }, { status: 201 });
}
