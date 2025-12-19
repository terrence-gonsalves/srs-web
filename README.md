# 📊 ReportBrief

ReportBrief is a lightweight AI-powered micro-SaaS that transforms Salesforce report data into clear, executive-ready summaries.

Upload a Salesforce report (CSV), and ReportBrief generates:

- A concise executive summary
- Key metrics
- Notable trends
- Actionable recommendations

Built for Salesforce admins, RevOps, and operators who need insights without manual analysis.

---

## ✨ Features

- 🔐 Secure authentication via Supabase
- 📁 Upload Salesforce CSV reports
- 🤖 AI-generated summaries (structured JSON)
- 👤 Per-user data isolation (Row Level Security)
- ⚡ Fast, minimal, no-friction UI
- 🧱 Built as a scalable Micro-SaaS

---

## 🧰 Tech Stack

<p align="left">
  <img src="https://nextjs.org/static/favicon/favicon-32x32.png" alt="Next.js" width="32" />
  <img src="https://supabase.com/favicon.ico" alt="Supabase" width="32" />
  <img src="https://openai.com/favicon.ico" alt="OpenAI" width="32" />
  <img src="https://tailwindcss.com/favicons/favicon-32x32.png" alt="Tailwind CSS" width="32" />
</p>

| Layer | Technology |
|------|------------|
| Frontend | Next.js (Pages Router) |
| Backend API | Next.js API Routes |
| Authentication | Supabase Auth |
| Database | Supabase (PostgreSQL + RLS) |
| AI | OpenAI API (stubbed for MVP) |
| Styling | Tailwind CSS |
| Hosting (planned) | Vercel |

---

## 🏗️ Architecture Overview

```text
Browser
  ↓
Next.js Pages (UI)
  ↓
Next.js API Routes
  ↓
Supabase Auth (JWT)
  ↓
Supabase Postgres (RLS enforced)
  ↓
OpenAI API (summarization)
