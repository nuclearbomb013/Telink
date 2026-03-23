# Bug Tracking & Scope Config

> Last Updated: 2026-03-23
> Backend: `E:\KIMI_web\backend`

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| `[ ]` | Pending |
| `[~]` | In Progress |
| `[x]` | Completed |
| `[!]` | Blocked |
| `[G]` | **GLOBAL** (cascades to others) |

---

## Cascade Map

```
[G] P0-10 (python-jose) ──► P0-3, P0-4
[G] P0-4 (JWT revoke) ──► needs token_blacklist.py
[G] P1-15 (DB pool) ──► P1-22
[G] P1-20 (Logging) ──► All fixes
[G] P1-19 (Exception handler) ──► All API responses
[G] P1-11 (Rate limiting) ──► All auth endpoints
```

---

## P0 - Critical

| ID | Status | Problem | Location |
|----|--------|---------|----------|
| P0-1 | `[x]` | Hardcoded SECRET_KEY | `app/config.py:23` |
| P0-2 | `[x]` | DB password plaintext | `.env:5` |
| P0-3 | `[x]` | Reset token in response | `app/api/v1/auth.py:364` |
| P0-4 | `[x]` | JWT no revocation | `app/api/deps.py:43` |
| P0-5 | `[x]` | PostLike unique missing | `app/models/post.py:76` |
| P0-6 | `[x]` | CommentLike unique missing | `app/models/comment.py:43` |
| P0-7 | `[x]` | Slug race condition | `app/api/v1/forum.py:44` |
| P0-8 | `[x]` | View count race | `app/api/v1/forum.py:187` |
| P0-9 | `[x]` | CORS too permissive | `app/main.py:36` |
| P0-10 | `[x]` | python-jose vulnerable | `requirements.txt:18` |

## P1 - Medium

| ID | Status | Problem | Location |
|----|--------|---------|----------|
| P1-11 | `[G]` `[ ]` | Rate limiting missing | All auth endpoints |
| P1-12 | `[x]` | User enumeration | `app/api/v1/auth.py:140` |
| P1-13 | `[x]` | Timing attack | `app/api/v1/auth.py:50` |
| P1-14 | `[ ]` | Avatar URL validation | `app/schemas/auth.py:22` |
| P1-15 | `[G]` `[x]` | DB pool missing | `app/db/session.py:12` |
| P1-16 | `[x]` | utcnow deprecated | Multiple |
| P1-17 | `[x]` | Enum unused | `app/models/user.py:29` |
| P1-18 | `[ ]` | Indexes missing | Multiple |
| P1-19 | `[G]` `[x]` | Exception handler missing | `app/main.py` |
| P1-20 | `[G]` `[x]` | Logging missing | Global |
| P1-21 | `[x]` | Content no max length | `app/schemas/post.py:24` |
| P1-22 | `[x]` | init_db dangerous | `app/db/session.py:51` |

## P2 - Low

| ID | Status | Problem | Location |
|----|--------|---------|----------|
| P2-23 | `[ ]` | Pydantic v2 compat | Multiple |
| P2-24 | `[ ]` | Unused imports | `app/api/v1/users.py:6` |
| P2-25 | `[ ]` | Duplicate pwd validation | `security.py`, `auth.py` |
| P2-26 | `[ ]` | Timestamp unit | Multiple |
| P2-27 | `[x]` | Deps not locked | `requirements.txt` |
| P2-28 | `[x]` | Health check incomplete | `app/main.py:48` |
| P2-29 | `[ ]` | XSS protection | User input |
| P2-30 | `[ ]` | DB session not closed | `app/api/deps.py:20` |

## P3 - Code Quality (Auto-detected 2026-03-22, Updated 2026-03-23)

