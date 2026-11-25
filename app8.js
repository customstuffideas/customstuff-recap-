/* ---------- Tahap D (1/2): item stok, restock, pemakaian, koreksi ---------- */
const stockRem=m=>m.reduce((a,x)=>a+(x.kind==='pakai'?-x.qty:+x.qty),0);
const avgCost=m=>{const b=m.filter(x=>x.kind==='beli'),qt=b.reduce((a,x)=>a+ +x.qty,0);return qt?b.reduce((a,x)=>a+ +x.total_cost,0)/qt:0};
const MVL={beli:['＋','Restock'],pakai:['−','Dipakai'],koreksi:['±','Koreksi']};
A.stockForm=async id=>{const s=id?await q(sb.from('stock_items').select('*').eq('id',id).single()):null;
 sheet(s?'Ubah item stok':'Item stok baru',[{k:'name',l:'Nama item',v:s?.name,req:1},{k:'unit',l:'Satuan (pcs, lembar, roll, dll)',v:s?.unit||'pcs',req:1},{k:'min_stock',l:'Batas stok menipis',t:'number',v:s?.min_stock??0,z:1},{k:'notes',l:'Catatan',t:'area',v:s?.notes}],
  async v=>{if(s)await upd('stock_items',id,v);else{const r=await ins('stock_items',v);log('buat','stok',r.id,v.name)}},
  s?async()=>{await del('stock_items',id);log('hapus','stok',id,s.name);S.page='inventory'}:null)};
PAGES.stockitem=async()=>{
 const id=S.si;if(!id)return head('Item stok');
 const[it,mv,pos]=await Promise.all([q(sb.from('stock_items').select('*').eq('id',id).single()),q(sb.from('stock_movements').select('*').eq('stock_item_id',id).order('moved_at',{ascending:false}).order('created_at',{ascending:false})),q(sb.from('pos').select('id,name'))]);
 const pm=Object.fromEntries(pos.map(p=>[p.id,p.name])),rem=stockRem(mv),avg=avgCost(mv),u=esc(it.unit);
 return head(esc(it.name),it.notes?esc(it.notes):'')+`<div class="grid"><div class="stat pink"><div class="label">Stok tersisa</div><strong>${rem} ${u}</strong></div><div class="stat blue"><div class="label">Harga rata-rata</div><strong>${rp(avg)}</strong><div class="desc">per ${u}, termasuk ongkir</div></div><div class="stat yellow"><div class="label">Batas menipis</div><strong>${+it.min_stock}</strong></div><div class="stat green"><div class="label">Nilai stok</div><strong>${rp(rem*avg)}</strong></div></div>
 <div class="quick" style="margin-top:10px"><button onclick="A.restock('${id}')"><span class="icon">＋</span>Restock</button><button onclick="A.usage('${id}')"><span class="icon">−</span>Pakai</button><button onclick="A.koreksi('${id}')"><span class="icon">±</span>Koreksi</button></div>
 <div class="actions"><button class="btn light sm" onclick="A.stockForm('${id}')">✎ Ubah / hapus item</button></div>
 <div class="sect"><h3>Riwayat</h3><span class="pill">${mv.length}</span></div>`+
 (mv.map(m=>`<div class="row" onclick="A.mvDel('${m.id}')"><span class="iconbox">${MVL[m.kind][0]}</span><div><b>${MVL[m.kind][1]} ${m.kind==='koreksi'&&m.qty>0?'+':''}${+m.qty} ${u}</b><div class="desc">${m.moved_at}${m.vendor_name?' · '+esc(m.vendor_name):''}${m.po_id?' · '+esc(pm[m.po_id]||'PO'):''}${m.notes?' · '+esc(m.notes):''}</div></div><strong class="tail">${m.kind==='koreksi'?'':rp(m.total_cost)}</strong></div>`).join('')||'<div class="card empty">Belum ada riwayat. Mulai dengan Restock.</div>')};
