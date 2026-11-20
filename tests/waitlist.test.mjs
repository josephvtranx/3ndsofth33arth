import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';
async function moduleUrl(path, replacements = {}) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  let { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
  for (const [key, value] of Object.entries(replacements)) outputText = outputText.replaceAll(JSON.stringify(key), JSON.stringify(value));
  return `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`;
}
const validator = await moduleUrl('../src/lib/waitlist.ts');
const { validateWaitlist } = await import(validator);
const { POST } = await import(await moduleUrl('../src/app/api/waitlist/route.ts', {
  "@/lib/waitlist-data/locations.mjs": `data:text/javascript,${encodeURIComponent('export async function findLocation(id){return id==="2643743"?{id,name:"London",country:"United Kingdom"}:null}')}`,
  "next/server": `data:text/javascript,${encodeURIComponent('export function after(callback){return callback()}')}`,
  "@/lib/waitlist-data/geocode.mjs": `data:text/javascript,${encodeURIComponent('export async function resolveCity(){}')}`,
  "@/lib/waitlist-data/records.mjs": `data:text/javascript,${encodeURIComponent('export async function saveSignup(){ if(globalThis.waitlistStoreFailure)throw Error();globalThis.waitlistSaved=true;return {id:"saved-id"}};export async function markArtistEmailSent(){};export function cityId(){return "city"}')}`,
  "@/lib/form-protection": await moduleUrl("../src/lib/form-protection.ts"),
  '@/lib/email-template': await moduleUrl('../src/lib/email-template.ts'),
  '@/lib/waitlist': validator,
  '@/lib/site': await moduleUrl('../src/lib/site.ts'),
  '../booking/request': await moduleUrl('../src/app/api/booking/request.ts'),
}));
function form() {
  const data = new FormData();
  for (const [k,v] of Object.entries({ name:'Jane Smith', email:'jane@example.com', locationId:'2643743', city:'London', country:'United Kingdom', instagram:'@jane', submissionId:'test-waitlist-12345678', is18:'true', consent:'true' })) data.set(k,v);
  return data;
}
const request = (data, origin = 'https://example.com') => new Request('https://example.com/api/waitlist', { method:'POST', headers:{origin}, body:data });
test('waitlist requires location, contact details, adult confirmation and contact consent',()=>{
  assert.equal(validateWaitlist(form()).ok,true);
  for (const key of ['locationId','name','email','city','country','instagram','submissionId','is18','consent']) {
    const data=form();data.delete(key);assert.equal(validateWaitlist(data).ok,false,key);
  }
  const data=form();data.set('city','London\r\nBcc: someone@example.com');assert.equal(validateWaitlist(data).ok,false);
  data.set('city','x'.repeat(121));assert.equal(validateWaitlist(data).ok,false);
});
test('waitlist email routing, subject, retry identity and confirmation failure',async()=>{
  const originalFetch=globalThis.fetch;
  const originalEnv={...process.env};
  process.env.RESEND_API_KEY='test-key';process.env.BOOKING_FROM_EMAIL='sender@example.com';process.env.BOOKING_TO_EMAIL='artist@example.com';
  try {
    const calls=[];
    globalThis.fetch=async(url, options)=>{calls.push({body:JSON.parse(options.body),headers:options.headers});return new Response('{}',{status:calls.length===1?200:500});};
    const response=await POST(request(form()));
    assert.equal(response.status,200);
    assert.deepEqual(await response.json(),{success:true,confirmationSent:false});
    assert.deepEqual(calls[0].body.to,['artist@example.com']);
    assert.equal(calls[0].body.subject,'WORLDWIDE WAITLIST — London, United Kingdom — Jane Smith');
    assert.equal(calls[0].body.reply_to,'jane@example.com');
    assert.match(calls[0].body.text,/not a confirmed appointment/);
    assert.deepEqual(calls[1].body.to,['jane@example.com']);
    assert.notEqual(calls[0].headers['Idempotency-Key'],calls[1].headers['Idempotency-Key']);
    globalThis.fetch=async()=>new Response('{}',{status:500});
    assert.equal((await POST(request(form()))).status,502);
    globalThis.fetch=async()=>{throw new Error('network');};
    assert.equal((await POST(request(form()))).status,502);
  } finally {globalThis.fetch=originalFetch; for(const key of ['RESEND_API_KEY','BOOKING_FROM_EMAIL','BOOKING_TO_EMAIL']) {if(originalEnv[key]===undefined)delete process.env[key];else process.env[key]=originalEnv[key];}}
});
test('waitlist rejects invalid requests and quietly accepts honeypot without email',async()=>{
  const original=globalThis.fetch;globalThis.fetch=async()=>{assert.fail('must not send');};
  try {
    assert.equal((await POST(request(form(),'https://other.example'))).status,403);
    const invalid=form();invalid.delete('city');assert.equal((await POST(request(invalid))).status,400);
    const bot=form();bot.set('website','spam');assert.equal((await POST(request(bot))).status,200);
    const file=form();file.set('photo',new Blob(['fake']),'photo.png');assert.equal((await POST(request(file))).status,400);
  } finally {globalThis.fetch=original;}
});

 test("spam protection blocks valid submissions before any email is sent", async (t) => {
  const keys = ["VERCEL_ENV", "TURNSTILE_SECRET_KEY", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "FORM_RATE_LIMIT_SECRET", "TURNSTILE_ALLOWED_HOSTNAMES"];
  const old = Object.fromEntries(keys.map(k => [k, process.env[k]]));
  Object.assign(process.env, { VERCEL_ENV: "production", TURNSTILE_SECRET_KEY: "test", UPSTASH_REDIS_REST_URL: "https://redis.example", UPSTASH_REDIS_REST_TOKEN: "test", FORM_RATE_LIMIT_SECRET: "salt", TURNSTILE_ALLOWED_HOSTNAMES: "example.com" });
  t.after(() => { for (const k of keys) { if (old[k] === undefined) delete process.env[k]; else process.env[k] = old[k]; } });
  t.mock.method(globalThis, "fetch", async (url) => { assert.equal(url, "https://redis.example"); return Response.json({ result: [6, 3600] }); });
  const data = form(); data.set("cf-turnstile-response", "test-token");
  assert.equal((await POST(request(data))).status, 429);
 });

