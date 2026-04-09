import { auth } from "@/lib/auth";
import { db } from "@/db";
import { jobs, candidates } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { mockJobs, mockCandidates, mockStages } from "@/lib/mock-data";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, MapPin, Users, Calendar, ExternalLink, Plus } from "lucide-react";
import {
  JOB_STATUS_LABELS,
  LOCATION_TYPE_LABELS,
  formatDate,
  SOURCE_LABELS,
  scoreBg,
} from "@/lib/utils";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  let job: any;
  let jobCandidates: any[];

  try {
    job = await db.query.jobs.findFirst({
      where: eq(jobs.id, id),
      with: {
        owner: { columns: { id: true, name: true, email: true } },
        stages: { orderBy: (s, { asc }) => [asc(s.order)] },
        formConfig: true,
      },
    });

    if (!job) notFound();

    jobCandidates = await db.query.candidates.findMany({
      where: and(eq(candidates.jobId, id), eq(candidates.archived, false)),
      with: {
        stage: { columns: { name: true } },
      },
      orderBy: (c, { desc }) => [desc(c.createdAt)],
    });
  } catch {
    const mockJob = (mockJobs as unknown as any[]).find((j) => j.id === id);
    if (!mockJob) notFound();
    job = { ...mockJob, stages: mockStages.filter((s) => s.jobId === id), formConfig: null };
    jobCandidates = (mockCandidates as unknown as any[]).filter((c) => c.jobId === id && !c.archived);
  }

  const canEdit = ["ADMIN", "RECRUITER", "HIRING_MANAGER"].includes(session!.user.role);

  // Group candidates by stage
  const candidatesByStage = job.stages.reduce((acc: Record<string, any[]>, stage: any) => {
    acc[stage.id] = jobCandidates.filter((c: any) => c.stageId === stage.id);
    return acc;
  }, {} as Record<string, any[]>);

  const STATUS_BADGE: Record<string, "success" | "secondary" | "outline" | "warning"> = {
    OPEN: "success",
    PAUSED: "warning",
    DRAFT: "outline",
    CLOSED: "secondary",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
            <Badge variant={STATUS_BADGE[job.status] ?? "secondary"}>
              {JOB_STATUS_LABELS[job.status]}
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
              {jobCandidates.length} candidates
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Posted {formatDate(job.createdAt)}
            </span>
            {job.owner?.name && <span>by {job.owner.name}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {job.applicationUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={`/careers/${job.applicationUrl}`} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                Apply Link
              </a>
            </Button>
          )}
          {canEdit && (
            <Button asChild size="sm">
              <Link href={`/jobs/${id}/edit`}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pipeline">
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="candidates">All Candidates ({jobCandidates.length})</TabsTrigger>
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="form">Application Form</TabsTrigger>
        </TabsList>

        {/* Pipeline (Kanban) */}
        <TabsContent value="pipeline" className="mt-4">
          <div className="flex gap-4 overflow-x-auto pb-4">
            {job.stages.map((stage: any) => {
              const stageCandidates = candidatesByStage[stage.id] ?? [];
              return (
                <div key={stage.id} className="w-64 shrink-0">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      {stage.name}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 font-medium">
                      {stageCandidates.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {stageCandidates.map((candidate: any) => (
                      <Link key={candidate.id} href={`/candidates/${candidate.id}`}>
                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {candidate.firstName} {candidate.lastName}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {SOURCE_LABELS[candidate.source]}
                                </p>
                              </div>
                              {candidate.aiScore != null && (
                                <span className={`text-xs px-1.5 py-0.5 rounded font-bold shrink-0 ${scoreBg(candidate.aiScore)}`}>
                                  {candidate.aiScore}
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                    {stageCandidates.length === 0 && (
                      <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                        <p className="text-xs text-gray-400">No candidates</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4">
            <Button asChild size="sm">
              <Link href={`/candidates/new?jobId=${id}`}>
                <Plus className="h-4 w-4 mr-1" />
                Add Candidate
              </Link>
            </Button>
          </div>
        </TabsContent>

        {/* All Candidates table */}
        <TabsContent value="candidates" className="mt-4">
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Candidate</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Stage</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Source</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">AI Score</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Applied</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {jobCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                      No candidates yet.{" "}
                      <Link href={`/candidates/new?jobId=${id}`} className="text-blue-600 hover:underline">
                        Add the first one
                      </Link>
                    </td>
                  </tr>
                ) : (
                  jobCandidates.map((candidate) => (
                    <tr key={candidate.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link href={`/candidates/${candidate.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                          {candidate.firstName} {candidate.lastName}
                        </Link>
                        <p className="text-xs text-gray-500">{candidate.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-600">
                          {candidate.stage?.name ?? "Unstaged"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">{SOURCE_LABELS[candidate.source]}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {candidate.aiScore != null ? (
                          <span className={`text-xs px-2 py-0.5 rounded font-bold ${scoreBg(candidate.aiScore)}`}>
                            {candidate.aiScore}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {formatDate(candidate.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Description */}
        <TabsContent value="description" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                {job.description}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Application Form */}
        <TabsContent value="form" className="mt-4">
          <Card>
            <CardContent className="p-6">
              {!job.formConfig?.fields?.length ? (
                <p className="text-sm text-gray-500">
                  No custom fields configured.{" "}
                  {canEdit && (
                    <Link href={`/jobs/${id}/edit`} className="text-blue-600 hover:underline">
                      Add fields
                    </Link>
                  )}
                </p>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    {job.formConfig.fields.length} fields in this form.
                  </p>
                  {(job.formConfig.fields as any[]).map((q: any, i: number) => (
                    <div key={q.id ?? i} className="border-b border-gray-100 pb-3 last:border-0">
                      <p className="text-sm font-medium text-gray-900">
                        {i + 1}. {q.label}
                        {q.required && <span className="text-red-500 ml-1">*</span>}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{q.type.replace(/_/g, " ")}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
