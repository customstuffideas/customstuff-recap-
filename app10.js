/* ---------- Penyempurnaan stok (1/2): harga rata-rata bergerak, ongkir masuk harga stok ---------- */
const wacCalc=mv=>{let q=0,v=0,a=0;[...mv].sort((x,y)=>((x.moved_at||'')+(x.created_at||'')).localeCompare((y.moved_at||'')+(y.created_at||''))).forEach(m=>{const n=+m.qty;
 if(m.kind==='beli'){q+=n;v+=+m.total_cost}
 else if(m.kind==='pakai'){const c=q>0?v/q:0;q-=n;v-=n*c}
 else{const c=q>0?v/q:a;q+=n;v+=n*c}
 if(q>0)a=v/q});
 return{qty:Math.round(q*1000)/1000,value:Math.max(v,0),avg:a}};
const stockValue=mv=>{const g={};mv.forEach(m=>(g[m.stock_item_id]=g[m.stock_item_id]||[]).push(m));return Object.values(g).reduce((s,a)=>s+wacCalc(a).value,0)};
PAGES.stockitem=async()=>{
 const id=S.si;if(!id)return head('Item stok');
 const[it,mv,pos]=await Promise.all([q(sb.from('stock_items').select('*').eq('id',id).single()),q(sb.from('stock_movements').select('*').eq('stock_item_id',id).order('moved_at',{ascending:false}).order('created_at',{ascending:false})),q(sb.from('pos').select('id,name'))]);
 const pm=Object.fromEntries(pos.map(p=>[p.id,p.name])),w=wacCalc(mv),u=esc(it.unit);
 return head(esc(it.name),it.notes?esc(it.notes):'')+`<div class="grid"><div class="stat pink"><div class="label">Stok tersisa</div><strong>${w.qty} ${u}</strong></div><div class="stat blue"><div class="label">Harga stok per ${u}</div><strong>${rp(w.avg)}</strong><div class="desc">rata-rata bergerak, sudah termasuk ongkir</div></div><div class="stat yellow"><div class="label">Batas menipis</div><strong>${+it.min_stock}</strong></div><div class="stat green"><div class="label">Nilai stok tersisa</div><strong>${rp(w.value)}</strong><div class="desc">belum jadi biaya PO</div></div></div>
 <div class="quick" style="margin-top:10px"><button onclick="A.restock('${id}')"><span class="icon">＋</span>Restock</button><button onclick="A.usage('${id}')"><span class="icon">−</span>Pakai</button><button onclick="A.koreksi('${id}')"><span class="icon">±</span>Koreksi</button></div>
 <div class="actions"><button class="btn light sm" onclick="A.stockForm('${id}')">✎ Ubah / hapus item</button></div>
 <div class="sect"><h3>Riwayat</h3><span class="pill">${mv.length}</span></div>`+
 (mv.map(m=>`<div class="row" onclick="A.mvDel('${m.id}')"><span class="iconbox">${MVL[m.kind][0]}</span><div><b>${MVL[m.kind][1]} ${m.kind==='koreksi'&&m.qty>0?'+':''}${+m.qty} ${u}</b><div class="desc">${m.moved_at}${m.kind==='beli'&&+m.shipping_cost?' · ongkir '+rp(m.shipping_cost):''}${m.vendor_name?' · '+esc(m.vendor_name):''}${m.po_id?' · '+esc(pm[m.po_id]||'PO'):''}${m.notes?' · '+esc(m.notes):''}</div></div><strong class="tail">${m.kind==='koreksi'?'':rp(m.total_cost)}</strong></div>`).join('')||'<div class="card empty">Belum ada riwayat. Mulai dengan Restock.</div>')};
A.restock=async id=>{const it=await q(sb.from('stock_items').select('*').eq('id',id).single());
 sheet('Restock: '+it.name,[{k:'qty',l:'Jumlah dibeli ('+it.unit+')',t:'number',req:1},{k:'unit_cost',l:'Harga per '+it.unit+' (belum termasuk ongkir)',t:'number',req:1,z:1},{k:'shipping_cost',l:'Ongkir pembelian (total, otomatis masuk harga stok)',t:'number',v:0,z:1},{k:'moved_at',l:'Tanggal beli',t:'date',v:today(),req:1},{k:'vendor_name',l:'Toko / vendor'},{k:'rec',l:'Catat juga di Riwayat belanja (belum jadi biaya, baru saat stok dipakai)',t:'check',v:true},{k:'notes',l:'Catatan',t:'area'}],
  async v=>{if(!(v.qty>0))throw toast('Jumlah harus lebih dari 0');
   const eff=Math.round((v.unit_cost+v.shipping_cost/v.qty)*100)/100;
   const m=await ins('stock_movements',{stock_item_id:id,kind:'beli',moved_at:v.moved_at,qty:v.qty,unit_cost:v.unit_cost,shipping_cost:v.shipping_cost,vendor_name:v.vendor_name,notes:v.notes});let eid=null;
   if(v.rec){const e=await ins('expenses',{spent_at:v.moved_at,item_name:'Restock: '+it.name,qty:v.qty,unit_price:eff,cost_type:'lain',category:'stok',vendor_name:v.vendor_name,is_stock_purchase:true,notes:v.notes});eid=e.id;await upd('stock_movements',m.id,{expense_id:eid})}
   await sb.from('price_history').insert({item_name:it.name,unit_price:v.unit_cost,vendor_name:v.vendor_name,recorded_at:v.moved_at,expense_id:eid});
   log('buat','restock',id,it.name+' ×'+v.qty);toast('Restock tersimpan. Harga stok per '+it.unit+': '+rp(eff)+' (sudah termasuk ongkir)')})};
A.usage=async id=>{const[it,mv,pos]=await Promise.all([q(sb.from('stock_items').select('*').eq('id',id).single()),q(sb.from('stock_movements').select('*').eq('stock_item_id',id)),q(sb.from('pos').select('id,name').order('created_at',{ascending:false}))]);
 const w=wacCalc(mv),rem=w.qty,avg=w.avg;
 sheet('Pakai: '+it.name+' (sisa '+rem+')',[{k:'qty',l:'Jumlah dipakai ('+it.unit+')',t:'number',req:1},{k:'moved_at',l:'Tanggal',t:'date',v:today(),req:1},{k:'po_id',l:'Dipakai untuk batch PO (opsional)',t:'select',o:[['','(Tanpa PO)'],...pos.map(p=>[p.id,p.name])],v:S.po||''},{k:'notes',l:'Catatan',t:'area'}],
  async v=>{if(!(v.qty>0))throw toast('Jumlah harus lebih dari 0');if(v.qty>rem)throw toast('Stok tidak cukup. Sisa '+rem+' '+it.unit);
   await ins('stock_movements',{stock_item_id:id,kind:'pakai',moved_at:v.moved_at,qty:v.qty,unit_cost:Math.round(avg*10000)/10000,po_id:v.po_id,notes:v.notes});
   log('buat','pakai stok',id,it.name+' ×'+v.qty);toast('Pemakaian tersimpan. Harga stok saat ini '+rp(avg)+' per '+it.unit)})};
