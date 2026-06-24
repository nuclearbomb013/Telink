# TechInk

TechInk is a modern full-stack web application — a community platform with forum, articles, moments (social feed), and user interaction features. Designed with an ink/wash-painting aesthetic.

## Architecture

- **Frontend**: React 19 + TypeScript + Vite 7 (at `app/`)
- **Backend**: FastAPI + SQLAlchemy async + PostgreSQL (at `backend/`)
- **Communication**: REST API at `/api/v1`; Vite dev server proxies API calls to backend
- **Auth**: JWT access tokens (memory only) + HttpOnly refresh cookies

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.12+
- PostgreSQL (backend requires a running instance)

### Setup

```bash
# 1. Install frontend dependencies
cd app
npm install

# 2. Install backend dependencies
cd backend
pip install -r requirements.txt

# 3. Configure backend environment
cp .env.example .env   # edit DB connection string if needed

# 4. Run database migrations
cd backend && alembic upgrade head

# 5. Start backend (port 8000)
cd backend && uvicorn app.main:create_app --factory --reload

# 6. Start frontend (port 5173)
cd app && npm run dev
```

The Vite dev server proxies `/api/v1` to `http://localhost:8000`.

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `/api/v1` (proxied) |
| `DATABASE_URL` | PostgreSQL connection string | (see .env.example) |

## Available Scripts

### Frontend (`app/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest tests |
| `npm run test:coverage` | Run tests with coverage |

### Backend (`backend/`)

| Command | Description |
|---------|-------------|
| `uvicorn app.main:create_app --factory --reload` | Start dev server |
| `pytest -x` | Run test suite |
| `ruff check .` | Lint Python code |
| `mypy app/` | Type-check Python code |
| `alembic upgrade head` | Apply DB migrations |

## Project Structure

```
├── app/                          # React frontend
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   ├── context/              # React context providers (AuthContext)
│   │   ├── hooks/                # Custom hooks (useAuth, useFollow, useMoments, etc.)
│   │   ├── lib/                  # Utilities (apiClient, gsap, search)
│   │   ├── pages/                # Page components
│   │   ├── sections/             # Section components (Navigation, Hero, etc.)
│   │   ├── services/             # API service layer
│   │   └── config/               # Static configuration
│   └── playwright.config.ts      # E2E test config
├── backend/                      # FastAPI backend
│   ├── app/
│   │   ├── api/v1/               # API route handlers
│   │   ├── models/               # SQLAlchemy models
│   │   ├── schemas/              # Pydantic request/response schemas
│   │   ├── core/                 # Security, config
│   │   └── db/                   # Database session, engine
│   ├── migrations/               # Alembic migrations
│   └── tests/                    # Pytest tests
└── docs/                         # Project documentation
    └── API_CONTRACT.md            # API module reference
```

## API Documentation

See [docs/API_CONTRACT.md](../docs/API_CONTRACT.md) for a complete reference of all API endpoints, data formats, and module status.

## Features

- **Forum** — Create, edit, search posts; threaded comments; likes and pins
- **Articles** — User-submitted articles with draft/review/publish workflow
- **Moments** — Social feed with likes, comments, visibility controls
- **Follow System** — Follow/unfollow users, mutual follows, follow stats
- **Auth** — JWT-based login/register with password reset
- **Notifications** — User notifications with read/unread management
- **Favorites** — Bookmark posts, articles, and moments
- **Search** — Full-text search across posts and articles
- **Animations** — GSAP/ScrollTrigger animations with reduced-motion support

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 19, TypeScript |
| Build tool | Vite 7 |
| Styling | Tailwind CSS 3, shadcn/ui |
| Animation | GSAP, ScrollTrigger, Lenis |
| Routing | React Router 7 |
| Forms | React Hook Form, Zod |
| Icons | Lucide React |
| Testing | Vitest, Playwright |
| Backend framework | FastAPI (Python) |
| ORM | SQLAlchemy 2.0 (async) |
| Auth | JWT with HttpOnly cookies |
| Database | PostgreSQL |

## License

MIT
