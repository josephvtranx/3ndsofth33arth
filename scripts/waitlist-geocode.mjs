import { database,closeDatabase } from '../src/lib/waitlist-data/database.mjs';
import { resolveCity } from '../src/lib/waitlist-data/geocode.mjs';
try{
 if(!process.env.WAITLIST_GEOCODING_URL)throw new Error('Configure a licensed Open-Meteo-compatible WAITLIST_GEOCODING_URL first.');
 const cities=(await database().query('SELECT id,name,country FROM waitlist_cities WHERE latitude IS NULL')).rows;
 let resolved=0,pending=0;
 for(const city of cities){if(await resolveCity(city))resolved++;else pending++;await new Promise(r=>setTimeout(r,1000));}
 console.log({resolved,pending});
}catch{console.error('Location lookup incomplete. Check database and geocoding configuration; unresolved cities remain in the sidebar.');process.exitCode=1;}finally{await closeDatabase();}
