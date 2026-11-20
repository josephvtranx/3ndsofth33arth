import { database,closeDatabase } from '../src/lib/waitlist-data/database.mjs';
import { mergeCity } from '../src/lib/waitlist-data/cleanup.mjs';
import { normalize } from '../src/lib/waitlist-data/records.mjs';
// Reviewed GeoNames city IDs. Ambiguous states and multi-city entries are deliberately unresolved.
const matches={anchorage:'5879400',atlanta:'4180439',boston:'4930956',charollete:'4460243',chicago:'4887398','los angeles':'5368361',nyc:'5128581',puyallup:'5807575',raliegh:'4487042',renton:'5808189','rogers arkansas':'4128894','san diego':'5391811','san jose':'5392171',seattle:'5809844',vancouver:'6173331',baltimore:'4347778','las vegas':'5506956',sacramento:'5389489','san francisco':'5391959'};
const apply=process.argv.includes('--apply');
const db=await database().connect();
try {
 await db.query('BEGIN');
 await db.query('LOCK TABLE waitlist_cities,waitlist_people,waitlist_sources,waitlist_city_aliases IN SHARE ROW EXCLUSIVE MODE');
 const cities=(await db.query('SELECT * FROM waitlist_cities')).rows;
 if(apply)await db.query(`INSERT INTO waitlist_cleanup_backups(data) SELECT jsonb_build_object('cities',(SELECT jsonb_agg(c) FROM waitlist_cities c),'people',(SELECT jsonb_agg(p) FROM waitlist_people p),'sources',(SELECT jsonb_agg(s) FROM waitlist_sources s),'aliases',(SELECT jsonb_agg(a) FROM waitlist_city_aliases a))`);
 let mapped=0,unresolved=0;
 for(const city of cities){
  if(city.location_id)continue;
  const name=normalize(city.name),country=normalize(city.country);
  const isUS=['us','usa','united states','united s','california'].includes(country);
  const locationId=(isUS||country==='canada')?matches[name]:null;
  let target;
  if(locationId){
   const location=(await db.query('SELECT * FROM waitlist_locations WHERE id=$1',[locationId])).rows[0];
   if(!location || location.country_code!==(country==='canada'?'CA':'US'))throw Error('Catalog match missing or wrong country');
   target={...location,location_id:location.id};mapped++;
  }else{target={name:city.name.trim(),country:isUS?'United States':city.country};unresolved++;}
  console.log(city.name+' / '+city.country+' → '+target.name+', '+(target.region?target.region+', ':'')+target.country+(locationId?'':' (needs review)'));
  if(apply)await mergeCity(db,city,target);
 }
 await db.query(apply?'COMMIT':'ROLLBACK');
 console.log({applied:apply,mappedGroups:mapped,unresolvedGroups:unresolved});
}catch(error){await db.query('ROLLBACK');throw error;}finally{db.release();await closeDatabase();}
