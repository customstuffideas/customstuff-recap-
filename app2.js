/* ---------- PO & folder ---------- */
PAGES.po=async()=>{
 const[pos,fin]=await Promise.all([q(sb.from('pos').select('*').order('po_date',{ascending:false})),q(sb.from('v_po_finance').select('*'))]);
 const cur=S.folder,subs=F.filter(f=>(f.parent_id||null)===cur),list=pos.filter(p=>(p.folder_id||null)===cur);
 const fm=Object.fromEntries(fin.map(x=>[x.po_id,x]));
 const crumbs=cur?`<a href="#" onclick="go('po',{folder:null});return false">Semua</a> / `+fpath(cur).split(' / ').map((n,i,a)=>{let id=cur;for(let j=a.length-1;j>i;j--)id=F.find(f=>f.id===id).parent_id;return`<a href="#" onclick="go('po',{folder:'${id}'});return false">${esc(n)}</a>`}).join(' / '):'Semua';
 return`<h1>PO & Folder</h1><p class="mut">${crumbs}</p>
 <div class="row" style="margin-bottom:10px"><button class="btn sm" onclick="A.folderForm()">+ Folder</button><button class="btn sm" onclick="A.poForm()">+ PO</button>${cur?`<button class="btn sm ghost" onclick="A.folderForm('${cur}')">✎ Folder ini</button>`:''}</div>
 ${subs.map(f=>`<div class="card tap row sp" onclick="go('po',{folder:'${f.id}'})"><span>📁 ${esc(f.name)}</span><span class="mut">${pos.filter(p=>desc(f.id).includes(p.folder_id)).length} PO ›</span></div>`).join('')}
 ${list.map(p=>{const x=fm[p.id]||{};return`<div class="card tap" onclick="go('poDetail',{po:'${p.id}',tab:'ringkasan'})"><div class="row sp"><b>${esc(p.name)}</b><span class="mut">${p.po_date}</span></div><div class="mut">${x.order_count||0} order · omzet ${rp(x.omzet)} · laba <span class="${x.laba_bersih<0?'neg':'pos'}">${rp(x.laba_bersih)}</span></div></div>`}).join('')}
 ${!subs.length&&!list.length?'<p class="mut">Folder ini masih kosong.</p>':''}`};
A.folderForm=async id=>{const f=id?F.find(x=>x.id===id):null;
 sheet(f?'Ubah folder':'Folder baru',[{k:'name',l:'Nama folder',v:f?.name,req:1}],
  async v=>{if(f){await upd('folders',f.id,v)}else{const r=await ins('folders',{name:v.name,parent_id:S.folder});log('buat','folder',r.id,v.name)}},
  f?async()=>{await del('folders',f.id);S.folder=f.parent_id}:null)};
const poFields=p=>[{k:'name',l:'Nama PO',v:p?.name,req:1},{k:'po_date',l:'Tanggal PO',t:'date',v:p?.po_date||today(),req:1},{k:'close_date',l:'Tanggal tutup PO',t:'date',v:p?.close_date},{k:'target_qty',l:'Target jumlah',t:'number',v:p?.target_qty},{k:'folder_id',l:'Folder',t:'select',o:fopts(),v:p?.folder_id??S.folder??''},{k:'notes',l:'Catatan',t:'area',v:p?.notes}];
A.poForm=async()=>sheet('PO baru',poFields(),async v=>{const r=await ins('pos',v);log('buat','po',r.id,v.name);S.po=r.id;S.page='poDetail';S.tab='ringkasan'});
A.poEdit=async()=>{const p=await q(sb.from('pos').select('*').eq('id',S.po).single());
 sheet('Ubah PO',poFields(p),v=>upd('pos',p.id,v),async()=>{await del('pos',p.id);log('hapus','po',p.id,p.name);S.page='po'})};
A.setStatus=async(k,v)=>{await upd('pos',S.po,{[k]:v});toast('Status disimpan')};

