"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Upload, CheckCircle, AlertCircle, Loader2, FileText, ArrowLeft, ArrowRight } from "lucide-react";
import Papa from "papaparse";

interface Job {
  id: string;
  title: string;
}

const CANDIDATE_FIELDS = [
  { key: "firstName", label: "First Name", required: true },
  { key: "lastName", label: "Last Name", required: true },
  { key: "email", label: "Email", required: true },
  { key: "phone", label: "Phone", required: false },
  { key: "resumeUrl", label: "Resume URL", required: false },
  { key: "linkedinUrl", label: "LinkedIn URL", required: false },
  { key: "source", label: "Source", required: false },
  { key: "tags", label: "Tags (comma-separated)", required: false },
];

type Step = 1 | 2 | 3 | 4;

export default function BulkUploadPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number; errors: any[] } | null>(null);

  useEffect(() => {
    fetch("/api/jobs?limit=100")
      .then((r) => r.json())
      .then((d) => setJobs(d.data ?? []));
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedHeaders = results.meta.fields ?? [];
        setHeaders(parsedHeaders);
        setRows(results.data as Record<string, string>[]);

        // Auto-map headers to fields
        const autoMap: Record<string, string> = {};
        CANDIDATE_FIELDS.forEach((field) => {
          const match = parsedHeaders.find(
            (h) =>
              h.toLowerCase().includes(field.key.toLowerCase()) ||
              h.toLowerCase().replace(/[\s_-]/g, "").includes(field.key.toLowerCase().replace(/[\s_-]/g, ""))
          );
          if (match) autoMap[field.key] = match;
        });
        setMapping(autoMap);
        setStep(2);
      },
    });
  }, []);

  const handleImport = async () => {
    if (!selectedJobId) {
      toast({ title: "Please select a job", variant: "destructive" });
      return;
    }

    setImporting(true);
    try {
      const mappedCandidates = rows.map((row) => {
        const candidate: Record<string, any> = {};
        CANDIDATE_FIELDS.forEach((field) => {
          const colName = mapping[field.key];
          if (colName && row[colName]) {
            candidate[field.key] = row[colName];
          }
        });
        return candidate;
      });

      const res = await fetch("/api/candidates/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: selectedJobId, candidates: mappedCandidates }),
      });

      const data = await res.json();
      setResults(data);
      setStep(4);
    } catch (err: any) {
      toast({ title: "Import failed", variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const previewCandidates = rows.slice(0, 5).map((row) => {
    const candidate: Record<string, string> = {};
    CANDIDATE_FIELDS.forEach((f) => {
      candidate[f.key] = mapping[f.key] ? row[mapping[f.key]] ?? "" : "";
    });
    return candidate;
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bulk Upload Candidates</h1>
        <p className="text-sm text-gray-500 mt-1">Import multiple candidates from a CSV or Excel file.</p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2 text-sm">
        {[
          { n: 1, label: "Upload File" },
          { n: 2, label: "Map Columns" },
          { n: 3, label: "Preview" },
          { n: 4, label: "Results" },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            {i > 0 && <div className="w-6 h-px bg-gray-300" />}
            <div className={`flex items-center gap-1.5 ${step >= s.n ? "text-blue-600" : "text-gray-400"}`}>
              <div className={`h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold ${
                step > s.n ? "bg-blue-600 text-white" : step === s.n ? "bg-blue-100 text-blue-700 border-2 border-blue-600" : "bg-gray-100 text-gray-400"
              }`}>
                {step > s.n ? "✓" : s.n}
              </div>
              <span className="font-medium hidden sm:inline">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-gray-700">Target Job *</label>
            <Select value={selectedJobId} onValueChange={setSelectedJobId}>
              <SelectTrigger className="max-w-sm">
                <SelectValue placeholder="Select the job to add candidates to" />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((j) => (
                  <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors">
            <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700">Drop your CSV file here or click to browse</p>
            <p className="text-xs text-gray-400 mt-1">CSV or XLSX format, up to 1000 rows</p>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="mt-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
          </div>

          <div className="text-xs text-gray-500">
            <p className="font-medium mb-1">Expected columns (at minimum):</p>
            <p>firstName, lastName, email · Optional: phone, resumeUrl, linkedinUrl, source, tags</p>
          </div>
        </div>
      )}

      {/* Step 2: Map Columns */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Map your file&apos;s columns to the candidate fields. Required fields are marked with *.
          </p>
          <div className="grid gap-3 max-w-lg">
            {CANDIDATE_FIELDS.map((field) => (
              <div key={field.key} className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700 w-40 shrink-0">
                  {field.label}{field.required && <span className="text-red-500"> *</span>}
                </span>
                <Select
                  value={mapping[field.key] ?? "__none__"}
                  onValueChange={(v) =>
                    setMapping((m) => ({ ...m, [field.key]: v === "__none__" ? "" : v }))
                  }
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="— not mapped —" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— not mapped —</SelectItem>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {mapping[field.key] && (
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Button onClick={() => setStep(3)}>
              Preview
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing first 5 of {rows.length} rows. Review before importing.
            </p>
            <Badge variant="info">{rows.length} candidates to import</Badge>
          </div>

          <div className="rounded-lg border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {["First Name", "Last Name", "Email", "Phone", "Source"].map((h) => (
                    <th key={h} className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {previewCandidates.map((c, i) => {
                  const hasError = !c.firstName || !c.lastName || !c.email;
                  return (
                    <tr key={i} className={hasError ? "bg-red-50" : ""}>
                      <td className="px-3 py-2 text-gray-900">{c.firstName || <span className="text-red-500">Missing</span>}</td>
                      <td className="px-3 py-2 text-gray-900">{c.lastName || <span className="text-red-500">Missing</span>}</td>
                      <td className="px-3 py-2 text-gray-600">{c.email || <span className="text-red-500">Missing</span>}</td>
                      <td className="px-3 py-2 text-gray-400">{c.phone || "—"}</td>
                      <td className="px-3 py-2 text-gray-400">{c.source || "BULK_UPLOAD"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Button onClick={handleImport} disabled={importing}>
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing {rows.length} candidates...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-1" />
                  Import {rows.length} Candidates
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Results */}
      {step === 4 && results && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 max-w-sm">
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-green-700">{results.success}</p>
              <p className="text-sm text-green-600">Imported</p>
            </div>
            <div className={`rounded-lg p-4 text-center border ${results.failed > 0 ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}>
              <AlertCircle className={`h-8 w-8 mx-auto mb-1 ${results.failed > 0 ? "text-red-500" : "text-gray-300"}`} />
              <p className={`text-2xl font-bold ${results.failed > 0 ? "text-red-700" : "text-gray-400"}`}>{results.failed}</p>
              <p className={`text-sm ${results.failed > 0 ? "text-red-600" : "text-gray-400"}`}>Failed</p>
            </div>
          </div>

          {results.errors.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-700 mb-2">Errors:</p>
              <ul className="space-y-1">
                {results.errors.slice(0, 10).map((err: any, i: number) => (
                  <li key={i} className="text-xs text-red-600">Row {err.row}: {err.error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push("/candidates")}>
              View All Candidates
            </Button>
            <Button onClick={() => { setStep(1); setRows([]); setHeaders([]); setMapping({}); setResults(null); }}>
              Upload Another File
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
