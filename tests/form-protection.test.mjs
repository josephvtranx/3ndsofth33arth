import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source = await readFile(new URL('../src/lib/form-protection.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { protectForm } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const req = () => new Request('https://example.com/api/booking', {headers:{'x-forwarded-for':'192.0.2.1'}});
function form() { const f=new FormData();f.set('cf-turnstile-response','token');return f; }
function setup(t) {
 const values={VERCEL:'1',VERCEL_ENV:'production',TURNSTILE_SECRET_KEY:'test-secret',UPSTASH_REDIS_REST_URL:'https://redis.example',UPSTASH_REDIS_REST_TOKEN:'redis-token',FORM_RATE_LIMIT_SECRET:'salt',TURNSTILE_ALLOWED_HOSTNAMES:'example.com'};
 for(const [k,v] of Object.entries(values)){const old=process.env[k];process.env[k]=v;t.after(()=>{if(old===undefined)delete process.env[k];else process.env[k]=old;});}
}
test('production fails closed with missing configuration or token',async t=>{
 setup(t);t.mock.method(globalThis,'fetch',async()=>assert.fail('no external calls'));
 assert.equal((await protectForm(req(),new FormData(),'booking')).status,400);
 delete process.env.TURNSTILE_SECRET_KEY;
 assert.equal((await protectForm(req(),form(),'booking')).status,503);
});
test('both forms share an atomic counter without storing raw IP addresses',async t=>{
 setup(t);const commands=[];let count=0;
 t.mock.method(globalThis,'fetch',async(url,options)=>{
 if(url==='https://redis.example'){commands.push(JSON.parse(options.body));return Response.json({result:[++count,3500]});}
 return Response.json({success:true,hostname:'example.com',action:count%2?'booking':'waitlist'});
 });
 for(let i=0;i<5;i++)assert.equal(await protectForm(req(),form(),i%2?'waitlist':'booking'),null);
 const blocked=await protectForm(req(),form(),'waitlist');assert.equal(blocked.status,429);assert.equal(blocked.headers.get('retry-after'),'3500');
 assert.equal(new Set(commands.map(c=>c[3])).size,1);assert.ok(commands.every(c=>c[0]==='EVAL'&&c[1].includes('EXPIRE')));assert.ok(!JSON.stringify(commands).includes('192.0.2.1'));
});
test('invalid, expired, replayed, wrong-host and wrong-action tokens are rejected',async t=>{
 setup(t);let result;
 t.mock.method(globalThis,'fetch',async url=>Response.json(url==='https://redis.example'?{result:[1,3600]}:result));
 for(result of [{success:false,'error-codes':['timeout-or-duplicate']},{success:true,hostname:'attacker.example',action:'booking'},{success:true,hostname:'example.com',action:'waitlist'},{success:'true',hostname:'example.com',action:'booking'}])assert.equal((await protectForm(req(),form(),'booking')).status,400);
});
test('provider failures and malformed counters fail closed',async t=>{
 setup(t);
 for(const value of [{error:'private provider detail'},{result:[1,-1]},{result:['1',100]}]){
 t.mock.method(globalThis,'fetch',async()=>Response.json(value));const r=await protectForm(req(),form(),'booking');assert.equal(r.status,503);assert.ok(!(await r.text()).includes('private provider'));
 }
 t.mock.method(globalThis,'fetch',async()=>{throw Error('secret network detail');});assert.equal((await protectForm(req(),form(),'booking')).status,503);
 t.mock.method(globalThis,'fetch',async url=>url==='https://redis.example'?Response.json({result:[1,3600]}):new Response('',{status:500}));assert.equal((await protectForm(req(),form(),'booking')).status,503);
});
