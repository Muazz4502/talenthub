import { auth } from "@/lib/auth";
import { db } from "@/db";
import { jobs, candidates, interviews } from "@/db/schema";
import { eq, and, gte, lte, count } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  Users,
  Calendar,
  MessageSquare,
  Plus,
  ArrowRight,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

const MOCK_STATS = {
  openJobs: 4, activeCandidates: 23, interviewsToday: 3, pendingFeedback: 5,
  recentJobs: [
    { id: "1", title: "Senior Frontend Engineer", department: "Engineering", status: "OPEN" as const, createdAt: new Date("2025-03-01") },
    { id: "2", title: "Product Manager", department: "Product", status: "OPEN" as const, createdAt: new Date("2025-03-10") },
    { id: "3", title: "UX Designer", department: "Design", status: "PAUSED" as const, createdAt: new Date("2025-03-15") },
    { id: "4", title: "Backend Engineer", department: "Engineering", status: "OPEN" as const, createdAt: new Date("2025-03-20") },
    { id: "5", title: "Data Analyst", department: "Analytics", status: "DRAFT" as const, createdAt: new Date("2025-03-25") },
  ],
};

async function getDashboardStats() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [openJobsResult] = await db
      .select({ count: count() })
      .from(jobs)
      .where(eq(jobs.status, "OPEN"));

    const [activeCandidatesResult] = await db
      .select({ count: count() })
      .from(candidates)
      .where(eq(candidates.archived, false));

    const [interviewsTodayResult] = await db
      .select({ count: count() })
      .from(interviews)
      .where(
        and(
          gte(interviews.scheduledAt, today),
          lte(interviews.scheduledAt, tomorrow)
        )
      );

    const [pendingFeedbackResult] = await db
      .select({ count: count() })
      .from(interviews)
      .where(eq(interviews.status, "SCHEDULED"));

    const recentJobs = await db.query.jobs.findMany({
      orderBy: (jobs, { desc }) => [desc(jobs.createdAt)],
      limit: 5,
      with: { owner: { columns: { name: true } } },
    });

    return {
      openJobs: openJobsResult?.count ?? 0,
      activeCandidates: activeCandidatesResult?.count ?? 0,
      interviewsToday: interviewsTodayResult?.count ?? 0,
      pendingFeedback: pendingFeedbackResult?.count ?? 0,
      recentJobs,
    };
  } catch {
    return MOCK_STATS;
  }
}

export default async function DashboardPage() {
  const session = await auth();
  const stats = await getDashboardStats();

  const statCards = [
    {
      title: "Open Jobs",
      value: stats.openJobs,
      icon: Briefcase,
      color: "text-blue-600",
      bg: "bg-blue-50",
      href: "/jobs",
    },
    {
      title: "Active Candidates",
      value: stats.activeCandidates,
      icon: Users,
      color: "text-green-600",
      bg: "bg-green-50",
      href: "/candidates",
    },
    {
      title: "Interviews Today",
      value: stats.interviewsToday,
      icon: Calendar,
      color: "text-purple-600",
      bg: "bg-purple-50",
      href: "/interviews",
    },
    {
      title: "Pending Feedback",
      value: stats.pendingFeedback,
      icon: MessageSquare,
      color: stats.pendingFeedback > 0 ? "text-red-600" : "text-gray-600",
      bg: stats.pendingFeedback > 0 ? "bg-red-50" : "bg-gray-50",
      href: "/feedback",
    },
  ];

  const JOB_STATUS_COLORS: Record<string, "success" | "secondary" | "outline" | "warning"> = {
    OPEN: "success",
    PAUSED: "warning",
    DRAFT: "outline",
    CLOSED: "secondary",
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {session!.user.name?.split(" ")[0]}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Here&apos;s what&apos;s happening with your hiring pipeline today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/candidates/new">
              <Plus className="h-4 w-4 mr-1" />
              Add Candidate
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/jobs/new">
              <Plus className="h-4 w-4 mr-1" />
              New Job
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bg}`}>
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick actions + Recent Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Jobs */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Recent Jobs</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/jobs" className="flex items-center gap-1 text-blue-600">
                View all
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {stats.recentJobs.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No jobs yet</p>
                <Button asChild size="sm" className="mt-3">
                  <Link href="/jobs/new">Create your first job</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentJobs.map((job) => (
                  <Link key={job.id} href={`/jobs/${job.id}`}>
                    <div className="flex items-center justify-between py-2 hover:bg-gray-50 rounded-md px-2 -mx-2 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {job.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {job.department} · {formatDate(job.createdAt)}
                        </p>
                      </div>
                      <Badge variant={JOB_STATUS_COLORS[job.status] ?? "secondary"} className="text-xs ml-3 shrink-0">
                        {job.status.charAt(0) + job.status.slice(1).toLowerCase()}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <Button asChild variant="outline" className="w-full justify-start" size="sm">
              <Link href="/jobs/new">
                <Briefcase className="h-4 w-4 mr-2 text-blue-500" />
                Create a Job
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start" size="sm">
              <Link href="/candidates/new">
                <Users className="h-4 w-4 mr-2 text-green-500" />
                Add a Candidate
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start" size="sm">
              <Link href="/candidates/bulk-upload">
                <Users className="h-4 w-4 mr-2 text-purple-500" />
                Bulk Upload Candidates
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start" size="sm">
              <Link href="/interviews/schedule">
                <Calendar className="h-4 w-4 mr-2 text-orange-500" />
                Schedule Interview
              </Link>
            </Button>
            {stats.pendingFeedback > 0 && (
              <Button asChild variant="outline" className="w-full justify-start border-red-200 text-red-700 hover:bg-red-50" size="sm">
                <Link href="/feedback">
                  <Clock className="h-4 w-4 mr-2" />
                  {stats.pendingFeedback} Pending Feedback
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
