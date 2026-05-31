# EnergyIQ — B2B Energy Efficiency SaaS

Cut manufacturing energy costs by 10–20% through AI-powered analysis and concrete load-shifting recommendations.

## Architecture

```
/
├── backend/          Node.js + Express + TypeScript + Prisma
│   ├── prisma/       Schema + seed
│   └── src/
│       ├── middleware/   JWT auth
│       ├── routes/       REST API
│       └── services/     Analysis engine, PDF reports, meter simulator
└── frontend/         React + Vite + TypeScript + TailwindCSS + Recharts
    └── src/
        ├── components/   Layout, Sidebar, StatCard
        ├── contexts/     Auth context
        ├── lib/          Axios API client
        └── pages/        Dashboard, Machines, Tariffs, Bills, Analysis, Reports, Admin
```

## Quick start — local dev (SQLite, zero dependencies)

### 1. Clone and install

```bash
# Backend
cd backend
cp .env.example .env        # SQLite is already the default
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Init database and seed demo data

```bash
cd backend
npm run db:push             # create SQLite database from schema
npm run db:seed             # seed 3 pilot companies + machines + readings
```

### 3. Run both servers

Open two terminals:

```bash
# Terminal 1 — backend (port 3001)
cd backend
npm run dev

# Terminal 2 — frontend (port 5173)
cd frontend
npm run dev
```

Open http://localhost:5173

### Demo credentials

| Role   | Email                     | Password      |
|--------|---------------------------|---------------|
| Admin  | admin@energyiq.com        | admin123      |
| Client | acme@example.com          | acme123       |
| Client | techplast@example.com     | techplast123  |
| Client | ferretti@example.com      | ferretti123   |

---

## Production — PostgreSQL

1. Provision a PostgreSQL instance
2. Edit `backend/.env`:
   ```
   DATABASE_PROVIDER=postgresql
   DATABASE_URL=postgresql://user:password@host:5432/energyiq
   JWT_SECRET=<long-random-secret>
   ```
3. Run `npm run db:migrate` instead of `db:push`

---

## Features

| Feature | Status |
|---------|--------|
| Multi-tenant JWT auth (company accounts) | ✅ |
| Configurable tariff bands (named, per-hour, per-price) | ✅ |
| Machine/asset CRUD | ✅ |
| Monthly bill entry with band breakdown | ✅ |
| IoT meter reading ingestion endpoint | ✅ |
| 30-day realistic meter data simulator | ✅ |
| Analysis engine: cost per machine, peak detection | ✅ |
| Load-shift recommendations ranked by saving | ✅ |
| CO₂ reduction estimates (configurable factor) | ✅ |
| Load-shift before/after simulation | ✅ |
| Dashboard with 4 charts | ✅ |
| PDF report (pdfkit, server-side) | ✅ |
| Admin panel: MRR, all clients, aggregate stats | ✅ |

---

## API Reference

```
POST   /api/auth/register         Register company
POST   /api/auth/login            Login
GET    /api/auth/me               Current company
PATCH  /api/auth/me               Update company settings

GET    /api/tariffs               List tariff bands
POST   /api/tariffs               Create band
PUT    /api/tariffs/:id           Update band
DELETE /api/tariffs/:id           Delete band

GET    /api/machines              List machines
POST   /api/machines              Create machine
PUT    /api/machines/:id          Update machine
DELETE /api/machines/:id          Delete machine

GET    /api/bills                 List bills
POST   /api/bills                 Create bill
PUT    /api/bills/:id             Update bill
DELETE /api/bills/:id             Delete bill

GET    /api/readings              List readings
POST   /api/readings              Ingest single reading (IoT)
POST   /api/readings/simulate     Generate 30 days of mock readings

GET    /api/analysis              Run analysis engine
GET    /api/reports/pdf           Download PDF report

GET    /api/admin/companies       List all clients (admin only)
GET    /api/admin/stats           Platform aggregate stats (admin only)
```

---

## Adding real IoT meters

The `/api/readings` endpoint accepts:

```json
POST /api/readings
Authorization: Bearer <token>

{
  "machineId": "<machine-id>",
  "timestamp": "2024-01-15T14:30:00.000Z",
  "kwhDelta": 18.5
}
```

`kwhDelta` = kWh consumed since the last reading. Any meter with HTTP capability can push to this endpoint.

---

## Environment variables

See `backend/.env.example` for the full list.

| Variable           | Description                          | Default              |
|--------------------|--------------------------------------|----------------------|
| `DATABASE_PROVIDER`| `sqlite` or `postgresql`             | `sqlite`             |
| `DATABASE_URL`     | Database connection string           | `file:./dev.db`      |
| `JWT_SECRET`       | JWT signing secret                   | (change in prod!)    |
| `PORT`             | Backend port                         | `3001`               |
| `FRONTEND_URL`     | CORS allowed origin                  | `http://localhost:5173` |