| ID | Status | Problem | Location | Source |
|----|--------|---------|----------|--------|
| P3-31 | `[x]` | Unused import: timezone | `app/api/v1/auth.py:5` | ruff F401 |
| P3-32 | `[x]` | Unused import: Optional | `app/api/v1/auth.py:6` | ruff F401 |
| P3-33 | `[x]` | Unused import: HTTPException | `app/api/v1/auth.py:7` | ruff F401 |
| P3-34 | `[x]` | Unused import: status | `app/api/v1/auth.py:7` | ruff F401 |
| P3-35 | `[x]` | Unused import: UnauthorizedException | `app/api/v1/auth.py:27` | ruff F401 |
| P3-36 | `[x]` | Unused import: ConflictException | `app/api/v1/auth.py:27` | ruff F401 |
| P3-37 | `[x]` | Unused import: NotFoundException | `app/api/v1/auth.py:27` | ruff F401 |
| P3-38 | `[x]` | Unused import: BadRequestException | `app/api/v1/auth.py:27` | ruff F401 |
| P3-39 | `[x]` | Unused import: datetime | `app/api/v1/forum.py:6` | ruff F401 |
| P3-40 | `[x]` | Unused import: Optional | `app/api/v1/forum.py:8` | ruff F401 |
| P3-41 | `[x]` | Unused import: List | `app/api/v1/forum.py:9` | ruff F401 |
| P3-42 | `[x]` | Unused import: select | `app/api/v1/forum.py:10` | ruff F401 |
| P3-43 | `[x]` | Unused import: desc | `app/api/v1/forum.py:11` | ruff F401 |
| P3-44 | `[x]` | Unused import: PostCreate | `app/api/v1/forum.py:13` | ruff F401 |
| P3-45 | `[x]` | Unused import: PostUpdate | `app/api/v1/forum.py:13` | ruff F401 |
| P3-46 | `[x]` | Unused import: ForbiddenException | `app/api/v1/users.py:21` | ruff F401 |
| P3-47 | `[x]` | Bare except clause | `app/config.py:83` | ruff E722 |
| P3-48 | `[x]` | Bare except clause | `app/config.py:92` | ruff E722 |
| P3-49 | `[x]` | Bare except clause | `app/config.py:101` | ruff E722 |
| P3-50 | `[x]` | Unused import: Path | `app/core/logging.py:10` | ruff F401 |
| P3-51 | `[x]` | Unused import: Boolean | `app/models/token_blacklist.py:6` | ruff F401 |
| P3-52 | `[x]` | Unused import: datetime | `app/schemas/post.py:7` | ruff F401 |
| P3-53 | `[x]` | Unused import: datetime | `app/schemas/user.py:7` | ruff F401 |
| P3-54 | `[ ]` | Hardcoded password: access | `app/api/v1/auth.py:232` | bandit B106 |
| P3-55 | `[ ]` | Insecure random for slug | `app/api/v1/forum.py:64` | bandit B311 |
| P3-56 | `[ ]` | Bind to all interfaces | `app/main.py:118` | bandit B104 |
| P3-57 | `[ ]` | Hardcoded password default | `app/core/security.py:87` | bandit B107 |

## P4 - MyPy Type Errors (Auto-detected 2026-03-23)

> Note: These are SQLAlchemy Column type annotation issues, not runtime errors.
> MyPy reports 89 errors total, primarily in API endpoint files.

