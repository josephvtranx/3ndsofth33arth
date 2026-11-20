import { cookies } from 'next/headers';
import { allowLoginAttempt,verifyLogin,revokeSession,sessionCookie,cookieOptions } from '@/lib/waitlist-data/auth';
export const runtime='nodejs';
const reply=(data:object,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
async function readBody(request:Request){
 const reader=request.body?.getReader();if(!reader)throw new Error();const chunks:Uint8Array[]=[];let size=0;
 try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>2048){await reader.cancel();throw new Error()}chunks.push(value)}}finally{reader.releaseLock()}
 return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return reply({error:'Request not allowed.'},403);
 let body;try{body=await readBody(request);if(!body||typeof body!=='object')throw new Error();}catch{return reply({error:'Invalid request.'},400);}
 try{
  const jar=await cookies();
  if(body.action==='logout'){
   const token=jar.get(sessionCookie)?.value;if(token)await revokeSession(token);
   jar.delete(sessionCookie);return reply({success:true});
  }
  if(body.action!=='verify'||typeof body.pin!=='string'||!/^\d{4,12}$/.test(body.pin))return reply({error:'Enter your 4–12 digit PIN.'},400);
  const ip=process.env.VERCEL==='1'?request.headers.get('x-forwarded-for')?.split(',')[0]:'local';
  if(!ip)return reply({error:'Sign-in unavailable.'},503);
  if(!await allowLoginAttempt('pin-ip:'+ip,6)||!await allowLoginAttempt('pin-global',30))return reply({error:'Too many attempts. Try again in 15 minutes.'},429);
  const token=await verifyLogin(body.pin);
  if(!token)return reply({error:'Incorrect PIN.'},401);
  jar.set(sessionCookie,token,{...cookieOptions,maxAge:43200});return reply({success:true});
 }catch{return reply({error:'Sign-in is temporarily unavailable.'},503);}
}
