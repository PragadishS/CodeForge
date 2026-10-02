# CodeForge — system design we will actually build

These patterns use **Postgres, Redis, Kafka, Django** only. No new products.

We add each one **when the feature needs it**, then pause: what problem, what pattern, interview line, then you type the code.

**Passwords:** Django hashes before Postgres. Hasher order is bcrypt (`BCryptSHA256PasswordHasher`) then PBKDF2 so old users still log in. Never store plaintext; always `create_user`.

---

## 1. Indexes — lists stay fast

**When:** `Problem`, `Submission`, `UserProblemScore` models.

**What:** An index is a lookup book. Without it, Postgres **scans every row**. With it, it jumps to `two-sum` or “this user’s submissions.”

**What we add:**

- `Problem.slug` — `unique=True` already creates an index
- `UserProblemScore` — `unique_together` (user, problem)
- `Submission` — index on `(user, created_at)` and `(problem, created_at)`

**Interview:** *“We index filter/sort columns, not every column.”*

---

## 2. Pagination — don’t return 10,000 rows

**When:** problem list, submission history (DRF).

**What:** Page 1 = first 20, page 2 = next 20. **Offset** pagination (`?page=2`) is enough here.

**What we add:** DRF `PageNumberPagination`, `PAGE_SIZE = 20`.

**Mention in interviews:** cursor pagination (`created_at + id`) is better for huge feeds; we don’t need it at this scale.

---

## 3. Cache-aside — Redis as a copy, Postgres as truth

**When:** published problem list (and later leaderboard, already planned).

**What:**

1. Read Redis key `problems:published`
2. If missing, query Postgres, `SETEX` into Redis (e.g. 60s)
3. On Admin save/unpublish: **delete** that key

**Interview:** *“Cache-aside. If Redis is empty, we rebuild. We never write problems only to Redis.”*

---

## 4. Retries + idempotent skip — Kafka at-least-once

**When:** judge worker.

**What:** Worker dies after judging → Kafka may deliver the same `submission_id` again.

**What we add:** If verdict is already `accepted` / `wrong_answer` / `tle` / `re` / `mle`, **skip**. Only `queued` / `running` is judged (with care if `running` is stuck).

**Interview:** *“At-least-once plus idempotency, not exactly-once magic.”*

---

## 5. Request validation — serializers as the API contract

**When:** every endpoint (starting with register / me).

**What:** JSON must match types, required fields, min password length. Bad input → **400**, not a crash.

**Interview:** *“The serializer is the contract. Views don’t trust raw JSON.”*

---

## 6. Soft hide vs delete — skipped in this repo

**When:** would have been problem comments (`is_hidden`). **Not building discussions.**

**What (interview only):** Moderator **hides** a UGC row instead of deleting it. Data stays for audit. Public APIs skip hidden rows.

**Interview:** *“Soft hide for UGC; hard delete only if we must.”*

---

## 7. Observability — structured logs

**When:** API now (basic config); worker when judging exists.

**What:** Logs as one line of key=value or JSON: `submission_id`, `user_id`, `verdict`, `duration_ms`. Then `docker compose logs api` is searchable.

**Interview:** *“You can’t debug a queue without IDs in every log line.”*

---

## 8. Graceful timeout — TLE is a verdict, not a 500

**When:** sandbox / subprocess.

**What:** Time limit is a **product SLA** (e.g. 2000 ms). Process is killed → verdict `time_limit`. The HTTP API already returned 202. User sees TLE, not “Internal Server Error.”

**Interview:** *“Timeouts are designed outcomes for untrusted code.”*

---

## Build order (where each lands)

| Phase | Feature | Patterns |
|---|---|---|
| 2 | Register / me / JWT | Validation (serializers) |
| 2 | Settings | Pagination defaults, structured logging |
| 3 | Problems | Indexes, pagination, cache-aside |
| 4–5 | Judge | Idempotent skip, TLE-as-verdict, worker logs |
| 6 | Leaderboard / WS | Cache-aside ranks, rate limit |
| 7 | Profile / heatmap | ActivityDay unique (user, date) |