A.restock=async id=>{const it=await q(sb.from('stock_items').select('*').eq('id',id).single());
 sheet('Restock: '+it.name,[{k:'qty',l:'Jumlah dibeli ('+it.unit+')',t:'number',req:1},{k:'unit_cost',l:'Harga per '+it.unit,t:'number',req:1,z:1},{k:'shipping_cost',l:'Ongkir pembelian (total)',t:'number',v:0,z:1},{k:'moved_at',l:'Tanggal beli',t:'date',v:today(),req:1},{k:'vendor_name',l:'Toko / vendor'},{k:'rec',l:'Catat juga di Riwayat belanja (belum jadi beban, baru saat stok dipakai)',t:'check',v:true},{k:'notes',l:'Catatan',t:'area'}],
  async v=>{if(!(v.qty>0))throw toast('Jumlah harus lebih dari 0');
   const m=await ins('stock_movements',{stock_item_id:id,kind:'beli',moved_at:v.moved_at,qty:v.qty,unit_cost:v.unit_cost,shipping_cost:v.shipping_cost,vendor_name:v.vendor_name,notes:v.notes});let eid=null;
   if(v.rec){const e=await ins('expenses',{spent_at:v.moved_at,item_name:'Restock: '+it.name,qty:v.qty,unit_price:Math.round((v.unit_cost+v.shipping_cost/v.qty)*100)/100,cost_type:'lain',category:'stok',vendor_name:v.vendor_name,is_stock_purchase:true,notes:v.notes});eid=e.id;await upd('stock_movements',m.id,{expense_id:eid})}
   await sb.from('price_history').insert({item_name:it.name,unit_price:v.unit_cost,vendor_name:v.vendor_name,recorded_at:v.moved_at,expense_id:eid});
   log('buat','restock',id,it.name+' ×'+v.qty);toast('Restock tersimpan')})};
A.usage=async id=>{const[it,mv,pos]=await Promise.all([q(sb.from('stock_items').select('*').eq('id',id).single()),q(sb.from('stock_movements').select('*').eq('stock_item_id',id)),q(sb.from('pos').select('id,name').order('created_at',{ascending:false}))]);
 const rem=stockRem(mv),avg=avgCost(mv);
 sheet('Pakai: '+it.name+' (sisa '+rem+')',[{k:'qty',l:'Jumlah dipakai ('+it.unit+')',t:'number',req:1},{k:'moved_at',l:'Tanggal',t:'date',v:today(),req:1},{k:'po_id',l:'Dipakai untuk batch PO (opsional)',t:'select',o:[['','(Tanpa PO)'],...pos.map(p=>[p.id,p.name])],v:S.po||''},{k:'notes',l:'Catatan',t:'area'}],
  async v=>{if(!(v.qty>0))throw toast('Jumlah harus lebih dari 0');if(v.qty>rem)throw toast('Stok tidak cukup. Sisa '+rem+' '+it.unit);
   await ins('stock_movements',{stock_item_id:id,kind:'pakai',moved_at:v.moved_at,qty:v.qty,unit_cost:Math.round(avg*10000)/10000,po_id:v.po_id,notes:v.notes});
   log('buat','pakai stok',id,it.name+' ×'+v.qty);toast('Pemakaian tersimpan (harga historis '+rp(avg)+')')})};
A.koreksi=async id=>{const[it,mv]=await Promise.all([q(sb.from('stock_items').select('*').eq('id',id).single()),q(sb.from('stock_movements').select('*').eq('stock_item_id',id))]);const rem=stockRem(mv);
 sheet('Koreksi stok: '+it.name,[{k:'actual',l:'Jumlah stok sebenarnya sekarang ('+it.unit+')',t:'number',v:rem,req:1,z:1},{k:'notes',l:'Alasan koreksi',t:'area'}],
  async v=>{const d=Math.round((v.actual-rem)*1000)/1000;if(!d)throw toast('Stok sudah sama, tidak ada koreksi.');
   await ins('stock_movements',{stock_item_id:id,kind:'koreksi',qty:d,unit_cost:0,notes:v.notes});log('ubah','koreksi stok',id,it.name+' '+(d>0?'+':'')+d);toast('Koreksi tersimpan')})};
A.mvDel=async id=>{if(!confirm('Hapus catatan ini dari riwayat stok? Pencatatan di Riwayat belanja tidak ikut terhapus.'))return;try{await del('stock_movements',id);render()}catch(e){}};
