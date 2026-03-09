# SimplerSite — V1 Backend Implementation

A constrained, reliable website generation engine for small businesses.
Accepts a structured business brief → generates site content via Claude → assembles from templates → deploys straight to Vercel.

## Quick Start

```bash
npm install
npx prisma generate
npx prisma db push
cp .env.example .env  # fill in your keys
npm run dev
```

## Architecture

See the full implementation files in `src/` and `prisma/`.
