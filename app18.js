/* ---------- Tahap G (2/2) A: restore backup dengan preview dan konfirmasi ---------- */
const GEN={expenses:['total'],po_cost_lines:['subtotal'],stock_movements:['total_cost']};
let RS=null;
const _bk=PAGES.backup;
PAGES.backup=async()=>{const h=await _bk();
 return h.replace("toast('Restore dibangun di Tahap G')",()=>"$('#rsfile').click()").replace(/<p class="smallmuted">Restore dari file backup[^<]*<\/p>/,()=>'<p class="smallmuted">Restore: pilih file backup .json, lihat ringkasannya, lalu konfirmasi. Data digabungkan ke data yang sudah ada dan tidak ada yang dihapus. Export Excel dan PDF ada di halaman Laporan.</p>')+'<input id="rsfile" type="file" accept=".json,application/json" style="display:none" onchange="A.rsFile(this)"><div id="rspv"></div>'};
A.rsFile=async inp=>{const f=inp.files[0];inp.value='';if(!f)return;let d;
 try{d=JSON.parse(await f.text())}catch(e){return toast('File bukan backup yang valid (bukan JSON).')}
 if(!d||d.app!=='customstuff'||typeof d.tables!=='object'||!d.tables)return toast('File ini bukan backup Customstuff Recap.');
 RS=d;const ns=TABLES.filter(t=>Array.isArray(d.tables[t])&&d.tables[t].length),tot=ns.reduce((a,t)=>a+d.tables[t].length,0);
 $('#rspv').innerHTML=`<div class="card"><h3>Pratinjau restore</h3><p class="smallmuted">Backup dibuat ${d.exported_at?new Date(d.exported_at).toLocaleString('id-ID'):'(tanggal tidak diketahui)'}. Berisi ${tot} baris dari ${ns.length} tabel.</p>${ns.map(t=>`<div class="row" style="cursor:default"><b>${t}</b><strong class="tail">${d.tables[t].length}</strong></div>`).join('')||'<p class="smallmuted">File ini kosong.</p>'}${tot?`<p class="smallmuted">Baris yang sudah ada diperbarui sesuai file, baris baru ditambahkan, dan tidak ada yang dihapus.</p><div class="actions"><button class="btn light" onclick="$('#rspv').innerHTML='';RS=null">Batal</button><button class="btn" onclick="A.rsRun()">Pulihkan sekarang</button></div>`:''}</div>`;
 $('#rspv').scrollIntoView({behavior:'smooth'})};
A.rsRun=async()=>{if(!RS||!confirm('Pulihkan data dari backup ini? Data digabungkan dan tidak ada yang dihapus, tapi baris dengan ID yang sama akan diperbarui sesuai file.'))return;
 const uid=session.user.id;let n=0;
 try{for(const t of TABLES){const rows=RS.tables[t];if(!Array.isArray(rows)||!rows.length)continue;
   const clean=rows.map(r=>{const o={...r,owner_id:uid};(GEN[t]||[]).forEach(c=>delete o[c]);return o});
   for(let i=0;i<clean.length;i+=200){await q(sb.from(t).upsert(clean.slice(i,i+200),{onConflict:t==='settings'?'owner_id,key':'id'}));n+=Math.min(200,clean.length-i)}
   toast('Memulihkan '+t+'…')}
  log('restore','backup',null,'Memulihkan '+n+' baris');toast('Restore selesai: '+n+' baris');RS=null;render()}
 catch(e){toast('Restore berhenti di tengah jalan: '+(e.message||e)+'. Sebagian data mungkin sudah masuk.')}};
