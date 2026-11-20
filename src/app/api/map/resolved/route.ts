import { currentAdmin } from '@/lib/waitlist-data/auth';
import { listResolvedPeople } from '@/lib/waitlist-data/records.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){
 const headers={'Cache-Control':'private, no-store'};
 try{
  if(!await currentAdmin())return Response.json({error:'Sign in to view resolved people.'},{status:401,headers});
  return Response.json({people:await listResolvedPeople()},{headers});
 }catch{return Response.json({error:'Resolved people could not be loaded.'},{status:503,headers});}
}