PAGES.poDetail=async()=>{
 const id=S.po,[p,fin,prods,ords,exps]=await Promise.all([q(sb.from('pos').select('*').eq('id',id).single()),q(sb.from('v_po_finance').select('*').eq('po_id',id).single()),
  q(sb.from('products').select('*').eq('po_id',id).order('created_at')),q(sb.from('v_order_summary').select('*').eq('po_id',id).order('order_date',{ascending:false})),
  q(sb.from('expenses').select('*').eq('po_id',id).order('spent_at',{ascending:false}))]);
 const st=(k,l)=>`<label>${l}<select onchange="A.setStatus('${k}',this.value)">${['belum','berjalan','selesai'].map(o=>`<option${p[k]===o?' selected':''}>${o}</option>`).join('')}</select></label>`;
 const tabs=[['ringkasan','Ringkasan'],['produk','Produk'],['order','Order'],['biaya','Biaya']];
 let body='';
 if(S.tab==='ringkasan')body=`<div class="grid">${[['Omzet',fin.omzet],['Modal produksi',fin.modal_produksi],['Packing',fin.biaya_packing],['Freebies',fin.biaya_freebies],['Biaya lain',fin.biaya_lain],['Total biaya',fin.total_biaya]].map(m=>`<div class="met">${m[0]}<b>${rp(m[1])}</b></div>`).join('')}</div><div class="met" style="margin-top:8px">Laba bersih<b class="${fin.laba_bersih<0?'neg':'pos'}">${rp(fin.laba_bersih)}</b><span class="mut">${fin.order_count} order · ${fin.qty_sold} pcs${p.target_qty?' / target '+p.target_qty:''}</span></div>
  <h2>Status PO</h2><div class="grid">${st('status_production','Produksi')}${st('status_packing','Packing')}${st('status_shipping','Pengiriman')}</div>${p.notes?`<p class="mut">${esc(p.notes)}</p>`:''}`;
 if(S.tab==='produk')body=`<button class="btn sm" onclick="A.prodForm()">+ Produk</button>`+prods.map(x=>`<div class="item tap" onclick="A.prodForm('${x.id}')"><span>${esc(x.name)}</span><span class="mut">jual ${rp(x.sell_price)} · modal ${rp(x.cost_price)}</span></div>`).join('')+(prods.length?'':'<p class="mut">Belum ada produk.</p>');
 if(S.tab==='order')body=`<button class="btn sm" onclick="A.orderForm()">+ Order</button>`+ords.map(o=>`<div class="item tap" onclick="go('order',{order:'${o.order_id}'})"><span><b>${esc(o.order_no)}</b> ${esc(o.buyer)}<br>${chip(o.payment_status)}</span><span style="text-align:right">${rp(o.total)}<br><span class="mut">sisa ${rp(o.remaining)}</span></span></div>`).join('')+(ords.length?'':'<p class="mut">Belum ada order.</p>');
 if(S.tab==='biaya')body=`<button class="btn sm" onclick="A.expForm(null,'${id}')">+ Biaya</button>`+exps.map(expRow).join('')+(exps.length?'':'<p class="mut">Belum ada biaya yang ditautkan.</p>');
 return`<p class="mut"><a href="#" onclick="go('po',{folder:${p.folder_id?`'${p.folder_id}'`:'null'}});return false">‹ Kembali</a></p><div class="row sp"><h1>${esc(p.name)}</h1><button class="btn sm ghost" onclick="A.poEdit()">✎</button></div>
 <div class="tabs">${tabs.map(t=>`<button class="btn sm ${S.tab===t[0]?'':'ghost'}" onclick="go('poDetail',{tab:'${t[0]}'})">${t[1]}</button>`).join('')}</div>${body}`};
A.prodForm=async id=>{const x=id?await q(sb.from('products').select('*').eq('id',id).single()):null;
 sheet(x?'Ubah produk':'Produk baru',[{k:'name',l:'Nama produk',v:x?.name,req:1},{k:'sell_price',l:'Harga jual',t:'number',v:x?.sell_price,z:1},{k:'cost_price',l:'Harga modal per unit',t:'number',v:x?.cost_price,z:1},{k:'notes',l:'Catatan',t:'area',v:x?.notes}],
  v=>x?upd('products',id,v):ins('products',{...v,po_id:S.po}),x?()=>del('products',id):null)};

/* ---------- order ---------- */
A.orderForm=async(poId)=>{const po=poId||S.po;S.po=po;
 const r=await sb.from('orders').select('id',{count:'exact',head:true}).eq('po_id',po);
 sheet('Order baru',[{k:'order_no',l:'No. order',v:'#'+((r.count||0)+1),req:1},{k:'buyer',l:'Nama buyer',req:1},{k:'order_date',l:'Tanggal',t:'date',v:today(),req:1},{k:'notes',l:'Catatan',t:'area'}],
  async v=>{const o=await ins('orders',{...v,po_id:po});log('buat','order',o.id,v.order_no+' '+v.buyer);S.page='order';S.order=o.id})};
