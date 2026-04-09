import { auth } from "@/lib/auth";
import { db } from "@/db";
import { candidates, jobs, pipelineStages } from "@/db/schema";
import { eq, and, like, or, desc, count } from "drizzle-orm";
import { mockCandidates, mockJobs } from "@/lib/mock-data";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Upload, Search } from "lucide-react";
import { formatDate, SOURCE_LABELS, scoreBg } from "@/lib/utils";

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    jobId?: string;
    source?: string;
    archived?: string;
    page?: string;
  }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const search = params.search ?? "";
  const jobId = params.jobId;
  const source = params.source;
  const archived = params.archived === "true";
  const page = parseInt(params.page ?? "1");
  const limit = 25;
  const offset = (page - 1) * limit;

  const conditions = [eq(candidates.archived, archived)];
  if (jobId) conditions.push(eq(candidates.jobId, jobId));
  if (source) conditions.push(eq(candidates.source, source as any));
  if (search) {
    conditions.push(
      or(
        like(candidates.firstName, `%${search}%`),
        like(candidates.lastName, `%${search}%`),
        like(candidates.email, `%${search}%`)
      )!
    );
  }

  let candidateList: any[];
  let total: number;
  let allJobs: { id: string; title: string }[];

  try {
    [candidateList, [{ total }], allJobs] = await Promise.all([
      db.query.candidates.findMany({
        where: and(...conditions),
        orderBy: [desc(candidates.createdAt)],
        limit,
        offset,
        with: {
          job: { columns: { title: true } },
          stage: { columns: { name: true } },
        },
      }),
      db.select({ total: count() }).from(candidates).where(and(...conditions)),
      db.query.jobs.findMany({
        where: (j, { ne }) => ne(j.status, "CLOSED"),
        columns: { id: true, title: true },
      }),
    ]);
  } catch {
    let filtered = [...mockCandidates] as any[];
    if (jobId) filtered = filtered.filter((c) => c.jobId === jobId);
    if (source) filtered = filtered.filter((c) => c.source === source);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (c) => c.firstName.toLowerCase().includes(q) || c.lastName.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
      );
    }
    if (!archived) filtered = filtered.filter((c) => !c.archived);
    candidateList = filtered.slice(offset, offset + limit);
    total = filtered.length;
    allJobs = (mockJobs as unknown as any[]).filter((j) => j.status !== "CLOSED").map((j: any) => ({ id: j.id, title: j.title }));
  }

  const canAdd = ["ADMIN", "RECRUITER", "HIRING_MANAGER"].includes(session!.user.role);
  const totalPages = Math.ceil(total / limit);

  const sources = ["WEBSITE", "LINKEDIN", "MANUAL", "BULK_UPLOAD", "REFERRAL"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
          <p className="text-sm text-gray-500 mt-1">{total} total candidates</p>
        </div>
        {canAdd && (
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/candidates/bulk-upload">
                <Upload className="h-4 w-4 mr-1" />
                Bulk Upload
              </Link>
            </Button>
            <Button asChild>
              <Link href="/candidates/new">
                <Plus className="h-4 w-4 mr-1" />
                Add Candidate
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <form className="flex gap-3 flex-wrap items-center" method="get">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            name="search"
            defaultValue={search}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          name="jobId"
          defaultValue={jobId ?? ""}
          className="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Jobs</option>
          {allJobs.map((j) => (
            <option key={j.id} value={j.id}>{j.title}</option>
          ))}
        </select>
        <select
          name="source"
          defaultValue={source ?? ""}
          className="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Sources</option>
          {sources.map((s) => (
            <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
          ))}
        </select>
        <Button type="submit" variant="outline" size="sm">Filter</Button>
        {(search || jobId || source) && (
          <Button asChild variant="ghost" size="sm">
            <Link href="/candidates">Clear</Link>
          </Button>
        )}
      </form>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Candidate</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">Job</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden lg:table-cell">Stage</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Source</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Score</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden lg:table-cell">Applied</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {candidateList.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <p className="text-sm text-gray-500">No candidates found.</p>
                  {canAdd && (
                    <Button asChild size="sm" className="mt-3">
                      <Link href="/candidates/new">Add first candidate</Link>
                    </Button>
                  )}
                </td>
              </tr>
            ) : (
              candidateList.map((candidate) => (
                <tr key={candidate.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/candidates/${candidate.id}`} className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700 shrink-0">
                        {candidate.firstName[0]}{candidate.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 hover:text-blue-600">
                          {candidate.firstName} {candidate.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{candidate.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-gray-600 text-xs">{candidate.job?.title ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <Badge variant="secondary">{candidate.stage?.name ?? "Unstaged"}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{SOURCE_LABELS[candidate.source]}</Badge>
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
                  <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">
                    {formatDate(candidate.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {offset + 1}–{Math.min(offset + limit, total)} of {total}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/candidates?page=${page - 1}${search ? `&search=${search}` : ""}${jobId ? `&jobId=${jobId}` : ""}`}>
                  Previous
                </Link>
              </Button>
            )}
            {page < totalPages && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/candidates?page=${page + 1}${search ? `&search=${search}` : ""}${jobId ? `&jobId=${jobId}` : ""}`}>
                  Next
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
