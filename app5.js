/* ---------- reminder ✨ ---------- */
const TK=[['todo','To-do umum'],['po_tutup','PO tutup'],['bayar_vendor','Bayar vendor'],['produksi','Produksi'],['packing','Packing'],['cetak_resi','Cetak resi'],['pengiriman','Pengiriman'],['restock','Restock']];
PAGES.reminders=async()=>{
 const[td,pos]=await Promise.all([q(sb.from('todos').select('*').order('done').order('due_date',{ascending:true})),q(sb.from('pos').select('id,name'))]),pm=Object.fromEntries(pos.map(x=>[x.id,x.name]));
 return head('✨ Reminder & To-do','Deadline PO, produksi, packing, pembayaran vendor, pengiriman.')+`<button class="btn" onclick="A.todoForm()">＋ Tambah reminder</button><p class="smallmuted">Pengingat tampil saat aplikasi dibuka. Notifikasi saat aplikasi tertutup belum aktif.</p>`+
 (td.map(t=>`<div class="row" onclick="A.todoForm('${t.id}')" style="${t.done?'opacity:.55':''}"><span class="iconbox">${t.done?'✓':'✨'}</span><div><b>${esc(t.title)}</b><div class="desc">${t.due_date||'Tanpa tanggal'} · ${(TK.find(k=>k[0]===t.kind)||[])[1]||''}${t.po_id?' · '+esc(pm[t.po_id]||''):''}</div></div><button class="pill tail" onclick="event.stopPropagation();A.todoDone('${t.id}',${!t.done})">${t.done?'Buka lagi':'Selesai'}</button></div>`).join('')||'<div class="card empty">Belum ada pengingat.</div>')};
A.todoDone=async(id,v)=>{await upd('todos',id,{done:v});render()};
A.todoForm=async id=>{const[t,pos]=await Promise.all([id?q(sb.from('todos').select('*').eq('id',id).single()):null,q(sb.from('pos').select('id,name'))]);
 sheet(t?'Ubah reminder':'Tambah reminder',[{k:'title',l:'Judul',v:t?.title,req:1},{k:'due_date',l:'Tanggal deadline',t:'date',v:t?.due_date},{k:'kind',l:'Jenis',t:'select',o:TK,v:t?.kind||'todo'},{k:'po_id',l:'Batch PO (opsional)',t:'select',o:[['','(Umum)'],...pos.map(p=>[p.id,p.name])],v:t?.po_id||''},{k:'notes',l:'Catatan',t:'area',v:t?.notes}],
  v=>t?upd('todos',id,v):ins('todos',v),t?()=>del('todos',id):null)};

/* ---------- modul tahap berikutnya & kalkulator ---------- */
PAGES.inventory=async()=>stage('Stok & Pembelian','Perlengkapan, freebies, dan bahan packing.','D','Tambah item, restock, pemakaian per PO, dan peringatan stok menipis.');
PAGES.vendors=async()=>stage('Vendor & Sample','Data vendor, harga, MOQ, waktu produksi, dan sample.','F','Catat vendor, sample, approval, dan bandingkan vendor.');
PAGES.calculator=async()=>{A.after=()=>A.calcAdd();return head('Kalkulator & Template','Hitung item × qty × harga satuan.')+`<div class="card"><div id="calcrows"></div><button class="btn soft sm" onclick="A.calcAdd()">＋ Tambah baris</button><div class="sect"><h3>Total kalkulasi</h3><strong id="calctotal">Rp0</strong></div></div>
 <div class="card"><h3>Kalkulator margin</h3><div class="grid"><div class="field"><label>Harga jual</label><input id="m1" type="number" oninput="A.margin()"></div><div class="field"><label>Modal</label><input id="m2" type="number" oninput="A.margin()"></div><div class="field"><label>Packing + freebies</label><input id="m3" type="number" oninput="A.margin()"></div><div class="field"><label>Target terjual (pcs)</label><input id="m4" type="number" oninput="A.margin()"></div></div><div id="mres" class="desc">Isi angka di atas.</div></div>
 <p class="smallmuted">Menyimpan template nota/freebies/packing dan menautkan total ke PO dibangun di Tahap C.</p>`};
A.calcAdd=()=>{const d=document.createElement('div');d.className='grid';d.innerHTML=`<div class="field"><label>Item</label><input placeholder="Nama barang"></div><div class="grid"><div class="field"><label>Qty</label><input class="cq" type="number" value="1" oninput="A.calcTotal()"></div><div class="field"><label>Harga satuan</label><input class="cp" type="number" value="0" oninput="A.calcTotal()"></div></div><button class="pill" onclick="this.parentNode.remove();A.calcTotal()">Hapus baris</button>`;$('#calcrows').appendChild(d);A.calcTotal()};
A.calcTotal=()=>{const q=[...document.querySelectorAll('.cq')],p=[...document.querySelectorAll('.cp')];$('#calctotal').textContent=rp(q.reduce((a,x,i)=>a+(+x.value||0)*(+p[i].value||0),0))};
A.margin=()=>{const j=+$('#m1').value||0,m=+$('#m2').value||0,p=+$('#m3').value||0,t=+$('#m4').value||0,l=j-m-p;$('#mres').innerHTML=`Laba per pcs: <b>${rp(l)}</b> · Margin: <b>${j?(l/j*100).toFixed(1):0}%</b>${t?`<br>Estimasi laba untuk ${t} pcs: <b>${rp(l*t)}</b>`:''}`};

