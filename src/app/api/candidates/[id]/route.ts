import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { candidates, candidateStageHistory, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateCandidateSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  resumeUrl: z.string().optional(),
  websiteUrl: z.string().optional(),
  githubUrl: z.string().optional(),
  linkedinUrl: z.string().optional(),
  stageId: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  archived: z.boolean().optional(),
  archiveReason: z.string().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const candidate = await db.query.candidates.findFirst({
    where: eq(candidates.id, id),
    with: {
      job: true,
      stage: true,
      interviews: {
        with: {
          interviewers: { with: { user: { columns: { name: true, email: true } } } },
          feedbacks: true,
        },
        orderBy: (i, { desc }) => [desc(i.createdAt)],
      },
      feedbacks: {
        with: {
          submittedBy: { columns: { name: true } },
          template: { columns: { name: true } },
        },
      },
      assignments: {
        with: { reviewers: { with: { reviewer: { columns: { name: true } } } } },
      },
      referral: {
        with: { referrer: { columns: { name: true, email: true } } },
      },
      notes: {
        with: { author: { columns: { name: true } } },
        orderBy: (n, { desc }) => [desc(n.createdAt)],
      },
      stageHistory: {
        orderBy: (h, { desc }) => [desc(h.createdAt)],
      },
    },
  });

  if (!candidate) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ data: candidate });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await db.query.candidates.findFirst({
    where: eq(candidates.id, id),
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body;
  try {
    body = updateCandidateSchema.parse(await request.json());
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }

  const stageChanged = body.stageId !== undefined && body.stageId !== existing.stageId;

  const [updated] = await db
    .update(candidates)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(candidates.id, id))
    .returning();

  // Log stage change
  if (stageChanged) {
    await db.insert(candidateStageHistory).values({
      candidateId: id,
      fromStageId: existing.stageId ?? undefined,
      toStageId: body.stageId ?? undefined,
      actorId: session.user.id,
    });
  }

  await db.insert(auditLogs).values({
    entityType: "candidate",
    entityId: id,
    action: "updated",
    actorId: session.user.id,
    before: existing,
    after: updated,
  });

  return NextResponse.json({ data: updated });
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

  const { id } = await params;
  const { archiveReason } = await request.json().catch(() => ({}));

  const [updated] = await db
    .update(candidates)
    .set({ archived: true, archiveReason: archiveReason ?? "Archived", updatedAt: new Date() })
    .where(eq(candidates.id, id))
    .returning();

  return NextResponse.json({ data: updated });
}
