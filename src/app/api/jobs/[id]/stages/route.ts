import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { pipelineStages, candidates } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { z } from "zod";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: jobId } = await params;

  const stages = await db.query.pipelineStages.findMany({
    where: eq(pipelineStages.jobId, jobId),
    orderBy: (stages, { asc }) => [asc(stages.order)],
  });

  // Get candidate count per stage
  const stageCounts = await db
    .select({ stageId: candidates.stageId, count: count() })
    .from(candidates)
    .where(and(eq(candidates.jobId, jobId), eq(candidates.archived, false)))
    .groupBy(candidates.stageId);

  const countMap = Object.fromEntries(
    stageCounts.map((r) => [r.stageId ?? "", r.count])
  );

  const stagesWithCounts = stages.map((s) => ({
    ...s,
    candidateCount: countMap[s.id] ?? 0,
  }));

  return NextResponse.json({ data: stagesWithCounts });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "RECRUITER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: jobId } = await params;
  const { name, order } = await request.json();

  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const [stage] = await db.insert(pipelineStages).values({
    jobId,
    name,
    order: order ?? 999,
  }).returning();

  return NextResponse.json({ data: stage }, { status: 201 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: jobId } = await params;
  const { stages } = await request.json() as { stages: { id: string; order: number }[] };

  await Promise.all(
    stages.map(({ id, order }) =>
      db.update(pipelineStages)
        .set({ order, updatedAt: new Date() })
        .where(and(eq(pipelineStages.id, id), eq(pipelineStages.jobId, jobId)))
    )
  );

  return NextResponse.json({ success: true });
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

  const { id: jobId } = await params;
  const { searchParams } = new URL(request.url);
  const stageId = searchParams.get("stageId");

  if (!stageId) return NextResponse.json({ error: "stageId required" }, { status: 400 });

  // Check no candidates are in this stage
  const [{ total }] = await db
    .select({ total: count() })
    .from(candidates)
    .where(and(eq(candidates.stageId, stageId), eq(candidates.archived, false)));

  if (total > 0) {
    return NextResponse.json(
      { error: `Cannot delete stage with ${total} active candidates. Move them first.` },
      { status: 400 }
    );
  }

  await db.delete(pipelineStages).where(
    and(eq(pipelineStages.id, stageId), eq(pipelineStages.jobId, jobId))
  );

  return NextResponse.json({ success: true });
}
