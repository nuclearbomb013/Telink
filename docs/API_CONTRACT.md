# TechInk API Contract

> This document maps each API module across frontend services, backend endpoints, and database tables. It serves as the single source of truth for the data layer architecture.

## Legend

| Status | Meaning |
|--------|---------|
| ✅ Backend API | Real backend endpoint, fully functional |
| 🚧 In Progress | Backend exists but has known gaps |
| 📦 Mock | Frontend uses localStorage / hardcoded data |
| 🔮 Planned | Not yet implemented, planned |

---

## 1. Authentication (`/auth`)

| | Detail |
|---|---|
| **Frontend service** | `services/auth.service.ts` |
| **Backend file** | `api/v1/auth.py` |
| **DB table** | `users`, `refresh_tokens`, `password_reset_tokens` |
| **Status** | ✅ Backend API |

**Endpoints:**
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/login` | No | Login with username/email + password |
| POST | `/auth/register` | No | Register new user |
| POST | `/auth/refresh` | Cookie | Refresh access token via HttpOnly cookie |
| GET | `/auth/me` | Bearer | Get current user profile |
| POST | `/auth/logout` | Bearer | Logout (revoke token, clear cookie) |
| POST | `/auth/forgot-password` | No | Request password reset email |
| POST | `/auth/reset-password` | No | Reset password with token |

**Security (P0-4):**
- Access token: stored in memory only (module-level variable in `apiClient.ts`), never localStorage
- Refresh token: HttpOnly, SameSite cookie set by backend
- Auto-refresh on 401: `apiClient.ts` intercepts 401 responses and retries

---

## 2. Users (`/users`)

| | Detail |
|---|---|
| **Frontend service** | `services/user.service.ts` (✅ real API) |
| **Backend file** | `api/v1/users.py` |
| **DB table** | `users` |
| **Status** | ✅ Backend API — frontend fully migrated from localStorage mock |

**Endpoints:**
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users/list` | No | List active users (search, pagination) |
| GET | `/users/check-username` | No | Check username availability |
| GET | `/users/{id}` | No | Get user by ID |
| GET | `/users/username/{name}` | No | Get user by username |
| PUT | `/users/{id}` | Bearer | Update own profile (or admin) |
| GET | `/users/{id}/stats` | No | Get user stats (posts, comments, likes, follows) |

---

## 3. Forum (`/forum`)

| | Detail |
|---|---|
| **Frontend service** | `lib/apiClient.ts` (via `forumApi`) |
| **Backend file** | `api/v1/forum.py` |
| **DB tables** | `posts`, `post_tags`, `post_likes` |
| **Status** | ✅ Backend API |

**Endpoints:**
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/forum/posts` | No | List posts (filter/sort/paginate) |
| GET | `/forum/posts/{id}` | No | Get post by ID |
| GET | `/forum/posts/slug/{slug}` | No | Get post by slug |
| POST | `/forum/posts` | Bearer | Create post |
| PUT | `/forum/posts/{id}` | Bearer | Update post (author only) |
| DELETE | `/forum/posts/{id}` | Bearer | Delete post (author/admin) |
| POST | `/forum/posts/{id}/like` | Bearer | Toggle like (atomic SQL update) |
| POST | `/forum/posts/{id}/pin` | Bearer | Toggle pin (admin/mod) |
| POST | `/forum/posts/{id}/lock` | Bearer | Toggle lock (admin/mod) |
| GET | `/forum/stats` | No | Forum statistics |

---

## 4. Articles (`/articles`)

| | Detail |
|---|---|
| **Frontend service** | `services/articles.service.ts` (real API), `services/submission.service.ts` (drafts) |
| **Backend file** | `api/v1/articles.py` |
| **DB tables** | `articles`, `article_tags` |
| **Status** | ✅ Backend API — frontend migrated from localStorage; drafts only in localStorage |

**Endpoints:**
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/articles` | No | List published articles (filter/sort/paginate) |
| GET | `/articles/slug/{slug}` | No | Get published article by slug |
| GET | `/articles/{id}` | Bearer | Get article by ID (author sees drafts) |
| GET | `/articles/me` | Bearer | Get current user's articles (incl. drafts) |
| POST | `/articles` | Bearer | Create article (draft or published) |
| PUT | `/articles/{id}` | Bearer | Update article (author only) |
| DELETE | `/articles/{id}` | Bearer | Delete article (author/admin) |
| POST | `/articles/{id}/publish` | Bearer | Publish article (author/admin) |

