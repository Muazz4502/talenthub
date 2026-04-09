import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { interviewerAvailability } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") ?? session.user.id;

  const slots = await db.query.interviewerAvailability.findMany({
    where: eq(interviewerAvailability.userId, userId),
  });

  return NextResponse.json({ data: slots });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as {
    slots: { dayOfWeek: number; startTime: string; endTime: string }[];
  };

  // Delete existing availability
  await db
    .delete(interviewerAvailability)
    .where(eq(interviewerAvailability.userId, session.user.id));

  // Insert new slots
  if (body.slots.length > 0) {
    await db.insert(interviewerAvailability).values(
      body.slots.map((slot) => ({
        userId: session.user.id,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
      }))
    );
  }

  return NextResponse.json({ success: true });
}
