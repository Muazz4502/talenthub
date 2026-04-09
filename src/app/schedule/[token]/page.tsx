"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, CheckCircle, Clock } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface InterviewData {
  id: string;
  title: string;
  type: string;
  durationMinutes: number;
  status: string;
  scheduledAt: string | null;
  job: { title: string } | null;
  interviewers: { user: { name: string | null } }[];
}

// Generate available time slots (next 7 days, business hours)
function generateSlots(durationMinutes: number): Date[] {
  const slots: Date[] = [];
  const now = new Date();
  const cutoff = new Date(now.getTime() + 2 * 60 * 60 * 1000); // minimum 2h from now

  for (let day = 1; day <= 7; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() + day);
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    for (let hour = 9; hour <= 17; hour++) {
      const slot = new Date(date);
      slot.setHours(hour, 0, 0, 0);
      if (slot > cutoff) slots.push(slot);
    }
  }

  return slots;
}

export default function SelfSchedulePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [error, setError] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [success, setSuccess] = useState(false);

  // The interview ID is encoded in the token path — but the token IS the ID-token combo
  // We search by token via the API
  useEffect(() => {
    // The token URL param is the interview's selfScheduleToken
    // We need to find the interview by token — use a public API endpoint
    fetch(`/api/public/schedule?token=${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setInterview(d.data);
      })
      .catch(() => setError("Failed to load interview details"))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async () => {
    if (!selectedSlot || !interview) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/interviews/${interview.id}/self-schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, scheduledAt: selectedSlot.toISOString() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message ?? "Failed to confirm slot");
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
          <p className="text-red-600 font-medium">{error}</p>
          <p className="text-sm text-gray-500 mt-1">This link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Interview Confirmed!</h2>
          <p className="text-sm text-gray-500">
            Your interview has been scheduled for{" "}
            <strong>{selectedSlot ? formatDateTime(selectedSlot) : ""}</strong>. You'll receive a
            confirmation email with the details.
          </p>
        </div>
      </div>
    );
  }

  if (interview?.status === "SCHEDULED" && interview.scheduledAt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <Calendar className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Already Scheduled</h2>
          <p className="text-sm text-gray-500">
            This interview is already scheduled for{" "}
            <strong>{formatDateTime(new Date(interview.scheduledAt))}</strong>.
          </p>
        </div>
      </div>
    );
  }

  const slots = interview ? generateSlots(interview.durationMinutes) : [];

  // Group by date
  const slotsByDate = slots.reduce(
    (acc, slot) => {
      const key = slot.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
      if (!acc[key]) acc[key] = [];
      acc[key].push(slot);
      return acc;
    },
    {} as Record<string, Date[]>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h1 className="text-xl font-bold text-gray-900">{interview?.title}</h1>
            {interview?.job && (
              <p className="text-sm text-gray-500 mt-0.5">{interview.job.title}</p>
            )}
            <div className="flex items-center gap-3 mt-3">
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3.5 w-3.5" />
                {interview?.durationMinutes} minutes
              </span>
              {interview?.interviewers.length ? (
                <span className="text-xs text-gray-500">
                  With: {interview.interviewers.map((i) => i.user.name).join(", ")}
                </span>
              ) : null}
            </div>
          </div>

          <div className="p-6">
            <p className="text-sm font-medium text-gray-700 mb-4">Select a time that works for you:</p>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {Object.entries(slotsByDate).map(([date, daySlots]) => (
                <div key={date}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{date}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {daySlots.map((slot) => (
                      <button
                        key={slot.toISOString()}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 px-3 rounded-lg text-sm border transition-colors ${
                          selectedSlot?.toISOString() === slot.toISOString()
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                        }`}
                      >
                        {slot.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedSlot && (
            <div className="p-6 pt-0">
              <div className="bg-blue-50 rounded-lg p-3 mb-4 text-sm text-blue-700">
                Selected: <strong>{formatDateTime(selectedSlot)}</strong>
              </div>
              <Button onClick={handleSubmit} disabled={submitting} className="w-full">
                {submitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Confirm This Time
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
