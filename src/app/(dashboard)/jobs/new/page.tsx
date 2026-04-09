import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { JobForm } from "@/components/jobs/job-form";

export default async function NewJobPage() {
  const session = await auth();
  if (!["ADMIN", "RECRUITER", "HIRING_MANAGER"].includes(session!.user.role)) {
    redirect("/jobs");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Job</h1>
        <p className="text-sm text-gray-500 mt-1">
          Define the job details, pipeline stages, and application form.
        </p>
      </div>
      <JobForm mode="create" />
    </div>
  );
}
