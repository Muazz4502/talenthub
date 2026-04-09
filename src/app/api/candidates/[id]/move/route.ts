import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { candidates, candidateStageHistory, pipelineStages } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { stageId, note } = await request.json();

  if (!stageId) return NextResponse.json({ error: "stageId required" }, { status: 400 });

  const candidate = await db.query.candidates.findFirst({
    where: eq(candidates.id, id),
  });
  if (!candidate) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Validate stage belongs to same job
  const stage = await db.query.pipelineStages.findFirst({
    where: and(eq(pipelineStages.id, stageId), eq(pipelineStages.jobId, candidate.jobId)),
  });
  if (!stage) return NextResponse.json({ error: "Invalid stage for this job" }, { status: 400 });

  const [updated] = await db
    .update(candidates)
    .set({ stageId, updatedAt: new Date() })
    .where(eq(candidates.id, id))
    .returning();

  await db.insert(candidateStageHistory).values({
    candidateId: id,
    fromStageId: candidate.stageId ?? undefined,
    toStageId: stageId,
    actorId: session.user.id,
    note: note ?? undefined,
  });

  return NextResponse.json({ data: updated });
}
