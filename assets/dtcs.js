
(function(){
  'use strict';
  function row(code,desc,sev){ const b = `<span class="badge ${sev||'ok'}">${(sev||'OK').toUpperCase()}</span>`; return `<div class="row"><div>${code||'—'}</div><div>${desc||'—'}</div><div style="display:flex;justify-content:flex-end">${b}</div></div>`; }
  function renderList(el, list){ el.innerHTML = (!list||!list.length) ? `<p style="opacity:.6">None</p>` : list.map(it=>row(it.code,it.desc,it.sev)).join(""); }
  window.dtcUpdate = function(payload){
    renderList(document.getElementById('dtc_stored'),   payload?.stored);
    renderList(document.getElementById('dtc_pending'),  payload?.pending);
    renderList(document.getElementById('dtc_perm'),     payload?.permanent);
    const sb=document.getElementById('statusBadge'); if(sb) sb.style.display='none';
  };
  document.addEventListener('DOMContentLoaded', ()=>{
    const btn=document.getElementById('btnClear'); if(btn){ btn.addEventListener('click', ()=> alert('Clear DTCs requires backend command.')); }
  });
})();