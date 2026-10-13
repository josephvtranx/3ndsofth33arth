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
  '@/lib/email-template': await moduleUrl('../src/lib/email-template.ts'),
  '@/lib/waitlist': validator,
  '@/lib/site': await moduleUrl('../src/lib/site.ts'),
  '../booking/request': await moduleUrl('../src/app/api/booking/request.ts'),
}));
function form() {
  const data = new FormData();
  for (const [k,v] of Object.entries({ name:'Jane Smith', email:'jane@example.com', city:'London', country:'United Kingdom', instagram:'@jane', submissionId:'test-waitlist-12345678', is18:'true', consent:'true' })) data.set(k,v);
  return data;
}
const request = (data, origin = 'https://example.com') => new Request('https://example.com/api/waitlist', { method:'POST', headers:{origin}, body:data });
test('waitlist requires location, contact details, adult confirmation and contact consent',()=>{
  assert.equal(validateWaitlist(form()).ok,true);
  for (const key of ['name','email','city','country','instagram','submissionId','is18','consent']) {
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
