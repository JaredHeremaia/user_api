# User API

A simple REST API for managing users (add, get, update, delete), built with
TypeScript + Express and backed by **PostgreSQL**, plus a small HTML/JS
frontend for testing it in the browser.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Get a Postgres database running

**Option A — use Docker** (easiest, no local install):
```bash
docker compose up -d
```
This starts Postgres on `localhost:5432` with user `postgres` / password
`postgres` / database `user_api`, and automatically creates the `users`
table on first startup.

**Option B — use a local Postgres install:**
```bash
createdb user_api
psql -d user_api -f schema.sql
```

### 3. Configure the connection
```bash
cp .env.example .env
```
Edit `.env` if your database isn't on the default `localhost:5432` with
user/password `postgres`/`postgres`. You can also set a single
`DATABASE_URL` instead — see the comments in `.env.example`.

## Run

**Development** (auto-restarts on changes):
```bash
npm run dev
```

**Production build**:
```bash
npm run build
npm start
```

The server checks the database connection on startup and will exit with an
error if it can't connect — check your `.env` and make sure Postgres is
running if that happens.

Then open **http://localhost:3000** in your browser to use the test frontend,
or hit the API directly at `http://localhost:3000/api/users`.

The port can be changed with the `PORT` environment variable (in `.env` or
your shell).

## API Reference

| Method | Endpoint          | Description                          |
|--------|-------------------|---------------------------------------|
| GET    | `/api/health`     | Health check                          |
| GET    | `/api/users`      | List all users                        |
| GET    | `/api/users/:id`  | Get a single user by id               |
| POST   | `/api/users`      | Create a new user                     |
| PUT    | `/api/users/:id`  | Update a user (partial update OK)     |
| DELETE | `/api/users/:id`  | Delete a user                         |

### Create a user
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","age":29}'
```

### Get all users
```bash
curl http://localhost:3000/api/users
```

### Get one user
```bash
curl http://localhost:3000/api/users/<id>
```

### Update a user
Only include the fields you want to change:
```bash
curl -X PUT http://localhost:3000/api/users/<id> \
  -H "Content-Type: application/json" \
  -d '{"age":30}'
```

### Delete a user
```bash
curl -X DELETE http://localhost:3000/api/users/<id>
```

## Validation rules

- `name`: required (create), non-empty string
- `email`: required (create), must look like a valid email, must be unique
- `age`: optional, must be a non-negative number if provided

## Project structure

```
user-api/
├── src/
│   ├── server.ts      # Express app & routes
│   ├── db.ts          # PostgreSQL connection pool
│   ├── userStore.ts   # Data access layer (SQL queries)
│   └── types.ts       # Shared TypeScript types
├── public/
│   └── index.html      # Test frontend (add/edit/delete users)
├── schema.sql          # Users table definition
├── docker-compose.yml  # Optional local Postgres for development
├── .env.example         # Copy to .env and configure your DB connection
├── package.json
└── tsconfig.json
```

## Troubleshooting

- **"Failed to connect to PostgreSQL" on startup** — check that Postgres is
  running (`docker compose up -d` or your local service) and that `.env`
  matches your actual host/port/user/password/database.
- **`relation "users" does not exist`** — run the schema:
  `psql -d user_api -f schema.sql` (Docker Compose does this automatically
  on first startup, but not on later ones).
- **`password authentication failed`** — double check `PGUSER`/`PGPASSWORD`
  in `.env` match what your Postgres instance expects.
