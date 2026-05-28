/**
 * Migration Runner — Swarm Orchestrator
 *
 * Runs SQL migrations in order. Creates tables for swarm invocations,
 * signals, and synthesis. Idempotent — safe to run on every deploy.
 */

import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('[Swarm Migration] DATABASE_URL not set — cannot run migrations');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const migrationsDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.error(`[Swarm Migration] Migrations directory not found: ${migrationsDir}`);
      process.exit(1);
    }

    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    const applied = await pool.query('SELECT name FROM _migrations');
    const appliedNames = new Set(applied.rows.map(r => r.name));

    for (const file of files) {
      if (appliedNames.has(file)) {
        console.log(`[Swarm Migration] Already applied: ${file}`);
        continue;
      }

      console.log(`[Swarm Migration] Applying: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      await pool.query('BEGIN');
      try {
        await pool.query(sql);
        await pool.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
        await pool.query('COMMIT');
        console.log(`[Swarm Migration] Applied: ${file}`);
      } catch (err) {
        await pool.query('ROLLBACK');
        console.error(`[Swarm Migration] Failed: ${file}`, err);
        throw err;
      }
    }

    console.log('[Swarm Migration] All migrations complete');
  } finally {
    await pool.end();
  }
}

runMigrations().catch(err => {
  console.error('[Swarm Migration] Fatal error:', err);
  process.exit(1);
});
