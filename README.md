# 🎯 TalentHub

> An AI-native applicant tracking system. Built to feel like the
> future, not Workday.

```
┌─────────────────────────────────────────────────────────────┐
│  Senior Backend Engineer · Bengaluru · Full-time            │
├─────────────────────────────────────────────────────────────┤
│  🟦 SOURCED       🟨 SCREENED     🟧 INTERVIEW    🟩 OFFER  │
│  ─────────        ─────────       ─────────       ─────     │
│  ┌─────────┐     ┌─────────┐                                │
│  │ Aisha M.│     │ Rohan K.│                                │
│  │ ★ 87    │ →   │ ★ 92    │                                │
│  │ Strong  │     │ "Loved  │                                │
│  │ on dist │     │  the    │                                │
│  │ systems │     │  Kafka  │                                │
│  └─────────┘     │  story" │                                │
│  ┌─────────┐     └─────────┘                                │
│  │ Priya R.│                                                │
│  │ ★ 71    │                                                │
│  └─────────┘                                                │
└─────────────────────────────────────────────────────────────┘
```

## The pitch

Existing ATS tools optimize for the HR team's compliance audit. The
candidate is a row in a database. The hiring manager is a CC on an
email thread. **Both groups have learned to hate the tool.**

TalentHub flips the priority. Every screen is built for one
question:

> *"Do I want to talk to this person, and what should I say to them?"*

Compliance still happens. It's just not the boss anymore.

## Features

🎤 **Job posts** with structured JD breakdowns — must-haves,
nice-to-haves, deal-breakers — not a wall of text.

📥 **Candidate ingestion** from a resume PDF, a LinkedIn URL, or
"paste this text dump."

🧠 **LLM scoring** that returns *reasoning, not just a number*. The
recruiter sees:

> *"Strong on backend depth. Light on frontend. No evidence of
> distributed systems work — but his side project is a
> distributed key-value store. Worth a screen."*

…instead of `82%`.

🟦 **Funnel Kanban**: Sourced → Screened → Interview → Offer.
Drag, drop, no thinking.

✉️ **Email drafts** tailored to candidate + role + stage. Reject
emails that don't sound like a Mad Lib.

🎮 **Demo mode**: zero database. Spin it up locally, click around,
leave it running for a stakeholder meeting.

## Stack

- ⚡ **Next.js (App Router)** for routing + RSC
- 🟦 **TypeScript** end to end
- 🐘 **Drizzle + Postgres** for persistence (or zero-DB demo mode)
- 💅 **Tailwind + shadcn/ui** for the UI
- 🤖 **OpenAI** for scoring + email generation

## Up and running in 60 seconds

```bash
pnpm install

# Demo mode — no DB, mock data, click around
pnpm dev

# Or with a real DB
cp .env.example .env
# Fill in DATABASE_URL + OPENAI_API_KEY
pnpm db:push
pnpm dev
```

Open `http://localhost:3000`. Sample role + ten sample candidates
already loaded.

## Project layout

```
src/
  app/            Next.js routes (App Router)
  components/     Kanban board, candidate cards, JD editors
  db/             Drizzle schema + migrations
  hooks/          Client-side state hooks
  lib/            Auth (mock), scoring, LLM helpers, prompts
  types/          Shared TypeScript types
```

## What this is and isn't

**✅ It is**
- A clean playground for *"what would a hiring tool look like if you
  started today, post-LLMs?"*
- Demo-ready for stakeholder pitches
- Educational — the scoring + prompt code is small, readable,
  hackable

**❌ It is not**
- Production-ready. Auth is mock.
- Sending real email. (`console.log` for now.)
- Calling the LLM unless you wire `OPENAI_API_KEY`.
- SOC 2. Not happening.

## What I'd build next

- 📦 Bulk candidate import (LinkedIn Recruiter export, Greenhouse CSV)
- 📅 Calendar integration for interview scheduling — *the missing
  50% of every ATS*
- 🕶️ Anonymized scoring mode — strip name, school, photo, gender
  signals before the LLM sees the candidate
- 📨 Outreach response tracking + auto-follow-ups

---

*Built because I kept opening Workday and feeling worse about humanity.*
