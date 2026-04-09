"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Briefcase, Loader2 } from "lucide-react";

const DEMO_ACCOUNTS = [
  { role: "Admin",          email: "admin@talenthub.dev",       name: "Alex Admin",       color: "bg-purple-600", desc: "Full access — jobs, candidates, settings" },
  { role: "Recruiter",      email: "recruiter@talenthub.dev",   name: "Rachel Recruiter", color: "bg-blue-600",   desc: "Manage jobs & candidates" },
  { role: "Hiring Manager", email: "hiring@talenthub.dev",      name: "Henry Manager",    color: "bg-indigo-600", desc: "Review candidates & feedback" },
  { role: "Interviewer",    email: "interviewer@talenthub.dev", name: "Ivan Interviewer", color: "bg-cyan-600",   desc: "Assigned interviews & feedback only" },
  { role: "Employee",       email: "employee@talenthub.dev",    name: "Emma Employee",    color: "bg-green-600",  desc: "Submit referrals" },
];

export default function LoginPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const loginAs = async (email: string) => {
    setLoading(email);
    await signIn("credentials", { email, password: "demo123", callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <div className="w-full max-w-lg">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 mb-3 shadow-md">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">TalentHub</h1>
            <p className="text-sm text-gray-500 mt-1">AI-Native Applicant Tracking System</p>
          </div>

          {/* Demo banner */}
          <div className="mb-5 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-center">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Demo Mode</p>
            <p className="text-xs text-amber-600 mt-0.5">Click any role below to sign in instantly</p>
          </div>

          {/* Demo role buttons */}
          <div className="space-y-2.5">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                onClick={() => loginAs(account.email)}
                disabled={loading !== null}
                className="w-full flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left hover:border-blue-300 hover:bg-blue-50 transition-all disabled:opacity-60 disabled:cursor-not-allowed group"
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${account.color} text-white text-sm font-bold shrink-0`}>
                  {account.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{account.name}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 font-medium">{account.role}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{account.desc}</p>
                </div>
                {loading === account.email ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600 shrink-0" />
                ) : (
                  <span className="text-xs text-gray-400 group-hover:text-blue-600 shrink-0">Sign in →</span>
                )}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Google OAuth */}
          <form action={async () => {
            // Server action workaround — use client signIn
          }}>
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              disabled={loading !== null}
              className="w-full flex items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          TalentHub — Internal HR Platform · Demo password: <code className="font-mono">demo123</code>
        </p>
      </div>
    </div>
  );
}