test('durable capture precedes email and survives provider failure',async()=>{
 const originalFetch=globalThis.fetch;const env={...process.env};
 process.env.WAITLIST_STORAGE_ENABLED='true';process.env.RESEND_API_KEY='test';process.env.BOOKING_FROM_EMAIL='sender@example.com';
 try{
  globalThis.waitlistSaved=false;
  globalThis.fetch=async()=>{assert.equal(globalThis.waitlistSaved,true);return new Response('{}',{status:500})};
  const result=await POST(request(form()));assert.equal(result.status,200);assert.equal((await result.json()).success,true);
  globalThis.waitlistStoreFailure=true;
  globalThis.fetch=async()=>assert.fail('Must not email before durable save');
  assert.equal((await POST(request(form()))).status,503);
 }finally{globalThis.fetch=originalFetch;delete globalThis.waitlistStoreFailure;delete globalThis.waitlistSaved;for(const key of ['WAITLIST_STORAGE_ENABLED','RESEND_API_KEY','BOOKING_FROM_EMAIL']){if(env[key]===undefined)delete process.env[key];else process.env[key]=env[key]}}
});

test('waitlist rejects nonexistent city IDs and overrides submitted location labels', async()=>{
 const original=globalThis.fetch,env={...process.env};
 process.env.RESEND_API_KEY='test';process.env.BOOKING_FROM_EMAIL='test@example.com';
 try{
  globalThis.fetch=async(_url,options)=>{assert.match(JSON.parse(options.body).text,/London/);assert.doesNotMatch(JSON.parse(options.body).text,/Fake City/);return Response.json({});};
  const invalid=form();invalid.set('locationId','999999999999');assert.equal((await POST(request(invalid))).status,400);
  const valid=form();valid.set('city','Fake City');assert.equal((await POST(request(valid))).status,200);
 }finally{globalThis.fetch=original;for(const key of ['RESEND_API_KEY','BOOKING_FROM_EMAIL']){if(env[key]===undefined)delete process.env[key];else process.env[key]=env[key];}}
});
