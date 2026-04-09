import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { referrals, jobs, candidates } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const mine = searchParams.get("mine") === "true";

  const conditions: any[] = [];
  if (mine || session.user.role === "EMPLOYEE") {
    conditions.push(eq(referrals.referrerId, session.user.id));
  }

  const list = await db.query.referrals.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [desc(referrals.createdAt)],
    limit: 100,
    with: {
      referrer: { columns: { name: true, email: true } },
      job: { columns: { title: true } },
      candidate: { columns: { id: true, firstName: true, lastName: true } },
    },
  });

  return NextResponse.json({ data: list });
}

export async function POST(request: NextRequest) {
  // Can be called by authenticated users OR public portal (with a name/email instead of session)
  const session = await auth();

  const body = await request.json() as {
    jobId: string;
    candidateFirstName: string;
    candidateLastName: string;
    candidateEmail: string;
    candidatePhone?: string;
    candidateLinkedinUrl?: string;
    resumeUrl?: string;
    relationship?: string;
    notes?: string;
    // For public portal (unauthenticated)
    referrerName?: string;
    referrerEmail?: string;
  };

  const {
    jobId,
    candidateFirstName,
    candidateLastName,
    candidateEmail,
    candidatePhone,
    candidateLinkedinUrl,
    resumeUrl,
    relationship,
    notes,
    referrerName,
    referrerEmail,
  } = body;

  if (!jobId || !candidateFirstName || !candidateLastName || !candidateEmail) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!session?.user && (!referrerName || !referrerEmail)) {
    return NextResponse.json({ error: "referrerName and referrerEmail required for anonymous referrals" }, { status: 400 });
  }

  // Get first stage
  const { pipelineStages } = await import("@/db/schema");
  const firstStage = await db.query.pipelineStages.findFirst({
    where: eq(pipelineStages.jobId, jobId),
    orderBy: (s, { asc }) => [asc(s.order)],
  });

  // Create candidate
  const [candidate] = await db
    .insert(candidates)
    .values({
      jobId,
      stageId: firstStage?.id,
      firstName: candidateFirstName,
      lastName: candidateLastName,
      email: candidateEmail.toLowerCase(),
      phone: candidatePhone,
      linkedinUrl: candidateLinkedinUrl,
      resumeUrl,
      source: "REFERRAL",
      tags: [],
    })
    .returning();

  // Create referral record
  const [referral] = await db
    .insert(referrals)
    .values({
      jobId,
      candidateId: candidate.id,
      referrerId: session?.user.id ?? null,
      referrerName: session?.user.name ?? referrerName ?? null,
      referrerEmail: session?.user.email ?? referrerEmail ?? null,
      relationship,
      notes,
      status: "SUBMITTED",
    })
    .returning();

  return NextResponse.json({ data: { referral, candidate } }, { status: 201 });
}
