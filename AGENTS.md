# uohmi

Personal invoice tracker — send itemized tabs to people who owe you money, track payments, and confirm when they've paid.

## Stack

- **Next.js 16** (App Router, Turbopack) — pages in `src/app/`, proxy middleware at `src/proxy.ts`
- **GSDB** — Google Sheets as a database via a self-hosted REST proxy (`GSDB_URL`). Tables: `Tabs`, `Items`, `Payments`. Schema is managed in `src/lib/db.ts`.
- **Resend** — transactional email (`src/lib/email.ts`, templates in `src/emails/`)
- **ntfy.sh** — push notifications to admin (`src/lib/notify.ts`)
- **Vercel AI Gateway / Ollama** — receipt parsing (`src/lib/ai-receipt.ts`)
- **Vercel Blob** (optional) — file storage via GSDB files API (`src/lib/db.ts` `uploadFile`)

## Auth

Single-admin. `ADMIN_PASSWORD` to log in; session cookie value compared to `SESSION_SECRET` in `src/proxy.ts`. Public routes: `/login`, `/pay/*`, `/api/public/*`, `/api/auth/login`, `/api/payments` (exact — payer POST).

## Key conventions

- GSDB schema changes: use `DELETE /schema/{column}` to remove a column (calls `deleteDimension`, physically shifts columns, avoids header drift). Use `POST /schema/{column}` to add, `PUT /schema/{column}` to rename. `PUT /schema` is a full-replace that deletes removed columns and their data.
- Server actions in `src/app/invoices/[id]/page.tsx` must call `redirect()` after mutations or the server component won't re-render.
- `AddExpenseForm` is a client component (`src/components/AddExpenseForm.tsx`) — it supports both manual entry and receipt parsing via `POST /api/receipts/parse`.

## Dev

```bash
bun dev        # starts Next.js on :3000
```

Generate a test receipt for the AI parser:
```bash
./gen-test-receipt.py          # → test-receipt.png
./gen-test-receipt.py --tip 20
```

## Env vars

See `.env.example`. Required: `GSDB_URL`, `GSDB_APP_ID`, `GSDB_API_KEY`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`. Optional: `NEXT_PUBLIC_APP_URL` (auto-detected from `VERCEL_PROJECT_PRODUCTION_URL`/`VERCEL_URL` on Vercel; defaults to `http://localhost:3000` locally), `NTFY_TOPIC`, `AI_GATEWAY_API_KEY` (or `OPENAI_BASE_URL`).
