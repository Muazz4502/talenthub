"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Job {
  id: string;
  title: string;
}

export default function AddCandidatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledJobId = searchParams.get("jobId") ?? "";

  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    jobId: prefilledJobId,
    source: "MANUAL",
    linkedinUrl: "",
    githubUrl: "",
    resumeUrl: "",
    tags: "",
  });

  useEffect(() => {
    fetch("/api/jobs?limit=100")
      .then((r) => r.json())
      .then((d) => setJobs(d.data ?? []));
  }, []);

  const update = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.jobId) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Trigger AI scoring if resumeUrl provided
      if (form.resumeUrl) {
        fetch("/api/ai/score-candidate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidateId: data.data.id, jobId: form.jobId }),
        }).catch(() => {});
      }

      toast({ title: "Candidate added successfully!", variant: "success" as any });
      router.push(`/candidates/${data.data.id}`);
    } catch (err: any) {
      toast({ title: err.message ?? "Failed to add candidate", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add Candidate</h1>
        <p className="text-sm text-gray-500 mt-1">Manually add a single candidate to the pipeline.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="firstName">First Name *</Label>
            <Input id="firstName" value={form.firstName} onChange={update("firstName")} placeholder="Jane" required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input id="lastName" value={form.lastName} onChange={update("lastName")} placeholder="Doe" required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" value={form.email} onChange={update("email")} placeholder="jane@example.com" required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" type="tel" value={form.phone} onChange={update("phone")} placeholder="+91 98765 43210" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label>Job *</Label>
            <Select value={form.jobId} onValueChange={(v) => setForm((f) => ({ ...f, jobId: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select a job" />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((j) => (
                  <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Source</Label>
            <Select value={form.source} onValueChange={(v) => setForm((f) => ({ ...f, source: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MANUAL">Manual</SelectItem>
                <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
                <SelectItem value="WEBSITE">Website</SelectItem>
                <SelectItem value="REFERRAL">Referral</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="resumeUrl">Resume URL</Label>
          <Input id="resumeUrl" value={form.resumeUrl} onChange={update("resumeUrl")} placeholder="https://..." />
          <p className="text-xs text-gray-500">Paste the public URL of the resume. AI parsing and scoring will run automatically.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
            <Input id="linkedinUrl" value={form.linkedinUrl} onChange={update("linkedinUrl")} placeholder="https://linkedin.com/in/..." />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="githubUrl">GitHub URL</Label>
            <Input id="githubUrl" value={form.githubUrl} onChange={update("githubUrl")} placeholder="https://github.com/..." />
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="tags">Tags (comma-separated)</Label>
          <Input id="tags" value={form.tags} onChange={update("tags")} placeholder="senior, python, remote" />
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add Candidate
          </Button>
        </div>
      </form>
    </div>
  );
}
