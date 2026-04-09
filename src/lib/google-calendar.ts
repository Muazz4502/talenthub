import { google } from "googleapis";

function getOAuth2Client() {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL + "/api/auth/callback/google"
  );
  return client;
}

export async function createCalendarEvent({
  accessToken,
  title,
  description,
  startTime,
  endTime,
  attendeeEmails,
  location,
  conferenceData,
}: {
  accessToken: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendeeEmails: string[];
  location?: string;
  conferenceData?: boolean;
}) {
  const auth = getOAuth2Client();
  auth.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: "v3", auth });

  const event: any = {
    summary: title,
    description,
    location,
    start: {
      dateTime: startTime.toISOString(),
      timeZone: "UTC",
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: "UTC",
    },
    attendees: attendeeEmails.map((email) => ({ email })),
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 24 * 60 },
        { method: "popup", minutes: 30 },
      ],
    },
  };

  if (conferenceData) {
    event.conferenceData = {
      createRequest: {
        requestId: Math.random().toString(36).substring(7),
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };
  }

  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: event,
    conferenceDataVersion: conferenceData ? 1 : 0,
    sendUpdates: "all",
  });

  return response.data;
}

export async function deleteCalendarEvent(accessToken: string, eventId: string) {
  const auth = getOAuth2Client();
  auth.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: "v3", auth });
  await calendar.events.delete({
    calendarId: "primary",
    eventId,
    sendUpdates: "all",
  });
}

export async function updateCalendarEvent({
  accessToken,
  eventId,
  title,
  startTime,
  endTime,
  attendeeEmails,
}: {
  accessToken: string;
  eventId: string;
  title?: string;
  startTime?: Date;
  endTime?: Date;
  attendeeEmails?: string[];
}) {
  const auth = getOAuth2Client();
  auth.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: "v3", auth });

  const patch: any = {};
  if (title) patch.summary = title;
  if (startTime) patch.start = { dateTime: startTime.toISOString(), timeZone: "UTC" };
  if (endTime) patch.end = { dateTime: endTime.toISOString(), timeZone: "UTC" };
  if (attendeeEmails) patch.attendees = attendeeEmails.map((email) => ({ email }));

  const response = await calendar.events.patch({
    calendarId: "primary",
    eventId,
    requestBody: patch,
    sendUpdates: "all",
  });

  return response.data;
}
