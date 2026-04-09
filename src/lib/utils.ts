import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function scoreColor(score: number | null | undefined): string {
  if (!score) return "text-gray-400";
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-500";
}

export function scoreBg(score: number | null | undefined): string {
  if (!score) return "bg-gray-100 text-gray-500";
  if (score >= 80) return "bg-green-100 text-green-700";
  if (score >= 60) return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
}

export const JOB_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  OPEN: "Open",
  PAUSED: "Paused",
  CLOSED: "Closed",
};

export const LOCATION_TYPE_LABELS: Record<string, string> = {
  REMOTE: "Remote",
  HYBRID: "Hybrid",
  ONSITE: "On-site",
};

export const SOURCE_LABELS: Record<string, string> = {
  WEBSITE: "Website",
  LINKEDIN: "LinkedIn",
  MANUAL: "Manual",
  BULK_UPLOAD: "Bulk Upload",
  REFERRAL: "Referral",
};

export const RECOMMENDATION_LABELS: Record<string, string> = {
  STRONG_YES: "Strong Yes",
  YES: "Yes",
  MAYBE: "Maybe",
  NO: "No",
  STRONG_NO: "Strong No",
};

export const DEFAULT_PIPELINE_STAGES = [
  "Lead",
  "Applicant",
  "Interview",
  "Offer",
  "Hired",
  "Onboarding",
];
