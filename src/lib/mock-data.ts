// Mock data used when no database is connected (demo mode)

export const mockJobs = [
  { id: "j1", title: "Senior Frontend Engineer", department: "Engineering", location: "Mumbai, India", locationType: "HYBRID", status: "OPEN", applicationUrl: "senior-frontend-engineer-abc123", candidateCount: 12, createdAt: new Date("2025-03-01"), updatedAt: new Date(), closedAt: null, ownerId: "demo-admin", description: "We are looking for a Senior Frontend Engineer...", owner: { name: "Alex Admin", email: "admin@talenthub.dev", image: null }, stages: [] },
  { id: "j2", title: "Product Manager", department: "Product", location: "Bangalore, India", locationType: "REMOTE", status: "OPEN", applicationUrl: "product-manager-def456", candidateCount: 8, createdAt: new Date("2025-03-10"), updatedAt: new Date(), closedAt: null, ownerId: "demo-admin", description: "Looking for an experienced PM...", owner: { name: "Alex Admin", email: "admin@talenthub.dev", image: null }, stages: [] },
  { id: "j3", title: "UX Designer", department: "Design", location: "Delhi, India", locationType: "ONSITE", status: "PAUSED", applicationUrl: "ux-designer-ghi789", candidateCount: 5, createdAt: new Date("2025-03-15"), updatedAt: new Date(), closedAt: null, ownerId: "demo-recruiter", description: "Join our design team...", owner: { name: "Rachel Recruiter", email: "recruiter@talenthub.dev", image: null }, stages: [] },
  { id: "j4", title: "Backend Engineer", department: "Engineering", location: "Pune, India", locationType: "HYBRID", status: "OPEN", applicationUrl: "backend-engineer-jkl012", candidateCount: 15, createdAt: new Date("2025-03-20"), updatedAt: new Date(), closedAt: null, ownerId: "demo-admin", description: "Backend engineer with Go/Python experience...", owner: { name: "Alex Admin", email: "admin@talenthub.dev", image: null }, stages: [] },
  { id: "j5", title: "Data Analyst", department: "Analytics", location: "Remote", locationType: "REMOTE", status: "DRAFT", applicationUrl: null, candidateCount: 0, createdAt: new Date("2025-03-25"), updatedAt: new Date(), closedAt: null, ownerId: "demo-hiring", description: "Data analyst for our growth team...", owner: { name: "Henry Manager", email: "hiring@talenthub.dev", image: null }, stages: [] },
] as const;

export const mockStages = [
  { id: "s1", name: "Lead",        order: 0, color: null, jobId: "j1" },
  { id: "s2", name: "Applicant",   order: 1, color: null, jobId: "j1" },
  { id: "s3", name: "Interview",   order: 2, color: null, jobId: "j1" },
  { id: "s4", name: "Offer",       order: 3, color: null, jobId: "j1" },
  { id: "s5", name: "Hired",       order: 4, color: null, jobId: "j1" },
  { id: "s6", name: "Onboarding",  order: 5, color: null, jobId: "j1" },
];

export const mockCandidates = [
  { id: "c1", firstName: "Priya",   lastName: "Sharma",   email: "priya@example.com",  phone: "+91 98765 43210", jobId: "j1", stageId: "s3", source: "LINKEDIN", aiScore: 87, tags: ["React", "TypeScript"], archived: false, createdAt: new Date("2025-03-05"), updatedAt: new Date(), resumeUrl: null, resumeFileKey: null, websiteUrl: null, githubUrl: null, linkedinUrl: null, referrerId: null, aiScoringData: null, aiParsedData: null, applicationAnswers: null, archiveReason: null, job: { title: "Senior Frontend Engineer" }, stage: { name: "Interview" } },
  { id: "c2", firstName: "Rahul",   lastName: "Verma",    email: "rahul@example.com",  phone: "+91 87654 32109", jobId: "j1", stageId: "s2", source: "WEBSITE",  aiScore: 72, tags: ["Vue", "Node.js"],    archived: false, createdAt: new Date("2025-03-07"), updatedAt: new Date(), resumeUrl: null, resumeFileKey: null, websiteUrl: null, githubUrl: null, linkedinUrl: null, referrerId: null, aiScoringData: null, aiParsedData: null, applicationAnswers: null, archiveReason: null, job: { title: "Senior Frontend Engineer" }, stage: { name: "Applicant" } },
  { id: "c3", firstName: "Ananya",  lastName: "Patel",    email: "ananya@example.com", phone: "+91 76543 21098", jobId: "j2", stageId: "s1", source: "REFERRAL", aiScore: 91, tags: ["Strategy", "B2B"],   archived: false, createdAt: new Date("2025-03-12"), updatedAt: new Date(), resumeUrl: null, resumeFileKey: null, websiteUrl: null, githubUrl: null, linkedinUrl: null, referrerId: null, aiScoringData: null, aiParsedData: null, applicationAnswers: null, archiveReason: null, job: { title: "Product Manager" }, stage: { name: "Lead" } },
  { id: "c4", firstName: "Vikram",  lastName: "Singh",    email: "vikram@example.com", phone: "+91 65432 10987", jobId: "j4", stageId: "s4", source: "MANUAL",   aiScore: 65, tags: ["Go", "Kubernetes"], archived: false, createdAt: new Date("2025-03-18"), updatedAt: new Date(), resumeUrl: null, resumeFileKey: null, websiteUrl: null, githubUrl: null, linkedinUrl: null, referrerId: null, aiScoringData: null, aiParsedData: null, applicationAnswers: null, archiveReason: null, job: { title: "Backend Engineer" }, stage: { name: "Offer" } },
  { id: "c5", firstName: "Meera",   lastName: "Nair",     email: "meera@example.com",  phone: "+91 54321 09876", jobId: "j1", stageId: "s5", source: "LINKEDIN", aiScore: 95, tags: ["React", "GraphQL"],  archived: false, createdAt: new Date("2025-03-22"), updatedAt: new Date(), resumeUrl: null, resumeFileKey: null, websiteUrl: null, githubUrl: null, linkedinUrl: null, referrerId: null, aiScoringData: null, aiParsedData: null, applicationAnswers: null, archiveReason: null, job: { title: "Senior Frontend Engineer" }, stage: { name: "Hired" } },
  { id: "c6", firstName: "Arjun",   lastName: "Mehta",    email: "arjun@example.com",  phone: "+91 43210 98765", jobId: "j3", stageId: "s2", source: "WEBSITE",  aiScore: 78, tags: ["Figma", "UX"],       archived: false, createdAt: new Date("2025-03-25"), updatedAt: new Date(), resumeUrl: null, resumeFileKey: null, websiteUrl: null, githubUrl: null, linkedinUrl: null, referrerId: null, aiScoringData: null, aiParsedData: null, applicationAnswers: null, archiveReason: null, job: { title: "UX Designer" }, stage: { name: "Applicant" } },
];

