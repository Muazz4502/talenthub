import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { feedbackFormTemplates } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const templates = await db.query.feedbackFormTemplates.findMany({
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });

  return NextResponse.json({ data: templates });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "RECRUITER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json() as {
    name: string;
    interviewType: string;
    fields: Array<{
      key: string;
      label: string;
      type: string;
      required: boolean;
      options?: string[];
    }>;
  };

  const { name, interviewType, fields } = body;

  if (!name || !interviewType || !fields?.length) {
    return NextResponse.json({ error: "name, interviewType, and fields required" }, { status: 400 });
  }

  const [template] = await db
    .insert(feedbackFormTemplates)
    .values({
      name,
      interviewType: interviewType as any,
      fields,
      createdById: session.user.id,
    })
    .returning();

  return NextResponse.json({ data: template }, { status: 201 });
}
