"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  FunnelChart,
  Funnel,
  LabelList,
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingUp, Users, Briefcase, Calendar, Star, Clock, Gift } from "lucide-react";
import { SOURCE_LABELS } from "@/lib/utils";

interface InsightsData {
  overview: {
    totalJobs: number;
    openJobs: number;
    totalCandidates: number;
    newCandidates: number;
    totalInterviews: number;
    completedInterviews: number;
    avgAiScore: string | null;
    hiredThisMonth: number;
    totalReferrals: number;
    referralsHired: number;
    avgTimeToHireDays: string | null;
  };
  pipelineFunnel: { stage: string; count: number }[];
  sourceBreakdown: { source: string; count: number }[];
  feedbackBreakdown: { recommendation: string; count: number }[];
}

const SOURCE_COLORS: Record<string, string> = {
  MANUAL: "#3b82f6",
  LINKEDIN: "#0ea5e9",
  WEBSITE: "#8b5cf6",
  REFERRAL: "#10b981",
  BULK_UPLOAD: "#f59e0b",
};

const RECOMMENDATION_COLORS: Record<string, string> = {
  STRONG_YES: "#10b981",
  YES: "#3b82f6",
  MAYBE: "#f59e0b",
  NO: "#ef4444",
  STRONG_NO: "#dc2626",
};

const RECOMMENDATION_LABELS: Record<string, string> = {
  STRONG_YES: "Strong Yes",
  YES: "Yes",
  MAYBE: "Maybe",
  NO: "No",
  STRONG_NO: "Strong No",
};

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "blue",
}: {
  icon: any;
  label: string;
  value: string | number | null;
  sub?: string;
  color?: string;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    amber: "bg-amber-50 text-amber-600",
    teal: "bg-teal-50 text-teal-600",
    rose: "bg-rose-50 text-rose-600",
  };
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value ?? "—"}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const [range, setRange] = useState("30");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InsightsData | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/insights?range=${range}`)
      .then((r) => r.json())
      .then((d) => setData(d.data))
      .finally(() => setLoading(false));
  }, [range]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Insights</h1>
          <p className="text-sm text-gray-500 mt-1">Hiring analytics and pipeline health</p>
        </div>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Briefcase} label="Open Jobs" value={data.overview.openJobs} sub={`${data.overview.totalJobs} total`} color="blue" />
            <StatCard icon={Users} label="Active Candidates" value={data.overview.totalCandidates} sub={`+${data.overview.newCandidates} new`} color="purple" />
            <StatCard icon={Calendar} label="Interviews Completed" value={data.overview.completedInterviews} sub={`${data.overview.totalInterviews} total`} color="teal" />
            <StatCard icon={TrendingUp} label="Hired This Month" value={data.overview.hiredThisMonth} color="green" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Star} label="Avg AI Score" value={data.overview.avgAiScore ? `${data.overview.avgAiScore}/100` : null} color="amber" />
            <StatCard icon={Clock} label="Avg Time to Hire" value={data.overview.avgTimeToHireDays ? `${data.overview.avgTimeToHireDays} days` : null} color="blue" />
            <StatCard icon={Gift} label="Total Referrals" value={data.overview.totalReferrals} sub={`${data.overview.referralsHired} hired`} color="rose" />
            <StatCard icon={Users} label="Referral Hire Rate" value={data.overview.totalReferrals > 0 ? `${Math.round((data.overview.referralsHired / data.overview.totalReferrals) * 100)}%` : "—"} color="green" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pipeline Funnel */}
            {data.pipelineFunnel.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Pipeline Funnel</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.pipelineFunnel} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="stage" type="category" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Source Breakdown */}
            {data.sourceBreakdown.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Candidates by Source</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={data.sourceBreakdown}
                      dataKey="count"
                      nameKey="source"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ source, percent }) =>
                        `${SOURCE_LABELS[source] ?? source} (${(percent * 100).toFixed(0)}%)`
                      }
                      labelLine={false}
                    >
                      {data.sourceBreakdown.map((entry, index) => (
                        <Cell
                          key={entry.source}
                          fill={SOURCE_COLORS[entry.source] ?? `hsl(${index * 60}, 70%, 50%)`}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, name) => [v, SOURCE_LABELS[name as string] ?? name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Feedback breakdown */}
            {data.feedbackBreakdown.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Feedback Recommendations</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.feedbackBreakdown.map((f) => ({ ...f, label: RECOMMENDATION_LABELS[f.recommendation] ?? f.recommendation }))}>
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {data.feedbackBreakdown.map((entry) => (
                        <Cell
                          key={entry.recommendation}
                          fill={RECOMMENDATION_COLORS[entry.recommendation] ?? "#6b7280"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-500 py-16">Failed to load insights.</p>
      )}
    </div>
  );
}
