import nodemailer from "nodemailer";

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT ?? "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}) {
  if (!process.env.SMTP_USER) {
    console.warn("Email not configured — skipping send");
    return;
  }

  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"TalentHub" <${process.env.SMTP_USER}>`,
    to: Array.isArray(to) ? to.join(", ") : to,
    subject,
    html,
    text,
  });
}

export async function sendInterviewConfirmation({
  candidateEmail,
  candidateName,
  jobTitle,
  interviewTitle,
  scheduledAt,
  durationMinutes,
  meetingUrl,
  location,
  interviewerNames,
}: {
  candidateEmail: string;
  candidateName: string;
  jobTitle: string;
  interviewTitle: string;
  scheduledAt: Date;
  durationMinutes: number;
  meetingUrl?: string | null;
  location?: string | null;
  interviewerNames: string[];
}) {
  const formatted = scheduledAt.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  await sendEmail({
    to: candidateEmail,
    subject: `Interview Confirmed: ${interviewTitle} — ${jobTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Interview Confirmed</h2>
        <p>Hi ${candidateName},</p>
        <p>Your interview has been confirmed. Here are the details:</p>
        <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
          <tr><td style="padding: 8px; color: #6b7280; width: 140px;">Role:</td><td style="padding: 8px; font-weight: 600;">${jobTitle}</td></tr>
          <tr><td style="padding: 8px; color: #6b7280;">Interview:</td><td style="padding: 8px;">${interviewTitle}</td></tr>
          <tr><td style="padding: 8px; color: #6b7280;">Date & Time:</td><td style="padding: 8px; font-weight: 600;">${formatted}</td></tr>
          <tr><td style="padding: 8px; color: #6b7280;">Duration:</td><td style="padding: 8px;">${durationMinutes} minutes</td></tr>
          ${meetingUrl ? `<tr><td style="padding: 8px; color: #6b7280;">Meeting Link:</td><td style="padding: 8px;"><a href="${meetingUrl}">${meetingUrl}</a></td></tr>` : ""}
          ${location && !meetingUrl ? `<tr><td style="padding: 8px; color: #6b7280;">Location:</td><td style="padding: 8px;">${location}</td></tr>` : ""}
          ${interviewerNames.length ? `<tr><td style="padding: 8px; color: #6b7280;">Interviewers:</td><td style="padding: 8px;">${interviewerNames.join(", ")}</td></tr>` : ""}
        </table>
        <p>Good luck! We look forward to speaking with you.</p>
        <p style="color: #6b7280; font-size: 14px;">— The Hiring Team</p>
      </div>
    `,
  });
}

export async function sendSelfScheduleLink({
  candidateEmail,
  candidateName,
  jobTitle,
  scheduleUrl,
}: {
  candidateEmail: string;
  candidateName: string;
  jobTitle: string;
  scheduleUrl: string;
}) {
  await sendEmail({
    to: candidateEmail,
    subject: `Schedule your interview — ${jobTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Schedule Your Interview</h2>
        <p>Hi ${candidateName},</p>
        <p>We'd like to schedule an interview with you for the <strong>${jobTitle}</strong> role. Please click below to pick a time that works for you:</p>
        <a href="${scheduleUrl}" style="display: inline-block; margin: 16px 0; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Pick a Time
        </a>
        <p style="color: #6b7280; font-size: 14px;">This link is valid for 7 days. If you have any questions, please reply to this email.</p>
        <p style="color: #6b7280; font-size: 14px;">— The Hiring Team</p>
      </div>
    `,
  });
}

export async function sendReferralAcknowledgement({
  referrerEmail,
  referrerName,
  candidateName,
  jobTitle,
}: {
  referrerEmail: string;
  referrerName: string;
  candidateName: string;
  jobTitle: string;
}) {
  await sendEmail({
    to: referrerEmail,
    subject: `Thank you for referring ${candidateName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Referral Received</h2>
        <p>Hi ${referrerName},</p>
        <p>Thank you for referring <strong>${candidateName}</strong> for the <strong>${jobTitle}</strong> role. We'll review their profile and keep you updated on progress.</p>
        <p style="color: #6b7280; font-size: 14px;">— The Hiring Team</p>
      </div>
    `,
  });
}
