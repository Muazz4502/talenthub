import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  json,
  primaryKey,
  pgEnum,
  uniqueIndex,
  index,
  real,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ──────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
  "ADMIN",
  "RECRUITER",
  "HIRING_MANAGER",
  "INTERVIEWER",
  "EMPLOYEE",
]);

export const jobStatusEnum = pgEnum("job_status", [
  "DRAFT",
  "OPEN",
  "PAUSED",
  "CLOSED",
]);

export const locationTypeEnum = pgEnum("location_type", [
  "REMOTE",
  "HYBRID",
  "ONSITE",
]);

export const candidateSourceEnum = pgEnum("candidate_source", [
  "WEBSITE",
  "LINKEDIN",
  "MANUAL",
  "BULK_UPLOAD",
  "REFERRAL",
]);

export const interviewStatusEnum = pgEnum("interview_status", [
  "PENDING",
  "SCHEDULED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
]);

export const interviewTypeEnum = pgEnum("interview_type", [
  "PHONE_SCREEN",
  "TECHNICAL",
  "BEHAVIORAL",
  "SYSTEM_DESIGN",
  "FINAL",
  "HR",
]);

export const assignmentStatusEnum = pgEnum("assignment_status", [
  "SENT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "REVIEWED",
  "DECISION_MADE",
]);

export const assignmentDecisionEnum = pgEnum("assignment_decision", [
  "ADVANCE",
  "REJECT",
  "NEEDS_DISCUSSION",
]);

export const rewardStatusEnum = pgEnum("reward_status", [
  "PENDING",
  "APPROVED",
  "PAID",
]);

export const referralStatusEnum = pgEnum("referral_status", [
  "SUBMITTED",
  "REVIEWING",
  "HIRED",
  "REJECTED",
]);

export const onboardingStatusEnum = pgEnum("onboarding_status", [
  "PENDING",
  "EXPORTED",
  "FAILED",
]);

export const recommendationEnum = pgEnum("recommendation", [
  "STRONG_YES",
  "YES",
  "MAYBE",
  "NO",
  "STRONG_NO",
]);

// ─── Auth Tables (NextAuth v5 / DrizzleAdapter) ─────────────────────────────

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  role: userRoleEnum("role").default("EMPLOYEE").notNull(),
  slackId: text("slack_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.provider, table.providerAccountId] }),
  })
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.identifier, table.token] }),
  })
);

// ─── Jobs ───────────────────────────────────────────────────────────────────

export const jobs = pgTable("jobs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  department: text("department"),
  location: text("location"),
  locationType: locationTypeEnum("location_type").default("HYBRID").notNull(),
  description: text("description"),
  status: jobStatusEnum("status").default("DRAFT").notNull(),
  applicationUrl: text("application_url").unique(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
});

export const pipelineStages = pgTable(
  "pipeline_stages",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    jobId: text("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color"),
    order: integer("order").notNull(),
    automationTriggers: json("automation_triggers"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    jobOrderIdx: uniqueIndex("pipeline_stages_job_order_idx").on(
      table.jobId,
      table.order
    ),
  })
);

