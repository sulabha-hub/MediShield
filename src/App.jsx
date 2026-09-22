import React, { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, Bell, Box, CalendarDays, CheckCircle2, ChevronRight, Cloud, Droplets, Fingerprint, Home, LockKeyhole, Pill, Plus, RefreshCw, ShieldCheck, Thermometer, Wifi, X } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const seed = [
 {id:1,name:"Paracetamol",dose:"500 mg",qty:24,min:10,expiry:"2027-04-15",tempMin:15,tempMax:30,rhMax:65,exposure:0,access:0},
 {id:2,name:"Vitamin D3",dose:"1000 IU",qty:6,min:8,expiry:"2026-10-12",tempMin:15,tempMax:25,rhMax:60,exposure:18,access:1},
 {id:3,name:"Cetirizine",dose:"10 mg",qty:12,min:5,expiry:"2026-11-30",tempMin:15,tempMax:30,rhMax:65,exposure:4,access:0}
];
const historySeed = [
 {time:"09:10",title:"Routine RFID access",detail:"Authorized card • Compartment A",type:"ok"},
 {time:"08:45",title:"Humidity above profile limit",detail:"68% RH • Exposure timer started",type:"warn"},
 {time:"Yesterday",title:"Medicine quantity updated",detail:"Vitamin D3 • 6 units remaining",type:"info"}
];
const fmtDate = d => new Date(d+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
function scoreFor(m,temp,rh){
 const tempDev = temp < m.tempMin ? m.tempMin-temp : temp > m.tempMax ? temp-m.tempMax : 0;
 const rhDev = Math.max(0,rh-m.rhMax);
 const expiryDays = Math.ceil((new Date(m.expiry+"T00:00:00")-new Date())/86400000);
 const expiryPenalty = expiryDays < 0 ? 45 : expiryDays <= 30 ? 25 : expiryDays <= 90 ? 12 : 0;
 const exposurePenalty = Math.min(35,m.exposure*0.8);
 const accessPenalty = Math.min(15,m.access*5);
 return Math.max(0,Math.round(100-Math.min(35,tempDev*3)-Math.min(25,rhDev*1.2)-expiryPenalty-exposurePenalty-accessPenalty));
}
function statusFor(s){return s>=80?"Stable":s>=55?"Review":"Attention";}

export default function App(){
 const [tab,setTab]=useState("Overview");
 const [view,setView]=useState("patient");
 const [meds,setMeds]=useState(()=>{try{return JSON.parse(localStorage.getItem("ms-meds"))||seed}catch{return seed}});
 const [history,setHistory]=useState(()=>{try{return JSON.parse(localStorage.getItem("ms-history"))||historySeed}catch{return historySeed}});
 const [temp,setTemp]=useState(25.4),[humidity,setHumidity]=useState(54),[demo,setDemo]=useState(true);
 const [deviceUrl,setDeviceUrl]=useState(()=>{try{return localStorage.getItem("ms-device-url")||"http://192.168.1.XX"}catch{return "http://192.168.1.XX"}});
 const [modal,setModal]=useState(false),[form,setForm]=useState({name:"",dose:"",qty:"",expiry:"",tempMin:"15",tempMax:"30",rhMax:"65",min:"5"});

 const addEvent=(title,detail,type="info")=>setHistory(h=>[{time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),title,detail,type},...h].slice(0,30));

 useEffect(()=>{
  try{localStorage.setItem("ms-meds",JSON.stringify(meds))}catch{}
 },[meds]);

 useEffect(()=>{
  try{localStorage.setItem("ms-history",JSON.stringify(history))}catch{}
 },[history]);

 useEffect(()=>{
  try{localStorage.setItem("ms-device-url",deviceUrl)}catch{}
 },[deviceUrl]);

 // Live polling from the ESP32 — only runs when demo mode is off.
 useEffect(() => {
  if (demo) return;
  const poll = setInterval(async () => {
   try {
    const res = await fetch(`${deviceUrl}/api/status`);
    const data = await res.json();
    const t = data.temperature, rh = data.humidity;
    setTemp(t);
    setHumidity(rh);
    setMeds(old => old.map(m => ({
     ...m,
     exposure: (t < m.tempMin || t > m.tempMax || rh > m.rhMax)
      ? +(m.exposure + 0.25).toFixed(2)
      : Math.max(0, +(m.exposure - 0.1).toFixed(2))
    })));
    addEvent("Sensor sample received", `${t}°C • ${rh}% RH`, (t > 30 || rh > 65) ? "warn" : "ok");
   } catch (e) {
    setHistory(h => h[0]?.title === "Connection lost" ? h : [{
     time: new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"}),
     title: "Connection lost", detail: "Could not reach device", type: "warn"
    }, ...h].slice(0, 30));
   }
  }, 5000);
  return () => clearInterval(poll);
 }, [demo, deviceUrl]);

 const computed=useMemo(()=>meds.map(m=>({...m,score:scoreFor(m,temp,humidity)})),[meds,temp,humidity]);
 const avg=Math.round(computed.reduce((a,m)=>a+m.score,0)/(computed.length||1));
 const critical=computed.filter(m=>m.score<55).length;

 function simulate(){const t=+(18+Math.random()*20).toFixed(1),rh=Math.round(35+Math.random()*45);setTemp(t);setHumidity(rh);setMeds(old=>old.map(m=>({...m,exposure:(t<m.tempMin||t>m.tempMax||rh>m.rhMax)?+(m.exposure+0.25).toFixed(2):Math.max(0,+(m.exposure-0.1).toFixed(2))})));addEvent("Sensor sample received",`${t}°C • ${rh}% RH`,(t>30||rh>65)?"warn":"ok")}
 function reset(){setMeds(seed);setTemp(25.4);setHumidity(54);setHistory(historySeed);addEvent("Demo reset","Demo values restored","info")}
 function addMedicine(e){e.preventDefault();const m={...form,id:Date.now(),qty:Number(form.qty),min:Number(form.min),tempMin:Number(form.tempMin),tempMax:Number(form.tempMax),rhMax:Number(form.rhMax),exposure:0,access:0};setMeds(a=>[...a,m]);addEvent("Medicine profile added",m.name,"ok");setModal(false);setForm({name:"",dose:"",qty:"",expiry:"",tempMin:"15",tempMax:"30",rhMax:"65",min:"5"})}
 function access(m){setMeds(a=>a.map(x=>x.id===m.id?{...x,access:x.access+1,qty:Math.max(0,x.qty-1)}:x));addEvent("Simulated compartment access",`${m.name} • Demo authorized scan`,"ok")}

 const chart=history.slice(0,7).reverse().map((h,i)=>({time:h.time,value:Math.max(0,Math.min(100,avg+(i-3)*2))}));
 const nav=[["Overview",Home],["Medicine",Pill],["Exposure",Thermometer],["Access Log",Fingerprint]];

 return <div className="app">
 <aside className="sidebar">
  <div className="brand"><div className="brandmark"><ShieldCheck size={22}/></div><div><b>MediShield</b><small>Medicine safety intelligence</small></div></div>

  <div className="viewswitch">
   <button className={view==="patient"?"vsbtn active":"vsbtn"} onClick={()=>setView("patient")}>Patient</button>
   <button className={view==="doctor"?"vsbtn active":"vsbtn"} onClick={()=>setView("doctor")}>Doctor</button>
  </div>

  {view==="patient" && <>
   <div className="navlabel">WORKSPACE</div>
   {nav.map(([n,I])=><button key={n} className={"nav "+(tab===n?"active":"")} onClick={()=>setTab(n)}><I size={18}/>{n}<ChevronRight size={15} className="navchev"/></button>)}
  </>}

  <div className="sidebottom">
   <div className="device"><span className="pulse"/><div><b>ESP32 prototype</b><small>{demo?"Demo mode":"Hardware mode"}</small></div></div>
   <button className="mode" onClick={()=>setDemo(!demo)}><Wifi size={16}/>{demo?"Switch to hardware mode":"Switch to demo mode"}</button>
   <label className="deviceurl">Device IP
    <input value={deviceUrl} onChange={e=>setDeviceUrl(e.target.value)} placeholder="http://192.168.1.XX"/>
   </label>
   <small className="muted">Hardware mode polls the ESP32's /api/status endpoint every 5s.</small>
  </div>
 </aside>

 <main className="main">
  <header className="topbar">
   <div><div className="eyebrow">MEDICATION STORAGE / {view==="doctor"?"DOCTOR VIEW":tab.toUpperCase()}</div><h1>{view==="doctor"?"Clinical dashboard":(tab==="Overview"?"Medicine safety overview":tab)}</h1></div>
   <div className="topactions">
    <span className="live"><span/> {demo?"SIMULATED DATA":"NOT CONNECTED"}</span>
    <button className="iconbtn" title="Notifications" onClick={()=>{setView("patient");setTab("Access Log")}}><Bell size={18}/></button>
    <div className="avatar">MS</div>
   </div>
  </header>

  {view==="doctor" ? <DoctorDashboard computed={computed} history={history} temp={temp} humidity={humidity}/> : <>
   {tab==="Overview"&&<><section className="hero"><div><span className="hero-tag"><Activity size={14}/> SAFETY INTELLIGENCE</span><h2>Know what’s happening<br/>inside your medicine box.</h2><p>Environmental exposure, expiry, stock and access events in one view.</p><button className="primary" onClick={()=>setTab("Exposure")}>Review safety insights <ChevronRight size={16}/></button></div><div className="hero-art"><div className="orb"><ShieldCheck size={65}/></div><span className="orb-label">MONITOR • EXPLAIN • ALERT</span></div></section>
   <section className="stats"><Stat icon={Thermometer} label="Temperature" value={`${temp}°C`} note={temp>30?"Above demo reference":"Current sensor sample"} tone={temp>30?"warn":"blue"}/><Stat icon={Droplets} label="Humidity" value={`${humidity}%`} note={humidity>65?"Above demo reference":"Current sensor sample"} tone={humidity>65?"warn":"teal"}/><Stat icon={ShieldCheck} label="Average safety score" value={`${avg}/100`} note="Prototype risk indicator" tone="green"/><Stat icon={AlertTriangle} label="Needs review" value={computed.filter(m=>m.score<80).length} note={`${critical} high-priority profile(s)`} tone="amber"/></section>
   <section className="contentgrid"><div className="panel"><div className="panelhead"><div><h3>Medicine safety profiles</h3><p>Score is calculated from configured demo rules.</p></div><button className="textbtn" onClick={()=>setTab("Medicine")}>View all <ChevronRight size={15}/></button></div><div className="medlist">{computed.slice(0,4).map(m=><MedicineRow key={m.id} m={m} onAccess={()=>access(m)}/>)}</div></div><div className="panel"><div className="panelhead"><div><h3>Safety trend</h3><p>Illustrative trend from recent activity.</p></div><span className="tinybadge">DEMO</span></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chart}><defs><linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#258b83" stopOpacity={.24}/><stop offset="100%" stopColor="#258b83" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8eeef"/><XAxis dataKey="time" tickLine={false} axisLine={false} tick={{fontSize:11,fill:"#83919a"}}/><YAxis domain={[0,100]} tickLine={false} axisLine={false} tick={{fontSize:11,fill:"#83919a"}}/><Tooltip/><Area type="monotone" dataKey="value" stroke="#258b83" fill="url(#shade)" strokeWidth={2.5}/></AreaChart></ResponsiveContainer></div><div className="chartfoot"><span><i className="legenddot"/> Safety score (illustrative)</span><span>0–100</span></div></div></section>
   <section className="contentgrid lower"><div className="panel"><div className="panelhead"><div><h3>Recent activity</h3><p>Environmental and access events.</p></div><button className="textbtn" onClick={()=>setTab("Access Log")}>Full history <ChevronRight size={15}/></button></div><Events events={history.slice(0,4)}/></div><div className="panel actionpanel"><div className="panelhead"><div><h3>Device controls</h3><p>Run a local demo action.</p></div><Box size={20} color="#258b83"/></div><button className="action" onClick={simulate}><RefreshCw size={17}/><span><b>Simulate sensor sample</b><small>Generate temperature and humidity readings</small></span><ChevronRight size={16}/></button><button className="action" onClick={()=>{addEvent("Manual review requested","User requested a review of current conditions","warn");setTab("Exposure")}}><AlertTriangle size={17}/><span><b>Review exposure status</b><small>Inspect abnormal-condition duration</small></span><ChevronRight size={16}/></button><button className="secondary full" onClick={reset}>Reset demo data</button></div></section></>}

   {tab==="Medicine"&&<><div className="pageintro"><p>Manage medicine profiles, expiry dates, quantity and configured storage thresholds.</p><button className="primary" onClick={()=>setModal(true)}><Plus size={16}/> Add medicine</button></div><div className="medgrid">{computed.map(m=><div className="panel medcard" key={m.id}><div className="medcardtop"><div className="pillicon"><Pill size={20}/></div><span className={"status "+(m.score>=80?"good":m.score>=55?"review":"bad")}>{statusFor(m.score)}</span></div><h3>{m.name}</h3><p className="dose">{m.dose}</p><div className="scoreline"><strong>{m.score}</strong><span>/100 safety score</span></div><div className="progress"><i style={{width:m.score+"%"}}/></div><div className="details"><span>Quantity <b>{m.qty} units</b></span><span>Expiry <b>{fmtDate(m.expiry)}</b></span><span>Abnormal exposure <b>{m.exposure} h</b></span><span>Access events <b>{m.access}</b></span></div>{m.qty<=m.min&&<div className="inlinealert"><AlertTriangle size={14}/> Low stock — refill review</div>}<button className="secondary full" disabled={m.qty<=0} onClick={()=>access(m)}><LockKeyhole size={15}/> Simulate compartment access</button></div>)}</div></>}

   {tab==="Exposure"&&<><section className="panel exposuretop"><div><span className="hero-tag"><Thermometer size={14}/> EXPOSURE ENGINE</span><h2>Environmental exposure</h2><p>Track deviations from each medicine’s configured storage profile. Demo thresholds are editable per medicine.</p></div><button className="primary" onClick={simulate}><RefreshCw size={16}/> Simulate new reading</button></section><section className="stats"><Stat icon={Thermometer} label="Latest temperature" value={`${temp}°C`} note="DS1307 provides time; DHT22 measures environment" tone="blue"/><Stat icon={Droplets} label="Latest humidity" value={`${humidity}%`} note="DHT22 reading (simulated)" tone="teal"/><Stat icon={Activity} label="Profiles with exposure" value={meds.filter(m=>m.exposure>0).length} note="Cumulative demo hours" tone="amber"/><Stat icon={CalendarDays} label="Expiry review" value={computed.filter(m=>(new Date(m.expiry+"T00:00:00")-new Date())/86400000<=90).length} note="Within 90 days / expired" tone="warn"/></section><div className="panel"><div className="panelhead"><div><h3>Medicine-by-medicine exposure</h3><p>Exposure hours increase during simulated out-of-range samples.</p></div></div><div className="tablewrap"><table><thead><tr><th>Medicine</th><th>Configured range</th><th>Current condition</th><th>Exposure</th><th>Score</th></tr></thead><tbody>{computed.map(m=><tr key={m.id}><td><b>{m.name}</b><small>{m.dose}</small></td><td>{m.tempMin}–{m.tempMax}°C<br/>{`RH ≤ ${m.rhMax}%`}</td><td><span className={"status "+((temp<m.tempMin||temp>m.tempMax||humidity>m.rhMax)?"review":"good")}>{temp<m.tempMin||temp>m.tempMax||humidity>m.rhMax?"Outside configured range":"Within configured range"}</span></td><td>{m.exposure} h</td><td><b>{m.score}/100</b></td></tr>)}</tbody></table></div><p className="disclaimer">The score is a demonstration heuristic, not a validated measure of medicine potency or safety. Use product-specific storage guidance; consult a pharmacist when exposure is suspected.</p></div></>}

   {tab==="Access Log"&&<><section className="panel exposuretop"><div><span className="hero-tag"><Fingerprint size={14}/> ACCESS INTELLIGENCE</span><h2>Compartment access history</h2><p>In hardware mode, RFID UID validation and reed-switch/servo events must be supplied by ESP32 firmware. Entries here are demo events.</p></div><button className="primary" onClick={()=>addEvent("Simulated RFID event","Demo card • access event recorded","warn")}><Fingerprint size={16}/> Simulate RFID event</button></section><div className="panel"><div className="panelhead"><div><h3>Event timeline</h3><p>Newest events first • stored in this browser.</p></div><span className="tinybadge">{history.length} EVENTS</span></div><Events events={history}/></div></>}
  </>}

  <footer><span>MEDISHIELD • FRONTEND PROTOTYPE</span><span><Cloud size={14}/> Local browser storage · Cloud not connected</span></footer>
 </main>

 {modal&&<div className="overlay" onClick={()=>setModal(false)}><form className="modal" onSubmit={addMedicine} onClick={e=>e.stopPropagation()}><div className="modalhead"><div><h2>Add medicine profile</h2><p>Enter details for demo monitoring.</p></div><button type="button" className="iconbtn" onClick={()=>setModal(false)}><X size={18}/></button></div><div className="formgrid">{[["name","Medicine name","text"],["dose","Strength / dose","text"],["qty","Current quantity","number"],["min","Low-stock threshold","number"],["expiry","Expiry date","date"],["tempMin","Minimum temperature °C","number"],["tempMax","Maximum temperature °C","number"],["rhMax","Maximum humidity %","number"]].map(([k,l,t])=><label key={k}>{l}<input required value={form[k]} type={t} min={t==="number"?0:undefined} onChange={e=>setForm({...form,[k]:e.target.value})}/></label>)}</div><div className="modalactions"><button type="button" className="secondary" onClick={()=>setModal(false)}>Cancel</button><button className="primary" type="submit">Save profile</button></div></form></div>}
 </div>
}

