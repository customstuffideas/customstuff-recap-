/* ---------- pengeluaran ---------- */
const CT=[['produksi','Produksi'],['packing','Packing'],['freebies','Freebies'],['sample','Sample'],['ongkir','Ongkir'],['lain','Lain-lain']];
const expRow=e=>`<div class="item tap" onclick="A.expForm('${e.id}')"><span>${esc(e.item_name)} ×${e.qty}<br><span class="mut">${e.spent_at} · ${e.cost_type}${e.vendor_name?' · '+esc(e.vendor_name):''}${e.is_stock_purchase?' · stok':''}</span></span><span>${rp(e.total)}</span></div>`;
PAGES.exp=async()=>{
 let qy=sb.from('expenses').select('*').order('spent_at',{ascending:false}).limit(200);if(S.onlyUn)qy=qy.is('po_id',null).eq('is_stock_purchase',false);
 const ex=await q(qy);
 return`<h1>Pengeluaran</h1><div class="row" style="margin-bottom:10px"><button class="btn sm" onclick="A.expForm()">+ Pengeluaran</button><button class="btn sm ghost" onclick="go('exp',{onlyUn:${!S.onlyUn}})">${S.onlyUn?'✓ Belum dialokasikan':'Filter: belum dialokasikan'}</button></div>
 <p class="mut">Total tampil: ${rp(sum(ex,'total'))}. Ketuk baris untuk ubah atau tautkan ke PO.</p>${ex.map(expRow).join('')||'<p class="mut">Belum ada data.</p>'}`};
A.expForm=async(id,poId)=>{const[e,pos]=await Promise.all([id?q(sb.from('expenses').select('*').eq('id',id).single()):null,q(sb.from('pos').select('id,name').order('po_date',{ascending:false}))]);
 sheet(e?'Ubah pengeluaran':'Pengeluaran baru',[{k:'spent_at',l:'Tanggal',t:'date',v:e?.spent_at||today(),req:1},{k:'item_name',l:'Nama barang/biaya',v:e?.item_name,req:1},{k:'qty',l:'Jumlah',t:'number',v:e?.qty??1,req:1},{k:'unit_price',l:'Harga satuan',t:'number',v:e?.unit_price,z:1},
  {k:'cost_type',l:'Jenis biaya',t:'select',o:CT,v:e?.cost_type||'lain'},{k:'po_id',l:'Tautkan ke PO',t:'select',o:[['','(Belum dialokasikan)'],...pos.map(p=>[p.id,p.name])],v:e?.po_id??poId??''},
  {k:'vendor_name',l:'Vendor / toko',v:e?.vendor_name},{k:'payment_method',l:'Metode bayar',v:e?.payment_method},{k:'is_stock_purchase',l:'Ini pembelian stok (jadi beban saat stok dipakai)',t:'check',v:e?.is_stock_purchase},{k:'notes',l:'Catatan',t:'area',v:e?.notes}],
  async v=>{v.category=v.cost_type;if(e){await upd('expenses',id,v)}else{const r=await ins('expenses',v);log('buat','pengeluaran',r.id,v.item_name);
   await sb.from('price_history').insert({item_name:v.item_name,unit_price:v.unit_price,vendor_name:v.vendor_name,recorded_at:v.spent_at,expense_id:r.id})}},
  e?async()=>{await del('expenses',id);log('hapus','pengeluaran',id,e.item_name)}:null)};

