# FossReads

A book database site to demonstrate my skills in TypeScript, React and .NET 

## The Stack
* Frontend: React + TypeScript
* Backend: ASP.NET Core Web API (.NET 9)
* ORM: Entity Framework Core
* Database: PostgreSQL
* Auth: JWT +  BCrypt.Net-Next
* Styling: Tailwind CSS

## Current Features
* Register and Login users
* Create, Edit and Delete books
* User reviews
* Book Status (No Progress,Want to Read,Owned,In Progress,Read,Did Not Finish)
* Book Ownership (Physical, E-book, Lended, Not Owned)
* Pagination
* Upload images for books
* User pages
* Internationalization (i18n)
* Dark/Light Mode toggle
* Unit Tests (xUnit)
* Containerization (Docker)


---

# FossReads Detailed Information and Deployment Guide

## Features

- **Personal library** — add books with title, author, description, published year,
  reading status (want to read, in progress, read, did not finish, …) and
  ownership type (physical, ebook, lent out).
- **Cover images** — upload a JPG/PNG/WebP cover per book (≤ 5 MB).
- **Reviews** — one review per book, with a 1–5 star rating.
- **Reading history** — a dedicated view of everything marked as read, newest first.
- **Accounts** — register / log in; JWT-based auth. Your books and reviews are
  private to your account.
- **Dark mode** and **English / Finnish** UI (i18next).

---

## Tech stack

| Area      | Details                                                                 |
|-----------|------------------------------------------------------------------------- |
| Backend   | ASP.NET Core 9 Web API · Entity Framework Core · PostgreSQL (Npgsql)     |
| Auth      | JWT bearer tokens · BCrypt password hashing                             |
| API docs  | Swagger / OpenAPI                                                       |
| Frontend  | React 19 · TypeScript · Vite · Tailwind CSS · React Router · axios · i18next |
| Infra     | Docker Compose · nginx (static hosting + reverse proxy)                 |
| CI        | GitHub Actions (backend build + tests, frontend build)                 |

---

## Quick start (Docker)

Requires Docker Desktop with Compose v2.

```bash
git clone <this-repo> && cd FossReadsDotNet
cp .env.example .env
```

Edit `.env` and set:

```
POSTGRES_PASSWORD=choose-a-strong-password
JWT_KEY=a-random-string-at-least-32-characters-long
```

Then:

```bash
docker compose up --build
```

| Service    | URL                              |
|------------|----------------------------------|
| Web app    | http://localhost                 |
| API        | http://localhost:8080            |
| Swagger UI | http://localhost:8080/swagger    |

Register an account from the web app and start adding books.

Stop with `docker compose down` (add `-v` to also wipe the database).

---

## Local development

Run Postgres in a container, the API with `dotnet run`, and the frontend with
Vite for hot reload:

```bash
# 1. database
docker run --name fossreads-db -d -p 5432:5432 \
  -e POSTGRES_DB=bookdb -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=admin \
  postgres:16-alpine

# 2. backend  → http://localhost:5128  (Swagger at /swagger)
dotnet run --project FossReadsAPI

# 3. frontend → http://localhost:5173
cd frontend && npm install && npm run dev
```

Database migrations are applied automatically on API startup.

Full details — configuration, migrations, tests, troubleshooting — are in
[DEVELOPMENT.md](DEVELOPMENT.md).

---

## Configuration

| Variable                                | Used by        | Notes                                        |
|-----------------------------------------|----------------|----------------------------------------------|
| `POSTGRES_PASSWORD`                     | Docker         | Postgres + API container (from `.env`)       |
| `JWT_KEY`                               | Docker         | JWT signing key, **32+ characters** (`.env`) |
| `ConnectionStrings__DefaultConnection`  | API            | Overrides the DB connection string           |
| `Jwt__Key`, `Jwt__Issuer`              | API            | Override JWT settings                         |
| `VITE_API_BASE_URL`                     | frontend build | Empty in Docker (relative URLs via nginx); unset in dev (defaults to `http://localhost:5128`) |

Local defaults live in `FossReadsAPI/appsettings.json`. `.env` is gitignored;
`.env.example` is the template.

---

## Running tests

```bash
dotnet test
```

xUnit tests for the API controllers, using EF Core's in-memory provider (no
database needed).

---

## Project structure

```
FossReadsAPI/         ASP.NET Core Web API (controllers, entities, EF migrations)
FossReadsAPI.Tests/   xUnit test project
frontend/             React + Vite single-page app
docker-compose.yml    Postgres + API + frontend
.github/workflows/    CI pipeline
DEVELOPMENT.md        Detailed dev & ops guide
```

---

## API overview

Base path `/api`; all book and review endpoints require a bearer token.

- `POST /api/auth/register`, `POST /api/auth/login`
- `GET|POST /api/books`, `GET /api/books/read`, `GET|PUT|DELETE /api/books/{id}`
- `POST|DELETE /api/books/{id}/image`
- `GET|POST /api/reviews`, `GET|PUT|DELETE /api/reviews/{id}`

See Swagger UI for request/response schemas, or the table in
[DEVELOPMENT.md](DEVELOPMENT.md#10-api-reference-quick).

---

## Status & license

Personal learning project, under active development. No open-source license file
is committed yet — add a `LICENSE` before distributing.
