import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { feedbackFormTemplates } from "@/db/schema";
import { desc } from "drizzle-orm";
import { mockTemplates } from "@/lib/mock-data";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  PHONE_SCREEN: "Phone Screen",
  TECHNICAL: "Technical",
  BEHAVIORAL: "Behavioral",
  SYSTEM_DESIGN: "System Design",
  FINAL: "Final Round",
  HR: "HR",
};

export default async function FeedbackTemplatesPage() {
  const session = await auth();
  if (!["ADMIN", "RECRUITER"].includes(session!.user.role)) {
    redirect("/feedback");
  }

  let templates: any[];
  try {
    templates = await db.query.feedbackFormTemplates.findMany({
      orderBy: [desc(feedbackFormTemplates.createdAt)],
      with: {
        createdBy: { columns: { name: true } },
      },
    });
  } catch {
    templates = [...mockTemplates];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feedback Templates</h1>
          <p className="text-sm text-gray-500 mt-1">Customize the evaluation form for each interview type.</p>
        </div>
        <Button asChild>
          <Link href="/feedback/templates/new">
            <Plus className="h-4 w-4 mr-1" />
            New Template
          </Link>
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No templates yet.</p>
          <Button asChild size="sm" className="mt-3">
            <Link href="/feedback/templates/new">Create first template</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {templates.map((t) => (
            <div key={t.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{t.name}</h3>
                    <Badge variant="outline">{TYPE_LABELS[t.interviewType] ?? t.interviewType}</Badge>
                  </div>
                  <p className="text-xs text-gray-500">
                    {(t.fields as any[]).length} fields · Created by {t.createdBy?.name} · {formatDate(t.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
