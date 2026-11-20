'use client';
import { useState, type FormEvent } from 'react';
import styles from './map.module.css';
export default function Login(){
 const [pin,setPin]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError('');try{
  const response=await fetch('/api/map/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'verify',pin})});
  const result=await response.json();if(!response.ok)throw new Error(result.error);
  window.location.reload();
 }catch(e){setError(e instanceof Error?e.message:'Please try again.');}finally{setBusy(false)}}
 return <main className={styles.login}><form onSubmit={submit}><span className={styles.label}>Esther Ko · private workspace</span><h1>Waitlist</h1><p>Enter your PIN to open the worldwide waitlist.</p><label>Access PIN<input autoComplete="current-password" type="password" inputMode="numeric" pattern="[0-9]{4,12}" required minLength={4} maxLength={12} value={pin} onChange={e=>setPin(e.target.value)}/></label><button disabled={busy}>{busy?'Please wait…':'Open your map ↗'}</button>{error&&<p role="alert">{error}</p>}</form></main>;
}
