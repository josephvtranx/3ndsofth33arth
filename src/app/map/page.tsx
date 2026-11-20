import type { Metadata } from 'next';
import { currentAdmin } from '@/lib/waitlist-data/auth';
import Dashboard from './Dashboard';
import Login from './Login';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Waitlist — Esther Ko',robots:{index:false,follow:false}};
export default async function MapPage(){
 let admin=null;
 try{admin=await currentAdmin();}catch{}
 return admin?<Dashboard/>:<Login/>;
}
