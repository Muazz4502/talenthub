"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Star, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Survey {
  id: string;
  submittedAt: string | null;
  candidate: { firstName: string } | null;
  job: { title: string } | null;
}

function StarRating({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={`h-7 w-7 ${
                (hover || value) >= star ? "fill-amber-400 text-amber-400" : "text-gray-300"
              }`}
            />
          </button>
        ))}
        {value > 0 && (
          <span className="ml-2 text-sm text-gray-500 self-center">
            {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][value]}
          </span>
        )}
      </div>
    </div>
  );
}

export default function SurveyPage() {
  const { token } = useParams<{ token: string }>();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [overallRating, setOverallRating] = useState(0);
  const [processRating, setProcessRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");

  useEffect(() => {
    fetch(`/api/public/survey?token=${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else {
          setSurvey(d.data);
          if (d.data.submittedAt) setSuccess(true);
        }
      })
      .catch(() => setError("Failed to load survey"))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!overallRating || !processRating || !communicationRating) {
      toast({ title: "Please rate all categories", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/public/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          overallRating,
          processRating,
          communicationRating,
          feedback: feedbackText,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(true);
    } catch (err: any) {
      toast({ title: err.message ?? "Failed to submit", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-sm text-gray-500">
            Your feedback has been submitted. We appreciate you taking the time to share your
            experience with our hiring process.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900">Candidate Experience Survey</h1>
            {survey?.candidate && survey?.job && (
              <p className="text-sm text-gray-500 mt-1">
                Hi {survey.candidate.firstName}! Please share your experience applying for{" "}
                <strong>{survey.job.title}</strong>.
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <StarRating
              value={overallRating}
              onChange={setOverallRating}
              label="Overall experience with our hiring process *"
            />

            <StarRating
              value={processRating}
              onChange={setProcessRating}
              label="Interview process quality *"
            />

            <StarRating
              value={communicationRating}
              onChange={setCommunicationRating}
              label="Communication and responsiveness *"
            />

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Any additional feedback or suggestions?
              </label>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={4}
                placeholder="What went well? What could we improve?"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Feedback
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
