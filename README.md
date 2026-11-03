# Marina Bella Natural Hair Saloon

Salon website and booking management system for **Marina Bella Natural Hair Saloon**.

## Features

- Public website with services, lookbook, artists, and online booking
- Prices in Rwandan francs (RWF)
- Staff portal for schedule, clients, services, and campaigns
- Walk-in client registration with marketing opt-in
- Clerk authentication for staff and client accounts

## Stack

- pnpm workspaces, Vite + React, Express API
- PostgreSQL + Prisma
- Clerk auth

## Local development

```bash
pnpm install
pnpm run db:local
pnpm run db:generate && pnpm run db:push && pnpm run db:seed
pnpm run dev:api
pnpm run dev:web
```

- Web: http://localhost:23568
- API: http://localhost:8080

Copy `.env.example` and `artifacts/mallinabella-salon/.env.example`, then add your Clerk keys.
