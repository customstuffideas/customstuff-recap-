/* ---------- Tahap H (2/5): tombol arsip, progres, estimasi laba di halaman batch dan Beranda ---------- */
const _pd3=PAGES.podetail;
PAGES.podetail=async()=>{const h=await _pd3();if(!S.po)return h;
 const[p,fin]=await Promise.all([q(sb.from('pos').select('*').eq('id',S.po).single()),q(sb.from('v_po_finance').select('*').eq('po_id',S.po).single())]);
 let o=h.replace('<p class="smallmuted">Status berlaku untuk seluruh batch, bukan per customer.</p>',()=>progBar(p)+'<p class="smallmuted">Status berlaku untuk seluruh batch, bukan per customer.</p>'+(p.archived?'<p><span class="status">Batch ini diarsipkan</span></p>':''));
 if(S.tab!=='ringkasan')return o;
 const sold=+fin.qty_sold,tg=+p.target_qty||0,per=sold>0?fin.laba_bersih/sold:null;
 o=o.replace('<button class="btn light sm" onclick="A.poEdit()">✎ Ubah / hapus batch</button>',()=>'<button class="btn light sm" onclick="A.poEdit()">✎ Ubah / hapus batch</button> <button class="btn light sm" onclick="A.poArc(\''+S.po+'\','+(!p.archived)+')">'+(p.archived?'Pulihkan dari arsip':'Arsipkan batch')+'</button>');
 return o+(tg&&per!==null?`<div class="card"><h3>Estimasi laba</h3><div class="desc">Rata-rata laba per pcs terjual: <b>${rp(per)}</b> · target ${tg} pcs (${Math.min(100,Math.round(sold/tg*100))}% tercapai)</div><div class="stat green" style="margin-top:8px"><div class="label">Estimasi laba bila target tercapai</div><strong>${rp(per*tg)}</strong></div><p class="smallmuted">Perkiraan kasar: rata-rata laba per pcs dikali target. Biaya yang belum tercatat bisa mengubahnya.</p></div>`:`<div class="card"><h3>Estimasi laba</h3><p class="smallmuted">${tg?'Belum ada order terjual, jadi belum bisa dihitung.':'Isi target jumlah terjual lewat Ubah batch untuk melihat estimasi.'}</p></div>`)};
const _home4=PAGES.home;
PAGES.home=async()=>{let h=await _home4();
 const ids=[...h.matchAll(/A\.openPO\('([0-9a-f-]{36})'\)/g)].map(m=>m[1]);if(!ids.length)return h;
 const ps=await q(sb.from('pos').select('*').in('id',ids));
 ps.forEach(p=>{const st='<div class="row" onclick="A\\.openPO\\(\''+p.id+'\'\\)">';
  h=p.archived?h.replace(new RegExp(st+'[\\s\\S]*?<span class="tail">›</span></div>'),''):h.replace(new RegExp('('+st+'[\\s\\S]*?</div>)(</div><span class="tail">›</span></div>)'),(m,a,b)=>a+progBar(p)+b)});
 return h};
