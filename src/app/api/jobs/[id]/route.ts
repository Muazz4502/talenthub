import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { jobs, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateJobSchema = z.object({
  title: z.string().min(1).optional(),
  department: z.string().optional(),
  location: z.string().optional(),
  locationType: z.enum(["REMOTE", "HYBRID", "ONSITE"]).optional(),
  description: z.string().optional(),
  status: z.enum(["DRAFT", "OPEN", "PAUSED", "CLOSED"]).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const job = await db.query.jobs.findFirst({
    where: eq(jobs.id, id),
    with: {
      owner: { columns: { id: true, name: true, email: true, image: true } },
      stages: { orderBy: (stages, { asc }) => [asc(stages.order)] },
      formConfig: true,
      candidates: {
        where: (candidates, { eq }) => eq(candidates.archived, false),
        columns: { id: true, stageId: true, firstName: true, lastName: true, aiScore: true },
      },
    },
  });

  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ data: job });
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

  const existingJob = await db.query.jobs.findFirst({ where: eq(jobs.id, id) });
  if (!existingJob) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body;
  try {
    body = updateJobSchema.parse(await request.json());
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }

  const updates: Record<string, any> = { ...body, updatedAt: new Date() };
  if (body.status === "CLOSED") updates.closedAt = new Date();

  const [updated] = await db.update(jobs).set(updates).where(eq(jobs.id, id)).returning();

  await db.insert(auditLogs).values({
    entityType: "job",
    entityId: id,
    action: "updated",
    actorId: session.user.id,
    before: existingJob,
    after: updated,
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "RECRUITER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const [updated] = await db
    .update(jobs)
    .set({ status: "CLOSED", closedAt: new Date(), updatedAt: new Date() })
    .where(eq(jobs.id, id))
    .returning();

  await db.insert(auditLogs).values({
    entityType: "job",
    entityId: id,
    action: "closed",
    actorId: session.user.id,
  });

  return NextResponse.json({ data: updated });
}
