import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { interviews, interviewInterviewers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const interview = await db.query.interviews.findFirst({
    where: eq(interviews.id, id),
    with: {
      candidate: { columns: { id: true, firstName: true, lastName: true, email: true } },
      job: { columns: { id: true, title: true } },
      interviewers: {
        with: { user: { columns: { id: true, name: true, email: true, image: true } } },
      },
    },
  });

  if (!interview) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ data: interview });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "RECRUITER", "HIRING_MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json() as {
    title?: string;
    scheduledAt?: string;
    durationMinutes?: number;
    location?: string;
    meetingUrl?: string;
    status?: string;
    notes?: string;
    calendarEventId?: string;
    interviewerIds?: string[];
  };

  const { interviewerIds, ...rest } = body;

  const updates: Record<string, any> = { ...rest, updatedAt: new Date() };
  if (rest.scheduledAt) updates.scheduledAt = new Date(rest.scheduledAt);

  const [updated] = await db
    .update(interviews)
    .set(updates)
    .where(eq(interviews.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (interviewerIds !== undefined) {
    await db.delete(interviewInterviewers).where(eq(interviewInterviewers.interviewId, id));
    if (interviewerIds.length > 0) {
      await db.insert(interviewInterviewers).values(
        interviewerIds.map((userId) => ({ interviewId: id, userId }))
      );
    }
  }

  return NextResponse.json({ data: updated });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "RECRUITER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await db.delete(interviews).where(eq(interviews.id, id));
  return NextResponse.json({ success: true });
}
