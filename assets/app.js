
(function(){
  'use strict';

  const statusBadge = ()=> document.getElementById('statusBadge');

  // Toggle customizer bar
  document.addEventListener('DOMContentLoaded', ()=>{
    const t=document.getElementById('toggleCustomize');
    const c=document.getElementById('customizer');
    if (t && c){
      t.addEventListener('click', (e)=>{ e.preventDefault(); c.classList.toggle('open'); });
    }
  });

  // Gauge definitions
  const GAUGE_DEFS = {
    gear:  { title:'Current Gear',     unit:'',   mode:'text' },
    rpm:   { title:'RPM',              unit:'RPM', min:0, max:7500, warn:[6500,7000],                 majorStep:2000 },
    oil:   { title:'Oil Temp',         unit:'°C',  min:0, max:150,  warn:[110,125],   cold:80,        majorStep:25   },
    clt:   { title:'Coolant Temp',     unit:'°C',  min:0, max:120,  warn:[105,115],   cold:80,        majorStep:25   },
    trans: { title:'Transmission Temp',unit:'°C',  min:0, max:130,  warn:[105,115],   cold:80,        majorStep:25   },
    oilp:  { title:'Oil Pressure',     unit:'psi', min:0, max:100,  lowDanger:10, lowWarn:20, warn:[90,100], majorStep:20 },
    volt:  { title:'Voltage',          unit:'V',   min:8, max:16,   lowDanger:11.0, lowWarn:12.0, warn:[15.2,16.0], majorStep:2 },
    maf:   { title:'MAF',              unit:'g/s', min:0, max:250,  warn:[200,240], majorStep:50 },
    stft:  { title:'STFT',             unit:'%',   min:-25, max:25, lowDanger:-25, lowWarn:-15, warn:[15,20], majorStep:10 },
    ltft:  { title:'LTFT',             unit:'%',   min:-25, max:25, lowDanger:-25, lowWarn:-15, warn:[15,20], majorStep:10 },
    spark: { title:'Ignition Timing',  unit:'°',   min:-10, max:50, lowDanger:-10, lowWarn:-5, warn:[40,50], majorStep:10 },
    kr:    { title:'Knock Retard',     unit:'°',   min:0, max:8, warn:[2,4], majorStep:1 },
    tcc:   { title:'TCC Slip',         unit:'RPM', min:0, max:400, warn:[100,200], majorStep:100 },
    linep: { title:'Line/Clutch Press',unit:'psi', min:0, max:300, lowDanger:30, warn:[250,300], majorStep:50 }
  };
  window.OBD_CONFIG = GAUGE_DEFS;

  const COLORS={track:'#1f2937', ok:'#22c55e', warn:'#f59e0b', hot:'#ef4444', cold:'#3b82f6', tick:'#475569', text:'#e5e7eb', muted:'#9ca3af', needle:'#e5e7eb'};
  const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  const dpr=()=>Math.max(1,Math.min(2,window.devicePixelRatio||1));
  function niceStep(min,max){const target=5,span=Math.max(1,max-min);const raw=span/target,p10=Math.pow(10,Math.floor(Math.log10(raw)));const cand=[1,2,2.5,5,10].map(m=>m*p10);for(const c of cand) if(c>=raw) return c;return 10*p10;}
  function tickLabels(min,max,cfg){if(cfg&&cfg.majorStep){const step=cfg.majorStep,arr=[];for(let v=min;v<=max;v+=step)arr.push(+v.toFixed(1));if(arr[arr.length-1]!==max)arr.push(max);return arr;}const step=niceStep(min,max),first=Math.ceil(min/step)*step,arr=[];for(let v=first;v<=max+1e-6;v+=step)arr.push(v);if(arr[0]!==min)arr.unshift(min);if(arr[arr.length-1]!==max)arr.push(max);return arr;}

  function setupCanvas(canvas){
    const card=canvas.closest('.card')||canvas.parentElement||document.body;
    const pad=24,cw=Math.max(240,(card.clientWidth||320)-pad),ch=Math.round(cw*0.58),ratio=dpr();
    canvas.width=Math.round(cw*ratio);canvas.height=Math.round(ch*ratio);
    canvas.style.width=cw+'px';canvas.style.height=ch+'px';
    const ctx=canvas.getContext('2d');ctx.setTransform(1,0,0,1,0,0);ctx.scale(ratio,ratio);
    return {ctx,W:cw,H:ch};
  }

  function drawGauge(canvas,cfg,value){
    const {ctx,W,H}=setupCanvas(canvas);
    const bandW=Math.max(8,W*0.032), numSize=Math.max(12,Math.round(W*0.055));
    const topMargin=numSize+bandW*2.2, bottomMargin=bandW*1.2+10, sideMargin=14;
    const estBand=bandW, estNum=numSize, extra=estBand*3.2+estNum*0.8;
    const rByWidth=W/2 - sideMargin - extra, rByHeight=H-topMargin-bottomMargin;
    const r=Math.max(40,Math.min(rByWidth,rByHeight));
    const cx=W/2, cy=H-bottomMargin, start=Math.PI, end=2*Math.PI, spanA=end-start;
    ctx.clearRect(0,0,W,H); ctx.lineCap='round';
    ctx.beginPath(); ctx.strokeStyle=COLORS.track; ctx.lineWidth=Math.max(10,W*0.04); ctx.arc(cx,cy,r,start,end,false); ctx.stroke();
    const v2a=v=> start + spanA * ((v - cfg.min) / (cfg.max - cfg.min));
    const segments=[]; let cursor=cfg.min; const push=(to,col)=>{ if(to>cursor){ segments.push({from:cursor,to,col}); cursor=to; } };
    if(cfg.lowDanger!==undefined) push(cfg.lowDanger,COLORS.hot);
    if(cfg.lowWarn!==undefined)   push(cfg.lowWarn,  COLORS.warn);
    if(cfg.cold!==undefined)      push(cfg.cold,     COLORS.cold);
    if(cfg.warn&&cfg.warn.length===2){ push(cfg.warn[0],COLORS.ok); push(cfg.warn[1],COLORS.warn); push(cfg.max,COLORS.hot); } else { push(cfg.max,COLORS.ok); }
    ctx.lineWidth=bandW; ctx.lineCap='butt'; for(const s of segments){ ctx.beginPath(); ctx.strokeStyle=s.col; ctx.arc(cx,cy,r, v2a(s.from), v2a(s.to), false); ctx.stroke(); }
    const labels=tickLabels(cfg.min,cfg.max,cfg), tickIn=r+bandW*0.5, tickOut=r+bandW*1.4;
    ctx.lineWidth=Math.max(2,W*0.008); ctx.strokeStyle=COLORS.tick;
    for(const v of labels){ const a=v2a(v); ctx.beginPath(); ctx.moveTo(cx+tickIn*Math.cos(a),cy+tickIn*Math.sin(a)); ctx.lineTo(cx+tickOut*Math.cos(a),cy+tickOut*Math.sin(a)); ctx.stroke(); }
    ctx.fillStyle=COLORS.muted; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font=`600 ${numSize}px system-ui,-apple-system,Segoe UI,Roboto`;
    const labelR=r+bandW*3.1; for(const v of labels){ const a=v2a(v); const tx=cx+labelR*Math.cos(a),ty=cy+labelR*Math.sin(a); ctx.fillText((Math.abs(v)%1>0?v.toFixed(1):Math.round(v)).toString(), tx, ty); }
    const use=Number.isFinite(value)?Math.max(cfg.min,Math.min(cfg.max,value)):cfg.min; const ang=v2a(use);
    ctx.strokeStyle=COLORS.needle; ctx.lineWidth=Math.max(3,W*0.012); ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+(r-bandW*1.1)*Math.cos(ang), cy+(r-bandW*1.1)*Math.sin(ang)); ctx.stroke();
    ctx.fillStyle='#cbd5e1'; ctx.beginPath(); ctx.arc(cx,cy,Math.max(4,W*0.018),0,Math.PI*2); ctx.fill();
  }

  function setReadout(id,value,unit){
    const el=document.getElementById('val_'+id); if(!el) return;
    el.innerHTML = (GAUGE_DEFS[id].mode==='text')
      ? (value!==undefined && value!==null ? ('<span style="opacity:.9;font-size:1.8rem">'+value+'</span>') : 'N/A')
      : (Number.isFinite(value) ? (Math.round(value)+' <span>'+unit+'</span>') : ('N/A <span>'+unit+'</span>'));
  }

  const STORAGE_KEY='OBD_LAYOUT_V4';
  function defaultLayout(){ return ['gear','rpm','oil','clt','trans','oilp','volt','maf','stft','ltft','spark','kr','tcc','linep']; }
  function loadLayout(){ try{ const s=localStorage.getItem(STORAGE_KEY); if(s){ const arr=JSON.parse(s); if(Array.isArray(arr)){ const f=arr.filter(id=>GAUGE_DEFS[id]); if(f.length) return f; } } }catch{} return defaultLayout(); }
  function saveLayout(arr){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); }catch{} }

  let LAYOUT=loadLayout();
  const GAUGES={};

  function buildGrid(){
    const grid=document.getElementById('grid'); grid.innerHTML='';
    LAYOUT.forEach(id=>{
      const def=GAUGE_DEFS[id]; if(!def) return;
      const card=document.createElement('section'); card.className='card'; if(def.mode==='text') card.classList.add('text'); card.draggable=true; card.dataset.gid=id;
      const title=document.createElement('div'); title.className='title'; title.textContent=def.title;
      const wrap=document.createElement('div'); wrap.className='gwrap'; const canvas=document.createElement('canvas'); canvas.id=id; if(def.mode==='text') canvas.style.display='none'; wrap.appendChild(canvas);
      const ro=document.createElement('div'); ro.className='readout'; ro.id='val_'+id; ro.innerHTML='N/A <span>'+ (def.unit||'') +'</span>';
      card.appendChild(title); card.appendChild(wrap); card.appendChild(ro); grid.appendChild(card);
    });
  }

  function mountOne(id,cfg){
    const el=document.getElementById(id); if(!el) return;
    let draw; if(GAUGE_DEFS[id].mode==='text'){ draw=()=>{}; } else { draw=v=>drawGauge(el,cfg,v); draw(NaN); }
    GAUGES[id]={canvas:el,draw,cfg}; setReadout(id,null,cfg.unit||'');
    const card=el.closest('.card'); if(window.ResizeObserver && card){ const ro=new ResizeObserver(()=>{ if(GAUGE_DEFS[id].mode!=='text') draw(NaN); }); ro.observe(card); } else { window.addEventListener('resize', ()=>{ if(GAUGE_DEFS[id].mode!=='text') draw(NaN); }); }
  }

  function bindDnD(){
    document.querySelectorAll('.card').forEach(card=>{
      card.addEventListener('dragstart', e=>{ card.classList.add('dragging'); e.dataTransfer.setData('text/plain', card.dataset.gid); e.dataTransfer.effectAllowed='move'; });
      card.addEventListener('dragend', ()=> card.classList.remove('dragging'));
      card.addEventListener('dragover', e=>{ e.preventDefault(); card.classList.add('drag-over'); e.dataTransfer.dropEffect='move'; });
      card.addEventListener('dragleave', ()=> card.classList.remove('drag-over'));
      card.addEventListener('drop', e=>{ e.preventDefault(); card.classList.remove('drag-over'); const dragged=e.dataTransfer.getData('text/plain'); const target=card.dataset.gid; if(!dragged||dragged===target) return; const from=LAYOUT.indexOf(dragged), to=LAYOUT.indexOf(target); if(from<0||to<0) return; LAYOUT.splice(to,0, LAYOUT.splice(from,1)[0]); saveLayout(LAYOUT); mountAll(); });
    });
  }

  function syncMenuChecks(){ document.querySelectorAll('#menuPanel input[type=checkbox]').forEach(cb=> cb.checked = LAYOUT.includes(cb.dataset.g)); }
  function applySelection(){ const chosen=[]; document.querySelectorAll('#menuPanel input[type=checkbox]:checked').forEach(cb=>chosen.push(cb.dataset.g)); const source=chosen.length?chosen:defaultLayout(); const existing=LAYOUT.filter(id=>source.includes(id)); const newbies=source.filter(id=>!existing.includes(id)); LAYOUT=existing.concat(newbies); saveLayout(LAYOUT); mountAll(); }
  function resetLayout(){ LAYOUT=defaultLayout(); saveLayout(LAYOUT); mountAll(); }
  function mountAll(){ buildGrid(); LAYOUT.forEach(id=> mountOne(id, GAUGE_DEFS[id])); bindDnD(); syncMenuChecks(); }

  document.addEventListener('DOMContentLoaded', ()=>{
    mountAll();
    const apply=document.getElementById('applySel'); const reset=document.getElementById('resetLayout');
    if (apply) apply.addEventListener('click', ()=>{ applySelection(); });
    if (reset) reset.addEventListener('click', ()=>{ resetLayout(); });
  });

  window.obdUpdate=function(p){
    let seen=false; if(!p) return;
    const map={ gear:'gear', currentGear:'gear', rpm:'rpm', oil:'oil', coolant:'clt', trans:'trans', maf:'maf', MAF:'maf', massAirFlow:'maf', stft:'stft', stft1:'stft', 'stft_bank1':'stft', ltft:'ltft', ltft1:'ltft', 'ltft_bank1':'ltft', spark:'spark', timing:'spark', advance:'spark', kr:'kr', knock:'kr', knockRetard:'kr', tcc:'tcc', tccSlip:'tcc', linePressure:'linep', clutchPressure:'linep', pressure:'linep', voltage:'volt', volts:'volt', vbatt:'volt', batt:'volt' };
    for(const k in map){ const id=map[k]; const v=p[k]; if (v===undefined) continue; if (GAUGE_DEFS[id].mode==='text'){ if(GAUGES[id]){ setReadout(id, v, GAUGE_DEFS[id].unit||''); seen=true; } } else if (Number.isFinite(+v) && GAUGES[id]){ GAUGES[id].draw(+v); setReadout(id, +v, GAUGE_DEFS[id].unit||''); seen=true; } }
    if (seen){ const sb=statusBadge(); if(sb) sb.style.display='none'; }
  };
})();