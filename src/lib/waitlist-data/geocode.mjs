import { normalize } from './records.mjs';
import { database } from './database.mjs';
// Provider is explicit: use a licensed endpoint for commercial production usage.
export function selectLocation(results,city,country){
 const display=new Intl.DisplayNames(['en'],{type:'region'});
 const countryNames=new Set([normalize(country)]);
 const aliases={usa:'US',us:'US',uk:'GB','united states':'US','united states of america':'US','united kingdom':'GB'};
 const code=aliases[normalize(country)]||(/^[a-z]{2}$/i.test(country)?country.toUpperCase():null);
 if(code)countryNames.add(normalize(display.of(code)));
 const matches=(results||[]).filter(place=>normalize(place.name||'')===normalize(city)&&
  (countryNames.has(normalize(place.country||''))||(code&&place.country_code===code))&&
  Number.isFinite(place.latitude)&&Math.abs(place.latitude)<=90&&Number.isFinite(place.longitude)&&Math.abs(place.longitude)<=180);
 return matches.length===1?matches[0]:null;
}
export async function resolveCity(city){
 const endpoint=process.env.WAITLIST_GEOCODING_URL;
 if(!endpoint)return false;
 const existing=await database().query('SELECT latitude FROM waitlist_cities WHERE id=$1',[city.id]);
 if(existing.rows[0]?.latitude!==null&&existing.rows[0]?.latitude!==undefined)return true;
 const url=new URL(endpoint);if(url.protocol!=='https:')throw new Error('HTTPS geocoding endpoint required');
 url.searchParams.set('name',city.name+','+city.country);url.searchParams.set('count','100');url.searchParams.set('language','en');url.searchParams.set('format','json');
 if(process.env.WAITLIST_GEOCODING_KEY)url.searchParams.set('apikey',process.env.WAITLIST_GEOCODING_KEY);
 const response=await fetch(url,{signal:AbortSignal.timeout(8000)});if(!response.ok)throw new Error('Location lookup unavailable');
 const place=selectLocation((await response.json()).results,city.name,city.country);
 if(!place)return false;
 await database().query('UPDATE waitlist_cities SET longitude=$2,latitude=$3 WHERE id=$1 AND latitude IS NULL',[city.id,place.longitude,place.latitude]);return true;
}
