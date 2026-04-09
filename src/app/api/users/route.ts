import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const roleParam = searchParams.get("role");
  const roles = roleParam ? roleParam.split(",") : null;

  const userList = await db.query.users.findMany({
    where: roles ? inArray(users.role, roles as any[]) : undefined,
    columns: { id: true, name: true, email: true, role: true, image: true },
  });

  return NextResponse.json({ data: userList });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, role } = await request.json() as { userId: string; role: string };

  if (!userId || !role) {
    return NextResponse.json({ error: "userId and role required" }, { status: 400 });
  }

  const [updated] = await db
    .update(users)
    .set({ role: role as any, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning({ id: users.id, name: users.name, email: users.email, role: users.role });

  return NextResponse.json({ data: updated });
}
