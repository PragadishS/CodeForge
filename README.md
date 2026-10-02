# CodeForge

A local, LeetCode-style coding platform: publish problems, submit Python or C++, get a live verdict, and climb a global leaderboard.

Built to run on a laptop with Docker. No cloud services.

## What it does

- JWT auth (register, login, access + refresh)
- Problem list and detail (sample tests only; hidden tests stay on the server)
- Submit Python or C++; workers judge in a sandbox (timeout, memory cap, Python AST denylist)
- Live verdict over WebSockets (`queued` → `running` → AC / WA / TLE / RE / MLE)
- First accepted solution scores points; Redis sorted set for the leaderboard
- Public profile, submission heatmap, solved-by-me on the problem list
- Staff create problems and tests in Django Admin (no extra editor UI)

## Stack

| Layer | Choice |
| --- | --- |
| API | Django + Django REST Framework + SimpleJWT, served by Daphne |
| Realtime | Django Channels (Redis) |
| Queue | Apache Kafka (KRaft); consumer group `codeforge.judge` |
| Data | PostgreSQL 16, Redis 7 |
| Frontend | React + Vite (thin client; Vite proxies `/api` and `/ws`) |
| Run | Docker Compose |

Host ports are chosen so this can sit next to another local stack: **8000** (API), **5173** (UI), **5433** (Postgres), **6380** (Redis), **9094** (Kafka).

## Quick start

**Need:** Docker Desktop, Node.js (for the UI), Git.

    git clone https://github.com/PragadishS/CodeForge.git
    cd CodeForge

    cp .env.example .env
    cp frontend/.env.example frontend/.env

    docker compose up --build

In a second terminal:

    cd frontend
    npm install
    npm run dev

Open **http://localhost:5173**

API health: `curl http://localhost:8000/api/health/`

Leave Docker running while you use the app. Stop with Ctrl+C in the Compose terminal, or `docker compose down`. The database volume is kept unless you add `-v`.

## First-time setup

Create a staff user (once):

    docker compose exec api python manage.py createsuperuser

Then:

1. Open **http://localhost:8000/admin/**
2. Add a **Tag**, a published **Problem**, and **TestCase** rows (at least one sample; hidden cases are judged but never sent to the browser)
3. In the UI: register → Problems → submit → watch the verdict → Leaderboard / profile

If a submission stays on `queued`, check `judge-worker` / `judge-worker-2` logs. Kafka and both workers must be up.

## Layout

    backend/     Django API, judge, ranking, Kafka worker
    frontend/    Vite + React
    docs/        Architecture and system-design notes
    docker-compose.yml

Local env files (`.env`, `frontend/.env`) are gitignored. Use the `.env.example` files as templates. Vite should keep `VITE_API_URL` and `VITE_WS_URL` empty so the browser stays on port 5173 and the proxy reaches Django.

More detail: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/SYSTEM_DESIGN.md](docs/SYSTEM_DESIGN.md).

---

made with ❤️ by Pragadish S
