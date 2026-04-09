import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { interviews } from "@/db/schema";
import { eq } from "drizzle-orm";

// Public endpoint — no auth required
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

  const interview = await db.query.interviews.findFirst({
    where: eq(interviews.selfScheduleToken, token),
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
