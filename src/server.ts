import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import { userStore } from "./userStore";
import { checkDatabaseConnection } from "./db";
import { CreateUserInput, UpdateUserInput } from "./types";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(cors());
app.use(express.json());

// Serve the simple test frontend from /public
app.use(express.static(path.join(__dirname, "..", "public")));

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Small helper so we don't repeat try/catch in every async route handler
const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };

// --- Routes ---

// Health check (also confirms DB connectivity)
app.get(
  "/api/health",
  asyncHandler(async (_req, res) => {
    await checkDatabaseConnection();
    res.json({ status: "ok", db: "connected" });
  })
);

// GET /api/users - list all users
app.get(
  "/api/users",
  asyncHandler(async (_req, res) => {
    const users = await userStore.getAll();
    res.json(users);
  })
);

// GET /api/users/:id - get a single user
app.get(
  "/api/users/:id",
  asyncHandler(async (req, res) => {
    const user = await userStore.getById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  })
);

// POST /api/users - add a new user
app.post(
  "/api/users",
  asyncHandler(async (req, res) => {
    const { name, email, age } = req.body as CreateUserInput;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "'name' is required" });
    }
    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: "A valid 'email' is required" });
    }
    if (age !== undefined && (typeof age !== "number" || age < 0)) {
      return res.status(400).json({ error: "'age' must be a positive number" });
    }

    const existing = await userStore.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "A user with this email already exists" });
    }

    const user = await userStore.create({
      name: name.trim(),
      email: email.trim(),
      age,
    });
    res.status(201).json(user);
  })
);

// PUT /api/users/:id - update user details (partial update supported)
app.put(
  "/api/users/:id",
  asyncHandler(async (req, res) => {
    const { name, email, age } = req.body as UpdateUserInput;

    if (name !== undefined && (typeof name !== "string" || !name.trim())) {
      return res.status(400).json({ error: "'name' must be a non-empty string" });
    }
    if (email !== undefined && (typeof email !== "string" || !EMAIL_REGEX.test(email))) {
      return res.status(400).json({ error: "'email' must be a valid email address" });
    }
    if (age !== undefined && (typeof age !== "number" || age < 0)) {
      return res.status(400).json({ error: "'age' must be a positive number" });
    }

    const existing = await userStore.getById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: "User not found" });
    }

    if (email) {
      const conflict = await userStore.findByEmail(email);
      if (conflict && conflict.id !== existing.id) {
        return res.status(409).json({ error: "Another user already uses this email" });
      }
    }

    const updated = await userStore.update(req.params.id, { name, email, age });
    res.json(updated);
  })
);

// DELETE /api/users/:id - bonus: remove a user
app.delete(
  "/api/users/:id",
  asyncHandler(async (req, res) => {
    const deleted = await userStore.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(204).send();
  })
);

// Central error handler - catches anything passed to next(err),
// including DB connection failures and unexpected query errors.
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

async function start() {
  try {
    await checkDatabaseConnection();
    console.log("Connected to PostgreSQL");
  } catch (err) {
    console.error("Failed to connect to PostgreSQL. Check your DB config (.env) and that Postgres is running.");
    console.error(err);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`User API listening on http://localhost:${PORT}`);
    console.log(`Test frontend available at http://localhost:${PORT}/`);
  });
}

start();