/* ---------- laporan ---------- */
const dl=(n,t,m)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:m}));a.download=n;a.click()};
PAGES.rep=async()=>{
 let fin=await q(sb.from('v_po_finance').select('*').order('po_date',{ascending:false}));
 fin=fin.filter(x=>(!S.from||x.po_date>=S.from)&&(!S.to||x.po_date<=S.to));S.rows=fin;
 const lines=a=>`<div class="grid"><div class="met">Omzet<b>${rp(sum(a,'omzet'))}</b></div><div class="met">Biaya<b>${rp(sum(a,'total_biaya'))}</b></div></div><div class="met" style="margin-top:8px">Laba<b class="${sum(a,'laba_bersih')<0?'neg':'pos'}">${rp(sum(a,'laba_bersih'))}</b></div>`;
 return`<h1>Laporan</h1><div class="grid"><label>Dari<input type="date" value="${S.from}" onchange="S.from=this.value;render()"></label><label>Sampai<input type="date" value="${S.to}" onchange="S.to=this.value;render()"></label></div>
 ${lines(fin)}<button class="btn sm ghost" style="margin-top:8px" onclick="A.csv()">⬇ Ekspor CSV</button>
 <h2>Per folder</h2>${F.map(f=>{const a=fin.filter(x=>desc(f.id).includes(x.folder_id));return`<div class="item"><span>📁 ${esc(fpath(f.id))}<br><span class="mut">${a.length} PO · omzet ${rp(sum(a,'omzet'))}</span></span><b class="${sum(a,'laba_bersih')<0?'neg':'pos'}">${rp(sum(a,'laba_bersih'))}</b></div>`}).join('')||'<p class="mut">Belum ada folder.</p>'}
 <h2>Per PO</h2>${fin.map(x=>`<div class="item tap" onclick="go('poDetail',{po:'${x.po_id}',tab:'ringkasan'})"><span>${esc(x.name)}<br><span class="mut">${x.po_date} · omzet ${rp(x.omzet)}</span></span><b class="${x.laba_bersih<0?'neg':'pos'}">${rp(x.laba_bersih)}</b></div>`).join('')||'<p class="mut">Tidak ada PO pada rentang ini.</p>'}`};
A.csv=()=>{const h=['PO','Tanggal','Order','Qty','Omzet','Modal produksi','Packing','Freebies','Biaya lain','Total biaya','Laba'];
 const r=S.rows.map(x=>[x.name,x.po_date,x.order_count,x.qty_sold,x.omzet,x.modal_produksi,x.biaya_packing,x.biaya_freebies,x.biaya_lain,x.total_biaya,x.laba_bersih]);
 dl('laporan-customstuff.csv',[h,...r].map(l=>l.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n'),'text/csv')};

/* ---------- lainnya: backup, aktivitas, akun ---------- */
const TABLES=['folders','vendors','vendor_offers','samples','pos','products','orders','order_items','payments','expenses','price_history','wishlist','templates','template_items','po_cost_lines','stock_items','stock_movements','quick_actions','todos','activity_log','settings'];
PAGES.more=async()=>{
 const lg=await q(sb.from('activity_log').select('*').order('created_at',{ascending:false}).limit(25));const lb=+localStorage.getItem('cs_lastbackup')||0;
 return`<h1>Lainnya</h1><div class="card"><b>Backup data</b><p class="mut">Terakhir: ${lb?new Date(lb).toLocaleString('id-ID'):'belum pernah'}. Unduh rutin sebagai cadangan.</p><button class="btn" onclick="A.backup()">⬇ Unduh backup JSON</button></div>
 <div class="card"><b>Akun</b><p class="mut">${esc(session.user.email)}</p><button class="btn ghost" onclick="sb.auth.signOut()">Keluar</button></div>
 <h2>Aktivitas terakhir</h2>${lg.map(l=>`<div class="item"><span>${esc(l.action)} ${esc(l.entity)}: ${esc(l.summary)}</span><span class="mut">${new Date(l.created_at).toLocaleDateString('id-ID')}</span></div>`).join('')||'<p class="mut">Belum ada.</p>'}
 <p class="mut">Segera hadir: stok, template, vendor, rekonsiliasi, pengingat, tombol cepat, restore backup.</p>`};
A.backup=async()=>{toast('Menyiapkan backup…');const out={app:'customstuff',version:1,exported_at:new Date().toISOString(),tables:{}};
 for(const t of TABLES){let all=[],i=0;for(;;){const d=await q(sb.from(t).select('*').range(i,i+999));all=all.concat(d);if(d.length<1000)break;i+=1000}out.tables[t]=all}
 dl('backup-customstuff-'+today()+'.json',JSON.stringify(out),'application/json');localStorage.setItem('cs_lastbackup',Date.now());toast('Backup selesai');render()};

/* ---------- boot ---------- */
async function boot(){
 const c=JSON.parse(localStorage.getItem(CFG)||'null');
 if(!c){sb=null;return render()}
 $('#main').innerHTML='<p style="padding:14px">Menghubungkan…</p>';
 const ok=await window.libReady;
 if(!ok){$('#main').innerHTML='<div class="card err">Gagal memuat pustaka Supabase. Cek koneksi, coba buka lewat Chrome, lalu muat ulang.</div>';return}
 if(!sb){sb=supabase.createClient(c.url,c.key);
  sb.auth.onAuthStateChange((_e,s)=>{const was=!!session;session=s;if(was!==!!s)render()})}
 const{data}=await sb.auth.getSession();session=data.session;
 render()}
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
boot();
