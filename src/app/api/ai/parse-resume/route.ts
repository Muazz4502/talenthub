import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { candidates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { parseResume } from "@/lib/ai";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { candidateId, resumeText } = await request.json() as {
    candidateId: string;
    resumeText: string;
  };

  if (!candidateId || !resumeText) {
    return NextResponse.json({ error: "candidateId and resumeText required" }, { status: 400 });
  }

  try {
    const parsed = await parseResume(resumeText);

    await db
      .update(candidates)
      .set({
        aiParsedData: parsed as any,
        updatedAt: new Date(),
      })
      .where(eq(candidates.id, candidateId));

    return NextResponse.json({ data: parsed });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Parse failed" }, { status: 500 });
  }
}
