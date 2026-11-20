"use client";
import { useEffect, useState } from "react";
type Location = { id: string; name: string; region: string; country: string };
const label = (place: Location) => [place.name, place.region, place.country].filter(Boolean).join(", ");
export default function LocationPicker({ error }: { error?: string }) {
 const [query,setQuery]=useState("");
 const [selected,setSelected]=useState<Location|null>(null);
 const [results,setResults]=useState<Location[]>([]);
 const [open,setOpen]=useState(false);
 const [active,setActive]=useState(-1);
 const [status,setStatus]=useState("");
 useEffect(()=>{
  if(selected || query.trim().length<2)return;
  const controller=new AbortController();
  const timer=setTimeout(async()=>{
   setStatus("searching…");
   try {
    const response=await fetch("/api/locations?q="+encodeURIComponent(query),{signal:controller.signal});
    if(!response.ok)throw new Error();
    const data=await response.json();
    if(controller.signal.aborted)return;
    setResults(data.locations);setStatus(data.locations.length?"":"no cities found. try a nearby city or another spelling.");
   }catch{if(!controller.signal.aborted)setStatus("location search is unavailable. please try again.");}
  },250);
  return()=>{clearTimeout(timer);controller.abort();};
 },[query,selected]);
 function choose(place:Location){setSelected(place);setQuery(label(place));setOpen(false);setResults([]);setStatus("");setActive(-1);}
 return <div className="relative flex flex-col gap-2 font-mono text-[13px] tracking-[1px] sm:col-span-2">
  <label htmlFor="waitlist-location">city / location</label>
  <input id="waitlist-location" role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls="location-options" aria-activedescendant={open&&active>=0?`location-${results[active]?.id}`:undefined} aria-invalid={Boolean(error)} aria-describedby="location-help" required autoComplete="off" maxLength={120} placeholder="search your city, state or country" value={query}
   onFocus={()=>setOpen(true)} onBlur={()=>setOpen(false)}
   onChange={e=>{setQuery(e.target.value);setSelected(null);setResults([]);setActive(-1);setStatus("");setOpen(true);e.target.setCustomValidity("select a city from the search results.");}}
   onKeyDown={e=>{if(e.key==="Escape")setOpen(false);if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();setOpen(true);setActive(n=>Math.max(0,Math.min(results.length-1,n+(e.key==="ArrowDown"?1:-1))));}if(e.key==="Enter"&&open&&active>=0&&results[active]){e.preventDefault();choose(results[active]);e.currentTarget.setCustomValidity("");}}}
   ref={node=>{if(node)node.setCustomValidity(selected?"":"select a city from the search results.");}}
   className="w-full min-w-0 border border-black bg-white px-3.5 py-3 text-base text-ink placeholder:!text-[#666] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"/>
  <input type="hidden" name="locationId" value={selected?.id||""}/>
  <input type="hidden" name="city" value={selected?.name||""}/><input type="hidden" name="country" value={selected?.country||""}/>
  <ul id="location-options" role="listbox" aria-label="Cities" hidden={!open||!results.length} className="absolute top-[76px] z-20 max-h-72 w-full overflow-auto border border-black bg-white shadow-md">
   {results.map((place,index)=><li key={place.id} id={`location-${place.id}`} role="option" aria-selected={index===active} onMouseDown={e=>e.preventDefault()} onClick={()=>choose(place)} className={`cursor-pointer px-3.5 py-3 text-sm hover:bg-neutral-100 ${active===index?"bg-neutral-100":""}`}>{label(place)}</li>)}
  </ul>
  <p id="location-help" className="text-xs tracking-normal">select your city from the results. locations by <a href="https://www.geonames.org/" target="_blank" rel="noreferrer" className="underline">GeoNames</a>.</p>
  <p role="status" className="text-xs tracking-normal">{open?status:""}</p>
  {error&&<p role="alert" className="text-xs text-[#a11]">{error}</p>}
 </div>;
}
