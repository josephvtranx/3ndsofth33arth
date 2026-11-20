import { database } from './database.mjs';
export const searchText = value => value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export async function findLocation(id) {
 if (!/^\d{1,12}$/.test(id)) return null;
 return (await database().query('SELECT id,name,country,region,latitude,longitude FROM waitlist_locations WHERE id=$1',[id])).rows[0] || null;
}
export async function searchLocations(query) {
 const text=searchText(query).slice(0,120);
 if(text.length<2)return [];
 const expression=text.split(/\s+/).map(word=>word+':*').join(' & ');
 return (await database().query(`SELECT id,name,country,region,latitude,longitude FROM waitlist_locations
 WHERE search_vector @@ to_tsquery('simple',$1)
 ORDER BY lower(name)=$2 DESC, lower(name) LIKE $3 DESC,population DESC,id LIMIT 10`,[expression,text,text+'%'])).rows;
}