export const applicationFormConfigs = pgTable("application_form_configs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  jobId: text("job_id")
    .notNull()
    .unique()
    .references(() => jobs.id, { onDelete: "cascade" }),
  fields: json("fields").notNull().$type<ApplicationField[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Candidates ─────────────────────────────────────────────────────────────

export const candidates = pgTable(
  "candidates",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    jobId: text("job_id")
      .notNull()
      .references(() => jobs.id),
    stageId: text("stage_id").references(() => pipelineStages.id),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    resumeUrl: text("resume_url"),
    resumeFileKey: text("resume_file_key"),
    websiteUrl: text("website_url"),
    githubUrl: text("github_url"),
    linkedinUrl: text("linkedin_url"),
    source: candidateSourceEnum("source").default("MANUAL").notNull(),
    referrerId: text("referrer_id").references(() => users.id),
    aiScore: integer("ai_score"),
    aiScoringData: json("ai_scoring_data"),
    aiParsedData: json("ai_parsed_data"),
    applicationAnswers: json("application_answers"),
    tags: text("tags").array(),
    archived: boolean("archived").default(false).notNull(),
    archiveReason: text("archive_reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    jobIdx: index("candidates_job_idx").on(table.jobId),
    emailIdx: index("candidates_email_idx").on(table.email),
  })
);

export const candidateStageHistory = pgTable("candidate_stage_history", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  candidateId: text("candidate_id")
    .notNull()
    .references(() => candidates.id, { onDelete: "cascade" }),
  fromStageId: text("from_stage_id"),
  toStageId: text("to_stage_id"),
  actorId: text("actor_id").references(() => users.id),
  note: text("note"),
  movedAt: timestamp("moved_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const candidateNotes = pgTable("candidate_notes", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  candidateId: text("candidate_id")
    .notNull()
    .references(() => candidates.id, { onDelete: "cascade" }),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Interviews ─────────────────────────────────────────────────────────────

export const interviews = pgTable("interviews", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  candidateId: text("candidate_id")
    .notNull()
    .references(() => candidates.id),
  jobId: text("job_id").references(() => jobs.id),
  title: text("title").notNull(),
  type: interviewTypeEnum("type").default("TECHNICAL").notNull(),
  scheduledAt: timestamp("scheduled_at"),
  durationMinutes: integer("duration_minutes").default(60).notNull(),
  location: text("location"),
  meetingUrl: text("meeting_url"),
  calendarEventId: text("calendar_event_id"),
  selfScheduleToken: text("self_schedule_token").unique(),
  status: interviewStatusEnum("status").default("SCHEDULED").notNull(),
  notes: text("notes"),
  scheduledById: text("scheduled_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const interviewInterviewers = pgTable(
  "interview_interviewers",
  {
    interviewId: text("interview_id")
      .notNull()
      .references(() => interviews.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.interviewId, table.userId] }),
  })
);

export const interviewerAvailability = pgTable("interviewer_availability", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sun ... 6=Sat
  startTime: text("start_time").notNull(), // "14:00"
  endTime: text("end_time").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Feedback ───────────────────────────────────────────────────────────────

export const feedbackFormTemplates = pgTable("feedback_form_templates", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  interviewType: interviewTypeEnum("interview_type").notNull(),
  fields: json("fields").notNull().$type<FeedbackField[]>(),
  createdById: text("created_by_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const feedbacks = pgTable("feedbacks", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  interviewId: text("interview_id").references(() => interviews.id),
  candidateId: text("candidate_id")
    .notNull()
    .references(() => candidates.id),
  jobId: text("job_id").references(() => jobs.id),
  submittedById: text("submitted_by_id")
    .notNull()
    .references(() => users.id),
  templateId: text("template_id").references(() => feedbackFormTemplates.id),
  recommendation: recommendationEnum("recommendation").notNull(),
  overallScore: integer("overall_score"),
  fields: json("fields"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Assignments ─────────────────────────────────────────────────────────────

export const assignments = pgTable("assignments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  candidateId: text("candidate_id")
    .notNull()
    .references(() => candidates.id),
  jobId: text("job_id")
    .notNull()
    .references(() => jobs.id),
  stageId: text("stage_id").references(() => pipelineStages.id),
  briefText: text("brief_text"),
  briefFileKey: text("brief_file_key"),
  deadline: timestamp("deadline"),
  submissionFileKey: text("submission_file_key"),
  submittedAt: timestamp("submitted_at"),
  status: assignmentStatusEnum("status").default("SENT").notNull(),
  decision: assignmentDecisionEnum("decision"),
  reviewScore: integer("review_score"),
  reviewFeedback: text("review_feedback"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const assignmentReviewers = pgTable(
  "assignment_reviewers",
  {
    assignmentId: text("assignment_id")
      .notNull()
      .references(() => assignments.id, { onDelete: "cascade" }),
    reviewerId: text("reviewer_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.assignmentId, table.reviewerId] }),
  })
);

// ─── Referrals ───────────────────────────────────────────────────────────────

export const referrals = pgTable("referrals", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  referrerId: text("referrer_id").references(() => users.id),
  referrerName: text("referrer_name"),
  referrerEmail: text("referrer_email"),
  candidateId: text("candidate_id")
    .notNull()
    .unique()
    .references(() => candidates.id),
  jobId: text("job_id")
    .notNull()
    .references(() => jobs.id),
  relationship: text("relationship"),
  notes: text("notes"),
  status: referralStatusEnum("status").default("SUBMITTED").notNull(),
  rewardStatus: rewardStatusEnum("reward_status"),
  rewardAmount: real("reward_amount"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Surveys ─────────────────────────────────────────────────────────────────

export const candidateSurveys = pgTable("candidate_surveys", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  token: text("token")
    .notNull()
    .unique()
    .$defaultFn(() => crypto.randomUUID()),
  candidateId: text("candidate_id")
    .notNull()
    .unique()
    .references(() => candidates.id),
  jobId: text("job_id").references(() => jobs.id),
  overallRating: integer("overall_rating"),
  processRating: integer("process_rating"),
  communicationRating: integer("communication_rating"),
  feedback: text("feedback"),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Audit Logs ──────────────────────────────────────────────────────────────

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    action: text("action").notNull(),
    actorId: text("actor_id").references(() => users.id),
    before: json("before"),
    after: json("after"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    entityIdx: index("audit_logs_entity_idx").on(
      table.entityType,
      table.entityId
    ),
  })
);

export const onboardingHandoffs = pgTable("onboarding_handoffs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  candidateId: text("candidate_id").notNull(),
  status: onboardingStatusEnum("status").default("PENDING").notNull(),
  payload: json("payload").notNull(),
  error: text("error"),
  triggeredAt: timestamp("triggered_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// ─── Types ──────────────────────────────────────────────────────────────────

export type ApplicationField = {
  id: string;
  type: "text" | "textarea" | "select" | "checkbox" | "file" | "url";
  label: string;
  required: boolean;
  options?: string[];
};

export type FeedbackField = {
  key: string;
  label: string;
  type: "rating" | "text" | "select";
  required: boolean;
  options?: string[];
};

// ─── Relations ───────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  ownedJobs: many(jobs),
  feedbackTemplates: many(feedbackFormTemplates),
  feedbacks: many(feedbacks),
  interviewInterviewers: many(interviewInterviewers),
  assignmentReviewers: many(assignmentReviewers),
  referralsMade: many(referrals),
  auditLogs: many(auditLogs),
  availability: many(interviewerAvailability),
  candidateNotes: many(candidateNotes),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  owner: one(users, { fields: [jobs.ownerId], references: [users.id] }),
  stages: many(pipelineStages),
  candidates: many(candidates),
  formConfig: one(applicationFormConfigs, {
    fields: [jobs.id],
    references: [applicationFormConfigs.jobId],
  }),
  feedbackTemplates: many(feedbackFormTemplates),
  referrals: many(referrals),
  assignments: many(assignments),
  interviews: many(interviews),
}));

export const pipelineStagesRelations = relations(
  pipelineStages,
  ({ one, many }) => ({
    job: one(jobs, { fields: [pipelineStages.jobId], references: [jobs.id] }),
    candidates: many(candidates),
    stageHistory: many(candidateStageHistory, {
      relationName: "toStage",
    }),
  })
);

export const applicationFormConfigsRelations = relations(
  applicationFormConfigs,
  ({ one }) => ({
    job: one(jobs, {
      fields: [applicationFormConfigs.jobId],
      references: [jobs.id],
    }),
  })
);

export const candidatesRelations = relations(candidates, ({ one, many }) => ({
  job: one(jobs, { fields: [candidates.jobId], references: [jobs.id] }),
  stage: one(pipelineStages, {
    fields: [candidates.stageId],
    references: [pipelineStages.id],
  }),
  interviews: many(interviews),
  feedbacks: many(feedbacks),
  assignments: many(assignments),
  referral: one(referrals, {
    fields: [candidates.id],
    references: [referrals.candidateId],
  }),
  survey: one(candidateSurveys, {
    fields: [candidates.id],
    references: [candidateSurveys.candidateId],
  }),
  stageHistory: many(candidateStageHistory),
  notes: many(candidateNotes),
}));

export const candidateStageHistoryRelations = relations(
  candidateStageHistory,
  ({ one }) => ({
    candidate: one(candidates, {
      fields: [candidateStageHistory.candidateId],
      references: [candidates.id],
    }),
    actor: one(users, {
      fields: [candidateStageHistory.actorId],
      references: [users.id],
    }),
  })
);

export const candidateNotesRelations = relations(candidateNotes, ({ one }) => ({
  candidate: one(candidates, {
    fields: [candidateNotes.candidateId],
    references: [candidates.id],
  }),
  author: one(users, {
    fields: [candidateNotes.authorId],
    references: [users.id],
  }),
}));

export const interviewsRelations = relations(interviews, ({ one, many }) => ({
  candidate: one(candidates, {
    fields: [interviews.candidateId],
    references: [candidates.id],
  }),
  job: one(jobs, { fields: [interviews.jobId], references: [jobs.id] }),
  scheduledBy: one(users, {
    fields: [interviews.scheduledById],
    references: [users.id],
  }),
  interviewers: many(interviewInterviewers),
  feedbacks: many(feedbacks),
}));

export const interviewInterviewersRelations = relations(
  interviewInterviewers,
  ({ one }) => ({
    interview: one(interviews, {
      fields: [interviewInterviewers.interviewId],
      references: [interviews.id],
    }),
    user: one(users, {
      fields: [interviewInterviewers.userId],
      references: [users.id],
    }),
  })
);

export const interviewerAvailabilityRelations = relations(
  interviewerAvailability,
  ({ one }) => ({
    user: one(users, {
      fields: [interviewerAvailability.userId],
      references: [users.id],
    }),
  })
);

export const feedbackFormTemplatesRelations = relations(
  feedbackFormTemplates,
  ({ one }) => ({
    createdBy: one(users, {
      fields: [feedbackFormTemplates.createdById],
      references: [users.id],
    }),
  })
);

export const feedbacksRelations = relations(feedbacks, ({ one }) => ({
  interview: one(interviews, {
    fields: [feedbacks.interviewId],
    references: [interviews.id],
  }),
  candidate: one(candidates, {
    fields: [feedbacks.candidateId],
    references: [candidates.id],
  }),
  job: one(jobs, { fields: [feedbacks.jobId], references: [jobs.id] }),
  submittedBy: one(users, {
    fields: [feedbacks.submittedById],
    references: [users.id],
  }),
  template: one(feedbackFormTemplates, {
    fields: [feedbacks.templateId],
    references: [feedbackFormTemplates.id],
  }),
}));

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  candidate: one(candidates, {
    fields: [assignments.candidateId],
    references: [candidates.id],
  }),
  job: one(jobs, { fields: [assignments.jobId], references: [jobs.id] }),
  stage: one(pipelineStages, {
    fields: [assignments.stageId],
    references: [pipelineStages.id],
  }),
  reviewers: many(assignmentReviewers),
}));

export const assignmentReviewersRelations = relations(assignmentReviewers, ({ one }) => ({
  assignment: one(assignments, {
    fields: [assignmentReviewers.assignmentId],
    references: [assignments.id],
  }),
  reviewer: one(users, {
    fields: [assignmentReviewers.reviewerId],
    references: [users.id],
  }),
}));

export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(users, {
    fields: [referrals.referrerId],
    references: [users.id],
  }),
  candidate: one(candidates, {
    fields: [referrals.candidateId],
    references: [candidates.id],
  }),
  job: one(jobs, { fields: [referrals.jobId], references: [jobs.id] }),
}));

export const candidateSurveysRelations = relations(
  candidateSurveys,
  ({ one }) => ({
    candidate: one(candidates, {
      fields: [candidateSurveys.candidateId],
      references: [candidates.id],
    }),
    job: one(jobs, {
      fields: [candidateSurveys.jobId],
      references: [jobs.id],
    }),
  })
);
