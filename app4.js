/* ---------- data orderan ---------- */
PAGES.orders=async()=>{
 const[os,od,pos]=await Promise.all([q(sb.from('v_order_summary').select('*').order('order_date',{ascending:false})),q(sb.from('orders').select('id,cust_no,city')),q(sb.from('pos').select('id,name'))]);
 const dm=Object.fromEntries(od.map(x=>[x.id,x])),pm=Object.fromEntries(pos.map(x=>[x.id,x.name])),k=S.q.toLowerCase();
 const rows=os.filter(o=>(!S.fp||o.payment_status===S.fp)&&(!k||[o.order_no,o.buyer,pm[o.po_id],(dm[o.order_id]||{}).cust_no].join(' ').toLowerCase().includes(k)));
 return head('Data Orderan','Order tersimpan per folder dan per batch PO.')+`<button class="btn" onclick="go('addorder')">＋ Tambah order</button>
 <div class="grid" style="margin-top:10px"><div class="field"><label>Cari (no. order, buyer, PO, No. Cust)</label><input value="${esc(S.q)}" onchange="S.q=this.value;render()"></div><div class="field"><label>Status pembayaran</label><select onchange="S.fp=this.value;render()">${[['','Semua'],['belum','Belum lunas'],['sebagian','DP'],['lunas','Lunas']].map(o=>`<option value="${o[0]}"${S.fp===o[0]?' selected':''}>${o[1]}</option>`).join('')}</select></div></div>
 <div class="sect"><h3>Order tercatat</h3><span class="pill">${rows.length}</span></div>`+
 (rows.map(o=>{const d=dm[o.order_id]||{};return`<div class="row" onclick="go('order',{order:'${o.order_id}',po:'${o.po_id}'})"><span class="iconbox">${esc((o.buyer||'C')[0].toUpperCase())}</span><div><b>${esc(o.buyer)}</b><div class="desc">Cust ${esc(d.cust_no||'—')} · ${esc(d.city||'Kota belum diisi')}<br>${esc(pm[o.po_id]||'')} · ${esc(o.order_no)} · ${payChip(o.payment_status)}</div></div><strong class="tail">${rp(o.total)}</strong></div>`}).join('')||`<div class="card empty">Belum ada order yang cocok. Tambahkan dari batch PO agar masuk ke batch yang benar.</div>`)};

/* ---------- biaya & pengeluaran ---------- */
const CT=[['produksi','Produksi'],['packing','Packing'],['freebies','Freebies'],['sample','Sample'],['ongkir','Ongkir'],['lain','Lain-lain']];
const expRow=e=>`<div class="row" onclick="A.expForm('${e.id}')"><span class="iconbox">◈</span><div><b>${esc(e.item_name)} ×${e.qty}</b><div class="desc">${e.spent_at} · ${e.cost_type}${e.vendor_name?' · '+esc(e.vendor_name):''}${e.is_stock_purchase?' · stok':''}</div></div><strong class="tail">${rp(e.total)}</strong></div>`;
PAGES.expenses=async()=>{
 let qy=sb.from('expenses').select('*').order('spent_at',{ascending:false}).limit(200);if(S.onlyUn)qy=qy.is('po_id',null).eq('is_stock_purchase',false);
 const ex=await q(qy);
 return head('Biaya & Pengeluaran','Catat biaya PO, packing, freebies, restock, dan lain-lain.')+`<div class="actions" style="margin:0 0 10px"><button class="btn" onclick="A.expForm()">＋ Tambah biaya</button><button class="btn light" onclick="go('expenses',{onlyUn:${!S.onlyUn}},false)">${S.onlyUn?'✓ Belum dialokasikan':'Filter belum dialokasikan'}</button></div><p class="smallmuted">Total tampil: ${rp(sum(ex,'total'))}. Ketuk baris untuk ubah atau tautkan ke PO.</p>`+(ex.map(expRow).join('')||'<div class="card empty">Belum ada pengeluaran.</div>')};
