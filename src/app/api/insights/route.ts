import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { candidates, jobs, interviews, feedbacks, pipelineStages, candidateStageHistory, referrals } from "@/db/schema";
import { eq, and, count, avg, gte, lte, desc, sql } from "drizzle-orm";
import { mockJobs, mockCandidates, mockInterviews, mockFeedbacks, mockStages, mockReferrals } from "@/lib/mock-data";

const MOCK_INSIGHTS = {
  overview: {
    totalJobs: mockJobs.length,
    openJobs: mockJobs.filter((j) => j.status === "OPEN").length,
    totalCandidates: mockCandidates.filter((c) => !c.archived).length,
    newCandidates: mockCandidates.length,
    totalInterviews: mockInterviews.length,
    completedInterviews: mockInterviews.filter((i) => i.status === "COMPLETED").length,
    avgAiScore: (mockCandidates.reduce((s, c) => s + (c.aiScore ?? 0), 0) / mockCandidates.length).toFixed(1),
    hiredThisMonth: 1,
    totalReferrals: mockReferrals.length,
    referralsHired: 0,
    avgTimeToHireDays: "21.0",
  },
  pipelineFunnel: mockStages
    .filter((s) => s.jobId === "j1")
    .map((s) => ({ stage: s.name, count: mockCandidates.filter((c) => c.stageId === s.id).length })),
  sourceBreakdown: ["LINKEDIN", "WEBSITE", "REFERRAL", "MANUAL"].map((src) => ({
    source: src,
    count: mockCandidates.filter((c) => c.source === src).length,
  })).filter((s) => s.count > 0),
  feedbackBreakdown: mockFeedbacks.map((f) => ({ recommendation: f.recommendation, count: 1 })),
};

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "RECRUITER", "HIRING_MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") ?? "30"; // days
  const since = new Date();
  since.setDate(since.getDate() - parseInt(range));

  try {
    const [
      totalJobs,
      openJobs,
      totalCandidates,
      newCandidates,
      totalInterviews,
      completedInterviews,
      avgScore,
      candidatesBySource,
      candidatesByStage,
      hiredThisMonth,
      totalReferrals,
      referralsHired,
      recentFeedback,
      offerAcceptanceData,
    ] = await Promise.all([
      db.select({ count: count() }).from(jobs),
      db.select({ count: count() }).from(jobs).where(eq(jobs.status, "OPEN")),
      db.select({ count: count() }).from(candidates).where(eq(candidates.archived, false)),
      db.select({ count: count() }).from(candidates).where(gte(candidates.createdAt, since)),
      db.select({ count: count() }).from(interviews),
      db
        .select({ count: count() })
        .from(interviews)
        .where(and(eq(interviews.status, "COMPLETED"), gte(interviews.scheduledAt!, since))),
      db
        .select({ avg: avg(candidates.aiScore) })
        .from(candidates)
        .where(and(eq(candidates.archived, false), sql`${candidates.aiScore} IS NOT NULL`)),
      db
        .select({ source: candidates.source, count: count() })
        .from(candidates)
        .where(eq(candidates.archived, false))
        .groupBy(candidates.source),
      db
        .select({
          stageId: candidates.stageId,
          stageName: pipelineStages.name,
          stageOrder: pipelineStages.order,
          count: count(),
        })
        .from(candidates)
        .leftJoin(pipelineStages, eq(candidates.stageId, pipelineStages.id))
        .where(eq(candidates.archived, false))
        .groupBy(candidates.stageId, pipelineStages.name, pipelineStages.order),
      db
        .select({ count: count() })
        .from(candidates)
        .where(
          and(
            gte(candidates.createdAt, new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
            sql`EXISTS (SELECT 1 FROM ${pipelineStages} ps WHERE ps.id = ${candidates.stageId} AND ps.name = 'Hired')`
          )
        ),
      db.select({ count: count() }).from(referrals),
      db.select({ count: count() }).from(referrals).where(eq(referrals.status, "HIRED")),
      db
        .select({ recommendation: feedbacks.recommendation, count: count() })
        .from(feedbacks)
        .where(gte(feedbacks.createdAt, since))
        .groupBy(feedbacks.recommendation),
      db
        .select({ avg: avg(sql`EXTRACT(EPOCH FROM (${candidateStageHistory.movedAt} - ${candidates.createdAt})) / 86400`) })
        .from(candidateStageHistory)
        .innerJoin(candidates, eq(candidateStageHistory.candidateId, candidates.id))
        .innerJoin(pipelineStages, eq(candidateStageHistory.toStageId, pipelineStages.id))
        .where(eq(pipelineStages.name, "Hired")),
    ]);

    const stagesSorted = candidatesByStage
      .filter((s) => s.stageName)
      .sort((a, b) => (a.stageOrder ?? 0) - (b.stageOrder ?? 0));

    return NextResponse.json({
      data: {
        overview: {
          totalJobs: totalJobs[0].count,
          openJobs: openJobs[0].count,
          totalCandidates: totalCandidates[0].count,
          newCandidates: newCandidates[0].count,
          totalInterviews: totalInterviews[0].count,
          completedInterviews: completedInterviews[0].count,
          avgAiScore: avgScore[0].avg ? parseFloat(String(avgScore[0].avg)).toFixed(1) : null,
          hiredThisMonth: hiredThisMonth[0].count,
          totalReferrals: totalReferrals[0].count,
          referralsHired: referralsHired[0].count,
          avgTimeToHireDays: offerAcceptanceData[0].avg
            ? parseFloat(String(offerAcceptanceData[0].avg)).toFixed(1)
            : null,
        },
        pipelineFunnel: stagesSorted.map((s) => ({ stage: s.stageName, count: s.count })),
        sourceBreakdown: candidatesBySource.map((s) => ({ source: s.source, count: s.count })),
        feedbackBreakdown: recentFeedback.map((f) => ({ recommendation: f.recommendation, count: f.count })),
      },
    });
  } catch {
    return NextResponse.json({ data: MOCK_INSIGHTS });
  }
}
