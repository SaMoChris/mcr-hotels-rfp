# MCR Hotels RFP workspace

Verisave's internal site for the MCR Hotels payments audit and processor RFP. The team uses it to:

- **Price the engagement.** An editable pricing model (rates, role mix, scope drivers, hours, payments, change orders). Every fee recalculates as inputs change.
- **See who changed what.** Every saved change is recorded with the person, the time and the earlier value, and can be undone from the History page.
- **Read the proposal.** Written from the live model, so its numbers always match.
- **Edit the scope and the draft RFP.** Section by section, in Markdown.
- **Run the project.** Tasks by phase and a log of open questions.

Internal only. It holds Verisave's pricing and is not for MCR or bidders.

## How sign-in works

There are no passwords. A person enters their work email; the first time, they also give a name or alias. The browser then stays signed in for 180 days.

- Only allowed emails get in. By default that is any `@verisave.com` address (`ALLOWED_EMAIL_DOMAINS`); add individual outside addresses with `ALLOWED_EMAILS`.
- **The email is not verified.** Nothing is sent to the address, so anyone who has the site's URL and knows a teammate's email could sign in as them. That is fine for attributing edits among a trusted team. If you need more, turn on Vercel Deployment Protection for the project, or add emailed sign-in links (needs an email service such as Resend).

## Run it locally

Needs Node 20+ and a Postgres database.

```bash
npm install
cp .env.example .env.local   # then fill in DATABASE_URL and SESSION_SECRET
npm run dev
```

Open http://localhost:3000. The tables are created, and the starting tasks and questions loaded, the first time the site talks to the database.

If the Vercel project already exists, `vercel env pull .env.local` fetches the database URL for you.

Other commands:

| Command | What it does |
| --- | --- |
| `npm run build` | Production build |
| `npm run lint` | Lint |
| `npm run check:model` | Checks the pricing maths against the original spreadsheet's figures ($323,500 total at the starting values) |

## Deploy on Vercel

1. **Import the repo.** In Vercel: Add New → Project → import `SaMoChris/mcr-hotels-rfp`. The framework is detected as Next.js; keep the defaults.
2. **Add the database.** In the project: Storage → Create Database → Neon (Postgres). Connect it to this project for Production and Preview. This sets `DATABASE_URL` for you.
3. **Add environment variables.** Settings → Environment Variables:
   - `SESSION_SECRET`: a long random string (`openssl rand -base64 32`).
   - `ALLOWED_EMAIL_DOMAINS`: `verisave.com` (the default if unset).
   - `ALLOWED_EMAILS`: optional, comma-separated extra addresses.
4. **Deploy** (or redeploy, so the new variables are picked up). Open the site and sign in; the first request creates the tables.

Preview deployments share the same database unless you give Preview its own Neon branch.

## How it is built

- **Next.js (App Router) on Vercel**, React, TypeScript, Tailwind CSS.
- **Postgres** through `pg`. Schema and seed data live in `src/lib/db.ts` and are applied automatically.
- **Starting values live in code; changes live in the database.** The model's defaults (`src/lib/model/defs.ts`) and the documents' starting text (`src/lib/content/`) are in the repo. Only what the team changes is stored, on top. Resetting an input or a section removes the stored change.
- **Server-only data.** Model defaults, document text and the project seed are only read on the server and reach the browser through signed-in API calls, so nothing internal is in the public JavaScript.

| Path | What is there |
| --- | --- |
| `src/lib/model/` | Pricing model: definitions (`defs.ts`), maths (`calc.ts`), saving (`store.ts`) |
| `src/lib/content/` | Scope text, RFP draft, requirement list, proposal writer, starting tasks and questions |
| `src/lib/auth.ts` | Email gate and session cookie |
| `src/lib/history.ts` | History list and undo |
| `src/app/api/` | API routes |
| `src/components/` | Page components |

### Changing the model's structure

To add a work item, driver or change order, edit `src/lib/model/defs.ts`. New items appear in the site with their defaults; saved values for existing inputs are kept. Run `npm run check:model` afterwards and update its expected figures if the starting total is meant to change.

### Database tables

`users`, `model_values` (changed inputs), `doc_sections` (edited document sections), `tasks`, `questions`, `history` (every change), `app_meta`.
