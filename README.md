# TalentHub

An AI-native applicant tracking system. Built to feel like the future,
not Workday.

> Demo-ready. No real database needed. Spin it up locally in two
> commands and click around.

## What it does

- **Posts** roles with structured JD breakdowns (skills, must-haves,
  nice-to-haves).
- **Ingests** candidates from resumes, LinkedIn URLs, or paste-bin text.
- **Scores** each candidate against the JD with an LLM, surfacing
  structured reasoning, not just a number.
- **Tracks** the funnel — Sourced → Screened → Interview → Offer —
  with drag-and-drop Kanban.
- **Drafts** outreach + reject emails, tuned to the specific candidate
  + role context.

## Stack

- **Next.js** (App Router) for the frontend
- **TypeScript** end to end
- **Drizzle + Postgres** for persistence (or zero-DB demo mode)
- **Tailwind + shadcn/ui** for the UI
- **OpenAI** for the scoring + email generation

## Getting started

```bash
pnpm install

# Demo mode — no DB needed, mock data in memory
pnpm dev

# Or, real DB:
cp .env.example .env
# Fill in DATABASE_URL + OPENAI_API_KEY
pnpm db:push
pnpm dev
```

Open `http://localhost:3000` and start clicking.

## Project layout

```
src/
  app/            Next.js routes (App Router)
  components/     Reusable UI (Kanban board, candidate cards, etc.)
  db/             Drizzle schema + migrations
  hooks/          Client-side state hooks
  lib/            Auth, scoring, LLM helpers
  types/          Shared TypeScript types
```

## Why this exists

ATS tools optimize for HR compliance. Candidates and hiring managers
are second-class citizens. TalentHub flips that — every screen
optimizes for "do I want to talk to this person, and what should I say
to them?"

## Status

Demo-grade. Auth is mock. Email sending is "log to console". Scoring
uses test data unless you add an API key. Production-ready it is not —
but it's the cleanest playground I had for "what would a hiring tool
look like if you started today, post-LLMs?"
