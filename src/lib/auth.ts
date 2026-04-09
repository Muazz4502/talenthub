import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { users, accounts, sessions, verificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";

// ── Demo users for local preview (no database required) ───────────
const DEMO_USERS = [
  { id: "demo-admin",       email: "admin@talenthub.dev",       name: "Alex Admin",      role: "ADMIN"          as const, password: "demo123" },
  { id: "demo-recruiter",   email: "recruiter@talenthub.dev",   name: "Rachel Recruiter", role: "RECRUITER"      as const, password: "demo123" },
  { id: "demo-hiring",      email: "hiring@talenthub.dev",      name: "Henry Manager",   role: "HIRING_MANAGER" as const, password: "demo123" },
  { id: "demo-interviewer", email: "interviewer@talenthub.dev", name: "Ivan Interviewer", role: "INTERVIEWER"    as const, password: "demo123" },
  { id: "demo-employee",    email: "employee@talenthub.dev",    name: "Emma Employee",   role: "EMPLOYEE"       as const, password: "demo123" },
];

const isDemoMode = !process.env.DATABASE_URL || process.env.DATABASE_URL.includes("user:password@host");

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...(isDemoMode ? { session: { strategy: "jwt" as const } } : {
    adapter: DrizzleAdapter(db, {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    }),
  }),
  providers: [
    Credentials({
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize(credentials) {
        const user = DEMO_USERS.find(
          (u) => u.email === credentials?.email && u.password === credentials?.password
        );
        if (!user) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.send",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = (user as any).role ?? "EMPLOYEE";
      return token;
    },
    async session({ session, token, user }) {
      if (session.user) {
        session.user.id = token?.sub ?? user?.id;
        if (token?.role) {
          session.user.role = token.role as any;
        } else if (user?.id && !isDemoMode) {
          const dbUser = await db.query.users.findFirst({
            where: eq(users.id, user.id),
            columns: { role: true },
          });
          session.user.role = dbUser?.role ?? "EMPLOYEE";
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
