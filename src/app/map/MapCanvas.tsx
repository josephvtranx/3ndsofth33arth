'use client';
import { useEffect,useRef,useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { City } from './types';
import styles from './map.module.css';
export default function MapCanvas({cities,selected,onSelect}:{cities:City[];selected:string|null;onSelect:(city:City)=>void}){
 const container=useRef<HTMLDivElement>(null);const map=useRef<maplibregl.Map|null>(null);const callback=useRef(onSelect);const markers=useRef<{id:string;marker:maplibregl.Marker}[]>([]);const [ready,setReady]=useState(false);const [error,setError]=useState('');
 useEffect(()=>{callback.current=onSelect},[onSelect]);
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 function world(){map.current?.fitBounds([[-135,-49],[155,64]],{padding:40,duration:reduced()?0:900})}
 useEffect(()=>{
  let cancelled=false;
  async function init(){try{
   const response=await fetch('https://demotiles.maplibre.org/style.json');if(!response.ok)throw new Error();
   const style:StyleSpecification=await response.json();
   for(const layer of style.layers){
    if(layer.type==='background')layer.paint={...layer.paint,'background-color':'#fdfdfd'};
    if(layer.type==='fill')layer.paint={...layer.paint,'fill-color':'#e9e9e9'};
    if(layer.type==='line')layer.paint={...layer.paint,'line-color':'#ccc'};
    if(layer.type==='symbol')layer.paint={...layer.paint,'text-color':'#888','text-halo-color':'#fff'};
    if(layer.id.startsWith('geolines'))layer.layout={...layer.layout,visibility:'none'};
   }
   if(cancelled||!container.current)return;
   maplibregl.setWorkerUrl('/maplibre-gl-worker.mjs');
   const instance=new maplibregl.Map({container:container.current,style,center:[15,20],zoom:1,renderWorldCopies:false,maxBounds:[[-180,-58],[180,82]],maxZoom:6,dragRotate:false,pitchWithRotate:false});map.current=instance;
   instance.scrollZoom.setZoomRate(1/400);instance.scrollZoom.setWheelZoomRate(1/1800);instance.touchZoomRotate.disableRotation();
   instance.on('load',()=>{if(!cancelled){setReady(true);setError('');container.current?.setAttribute('data-map-ready','true')}});instance.on('error',()=>{if(!cancelled)setError('Some map data could not load. You can still use the waitlist.')});
   instance.fitBounds([[-135,-49],[155,64]],{padding:40,duration:0});
  }catch{if(!cancelled)setError('Map unavailable. You can still use the waitlist.')}}
  void init();return()=>{cancelled=true;map.current?.remove();map.current=null};
 },[]);
 useEffect(()=>{
  if(!ready||!map.current)return;
  markers.current.forEach(({marker})=>marker.remove());
  markers.current=cities.filter(c=>c.longitude!==null&&c.latitude!==null).map(city=>{
   const button=document.createElement('button');button.className=styles.pin;button.style.width=button.style.height=Math.min(62,30+Math.sqrt(city.count)*5)+'px';button.textContent=String(city.count);button.style.zIndex=String(city.count);button.setAttribute('aria-label',`${city.name}: ${city.count} people`);button.onclick=()=>callback.current(city);
   const marker=new maplibregl.Marker({element:button}).setLngLat([city.longitude!,city.latitude!]).addTo(map.current!);return {id:city.id,marker};
  });return()=>{markers.current.forEach(({marker})=>marker.remove());markers.current=[]};
 },[cities,ready]);
 useEffect(()=>{
  markers.current.forEach(({id,marker})=>{const element=marker.getElement();element.setAttribute('aria-pressed',String(selected===id));element.style.zIndex=String(selected===id?100000:(cities.find(city=>city.id===id)?.count||1));});
  const city=cities.find(c=>c.id===selected);
  if(city?.longitude!=null&&city.latitude!=null)map.current?.flyTo({center:[city.longitude,city.latitude],zoom:4,duration:reduced()?0:1300});
 },[selected,cities,ready]);
 function zoom(step:number){const m=map.current;if(m){m.stop();m.easeTo({zoom:Math.max(m.getMinZoom(),Math.min(m.getMaxZoom(),m.getZoom()+step)),duration:reduced()?0:350})}}
 return <div className={styles.map}><div ref={container} className={styles.canvas} aria-label="Worldwide waitlist map"/><div className={styles.mapTools}><span className={styles.label}>where they are · all time</span><button onClick={world}>show the world ↗</button></div><div className={styles.zoom}><button aria-label="Zoom in" onClick={()=>zoom(.25)}>+</button><button aria-label="Zoom out" onClick={()=>zoom(-.25)}>−</button></div>{error&&<p className={styles.mapError} role="status">{error}</p>}</div>;
}
