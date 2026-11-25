/* ---------- Penyempurnaan stok (2/2): nilai stok bukan biaya, total dipisah ---------- */
const MVQ='stock_item_id,kind,qty,unit_cost,total_cost,moved_at,created_at';
const _home=PAGES.home;
PAGES.home=async()=>{const h=await _home();
 const[mv,st]=await Promise.all([q(sb.from('stock_movements').select(MVQ)),q(sb.from('v_stock_status').select('is_low'))]);
 const sec=`<div class="sect"><h3>Stok</h3><button class="btn soft sm" onclick="go('inventory')">Buka</button></div><div class="grid"><div class="stat lav" onclick="go('inventory')"><div class="label">Nilai stok tersisa</div><strong>${rp(stockValue(mv))}</strong><div class="desc">uang yang masih ada di stok, belum jadi biaya</div></div><div class="stat peach" onclick="go('inventory')"><div class="label">Stok menipis</div><strong>${st.filter(s=>s.is_low).length} item</strong></div></div>`;
 const k='<div class="sect"><h3>PO & folder terbaru</h3>';return h.includes(k)?h.replace(k,sec+k):h};
const _rep=PAGES.reports;
PAGES.reports=async()=>{const h=await _rep();const mv=await q(sb.from('stock_movements').select(MVQ));
 const card=`<div class="card"><h3>Stok (bukan biaya sampai dipakai)</h3><div class="row" style="cursor:default"><b>Pembelian stok</b><strong class="tail">${rp(sum(mv.filter(m=>m.kind==='beli'),'total_cost'))}</strong></div><div class="row" style="cursor:default"><b>Sudah terpakai (jadi biaya PO)</b><strong class="tail">${rp(sum(mv.filter(m=>m.kind==='pakai'),'total_cost'))}</strong></div><div class="row" style="cursor:default"><b>Sisa nilai stok</b><strong class="tail">${rp(stockValue(mv))}</strong></div><p class="smallmuted">Pembelian stok termasuk ongkir. Uang di stok bukan kerugian dan tidak mengurangi laba PO sebelum dipakai. Selisih angka di atas berasal dari koreksi stok.</p></div>`;
 const k='<div class="card"><h3>Per folder</h3>';return h.includes(k)?h.replace(k,card+k):h+card};
const _exp=PAGES.expenses;
PAGES.expenses=async()=>{const h=await _exp();let qy=sb.from('expenses').select('total,is_stock_purchase').order('spent_at',{ascending:false}).limit(200);if(S.onlyUn)qy=qy.is('po_id',null).eq('is_stock_purchase',false);
 const ex=await q(qy),b=ex.filter(e=>!e.is_stock_purchase),s=ex.filter(e=>e.is_stock_purchase);
 return h.replace(/Total tampil: Rp[\d.,]+\./,'Biaya: '+rp(sum(b,'total'))+(s.length?' · Pembelian stok: '+rp(sum(s,'total'))+' (belum jadi biaya, baru saat stok dipakai).':'.'))};
const _bl=IVT.belanja;
IVT.belanja=async()=>{const h=await _bl();let qy=sb.from('expenses').select('item_name,vendor_name,notes,total,is_stock_purchase').order('spent_at',{ascending:false}).limit(300);if(IV.cat)qy=qy.eq('cost_type',IV.cat);
 const k=IV.q.toLowerCase(),r=(await q(qy)).filter(e=>!k||[e.item_name,e.vendor_name,e.notes].join(' ').toLowerCase().includes(k)),b=r.filter(e=>!e.is_stock_purchase),s=r.filter(e=>e.is_stock_purchase);
 return h.replace(/transaksi · total Rp[\d.,]+/,'transaksi · biaya '+rp(sum(b,'total'))+(s.length?' · pembelian stok '+rp(sum(s,'total'))+' (belum jadi biaya)':''))};