/* ---------- aktivitas, backup, pengaturan, lainnya ---------- */
PAGES.activity=async()=>{const lg=await q(sb.from('activity_log').select('*').order('created_at',{ascending:false}).limit(50));
 return head('Aktivitas Terakhir','Jejak pekerjaan dan perubahan.')+(lg.map(l=>`<div class="row" style="cursor:default"><span class="iconbox">◷</span><div><b>${esc(l.action)} ${esc(l.entity)}</b><div class="desc">${esc(l.summary)}<br>${new Date(l.created_at).toLocaleString('id-ID')}</div></div></div>`).join('')||'<div class="card empty">Belum ada aktivitas.</div>')};
const TABLES=['folders','vendors','vendor_offers','samples','pos','products','orders','order_items','payments','expenses','price_history','wishlist','templates','template_items','po_cost_lines','stock_items','stock_movements','quick_actions','todos','activity_log','settings'];
PAGES.backup=async()=>{const lb=+localStorage.getItem('cs_lastbackup')||0;
 return head('Backup & Export','Backup, restore, dan export laporan.')+`<div class="card"><h3>Backup data</h3><p class="smallmuted">Data tersimpan di Supabase. Unduh backup manual secara berkala sebagai cadangan. Terakhir: ${lb?new Date(lb).toLocaleString('id-ID'):'belum pernah'}.</p><button class="btn" onclick="A.backup()">⬇ Backup sekarang</button>
 <div class="sect"><h3>Export & Restore</h3></div><div class="quick"><button onclick="go('reports')"><span class="icon">▥</span>Laporan CSV</button><button onclick="toast('Restore dibangun di Tahap G')"><span class="icon">↓</span>Restore</button></div><p class="smallmuted">Restore dari file backup (dengan preview dan konfirmasi) serta export PDF/Excel dibangun di Tahap G.</p></div>`};
A.backup=async()=>{toast('Menyiapkan backup…');const out={app:'customstuff',version:1,exported_at:new Date().toISOString(),tables:{}};
 for(const t of TABLES){let all=[],i=0;for(;;){const d=await q(sb.from(t).select('*').range(i,i+999));all=all.concat(d);if(d.length<1000)break;i+=1000}out.tables[t]=all}
 dl('backup-customstuff-'+today()+'.json',JSON.stringify(out),'application/json');localStorage.setItem('cs_lastbackup',Date.now());toast('Backup selesai');render()};
PAGES.settings=async()=>head('Pengaturan','Atur tampilan dan shortcut aplikasi.')+`<div class="card"><div class="field"><label>Nama bisnis</label><input id="sbiz" value="${esc(ls('cs_biz','Customstuff'))}"></div><div class="field"><label>Nama sapaan dashboard</label><input id="snm" value="${esc(ls('cs_name','Customstuff'))}"></div><button class="btn" onclick="localStorage.setItem('cs_biz',$('#sbiz').value);localStorage.setItem('cs_name',$('#snm').value);toast('Pengaturan tersimpan')">Simpan pengaturan</button>
 <div class="sect"><h3>Quick Add</h3></div><p class="smallmuted">Tombol Quick Add yang bisa kamu tambah, hapus, dan atur (nama, ikon, warna, urutan, aksi) dibangun di Tahap E. Sekarang tersedia 3 tombol awal.</p>
 <div class="sect"><h3>Akun & koneksi</h3></div><p class="smallmuted">${esc(session.user.email)}</p><div class="actions"><button class="btn light" onclick="sb.auth.signOut()">Keluar</button><button class="btn light" onclick="A.reset()">Ubah setup Supabase</button></div></div>`;
PAGES.more=async()=>head('Lainnya','Buka modul tambahan Customstuff Recap.')+MENU.slice(4).map(([id,ic,l])=>`<div class="row" onclick="go('${id}')"><span class="iconbox">${ic}</span><div><b>${l}</b><div class="desc">Buka modul</div></div><span class="tail">›</span></div>`).join('');

/* ---------- boot ---------- */
async function boot(){
 const c=JSON.parse(localStorage.getItem(CFG)||'null');
 if(!c){sb=null;return render()}
 $('#main').innerHTML='<div class="empty">Menghubungkan…</div>';
 const ok=await window.libReady;
 if(!ok){$('#main').innerHTML='<div class="card empty err">Gagal memuat pustaka Supabase. Cek koneksi, coba lewat Chrome, lalu muat ulang.</div>';return}
 if(!sb){sb=supabase.createClient(c.url,c.key);sb.auth.onAuthStateChange((_e,s)=>{const was=!!session;session=s;if(was!==!!s)render()})}
 const{data}=await sb.auth.getSession();session=data.session;
 history.replaceState({r:1},'','#home');render()}
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
boot();
