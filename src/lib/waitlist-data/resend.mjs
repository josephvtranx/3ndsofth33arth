// Only parse artist notification bodies emitted by our waitlist form.
export function parseWaitlistEmail(email,recipient){
 if(!email.subject?.startsWith('WORLDWIDE WAITLIST — ') || !email.to?.some(to=>to.toLowerCase()===recipient.toLowerCase()))return null;
 if(typeof email.text!=='string')throw new Error('Missing plain-text body');
 const fields={};
 for(const key of ['name','email','city','country','instagram']){
  const matches=[...email.text.replaceAll('\r\n','\n').matchAll(new RegExp('^'+key+': ([^\\r\\n]+)$','gm'))];
  if(matches.length!==1)throw new Error('Invalid notification fields');
  fields[key]=matches[0][1].trim();
 }
 if(!fields.name||fields.name.length>120||!fields.city||fields.city.length>120||!fields.country||fields.country.length>120||fields.instagram.length>80||fields.email.length>254||!/^\S+@\S+\.\S+$/.test(fields.email)||!Number.isFinite(Date.parse(email.created_at)))throw new Error('Invalid notification');
 return fields;
}
export async function resendGet(path){
 const key=process.env.RESEND_IMPORT_API_KEY;
 if(!key)throw new Error('RESEND_IMPORT_API_KEY is required (read-capable key)');
 for(let attempt=0;attempt<4;attempt++){
  const response=await fetch('https://api.resend.com'+path,{headers:{Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(15000)});
  if(response.status===429){await new Promise(r=>setTimeout(r,Math.min(10000,Math.max(1000,Number(response.headers.get('retry-after')||2)*1000))));continue;}
  if(!response.ok)throw new Error(`Resend read failed (${response.status}); verify key read access`);
  return response.json();
 }
 throw new Error('Resend rate limit; retry the import later');
}
