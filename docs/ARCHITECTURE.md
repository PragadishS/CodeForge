# CodeForge — Architecture, database, and APIs

This is the project map. Read it when something feels confusing. We are **not** coding yet; this file is the plan.

**What CodeForge is:** a mini LeetCode on your laptop. Users solve Python/C++ problems. A judge runs their code against hidden tests. People compete on a leaderboard.

**How you will show it:** run Docker locally, record a demo, put the repo on GitHub. No public website, no AWS.

---

## Locked decisions

| Choice | Decision |
|---|---|
| Run where | Docker on your laptop |
| Money | ₹0 |
| Source of truth | PostgreSQL |
| Live ranks / cache | Redis |
| Job queue for the judge | Apache Kafka |
| API | Django REST Framework + JWT |
| Live updates | WebSockets (Django Channels) |
| UI | Thin React (demo only); staff use Django Admin |
| Files / email / Mongo / AWS | Out of scope |

**Interview one-liner:** Django accepts a submission, Kafka sends it to sandboxed workers, Redis serves the live board, Postgres is the source of truth.

---

## Beginner map: what each tool is, and why we use it

You do not need to be an expert before we code. Each tool has **one job** in this project.

### PostgreSQL (the notebook that never lies)

A **database** is a program that stores rows in tables, like Excel sheets that are linked together.

Postgres is our **source of truth**. If Redis or Kafka crash, we can rebuild everything from Postgres. Users, problems, test cases, submissions, and scores all live here.

### Redis (the sticky note on the fridge)

Redis stores small data **in memory** (RAM), so reads are very fast. It is **not** the official record.

We use it for:

