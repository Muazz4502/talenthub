"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Loader2, MapPin, Briefcase, CheckCircle, Building2 } from "lucide-react";

interface Job {
  id: string;
  title: string;
  department: string | null;
  locationType: string;
  location: string | null;
  description: string | null;
  formConfig: {
    fields: Array<{
      id: string;
      label: string;
      type: string;
      required: boolean;
      options?: string[];
    }>;
  } | null;
}

const LOCATION_LABELS: Record<string, string> = {
  REMOTE: "Remote",
  HYBRID: "Hybrid",
  ONSITE: "On-site",
};

export default function CareerPage() {
  const { slug } = useParams<{ slug: string }>();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    resumeUrl: "",
    linkedinUrl: "",
  });
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch(`/api/public/careers?slug=${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setJob(d.data);
      })
      .catch(() => setError("Failed to load job"))
      .finally(() => setLoading(false));
  }, [slug]);

  const update = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/public/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, jobId: job.id, answers }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(true);
    } catch (err: any) {
      toast({ title: err.message ?? "Failed to submit application", variant: "destructive" });
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

  if (error || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 font-medium">{error || "Job not found"}</p>
          <p className="text-sm text-gray-400 mt-1">This position may have been filled or closed.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
          <p className="text-sm text-gray-500">
            Thank you for applying to <strong>{job.title}</strong>. We'll review your application and
            reach out if there's a match.
          </p>
        </div>
      </div>
    );
  }

  const customFields = job.formConfig?.fields ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {job.department && (
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <Briefcase className="h-3.5 w-3.5" />
                    {job.department}
                  </span>
                )}
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <MapPin className="h-3.5 w-3.5" />
                  {job.location ?? LOCATION_LABELS[job.locationType]}
                </span>
                <Badge variant="info">{LOCATION_LABELS[job.locationType]}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Description */}
        {job.description && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">About the Role</h2>
            <div
              className="text-sm text-gray-600 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: job.description.replace(/\n/g, "<br />") }}
            />
          </div>
        )}

        {/* Application Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Apply Now</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                <Input id="phone" type="tel" value={form.phone} onChange={update("phone")} placeholder="+1 234 567 8900" />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="resumeUrl">Resume URL</Label>
              <Input id="resumeUrl" value={form.resumeUrl} onChange={update("resumeUrl")} placeholder="https://drive.google.com/..." />
              <p className="text-xs text-gray-400">Link to your resume (Google Drive, Dropbox, etc.)</p>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="linkedinUrl">LinkedIn Profile</Label>
              <Input id="linkedinUrl" value={form.linkedinUrl} onChange={update("linkedinUrl")} placeholder="https://linkedin.com/in/..." />
            </div>

            {/* Custom questions */}
            {customFields.map((field) => (
              <div key={field.id} className="grid gap-1.5">
                <Label>
                  {field.label}
                  {field.required && <span className="text-red-500"> *</span>}
                </Label>
                {field.type === "textarea" ? (
                  <textarea
                    value={answers[field.id] ?? ""}
                    onChange={(e) => setAnswers((a) => ({ ...a, [field.id]: e.target.value }))}
                    required={field.required}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                ) : field.type === "select" ? (
                  <select
                    value={answers[field.id] ?? ""}
                    onChange={(e) => setAnswers((a) => ({ ...a, [field.id]: e.target.value }))}
                    required={field.required}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select...</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <Input
                    value={answers[field.id] ?? ""}
                    onChange={(e) => setAnswers((a) => ({ ...a, [field.id]: e.target.value }))}
                    required={field.required}
                  />
                )}
              </div>
            ))}

            <Button type="submit" disabled={submitting} className="w-full mt-2">
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Application
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
