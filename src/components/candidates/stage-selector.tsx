"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { Loader2, CheckCircle } from "lucide-react";

interface Stage {
  id: string;
  name: string;
  order: number;
  color: string | null;
}

interface CandidateStageSelectorProps {
  candidateId: string;
  currentStageId: string | null;
  stages: Stage[];
}

export function CandidateStageSelector({
  candidateId,
  currentStageId,
  stages,
}: CandidateStageSelectorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeStageId, setActiveStageId] = useState(currentStageId);

  const handleMove = async (stageId: string) => {
    if (stageId === activeStageId || loading) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/candidates/${candidateId}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to move candidate");
      }

      setActiveStageId(stageId);
      toast({ title: "Stage updated", variant: "default" as any });
      router.refresh();
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const DEFAULT_COLORS: Record<string, string> = {
    Lead: "bg-gray-100 text-gray-700 border-gray-300",
    Applicant: "bg-blue-50 text-blue-700 border-blue-300",
    Interview: "bg-purple-50 text-purple-700 border-purple-300",
    Offer: "bg-yellow-50 text-yellow-700 border-yellow-300",
    Hired: "bg-green-50 text-green-700 border-green-300",
    Onboarding: "bg-teal-50 text-teal-700 border-teal-300",
  };

  return (
    <div className="space-y-1.5">
      {loading && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          Moving candidate...
        </div>
      )}
      {stages.map((stage) => {
        const isActive = stage.id === activeStageId;
        const colorClass = DEFAULT_COLORS[stage.name] ?? "bg-gray-100 text-gray-700 border-gray-300";
        return (
          <button
            key={stage.id}
            onClick={() => handleMove(stage.id)}
            disabled={loading}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
              isActive
                ? `${colorClass} border shadow-sm`
                : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300"
            } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            <span>{stage.name}</span>
            {isActive && <CheckCircle className="h-3.5 w-3.5 shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}
