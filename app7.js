A.cDelTpl=async()=>{if(!CL.tpl||!confirm('Hapus template ini? Biaya PO yang sudah memakainya tidak berubah.'))return;await del('templates',CL.tpl.id);log('hapus','template',CL.tpl.id,CL.tpl.name);CL.tpl=null;CL.rows=[blank()];render()};
A.cUse=async()=>{const rows=CL.rows.filter(r=>r.n.trim()&&r.q>0);if(!rows.length)return toast('Isi minimal satu barang dengan qty lebih dari 0.');
 const pos=await q(sb.from('pos').select('id,name').order('created_at',{ascending:false}));if(!pos.length)return toast('Buat batch PO dulu.');
 const k=CL.tpl?CL.tpl.kind:'nota';
 sheet('Pakai ke batch PO',[{k:'po',l:'Batch PO',t:'select',o:pos.map(p=>[p.id,p.name]),v:pos.find(p=>p.id===S.po)?S.po:pos[0].id},{k:'ct',l:'Masuk ke biaya',t:'select',o:[['packing','Packing'],['freebies','Freebies'],['produksi','Produksi'],['lain','Biaya lain']],v:k==='packing'?'packing':k==='freebies'?'freebies':'lain'},{k:'mul',l:'Jumlah paket (qty dikali ini)',t:'number',v:1,req:1}],
  async v=>{const m=v.mul>0?v.mul:1,lab=CL.tpl?CL.tpl.name:'Kalkulator nota';
   await q(sb.from('po_cost_lines').insert(rows.map(r=>({po_id:v.po,cost_type:v.ct,item_name:r.n.trim(),qty:r.q*m,unit_price:r.p,source_template_id:CL.tpl?CL.tpl.id:null,source_label:lab+(m>1?' ×'+m:'')}))));
   log('buat','biaya PO',v.po,lab+': '+rows.length+' item');toast('Disalin ke biaya batch (harga disimpan sebagai snapshot)')},null,'Pakai')};
A.margin=()=>{const g=i=>+$('#m'+i).value||0,j=g(1),c=g(2)+g(3)+g(4)+g(5),l=j-c,t=g(6),mg=g(7);
 $('#mres').innerHTML=`Total modal per pcs: <b>${rp(c)}</b><br>Laba bersih per pcs: <b>${rp(l)}</b> · Margin: <b>${j?(l/j*100).toFixed(1):0}%</b>${t?`<br>Total modal PO: <b>${rp(c*t)}</b><br>Omzet target: <b>${rp(j*t)}</b><br>Estimasi keuntungan: <b>${rp(l*t)}</b>`:''}${mg>0&&mg<100&&c?`<br>Harga jual disarankan untuk margin ${mg}%: <b>${rp(c/(1-mg/100))}</b>`:''}`};

/* biaya dari template/nota tampil di tab Biaya batch PO */
const _pd=PAGES.podetail;
PAGES.podetail=async()=>{const h=await _pd();if(S.tab!=='biaya'||!S.po)return h;
 const cl=await q(sb.from('po_cost_lines').select('*').eq('po_id',S.po).order('created_at'));
 return h+`<div class="sect"><h3>Biaya dari template & nota</h3></div>`+(cl.map(c=>`<div class="row" onclick="A.clEdit('${c.id}')"><span class="iconbox">∑</span><div><b>${esc(c.item_name)} ×${c.qty}</b><div class="desc">${c.cost_type} · ${esc(c.source_label||'manual')} · @${rp(c.unit_price)}</div></div><strong class="tail">${rp(c.subtotal)}</strong></div>`).join('')||'<div class="card empty">Belum ada. Pakai template lewat menu Kalkulator & Template.</div>')};
A.clEdit=async id=>{const c=await q(sb.from('po_cost_lines').select('*').eq('id',id).single());
 sheet('Ubah baris biaya',[{k:'item_name',l:'Nama',v:c.item_name,req:1},{k:'qty',l:'Qty',t:'number',v:c.qty,req:1},{k:'unit_price',l:'Harga per pcs',t:'number',v:c.unit_price,z:1}],v=>upd('po_cost_lines',id,v),()=>del('po_cost_lines',id))};
