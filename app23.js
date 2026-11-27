/* ---------- Tahap H (3/5): laporan harian/bulanan dengan filter folder dan PO ---------- */
RP.f='';RP.po='';
const inAll=async(t,s,col,vals,fn)=>{let r=[];for(let i=0;i<vals.length;i+=150){let qy=sb.from(t).select(s).in(col,vals.slice(i,i+150));if(fn)qy=fn(qy);r=r.concat(await q(qy))}return r};
PAGES.periode=async()=>{
 const pos=await q(sb.from('pos').select('id,name,folder_id').order('created_at',{ascending:false}));
 const[d0,d1]=rpDef(),from=RP.from||d0,to=RP.to||d1,k=d=>RP.mode==='bulan'?d.slice(0,7):d,keys=[];
 const ids=RP.po?[RP.po]:RP.f?pos.filter(p=>desc(RP.f).includes(p.folder_id)).map(p=>p.id):null;
 const c=new Date(from+'T00:00:00'),end=new Date(to+'T00:00:00');let gd=0;while(c<=end&&gd++<400){const x=k(iso(c));if(!keys.includes(x))keys.push(x);c.setDate(c.getDate()+1)}
 let ords=[],it=[],pay=[],ex=[],us=[],cl=[];
 if(!ids||ids.length){
  ords=ids?await inAll('orders','id,order_date,po_id','po_id',ids,x=>x.gte('order_date',from).lte('order_date',to)):await q(sb.from('orders').select('id,order_date,po_id').gte('order_date',from).lte('order_date',to));
  it=ords.length?await inAll('order_items','order_id,qty,sell_price','order_id',ords.map(o=>o.id)):[];
  if(ids){const ao=await inAll('orders','id','po_id',ids);pay=ao.length?await inAll('payments','amount,paid_at','order_id',ao.map(o=>o.id),x=>x.eq('kind','buyer').gte('paid_at',from).lte('paid_at',to)):[]}
  else pay=await q(sb.from('payments').select('amount,paid_at').eq('kind','buyer').gte('paid_at',from).lte('paid_at',to));
  const sc=y=>ids?y.in('po_id',ids):y;
  [ex,us,cl]=await Promise.all([q(sc(sb.from('expenses').select('total,spent_at').eq('is_stock_purchase',false).gte('spent_at',from).lte('spent_at',to))),q(sc(sb.from('stock_movements').select('total_cost,moved_at').eq('kind','pakai').gte('moved_at',from).lte('moved_at',to))),q(sc(sb.from('po_cost_lines').select('subtotal,created_at').gte('created_at',from+'T00:00:00').lte('created_at',to+'T23:59:59')))])}
 const od=Object.fromEntries(ords.map(o=>[o.id,o.order_date])),M=Object.fromEntries(keys.map(x=>[x,{k:x,omzet:0,masuk:0,biaya:0}])),add=(d,f,v)=>{const m=M[k(String(d).slice(0,10))];if(m)m[f]+=+v};
 it.forEach(i=>add(od[i.order_id],'omzet',i.qty*i.sell_price));pay.forEach(p=>add(p.paid_at,'masuk',p.amount));ex.forEach(e=>add(e.spent_at,'biaya',e.total));us.forEach(u=>add(u.moved_at,'biaya',u.total_cost));cl.forEach(x=>add(x.created_at,'biaya',x.subtotal));
 const rows=keys.map(x=>M[x]);RP.rows=rows;const T=f=>rows.reduce((a,r)=>a+r[f],0),pl=RP.f?pos.filter(p=>desc(RP.f).includes(p.folder_id)):pos;
 return head('Laporan Harian & Bulanan','Omzet, uang masuk, dan biaya per periode.')+`<div class="grid"><div class="field"><label>Per</label><select onchange="RP.mode=this.value;RP.from='';RP.to='';render()"><option value="hari"${RP.mode==='hari'?' selected':''}>Hari</option><option value="bulan"${RP.mode==='bulan'?' selected':''}>Bulan</option></select></div><div></div><div class="field"><label>Dari</label><input type="date" value="${from}" onchange="RP.from=this.value;render()"></div><div class="field"><label>Sampai</label><input type="date" value="${to}" onchange="RP.to=this.value;render()"></div>
 <div class="field"><label>Folder</label><select onchange="RP.f=this.value;RP.po='';render()">${fopts().map(o=>`<option value="${esc(o[0])}"${RP.f===o[0]?' selected':''}>${o[0]?esc(o[1]):'Semua folder'}</option>`).join('')}</select></div><div class="field"><label>Batch PO</label><select onchange="RP.po=this.value;render()"><option value="">Semua PO</option>${pl.map(p=>`<option value="${p.id}"${RP.po===p.id?' selected':''}>${esc(p.name)}</option>`).join('')}</select></div></div>
 <div class="grid"><div class="stat pink"><div class="label">Omzet</div><strong>${rp(T('omzet'))}</strong></div><div class="stat green"><div class="label">Uang masuk</div><strong>${rp(T('masuk'))}</strong></div><div class="stat blue"><div class="label">Biaya</div><strong>${rp(T('biaya'))}</strong></div><div class="stat yellow"><div class="label">Omzet dikurangi biaya</div><strong>${rp(T('omzet')-T('biaya'))}</strong></div></div>
 <div class="card"><h3>Grafik</h3>${rows.length?chartSvg(rows):'<p class="smallmuted">Tidak ada periode.</p>'}</div>
 <div class="actions" style="flex-wrap:wrap"><button class="btn light sm" onclick="A.rpXls()">⬇ Excel</button><button class="btn light sm" onclick="window.print()">Cetak / PDF</button></div>
 <div class="card"><h3>Rincian</h3>${rows.map(r=>`<div class="row" style="cursor:default"><div><b>${r.k}</b><div class="desc">masuk ${rp(r.masuk)} · biaya ${rp(r.biaya)}</div></div><strong class="tail">${rp(r.omzet)}</strong></div>`).join('')}</div>
 <p class="smallmuted">Omzet dihitung dari tanggal order. Biaya = pengeluaran yang dicatat (tanpa pembelian stok), stok yang dipakai, dan biaya dari template. Kalau memilih folder atau PO, pengeluaran yang belum ditautkan ke PO tidak ikut. Modal estimasi produk tidak dihitung di sini, jadi angkanya bisa berbeda dari laba per PO.</p>`};
