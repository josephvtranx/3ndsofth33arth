import { currentAdmin } from '@/lib/waitlist-data/auth';
import { listCities,listPeople } from '@/lib/waitlist-data/records.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const headers={'Cache-Control':'private, no-store'};
 try{
  if(!await currentAdmin())return Response.json({error:'Sign in to view the waitlist.'},{status:401,headers});
  const city=new URL(request.url).searchParams.get('city');
  if(city&&!/^[a-f0-9]{32}$/.test(city))return Response.json({error:'Invalid city.'},{status:400,headers});
  return Response.json(city?{people:await listPeople(city)}:{cities:await listCities()},{headers});
 }catch{return Response.json({error:'The waitlist could not be loaded.'},{status:503,headers});}
}
