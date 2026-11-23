/* ---------- tambah customer / order ---------- */
A.orderForm=po=>go('addorder',{po});
PAGES.addorder=async()=>{
 const pos=await q(sb.from('pos').select('id,name').eq('archived',false).order('created_at',{ascending:false}));
 if(!pos.length)return head('Tambah Customer / Order','Pilih batch PO sebelum menambahkan customer.')+`<div class="card empty">Belum ada batch PO.<br><br><button class="btn sm" onclick="A.poForm()">＋ Batch PO baru</button></div>`;
 const po=pos.find(x=>x.id===S.po)?S.po:pos[0].id,n=(await sb.from('orders').select('id',{count:'exact',head:true})).count||0;
 A.after=()=>A.loadProd(po);
 return head('Tambah Customer / Order','Order masuk ke batch yang dipilih.')+`<div class="card"><div class="field"><label>Batch PO</label><select id="opo" onchange="A.loadProd(this.value)">${pos.map(x=>`<option value="${x.id}"${x.id===po?' selected':''}>${esc(x.name)}</option>`).join('')}</select></div>
 <div class="field"><label>Nama buyer</label><input id="buyer" placeholder="Nama / username customer"></div>
 <div class="grid"><div class="field"><label>No. Cust</label><input id="cust" placeholder="CT-001"></div><div class="field"><label>Asal kota</label><input id="city" placeholder="Contoh: Bandung"></div></div>
 <div class="field"><label>No. order</label><input id="ono" value="ORD-${String(n+1).padStart(3,'0')}"></div>
 <div class="field"><label>Produk</label><input id="prod" list="prodlist" placeholder="Nama produk" oninput="A.pickProd()"><datalist id="prodlist"></datalist></div>
 <div class="grid"><div class="field"><label>Qty</label><input id="qty" type="number" min="1" value="1" oninput="A.orderCalc()"></div><div class="field"><label>Harga per pcs</label><input id="price" type="number" value="0" oninput="A.orderCalc()"></div></div>
 <div class="stat pink"><div class="label">Total order</div><strong id="total">Rp0</strong></div>
 <div class="field"><label>Status pembayaran</label><select id="pay" onchange="A.orderCalc()"><option>Belum lunas</option><option>DP</option><option>Lunas</option></select></div>
 <div class="field" id="dpw" style="display:none"><label>Jumlah DP</label><input id="dp" type="number" value="0"></div>
 <div class="field"><label>Catatan</label><textarea id="onotes"></textarea></div>
 <button class="btn" onclick="A.saveOrder()">Simpan customer ke batch</button></div>`};
A.loadProd=async po=>{S.po=po;const p=await q(sb.from('products').select('*').eq('po_id',po));PM=Object.fromEntries(p.map(x=>[x.name,{id:x.id,sell:x.sell_price,cost:x.cost_price}]));const d=$('#prodlist');if(d)d.innerHTML=p.map(x=>`<option value="${esc(x.name)}">`).join('')};
A.pickProd=()=>{const m=PM[$('#prod').value];if(m){$('#price').value=m.sell;A.orderCalc()}};
A.orderCalc=()=>{$('#total').textContent=rp((+$('#qty').value||0)*(+$('#price').value||0));$('#dpw').style.display=$('#pay').value==='DP'?'block':'none'};
A.saveOrder=async()=>{
 const g=i=>$('#'+i).value.trim(),po=$('#opo').value,buyer=g('buyer'),prod=g('prod'),qty=+g('qty')||0,price=+g('price')||0;
 if(!buyer||!prod||qty<=0)return toast('Isi nama buyer, produk, dan qty dulu ya.');
 try{
  const o=await ins('orders',{po_id:po,order_no:g('ono')||'ORD',buyer,cust_no:g('cust')||null,city:g('city')||null,notes:g('onotes')||null}),m=PM[prod];
  await ins('order_items',{order_id:o.id,product_id:m?m.id:null,product_name:prod,qty,sell_price:price,cost_price:m?m.cost:0});
  const pay=g('pay'),paid=pay==='Lunas'?qty*price:pay==='DP'?(+g('dp')||0):0;
  if(paid>0)await ins('payments',{order_id:o.id,kind:'buyer',amount:paid,matched:true});
  log('buat','order',o.id,o.order_no+' '+buyer);toast('Customer tersimpan ke batch');go('podetail',{po,tab:'customer'},false)
 }catch(e){}};

