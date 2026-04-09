import { auth } from "@/lib/auth";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { JobForm } from "@/components/jobs/job-form";

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!["ADMIN", "RECRUITER", "HIRING_MANAGER"].includes(session!.user.role)) {
    redirect("/jobs");
  }

  const { id } = await params;

  const job = await db.query.jobs.findFirst({
    where: eq(jobs.id, id),
    with: {
      stages: { orderBy: (s, { asc }) => [asc(s.order)] },
      formConfig: true,
    },
  });

  if (!job) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Job</h1>
        <p className="text-sm text-gray-500 mt-1">Update the details for {job.title}</p>
      </div>
      <JobForm
        mode="edit"
        initialData={{
          id: job.id,
          title: job.title,
          department: job.department ?? undefined,
          location: job.location ?? undefined,
          locationType: job.locationType,
          description: job.description ?? undefined,
          status: job.status,
          stages: job.stages.map((s) => ({ id: s.id, name: s.name, order: s.order })),
          fields: (job.formConfig?.fields as any[]) ?? [],
        }}
      />
    </div>
  );
}
