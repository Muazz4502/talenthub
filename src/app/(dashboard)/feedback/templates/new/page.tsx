"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, ArrowLeft } from "lucide-react";

interface Field {
  key: string;
  label: string;
  type: "rating" | "text" | "select";
  required: boolean;
  options?: string;
}

const INTERVIEW_TYPES = [
  { value: "PHONE_SCREEN", label: "Phone Screen" },
  { value: "TECHNICAL", label: "Technical" },
  { value: "BEHAVIORAL", label: "Behavioral" },
  { value: "SYSTEM_DESIGN", label: "System Design" },
  { value: "FINAL", label: "Final Round" },
  { value: "HR", label: "HR" },
];

export default function NewTemplatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [interviewType, setInterviewType] = useState("");
  const [fields, setFields] = useState<Field[]>([
    { key: "technical_skills", label: "Technical Skills", type: "rating", required: true },
    { key: "communication", label: "Communication", type: "rating", required: true },
  ]);

  const addField = () => {
    setFields((prev) => [
      ...prev,
      { key: `field_${prev.length + 1}`, label: "", type: "text", required: false },
    ]);
  };

  const removeField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  const updateField = (index: number, updates: Partial<Field>) => {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...updates } : f)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !interviewType) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    if (fields.some((f) => !f.label)) {
      toast({ title: "All fields must have a label", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/feedback/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          interviewType,
          fields: fields.map((f) => ({
            ...f,
            options: f.options ? f.options.split(",").map((o) => o.trim()) : undefined,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({ title: "Template created!", variant: "default" as any });
      router.push("/feedback/templates");
    } catch (err: any) {
      toast({ title: err.message ?? "Failed to create template", variant: "destructive" });
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
        <h1 className="text-2xl font-bold text-gray-900">New Feedback Template</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Technical Interview Form"
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Interview Type *</Label>
            <Select value={interviewType} onValueChange={setInterviewType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {INTERVIEW_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Fields</Label>
            <Button type="button" variant="outline" size="sm" onClick={addField}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Field
            </Button>
          </div>

          {fields.map((field, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-start p-3 rounded-lg border border-gray-200">
              <div className="col-span-4">
                <Input
                  value={field.label}
                  onChange={(e) => updateField(index, { label: e.target.value, key: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                  placeholder="Field label"
                />
              </div>
              <div className="col-span-3">
                <Select
                  value={field.type}
                  onValueChange={(v) => updateField(index, { type: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Rating (1-10)</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="select">Dropdown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {field.type === "select" && (
                <div className="col-span-3">
                  <Input
                    value={field.options ?? ""}
                    onChange={(e) => updateField(index, { options: e.target.value })}
                    placeholder="Opt1, Opt2, Opt3"
                  />
                </div>
              )}
              <div className={`${field.type === "select" ? "col-span-1" : "col-span-4"} flex items-center gap-2`}>
                <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(index, { required: e.target.checked })}
                    className="h-3 w-3"
                  />
                  Required
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeField(index)}
                  className="h-7 w-7 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Template
          </Button>
        </div>
      </form>
    </div>
  );
}
