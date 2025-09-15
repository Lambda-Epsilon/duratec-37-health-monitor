
(function(){
  'use strict';
  function set(id,v){ const el=document.getElementById(id); if(el) el.textContent=(v==null?'—':v); }
  window.tripUpdate = function(p){
    set('tr_time',   p?.duration);
    set('tr_dist',   p?.distance);
    set('tr_avgspd', p?.avgSpeed);
    set('tr_maxspd', p?.maxSpeed);
    set('tr_fuel',   p?.fuelUsed);
    set('tr_mpg',    p?.mpg);
    set('tr_maxrpm', p?.maxRpm);
    set('tr_idle',   p?.idleTime);
    const sb=document.getElementById('statusBadge'); if(sb) sb.style.display='none';
  };
  document.addEventListener('DOMContentLoaded', ()=>{
    const btn=document.getElementById('btnResetTrip');
    if (btn){ btn.addEventListener('click', ()=> alert('Reset Trip: wire backend or persist in storage.')); }
  });
})();