**Data mapping (backend → frontend):**
| Backend (snake_case) | Frontend (camelCase) | Notes |
|---|---|---|
| `cover_image` | `image` | |
| `author_name` | `author` | |
| `published_at` (ms) | `publishDate` (YYYY-MM-DD) | |
| `created_at` (ms) | `createdAt` (ms) | |
| `updated_at` (ms) | `updatedAt` (ms) | |
| `tags` (string[]) | `tags` (string[]) | Direct pass-through |

**Convention for `sortBy` vs `sort_by`:**
- Frontend sends `sortBy` in query params (GET `/articles?sortBy=newest`)
- Backend reads as Python parameter `sortBy` (camelCase in endpoint signature)
- Model/DB uses snake_case internally

---

## 5. Comments (`/comments`)

| | Detail |
|---|---|
| **Frontend service** | `lib/apiClient.ts` (via `commentApi`) |
| **Backend file** | `api/v1/comments.py` |
| **DB tables** | `comments`, `comment_likes` |
| **Status** | ✅ Backend API |

**Endpoints:**
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/comments` | No | List comments for a post |
| POST | `/comments` | Bearer | Create comment |
| PUT | `/comments/{id}` | Bearer | Update comment (author only) |
| DELETE | `/comments/{id}` | Bearer | Delete comment (author/admin) |
| POST | `/comments/{id}/like` | Bearer | Toggle comment like |

---

## 6. Moments (`/moments`)

| | Detail |
|---|---|
| **Frontend service** | `services/moment.service.ts` |
| **Backend file** | `api/v1/moments.py` |
| **DB tables** | `moments`, `moment_likes`, `moment_comments` |
| **Status** | ✅ Backend API — following_only implemented, atomic counters fixed, visibility rules complete |

**Endpoints:**
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/moments` | Optional | List moments (filter/paginate). Supports `following_only` (requires auth). Visibility: public/followers/private rules enforced. |
| POST | `/moments` | Bearer | Create moment |
| PUT | `/moments/{id}` | Bearer | Update moment (author only) |
| DELETE | `/moments/{id}` | Bearer | Soft-delete moment (author only) |
| POST | `/moments/{id}/like` | Bearer | Toggle moment like (atomic SQL update with race protection) |
| GET | `/moments/{id}/comments` | No | Get moment comments |
| POST | `/moments/{id}/comments` | Bearer | Create comment on moment |
| DELETE | `/moments/{id}/comments/{cid}` | Bearer | Delete comment (author only) |

---

## 7. Notifications (`/notifications`)

| | Detail |
|---|---|
| **Frontend service** | `services/notification.service.ts` (✅ real API) |
| **Backend file** | `api/v1/notifications.py` |
| **DB tables** | `notifications` |
| **Status** | ✅ Backend API — frontend connects to real backend |

**Endpoints:**
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/notifications` | Bearer | List user notifications |
| PUT | `/notifications/{id}/read` | Bearer | Mark notification as read |
| PUT | `/notifications/read-all` | Bearer | Mark all as read |
| DELETE | `/notifications/{id}` | Bearer | Delete notification |
| GET | `/notifications/unread-count` | Bearer | Get unread count |

---

## 8. Favorites (`/favorites`)

| | Detail |
|---|---|
| **Frontend service** | `lib/apiClient.ts` (via `favoritesApi`) |
| **Backend file** | `api/v1/favorites.py` |
| **DB tables** | `favorites` |
| **Status** | ✅ Backend API |

**Endpoints:**
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/favorites` | Bearer | List user favorites |
| POST | `/favorites` | Bearer | Add to favorites |
| DELETE | `/favorites/{id}` | Bearer | Remove favorite by ID |
| DELETE | `/favorites/by-content` | Bearer | Remove by content_type + content_id |
| GET | `/favorites/check` | Bearer | Check if content is favorited |

