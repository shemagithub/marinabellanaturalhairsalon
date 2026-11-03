# Marina Bella Natural Hair Saloon

Salon website and booking management for **Marina Bella Natural Hair Saloon**.

## Features

- Public website with services, lookbook, artists, and online booking
- Prices in Rwandan francs (RWF)
- Staff portal for schedule, clients, services, and campaigns
- Walk-in client registration with marketing opt-in
- Frontend-only data (browser localStorage) — no backend required to host

## Stack

- pnpm workspaces, Vite + React
- Optional Clerk auth if you add a publishable key

## Local development

```bash
pnpm install
pnpm run dev:web
```

- Web: http://localhost:23568

Optional: copy `artifacts/mallinabella-salon/.env.example` and set `VITE_CLERK_PUBLISHABLE_KEY` if you want Clerk sign-in. Without it, the site still works and staff portal / bookings use local browser storage.

## Vercel deploy (static frontend)

`vercel.json` builds only the Vite site. No database, API, or backend env vars are required.

1. Import the GitHub repo on Vercel
2. Keep root directory at `./`
3. Deploy

Staff portal: `/admin`  
My visits: `/account`

Bookings, clients, services edits, and campaigns are saved in the visitor’s browser (`localStorage`).
