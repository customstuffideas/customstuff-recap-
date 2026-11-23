/* ---------- folder & PO ---------- */
A.openPO=id=>go('podetail',{po:id,tab:'customer'});
PAGES.folders=async()=>{
 const[pos,ords]=await Promise.all([q(sb.from('pos').select('*').order('created_at',{ascending:false})),q(sb.from('orders').select('id,po_id'))]);
 const cur=S.folder,par=cur?F.find(f=>f.id===cur):null,subs=F.filter(f=>(f.parent_id||null)===cur),list=pos.filter(p=>(p.folder_id||null)===cur);
 let h=head('Folder & PO','Folder bebas, batch PO, dan customer tersimpan di dalam batch yang dipilih.')+`<div class="quick"><button onclick="A.folderForm()">＋ Folder</button><button onclick="A.poForm()">＋ PO baru</button></div>`;
 if(par)h+=`<div class="card"><button class="btn light sm" onclick="go('folders',{folder:${par.parent_id?`'${par.parent_id}'`:'null'}})">← Folder induk</button> <button class="btn soft sm" onclick="A.folderForm('${par.id}')">✎ Ubah / pindah / hapus</button><h3 style="margin-top:12px">${esc(par.name)}</h3><div class="desc">${esc(fpath(cur))}<br>Folder ini berisi subfolder dan PO batch.</div></div>`;
 if(subs.length)h+=`<div class="sect"><h3>Subfolder</h3></div>`+subs.map(f=>`<div class="folder"><span class="foldermark">▱</span><div><b>${esc(f.name)}</b><div class="desc">${F.filter(x=>x.parent_id===f.id).length} subfolder · ${pos.filter(p=>p.folder_id===f.id).length} batch PO</div></div><button class="btn soft sm" onclick="go('folders',{folder:'${f.id}'})">Buka</button></div>`).join('');
 if(list.length)h+=`<div class="sect"><h3>Batch PO di folder ini</h3></div>`+list.map(p=>`<div class="card"><b>${esc(p.name)}</b><div class="desc">${ords.filter(o=>o.po_id===p.id).length} customer · ${p.po_date}</div><p>${stChip(p)}</p><button class="btn soft sm" onclick="A.openPO('${p.id}')">Buka batch</button></div>`).join('');
 if(!subs.length&&!list.length)h+=`<div class="card empty">Folder ini belum punya subfolder atau batch PO. Tambahkan lewat tombol di atas.</div>`;
 return h};
A.folderForm=id=>{const f=id?F.find(x=>x.id===id):null,bad=f?desc(f.id):[];
 const fl=[{k:'name',l:'Nama folder',v:f?.name,req:1}];
 if(f)fl.push({k:'parent_id',l:'Pindahkan ke folder induk',t:'select',o:[['','(Paling atas)'],...F.filter(x=>!bad.includes(x.id)).map(x=>[x.id,fpath(x.id)])],v:f.parent_id||''});
 sheet(f?'Ubah folder':'Folder baru',fl,async v=>{if(f){await upd('folders',f.id,{name:v.name,parent_id:v.parent_id})}else{const r=await ins('folders',{name:v.name,parent_id:S.folder});log('buat','folder',r.id,v.name)}},
  f?async()=>{await del('folders',f.id);S.folder=f.parent_id}:null)};
const poFields=p=>[{k:'name',l:'Nama batch (PO)',v:p?.name,req:1},{k:'folder_id',l:'Masuk folder',t:'select',o:fopts(),v:p?.folder_id??S.folder??''},{k:'po_date',l:'Tanggal PO',t:'date',v:p?.po_date||today(),req:1},{k:'close_date',l:'Tanggal tutup PO',t:'date',v:p?.close_date},{k:'target_qty',l:'Target jumlah terjual',t:'number',v:p?.target_qty},{k:'notes',l:'Catatan',t:'area',v:p?.notes}];
A.poForm=()=>sheet('Batch PO baru',poFields(),async v=>{const r=await ins('pos',v);log('buat','po',r.id,v.name);S.po=r.id;S.folder=v.folder_id;S.page='podetail';S.tab='customer';toast('Batch PO tersimpan')});
A.poEdit=async()=>{const p=await q(sb.from('pos').select('*').eq('id',S.po).single());
 sheet('Ubah batch PO',poFields(p),v=>upd('pos',p.id,v),async()=>{await del('pos',p.id);log('hapus','po',p.id,p.name);S.page='folders'})};
A.setStatus=async(k,v)=>{await upd('pos',S.po,{[k]:v});toast('Status batch disimpan');render()};

