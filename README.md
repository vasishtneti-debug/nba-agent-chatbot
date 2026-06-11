# Drew — NBA Agent Chatbot

Production-ready NBA agent AI chatbot powered by Next.js 15, Vercel AI SDK, AI Gateway, Supabase, and Tavily web search.

## Features

- **Drew** — slick, confident NBA agent personality on every response
- **Streaming chat** — word-by-word responses via `useChat` + `streamText`
- **File attachments** — upload contracts, PDFs, spreadsheets, images (Vercel Blob + RLS-scoped metadata)
- **Real-time web search** — Tavily news, contracts/salary, general fallback, and URL extract tools
- **Multi-chat sidebar** — ChatGPT-style conversation history
- **Supabase Auth** — email/password + Google OAuth with RLS-protected data

## Prerequisites

- Node.js 20+
- [Supabase](https://supabase.com) project
- [Tavily](https://tavily.com) API key
- [Vercel](https://vercel.com) account (for AI Gateway OIDC)

## Local Setup

1. **Clone and install**

   ```bash
   npm install
   ```

2. **Environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Fill in Supabase URL/anon key and Tavily API key.

3. **AI Gateway (local dev)**

   ```bash
   vercel link
   vercel env pull .env.local
   ```

   Enable AI Gateway in your Vercel project settings.

4. **Supabase database**

   Run migrations in [`supabase/migrations/`](supabase/migrations/) via the Supabase SQL editor or CLI.

   Enable Auth providers in Supabase Dashboard → Authentication → Providers:
   - Email
   - Google (set redirect URL to `{NEXT_PUBLIC_APP_URL}/auth/callback`)

5. **Start dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `NEXT_PUBLIC_APP_URL` | Yes | App URL for OAuth redirects |
| `TAVILY_API_KEY` | Yes | Tavily search API key |
| `BLOB_READ_WRITE_TOKEN` | Yes | Vercel Blob token (auto-provisioned when Blob store is linked) |
| `BLOB_ACCESS` | Optional | `public` (default) or `private` — must match your Blob store type |
| `VERCEL_OIDC_TOKEN` | Local dev | From `vercel env pull` |
| `AI_GATEWAY_API_KEY` | Optional | Fallback for non-Vercel deploys |

## Deploy to Vercel

1. Push to GitHub and import in Vercel
2. Add environment variables (Supabase, Tavily)
3. AI Gateway OIDC is auto-provisioned on Vercel — no manual gateway key needed
4. Set Supabase OAuth redirect URL to `https://your-domain.com/auth/callback`

## Architecture

```
User → Next.js (useChat) → POST /api/chat → AI Gateway (gpt-5.4)
         ↓ upload                         ↓
  Vercel Blob (private)          Tavily search tools
         ↓                               ↓
  Supabase attachments (RLS)     Supabase (messages)
```

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — production server
- `npm run lint` — ESLint

## Rate Limiting

For production, consider enabling [Vercel Firewall](https://vercel.com/docs/vercel-firewall) rate limits on `/api/chat` to prevent abuse.
