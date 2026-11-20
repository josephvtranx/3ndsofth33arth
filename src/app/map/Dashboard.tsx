'use client';
import { useCallback,useEffect,useRef,useState } from 'react';
import dynamic from 'next/dynamic';
import ResolvedPeople from './ResolvedPeople';
import type { City,Person } from './types';
import styles from './map.module.css';
const MapCanvas=dynamic(()=>import('./MapCanvas'),{ssr:false});
function Expansion({open,children}:{open:boolean;children:React.ReactNode}){return <div className={styles.expansion} data-open={open} inert={!open}><div>{children}</div></div>}
function CityPeople({city,onResolved}:{city:City;onResolved:(cities:City[])=>void}){
 const [resolving,setResolving]=useState<string|null>(null);
 const [resolveError,setResolveError]=useState('');
 const resolvingRef=useRef(false);
 async function resolve(person:Person){
  if(resolvingRef.current)return;
  resolvingRef.current=true;setResolving(person.id);setResolveError('');
  try{
   const response=await fetch('/api/map/resolve?person='+encodeURIComponent(person.id),{method:'POST'});
   if(response.status===401){window.location.reload();return;}
   const body=await response.json();
   if(!response.ok)throw new Error(body.error);
   setPeople(old=>old?.filter(item=>item.id!==person.id)||null);
   setExpanded(null);onResolved(body.cities);
  }catch{setResolveError('Could not resolve this person. Please try again.');}
  finally{resolvingRef.current=false;setResolving(null);}
 }
 const [people,setPeople]=useState<Person[]|null>(null);const [error,setError]=useState('');const [query,setQuery]=useState('');const [expanded,setExpanded]=useState<string|null>(null);const [retry,setRetry]=useState(0);
 useEffect(()=>{let cancelled=false;fetch('/api/map/cities?city='+city.id,{cache:'no-store'}).then(async r=>{if(r.status===401){window.location.reload();return}const body=await r.json();if(!r.ok)throw new Error(body.error);if(!cancelled){setPeople(body.people);setError('')}}).catch(()=>{if(!cancelled)setError('Could not load names. Please try again.')});return()=>{cancelled=true}},[city.id,retry]);
 const filtered=people?.filter(person=>person.name.toLowerCase().includes(query.trim().toLowerCase()));
 return <div className={styles.cityPeople}><label className={styles.srOnly} htmlFor={'search-'+city.id}>Search names in {city.name}</label><input id={'search-'+city.id} type="search" placeholder="search names…" value={query} onChange={e=>setQuery(e.target.value)}/>{city.latitude===null&&<p className={styles.label}>City location needs review.</p>}{error?<p role="alert">{error}<button onClick={()=>setRetry(n=>n+1)}>Retry</button></p>:!people?<p role="status">Loading names…</p>:filtered?.length===0?<p role="status">No names match your search.</p>:filtered?.map(person=><div key={person.id} className={styles.person}><button aria-expanded={expanded===person.id} aria-controls={'person-'+person.id} onClick={()=>setExpanded(expanded===person.id?null:person.id)}>{person.name}<span aria-hidden>{expanded===person.id?'−':'+'}</span></button><div id={'person-'+person.id}><Expansion open={expanded===person.id}><dl><dt>instagram</dt><dd>{person.instagram}</dd><dt>email</dt><dd><a href={'mailto:'+person.email}>{person.email}</a></dd><dt>joined</dt><dd>{new Date(person.created_at).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'})}</dd></dl><button className={styles.resolve} disabled={resolving!==null} onClick={()=>resolve(person)}>{resolving===person.id?'Resolving…':'Resolve'}</button>{resolveError&&expanded===person.id&&<p role="alert">{resolveError}</p>}</Expansion></div></div>)}</div>;
}
export default function Dashboard(){
 const [view,setView]=useState<'active'|'resolved'>('active');
 const side=useRef<HTMLElement>(null);
 const [mapSelection,setMapSelection]=useState<{id:string}|null>(null);
 useEffect(()=>{
  if(!mapSelection)return;
  let cancelled=false;
  const frame=requestAnimationFrame(async()=>{
   // Wait for the previous city to collapse so the destination stops moving.
   await Promise.allSettled((side.current?.getAnimations({subtree:true})||[]).map(animation=>animation.finished));
   if(cancelled)return;
   document.getElementById('city-row-'+mapSelection.id)?.scrollIntoView({
    behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',
    block:'start',inline:'nearest',
   });
  });
  return()=>{cancelled=true;cancelAnimationFrame(frame)};
 },[mapSelection]);
 const [cities,setCities]=useState<City[]>([]);const [loaded,setLoaded]=useState(false);const [error,setError]=useState('');const [active,setActive]=useState<string|null>(null);const [visited,setVisited]=useState<Set<string>>(new Set());const [retry,setRetry]=useState(0);
 useEffect(()=>{let cancelled=false;fetch('/api/map/cities',{cache:'no-store'}).then(async r=>{if(r.status===401){window.location.reload();return}const body=await r.json();if(!r.ok)throw new Error();if(!cancelled){setCities(body.cities);setLoaded(true);setError('')}}).catch(()=>{if(!cancelled)setError('The waitlist could not be loaded.')});return()=>{cancelled=true}},[retry]);
 const resolved=useCallback((updated:City[])=>{
  setCities(updated);setActive(old=>updated.some(city=>city.id===old)?old:null);
 },[]);
 const select=useCallback((city:City)=>{setActive(old=>old===city.id?null:city.id);setVisited(old=>new Set(old).add(city.id))},[]);
 const selectFromMap=useCallback((city:City)=>{
  setView('active');
  setActive(city.id);
  setVisited(old=>new Set(old).add(city.id));
  setMapSelection({id:city.id});
 },[]);
 return <main className={styles.board}><MapCanvas cities={cities} selected={active} onSelect={selectFromMap}/><aside ref={side} className={styles.side}><div className={styles.sideHeader}><span className={styles.label}>most requested</span><h1>Waitlist</h1><nav className={styles.tabs} aria-label="Waitlist views"><button aria-pressed={view==='active'} onClick={()=>setView('active')}>Active</button><button aria-pressed={view==='resolved'} onClick={()=>setView('resolved')}>Resolved</button></nav></div>{view==='resolved'?<ResolvedPeople onRestored={resolved}/>:<>{error&&<p role="alert">{error}<button onClick={()=>setRetry(n=>n+1)}>Retry</button></p>}{!loaded&&!error&&<p role="status">Loading waitlist…</p>}{loaded&&!cities.length&&<p>No waitlist signups yet.</p>}{cities.map(city=><section key={city.id} id={'city-row-'+city.id} className={styles.cityGroup}><button className={styles.city} aria-expanded={active===city.id} aria-controls={'city-'+city.id} onClick={()=>select(city)}><span>{city.name}<small>{[city.region,city.country].filter(Boolean).join(", ")}</small></span><span>{city.count}<span aria-hidden>{active===city.id?'−':'+'}</span></span></button><div id={'city-'+city.id}><Expansion open={active===city.id}>{visited.has(city.id)&&<CityPeople city={city} onResolved={resolved}/>}</Expansion></div></section>)}</>}</aside></main>;
}
