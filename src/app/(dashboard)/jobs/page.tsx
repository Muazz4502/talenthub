import { auth } from "@/lib/auth";
import { db } from "@/db";
import { jobs, candidates } from "@/db/schema";
import { desc, eq, count } from "drizzle-orm";
import { mockJobs, mockCandidates } from "@/lib/mock-data";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, MapPin, Users, Calendar, MoreHorizontal, Briefcase } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { JOB_STATUS_LABELS, LOCATION_TYPE_LABELS } from "@/lib/utils";

type JobStatus = "all" | "DRAFT" | "OPEN" | "PAUSED" | "CLOSED";

const STATUS_BADGE: Record<string, "success" | "secondary" | "outline" | "default" | "warning"> = {
  OPEN: "success",
  PAUSED: "warning",
  DRAFT: "outline",
  CLOSED: "secondary",
};

async function getJobs(statusFilter?: string) {
  try {
    const where = statusFilter && statusFilter !== "all"
      ? eq(jobs.status, statusFilter as any)
      : undefined;

    const jobsList = await db.query.jobs.findMany({
      where,
      orderBy: [desc(jobs.createdAt)],
      with: {
        owner: { columns: { name: true } },
      },
    });

    const counts = await db
      .select({ jobId: candidates.jobId, count: count() })
      .from(candidates)
      .where(eq(candidates.archived, false))
      .groupBy(candidates.jobId);

    const countMap = Object.fromEntries(counts.map((c) => [c.jobId, c.count]));

    return jobsList.map((j) => ({ ...j, candidateCount: countMap[j.id] ?? 0 }));
  } catch {
    const filtered = statusFilter && statusFilter !== "all"
      ? mockJobs.filter((j) => j.status === statusFilter)
      : [...mockJobs];
    return filtered.map((j) => ({
      ...j,
      owner: j.owner ?? null,
      candidateCount: mockCandidates.filter((c) => c.jobId === j.id).length,
    }));
  }
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  const { status = "all" } = await searchParams;

  const allJobs = await getJobs(status);
  const canCreate = ["ADMIN", "RECRUITER", "HIRING_MANAGER"].includes(session!.user.role);

  const tabs: { label: string; value: string; count?: number }[] = [
    { label: "All", value: "all", count: allJobs.length },
    { label: "Open", value: "OPEN" },
    { label: "Draft", value: "DRAFT" },
    { label: "Paused", value: "PAUSED" },
    { label: "Closed", value: "CLOSED" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
          <p className="text-sm text-gray-500 mt-1">{allJobs.length} total positions</p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/jobs/new">
              <Plus className="h-4 w-4 mr-1" />
              New Job
            </Link>
          </Button>
        )}
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 pb-0">
        {tabs.map((tab) => (
          <Link
            key={tab.value}
            href={`/jobs?status=${tab.value}`}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              status === tab.value
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                status === tab.value ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
              }`}>
                {tab.count}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Jobs list */}
      {allJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Briefcase className="h-12 w-12 text-gray-300 mb-3" />
          <h3 className="text-base font-medium text-gray-900">No jobs found</h3>
          <p className="text-sm text-gray-500 mt-1">
            {canCreate ? "Create your first job posting to get started." : "No jobs match your filters."}
          </p>
          {canCreate && (
            <Button asChild className="mt-4">
              <Link href="/jobs/new">Create Job</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {allJobs.map((job) => {
            const daysOpen = Math.floor(
              (Date.now() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60 * 24)
            );
            return (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="text-base font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                        >
                          {job.title}
                        </Link>
                        <Badge variant={STATUS_BADGE[job.status] ?? "secondary"}>
                          {JOB_STATUS_LABELS[job.status] ?? job.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 flex-wrap">
                        <span className="font-medium text-gray-700">{job.department}</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {job.location} · {LOCATION_TYPE_LABELS[job.locationType]}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {job.candidateCount} candidates
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {daysOpen === 0 ? "Today" : `${daysOpen}d ago`}
                        </span>
                        {job.owner?.name && (
                          <span className="text-gray-400">by {job.owner.name}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/jobs/${job.id}`}>View</Link>
                      </Button>
                      {canCreate && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/jobs/${job.id}/edit`}>Edit</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/candidates?jobId=${job.id}`}>View Candidates</Link>
                            </DropdownMenuItem>
                            {job.status !== "CLOSED" && (
                              <DropdownMenuItem className="text-red-600">
                                Close Job
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
