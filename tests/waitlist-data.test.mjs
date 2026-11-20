import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import ts from 'typescript';
import { hashPin,checkPin } from '../src/lib/waitlist-data/pin.mjs';
import { parseWaitlistEmail } from '../src/lib/waitlist-data/resend.mjs';
import { selectLocation } from '../src/lib/waitlist-data/geocode.mjs';
const url=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
test('Resend parser accepts only artist waitlist notifications with complete fields',()=>{
 const email={subject:'WORLDWIDE WAITLIST — London, United Kingdom — Jane',to:['artist@example.com'],created_at:'2026-11-19T12:00:00Z',text:'WORLDWIDE WAITLIST\n\nname: Jane\nemail: jane@example.com\ncity: London\ncountry: United Kingdom\ninstagram: @jane\n'};
 assert.equal(parseWaitlistEmail(email,'artist@example.com').city,'London');
 assert.equal(parseWaitlistEmail({...email,subject:'your 3ndsofth33arth worldwide waitlist request'},'artist@example.com'),null);
 assert.equal(parseWaitlistEmail(email,'other@example.com'),null);
 assert.throws(()=>parseWaitlistEmail({...email,text:email.text+'city: Paris\n'},'artist@example.com'));
 assert.throws(()=>parseWaitlistEmail({...email,text:undefined},'artist@example.com'));
});
test('PIN hashes are salted and reject incorrect or malformed credentials',async()=>{
 const hash=await hashPin('19384726');assert.notEqual(hash,await hashPin('19384726'));
 assert.equal(await checkPin('19384726',hash),true);assert.equal(await checkPin('19384727',hash),false);assert.equal(await checkPin('123',hash),false);assert.equal(await checkPin('19384726',''),false);
 const shortHash=await hashPin('4826');assert.equal(await checkPin('4826',shortHash),true);assert.equal(await checkPin('4827',shortHash),false);
});
test('geocoding never guesses ambiguous cities',()=>{
 const location={name:'London',country:'United Kingdom',country_code:'GB',longitude:-.12,latitude:51.5};
 assert.equal(selectLocation([location],'london','UK'),location);
 assert.equal(selectLocation([location,{...location,longitude:1}],'London','UK'),null);
 assert.equal(selectLocation([location],'London','Canada'),null);
 assert.equal(selectLocation([{...location,latitude:200}],'London','UK'),null);
});
test('PostgreSQL storage deduplicates form retries, imports, and repeated city signups; PIN sessions expire and revoke',async()=>{
 const pg=new PGlite();await pg.exec(await readFile(new URL('../database/waitlist.sql',import.meta.url),'utf8'));
 await pg.exec(await readFile(new URL('../database/locations.sql',import.meta.url),'utf8'));
 // All calls use a real PostgreSQL engine, without network or production records.
 globalThis.waitlistTestDatabase={query:async(text,params)=>{const result=await pg.query(text,params);return {...result,rowCount:result.rows.length||result.affectedRows||0}},connect:async()=>({...globalThis.waitlistTestDatabase,release(){}})};
 const dbUrl=url('export function database(){return globalThis.waitlistTestDatabase}');
 const recordsSource=(await readFile(new URL('../src/lib/waitlist-data/records.mjs',import.meta.url),'utf8')).replace("'./database.mjs'",JSON.stringify(dbUrl));
 const records=await import(url(recordsSource));
 const fields={name:'Jane',email:'jane@example.com',instagram:'@jane',city:'London',country:'United Kingdom'};
 try{
  const first=await records.saveSignup(fields,{sourceId:'form:one'});
  const retry=await records.saveSignup(fields,{sourceId:'form:one'});assert.equal(first.id,retry.id);assert.equal(retry.duplicate,true);
  const imported=await records.saveSignup(fields,{sourceId:'resend:one',source:'resend',createdAt:'2026-01-01T00:00:00Z',artistEmailSent:true});assert.equal(first.id,imported.id);
  const cities=await records.listCities();assert.equal(cities.length,1);assert.equal(cities[0].count,1);
  const people=await records.listPeople(cities[0].id);assert.equal(people.length,1);assert.equal(people[0].created_at.toISOString(),'2026-01-01T00:00:00.000Z');
  assert.equal(await records.resolvePerson(first.id),true);
  assert.equal(await records.resolvePerson(first.id),true);
  assert.deepEqual(await records.listCities(),[]);
  assert.deepEqual(await records.listPeople(cities[0].id),[]);
  const resolved=await records.listResolvedPeople();assert.equal(resolved.length,1);assert.equal(resolved[0].city,'London');assert.ok(resolved[0].resolved_at);
  assert.equal(await records.restorePerson(first.id),true);
  assert.equal(await records.restorePerson(first.id),true,'restore is idempotent');
  assert.deepEqual(await records.listResolvedPeople(),[]);
  assert.equal((await records.listCities())[0].count,1);
  assert.equal((await records.listPeople(cities[0].id))[0].id,first.id);
  assert.equal(await records.restorePerson('missing'),false);
  await records.resolvePerson(first.id);
  assert.equal((await pg.query('SELECT * FROM waitlist_sources')).rows.length,2);
  await records.saveSignup(fields,{sourceId:'resend:later',source:'resend'});
  assert.deepEqual(await records.listCities(),[],'historical imports must not restore resolved people');
  await records.saveSignup(fields,{sourceId:'form:new'});
  assert.equal((await records.listCities())[0].count,1,'a new signup can rejoin');
  assert.equal(await records.resolvePerson('missing'),false);
  const authSource=(await readFile(new URL('../src/lib/waitlist-data/auth.ts',import.meta.url),'utf8')).replace("import 'server-only';",'').replace("'./database.mjs'",JSON.stringify(dbUrl)).replace("'./pin.mjs'",JSON.stringify(new URL('../src/lib/waitlist-data/pin.mjs',import.meta.url).href)).replace("'next/headers'",JSON.stringify(url('export async function cookies(){return {get:()=>({value:globalThis.waitlistTestToken})}}')));
  const auth=await import(url(ts.transpileModule(authSource,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText));
  const old=process.env.WAITLIST_ADMIN_PIN_HASH;
  try{
   process.env.WAITLIST_ADMIN_PIN_HASH=await hashPin('19384726');
   assert.equal(await auth.currentAdmin(),null);assert.equal(await auth.verifyLogin('00000000'),null);
   globalThis.waitlistTestToken=await auth.verifyLogin('19384726');assert.ok(await auth.currentAdmin());
   await auth.revokeSession(globalThis.waitlistTestToken);assert.equal(await auth.currentAdmin(),null);
   globalThis.waitlistTestToken=await auth.verifyLogin('19384726');await pg.exec("UPDATE waitlist_sessions SET expires_at=now()-interval '1 second'");assert.equal(await auth.currentAdmin(),null);
   globalThis.waitlistTestToken=await auth.verifyLogin('19384726');process.env.WAITLIST_ADMIN_PIN_HASH=await hashPin('29485736');assert.equal(await auth.currentAdmin(),null);
   for(let i=0;i<6;i++)assert.equal(await auth.allowLoginAttempt('test',6),true);assert.equal(await auth.allowLoginAttempt('test',6),false);
  }finally{if(old===undefined)delete process.env.WAITLIST_ADMIN_PIN_HASH;else process.env.WAITLIST_ADMIN_PIN_HASH=old;}
 }finally{await pg.close();delete globalThis.waitlistTestDatabase;delete globalThis.waitlistTestToken;}
});
test('dashboard endpoints reject signed-out reads and cross-origin PIN requests',async()=>{
 const transpile=source=>url(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);
 const auth=url('export async function currentAdmin(){return null};export async function allowLoginAttempt(){throw Error("must not run")};export async function verifyLogin(){throw Error("must not run")};export async function revokeSession(){};export const sessionCookie="session";export const cookieOptions={};');
 const records=url('export async function listCities(){throw Error("private data must not load")};export async function listPeople(){throw Error("private data must not load")}');
 let source=await readFile(new URL('../src/app/api/map/cities/route.ts',import.meta.url),'utf8');source=source.replace("'@/lib/waitlist-data/auth'",JSON.stringify(auth)).replace("'@/lib/waitlist-data/records.mjs'",JSON.stringify(records));
 const {GET}=await import(transpile(source));const response=await GET(new Request('https://example.com/api/map/cities'));assert.equal(response.status,401);assert.match(response.headers.get('cache-control'),/no-store/);
 source=await readFile(new URL('../src/app/api/map/auth/route.ts',import.meta.url),'utf8');source=source.replace("'@/lib/waitlist-data/auth'",JSON.stringify(auth)).replace("'next/headers'",JSON.stringify(url('export async function cookies(){throw Error("must not run")}')));
 const {POST}=await import(transpile(source));assert.equal((await POST(new Request('https://example.com/api/map/auth',{method:'POST',headers:{origin:'https://evil.example'},body:'{}'}))).status,403);
 assert.equal((await POST(new Request('https://example.com/api/map/auth',{method:'POST',headers:{origin:'https://example.com'},body:'x'.repeat(3000)}))).status,400);
});

test('resolve endpoint requires same-origin authenticated requests and handles missing people',async()=>{
 const auth=url('export async function currentAdmin(){return globalThis.resolveTestAdmin}');
 const records=url('export async function resolvePerson(){globalThis.resolveTestCalls++;return globalThis.resolveTestFound};export async function listCities(){return []}');
 let source=await readFile(new URL('../src/app/api/map/resolve/route.ts',import.meta.url),'utf8');
 source=source.replace("'@/lib/waitlist-data/auth'",JSON.stringify(auth)).replace("'@/lib/waitlist-data/records.mjs'",JSON.stringify(records));
 const {POST}=await import(url(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText));
 const request=(id='00000000-0000-0000-0000-000000000001',origin='https://example.com')=>new Request('https://example.com/api/map/resolve?person='+id,{method:'POST',headers:{origin}});
 globalThis.resolveTestCalls=0;
 try{
  assert.equal((await POST(request(undefined,'https://evil.example'))).status,403);
  assert.equal((await POST(request())).status,401);
  globalThis.resolveTestAdmin='admin';
  assert.equal((await POST(request('bad'))).status,400);
  assert.equal(globalThis.resolveTestCalls,0);
  assert.equal((await POST(request())).status,404);
  globalThis.resolveTestFound=true;
  const response=await POST(request());assert.equal(response.status,200);assert.deepEqual(await response.json(),{cities:[]});
 }finally{delete globalThis.resolveTestAdmin;delete globalThis.resolveTestCalls;delete globalThis.resolveTestFound;}
});

test('resolved read and restore endpoints enforce authentication and origin',async()=>{
 const auth=url('export async function currentAdmin(){return globalThis.restoreTestAdmin}');
 const records=url('export async function listResolvedPeople(){return []};export async function restorePerson(){globalThis.restoreTestCalls++;return globalThis.restoreTestFound};export async function listCities(){return []}');
 async function load(name){let source=await readFile(new URL('../src/app/api/map/'+name+'/route.ts',import.meta.url),'utf8');source=source.replace("'@/lib/waitlist-data/auth'",JSON.stringify(auth)).replace("'@/lib/waitlist-data/records.mjs'",JSON.stringify(records));return import(url(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText));}
 const {GET}=await load('resolved'),{POST}=await load('restore');
 const request=(id='00000000-0000-0000-0000-000000000001',origin='https://example.com')=>new Request('https://example.com/api/map/restore?person='+id,{method:'POST',headers:{origin}});
 globalThis.restoreTestCalls=0;
 try{
  assert.equal((await GET()).status,401);assert.equal((await POST(request())).status,401);
  globalThis.restoreTestAdmin='admin';
  assert.equal((await POST(request(undefined,'https://evil.example'))).status,403);
  assert.equal((await POST(request('bad'))).status,400);assert.equal(globalThis.restoreTestCalls,0);
  assert.equal((await POST(request())).status,404);globalThis.restoreTestFound=true;
  const response=await POST(request());assert.equal(response.status,200);assert.deepEqual(await response.json(),{cities:[]});
  const resolved=await GET();assert.equal(resolved.status,200);assert.match(resolved.headers.get('cache-control'),/private, no-store/);
 }finally{delete globalThis.restoreTestAdmin;delete globalThis.restoreTestCalls;delete globalThis.restoreTestFound;}
});
