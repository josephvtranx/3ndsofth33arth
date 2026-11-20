import { createHash, randomUUID } from 'node:crypto';
import { database } from './database.mjs';
export const normalize = value => value.normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
export function cityId(city,country) { return createHash('sha256').update(JSON.stringify([normalize(city),normalize(country)])).digest('hex').slice(0,32); }
export async function saveSignup(fields, { sourceId='', source='form', createdAt=new Date().toISOString(), artistEmailSent=false } = {}) {
 const db=await database().connect();
 try {
  await db.query('BEGIN');
  if(!sourceId)throw new Error('Source ID required');
  await db.query('SELECT pg_advisory_xact_lock(hashtext($1))',[sourceId]);
  const old=await db.query('SELECT person_id FROM waitlist_sources WHERE id=$1',[sourceId]);
  if(old.rowCount){await db.query('COMMIT');return {id:old.rows[0].person_id,duplicate:true};}
  let city=cityId(fields.city,fields.country);
  if(fields.locationId){
   const location=(await db.query('SELECT * FROM waitlist_locations WHERE id=$1',[fields.locationId])).rows[0];
   if(!location)throw new Error('Invalid location');
   city=cityId('geonames',location.id);
   await db.query(`INSERT INTO waitlist_cities(id,name,country,region,location_id,latitude,longitude) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(id) DO NOTHING`,[city,location.name,location.country,location.region,location.id,location.latitude,location.longitude]);
  }else{
   const alias=(await db.query('SELECT city_id FROM waitlist_city_aliases WHERE id=$1',[city])).rows[0];
   if(alias)city=alias.city_id;
   else await db.query('INSERT INTO waitlist_cities(id,name,country) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[city,fields.city,fields.country]);
  }
  const person=await db.query(`INSERT INTO waitlist_people(id,city_id,name,email,instagram,created_at,source,artist_email_sent)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(email,city_id) DO UPDATE SET
   created_at=LEAST(waitlist_people.created_at,EXCLUDED.created_at),
   artist_email_sent=waitlist_people.artist_email_sent OR EXCLUDED.artist_email_sent,
   resolved_at=CASE WHEN EXCLUDED.source='form' THEN NULL ELSE waitlist_people.resolved_at END RETURNING id`,
   [randomUUID(),city,fields.name,fields.email.toLowerCase(),fields.instagram,createdAt,source,artistEmailSent]);
  await db.query('INSERT INTO waitlist_sources(id,person_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[sourceId,person.rows[0].id]);
  await db.query('COMMIT');return {id:person.rows[0].id,duplicate:false};
 } catch(error){await db.query('ROLLBACK');throw error;} finally{db.release();}
}
export async function markArtistEmailSent(id){await database().query('UPDATE waitlist_people SET artist_email_sent=true WHERE id=$1',[id]);}
export async function listCities(){return (await database().query(`SELECT c.id,c.name,c.country,c.region,c.longitude,c.latitude,count(p.id)::int AS count
 FROM waitlist_cities c JOIN waitlist_people p ON p.city_id=c.id AND p.resolved_at IS NULL GROUP BY c.id ORDER BY count(p.id) DESC,c.name`)).rows;}
export async function listPeople(city){return (await database().query('SELECT id,name,email,instagram,created_at FROM waitlist_people WHERE city_id=$1 AND resolved_at IS NULL ORDER BY created_at DESC,id',[city])).rows;}

export async function resolvePerson(id){
 const result=await database().query('UPDATE waitlist_people SET resolved_at=COALESCE(resolved_at,now()) WHERE id=$1 RETURNING id',[id]);
 return result.rowCount>0;
}

export async function listResolvedPeople(){return (await database().query(`SELECT p.id,p.name,p.email,p.instagram,p.created_at,p.resolved_at,c.name AS city,c.country,c.region
 FROM waitlist_people p JOIN waitlist_cities c ON c.id=p.city_id WHERE p.resolved_at IS NOT NULL ORDER BY p.resolved_at DESC,p.id`)).rows;}
export async function restorePerson(id){
 const result=await database().query('UPDATE waitlist_people SET resolved_at=NULL WHERE id=$1 RETURNING id',[id]);
 return result.rowCount>0;
}
