/**
 * run-schema.mjs
 * ─────────────
 * Runs the DMIS schema against your Supabase project.
 *
 * Usage:
 *   1. Set SUPABASE_DB_URL in your .env  (or pass it as an environment variable)
 *      Format: postgresql://postgres:[DB-PASSWORD]@db.imvhvhsavthipkxkgcsr.supabase.co:5432/postgres
 *
 *   2. Run:  node supabase/run-schema.mjs
 *
 * You can find the DB password from:
 *   Supabase Dashboard → Project Settings → Database → Connection string
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import postgres from 'postgres'
import * as dotenv from 'dotenv'

dotenv.config({ path: new URL('../.env', import.meta.url) })

const dbUrl = process.env.SUPABASE_DB_URL

if (!dbUrl) {
  console.error('\n❌ SUPABASE_DB_URL not set in .env')
  console.error('   Add this to your .env file:')
  console.error('   SUPABASE_DB_URL=postgresql://postgres:[YOUR-DB-PASSWORD]@db.imvhvhsavthipkxkgcsr.supabase.co:5432/postgres\n')
  process.exit(1)
}

const schemaPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'schema.sql')
const sql_text = readFileSync(schemaPath, 'utf-8')

const sql = postgres(dbUrl, { max: 1 })

console.log('🔄 Connecting to Supabase PostgreSQL…')

try {
  await sql.unsafe(sql_text)
  console.log('✅ DMIS schema applied successfully!')
} catch (err) {
  console.error('❌ Error applying schema:', err.message)
  process.exit(1)
} finally {
  await sql.end()
}
