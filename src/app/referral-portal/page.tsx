"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2, Users, CheckCircle } from "lucide-react";

interface Job {
  id: string;
  title: string;
  locationType: string;
}

export default function ReferralPortalPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    referrerName: "",
    referrerEmail: "",
    jobId: "",
    candidateFirstName: "",
    candidateLastName: "",
    candidateEmail: "",
    candidatePhone: "",
    candidateLinkedinUrl: "",
    relationship: "",
    notes: "",
  });

  useEffect(() => {
    fetch("/api/jobs?status=OPEN&limit=100")
      .then((r) => r.json())
      .then((d) => setJobs(d.data ?? []));
  }, []);

  const update = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.referrerName || !form.referrerEmail || !form.jobId || !form.candidateFirstName || !form.candidateLastName || !form.candidateEmail) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(true);
    } catch (err: any) {
      toast({ title: err.message ?? "Failed to submit referral", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Referral Submitted!</h2>
          <p className="text-sm text-gray-500">
            Thank you for your referral. We'll review the candidate and keep you updated. If they're
            hired, you may be eligible for a referral reward.
          </p>
          <Button onClick={() => { setSuccess(false); setForm(f => ({ ...f, candidateFirstName: "", candidateLastName: "", candidateEmail: "", candidatePhone: "", notes: "" })); }} className="mt-6">
            Submit Another Referral
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Users className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Referral Portal</h1>
          <p className="text-sm text-gray-500 mt-1">
            Know someone great? Refer them for an open role and earn rewards when they're hired.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-100">Your Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="referrerName">Your Name *</Label>
                  <Input id="referrerName" value={form.referrerName} onChange={update("referrerName")} placeholder="Jane Doe" required />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="referrerEmail">Your Work Email *</Label>
                  <Input id="referrerEmail" type="email" value={form.referrerEmail} onChange={update("referrerEmail")} placeholder="jane@company.com" required />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-100">Candidate Information</h3>
              <div className="space-y-4">
                <div className="grid gap-1.5">
                  <Label>Role *</Label>
                  <Select value={form.jobId} onValueChange={(v) => setForm((f) => ({ ...f, jobId: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an open role" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobs.map((j) => (
                        <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="candidateFirstName">First Name *</Label>
                    <Input id="candidateFirstName" value={form.candidateFirstName} onChange={update("candidateFirstName")} placeholder="John" required />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="candidateLastName">Last Name *</Label>
                    <Input id="candidateLastName" value={form.candidateLastName} onChange={update("candidateLastName")} placeholder="Smith" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="candidateEmail">Email *</Label>
                    <Input id="candidateEmail" type="email" value={form.candidateEmail} onChange={update("candidateEmail")} placeholder="john@example.com" required />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="candidatePhone">Phone</Label>
                    <Input id="candidatePhone" type="tel" value={form.candidatePhone} onChange={update("candidatePhone")} placeholder="+1 234 567 8900" />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="candidateLinkedinUrl">LinkedIn URL</Label>
                  <Input id="candidateLinkedinUrl" value={form.candidateLinkedinUrl} onChange={update("candidateLinkedinUrl")} placeholder="https://linkedin.com/in/..." />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="relationship">Your Relationship</Label>
                  <Input id="relationship" value={form.relationship} onChange={update("relationship")} placeholder="e.g. Former colleague, friend, ex-manager" />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="notes">Why are you recommending them?</Label>
                  <textarea
                    id="notes"
                    value={form.notes}
                    onChange={update("notes")}
                    rows={3}
                    placeholder="Share any relevant context about this candidate's skills and why they'd be a great fit..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Referral
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
