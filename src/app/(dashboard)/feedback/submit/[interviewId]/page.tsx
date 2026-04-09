"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Send } from "lucide-react";

interface Interview {
  id: string;
  title: string;
  type: string;
  candidate: { id: string; firstName: string; lastName: string } | null;
  job: { id: string; title: string } | null;
}

const DEFAULT_FIELDS = [
  { key: "technical_skills", label: "Technical Skills", type: "rating" },
  { key: "communication", label: "Communication", type: "rating" },
  { key: "problem_solving", label: "Problem Solving", type: "rating" },
  { key: "culture_fit", label: "Culture Fit", type: "rating" },
];

export default function SubmitFeedbackPage() {
  const { interviewId } = useParams<{ interviewId: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [recommendation, setRecommendation] = useState("");
  const [overallScore, setOverallScore] = useState("");
  const [notes, setNotes] = useState("");
  const [fieldValues, setFieldValues] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch(`/api/interviews/${interviewId}`)
      .then((r) => r.json())
      .then((d) => setInterview(d.data))
      .finally(() => setLoading(false));
  }, [interviewId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recommendation) {
      toast({ title: "Please select a recommendation", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewId,
          candidateId: interview?.candidate?.id,
          jobId: interview?.job?.id,
          recommendation,
          overallScore: overallScore ? parseInt(overallScore) : undefined,
          fields: fieldValues,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({ title: "Feedback submitted!", variant: "default" as any });
      router.push("/feedback");
    } catch (err: any) {
      toast({ title: err.message ?? "Failed to submit", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!interview) {
    return <p className="text-center text-gray-500 py-16">Interview not found.</p>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Submit Feedback</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {interview.title} — {interview.candidate?.firstName} {interview.candidate?.lastName}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <p className="text-sm text-gray-600">
          <strong>Candidate:</strong> {interview.candidate?.firstName} {interview.candidate?.lastName}
          {interview.job && <> &nbsp;·&nbsp; <strong>Role:</strong> {interview.job.title}</>}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Ratings */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Skill Ratings (1–10)</h3>
          <div className="grid grid-cols-2 gap-4">
            {DEFAULT_FIELDS.map((field) => (
              <div key={field.key} className="grid gap-1.5">
                <Label>{field.label}</Label>
                <Select
                  value={String(fieldValues[field.key] ?? "")}
                  onValueChange={(v) =>
                    setFieldValues((prev) => ({ ...prev, [field.key]: parseInt(v) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Rate 1-10" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <SelectItem key={n} value={String(n)}>{n} — {
                        n <= 3 ? "Poor" : n <= 5 ? "Below Average" : n <= 7 ? "Good" : n <= 9 ? "Very Good" : "Excellent"
                      }</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label>Overall Score (1–10)</Label>
            <Select value={overallScore} onValueChange={setOverallScore}>
              <SelectTrigger>
                <SelectValue placeholder="Select overall score" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Recommendation *</Label>
            <Select value={recommendation} onValueChange={setRecommendation}>
              <SelectTrigger>
                <SelectValue placeholder="Select recommendation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STRONG_YES">Strong Yes — Exceptional candidate</SelectItem>
                <SelectItem value="YES">Yes — Good fit</SelectItem>
                <SelectItem value="MAYBE">Maybe — Mixed signals</SelectItem>
                <SelectItem value="NO">No — Not a fit</SelectItem>
                <SelectItem value="STRONG_NO">Strong No — Clear misalignment</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="notes">Detailed Notes</Label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            placeholder="Describe the candidate's performance, strengths, concerns, and any other observations..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Submit Feedback
          </Button>
        </div>
      </form>
    </div>
  );
}