PAGES.podetail=async()=>{
 const id=S.po;if(!id)return head('Batch PO','Pilih batch dari folder.');
 const[p,fin,prods,os,od,exps]=await Promise.all([q(sb.from('pos').select('*').eq('id',id).single()),q(sb.from('v_po_finance').select('*').eq('po_id',id).single()),
  q(sb.from('products').select('*').eq('po_id',id).order('created_at')),q(sb.from('v_order_summary').select('*').eq('po_id',id).order('order_date',{ascending:false})),
  q(sb.from('orders').select('id,cust_no,city').eq('po_id',id)),q(sb.from('expenses').select('*').eq('po_id',id).order('spent_at',{ascending:false}))]);
 const ids=os.map(o=>o.order_id),items=ids.length?await q(sb.from('order_items').select('order_id,product_name,qty').in('order_id',ids)):[];
 const dm=Object.fromEntries(od.map(x=>[x.id,x]));
 const sel=(k,l)=>`<div class="field"><label>${l}</label><select onchange="A.setStatus('${k}',this.value)">${[['belum','Belum mulai'],['berjalan','Berjalan'],['selesai','Selesai']].map(o=>`<option value="${o[0]}"${p[k]===o[0]?' selected':''}>${o[1]}</option>`).join('')}</select></div>`;
 const tabs=[['customer','Customer'],['produk','Produk'],['biaya','Biaya'],['ringkasan','Ringkasan']];
 let b='';
 if(S.tab==='customer')b=`<div class="sect"><h3>Customer yang order di ${esc(p.name)}</h3><span class="pill">${os.length} customer</span></div>`+(os.map(o=>{const d=dm[o.order_id]||{},it=items.filter(i=>i.order_id===o.order_id);
  return`<div class="row" onclick="go('order',{order:'${o.order_id}'})"><span class="iconbox">${esc((o.buyer||'C')[0].toUpperCase())}</span><div><b>${esc(o.buyer)}</b><div class="desc">${esc(d.cust_no||'No Cust belum diisi')} · ${esc(d.city||'Kota belum diisi')}<br>${esc(it.map(i=>i.product_name).join(', ')||'Belum ada item')} · ${sum(it,'qty')} pcs · ${payChip(o.payment_status)}</div></div><strong class="tail">${rp(o.total)}</strong></div>`}).join('')||`<div class="card empty">Belum ada customer di batch ini.<br>Tekan Tambah customer/order untuk memasukkan buyer.</div>`);
 if(S.tab==='produk')b=`<div class="sect"><h3>Produk batch</h3><button class="btn soft sm" onclick="A.prodForm()">＋ Produk</button></div>`+(prods.map(x=>`<div class="row" onclick="A.prodForm('${x.id}')"><span class="iconbox">□</span><div><b>${esc(x.name)}</b><div class="desc">Jual ${rp(x.sell_price)} · modal ${rp(x.cost_price)}</div></div></div>`).join('')||'<div class="card empty">Belum ada produk. Harga dan modal di sini jadi acuan saat input order.</div>');
 if(S.tab==='biaya')b=`<div class="sect"><h3>Biaya batch</h3><button class="btn soft sm" onclick="A.expForm(null,'${id}')">＋ Biaya</button></div>`+(exps.map(expRow).join('')||'<div class="card empty">Belum ada biaya yang ditautkan ke batch ini.</div>');
 if(S.tab==='ringkasan')b=`<div class="card">${[['Omzet',fin.omzet],['Modal produksi',fin.modal_produksi],['Biaya packing',fin.biaya_packing],['Freebies',fin.biaya_freebies],['Biaya lain',fin.biaya_lain],['Total biaya',fin.total_biaya],['Laba bersih',fin.laba_bersih]].map(m=>`<div class="row" style="cursor:default"><b>${m[0]}</b><strong class="tail">${rp(m[1])}</strong></div>`).join('')}<p class="desc">${fin.order_count} customer · ${fin.qty_sold} pcs terjual${p.target_qty?' dari target '+p.target_qty:''}${p.close_date?' · tutup '+p.close_date:''}</p>${p.notes?`<p class="desc">${esc(p.notes)}</p>`:''}<button class="btn light sm" onclick="A.poEdit()">✎ Ubah / hapus batch</button></div>`;
 return head(esc(p.name))+`<div class="card"><div class="grid"><div class="stat pink"><div class="label">Omzet batch</div><strong>${rp(fin.omzet)}</strong></div><div class="stat blue"><div class="label">Jumlah customer</div><strong>${os.length}</strong></div><div class="stat yellow"><div class="label">Total biaya</div><strong>${rp(fin.total_biaya)}</strong></div><div class="stat green"><div class="label">Laba bersih</div><strong>${rp(fin.laba_bersih)}</strong></div></div>
 <div class="sect"><h3>Status perjalanan PO</h3>${stChip(p)}</div><div class="grid">${sel('status_production','Produksi')}${sel('status_packing','Packing')}${sel('status_shipping','Pengiriman')}</div><p class="smallmuted">Status berlaku untuk seluruh batch, bukan per customer.</p></div>
 <div class="quick" style="grid-template-columns:1fr 1fr"><button onclick="A.orderForm('${p.id}')">＋ Tambah customer/order</button><button onclick="A.poForm()">＋ Batch PO baru</button></div>
 <div class="tabs">${tabs.map(t=>`<button class="pill ${S.tab===t[0]?'on':''}" onclick="go('podetail',{tab:'${t[0]}'},false)">${t[1]}</button>`).join('')}</div>${b}`};
A.prodForm=async id=>{const x=id?await q(sb.from('products').select('*').eq('id',id).single()):null;
 sheet(x?'Ubah produk':'Produk baru',[{k:'name',l:'Nama produk',v:x?.name,req:1},{k:'sell_price',l:'Harga jual per pcs',t:'number',v:x?.sell_price,z:1},{k:'cost_price',l:'Harga modal per pcs',t:'number',v:x?.cost_price,z:1},{k:'notes',l:'Catatan',t:'area',v:x?.notes}],
  v=>x?upd('products',id,v):ins('products',{...v,po_id:S.po}),x?()=>del('products',id):null)};
