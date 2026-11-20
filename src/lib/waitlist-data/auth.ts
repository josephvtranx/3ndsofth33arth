import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { database } from './database.mjs';
import { checkPin } from './pin.mjs';
export const sessionCookie='waitlist_session';
export const cookieOptions={httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict' as const,path:'/'};
const hash=(value:string)=>createHash('sha256').update(value).digest('hex');
function principal(){const credential=process.env.WAITLIST_ADMIN_PIN_HASH;if(!credential||!/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(credential))return null;return 'pin:'+hash(credential);}
export async function currentAdmin(){
 const token=(await cookies()).get(sessionCookie)?.value;
 const owner=principal();if(!owner||!token||!/^[a-f0-9]{64}$/.test(token))return null;
 const result=await database().query('SELECT principal FROM waitlist_sessions WHERE token_hash=$1 AND expires_at>now()',[hash(token)]);
 return result.rows[0]?.principal===owner?owner:null;
}
export async function allowLoginAttempt(key:string,limit:number){
 const result=await database().query(`INSERT INTO waitlist_login_limits(key,attempts,expires_at) VALUES($1,1,now()+interval '15 minutes')
 ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN waitlist_login_limits.expires_at<now() THEN 1 ELSE waitlist_login_limits.attempts+1 END,
 expires_at=CASE WHEN waitlist_login_limits.expires_at<now() THEN now()+interval '15 minutes' ELSE waitlist_login_limits.expires_at END RETURNING attempts`,[hash(key)]);
 return result.rows[0].attempts<=limit;
}
export async function verifyLogin(pin:string){
 const owner=principal();if(!owner)throw new Error('PIN not configured');
 if(!await checkPin(pin,process.env.WAITLIST_ADMIN_PIN_HASH))return null;
 const token=randomBytes(32).toString('hex');
 await database().query('INSERT INTO waitlist_sessions(token_hash,principal,expires_at) VALUES($1,$2,now()+interval \'12 hours\')',[hash(token),owner]);return token;
}
export async function revokeSession(token:string){await database().query('DELETE FROM waitlist_sessions WHERE token_hash=$1',[hash(token)]);}