- leaderboard ranks (who is #1 right now)
- “you already submitted 5 times this minute” (rate limit)
- “this submission is still Running” (short status)
- WebSocket fan-out (Channels uses Redis as a notice board)

If Redis is wiped, ranks are rebuilt from Postgres. Users do not lose their history.

### Kafka (the ticket machine)

The website must **not** run user code inside the HTTP request. That would freeze the page and crash Django.

Flow:

1. Django saves “submission #42 is queued”
2. Django puts a **ticket** on a Kafka **topic** (a named queue): `{ "submission_id": 42 }`
3. Django immediately tells the browser “got it”
4. A **worker** (another program) takes the ticket, runs the code, writes the verdict

**Topic** = the queue name (`submissions.created`).  
**Consumer group** = the team of workers (`codeforge.judge`). Kafka gives each ticket to **only one** worker in that team. Two workers = a small **worker pool**.

Kafka on your laptop in Docker is free. Hosted Kafka in the cloud is not; we will not use that.

### Docker (same kitchen on every machine)

Docker runs each program in a **container** (a small isolated Linux box). `docker compose up` starts Postgres, Redis, Kafka, Django, and workers together.

Why it matters for us:

- C++ compile (`g++`) and memory limits work properly on **Linux**, not as nicely on raw macOS
- You do not install Kafka by hand
- The judge cannot easily wreck your real laptop files

### Django + DRF + JWT (the waiter and the ID card)

- **Django** = Python web framework (URLs, models, admin)
- **DRF** = extra layer so we expose **JSON APIs** (`GET /api/problems`)
- **JWT** = a signed ID card. After login, React sends `Authorization: Bearer <token>` on every request. The server does not store that token in a session cookie (we still use JWT because you wanted to learn it)

### WebSockets (a phone call, not a letter)

Normal HTTP is: ask, get answer, hang up. For “is my code still running?” that would mean clicking refresh every second.

A **WebSocket** stays open. The worker finishes → Django pushes “Accepted” to the browser.

### AST (a map of the code, before it runs)

Python can parse code into a tree (**Abstract Syntax Tree**) without running it. We walk that tree and reject dangerous things (`import os`, `eval`, …). Then the sandbox still uses timeout + memory limits. AST is the “don’t even start this” filter.

### React (thin remote control)

React is only so you can click through a demo. Scoring, judging, and permissions live in Django. Admins create problems in **Django Admin**, not in React.

---

## How one submission travels (the whole story)

```
You click Submit
    → React POST /api/problems/two-sum/submissions  (+ JWT)
    → Django checks login, rate limit (Redis), problem exists
    → Postgres: new row Submission status=queued
    → Kafka: ticket {submission_id: 42}
    → Django returns 202 {id: 42}   (page does not wait)
    → React opens WebSocket /ws/submissions/42/

Worker picks up ticket
    → If status is already a final verdict, skip (idempotent: safe if Kafka delivers twice)
    → Postgres: status=running; WebSocket: "Running"
    → For Python: AST scan → if banned, Runtime Error, stop
    → For each test case: run in subprocess with time/memory caps
    → Compare printed output vs expected
    → Postgres: final verdict + runtime
    → If first Accepted: add points, update Redis leaderboard
    → WebSocket: "Accepted" (or WA / TLE / RE / MLE)
```

**Verdicts:** `queued`, `running`, `accepted`, `wrong_answer`, `time_limit`, `runtime_error`, `memory_limit`

---

## Database words (tiny glossary)

- **Table** — a sheet (e.g. `problems`)
- **Row** — one record (one problem)
- **Column / field** — one attribute (`title`)
- **PK (primary key)** — unique id of that row, usually `id`
- **FK (foreign key)** — “this row belongs to that other row” (`problem_id` points at `problems.id`)
- **Unique** — no duplicates (one score row per user per problem)
- **Nullable** — allowed to be empty (`runtime_ms` is empty until judged)

We will use Django’s built-in **User** table for login (username, email, password hash). Extra profile data sits in our **Profile** table, linked 1-to-1 with User.

---

## Tables and fields

### 1. `accounts_profile` — extra info on a user

**Why:** Django User already has username/password. We add role, cached score, streak.

| Field | Type | Meaning |
|---|---|---|
| id | PK | |
| user_id | FK User, unique | one profile per login |
| role | `user` / `moderator` / `admin` | permissions |
| total_score | int, default 0 | copy of points for fast profile view |
| current_streak | int | consecutive days with at least one submission |
| longest_streak | int | best streak ever |
| last_active_date | date, null | last day they submitted; used to continue or break the streak |
| created_at | datetime | |

Solved counts (Easy/Medium/Hard) are **computed** from `user_problem_score` where they have an Accepted, not stored as three extra numbers that can go stale.

### 2. `problems_tag` — topic labels

| Field | Type | Meaning |
|---|---|---|
| id | PK | |
| name | string, unique | e.g. Arrays, DP, Graphs |
| slug | string, unique | `arrays` for URLs |

### 3. `problems_problem` — the question

| Field | Type | Meaning |
|---|---|---|
| id | PK | |
| title | string | Two Sum |
| slug | string, unique | `two-sum` |
| description | text | statement |
| constraints | text | 1 ≤ n ≤ 10^5 |
| difficulty | `easy` / `medium` / `hard` | scoring + filters |
| time_limit_ms | int | e.g. 2000 |
| memory_limit_kb | int | e.g. 256000 |
| is_published | bool | drafts stay admin-only |
| created_by_id | FK User | admin who created it |
| created_at, updated_at | datetime | |
| tags | M2M Tag | many tags per problem |

**M2M (many-to-many):** a problem has many tags; a tag is on many problems. Django creates a small join table for this.

### 4. `problems_testcase` — input / expected output

| Field | Type | Meaning |
|---|---|---|
| id | PK | |
| problem_id | FK Problem | |
| input_data | text | what we feed stdin |
| expected_output | text | what stdout should be |
| is_hidden | bool | `true` = secret judge test; never sent to React |
| order | int | run order |
| points | int, default 0 | unused for v1 scoring (first AC is all-or-nothing) |

Visible **examples** on the problem page = test cases with `is_hidden=false`. Hidden tests = `is_hidden=true`. One table, two uses.

### 5. `judge_submission` — one attempt

| Field | Type | Meaning |
|---|---|---|
| id | PK | this is what we put on Kafka |
| user_id | FK User | who submitted |
| problem_id | FK Problem | |
| language | `python` / `cpp` | |
| code | text | full source |
| verdict | see list above | |
| runtime_ms | int, null | best/max among tests; filled after judge |
| memory_kb | int, null | |
| error_message | text, null | short compiler/runtime error, truncated |
| created_at | datetime | |
| judged_at | datetime, null | |

### 6. `judge_submissiontestresult` — per-test outcome

**Why:** analytics (acceptance, common WA, runtime distribution). We do **not** return hidden test outputs to the user.

| Field | Type | Meaning |
|---|---|---|
| id | PK | |
| submission_id | FK Submission | |
| testcase_id | FK TestCase | |
| verdict | same verdict enum | |
| runtime_ms | int, null | |
| memory_kb | int, null | |
| actual_output | text, null, truncated | for “common wrong answers”; never shown for hidden tests in the API |

### 7. `ranking_userproblemscore` — points for a user on a problem

**Why:** first Accepted awards points once. Wrong tries before that AC add a penalty. Unique together `(user, problem)`.

| Field | Type | Meaning |
|---|---|---|
| id | PK | |
| user_id | FK User | |
| problem_id | FK Problem | |
| wrong_attempts | int | WA/TLE/RE/MLE before first AC |
| points_awarded | int | 0 until AC, then Easy 10 / Medium 25 / Hard 50 minus penalty |
| solved_at | datetime, null | when first AC happened |
| first_ac_id | FK Submission, null | which submission got AC |

**Penalty rule (fixed for v1):** each failed attempt before first AC subtracts **2** points. Floor is **1** if they eventually get AC (never 0 or negative for a solved problem).

Example: Medium (25), 3 wrong tries, then AC → `25 - 6 = 19`.

### 8. `accounts_activityday` — heatmap + streak fuel

| Field | Type | Meaning |
|---|---|---|
| id | PK | |
| user_id | FK User | |
| date | date | calendar day (UTC) |
| submissions_count | int | how many that day |
| unique (user, date) | | one row per user per day |

**Streak:** look at consecutive dates ending at today (or yesterday if they have not submitted yet today). Pure Python `datetime` on this table.

---

## Redis keys (not tables)

Redis uses **keys**, like labeled boxes.

| Key | Type | Use |
|---|---|---|
| `leaderboard:global` | sorted set | member = user id, score = total points |
| `leaderboard:weekly:{year}-{week}` | sorted set | same, but points from ACs this week |
| `ratelimit:submit:{user_id}` | counter + TTL | e.g. max 10 submits / minute |
| `submission:status:{id}` | string/json | queued/running/final for fast poll backup |
| Channels layer | Redis pub/sub | Django uses this internally for WebSockets |

**Weekly board:** Redis is the fast copy. Real ACs still live in Postgres (`solved_at` this week). A management command on Monday deletes the old weekly key (or we just start using a new week number in the key — even simpler, no delete needed).

---

## Kafka

| Piece | Value | Plain meaning |
|---|---|---|
| Topic | `submissions.created` | the queue name |
| Message | `{"submission_id": 42}` | workers load the rest from Postgres |
| Partitions | 3 | Kafka can split the queue; 2 workers can share work |
| Consumer group | `codeforge.judge` | workers in this group share tickets; each ticket → one worker |
| Delivery | at-least-once | a ticket might appear twice if a worker dies; we skip if verdict is already final |

Workers are **not** HTTP servers. They are a Python loop: “wait for Kafka message → judge → write DB”.

---

## WebSockets

| Path | Who connects | What they receive |
|---|---|---|
| `/ws/submissions/{id}/` | the user who owns that submission (JWT) | verdict updates |
| `/ws/leaderboard/` | anyone logged in | “ranks changed” after an AC (client then GET the board, or we send top 20) |

Auth: same JWT as REST, sent on connect.

---

## Roles

| Role | Can do |
|---|---|
| user | register, solve, see own history, see public profiles/boards |
| moderator | reserved on `Profile` (no extra powers in v1) |
| admin | Django Admin: problems, tags, test cases |

Hidden test cases are **never** in GET problem. Only the worker process reads them from Postgres.

---

## HTTP APIs

All JSON, prefix `/api/`. JWT required unless marked public.

### Auth

| Method | Path | Who | What |
|---|---|---|---|
| POST | `/api/auth/register/` | public | create user + profile role=user |
| POST | `/api/auth/token/` | public | username+password → access + refresh JWT |
| POST | `/api/auth/token/refresh/` | public | new access token |
| GET | `/api/auth/me/` | logged in | my profile, scores, streaks |

### Problems (read via API; write via Django Admin)

| Method | Path | Who | What |
|---|---|---|---|
| GET | `/api/problems/` | public or logged in | list: title, difficulty, tags, solved-by-me flag if logged in |
| GET | `/api/problems/{slug}/` | public | statement, constraints, **sample** tests only |
| GET | `/api/problems/{slug}/stats/` | public | analytics: acceptance rate, language split, runtime buckets |

### Submissions

| Method | Path | Who | What |
|---|---|---|---|
| POST | `/api/problems/{slug}/submissions/` | user | body: `{language, code}` → 202 `{id, verdict: queued}` |
| GET | `/api/submissions/` | user | my history, filter by problem/verdict |
| GET | `/api/submissions/{id}/` | owner | code, verdict, runtime; **no** hidden test outputs |

### Leaderboard

| Method | Path | Who | What |
|---|---|---|---|
| GET | `/api/leaderboard/?period=global` | public | ranked list from Redis (fallback Postgres) |
| GET | `/api/leaderboard/?period=weekly` | public | this week |
| GET | `/api/leaderboard/me/` | logged in | my rank + score |

### Profiles

| Method | Path | Who | What |
|---|---|---|---|
| GET | `/api/users/{username}/` | public | score, solved by difficulty, streak |
| GET | `/api/users/{username}/heatmap/` | public | list of `{date, count}` for the grid |
| GET | `/api/users/{username}/submissions/` | public | recent verdicts (not necessarily full code) |

Staff **create/edit problems and test cases in Django Admin**, not extra problem-editor APIs. That saves frontend work.

---

## Django apps (folders we will create later)

| App | Holds |
|---|---|
| `config` | settings, URLs, Channels, JWT |
| `accounts` | profile, register, heatmap, streaks |
| `problems` | problem, tag, test case, stats |
| `judge` | submission, Kafka produce, worker loop, sandbox |
| `ranking` | scores, leaderboard Redis, weekly command |

---

## Docker Compose services (when we code)

| Service | Role |
|---|---|
| `postgres` | source of truth |
| `redis` | ranks, rate limit, Channels |
| `kafka` | KRaft broker (no ZooKeeper) |
| `api` | Django REST + WebSocket |
| `judge-worker` | scale to 2 consumers |
| `web` | React (or `npm run dev` on the host) |

C++: `g++` exists **only** in the worker image.

### Host ports (office laptop — do not use 5432 / 6379 / 9092)

| Service | Mac port | Inside container |
|---|---|---|
| Postgres | 5433 | 5432 |
| Redis | 6380 | 6379 |
| Django API | 8000 | 8000 |

Start (from repo root): `docker compose up -d --build`  
Health check: `http://localhost:8000/api/health/`  
Admin: `http://localhost:8000/admin/` (after `createsuperuser`)  
Stop only CodeForge: `docker compose stop` (never `down -v` unless you mean to wipe our DB)

---

## Build order

1. Docker Compose + Postgres + empty Django project *(done)*  
2. User, Profile, JWT, Django Admin + serializers validation, pagination defaults, structured logging  
3. Problem, Tag, TestCase + GET APIs + indexes, pagination, cache-aside  
4. Submission row + Kafka produce + Python worker + verdicts + idempotent skip  
5. AST + timeout + memory + C++ in Docker + TLE as a verdict + worker logs  
6. Redis leaderboard + WebSockets + rate limit  
7. Profile, streaks, heatmap *(done)*  
8. Thin React demo (optional); C++ judge if we want it later 

See [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md) for what each pattern means.

---

## Out of scope

AWS, S3, SES, MongoDB, public hosting, contests, Google login, email, file uploads, Kubernetes, auto-scaling. **Discussions** (comments, votes, green badge, soft-hide). Kafka is **only** for judging. We **do** include indexes, pagination, cache-aside, Kafka idempotency, serializer validation, structured logs, and TLE-as-SLA (no extra infra).