| ID | Status | Problem | Location | Count |
|----|--------|---------|----------|-------|
| P4-58 | `[ ]` | AsyncGenerator return type | `app/api/deps.py:21` | 1 |
| P4-59 | `[ ]` | Column type mismatch in UserPublic | `app/api/v1/users.py:47-88` | 18 |
| P4-60 | `[ ]` | Column type mismatch in UserResponse | `app/api/v1/users.py:180-188` | 9 |
| P4-61 | `[ ]` | Column type mismatch in UserStats | `app/api/v1/users.py:218-220` | 3 |
| P4-62 | `[ ]` | Column assignment type error | `app/api/v1/users.py:164-173` | 4 |
| P4-63 | `[ ]` | Column type mismatch in NotificationResponse | `app/api/v1/notifications.py:86-93` | 8 |
| P4-64 | `[ ]` | Column type mismatch in PostResponse | `app/api/v1/forum.py:360-382` | 16 |
| P4-65 | `[ ]` | Column type mismatch in CommentResponse | `app/api/v1/comments.py:286-293` | 8 |
| P4-66 | `[ ]` | Column assignment type error (comments) | `app/api/v1/comments.py:342-413` | 7 |
| P4-67 | `[ ]` | Column type mismatch in AuthUser | `app/api/v1/auth.py:99-103,194-198,494-498` | 15 |
| P4-68 | `[ ]` | Column assignment type error (auth) | `app/api/v1/auth.py:92,248,319,458` | 4 |
| P4-69 | `[ ]` | List item type incompatible | `app/core/logging.py:50` | 1 |
| P4-70 | `[ ]` | Return value type incompatible | `app/models/token_blacklist.py:35` | 1 |
| P4-71 | `[ ]` | Password verify arg type | `app/api/v1/auth.py:55` | 1 |

---

---

## New Files Required

| File | For | Priority | Status |
|------|-----|----------|--------|
| `app/models/token_blacklist.py` | P0-4 | P0 | `[ ]` |
| `app/core/rate_limit.py` | P1-11 | P1 | `[ ]` |
| `app/core/logging.py` | P1-20 | P1 | `[ ]` |

---

## Fix Order (Recommended)

```
Phase 1 (GLOBAL):  P1-20 → P0-10 → P1-15
Phase 2 (Security): P0-1 → P0-2 → P0-4 → P0-3
Phase 3 (Data):    P0-5 → P0-6 → P0-7 → P0-8
Phase 4 (API):     P0-9 → P1-11 → P1-12 → P1-13
Phase 5:           P1-14 → P1-16...P2-30
```

---

## Scope Config (Per-Bug Settings)

### P0-1: Hardcoded SECRET_KEY
```yaml
target: P0-1
allowed: [app/config.py, .env.example]
locked: [app/main.py]
strategy: Use os.environ.get with fallback
test: pytest tests/test_config.py -v
```

### P0-2: Database Password Plaintext
```yaml
target: P0-2
allowed: [.env, .env.example, docker-compose.yml]
locked: []
strategy: Use Docker secrets or vault
test: pytest tests/test_db.py -v
```

### P0-3: Reset Token in Response
```yaml
target: P0-3
allowed: [app/api/v1/auth.py]
locked: []
strategy: Remove token from response, send via email
test: pytest tests/test_auth.py::test_reset_password -v
depends_on: [P0-10]
```

### P0-4: JWT No Revocation
```yaml
target: P0-4
allowed: [app/api/deps.py, app/models/token_blacklist.py, app/core/security.py]
locked: []
strategy: Implement token blacklist with Redis/DB
test: pytest tests/test_auth.py::test_token_revocation -v
cascades_to: [P0-3]
requires_new: token_blacklist.py
```

### P0-5: PostLike Unique Constraint
```yaml
target: P0-5
allowed: [app/models/post.py, app/db/session.py]
locked: []
strategy: Add __table_args__ unique constraint
test: pytest tests/test_models.py -v
```

### P0-6: CommentLike Unique Constraint
```yaml
target: P0-6
allowed: [app/models/comment.py, app/db/session.py]
locked: []
strategy: Add __table_args__ unique constraint
test: pytest tests/test_models.py -v
```

### P0-7: Slug Race Condition
```yaml
target: P0-7
allowed: [app/api/v1/forum.py, app/models/post.py]
locked: []
strategy: Use DB-level unique + retry on conflict
test: pytest tests/test_forum.py::test_slug_race -v
```

### P0-8: View Count Race
```yaml
target: P0-8
allowed: [app/api/v1/forum.py]
locked: []
strategy: Use F() expression or select_for_update
test: pytest tests/test_forum.py::test_view_count -v
```

