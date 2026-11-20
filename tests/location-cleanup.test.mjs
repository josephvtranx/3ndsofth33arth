import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { mergeCity } from '../src/lib/waitlist-data/cleanup.mjs';
import { cityId } from '../src/lib/waitlist-data/records.mjs';
import { searchText } from '../src/lib/waitlist-data/locations.mjs';
test('location cleanup preserves source links, merges repeated emails and supplies coordinates',async()=>{
 const db=new PGlite();
 try{
  for(const file of ['waitlist.sql','locations.sql'])await db.exec(await readFile(new URL('../database/'+file,import.meta.url),'utf8'));
  await db.exec(`INSERT INTO waitlist_locations(id,name,country,country_code,region,latitude,longitude,population,search_text) VALUES('5809844','Seattle','United States','US','Washington',47.6,-122.3,780000,'seattle washington us');
  INSERT INTO waitlist_cities(id,name,country) VALUES('a','seattle','usa'),('b','Seattle','Us');
  INSERT INTO waitlist_people(id,city_id,name,email,instagram,created_at,source,artist_email_sent) VALUES('p1','a','Test','test@example.com','@test','2026-01-01','test',true),('p2','b','Test','test@example.com','@test','2026-02-01','test',false),('p3','b','Other','other@example.com','@other','2026-03-01','test',false);
  INSERT INTO waitlist_sources(id,person_id) VALUES('s1','p1'),('s2','p2'),('s3','p3');`);
  const target={name:'Seattle',country:'United States',region:'Washington',location_id:'5809844',latitude:47.6,longitude:-122.3};
  await db.exec('BEGIN');for(const id of ['a','b'])await mergeCity(db,{id},target);await db.exec('COMMIT');
  const cities=(await db.query('SELECT * FROM waitlist_cities')).rows;assert.equal(cities.length,1);assert.equal(cities[0].latitude,47.6);assert.equal(cities[0].id,cityId('geonames','5809844'));
  assert.equal((await db.query('SELECT * FROM waitlist_people')).rows.length,2);
  const sources=(await db.query('SELECT * FROM waitlist_sources ORDER BY id')).rows;assert.equal(sources.length,3);assert.equal(sources[0].person_id,sources[1].person_id);
  assert.equal((await db.query('SELECT * FROM waitlist_city_aliases')).rows.length,2);
  await mergeCity(db,{id:cities[0].id},target);assert.equal((await db.query('SELECT * FROM waitlist_people')).rows.length,2);
 }finally{await db.close();}
});
test('catalog search normalization handles accents and strips query operators',()=>{assert.equal(searchText('São Paulo, BR'),'sao paulo br');assert.equal(searchText("London' | ! :*"),'london');});