function Stat({icon:Icon,label,value,note,tone}){return <div className="stat"><div className={"staticon "+tone}><Icon size={19}/></div><div className="statlabel">{label}</div><div className="statvalue">{value}</div><div className="statnote">{note}</div></div>}

function MedicineRow({m,onAccess}){return <div className="medrow"><div className="pillicon"><Pill size={18}/></div><div className="medname"><b>{m.name}</b><small>{m.dose} · {m.qty} units</small></div><div className="scoremini"><b>{m.score}</b><small>score</small></div><span className={"status "+(m.score>=80?"good":m.score>=55?"review":"bad")}>{statusFor(m.score)}</span><button className="roundbtn" title="Simulate access" onClick={onAccess}><ChevronRight size={16}/></button></div>}

function Events({events}){return <div className="events">{events.map((e,i)=><div className="event" key={i}><div className={"eventicon "+e.type}>{e.type==="warn"?<AlertTriangle size={16}/>:e.type==="ok"?<CheckCircle2 size={16}/>:<Activity size={16}/>}</div><div className="eventbody"><b>{e.title}</b><p>{e.detail}</p></div><time>{e.time}</time></div>)}</div>}

// ---- Doctor dashboard (read-only clinical view) ----
function DoctorDashboard({computed,history,temp,humidity}){
 const [reviewed,setReviewed]=useState(()=>{try{return JSON.parse(localStorage.getItem("ms-reviewed"))||[]}catch{return []}});
 useEffect(()=>{try{localStorage.setItem("ms-reviewed",JSON.stringify(reviewed))}catch{}},[reviewed]);
 const flagged=computed.filter(m=>m.score<55 && !reviewed.includes(m.id));
 const adherence=computed.length?Math.round((computed.reduce((a,m)=>a+m.access,0)/(computed.length*3))*100):0;

 return <>
  <section className="panel exposuretop">
   <div><span className="hero-tag"><Fingerprint size={14}/> CLINICAL VIEW</span><h2>Patient overview</h2>
   <p>Read-only summary for reviewing medicine safety and adherence. Not a substitute for clinical judgment.</p></div>
  </section>

  <section className="stats">
   <Stat icon={ShieldCheck} label="Patient" value="Rakshitha R." note="Demo patient profile" tone="green"/>
   <Stat icon={Activity} label="Adherence (demo)" value={`${adherence}%`} note="Based on recorded access events" tone="blue"/>
   <Stat icon={AlertTriangle} label="Flagged profiles" value={flagged.length} note="Below safety threshold, unreviewed" tone="amber"/>
   <Stat icon={Thermometer} label="Current conditions" value={`${temp}°C / ${humidity}%`} note="Latest storage reading" tone="teal"/>
  </section>

  <div className="panel">
   <div className="panelhead"><div><h3>Flagged for clinical review</h3><p>Profiles scoring below 55/100.</p></div></div>
   {flagged.length===0 ? <p className="disclaimer">No profiles currently flagged.</p> :
    <div className="medlist">{flagged.map(m=>
     <div className="medrow" key={m.id}>
      <div className="pillicon"><Pill size={18}/></div>
      <div className="medname"><b>{m.name}</b><small>{m.dose} · score {m.score}/100</small></div>
      <button className="secondary" onClick={()=>setReviewed(r=>[...r,m.id])}>Mark reviewed</button>
     </div>)}
    </div>}
  </div>

  <div className="panel">
   <div className="panelhead"><div><h3>Full medicine record</h3><p>All configured profiles, clinical thresholds included.</p></div></div>
   <div className="tablewrap"><table><thead><tr><th>Medicine</th><th>Dose</th><th>Configured range</th><th>Exposure</th><th>Access events</th><th>Score</th></tr></thead>
    <tbody>{computed.map(m=><tr key={m.id}><td><b>{m.name}</b></td><td>{m.dose}</td><td>{m.tempMin}–{m.tempMax}°C, RH ≤{m.rhMax}%</td><td>{m.exposure} h</td><td>{m.access}</td><td><b>{m.score}/100</b></td></tr>)}</tbody>
   </table></div>
  </div>

  <div className="panel">
   <div className="panelhead"><div><h3>Recent activity</h3><p>Environmental and access events across the device.</p></div></div>
   <Events events={history.slice(0,6)}/>
  </div>

  <p className="disclaimer">Doctor view is read-only in this prototype — patient profile edits happen from the patient dashboard.</p>
 </>
}