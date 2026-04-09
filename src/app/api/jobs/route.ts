import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { jobs, pipelineStages, applicationFormConfigs, auditLogs } from "@/db/schema";
import { eq, like, count, desc, and } from "drizzle-orm";
import { DEFAULT_PIPELINE_STAGES, generateSlug } from "@/lib/utils";
import { z } from "zod";

const createJobSchema = z.object({
  title: z.string().min(1),
  department: z.string().optional(),
  location: z.string().optional(),
  locationType: z.enum(["REMOTE", "HYBRID", "ONSITE"]).default("HYBRID"),
  description: z.string().optional(),
  status: z.enum(["DRAFT", "OPEN", "PAUSED", "CLOSED"]).default("DRAFT"),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const department = searchParams.get("department");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const offset = (page - 1) * limit;

  const conditions = [];
  if (status && status !== "all") conditions.push(eq(jobs.status, status as any));
  if (department) conditions.push(eq(jobs.department, department));
  if (search) conditions.push(like(jobs.title, `%${search}%`));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [jobsList, [{ total }]] = await Promise.all([
    db.query.jobs.findMany({
      where: whereClause,
      orderBy: [desc(jobs.createdAt)],
      limit,
      offset,
      with: {
        owner: { columns: { name: true, email: true, image: true } },
        stages: { orderBy: (stages, { asc }) => [asc(stages.order)] },
      },
    }),
    db.select({ total: count() }).from(jobs).where(whereClause),
  ]);

  // Get candidate counts per job
  const { candidates } = await import("@/db/schema");
  const candidateCounts = await db
    .select({ jobId: candidates.jobId, count: count() })
    .from(candidates)
    .where(eq(candidates.archived, false))
    .groupBy(candidates.jobId);

  const countMap = Object.fromEntries(candidateCounts.map((r) => [r.jobId, r.count]));

  const jobsWithCounts = jobsList.map((job) => ({
    ...job,
    candidateCount: countMap[job.id] ?? 0,
  }));

  return NextResponse.json({ data: jobsWithCounts, total, page, limit });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "RECRUITER", "HIRING_MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body;
  try {
    body = createJobSchema.parse(await request.json());
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }

  const slug = generateSlug(body.title);
  const applicationUrl = `${slug}-${crypto.randomUUID().slice(0, 8)}`;

  const [newJob] = await db.insert(jobs).values({
    ...body,
    ownerId: session.user.id,
    applicationUrl,
  }).returning();

  // Create default pipeline stages
  await db.insert(pipelineStages).values(
    DEFAULT_PIPELINE_STAGES.map((name, index) => ({
      jobId: newJob.id,
      name,
      order: index,
    }))
  );

  // Create empty application form config
  await db.insert(applicationFormConfigs).values({
    jobId: newJob.id,
    fields: [],
  });

  // Audit log
  await db.insert(auditLogs).values({
    entityType: "job",
    entityId: newJob.id,
    action: "created",
    actorId: session.user.id,
    after: newJob,
  });

  return NextResponse.json({ data: newJob }, { status: 201 });
}
