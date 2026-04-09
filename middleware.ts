import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = [
  "/login",
  "/api/auth",
  "/careers",
  "/referral-portal",
  "/schedule",
  "/api/public",
  "/survey",
];

export default auth((req: NextRequest & { auth: any }) => {
  const { pathname } = req.nextUrl;

  // Allow public paths
  const isPublic = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
  if (isPublic) return NextResponse.next();

  // Redirect to login if not authenticated
  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
