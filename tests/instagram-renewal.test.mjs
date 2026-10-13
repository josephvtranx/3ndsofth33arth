import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';
async function moduleUrl(path, replacements = {}) {
  let { outputText } = ts.transpileModule(await readFile(new URL(path, import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
  for (const [key, value] of Object.entries(replacements)) outputText = outputText.replaceAll(JSON.stringify(key), JSON.stringify(value));
  return `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`;
}
const renewalUrl = await moduleUrl('../src/lib/instagram/renewal.ts');
const { renewToken, parseTokenRecord } = await import(renewalUrl);
const now = 1800000000000, day = 86400000;
const record = { token: 'old-secret', refreshedAt: now - 31 * day, expiresAt: now + 29 * day };
test('refresh persists new token and expiry but returns no secret', async () => {
  let saved;
  const result = await renewToken(record, 'seed', async value => { saved = value; }, async (url, options) => {
    assert.equal(url.origin, 'https://graph.instagram.com');
    assert.equal(url.searchParams.get('access_token'), 'old-secret');
    assert.equal(options.cache, 'no-store');
    return Response.json({ access_token: 'new-secret', expires_in: 5184000 });
  }, now);
  assert.equal(saved.token, 'new-secret');
  assert.equal(saved.expiresAt, now + 60 * day);
  assert.deepEqual(result, { refreshed: true, expiresAt: saved.expiresAt });
});
test('healthy and recently refreshed tokens do not call Meta or storage', async () => {
  const fail = () => { throw Error('unexpected call'); };
  assert.equal((await renewToken({ ...record, expiresAt: now + 50 * day }, '', fail, fail, now)).refreshed, false);
  assert.equal((await renewToken({ ...record, refreshedAt: now - 1000 }, '', fail, fail, now)).refreshed, false);
});
test('bootstrap uses environment token and expired tokens require reconnection', async () => {
  let saved = false;
  await renewToken(null, 'seed', async () => { saved = true; }, async url => {
    assert.equal(url.searchParams.get('access_token'), 'seed');
    return Response.json({ access_token: 'renewed', expires_in: 5184000 });
  }, now);
  assert.ok(saved);
  await assert.rejects(renewToken({ ...record, expiresAt: now }, 'seed', async () => {}, fetch, now), /reconnection/);
});
test('provider failures and malformed replies never overwrite storage', async () => {
  for (const response of [new Response('{}', {status:400}), Response.json({access_token:'',expires_in:1}), Response.json({access_token:'secret',expires_in:-1})]) {
    let saved = false;
    await assert.rejects(renewToken(record, '', async () => { saved = true; }, async () => response, now));
    assert.equal(saved, false);
  }
  await assert.rejects(renewToken(record, '', async () => {throw Error('write failed');}, async () => Response.json({access_token:'new',expires_in:5184000}),now), /write failed/);
});
test('stored token validation rejects corrupt records', () => {
  for (const value of [null, {}, {...record, token:''}, {...record, expiresAt:0}]) assert.throws(()=>parseTokenRecord(value));
  assert.deepEqual(parseTokenRecord(record), record);
});
const stub = `data:text/javascript;base64,${Buffer.from('export const hasTokenStore=()=>false; export const readToken=()=>{throw Error("must not read")}; export const saveToken=()=>{};').toString('base64')}`;
const {GET} = await import(await moduleUrl('../src/app/api/cron/instagram/route.ts', {'@/lib/instagram/token-store':stub, '@/lib/instagram/renewal':renewalUrl}));
test('cron rejects missing and incorrect credentials; missing storage fails closed', async () => {
  const previous=process.env.CRON_SECRET;
  try {
    delete process.env.CRON_SECRET;
    assert.equal((await GET(new Request('http://localhost/api/cron/instagram'))).status,401);
    process.env.CRON_SECRET='test-secret';
    for(const authorization of ['', 'Bearer incorrect']) assert.equal((await GET(new Request('http://localhost/api/cron/instagram',{headers:{authorization}}))).status,401);
    const response=await GET(new Request('http://localhost/api/cron/instagram',{headers:{authorization:'Bearer test-secret'}}));
    assert.equal(response.status,503);
    assert.equal(response.headers.get('cache-control'),'no-store');
  } finally {if(previous===undefined)delete process.env.CRON_SECRET;else process.env.CRON_SECRET=previous;}
});
