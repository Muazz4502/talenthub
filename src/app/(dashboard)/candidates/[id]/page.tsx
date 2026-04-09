import { auth } from "@/lib/auth";
import { db } from "@/db";
import { candidates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { mockCandidates, mockJobs, mockStages, mockInterviews, mockFeedbacks } from "@/lib/mock-data";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail, Phone, Link2, Code2, Globe, Calendar, MessageSquare,
  FileText, ArrowLeft, Star
} from "lucide-react";
import { formatDate, timeAgo, SOURCE_LABELS, RECOMMENDATION_LABELS, scoreColor } from "@/lib/utils";
import { CandidateStageSelector } from "@/components/candidates/stage-selector";

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  let candidate: any;
  try {
    candidate = await db.query.candidates.findFirst({
      where: eq(candidates.id, id),
      with: {
        job: {
          columns: { id: true, title: true },
          with: { stages: { orderBy: (s, { asc }) => [asc(s.order)] } },
        },
        stage: true,
        interviews: {
          with: {
            interviewers: { with: { user: { columns: { name: true } } } },
            feedbacks: { with: { submittedBy: { columns: { name: true } } } },
          },
          orderBy: (i, { desc }) => [desc(i.scheduledAt)],
        },
        feedbacks: {
          with: {
            submittedBy: { columns: { name: true } },
            template: { columns: { name: true } },
          },
          orderBy: (f, { desc }) => [desc(f.createdAt)],
        },
        assignments: { orderBy: (a, { desc }) => [desc(a.createdAt)] },
        referral: { with: { referrer: { columns: { name: true } } } },
        notes: {
          with: { author: { columns: { name: true } } },
          orderBy: (n, { desc }) => [desc(n.createdAt)],
        },
        stageHistory: {
          orderBy: (h, { desc }) => [desc(h.createdAt)],
          limit: 10,
        },
      },
    });
  } catch {
    const mockCandidate = (mockCandidates as unknown as any[]).find((c) => c.id === id);
    if (mockCandidate) {
      const mockJob = (mockJobs as unknown as any[]).find((j) => j.id === mockCandidate.jobId);
      const candidateStages = mockStages.filter((s) => s.jobId === mockCandidate.jobId);
      candidate = {
        ...mockCandidate,
        job: mockJob ? { id: mockJob.id, title: mockJob.title, stages: candidateStages } : null,
        stage: mockStages.find((s) => s.id === mockCandidate.stageId) ?? null,
        interviews: (mockInterviews as unknown as any[]).filter((i) => i.candidateId === id),
        feedbacks: (mockFeedbacks as unknown as any[]).filter((f) => f.candidateId === id),
        assignments: [],
        referral: null,
        notes: [],
        stageHistory: [],
      };
    }
  }

  if (!candidate) notFound();

  const canEdit = ["ADMIN", "RECRUITER", "HIRING_MANAGER"].includes(session!.user.role);
  const parsedData = candidate.aiParsedData as any;
  const scoreBreakdown = candidate.aiScoringData as any;

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/candidates" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" />
        Back to Candidates
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel: candidate info */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex flex-col items-center text-center mb-4">
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-xl font-bold text-blue-700 mb-3">
                  {candidate.firstName[0]}{candidate.lastName[0]}
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  {candidate.firstName} {candidate.lastName}
                </h2>
                {parsedData?.currentTitle && (
                  <p className="text-sm text-gray-500">{parsedData.currentTitle}</p>
                )}
                {parsedData?.currentCompany && (
                  <p className="text-xs text-gray-400">{parsedData.currentCompany}</p>
                )}
              </div>

              <div className="space-y-2.5 text-sm">
                <a href={`mailto:${candidate.email}`} className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
                  <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="truncate">{candidate.email}</span>
                </a>
                {candidate.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                    {candidate.phone}
                  </div>
                )}
                {candidate.linkedinUrl && (
                  <a href={candidate.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
                    <Link2 className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="truncate">LinkedIn Profile</span>
                  </a>
                )}
                {candidate.githubUrl && (
                  <a href={candidate.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
                    <Code2 className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="truncate">GitHub Profile</span>
                  </a>
                )}
                {candidate.websiteUrl && (
                  <a href={candidate.websiteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
                    <Globe className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="truncate">Website</span>
                  </a>
                )}
                {candidate.resumeUrl && (
                  <a href={candidate.resumeUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
                    <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                    View Resume
                  </a>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Source</span>
                  <Badge variant="secondary">{SOURCE_LABELS[candidate.source]}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Applied</span>
                  <span className="text-xs text-gray-700">{formatDate(candidate.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Job</span>
                  <Link href={`/jobs/${candidate.job?.id}`} className="text-xs text-blue-600 hover:underline truncate max-w-28">
                    {candidate.job?.title}
                  </Link>
                </div>
                {candidate.referral?.referrer && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Referred by</span>
                    <span className="text-xs text-gray-700">{candidate.referral.referrer.name}</span>
                  </div>
                )}
              </div>

              {candidate.tags && candidate.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {candidate.tags.map((tag: any) => (
                    <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Score */}
          {candidate.aiScore != null && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  AI Match Score
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`text-3xl font-bold ${scoreColor(candidate.aiScore)}`}>
                    {candidate.aiScore}
                  </div>
                  <div className="text-xs text-gray-500">/ 100</div>
                </div>
                {scoreBreakdown && (
                  <div className="space-y-1.5">
                    {Object.entries(scoreBreakdown).map(([key, val]: [string, any]) => (
                      <div key={key} className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                        <span className="font-medium">{val}/100</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Stage Selector */}
          {canEdit && candidate.job?.stages && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Pipeline Stage</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CandidateStageSelector
                  candidateId={candidate.id}
                  currentStageId={candidate.stageId}
                  stages={candidate.job.stages}
                />
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          {canEdit && (
            <div className="space-y-2">
              <Button asChild variant="outline" className="w-full" size="sm">
                <Link href={`/interviews/schedule?candidateId=${candidate.id}`}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Interview
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full" size="sm">
                <Link href={`/feedback?candidateId=${candidate.id}`}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add Feedback
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Right panel: tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="timeline">
            <TabsList>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="interviews">Interviews ({candidate.interviews.length})</TabsTrigger>
              <TabsTrigger value="feedback">Feedback ({candidate.feedbacks.length})</TabsTrigger>
              <TabsTrigger value="notes">Notes ({candidate.notes.length})</TabsTrigger>
              {parsedData && <TabsTrigger value="profile">AI Profile</TabsTrigger>}
            </TabsList>

            {/* Timeline */}
            <TabsContent value="timeline" className="mt-4">
              <div className="space-y-3">
                {candidate.stageHistory.map((event: any, i: number) => (
                  <div key={event.id} className="flex gap-3 text-sm">
                    <div className="relative flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5" />
                      {i < candidate.stageHistory.length - 1 && (
                        <div className="w-px flex-1 bg-gray-200 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-3">
                      <p className="text-gray-700">
                        Moved to stage{" "}
                        {event.toStageId ? (
                          <span className="font-medium">{candidate.job?.stages?.find((s: any) => s.id === event.toStageId)?.name ?? "Unknown"}</span>
                        ) : "Removed from stage"}
                      </p>
                      {event.note && <p className="text-xs text-gray-500 mt-0.5">{event.note}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">{timeAgo(event.createdAt)}</p>
                    </div>
                  </div>
                ))}
                {candidate.stageHistory.length === 0 && (
                  <p className="text-sm text-gray-500">No stage changes recorded.</p>
                )}
              </div>
            </TabsContent>

            {/* Interviews */}
            <TabsContent value="interviews" className="mt-4">
              <div className="space-y-3">
                {candidate.interviews.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No interviews scheduled.</p>
                    {canEdit && (
                      <Button asChild size="sm" className="mt-3">
                        <Link href={`/interviews/schedule?candidateId=${candidate.id}`}>
                          Schedule Interview
                        </Link>
                      </Button>
                    )}
                  </div>
                ) : (
                  candidate.interviews.map((interview: any) => (
                    <Card key={interview.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{interview.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {interview.scheduledAt
                                ? formatDate(interview.scheduledAt)
                                : "Not scheduled"}{" "}
                              · {interview.durationMinutes} min
                            </p>
                            {interview.interviewers.length > 0 && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                with{" "}
                                {interview.interviewers.map((ii: any) => ii.user.name).join(", ")}
                              </p>
                            )}
                          </div>
                          <Badge variant={
                            interview.status === "COMPLETED" ? "success" :
                            interview.status === "CANCELLED" ? "destructive" :
                            "secondary"
                          }>
                            {interview.status}
                          </Badge>
                        </div>
                        {interview.meetingUrl && (
                          <a
                            href={interview.meetingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                          >
                            Join Meeting
                          </a>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Feedback */}
            <TabsContent value="feedback" className="mt-4">
              <div className="space-y-3">
                {candidate.feedbacks.length === 0 ? (
                  <p className="text-sm text-gray-500">No feedback submitted yet.</p>
                ) : (
                  candidate.feedbacks.map((fb: any) => (
                    <Card key={fb.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {fb.submittedBy?.name}
                            </p>
                            {fb.template?.name && (
                              <p className="text-xs text-gray-400">{fb.template.name}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-0.5">
                              {formatDate(fb.createdAt)}
                            </p>
                          </div>
                          {fb.recommendation && (
                            <Badge variant={
                              fb.recommendation === "STRONG_YES" || fb.recommendation === "YES" ? "success" :
                              fb.recommendation === "NO" || fb.recommendation === "STRONG_NO" ? "destructive" :
                              "secondary"
                            }>
                              {RECOMMENDATION_LABELS[fb.recommendation]}
                            </Badge>
                          )}
                        </div>
                        {fb.notes && (
                          <p className="text-xs text-gray-600 mt-2 border-t border-gray-100 pt-2">{fb.notes}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Notes */}
            <TabsContent value="notes" className="mt-4">
              <div className="space-y-4">
                <AddNoteForm candidateId={candidate.id} />
                {candidate.notes.map((note: any) => (
                  <div key={note.id} className="flex gap-3">
                    <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 shrink-0">
                      {note.author?.name?.[0] ?? "?"}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-700">{note.author?.name}</span>
                        <span className="text-xs text-gray-400">{timeAgo(note.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{note.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* AI Profile */}
            {parsedData && (
              <TabsContent value="profile" className="mt-4">
                <div className="space-y-4">
                  {parsedData.skills?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {parsedData.skills.map((skill: string) => (
                          <Badge key={skill} variant="secondary">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {parsedData.workHistory?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Experience</h4>
                      <div className="space-y-2">
                        {parsedData.workHistory.map((job: any, i: number) => (
                          <div key={i} className="text-sm">
                            <p className="font-medium text-gray-900">{job.title} at {job.company}</p>
                            {job.duration && <p className="text-xs text-gray-400">{job.duration}</p>}
                            {job.description && <p className="text-xs text-gray-600 mt-0.5">{job.description}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {parsedData.education?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Education</h4>
                      <div className="space-y-2">
                        {parsedData.education.map((edu: any, i: number) => (
                          <div key={i} className="text-sm">
                            <p className="font-medium text-gray-900">{edu.degree} in {edu.field}</p>
                            <p className="text-xs text-gray-400">{edu.institution} · {edu.year}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}

async function AddNoteForm({ candidateId }: { candidateId: string }) {
  async function addNote(formData: FormData) {
    "use server";
    const content = formData.get("content") as string;
    if (!content?.trim()) return;
    const { auth } = await import("@/lib/auth");
    const { db } = await import("@/db");
    const { candidateNotes } = await import("@/db/schema");
    const session = await auth();
    if (!session?.user) return;
    await db.insert(candidateNotes).values({
      candidateId,
      authorId: session.user.id,
      content,
    });
    const { revalidatePath } = await import("next/cache");
    revalidatePath(`/candidates/${candidateId}`);
  }

  return (
    <form action={addNote} className="flex gap-2">
      <textarea
        name="content"
        rows={2}
        placeholder="Add a note..."
        className="flex-1 text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />
      <Button type="submit" size="sm">Add</Button>
    </form>
  );
}
