"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Send } from "lucide-react";

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  jobId: string;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

const INTERVIEW_TYPES = [
  { value: "PHONE_SCREEN", label: "Phone Screen" },
  { value: "TECHNICAL", label: "Technical" },
  { value: "BEHAVIORAL", label: "Behavioral" },
  { value: "SYSTEM_DESIGN", label: "System Design" },
  { value: "FINAL", label: "Final Round" },
  { value: "HR", label: "HR" },
];

export default function ScheduleInterviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const candidateIdParam = searchParams.get("candidateId") ?? "";

  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [interviewers, setInterviewers] = useState<User[]>([]);
  const [selectedInterviewers, setSelectedInterviewers] = useState<string[]>([]);
  const [selfSchedule, setSelfSchedule] = useState(false);

  const [form, setForm] = useState({
    candidateId: candidateIdParam,
    title: "",
    type: "TECHNICAL",
    scheduledAt: "",
    durationMinutes: "60",
    location: "",
    meetingUrl: "",
    notes: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/candidates?limit=200").then((r) => r.json()),
      fetch("/api/users?role=INTERVIEWER,HIRING_MANAGER,ADMIN").then((r) => r.json()),
    ]).then(([cRes, uRes]) => {
      setCandidates(cRes.data ?? []);
      setInterviewers(uRes.data ?? []);
    });
  }, []);

  const update = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const toggleInterviewer = (userId: string) => {
    setSelectedInterviewers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.candidateId || !form.title || !form.type) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          durationMinutes: parseInt(form.durationMinutes),
          interviewerIds: selectedInterviewers,
          selfSchedule,
          scheduledAt: selfSchedule ? undefined : form.scheduledAt,
          jobId: candidates.find((c) => c.id === form.candidateId)?.jobId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({ title: "Interview scheduled!", variant: "default" as any });
      router.push("/interviews");
    } catch (err: any) {
      toast({ title: err.message ?? "Failed to schedule", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule Interview</h1>
          <p className="text-sm text-gray-500 mt-0.5">Set up an interview for a candidate.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-1.5">
          <Label>Candidate *</Label>
          <Select value={form.candidateId} onValueChange={(v) => setForm((f) => ({ ...f, candidateId: v }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select candidate" />
            </SelectTrigger>
            <SelectContent>
              {candidates.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="title">Interview Title *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={update("title")}
              placeholder="e.g. Technical Round 1"
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Interview Type *</Label>
            <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTERVIEW_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
          <input
            type="checkbox"
            id="selfSchedule"
            checked={selfSchedule}
            onChange={(e) => setSelfSchedule(e.target.checked)}
            className="h-4 w-4 text-blue-600"
          />
          <label htmlFor="selfSchedule" className="text-sm text-gray-700 cursor-pointer">
            Let candidate self-schedule (send them a link to pick a time)
          </label>
        </div>

        {!selfSchedule && (
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="scheduledAt">Date & Time *</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={form.scheduledAt}
                onChange={update("scheduledAt")}
                required={!selfSchedule}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Duration</Label>
              <Select
                value={form.durationMinutes}
                onValueChange={(v) => setForm((f) => ({ ...f, durationMinutes: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[30, 45, 60, 90, 120].map((d) => (
                    <SelectItem key={d} value={String(d)}>{d} minutes</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="meetingUrl">Meeting URL</Label>
            <Input
              id="meetingUrl"
              value={form.meetingUrl}
              onChange={update("meetingUrl")}
              placeholder="https://meet.google.com/..."
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={form.location}
              onChange={update("location")}
              placeholder="Office / Remote"
            />
          </div>
        </div>

        {interviewers.length > 0 && (
          <div className="grid gap-2">
            <Label>Interviewers</Label>
            <div className="grid grid-cols-2 gap-2">
              {interviewers.map((u) => (
                <label
                  key={u.id}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                    selectedInterviewers.includes(u.id)
                      ? "border-blue-300 bg-blue-50"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedInterviewers.includes(u.id)}
                    onChange={() => toggleInterviewer(u.id)}
                    className="h-3.5 w-3.5 text-blue-600"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{u.name ?? u.email}</p>
                    <p className="text-xs text-gray-400 truncate">{u.role}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-1.5">
          <Label htmlFor="notes">Notes</Label>
          <textarea
            id="notes"
            value={form.notes}
            onChange={update("notes")}
            rows={3}
            placeholder="Interview instructions, focus areas, etc."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {selfSchedule ? "Send Self-Schedule Link" : "Schedule Interview"}
          </Button>
        </div>
      </form>
    </div>
  );
}
