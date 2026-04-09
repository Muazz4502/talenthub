import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { desc } from "drizzle-orm";
import { mockUsers } from "@/lib/mock-data";
import { UserRoleManager } from "./user-role-manager";
import { Shield } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  RECRUITER: "Recruiter",
  HIRING_MANAGER: "Hiring Manager",
  INTERVIEWER: "Interviewer",
  EMPLOYEE: "Employee",
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  ADMIN: "Full access to all features, user management",
  RECRUITER: "Manage jobs, candidates, interviews, feedback",
  HIRING_MANAGER: "Create jobs, view candidates, schedule interviews",
  INTERVIEWER: "View assigned interviews, submit feedback",
  EMPLOYEE: "Submit referrals via the referral portal",
};

export default async function SettingsPage() {
  const session = await auth();
  if (session!.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  let allUsers: any[];
  try {
    allUsers = await db.query.users.findMany({
      orderBy: [desc(users.createdAt)],
      columns: { id: true, name: true, email: true, role: true, image: true, createdAt: true },
    });
  } catch {
    allUsers = [...mockUsers];
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage team members and access control.</p>
      </div>

      {/* Role overview */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <Shield className="h-4 w-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-700">Role Permissions</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-100">
          {Object.entries(ROLE_LABELS).map(([role, label]) => (
            <div key={role} className="bg-white px-4 py-3">
              <p className="text-sm font-medium text-gray-900">{label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{ROLE_DESCRIPTIONS[role]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* User management */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Team Members ({allUsers.length})</h2>
        </div>
        <UserRoleManager users={allUsers} currentUserId={session!.user.id} />
      </div>
    </div>
  );
}
