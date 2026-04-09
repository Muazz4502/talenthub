import { auth } from "@/lib/auth";
import { db } from "@/db";
import { referrals } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { mockReferrals } from "@/lib/mock-data";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, ExternalLink, Gift } from "lucide-react";
import { formatDate } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "secondary",
  REVIEWING: "info",
  HIRED: "success",
  REJECTED: "destructive",
};

const REWARD_COLORS: Record<string, string> = {
  PENDING: "warning",
  APPROVED: "info",
  PAID: "success",
};

export default async function ReferralsPage() {
  const session = await auth();
  const isAdmin = ["ADMIN", "RECRUITER"].includes(session!.user.role);

  let referralList: any[];
  try {
    referralList = await db.query.referrals.findMany({
      where: isAdmin ? undefined : eq(referrals.referrerId, session!.user.id),
      orderBy: [desc(referrals.createdAt)],
      limit: 100,
      with: {
        referrer: { columns: { name: true, email: true } },
        job: { columns: { title: true } },
        candidate: { columns: { id: true, firstName: true, lastName: true } },
      },
    });
  } catch {
    referralList = isAdmin
      ? [...mockReferrals]
      : mockReferrals.filter((r) => r.referrerId === session!.user.id);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Referrals</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isAdmin ? "All employee referrals" : "Your referrals"}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/referral-portal" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-1" />
            Referral Portal
          </Link>
        </Button>
      </div>

      {referralList.length === 0 ? (
        <div className="text-center py-16">
          <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No referrals yet.</p>
          <Button asChild size="sm" className="mt-3" variant="outline">
            <Link href="/referral-portal">Submit a referral</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Candidate</th>
                {isAdmin && <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Referred By</th>}
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Job</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">Reward</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden lg:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {referralList.map((referral) => (
                <tr key={referral.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {referral.candidate ? (
                      <Link
                        href={`/candidates/${referral.candidate.id}`}
                        className="font-medium text-gray-900 hover:text-blue-600"
                      >
                        {referral.candidate.firstName} {referral.candidate.lastName}
                      </Link>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {referral.referrerName ?? referral.referrer?.name ?? "—"}
                      {referral.referrerEmail && (
                        <p className="text-gray-400">{referral.referrerEmail}</p>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3 text-gray-600 text-xs">{referral.job?.title ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_COLORS[referral.status] as any}>{referral.status}</Badge>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {referral.rewardStatus ? (
                      <div className="space-y-0.5">
                        <Badge variant={REWARD_COLORS[referral.rewardStatus] as any} className="text-xs">
                          <Gift className="h-2.5 w-2.5 mr-1" />
                          {referral.rewardStatus}
                        </Badge>
                        {referral.rewardAmount && (
                          <p className="text-xs text-gray-500">${referral.rewardAmount}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">
                    {formatDate(referral.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
