// Download cities500.zip, admin1CodesASCII.txt and countryInfo.txt from
// https://download.geonames.org/export/dump/ and unzip cities500.zip first.
// GeoNames data: CC BY 4.0, https://www.geonames.org/.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { database,closeDatabase } from '../src/lib/waitlist-data/database.mjs';
import { searchText } from '../src/lib/waitlist-data/locations.mjs';
const directory=process.argv[2];
if(!directory)throw new Error('Pass the directory containing the three GeoNames text files.');
try {
 await database().query(await readFile(new URL('../database/locations.sql',import.meta.url),'utf8'));
 const read=async name=>(await readFile(resolve(directory,name),'utf8')).split('\n').filter(x=>x&&!x.startsWith('#')).map(x=>x.split('\t'));
 const countries=new Map((await read('countryInfo.txt')).map(x=>[x[0],x[4]]));
 const regions=new Map((await read('admin1CodesASCII.txt')).map(x=>[x[0],x[1]]));
 const rows=(await read('cities500.txt')).map(x=>({id:x[0],name:x[1],country:countries.get(x[8])||x[8],country_code:x[8],region:regions.get(x[8]+'.'+x[10])||'',latitude:Number(x[4]),longitude:Number(x[5]),population:Number(x[14])||0,search_text:searchText([x[1],x[2],x[3],countries.get(x[8]),x[8],x[10],regions.get(x[8]+'.'+x[10])].join(' '))}));
 const db=await database().connect();
 try {
 await db.query('BEGIN');
 for(let i=0;i<rows.length;i+=1000)await db.query(`INSERT INTO waitlist_locations(id,name,country,country_code,region,latitude,longitude,population,search_text)
 SELECT id,name,country,country_code,region,latitude,longitude,population,search_text FROM jsonb_to_recordset($1::jsonb)
 AS x(id text,name text,country text,country_code text,region text,latitude double precision,longitude double precision,population bigint,search_text text)
 ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,country=EXCLUDED.country,region=EXCLUDED.region,latitude=EXCLUDED.latitude,longitude=EXCLUDED.longitude,population=EXCLUDED.population,search_text=EXCLUDED.search_text`,[JSON.stringify(rows.slice(i,i+1000))]);
 await db.query('COMMIT');
 console.log('Imported public city catalog:',rows.length);
 }catch(error){await db.query('ROLLBACK');throw error;}finally{db.release();}
}finally{await closeDatabase();}
