import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "RECRUITER" | "HIRING_MANAGER" | "INTERVIEWER" | "EMPLOYEE";
    } & DefaultSession["user"];
  }

  interface User {
    role?: "ADMIN" | "RECRUITER" | "HIRING_MANAGER" | "INTERVIEWER" | "EMPLOYEE";
  }
}
