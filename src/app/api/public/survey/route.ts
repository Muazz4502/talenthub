import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { candidateSurveys, candidates } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// Public endpoint — no auth required
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

  const survey = await db.query.candidateSurveys.findFirst({
    where: eq(candidateSurveys.token, token),
    with: {
      candidate: { columns: { firstName: true, jobId: true } },
      job: { columns: { title: true } },
    },
  });

  if (!survey) return NextResponse.json({ error: "Invalid survey link" }, { status: 404 });

  return NextResponse.json({ data: survey });
}

export async function POST(request: NextRequest) {
  const { token, overallRating, processRating, communicationRating, feedback } = await request.json() as {
    token: string;
    overallRating: number;
    processRating: number;
    communicationRating: number;
    feedback?: string;
  };

  if (!token || !overallRating) {
    return NextResponse.json({ error: "token and overallRating required" }, { status: 400 });
  }

  const survey = await db.query.candidateSurveys.findFirst({
    where: eq(candidateSurveys.token, token),
  });

  if (!survey) return NextResponse.json({ error: "Invalid survey link" }, { status: 404 });

  if (survey.submittedAt) {
    return NextResponse.json({ error: "Survey already submitted" }, { status: 409 });
  }

  const [updated] = await db
    .update(candidateSurveys)
    .set({
      overallRating,
      processRating,
      communicationRating,
      feedback,
      submittedAt: new Date(),
    })
    .where(eq(candidateSurveys.token, token))
    .returning();

  return NextResponse.json({ data: updated });
}
