import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface ParsedResume {
  skills: string[];
  experience: { company: string; title: string; years: number }[];
  education: { institution: string; degree: string; year?: number }[];
  totalYearsExperience: number;
  summary: string;
}

export interface ScoringResult {
  score: number; // 0-100
  reasoning: string;
  strengths: string[];
  gaps: string[];
  recommendation: "STRONG_YES" | "YES" | "MAYBE" | "NO" | "STRONG_NO";
}

export async function parseResume(resumeText: string): Promise<ParsedResume> {
  const message = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Parse the following resume and extract structured information. Return ONLY valid JSON with no explanation.

Resume:
${resumeText}

Return JSON matching this exact structure:
{
  "skills": ["skill1", "skill2"],
  "experience": [{"company": "...", "title": "...", "years": 2}],
  "education": [{"institution": "...", "degree": "...", "year": 2020}],
  "totalYearsExperience": 5,
  "summary": "2-3 sentence professional summary"
}`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Could not parse resume response");
  return JSON.parse(jsonMatch[0]) as ParsedResume;
}

export async function scoreCandidate(
  candidateProfile: {
    firstName: string;
    lastName: string;
    skills?: string[];
    experience?: { company: string; title: string; years: number }[];
    totalYearsExperience?: number;
    resumeText?: string;
  },
  jobDescription: {
    title: string;
    description: string | null;
    requirements?: string;
  }
): Promise<ScoringResult> {
  const candidateInfo = `
Name: ${candidateProfile.firstName} ${candidateProfile.lastName}
Total Years Experience: ${candidateProfile.totalYearsExperience ?? "Unknown"}
Skills: ${candidateProfile.skills?.join(", ") ?? "Not specified"}
Experience: ${
    candidateProfile.experience
      ?.map((e) => `${e.title} at ${e.company} (${e.years} years)`)
      .join("; ") ?? "Not specified"
  }
${candidateProfile.resumeText ? `\nResume:\n${candidateProfile.resumeText.slice(0, 2000)}` : ""}
  `.trim();

  const message = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are an expert recruiter. Score this candidate for the given job role. Return ONLY valid JSON with no explanation.

JOB: ${jobDescription.title}
${jobDescription.description ?? ""}

CANDIDATE:
${candidateInfo}

Return JSON matching this exact structure:
{
  "score": 75,
  "reasoning": "Brief explanation of the score",
  "strengths": ["strength1", "strength2"],
  "gaps": ["gap1", "gap2"],
  "recommendation": "YES"
}

Score is 0-100. Recommendation must be one of: STRONG_YES, YES, MAYBE, NO, STRONG_NO.`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Could not parse scoring response");
  return JSON.parse(jsonMatch[0]) as ScoringResult;
}

export async function generateInterviewQuestions(
  jobTitle: string,
  candidateSkills: string[],
  interviewType: "TECHNICAL" | "BEHAVIORAL" | "FINAL"
): Promise<string[]> {
  const message = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Generate 8 ${interviewType.toLowerCase()} interview questions for a ${jobTitle} role. Candidate skills: ${candidateSkills.join(", ")}. Return ONLY a JSON array of strings, no explanation.`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("Could not parse questions response");
  return JSON.parse(jsonMatch[0]) as string[];
}
