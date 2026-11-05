'use strict';
// Generatore locale: costruisce equazioni valide a partire da cifre diverse.
const $ = selector => document.querySelector(selector);
const app = $('#app');
const historyKey='equasprint-history-v1';
const CHALLENGE_MS=5*60*1000;
// La difficoltà cresce per risposte corrette: nessuna soglia ufficiale Aon.
const challengeLevel=correct=>correct>=12?4:correct>=7?3:correct>=3?2:1;
const rng = n => Math.floor(Math.random()*n);
const shuffle = a => {a=[...a]; for(let i=a.length-1;i>0;i--){const j=rng(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};
const digits=n=>shuffle([1,2,3,4,5,6,7,8,9]).slice(0,n);
const fmt=x=>Number.isInteger(x)?String(x):String(Math.round(x*100)/100);
const specs=[
 {min:1,parts:['s0',' × ','s1'],f:a=>a[0]*a[1],count:2},
 {min:1,parts:['s0',' + ','s1'],f:a=>a[0]+a[1],count:2},
 {min:1,parts:['s0',' × ','s1',' + ','k'],f:(a,k)=>a[0]*a[1]+k,count:2,k:true},
 {min:1,parts:['s0',' × ','s1',' − ','k'],f:(a,k)=>a[0]*a[1]-k,count:2,k:true},
 {min:2,parts:['s0',' × ','k',' + ','s1'],f:(a,k)=>a[0]*k+a[1],count:2,k:true},
 {min:2,parts:['s0',' × ','k',' − ','s1'],f:(a,k)=>a[0]*k-a[1],count:2,k:true},
 {min:2,parts:['s0',' × ','s1',' + ','s2'],f:a=>a[0]*a[1]+a[2],count:3},
 {min:2,parts:['s0',' × ','s1',' − ','s2'],f:a=>a[0]*a[1]-a[2],count:3},
 {min:2,parts:['(','s0',' + ','s1',')',' ÷ ','s2'],f:a=>(a[0]+a[1])/a[2],count:3},
 {min:2,parts:['s0',' ÷ ','s1',' + ','s2'],f:a=>a[0]/a[1]+a[2],count:3},
 {min:3,parts:['(','s0',' + ','s1',')',' × ','s2',' − ','s3'],f:a=>(a[0]+a[1])*a[2]-a[3],count:4},
 {min:3,parts:['s0',' × ','s1',' + ','s2',' ÷ ','s3'],f:a=>a[0]*a[1]+a[2]/a[3],count:4},
 {min:3,parts:['(','s0',' × ','s1',' − ','s2',')',' ÷ ','s3'],f:a=>(a[0]*a[1]-a[2])/a[3],count:4},
 {min:3,parts:['(','s0',' + ','s1',')',' × ','s2',' − ','s3'],f:a=>(a[0]+a[1])*a[2]-a[3],count:4},
 {min:4,parts:['(','s0',' × ','s1',' + ','s2',')',' ÷ ','s3',' − ','s4'],f:a=>(a[0]*a[1]+a[2])/a[3]-a[4],count:5},
 {min:4,parts:['(','s0',' + ','s1',')',' × ','s2',' − ','s3',' × ','s4'],f:a=>(a[0]+a[1])*a[2]-a[3]*a[4],count:5},
 {min:4,parts:['s0',' × ','s1',' − ','s2',' + ','s3',' ÷ ','s4'],f:a=>a[0]*a[1]-a[2]+a[3]/a[4],count:5}
];
const makeQuestion=(level,seen)=>{
 const pool=specs.filter(s=>s.min<=level && (level===4?s.min>=2:level===3?s.min>=2:level===2?s.min<=2:true));
 for(let attempt=0;attempt<500;attempt++){
  const spec=pool[rng(pool.length)], chosen=digits(spec.count+(spec.k?1:0)), a=chosen.slice(0,spec.count), k=spec.k?chosen[spec.count]:0;
  const value=spec.f(a,k);
  if(!Number.isFinite(value)||!Number.isInteger(value)||value<1||value>130)continue;
  // Per la maggior parte degli esercizi, evitare i prodotti banali 1×N.
  if(level>=2 && spec.parts.includes(' × ') && a[0]===1)continue;
  const rendered=spec.parts.map(p=>p[0]==='s' && /^s\d$/.test(p)?'□':p==='k'?String(k):p).join('')+' = '+value;
  if(seen.has(rendered))continue;
  seen.add(rendered);return {spec,a,k,value,rendered,filled:Array(spec.count).fill(null),start:Date.now()};
 }
 throw new Error('Non è stato possibile generare una nuova equazione.');
};
const state={screen:'home',mode:'practice',level:2,length:10,questions:[],current:null,selected:0,feedback:null,results:[],started:0,deadline:0,interval:null,ended:false,seen:new Set(),stage:1};
function setScreen(html){app.innerHTML=html;}
function readHistory(){try{return JSON.parse(localStorage.getItem(historyKey)||'[]')}catch{return []}}
function saveHistory(result){try{localStorage.setItem(historyKey,JSON.stringify([result,...readHistory()].slice(0,30)))}catch{}}
function clearTimer(){if(state.interval){clearInterval(state.interval);state.interval=null;}}
function home(){clearTimer();state.screen='home';const past=readHistory().slice(0,5);setScreen(`
 <section class="card"><span class="eyebrow">Preparazione libera</span><h1>Allenati con equazioni sempre nuove.</h1>
 <p>Inserisci le cifre mancanti (da 1 a 9, tutte diverse nella stessa equazione). Allenati, fai una simulazione o affronta la nuova <strong>Sfida di 5 minuti</strong> con difficoltà crescente.</p>
 <div class="settings"><div class="field"><label for="mode">Modalità</label><select id="mode"><option value="practice">Allenamento · 10 quesiti</option><option value="timed">Simulazione · 5 minuti · livello fisso</option><option value="challenge">Sfida · 5 minuti · difficoltà crescente</option></select></div><div class="field"><label for="level">Difficoltà</label><select id="level"><option value="1">1 · Fondamentale</option><option value="2" selected>2 · Intermedia</option><option value="3">3 · Avanzata</option><option value="4">4 · Esperto</option></select></div></div>
 <div id="challengeInfo" class="notice" hidden>La Sfida parte dal livello 1 e sale dopo 3, 7 e 12 risposte corrette. Hai 5 minuti, quesiti illimitati e nessuna correzione prima del riepilogo.</div>
 <button class="btn" id="start" style="width:100%">Inizia esercitazione</button>
 <div class="notice">💡 Gli esercizi sono ispirati al ragionamento numerico di digitChallenge, ma non riproducono il test ufficiale Aon. La difficoltà è regolata da nostre regole, non da un algoritmo Aon.</div>
 ${past.length?`<div class="history"><strong>Ultime sessioni su questo dispositivo</strong><ul>${past.map(x=>`<li>${x.date} · ${x.mode==='challenge'?'Sfida · 5 min':x.mode==='timed'?'Simulazione · 5 min':'Allenamento'} · ${x.mode==='challenge'?'livello massimo '+(x.stage||1):'livello '+x.level} · ${x.correct}/${x.total} corrette</li>`).join('')}</ul></div>`:''}
 </section>`);
 $('#mode').addEventListener('change',()=>{const challenge=$('#mode').value==='challenge';$('#level').disabled=challenge;$('#challengeInfo').hidden=!challenge;});
 $('#start').addEventListener('click',()=>start($('#mode').value,Number($('#level').value)));
}
function start(mode,level){clearTimer();Object.assign(state,{screen:'play',mode,level,length:10,questions:[],selected:0,feedback:null,results:[],started:Date.now(),deadline:mode!=='practice'?Date.now()+CHALLENGE_MS:0,ended:false,seen:new Set(),stage:mode==='challenge'?1:level});next();if(mode!=='practice'){state.interval=setInterval(()=>{if(state.screen!=='play')return;const remaining=Math.max(0,state.deadline-Date.now());const el=$('#timer');if(el){el.textContent=timefmt(remaining);el.classList.toggle('warn',remaining<60000)}if(!remaining)end();},250)}}
function timefmt(ms){const seconds=Math.ceil(ms/1000);return `${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`}
function next(){if(state.screen!=='play'||state.ended)return;if(state.mode!=='practice'&&Date.now()>=state.deadline)return end();if(state.mode==='practice'&&state.results.length>=state.length)return end();if(state.mode==='challenge'){state.stage=challengeLevel(state.results.filter(r=>r.ok).length)}else state.stage=state.level;state.current=makeQuestion(state.stage,state.seen);state.selected=0;state.feedback=null;state.questions.push(state.current);renderQuestion()}
function renderQuestion(){const q=state.current;const parts=q.spec.parts.map(p=>/^s\d$/.test(p)?`<button class="slot ${Number(p.slice(1))===state.selected?'active':''} ${q.filled[Number(p.slice(1))]!==null?'filled':''}" data-slot="${p.slice(1)}" aria-label="Cifra ${Number(p.slice(1))+1}">${q.filled[Number(p.slice(1))]??'□'}</button>`:`<span class="symbol">${p==='k'?q.k:p}</span>`).join('');
 const disabled=!!state.feedback;
 const timed=state.mode!=='practice';
 const modeLabel=state.mode==='challenge'?'Sfida · 5 minuti':state.mode==='timed'?'Simulazione · 5 minuti':'Allenamento';
 setScreen(`<section class="card"><div class="statline"><span>${modeLabel} · livello ${state.stage}${state.mode==='challenge'?' / 4':''}</span><span id="timer" class="timer">${timed?timefmt(Math.max(0,state.deadline-Date.now())): `Quesito ${state.results.length+1}/${state.length}`}</span></div>
 <div class="progress"><div style="width:${timed?Math.min(100,Math.max(0,100*(1-(state.deadline-Date.now())/CHALLENGE_MS))):100*state.results.length/state.length}%"></div></div>
 <div class="eyebrow">${state.mode==='challenge'?`Quesito ${state.results.length+1} · ${state.results.filter(r=>r.ok).length} corrette`:'Completa le caselle'}</div><div class="equation" aria-label="Equazione">${parts}<span class="symbol"> = ${q.value}</span></div>
 <div class="mini" style="text-align:center">Tocca una casella e poi una cifra. Nessuna cifra può ripetersi, neanche tra quelle già visibili.</div>
 <div class="keypad">${[1,2,3,4,5,6,7,8,9,'','del',''].map(x=>x===''?'<span class="key blank"></span>':`<button class="key ${x==='del'?'del':''}" ${disabled?'disabled':''} data-key="${x}">${x==='del'?'⌫ Cancella':x}</button>`).join('')}</div>
 ${state.feedback?`<div class="notice ${state.feedback.ok?'good':'bad'}">${state.feedback.ok?'Risposta corretta!':'Risposta errata.'} ${state.mode==='practice'?`Una soluzione: ${q.spec.parts.map(p=>/^s\d$/.test(p)?q.a[Number(p.slice(1))]:p==='k'?q.k:p).join('')} = ${q.value}`:''}</div>`:''}
 <div class="actions"><button id="back" class="btn ghost">Esci</button><button id="skip" class="btn secondary" ${disabled?'disabled':''}>Salta</button><button id="submit" class="btn" ${q.filled.some(x=>x===null)||disabled?'disabled':''}>${state.feedback?'Risposta registrata':'Conferma'}</button>${state.feedback?'<button id="continue" class="btn">Prossimo →</button>':''}</div></section>`);
 $$('.slot').forEach(el=>el.addEventListener('click',()=>{state.selected=Number(el.dataset.slot);updateSlots()}));
 $$('.key').forEach(el=>el.addEventListener('click',()=>key(el.dataset.key)));
 $('#back').addEventListener('click',()=>{if(confirm('Vuoi interrompere questa sessione? I risultati parziali non saranno salvati.'))home()});
 $('#skip').addEventListener('click',()=>submit(true));$('#submit').addEventListener('click',()=>submit(false));
 if($('#continue'))$('#continue').addEventListener('click',next);
}
function $$(s){return Array.from(document.querySelectorAll(s))}
function updateSlots(){const q=state.current;$$('.slot').forEach(el=>{const i=Number(el.dataset.slot);el.textContent=q.filled[i]??'□';el.classList.toggle('active',i===state.selected);el.classList.toggle('filled',q.filled[i]!==null)});$('#submit').disabled=q.filled.some(v=>v===null);}
function key(value){if(state.screen!=='play'||state.feedback)return;if(state.mode!=='practice'&&Date.now()>=state.deadline){end();return;}const q=state.current;if(value==='del'||value==='Backspace'){q.filled[state.selected]=null;updateSlots();return}const n=Number(value);if(!Number.isInteger(n)||n<1||n>9)return;if(q.filled.some((v,i)=>i!==state.selected&&v===n)||(q.spec.k&&q.k===n))return;q.filled[state.selected]=n;const missing=q.filled.findIndex((v,i)=>v===null && i>state.selected);if(missing>=0)state.selected=missing;else{const first=q.filled.findIndex(v=>v===null);if(first>=0)state.selected=first}updateSlots()}
function submit(skip){if(state.screen!=='play'||state.feedback)return;if(state.mode!=='practice'&&Date.now()>=state.deadline){end();return;}const q=state.current; if(!skip && q.filled.some(v=>v===null))return;
 const elapsed=Date.now()-q.start;
 const ok=!skip && q.filled.every(v=>Number.isInteger(v)&&v>=1&&v<=9) && (new Set(q.spec.k?[...q.filled,q.k]:q.filled).size===q.filled.length+(q.spec.k?1:0)) && Math.abs(q.spec.f(q.filled,q.k)-q.value)<1e-9;
 state.results.push({ok,skip,elapsed,rendered:q.rendered,given:q.filled.slice(),solution:q.a.slice(),k:q.k});
 if(state.mode!=='practice'){next();return}
 state.feedback={ok};renderQuestion();
}
function end(){if(state.ended)return;state.ended=true;clearTimer();state.screen='results';const total=state.results.length,correct=state.results.filter(r=>r.ok).length,wrong=state.results.filter(r=>!r.ok&&!r.skip).length,skipped=state.results.filter(r=>r.skip).length,elapsed=state.mode==='practice'?Date.now()-state.started:Math.min(CHALLENGE_MS,Date.now()-state.started);
 saveHistory({date:new Date().toLocaleDateString('it-IT'),mode:state.mode,level:state.level,stage:state.stage,total,correct,elapsed});
 setScreen(`<section class="card"><span class="eyebrow">Sessione completata</span><h1>I tuoi risultati</h1><div class="score">${correct}/${total}</div><p>${state.mode==='challenge'?`Sfida da 5 minuti · livello massimo raggiunto: ${state.stage}/4. `:''}Equazioni corrette su quelle affrontate. Non è un punteggio Aon.</p><div class="results"><div class="result"><strong>${wrong}</strong><span>Errate</span></div><div class="result"><strong>${skipped}</strong><span>Saltate</span></div><div class="result"><strong>${Math.round(elapsed/1000)} s</strong><span>Durata</span></div></div>${state.mode==='challenge'?`<div class="notice"><strong>Ritmo:</strong> ${(correct/(Math.max(1,elapsed)/60000)).toFixed(1)} corrette/minuto · ${total} affrontate · ${skipped} saltate. I livelli avanzano dopo 3, 7 e 12 risposte corrette.</div>`:''}<div class="actions"><button class="btn" id="again">Nuova sessione</button><button class="btn secondary" id="home">Impostazioni</button></div>
 <div class="review"><h2>Riepilogo</h2>${state.results.map((r,i)=>`<div class="review-item"><strong class="${r.ok?'ok':'badtext'}">${r.ok?'✓':'×'} ${i+1}. ${r.rendered}</strong><span class="mini">Le tue cifre: ${r.given.map(v=>v??'–').join(', ')} · Una soluzione: ${r.solution.join(', ')}</span></div>`).join('')}</div></section>`);
 $('#again').addEventListener('click',()=>start(state.mode,state.level));$('#home').addEventListener('click',home);
}
window.addEventListener('keydown',e=>{if(state.screen!=='play')return;if(e.key>='1'&&e.key<='9'){key(e.key)}if(e.key==='Backspace')key('del');if(e.key==='Enter'){if(state.feedback)next();else submit(false)}});
if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
home();
