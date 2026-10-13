import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';
const { outputText } = ts.transpileModule(await readFile(new URL('../src/lib/email-template.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
const { renderEmail }=await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
test('email escapes every user-controlled field and preserves line breaks',()=>{
 const attack='<img src=x onerror="alert(1)"> & test';
 const html=renderEmail({eyebrow:attack,title:attack,paragraphs:[attack],details:[[attack,attack+'\nsecond line']],note:attack});
 assert.doesNotMatch(html,/<img|<script/);
 assert.match(html,/&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt; &amp; test/);
 assert.match(html,/<br \/>second line/);
 assert.match(html,/max-width:580px/);
});
