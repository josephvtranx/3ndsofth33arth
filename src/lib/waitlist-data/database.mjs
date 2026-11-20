import pg from 'pg';
let pool;
export function database() {
 const connectionString=process.env.WAITLIST_DATABASE_URL || process.env.WAITLIST_DATABASE_DATABASE_URL;
 if (!connectionString) throw new Error('WAITLIST_DATABASE_URL is required');
 pool ||= new pg.Pool({ connectionString, max: 3, connectionTimeoutMillis: 8000, idleTimeoutMillis: 10000 });
 return pool;
}
export async function closeDatabase() { if(pool) await pool.end(); pool=undefined; }
