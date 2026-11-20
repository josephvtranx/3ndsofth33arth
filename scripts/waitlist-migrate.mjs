import { readFile } from 'node:fs/promises';
import { database,closeDatabase } from '../src/lib/waitlist-data/database.mjs';
try { await database().query(await readFile(new URL('../database/waitlist.sql',import.meta.url),'utf8'));await database().query(await readFile(new URL('../database/locations.sql',import.meta.url),'utf8'));console.log('Waitlist schema ready.'); }
catch { console.error('Migration failed. Check WAITLIST_DATABASE_URL and database access.');process.exitCode=1; }
finally { await closeDatabase(); }
