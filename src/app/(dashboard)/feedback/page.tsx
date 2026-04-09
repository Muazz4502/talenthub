import { auth } from "@/lib/auth";
import { db } from "@/db";
import { feedbacks, interviews } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { mockFeedbacks, mockInterviews } from "@/lib/mock-data";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Star, Settings } from "lucide-react";
import { formatDate } from "@/lib/utils";

const RECOMMENDATION_COLORS: Record<string, string> = {
  STRONG_YES: "success",
  YES: "info",
  MAYBE: "warning",
  NO: "destructive",
  STRONG_NO: "destructive",
};

const RECOMMENDATION_LABELS: Record<string, string> = {
  STRONG_YES: "Strong Yes",
  YES: "Yes",
  MAYBE: "Maybe",
  NO: "No",
  STRONG_NO: "Strong No",
};

export default async function FeedbackPage() {
  const session = await auth();

  let pendingInterviews: any[] = [];
  let feedbackList: any[] = [];

  try {
    if (!["ADMIN", "RECRUITER"].includes(session!.user.role)) {
      const allInterviews = await db.query.interviews.findMany({
        where: eq(interviews.status, "SCHEDULED"),
        with: {
          candidate: { columns: { id: true, firstName: true, lastName: true } },
          job: { columns: { title: true } },
          interviewers: { columns: { userId: true } },
        },
        orderBy: [desc(interviews.scheduledAt)],
        limit: 50,
      });

      const submittedInterviewIds = (
        await db.query.feedbacks.findMany({
          where: eq(feedbacks.submittedById, session!.user.id),
          columns: { interviewId: true },
        })
      ).map((f) => f.interviewId);

      pendingInterviews = allInterviews.filter(
        (iv) =>
          iv.interviewers.some((i) => i.userId === session!.user.id) &&
          !submittedInterviewIds.includes(iv.id)
      );
    }

    const conditions: any[] = [];
    if (!["ADMIN", "RECRUITER", "HIRING_MANAGER"].includes(session!.user.role)) {
      conditions.push(eq(feedbacks.submittedById, session!.user.id));
    }

    feedbackList = await db.query.feedbacks.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(feedbacks.createdAt)],
      limit: 100,
      with: {
        candidate: { columns: { id: true, firstName: true, lastName: true } },
        job: { columns: { title: true } },
        submittedBy: { columns: { name: true } },
        interview: { columns: { title: true, type: true } },
      },
    });
  } catch {
    feedbackList = [...mockFeedbacks] as any[];
    if (!["ADMIN", "RECRUITER"].includes(session!.user.role)) {
      pendingInterviews = mockInterviews.filter((iv) =>
        iv.status === "SCHEDULED" && iv.interviewers.some((i) => i.userId === session!.user.id)
      ) as any[];
    }
  }

  const isAdmin = ["ADMIN", "RECRUITER"].includes(session!.user.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feedback</h1>
          <p className="text-sm text-gray-500 mt-1">Interview feedback and evaluations</p>
        </div>
        {isAdmin && (
          <Button asChild variant="outline">
            <Link href="/feedback/templates">
              <Settings className="h-4 w-4 mr-1" />
              Manage Templates
            </Link>
          </Button>
        )}
      </div>

      {/* Pending feedback for interviewers */}
      {pendingInterviews.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <h2 className="text-sm font-semibold text-yellow-800 mb-3">
            Pending Feedback ({pendingInterviews.length})
          </h2>
          <div className="space-y-2">
            {pendingInterviews.map((iv) => (
              <div key={iv.id} className="flex items-center justify-between bg-white rounded-lg border border-yellow-200 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{iv.title}</p>
                  <p className="text-xs text-gray-500">
                    {iv.candidate?.firstName} {iv.candidate?.lastName} · {iv.job?.title}
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link href={`/feedback/submit/${iv.id}`}>Submit Feedback</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback list */}
      {feedbackList.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No feedback submitted yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {feedbackList.map((fb) => (
            <div key={fb.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/candidates/${fb.candidate?.id}`}
                      className="font-semibold text-gray-900 text-sm hover:text-blue-600"
                    >
                      {fb.candidate?.firstName} {fb.candidate?.lastName}
                    </Link>
                    <Badge variant={RECOMMENDATION_COLORS[fb.recommendation] as any}>
                      {RECOMMENDATION_LABELS[fb.recommendation]}
                    </Badge>
                    {fb.overallScore != null && (
                      <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                        <Star className="h-3 w-3" />
                        {fb.overallScore}/10
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {fb.interview?.title} · {fb.job?.title}
                  </p>
                  {fb.notes && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{fb.notes}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    By {fb.submittedBy?.name} · {formatDate(fb.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