---

## 9. Follow (`/follow`)

| | Detail |
|---|---|
| **Frontend service** | `services/follow.service.ts` (facade over real API; sync stubs deprecated) |
| **Backend file** | `api/v1/follow.py` |
| **DB tables** | `follows` |
| **Status** | ✅ Backend API + Frontend facade API |

**Endpoints:**
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/follow/{user_id}` | Bearer | Follow a user |
| DELETE | `/follow/{user_id}` | Bearer | Unfollow a user |
| GET | `/follow/{user_id}/status` | Optional | Get follow status |
| GET | `/follow/{user_id}/following` | No | Get following list |
| GET | `/follow/{user_id}/followers` | No | Get followers list |
| GET | `/follow/{user_id}/friends` | No | Get mutual follows |
| GET | `/follow/{user_id}/stats` | No | Get follow stats |

---

## 10. Messages (`/messages`)

| | Detail |
|---|---|
| **Frontend service** | `services/message.service.ts` |
| **Backend file** | `api/v1/messages.py` |
| **DB tables** | `messages` |
| **Status** | ✅ Backend API |

**Endpoints:**
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/messages/conversations` | Bearer | List user's conversations |
| GET | `/messages/conversations/{user_id}` | Bearer | Get messages with user (auto-marks read) |
| POST | `/messages` | Bearer | Send a message |
| PUT | `/messages/{id}/read` | Bearer | Mark single message read |
| PUT | `/messages/conversations/{user_id}/read` | Bearer | Mark all messages from user read |
| GET | `/messages/unread-count` | Bearer | Get total + per-conversation unread count |
| DELETE | `/messages/{id}` | Bearer | Soft-delete own message |

---

## 11. News (`/news`)

| | Detail |
|---|---|
| **Frontend service** | `services/news.service.ts` → `services/news.mock.ts` |
| **Backend file** | None yet |
| **Status** | 📦 **Demo** — hardcoded sample data in `news.mock.ts`. No backend. Explicitly isolated from production services. |

---

## 12. Upload (`/upload`)

| | Detail |
|---|---|
| **Frontend service** | `lib/apiClient.ts` (via `uploadApi`) |
| **Backend file** | `api/v1/upload.py` |
| **DB tables** | None (filesystem) |
| **Status** | ✅ Backend API |

**Endpoints:**
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/upload/image` | Bearer | Upload image (multipart/form-data) |

---

## Common Conventions

### Response Format
All responses use `ServiceResponse<T>`:
```json
{
  "success": true,
  "data": { ... },
  "error": { "code": "ERROR_CODE", "message": "..." },
  "timestamp": 1700000000000
}
```

### Naming Convention
- **Backend**: Python `snake_case` (e.g., `post_count`, `created_at`)
- **Frontend API raw types**: `snake_case` (e.g., `PostRaw`) 
- **Frontend domain types**: `camelCase` (e.g., `Post`, `postCount`)
- **Transform functions**: `transformUserPublic()`, `transformPost()`, etc. in `apiClient.ts`

### Query Parameters
- Frontend sends `camelCase` query params (e.g., `?sortBy=newest`)
- Backend accepts `camelCase` in route signatures (FastAPI parameter names)

### Pagination
All list endpoints use `page` (1-based) and `limit` params, returning `total`, `total_pages`, and a `has_more` or `total_pages` field.

### Auth
- Bearer token in `Authorization` header for authenticated endpoints
- Refresh token via HttpOnly cookie with `credentials: 'include'`
- Access token stored in memory only (never localStorage)

---

*Last updated: 2026-06-24 (v2 — post Phase 1-4 fixes)*
