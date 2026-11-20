import { resendGet,parseWaitlistEmail } from '../src/lib/waitlist-data/resend.mjs';
import { saveSignup } from '../src/lib/waitlist-data/records.mjs';
import { closeDatabase } from '../src/lib/waitlist-data/database.mjs';
const apply=process.argv.includes('--apply');
const recipient=process.env.BOOKING_TO_EMAIL;
let after,scanned=0,matched=0,saved=0,duplicates=0,unreadable=0;
try{
 if(!recipient)throw new Error('BOOKING_TO_EMAIL is required to identify artist notifications');
 do{
  const page=await resendGet('/emails?limit=100'+(after?'&after='+encodeURIComponent(after):''));
  for(const item of page.data){
   scanned++;
   if(!item.subject?.startsWith('WORLDWIDE WAITLIST — ')||!item.to?.some(to=>to.toLowerCase()===recipient.toLowerCase()))continue;
   await new Promise(r=>setTimeout(r,600));
   const email=await resendGet('/emails/'+encodeURIComponent(item.id));
   let fields;try{fields=parseWaitlistEmail(email,recipient);}catch{unreadable++;continue;}
   if(!fields)continue;matched++;
   if(apply){const result=await saveSignup(fields,{sourceId:'resend:'+item.id,source:'resend',createdAt:email.created_at,artistEmailSent:true});if(result.duplicate)duplicates++;else saved++;}
  }
  after=page.has_more?page.data.at(-1)?.id:undefined;
  if(page.has_more&&!after)throw new Error('Invalid pagination response');
  if(after)await new Promise(r=>setTimeout(r,600));
 }while(after);
 console.log({mode:apply?'import':'preview',scanned,matched,saved,duplicates,unreadable});
 if(unreadable)console.log('Some notifications could not be parsed; they were not imported.');
}catch(error){console.error(error.message);process.exitCode=1;}finally{await closeDatabase();}
