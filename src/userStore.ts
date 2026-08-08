import { pool } from "./db";
import { User, CreateUserInput, UpdateUserInput } from "./types";

// Maps a raw Postgres row (snake_case) to our API-facing User shape (camelCase)
function rowToUser(row: any): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    age: row.age === null ? undefined : row.age,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

class UserStore {
  async getAll(): Promise<User[]> {
    const result = await pool.query(
      "SELECT * FROM users ORDER BY created_at ASC"
    );
    return result.rows.map(rowToUser);
  }

  async getById(id: string): Promise<User | undefined> {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    return result.rows[0] ? rowToUser(result.rows[0]) : undefined;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const result = await pool.query(
      "SELECT * FROM users WHERE LOWER(email) = LOWER($1)",
      [email]
    );
    return result.rows[0] ? rowToUser(result.rows[0]) : undefined;
  }

  async create(input: CreateUserInput): Promise<User> {
    const result = await pool.query(
      `INSERT INTO users (name, email, age)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [input.name, input.email, input.age ?? null]
    );
    return rowToUser(result.rows[0]);
  }

  async update(id: string, input: UpdateUserInput): Promise<User | undefined> {
    // Build the SET clause dynamically so we only touch fields that were
    // actually provided - this preserves existing values for anything
    // omitted from the request (a true partial/PATCH-style update).
    const fields: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    if (input.name !== undefined) {
      fields.push(`name = $${i++}`);
      values.push(input.name);
    }
    if (input.email !== undefined) {
      fields.push(`email = $${i++}`);
      values.push(input.email);
    }
    if (input.age !== undefined) {
      fields.push(`age = $${i++}`);
      values.push(input.age);
    }

    if (fields.length === 0) {
      // Nothing to update - just return the current row, if it exists
      return this.getById(id);
    }

    fields.push(`updated_at = now()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE users SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`,
      values
    );
    return result.rows[0] ? rowToUser(result.rows[0]) : undefined;
  }

  async delete(id: string): Promise<boolean> {
    const result = await pool.query("DELETE FROM users WHERE id = $1", [id]);
    return (result.rowCount ?? 0) > 0;
  }
}

// Single shared instance for the whole app
export const userStore = new UserStore();
