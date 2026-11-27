/* ---------- Tahap H (4/5): ekspor data order dan pengeluaran ---------- */
const csvText=rows=>'\ufeff'+rows.map(l=>l.map(c=>'"'+String(c??'').replace(/"/g,'""')+'"').join(',')).join('\n');
const FMT=[['csv','CSV'],['xlsx','Excel (.xlsx)'],['print','Cetak / PDF (halaman ini)']];
async function exportRows(kind){
 if(kind==='orders'){const[os,od,ps]=await Promise.all([q(sb.from('v_order_summary').select('*').order('order_date',{ascending:false})),q(sb.from('orders').select('id,cust_no,city')),q(sb.from('pos').select('id,name'))]);const dm=Object.fromEntries(od.map(x=>[x.id,x])),pm=Object.fromEntries(ps.map(x=>[x.id,x.name]));
  return{name:'data-order-customstuff',sheet:'Order',rows:[['No. order','Buyer','No. Cust','Kota','Batch PO','Tanggal','Total','Terbayar','Sisa','Status pembayaran'],...os.map(o=>[o.order_no,o.buyer,(dm[o.order_id]||{}).cust_no,(dm[o.order_id]||{}).city,pm[o.po_id],o.order_date,+o.total,+o.paid,+o.remaining,PAYL[o.payment_status][0]])]}}
 const[ex,ps]=await Promise.all([q(sb.from('expenses').select('*').order('spent_at',{ascending:false})),q(sb.from('pos').select('id,name'))]),pm=Object.fromEntries(ps.map(x=>[x.id,x.name]));
 return{name:'pengeluaran-customstuff',sheet:'Pengeluaran',rows:[['Tanggal','Kategori','Item','Qty','Harga satuan','Total','Vendor','Batch PO','Pembelian stok','Metode bayar','Catatan'],...ex.map(e=>[e.spent_at,e.cost_type,e.item_name,+e.qty,+e.unit_price,+e.total,e.vendor_name,pm[e.po_id]||'',e.is_stock_purchase?'ya':'',e.payment_method,e.notes])]}}
A.exportPick=kind=>sheet('Ekspor '+(kind==='orders'?'data order':'pengeluaran'),[{k:'f',l:'Format',t:'select',o:FMT,v:'csv'}],async v=>{
 if(v.f==='print'){setTimeout(()=>window.print(),1500);return}
 const d=await exportRows(kind);if(v.f==='csv')dl(d.name+'.csv',csvText(d.rows),'text/csv');else await xlsSave(d.name+'.xlsx',d.sheet,d.rows)},null,'Ekspor');
const _ord2=PAGES.orders;
PAGES.orders=async()=>{const h=await _ord2();return h.replace('<button class="btn" onclick="go(\'addorder\')">＋ Tambah order</button>',()=>'<div class="actions" style="margin:0 0 6px"><button class="btn" onclick="go(\'addorder\')">＋ Tambah order</button><button class="btn light" onclick="A.exportPick(\'orders\')">⬇ Ekspor</button></div>')};
const _exp2=PAGES.expenses;
PAGES.expenses=async()=>{const h=await _exp2();return h.replace('<button class="btn" onclick="A.expForm()">＋ Tambah biaya</button>',()=>'<button class="btn" onclick="A.expForm()">＋ Tambah biaya</button><button class="btn light" onclick="A.exportPick(\'expenses\')">⬇ Ekspor</button>')};
