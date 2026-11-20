import { currentAdmin } from '@/lib/waitlist-data/auth';
import { restorePerson, listCities } from '@/lib/waitlist-data/records.mjs';
export const runtime='nodejs';
export async function POST(request:Request){
 const headers={'Cache-Control':'private, no-store'};
 const reply=(body:object,status=200)=>Response.json(body,{status,headers});
 if(request.headers.get('origin')!==new URL(request.url).origin)return reply({error:'Invalid request origin.'},403);
 try{
  if(!await currentAdmin())return reply({error:'Sign in to manage the waitlist.'},401);
  const id=new URL(request.url).searchParams.get('person')||'';
  if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id))return reply({error:'Invalid person.'},400);
  if(!await restorePerson(id))return reply({error:'This person could not be found.'},404);
  return reply({cities:await listCities()});
 }catch{return reply({error:'Could not restore this person. Please try again.'},503);}
}