/* ---------- detail order ---------- */
PAGES.order=async()=>{
 const id=S.order,[o,sm,items,pays]=await Promise.all([q(sb.from('orders').select('*').eq('id',id).single()),q(sb.from('v_order_summary').select('*').eq('order_id',id).single()),
  q(sb.from('order_items').select('*').eq('order_id',id).order('created_at')),q(sb.from('payments').select('*').eq('order_id',id).order('paid_at'))]);
 return head(esc(o.buyer),`${esc(o.order_no)} · ${esc(o.cust_no||'No Cust belum diisi')} · ${esc(o.city||'Kota belum diisi')}`)+`<div class="grid"><div class="stat pink"><div class="label">Total order</div><strong>${rp(sm.total)}</strong></div><div class="stat green"><div class="label">Terbayar</div><strong>${rp(sm.paid)}</strong><div class="desc">${payChip(sm.payment_status)} · sisa ${rp(sm.remaining)}</div></div></div>
 <div class="sect"><h3>Item</h3><button class="btn soft sm" onclick="A.itemForm('${o.po_id}')">＋ Item</button></div>
 ${items.map(i=>`<div class="row" onclick="A.itemEdit('${i.id}')"><span class="iconbox">□</span><div><b>${esc(i.product_name)}</b><div class="desc">${i.qty} pcs × ${rp(i.sell_price)}</div></div><strong class="tail">${rp(i.qty*i.sell_price)}</strong></div>`).join('')||'<div class="card empty">Belum ada item.</div>'}
 <div class="sect"><h3>Pembayaran</h3><button class="btn soft sm" onclick="A.payForm(${Math.max(0,sm.remaining)})">＋ Pembayaran</button></div>
 ${pays.map(p=>`<div class="row" onclick="A.payEdit('${p.id}')"><span class="iconbox">◈</span><div><b>${p.paid_at}</b><div class="desc">${esc(p.kind==='buyer'?(p.method||'Pembayaran buyer'):'Packing Shopee Split Bill')}</div></div><strong class="tail">${rp(p.amount)}</strong></div>`).join('')||'<div class="card empty">Belum ada pembayaran.</div>'}
 ${o.notes?`<p class="smallmuted">${esc(o.notes)}</p>`:''}<button class="btn light sm" onclick="A.orderEdit()">✎ Ubah / hapus order</button>`};
A.orderEdit=async()=>{const o=await q(sb.from('orders').select('*').eq('id',S.order).single());
 sheet('Ubah order',[{k:'order_no',l:'No. order',v:o.order_no,req:1},{k:'buyer',l:'Nama buyer',v:o.buyer,req:1},{k:'cust_no',l:'No. Cust',v:o.cust_no},{k:'city',l:'Asal kota',v:o.city},{k:'order_date',l:'Tanggal',t:'date',v:o.order_date,req:1},{k:'notes',l:'Catatan',t:'area',v:o.notes}],
  v=>upd('orders',o.id,v),async()=>{await del('orders',o.id);log('hapus','order',o.id,o.order_no);S.page='podetail';S.tab='customer';S.po=o.po_id})};
A.itemForm=async po=>{const pr=await q(sb.from('products').select('*').eq('po_id',po));
 if(!pr.length)return toast('Tambahkan produk dulu di batch (tab Produk)');
 sheet('Tambah item',[{k:'pid',l:'Produk',t:'select',o:pr.map(p=>[p.id,`${p.name} (${rp(p.sell_price)})`])},{k:'qty',l:'Jumlah',t:'number',v:1,req:1},{k:'price',l:'Harga jual (kosongkan = harga produk)',t:'number'}],
  v=>{const p=pr.find(x=>x.id===v.pid);return ins('order_items',{order_id:S.order,product_id:p.id,product_name:p.name,qty:v.qty,sell_price:v.price??p.sell_price,cost_price:p.cost_price})})};
A.itemEdit=async id=>{const i=await q(sb.from('order_items').select('*').eq('id',id).single());
 sheet('Ubah item: '+i.product_name,[{k:'qty',l:'Jumlah',t:'number',v:i.qty,req:1},{k:'sell_price',l:'Harga jual',t:'number',v:i.sell_price,z:1}],v=>upd('order_items',id,v),()=>del('order_items',id))};
const payFields=p=>[{k:'amount',l:'Jumlah',t:'number',v:p?.amount,req:1},{k:'paid_at',l:'Tanggal',t:'date',v:p?.paid_at||today(),req:1},{k:'kind',l:'Jenis',t:'select',o:[['buyer','Pembayaran buyer (di luar Shopee)'],['packing_shopee','Packing/resi via Shopee Split Bill']],v:p?.kind||'buyer'},{k:'method',l:'Metode (transfer, tunai, dll)',v:p?.method},{k:'notes',l:'Catatan',t:'area',v:p?.notes}];
A.payForm=rem=>{const f=payFields();f[0].v=rem||'';sheet('Catat pembayaran',f,v=>ins('payments',{...v,order_id:S.order,matched:true}))};
A.payEdit=async id=>{const p=await q(sb.from('payments').select('*').eq('id',id).single());sheet('Ubah pembayaran',payFields(p),v=>upd('payments',id,v),()=>del('payments',id))};
