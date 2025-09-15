
(function(){
  'use strict';
  function set(id,v){ const el=document.getElementById(id); if(el) el.textContent = (v==null?'—':v); }

  function renderMonitors(m){
    const root=document.getElementById('monitors'); if(!root) return;
    root.innerHTML='';
    const items = m || {};
    const keys = Object.keys(items);
    if (!keys.length){ root.innerHTML='<p style="opacity:.6">No data</p>'; return; }
    keys.forEach(k=>{
      const item=document.createElement('div'); item.className='item';
      const lab=document.createElement('div'); lab.className='label'; lab.textContent=k;
      const val=document.createElement('div'); val.className='val';
      const sev=(items[k]||'').toLowerCase();
      const badge=document.createElement('span'); badge.className='badge '+(sev==='ok'?'ok':(sev==='warn'?'warn':'err')); badge.textContent=(items[k]||'').toUpperCase();
      val.appendChild(badge); item.appendChild(lab); item.appendChild(val); root.appendChild(item);
    });
  }

  window.healthUpdate = function(p){
    set('vin', p?.vin); set('ecu', p?.ecu); set('calid', p?.calid); set('fw', p?.fw);
    renderMonitors(p?.monitors);
    set('hv_batt', p?.battery); set('hv_clt', p?.coolant); set('hv_oil', p?.oil); set('hv_trans', p?.trans);
    set('hv_dtc_s', p?.dtcCounts?.stored); set('hv_dtc_p', p?.dtcCounts?.pending); set('hv_dtc_perm', p?.dtcCounts?.permanent);
    set('hv_last', p?.lastScan);
    const sb=document.getElementById('statusBadge'); if(sb) sb.style.display='none';
  };
})();