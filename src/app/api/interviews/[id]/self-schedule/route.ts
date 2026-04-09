import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { interviews } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// Public route — candidate uses token to self-schedule
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

  const interview = await db.query.interviews.findFirst({
    where: and(
      eq(interviews.id, id),
      eq(interviews.selfScheduleToken, token)
    ),
    with: {
      job: { columns: { title: true } },
      interviewers: {
        with: { user: { columns: { name: true } } },
      },
    },
  });

  if (!interview) return NextResponse.json({ error: "Invalid link" }, { status: 404 });

  return NextResponse.json({ data: interview });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { token, scheduledAt } = await request.json() as {
    token: string;
    scheduledAt: string;
  };

  if (!token || !scheduledAt) {
    return NextResponse.json({ error: "token and scheduledAt required" }, { status: 400 });
  }

  const interview = await db.query.interviews.findFirst({
    where: and(
      eq(interviews.id, id),
      eq(interviews.selfScheduleToken, token)
    ),
  });

  if (!interview) return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  if (interview.status === "SCHEDULED") {
    return NextResponse.json({ error: "Interview already scheduled" }, { status: 409 });
  }

  const [updated] = await db
    .update(interviews)
    .set({
      scheduledAt: new Date(scheduledAt),
      status: "SCHEDULED",
      updatedAt: new Date(),
    })
    .where(eq(interviews.id, id))
    .returning();

  return NextResponse.json({ data: updated });
}
