import { readFile,writeFile,chmod } from 'node:fs/promises';
import { emitKeypressEvents } from 'node:readline';
import { hashPin } from '../src/lib/waitlist-data/pin.mjs';
if(!process.stdin.isTTY){console.error('Run this command in an interactive terminal.');process.exit(1)}
function prompt(label){return new Promise(resolve=>{let value='';process.stdout.write(label);emitKeypressEvents(process.stdin);process.stdin.setRawMode(true);process.stdin.resume();const listener=(character,key)=>{if(key?.ctrl&&key.name==='c'){process.stdin.setRawMode(false);process.exit(1)}if(key?.name==='return'){process.stdin.removeListener('keypress',listener);process.stdin.setRawMode(false);process.stdin.pause();process.stdout.write('\n');resolve(value)}else if(key?.name==='backspace'){if(value.length){value=value.slice(0,-1);process.stdout.write('\b \b')}}else if(character&&/^\d$/.test(character)&&value.length<12){value+=character;process.stdout.write('*')}};process.stdin.on('keypress',listener)})}
const pin=await prompt('Choose an 4–12 digit waitlist PIN: ');const confirmation=await prompt('Confirm PIN: ');
if(pin!==confirmation){console.error('PINs did not match. Nothing changed.');process.exit(1)}
const encoded=await hashPin(pin);const path=new URL('../.env.local',import.meta.url);let content='';try{content=await readFile(path,'utf8')}catch{}
content=content.replace(/^WAITLIST_ADMIN_PIN_HASH=.*\n?/gm,'');await writeFile(path,content.trimEnd()+'\nWAITLIST_ADMIN_PIN_HASH='+encoded+'\n',{mode:0o600});await chmod(path,0o600);
console.log('Saved the hashed PIN in .env.local. Restart the dev server if needed. Use the same hash in Vercel to configure production.');
