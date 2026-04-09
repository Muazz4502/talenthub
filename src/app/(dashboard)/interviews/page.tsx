import { auth } from "@/lib/auth";
import { db } from "@/db";
import { interviews } from "@/db/schema";
import { eq, and, gte, desc } from "drizzle-orm";
import { mockInterviews } from "@/lib/mock-data";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Clock, Video, MapPin } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No Show",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "warning",
  SCHEDULED: "info",
  COMPLETED: "success",
  CANCELLED: "destructive",
  NO_SHOW: "secondary",
};

const TYPE_LABELS: Record<string, string> = {
  PHONE_SCREEN: "Phone Screen",
  TECHNICAL: "Technical",
  BEHAVIORAL: "Behavioral",
  SYSTEM_DESIGN: "System Design",
  FINAL: "Final Round",
  HR: "HR",
};

export default async function InterviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; date?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  const conditions: any[] = [];
  if (params.status) conditions.push(eq(interviews.status, params.status as any));
  if (!params.status) {
    conditions.push(gte(interviews.scheduledAt, new Date(new Date().setHours(0, 0, 0, 0))));
  }

  let interviewList: typeof mockInterviews[number][] = [];
  try {
    interviewList = await db.query.interviews.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(interviews.scheduledAt)],
      limit: 100,
      with: {
        candidate: { columns: { id: true, firstName: true, lastName: true } },
        job: { columns: { title: true } },
        interviewers: {
          with: { user: { columns: { id: true, name: true } } },
        },
      },
    }) as any;
  } catch {
    interviewList = params.status
      ? mockInterviews.filter((iv) => iv.status === params.status) as any
      : mockInterviews as any;
  }

  // Filter for interviewers — only show their assigned interviews
  if (session!.user.role === "INTERVIEWER") {
    interviewList = interviewList.filter((iv) =>
      (iv.interviewers as any[]).some((i: any) => i.userId === session!.user.id)
    );
  }

  const canSchedule = ["ADMIN", "RECRUITER", "HIRING_MANAGER"].includes(session!.user.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interviews</h1>
          <p className="text-sm text-gray-500 mt-1">
            {params.status ? STATUS_LABELS[params.status] : "Upcoming"} interviews
          </p>
        </div>
        {canSchedule && (
          <Button asChild>
            <Link href="/interviews/schedule">
              <Plus className="h-4 w-4 mr-1" />
              Schedule Interview
            </Link>
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { label: "Upcoming", value: "" },
          { label: "Scheduled", value: "SCHEDULED" },
          { label: "Pending", value: "PENDING" },
          { label: "Completed", value: "COMPLETED" },
          { label: "Cancelled", value: "CANCELLED" },
        ].map((tab) => (
          <Link
            key={tab.value}
            href={tab.value ? `/interviews?status=${tab.value}` : "/interviews"}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              (params.status ?? "") === tab.value
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {interviewList.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No interviews found.</p>
          {canSchedule && (
            <Button asChild size="sm" className="mt-3">
              <Link href="/interviews/schedule">Schedule one</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {interviewList.map((interview) => (
            <div
              key={interview.id}
              className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900 text-sm">{interview.title}</h3>
                    <Badge variant={STATUS_COLORS[interview.status] as any}>
                      {STATUS_LABELS[interview.status]}
                    </Badge>
                    <Badge variant="outline">{TYPE_LABELS[interview.type] ?? interview.type}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    <Link
                      href={`/candidates/${interview.candidate?.id}`}
                      className="hover:text-blue-600 font-medium"
                    >
                      {interview.candidate?.firstName} {interview.candidate?.lastName}
                    </Link>
                    {interview.job && (
                      <span className="text-gray-400"> · {interview.job.title}</span>
                    )}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                    {interview.scheduledAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(interview.scheduledAt)} · {interview.durationMinutes} min
                      </span>
                    )}
                    {interview.meetingUrl && (
                      <a
                        href={interview.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-500 hover:underline"
                      >
                        <Video className="h-3 w-3" />
                        Join meeting
                      </a>
                    )}
                    {interview.location && !interview.meetingUrl && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {interview.location}
                      </span>
                    )}
                  </div>
                  {interview.interviewers.length > 0 && (
                    <p className="text-xs text-gray-400">
                      Interviewers: {interview.interviewers.map((i) => i.user.name).join(", ")}
                    </p>
                  )}
                </div>
                {canSchedule && (
                  <div className="flex gap-2 shrink-0">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/interviews/schedule?edit=${interview.id}`}>Edit</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