export const mockInterviews = [
  { id: "i1", title: "Technical Round 1", type: "TECHNICAL", status: "SCHEDULED", scheduledAt: new Date(Date.now() + 3600000), durationMinutes: 60, meetingUrl: "https://meet.google.com/abc-defg-hij", location: null, candidateId: "c1", jobId: "j1", notes: null, selfScheduleToken: null, calendarEventId: null, scheduledById: "demo-admin", createdAt: new Date(), updatedAt: new Date(), candidate: { id: "c1", firstName: "Priya", lastName: "Sharma" }, job: { title: "Senior Frontend Engineer" }, interviewers: [{ userId: "demo-interviewer", user: { name: "Ivan Interviewer" } }] },
  { id: "i2", title: "HR Round", type: "HR", status: "COMPLETED", scheduledAt: new Date(Date.now() - 86400000), durationMinutes: 30, meetingUrl: null, location: "Office - Room 3", candidateId: "c3", jobId: "j2", notes: null, selfScheduleToken: null, calendarEventId: null, scheduledById: "demo-recruiter", createdAt: new Date(), updatedAt: new Date(), candidate: { id: "c3", firstName: "Ananya", lastName: "Patel" }, job: { title: "Product Manager" }, interviewers: [{ userId: "demo-hiring", user: { name: "Henry Manager" } }] },
  { id: "i3", title: "System Design", type: "SYSTEM_DESIGN", status: "SCHEDULED", scheduledAt: new Date(Date.now() + 7200000), durationMinutes: 90, meetingUrl: "https://zoom.us/j/123456789", location: null, candidateId: "c4", jobId: "j4", notes: null, selfScheduleToken: null, calendarEventId: null, scheduledById: "demo-admin", createdAt: new Date(), updatedAt: new Date(), candidate: { id: "c4", firstName: "Vikram", lastName: "Singh" }, job: { title: "Backend Engineer" }, interviewers: [{ userId: "demo-interviewer", user: { name: "Ivan Interviewer" } }] },
];

export const mockFeedbacks = [
  { id: "f1", interviewId: "i2", candidateId: "c3", jobId: "j2", submittedById: "demo-hiring", templateId: null, recommendation: "YES", overallScore: 8, fields: {}, notes: "Strong candidate with great product sense.", createdAt: new Date(Date.now() - 86400000), updatedAt: new Date(), submittedBy: { name: "Henry Manager" }, candidate: { id: "c3", firstName: "Ananya", lastName: "Patel" }, job: { title: "Product Manager" }, interview: { title: "HR Round", type: "HR" } },
];

export const mockReferrals = [
  { id: "r1", referrerId: "demo-employee", referrerName: "Emma Employee", referrerEmail: "employee@talenthub.dev", candidateId: "c3", jobId: "j2", relationship: "Former colleague", notes: "Great PM, worked together at previous company.", status: "REVIEWING", rewardStatus: null, rewardAmount: null, createdAt: new Date("2025-03-11"), updatedAt: new Date(), referrer: { name: "Emma Employee" }, candidate: { firstName: "Ananya", lastName: "Patel" }, job: { title: "Product Manager" } },
];

export const mockUsers = [
  { id: "demo-admin",       name: "Alex Admin",      email: "admin@talenthub.dev",       role: "ADMIN",          image: null, slackId: null, createdAt: new Date(), updatedAt: new Date() },
  { id: "demo-recruiter",   name: "Rachel Recruiter", email: "recruiter@talenthub.dev",   role: "RECRUITER",      image: null, slackId: null, createdAt: new Date(), updatedAt: new Date() },
  { id: "demo-hiring",      name: "Henry Manager",   email: "hiring@talenthub.dev",      role: "HIRING_MANAGER", image: null, slackId: null, createdAt: new Date(), updatedAt: new Date() },
  { id: "demo-interviewer", name: "Ivan Interviewer", email: "interviewer@talenthub.dev", role: "INTERVIEWER",    image: null, slackId: null, createdAt: new Date(), updatedAt: new Date() },
  { id: "demo-employee",    name: "Emma Employee",   email: "employee@talenthub.dev",    role: "EMPLOYEE",       image: null, slackId: null, createdAt: new Date(), updatedAt: new Date() },
];

export const mockTemplates = [
  { id: "t1", name: "Technical Interview", interviewType: "TECHNICAL", fields: [], createdById: "demo-admin", createdAt: new Date(), updatedAt: new Date() },
  { id: "t2", name: "HR Screening",        interviewType: "HR",        fields: [], createdById: "demo-admin", createdAt: new Date(), updatedAt: new Date() },
];