A.expForm=async(id,poId)=>{const[e,pos]=await Promise.all([id?q(sb.from('expenses').select('*').eq('id',id).single()):null,q(sb.from('pos').select('id,name').order('created_at',{ascending:false}))]);
 sheet(e?'Ubah pengeluaran':'Tambah biaya',[{k:'item_name',l:'Nama item',v:e?.item_name,req:1},{k:'cost_type',l:'Kategori',t:'select',o:CT,v:e?.cost_type||'lain'},{k:'qty',l:'Qty',t:'number',v:e?.qty??1,req:1},{k:'unit_price',l:'Harga satuan',t:'number',v:e?.unit_price,z:1},{k:'spent_at',l:'Tanggal',t:'date',v:e?.spent_at||today(),req:1},
  {k:'po_id',l:'Tautkan ke batch PO',t:'select',o:[['','(Belum dialokasikan)'],...pos.map(p=>[p.id,p.name])],v:e?.po_id??poId??S.po??''},{k:'vendor_name',l:'Vendor / toko',v:e?.vendor_name},{k:'payment_method',l:'Metode bayar',v:e?.payment_method},
  {k:'is_stock_purchase',l:'Pembelian stok (jadi beban saat stok dipakai)',t:'check',v:e?.is_stock_purchase},{k:'notes',l:'Catatan',t:'area',v:e?.notes}],
  async v=>{v.category=v.cost_type;if(e){await upd('expenses',id,v)}else{const r=await ins('expenses',v);log('buat','pengeluaran',r.id,v.item_name);
   await sb.from('price_history').insert({item_name:v.item_name,unit_price:v.unit_price,vendor_name:v.vendor_name,recorded_at:v.spent_at,expense_id:r.id})}},
  e?async()=>{await del('expenses',id);log('hapus','pengeluaran',id,e.item_name)}:null)};

/* ---------- laporan ---------- */
const dl=(n,t,m)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:m}));a.download=n;a.click()};
PAGES.reports=async()=>{
 let fin=await q(sb.from('v_po_finance').select('*').order('po_date',{ascending:false}));
 fin=fin.filter(x=>(!S.from||x.po_date>=S.from)&&(!S.to||x.po_date<=S.to));S.rows=fin;
 const lb=sum(fin,'laba_bersih');
 return head('Laporan Keuangan','Rekap otomatis dari order dan biaya yang ditautkan.')+`<div class="grid"><div class="field"><label>Dari tanggal PO</label><input type="date" value="${S.from}" onchange="S.from=this.value;render()"></div><div class="field"><label>Sampai</label><input type="date" value="${S.to}" onchange="S.to=this.value;render()"></div></div>
 <div class="grid"><div class="stat pink"><div class="label">Omzet</div><strong>${rp(sum(fin,'omzet'))}</strong></div><div class="stat blue"><div class="label">Biaya</div><strong>${rp(sum(fin,'total_biaya'))}</strong></div><div class="stat green"><div class="label">Laba</div><strong>${rp(lb)}</strong></div><div class="stat yellow"><div class="label">Order</div><strong>${sum(fin,'order_count')}</strong></div></div>
 <button class="btn light sm" style="margin-top:10px" onclick="A.csv()">⬇ Ekspor CSV</button>
 <div class="card"><h3>Per folder</h3>${F.map(f=>{const a=fin.filter(x=>desc(f.id).includes(x.folder_id));return`<div class="row" style="cursor:default"><span class="iconbox">▱</span><div><b>${esc(fpath(f.id))}</b><div class="desc">${a.length} PO · omzet ${rp(sum(a,'omzet'))}</div></div><strong class="tail">${rp(sum(a,'laba_bersih'))}</strong></div>`}).join('')||'<p class="smallmuted">Belum ada folder.</p>'}</div>
 <div class="card"><h3>Per batch PO</h3>${fin.map(x=>`<div class="row" onclick="A.openPO('${x.po_id}')"><span class="iconbox">□</span><div><b>${esc(x.name)}</b><div class="desc">${x.po_date} · omzet ${rp(x.omzet)}</div></div><strong class="tail">${rp(x.laba_bersih)}</strong></div>`).join('')||'<p class="smallmuted">Tidak ada PO pada rentang ini.</p>'}</div>
 <p class="smallmuted">Laba = omzet dikurangi modal & biaya yang ditautkan ke PO. Pengeluaran yang belum dialokasikan tidak ikut dihitung. Laporan harian/bulanan dan grafik menyusul.</p>`};
A.csv=()=>{const h=['PO','Tanggal','Order','Qty','Omzet','Modal produksi','Packing','Freebies','Biaya lain','Total biaya','Laba'];
 const r=S.rows.map(x=>[x.name,x.po_date,x.order_count,x.qty_sold,x.omzet,x.modal_produksi,x.biaya_packing,x.biaya_freebies,x.biaya_lain,x.total_biaya,x.laba_bersih]);
 dl('laporan-customstuff.csv',[h,...r].map(l=>l.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n'),'text/csv')};
