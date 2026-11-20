import { cityId } from './records.mjs';
// Caller owns the transaction. Preserve source links when two entries become one.
export async function mergeCity(db, old, target) {
 const id=target.location_id?cityId('geonames',target.location_id):cityId(target.name,target.country);
 await db.query(`INSERT INTO waitlist_cities(id,name,country,region,location_id,latitude,longitude) VALUES($1,$2,$3,$4,$5,$6,$7)
 ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,country=EXCLUDED.country,region=EXCLUDED.region,location_id=EXCLUDED.location_id,latitude=EXCLUDED.latitude,longitude=EXCLUDED.longitude`,[id,target.name,target.country,target.region||null,target.location_id||null,target.latitude??null,target.longitude??null]);
 if(old.id===id)return;
 const people=(await db.query('SELECT id,email,created_at,artist_email_sent FROM waitlist_people WHERE city_id=$1',[old.id])).rows;
 for(const person of people){
  const duplicate=(await db.query('SELECT id FROM waitlist_people WHERE city_id=$1 AND email=$2',[id,person.email])).rows[0];
  if(duplicate){
   await db.query('UPDATE waitlist_sources SET person_id=$1 WHERE person_id=$2',[duplicate.id,person.id]);
   await db.query('UPDATE waitlist_people SET created_at=LEAST(created_at,$2),artist_email_sent=artist_email_sent OR $3 WHERE id=$1',[duplicate.id,person.created_at,person.artist_email_sent]);
   await db.query('DELETE FROM waitlist_people WHERE id=$1',[person.id]);
  }else await db.query('UPDATE waitlist_people SET city_id=$1 WHERE id=$2',[id,person.id]);
 }
 await db.query('UPDATE waitlist_city_aliases SET city_id=$1 WHERE city_id=$2',[id,old.id]);
 await db.query('INSERT INTO waitlist_city_aliases(id,city_id) VALUES($1,$2) ON CONFLICT(id) DO UPDATE SET city_id=EXCLUDED.city_id',[old.id,id]);
 await db.query('DELETE FROM waitlist_cities WHERE id=$1',[old.id]);
}