### P0-9: CORS Too Permissive
```yaml
target: P0-9
allowed: [app/main.py, app/config.py]
locked: []
strategy: Restrict to specific origins from env
test: pytest tests/test_cors.py -v
```

### P0-10: python-jose Vulnerable
```yaml
target: P0-10
allowed: [requirements.txt, app/core/security.py, app/api/deps.py]
locked: []
strategy: Replace with PyJWT + cryptography
test: pytest tests/test_security.py -v
cascades_to: [P0-3, P0-4]
```

### P1-11: Rate Limiting Missing
```yaml
target: P1-11
allowed: [app/core/rate_limit.py, app/api/deps.py, app/main.py]
locked: []
strategy: Add slowapi or custom middleware
test: pytest tests/test_rate_limit.py -v
requires_new: rate_limit.py
```

### P1-12: User Enumeration
```yaml
target: P1-12
allowed: [app/api/v1/auth.py]
locked: []
strategy: Generic error message for login/register
test: pytest tests/test_auth.py::test_enumeration -v
```

### P1-13: Timing Attack
```yaml
target: P1-13
allowed: [app/core/security.py, app/api/v1/auth.py]
locked: []
strategy: Use secrets.compare_digest for pwd check
test: pytest tests/test_security.py::test_timing -v
```

### P1-14: Avatar URL Validation
```yaml
target: P1-14
allowed: [app/schemas/auth.py]
locked: []
strategy: Add HttpUrl validator with whitelist
test: pytest tests/test_schemas.py -v
```

### P1-15: DB Pool Missing
```yaml
target: P1-15
allowed: [app/db/session.py, app/config.py]
locked: []
strategy: Configure pool_size, max_overflow, pool_pre_ping
test: pytest tests/test_db.py -v
cascades_to: [P1-22]
```

### P1-16: utcnow Deprecated
```yaml
target: P1-16
allowed: [Multiple files - grep datetime.utcnow]
locked: []
strategy: Replace with datetime.now(timezone.utc)
test: pytest tests/ -v
```

### P1-17: Enum Unused
```yaml
target: P1-17
allowed: [app/models/user.py]
locked: []
strategy: Use enum in field or remove
test: pytest tests/test_models.py -v
```

### P1-18: Indexes Missing
```yaml
target: P1-18
allowed: [app/models/*.py]
locked: []
strategy: Add Index() to frequently queried columns
test: pytest tests/test_models.py -v
```

### P1-19: Exception Handler Missing
```yaml
target: P1-19
allowed: [app/main.py, app/core/exceptions.py]
locked: []
strategy: Add global exception handlers
test: pytest tests/test_exceptions.py -v
```

### P1-20: Logging Missing
```yaml
target: P1-20
allowed: [app/core/logging.py, app/main.py]
locked: []
strategy: Configure structured logging
test: pytest tests/test_logging.py -v
requires_new: logging.py
cascades_to: [ALL]
```

### P1-21: Content No Max Length
```yaml
target: P1-21
allowed: [app/schemas/post.py, app/models/post.py]
locked: []
strategy: Add max_length constraint
test: pytest tests/test_schemas.py -v
```

### P1-22: init_db Dangerous
```yaml
target: P1-22
allowed: [app/db/session.py]
locked: []
strategy: Remove auto-create in production
test: pytest tests/test_db.py -v
depends_on: [P1-15]
```

### P2-23 to P2-30 (Low Priority)
```yaml
strategy: Fix in batch after P0/P1 complete
test: pytest tests/ -v
```

---

## Fix History

