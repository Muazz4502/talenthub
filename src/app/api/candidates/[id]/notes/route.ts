import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { candidateNotes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const notes = await db.query.candidateNotes.findMany({
    where: eq(candidateNotes.candidateId, id),
    with: { author: { columns: { name: true, image: true } } },
    orderBy: [desc(candidateNotes.createdAt)],
  });

  return NextResponse.json({ data: notes });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { content } = await request.json();

  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const [note] = await db
    .insert(candidateNotes)
    .values({ candidateId: id, authorId: session.user.id, content })
    .returning();

  return NextResponse.json({ data: note }, { status: 201 });
}
