import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Share the Neon HTTP client and Drizzle instance across data-access services.
const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

export { db, sql };