| Date | ID | Summary | Commit |
|------|-----|---------|--------|
| 2026-03-22 | P0-3 | Remove reset token from response | - |
| 2026-03-22 | P0-7 | Add retry mechanism for slug race condition | - |
| 2026-03-22 | P0-8 | Use atomic update for view count | - |
| 2026-03-22 | P0-9 | Restrict CORS methods and headers | - |
| 2026-03-22 | P1-12 | Use generic error for registration | - |
| 2026-03-22 | P1-13 | Add timing attack prevention | - |
| 2026-03-22 | P1-15 | Add DB pool configuration | - |
| 2026-03-22 | P1-22 | Prevent init_db in production | - |
| 2026-03-23 | P1-17 | Use UserRole enum in User model | - |
| 2026-03-23 | P1-19 | Add global exception handlers | - |
| 2026-03-23 | P1-21 | Add max_length constraint to content | - |
| 2026-03-23 | P2-27 | Lock dependency versions | - |
| 2026-03-23 | P2-28 | Add database check to health endpoint | - |

---

## Stats

| Priority | Total | Done | Pending | Blocked | Rate |
|----------|-------|------|---------|---------|------|
| P0 | 10 | 10 | 0 | 0 | 100% |
| P1 | 12 | 9 | 3 | 0 | 75% |
| P2 | 8 | 2 | 6 | 0 | 25% |
| P3 | 27 | 23 | 4 | 0 | 85% |
| P4 | 14 | 0 | 14 | 0 | 0% |
| **Total** | **71** | **44** | **27** | **0** | **62%** |

---

## Current Review Session

> Auto-generated by review-skill
> Last detection: 2026-03-23

**Detection Tools Used**:
- ✅ Ruff (0 errors)
- ⚠️ MyPy (89 type errors → grouped into 14 issues)
- ⚠️ Bandit (4 warnings)

**Detection Summary**:
```
RUFF:    All checks passed ✓
MYPY:    89 type errors found (SQLAlchemy Column type issues)
BANDIT:  4 security warnings (3 Low, 1 Medium)
```

**Found Issues**:
```
P0-1: Hardcoded SECRET_KEY [CRITICAL] ✓ FIXED
P0-2: DB password plaintext [CRITICAL] ✓ FIXED
P0-3: Reset token in response [HIGH] ✓ FIXED
P0-4: JWT no revocation [HIGH] ✓ FIXED
P0-5: PostLike unique missing [HIGH] ✓ FIXED
P0-6: CommentLike unique missing [HIGH] ✓ FIXED
P0-7: Slug race condition [HIGH] ✓ FIXED
P0-8: View count race [HIGH] ✓ FIXED
P0-9: CORS too permissive [MEDIUM] ✓ FIXED
P0-10: python-jose vulnerable [HIGH] ✓ FIXED
P1-11: Rate limiting missing [MEDIUM]
P1-12: User enumeration [MEDIUM] ✓ FIXED
P1-13: Timing attack [MEDIUM] ✓ FIXED
P1-14: Avatar URL validation [LOW]
P1-15: DB pool missing [MEDIUM] ✓ FIXED
P1-16: utcnow deprecated [LOW] ✓ FIXED
P1-17: Enum unused [LOW]
P1-18: Indexes missing [LOW]
P1-19: Exception handler missing [MEDIUM]
P1-20: Logging missing [MEDIUM] ✓ FIXED
P1-21: Content no max length [LOW]
P1-22: init_db dangerous [MEDIUM] ✓ FIXED
P3-31~53: Ruff issues ✓ FIXED
P3-54~57: Bandit warnings (pending)
P4-58~71: MyPy type errors (new)
```

**Fix Queue**:
```
Phase 1 (GLOBAL): ✓ DONE (P1-20, P0-10, P1-15)
Phase 2 (Security): ✓ DONE (P0-1, P0-2, P0-4, P0-3)
Phase 3 (Data): ✓ DONE (P0-5, P0-6, P0-7, P0-8)
Phase 4 (API): ✓ DONE (P0-9, P1-12, P1-13)
Phase 5: P1-14, P1-17, P1-18, P1-19, P1-21 remaining
Phase 6 (New): P3-54~57, P4-58~71
```

**Progress**:
| Total | Fixed | Failed | Pending |
|-------|-------|--------|---------|
| 71 | 39 | 0 | 32 |