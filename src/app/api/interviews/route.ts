import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { interviews, interviewInterviewers, candidates, jobs, users } from "@/db/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const candidateId = searchParams.get("candidateId");
  const jobId = searchParams.get("jobId");
  const date = searchParams.get("date");
  const status = searchParams.get("status");

  const conditions = [];
  if (candidateId) conditions.push(eq(interviews.candidateId, candidateId));
  if (jobId) conditions.push(eq(interviews.jobId, jobId));
  if (status) conditions.push(eq(interviews.status, status as any));
  if (date) {
    const d = new Date(date);
    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);
    conditions.push(gte(interviews.scheduledAt, d));
    conditions.push(lte(interviews.scheduledAt, nextDay));
  }

  // Interviewers only see their assigned interviews
  if (session.user.role === "INTERVIEWER") {
    // We'll filter client-side after fetching with relation
  }

  const interviewList = await db.query.interviews.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [desc(interviews.scheduledAt)],
    limit: 100,
    with: {
      candidate: { columns: { firstName: true, lastName: true, email: true } },
      job: { columns: { title: true } },
      interviewers: {
        with: { user: { columns: { name: true, email: true, image: true } } },
      },
    },
  });

  return NextResponse.json({ data: interviewList });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "RECRUITER", "HIRING_MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json() as {
    candidateId: string;
    jobId: string;
    title: string;
    type: string;
    scheduledAt: string;
    durationMinutes: number;
    location?: string;
    meetingUrl?: string;
    interviewerIds: string[];
    notes?: string;
    selfSchedule?: boolean;
  };

  const {
    candidateId,
    jobId,
    title,
    type,
    scheduledAt,
    durationMinutes,
    location,
    meetingUrl,
    interviewerIds,
    notes,
    selfSchedule,
  } = body;

  if (!candidateId || !jobId || !title || !type || !durationMinutes) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const selfScheduleToken = selfSchedule ? randomUUID() : null;

  const [interview] = await db
    .insert(interviews)
    .values({
      candidateId,
      jobId,
      title,
      type: type as any,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      durationMinutes,
      location,
      meetingUrl,
      notes,
      selfScheduleToken,
      status: selfSchedule ? "PENDING" : "SCHEDULED",
      scheduledById: session.user.id,
    })
    .returning();

  if (interviewerIds?.length) {
    await db.insert(interviewInterviewers).values(
      interviewerIds.map((userId) => ({
        interviewId: interview.id,
        userId,
      }))
    );
  }

  return NextResponse.json({ data: interview }, { status: 201 });
}