PAGES.order=async()=>{
 const id=S.order,[o,sm,items,pays]=await Promise.all([q(sb.from('orders').select('*').eq('id',id).single()),q(sb.from('v_order_summary').select('*').eq('order_id',id).single()),
  q(sb.from('order_items').select('*').eq('order_id',id).order('created_at')),q(sb.from('payments').select('*').eq('order_id',id).order('paid_at'))]);
 return`<p class="mut"><a href="#" onclick="go('poDetail',{po:'${o.po_id}',tab:'order'});return false">‹ Kembali ke PO</a></p>
 <div class="row sp"><h1>${esc(o.order_no)} · ${esc(o.buyer)}</h1><button class="btn sm ghost" onclick="A.orderEdit()">✎</button></div>
 <div class="grid"><div class="met">Total<b>${rp(sm.total)}</b></div><div class="met">Terbayar<b>${rp(sm.paid)}</b>${chip(sm.payment_status)}</div></div>
 <h2>Item</h2><button class="btn sm" onclick="A.itemForm('${o.po_id}')">+ Item</button>
 ${items.map(i=>`<div class="item tap" onclick="A.itemEdit('${i.id}')"><span>${esc(i.product_name)} ×${i.qty}</span><span>${rp(i.qty*i.sell_price)}</span></div>`).join('')||'<p class="mut">Belum ada item.</p>'}
 <h2>Pembayaran</h2><button class="btn sm" onclick="A.payForm(${Math.max(0,sm.remaining)})">+ Pembayaran</button>
 ${pays.map(p=>`<div class="item tap" onclick="A.payEdit('${p.id}')"><span>${p.paid_at}<br><span class="mut">${esc(p.kind==='buyer'?(p.method||'Buyer'):'Packing Shopee')}</span></span><span>${rp(p.amount)}</span></div>`).join('')||'<p class="mut">Belum ada pembayaran.</p>'}
 ${o.notes?`<p class="mut">${esc(o.notes)}</p>`:''}`};
A.orderEdit=async()=>{const o=await q(sb.from('orders').select('*').eq('id',S.order).single());
 sheet('Ubah order',[{k:'order_no',l:'No. order',v:o.order_no,req:1},{k:'buyer',l:'Nama buyer',v:o.buyer,req:1},{k:'order_date',l:'Tanggal',t:'date',v:o.order_date,req:1},{k:'notes',l:'Catatan',t:'area',v:o.notes}],
  v=>upd('orders',o.id,v),async()=>{await del('orders',o.id);log('hapus','order',o.id,o.order_no);S.page='poDetail';S.tab='order';S.po=o.po_id})};
A.itemForm=async po=>{const pr=await q(sb.from('products').select('*').eq('po_id',po));
 if(!pr.length)return toast('Tambahkan produk dulu di tab Produk');
 sheet('Tambah item',[{k:'pid',l:'Produk',t:'select',o:pr.map(p=>[p.id,`${p.name} (${rp(p.sell_price)})`])},{k:'qty',l:'Jumlah',t:'number',v:1,req:1},{k:'price',l:'Harga jual (kosongkan = harga produk)',t:'number'}],
  v=>{const p=pr.find(x=>x.id===v.pid);return ins('order_items',{order_id:S.order,product_id:p.id,product_name:p.name,qty:v.qty,sell_price:v.price??p.sell_price,cost_price:p.cost_price})})};
A.itemEdit=async id=>{const i=await q(sb.from('order_items').select('*').eq('id',id).single());
 sheet('Ubah item: '+i.product_name,[{k:'qty',l:'Jumlah',t:'number',v:i.qty,req:1},{k:'sell_price',l:'Harga jual',t:'number',v:i.sell_price,z:1}],v=>upd('order_items',id,v),()=>del('order_items',id))};
const payFields=p=>[{k:'amount',l:'Jumlah',t:'number',v:p?.amount,req:1},{k:'paid_at',l:'Tanggal',t:'date',v:p?.paid_at||today(),req:1},{k:'kind',l:'Jenis',t:'select',o:[['buyer','Pembayaran buyer'],['packing_shopee','Packing/resi Shopee Split Bill']],v:p?.kind||'buyer'},{k:'method',l:'Metode (transfer, tunai, dll)',v:p?.method},{k:'notes',l:'Catatan',t:'area',v:p?.notes}];
A.payForm=rem=>{const f=payFields();f[0].v=rem||'';sheet('Catat pembayaran',f,v=>ins('payments',{...v,order_id:S.order,matched:true}))};
A.payEdit=async id=>{const p=await q(sb.from('payments').select('*').eq('id',id).single());sheet('Ubah pembayaran',payFields(p),v=>upd('payments',id,v),()=>del('payments',id))};
