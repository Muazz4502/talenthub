"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, ChevronUp, ChevronDown, GripVertical } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { DEFAULT_PIPELINE_STAGES } from "@/lib/utils";

interface Stage {
  id?: string;
  name: string;
  order: number;
  isDefault?: boolean;
}

interface Question {
  id: string;
  type: string;
  label: string;
  required: boolean;
  options?: string[];
}

interface JobFormProps {
  mode: "create" | "edit";
  initialData?: {
    id?: string;
    title?: string;
    department?: string;
    location?: string;
    locationType?: string;
    description?: string;
    status?: string;
    stages?: Stage[];
    fields?: Question[];
  };
}

const QUESTION_TYPES = [
  { value: "SHORT_TEXT", label: "Short Text" },
  { value: "LONG_TEXT", label: "Long Text" },
  { value: "SINGLE_SELECT", label: "Single Select" },
  { value: "MULTI_SELECT", label: "Multi Select" },
  { value: "FILE_UPLOAD", label: "File Upload" },
  { value: "URL", label: "URL" },
  { value: "YES_NO", label: "Yes / No" },
];

export function JobForm({ mode, initialData }: JobFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "pipeline" | "form">("details");

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [department, setDepartment] = useState(initialData?.department ?? "");
  const [location, setLocation] = useState(initialData?.location ?? "");
  const [locationType, setLocationType] = useState(initialData?.locationType ?? "HYBRID");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [status, setStatus] = useState(initialData?.status ?? "DRAFT");

  const [stages, setStages] = useState<Stage[]>(
    initialData?.stages?.length
      ? initialData.stages
      : DEFAULT_PIPELINE_STAGES.map((name, i) => ({ name, order: i, isDefault: true }))
  );
  const [newStageName, setNewStageName] = useState("");

  const [questions, setQuestions] = useState<Question[]>(initialData?.fields ?? []);

  const moveStage = (index: number, direction: "up" | "down") => {
    const newStages = [...stages];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newStages.length) return;
    [newStages[index], newStages[swapIndex]] = [newStages[swapIndex], newStages[index]];
    setStages(newStages.map((s, i) => ({ ...s, order: i })));
  };

  const addStage = () => {
    if (!newStageName.trim()) return;
    setStages([...stages, { name: newStageName.trim(), order: stages.length }]);
    setNewStageName("");
  };

  const removeStage = (index: number) => {
    setStages(stages.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i })));
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { id: crypto.randomUUID(), type: "SHORT_TEXT", label: "", required: false },
    ]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleSubmit = async (submitStatus?: string) => {
    if (!title) {
      toast({ title: "Missing required fields", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const url = mode === "create" ? "/api/jobs" : `/api/jobs/${initialData?.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          department,
          location,
          locationType,
          description,
          status: submitStatus ?? status,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to save job");

      const jobId = data.data.id;

      // Update stages if creating
      if (mode === "create") {
        // Stages are auto-created with defaults. Update if custom stages defined
        const customStages = stages.filter((_, i) => i >= DEFAULT_PIPELINE_STAGES.length || stages[i].name !== DEFAULT_PIPELINE_STAGES[i]);
        if (customStages.length > 0) {
          await fetch(`/api/jobs/${jobId}/stages`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ stages: stages.map((s, i) => ({ ...s, order: i })) }),
          });
        }
      }

      toast({
        title: mode === "create" ? "Job created!" : "Job updated!",
        variant: "success" as any,
      });
      router.push(`/jobs/${jobId}`);
      router.refresh();
    } catch (error: any) {
      toast({ title: error.message ?? "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "details", label: "Job Details" },
    { id: "pipeline", label: "Pipeline Stages" },
    { id: "form", label: "Application Form" },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Job Details Tab */}
      {activeTab === "details" && (
        <div className="grid gap-5 max-w-2xl">
          <div className="grid gap-1.5">
            <Label htmlFor="title">Job Title *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Senior Frontend Engineer" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="department">Department *</Label>
              <Input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Engineering" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="location">Location *</Label>
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Mumbai, India" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>Location Type</Label>
              <Select value={locationType} onValueChange={setLocationType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REMOTE">Remote</SelectItem>
                  <SelectItem value="HYBRID">Hybrid</SelectItem>
                  <SelectItem value="ONSITE">On-site</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="description">Job Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the role, responsibilities, and requirements..."
              className="min-h-[200px]"
            />
          </div>
        </div>
      )}

      {/* Pipeline Stages Tab */}
      {activeTab === "pipeline" && (
        <div className="max-w-lg space-y-4">
          <p className="text-sm text-gray-500">
            Configure the hiring pipeline stages for this job. Candidates will move through these stages.
          </p>
          <div className="space-y-2">
            {stages.map((stage, index) => (
              <div key={index} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5">
                <GripVertical className="h-4 w-4 text-gray-300 shrink-0" />
                <span className="flex-1 text-sm font-medium text-gray-700">{stage.name}</span>
                {stage.isDefault && (
                  <Badge variant="secondary" className="text-xs">default</Badge>
                )}
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveStage(index, "up")} disabled={index === 0}>
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveStage(index, "down")} disabled={index === stages.length - 1}>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => removeStage(index)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="New stage name..."
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addStage()}
            />
            <Button variant="outline" onClick={addStage}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
      )}

      {/* Application Form Tab */}
      {activeTab === "form" && (
        <div className="max-w-2xl space-y-4">
          <p className="text-sm text-gray-500">
            Add custom questions to the application form for this role.
          </p>
          <div className="space-y-3">
            {questions.map((q, index) => (
              <Card key={q.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 grid gap-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                          <Label className="text-xs text-gray-500">Question Type</Label>
                          <Select value={q.type} onValueChange={(v) => updateQuestion(q.id, { type: v })}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {QUESTION_TYPES.map((t) => (
                                <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-end gap-2">
                          <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer pb-1.5">
                            <input
                              type="checkbox"
                              checked={q.required}
                              onChange={(e) => updateQuestion(q.id, { required: e.target.checked })}
                              className="rounded"
                            />
                            Required
                          </label>
                        </div>
                      </div>
                      <div className="grid gap-1.5">
                        <Label className="text-xs text-gray-500">Question Label</Label>
                        <Input
                          className="h-8 text-sm"
                          placeholder="e.g. Years of relevant experience?"
                          value={q.label}
                          onChange={(e) => updateQuestion(q.id, { label: e.target.value })}
                        />
                      </div>
                      {(q.type === "SINGLE_SELECT" || q.type === "MULTI_SELECT") && (
                        <div className="grid gap-1.5">
                          <Label className="text-xs text-gray-500">Options (one per line)</Label>
                          <Textarea
                            className="text-sm min-h-[60px]"
                            placeholder="Option 1&#10;Option 2&#10;Option 3"
                            value={q.options?.join("\n") ?? ""}
                            onChange={(e) => updateQuestion(q.id, { options: e.target.value.split("\n").filter(Boolean) })}
                          />
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-red-500 hover:bg-red-50"
                      onClick={() => removeQuestion(q.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button variant="outline" onClick={addQuestion}>
            <Plus className="h-4 w-4 mr-1" />
            Add Question
          </Button>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 border-t border-gray-200 pt-5">
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSubmit("DRAFT")}
          disabled={loading}
        >
          Save as Draft
        </Button>
        <Button
          onClick={() => handleSubmit("OPEN")}
          disabled={loading}
        >
          {loading ? "Saving..." : mode === "create" ? "Publish Job" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
