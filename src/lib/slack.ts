import { WebClient } from "@slack/web-api";

const slack = process.env.SLACK_BOT_TOKEN
  ? new WebClient(process.env.SLACK_BOT_TOKEN)
  : null;

export async function sendSlackMessage(channel: string, text: string, blocks?: any[]) {
  if (!slack) {
    console.warn("Slack not configured — skipping message");
    return;
  }

  await slack.chat.postMessage({
    channel,
    text,
    blocks,
  });
}

export async function sendFeedbackReminder({
  slackUserId,
  candidateName,
  jobTitle,
  interviewId,
  appUrl,
}: {
  slackUserId: string;
  candidateName: string;
  jobTitle: string;
  interviewId: string;
  appUrl: string;
}) {
  const url = `${appUrl}/feedback/submit/${interviewId}`;

  await sendSlackMessage(slackUserId, `Feedback reminder for ${candidateName}`, [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Feedback needed* — Please submit your interview feedback for *${candidateName}* applying for *${jobTitle}*`,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "Submit Feedback" },
          url,
          style: "primary",
        },
      ],
    },
  ]);
}

export async function sendInterviewScheduledNotification({
  channel,
  candidateName,
  interviewTitle,
  scheduledAt,
  interviewerNames,
  appUrl,
  interviewId,
}: {
  channel: string;
  candidateName: string;
  interviewTitle: string;
  scheduledAt: Date;
  interviewerNames: string[];
  appUrl: string;
  interviewId: string;
}) {
  const formatted = scheduledAt.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  await sendSlackMessage(channel, `New interview scheduled: ${interviewTitle}`, [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*New Interview Scheduled*\n*Candidate:* ${candidateName}\n*Interview:* ${interviewTitle}\n*When:* ${formatted}\n*Interviewers:* ${interviewerNames.join(", ")}`,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "View Details" },
          url: `${appUrl}/interviews`,
        },
      ],
    },
  ]);
}
