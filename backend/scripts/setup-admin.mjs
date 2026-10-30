import { existsSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

// Match Wrangler's local configuration precedence without printing credentials.
for (const file of ['.dev.vars', '.env']) {
  if (existsSync(file)) process.loadEnvFile(file);
}
if (!process.env.DATABASE_URL) {
  throw new Error('Set DATABASE_URL in backend/.dev.vars before running db:auth.');
}
const sql = neon(process.env.DATABASE_URL);
await sql`
  CREATE TABLE IF NOT EXISTS admin_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    created_at timestamp DEFAULT now()
  )
`;
console.log('Admin account table is ready. Existing application tables were preserved.');
await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text`;
console.log('User password storage is ready. Existing passwords were preserved.');
