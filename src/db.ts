import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// Either set DATABASE_URL (e.g. postgres://user:pass@localhost:5432/dbname)
// or the individual PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE vars, which
// `pg` picks up automatically. DATABASE_URL takes precedence if set.
export const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.PGHOST || "localhost",
        port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
        user: process.env.PGUSER || "postgres",
        password: process.env.PGPASSWORD || "postgres",
        database: process.env.PGDATABASE || "user_api",
      }
);

pool.on("error", (err) => {
  // Errors on idle clients (e.g. connection dropped) shouldn't crash the app
  console.error("Unexpected PostgreSQL pool error", err);
});

// Quick connectivity check used at startup so failures are obvious
// immediately instead of surfacing on the first request.
export async function checkDatabaseConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
}
