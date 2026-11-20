"use client";
import { useEffect,useRef,useState } from 'react';
import type { City,Person } from './types';
import styles from './map.module.css';
type ResolvedPerson=Person&{city:string;country:string;region:string|null;resolved_at:string};
export default function ResolvedPeople({onRestored}:{onRestored:(cities:City[])=>void}){
 const [people,setPeople]=useState<ResolvedPerson[]|null>(null);
 const [query,setQuery]=useState('');const [expanded,setExpanded]=useState<string|null>(null);
 const [error,setError]=useState('');const [retry,setRetry]=useState(0);
 const [pending,setPending]=useState<string|null>(null);const busy=useRef(false);
 const [restoreError,setRestoreError]=useState('');const [notice,setNotice]=useState('');
 useEffect(()=>{
  const controller=new AbortController();
  fetch('/api/map/resolved',{cache:'no-store',signal:controller.signal}).then(async response=>{
   if(response.status===401){window.location.reload();return;}
   const body=await response.json();if(!response.ok)throw new Error();
   if(!controller.signal.aborted){setPeople(body.people);setError('');}
  }).catch(()=>{if(!controller.signal.aborted)setError('Could not load resolved people. Please try again.');});
  return()=>controller.abort();
 },[retry]);
 async function restore(person:ResolvedPerson){
  if(busy.current)return;busy.current=true;setPending(person.id);setRestoreError('');setNotice('');
  try{
   const response=await fetch('/api/map/restore?person='+encodeURIComponent(person.id),{method:'POST'});
   if(response.status===401){window.location.reload();return;}
   const body=await response.json();if(!response.ok)throw new Error();
   setPeople(old=>old?.filter(item=>item.id!==person.id)||[]);setExpanded(null);
   onRestored(body.cities);setNotice('Restored to the waitlist.');
  }catch{setRestoreError('Could not restore this person. Please try again.');}
  finally{busy.current=false;setPending(null);}
 }
 const filtered=people?.filter(person=>[person.name,person.city,person.country,person.region].filter(Boolean).join(' ').toLowerCase().includes(query.trim().toLowerCase()));
 return <div className={styles.cityPeople}>
  <label className={styles.srOnly} htmlFor="resolved-search">Search resolved people</label>
  <input id="resolved-search" type="search" placeholder="search names or cities…" value={query} onChange={event=>setQuery(event.target.value)}/>
  {notice&&<p role="status">{notice}</p>}
  {error?<p role="alert">{error}<button onClick={()=>setRetry(n=>n+1)}>Retry</button></p>:!people?<p role="status">Loading resolved people…</p>:!people.length?<p>No resolved people yet.</p>:!filtered?.length?<p>No people match your search.</p>:filtered.map(person=><div key={person.id} className={styles.person}>
   <button aria-expanded={expanded===person.id} aria-controls={'resolved-'+person.id} onClick={()=>{setExpanded(expanded===person.id?null:person.id);setRestoreError('');}}><span>{person.name}<small className={styles.resolvedLocation}>{[person.city,person.region,person.country].filter(Boolean).join(', ')}</small></span><span aria-hidden>{expanded===person.id?'−':'+'}</span></button>
   <div id={'resolved-'+person.id} className={styles.expansion} data-open={expanded===person.id} inert={expanded!==person.id}><div>
    <dl><dt>instagram</dt><dd>{person.instagram}</dd><dt>email</dt><dd><a href={'mailto:'+person.email}>{person.email}</a></dd><dt>resolved</dt><dd>{new Date(person.resolved_at).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'})}</dd></dl>
    <button className={styles.resolve} disabled={pending!==null} onClick={()=>restore(person)}>{pending===person.id?'Restoring…':'Restore to waitlist'}</button>
    {restoreError&&expanded===person.id&&<p role="alert">{restoreError}</p>}
   </div></div>
  </div>)}
 </div>;
}
