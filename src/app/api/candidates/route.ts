import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  candidates,
  pipelineStages,
  candidateStageHistory,
  auditLogs,
} from "@/db/schema";
import { eq, and, like, or, desc, count, gte, lte } from "drizzle-orm";
import { z } from "zod";

const createCandidateSchema = z.object({
  jobId: z.string().min(1),
  stageId: z.string().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().min(1),
  phone: z.string().optional(),
  resumeUrl: z.string().optional(),
  resumeFileKey: z.string().optional(),
  websiteUrl: z.string().optional(),
  githubUrl: z.string().optional(),
  linkedinUrl: z.string().optional(),
  source: z.enum(["WEBSITE", "LINKEDIN", "MANUAL", "BULK_UPLOAD", "REFERRAL"]).default("MANUAL"),
  tags: z.array(z.string()).optional(),
  applicationAnswers: z.record(z.string(), z.any()).optional(),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");
  const stageId = searchParams.get("stageId");
  const source = searchParams.get("source");
  const archived = searchParams.get("archived") === "true";
  const search = searchParams.get("search");
  const minScore = searchParams.get("minScore");
  const maxScore = searchParams.get("maxScore");
  const sort = searchParams.get("sort") ?? "createdAt";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const offset = (page - 1) * limit;

  const conditions = [eq(candidates.archived, archived)];
  if (jobId) conditions.push(eq(candidates.jobId, jobId));
  if (stageId) conditions.push(eq(candidates.stageId, stageId));
  if (source) conditions.push(eq(candidates.source, source as any));
  if (search) {
    conditions.push(
      or(
        like(candidates.firstName, `%${search}%`),
        like(candidates.lastName, `%${search}%`),
        like(candidates.email, `%${search}%`)
      )!
    );
  }
  if (minScore) conditions.push(gte(candidates.aiScore, parseInt(minScore)));
  if (maxScore) conditions.push(lte(candidates.aiScore, parseInt(maxScore)));

  const orderBy =
    sort === "aiScore"
      ? [desc(candidates.aiScore)]
      : [desc(candidates.createdAt)];

  const [candidateList, [{ total }]] = await Promise.all([
    db.query.candidates.findMany({
      where: and(...conditions),
      orderBy,
      limit,
      offset,
      with: {
        job: { columns: { title: true } },
        stage: { columns: { name: true } },
      },
    }),
    db.select({ total: count() }).from(candidates).where(and(...conditions)),
  ]);

  return NextResponse.json({ data: candidateList, total, page, limit });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "RECRUITER", "HIRING_MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body;
  try {
    body = createCandidateSchema.parse(await request.json());
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }

  // Auto-assign to first stage (Lead) if no stageId given
  let stageId = body.stageId;
  if (!stageId) {
    const firstStage = await db.query.pipelineStages.findFirst({
      where: eq(pipelineStages.jobId, body.jobId),
      orderBy: (s, { asc }) => [asc(s.order)],
    });
    stageId = firstStage?.id;
  }

  const [candidate] = await db
    .insert(candidates)
    .values({ ...body, stageId })
    .returning();

  // Log initial stage assignment
  if (stageId) {
    await db.insert(candidateStageHistory).values({
      candidateId: candidate.id,
      toStageId: stageId,
      actorId: session.user.id,
      note: "Initial stage assignment",
    });
  }

  await db.insert(auditLogs).values({
    entityType: "candidate",
    entityId: candidate.id,
    action: "created",
    actorId: session.user.id,
    after: candidate,
  });

  return NextResponse.json({ data: candidate }, { status: 201 });
}
