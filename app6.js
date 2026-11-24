/* ---------- Tahap C: nota dinamis, template freebies/packing, kalkulator ---------- */
const CL={rows:[{n:'',q:1,p:0}],tpl:null};
const KL={freebies:'Freebies',packing:'Packing',nota:'Nota'};
const blank=()=>({n:'',q:1,p:0});
PAGES.calculator=async()=>{
 const[tp,items]=await Promise.all([q(sb.from('templates').select('*').order('name')),q(sb.from('template_items').select('template_id,qty,unit_price'))]);
 const sel=id=>items.filter(i=>i.template_id===id),tot=id=>sel(id).reduce((a,i)=>a+i.qty*i.unit_price,0);
 A.after=()=>A.cRows();
 const list=['freebies','packing','nota'].map(k=>{const a=tp.filter(t=>t.kind===k);return`<div class="sect"><h3>Template ${KL[k]}</h3><span class="pill">${a.length}</span></div>`+(a.map(t=>`<div class="row" onclick="A.cLoad('${t.id}')"><span class="iconbox">∑</span><div><b>${esc(t.name)}</b><div class="desc">${sel(t.id).length} item · ${rp(tot(t.id))}</div></div><span class="tail">Buka ›</span></div>`).join('')||'<div class="card empty">Belum ada template.</div>')}).join('');
 return head('Kalkulator & Template','Nota dinamis, template freebies dan packing.')+`<div class="card"><div class="sect" style="margin-top:0"><h3>${CL.tpl?'Template: '+esc(CL.tpl.name):'Nota baru'}</h3><button class="pill" onclick="A.cNew()">Baru</button></div><div id="crows"></div><button class="btn soft sm" onclick="A.cAdd()">＋ Tambah baris</button>
 <div class="sect"><h3>Total</h3><strong id="ctotal">Rp0</strong></div>
 <div class="actions"><button class="btn" onclick="A.cSave()">${CL.tpl?'Perbarui template':'Simpan template'}</button><button class="btn light" onclick="A.cUse()">Pakai ke PO</button></div>
 ${CL.tpl?'<div class="actions"><button class="btn light sm" onclick="A.cSave(true)">Simpan sebagai baru</button><button class="btn light sm" onclick="A.cDelTpl()">Hapus template</button></div>':''}</div>
 ${list}
 <div class="card"><h3>Kalkulator harga & margin</h3><div class="grid"><div class="field"><label>Harga jual / pcs</label><input id="m1" type="number" oninput="A.margin()"></div><div class="field"><label>Modal produk / pcs</label><input id="m2" type="number" oninput="A.margin()"></div><div class="field"><label>Packing / pcs</label><input id="m3" type="number" oninput="A.margin()"></div><div class="field"><label>Freebies / pcs</label><input id="m4" type="number" oninput="A.margin()"></div><div class="field"><label>Biaya lain / pcs</label><input id="m5" type="number" oninput="A.margin()"></div><div class="field"><label>Target terjual (pcs)</label><input id="m6" type="number" oninput="A.margin()"></div><div class="field"><label>Target margin (%)</label><input id="m7" type="number" oninput="A.margin()"></div></div><div id="mres" class="desc">Isi angka di atas.</div></div>`};
A.cRows=()=>{$('#crows').innerHTML=CL.rows.map((r,i)=>`<div class="card" style="margin:6px 0"><div class="field" style="margin:0 0 8px"><label>Nama barang</label><input value="${esc(r.n)}" oninput="A.cEd(${i},'n',this.value)"></div><div class="grid"><div class="field" style="margin:0"><label>Pcs / Qty</label><input type="number" step="any" value="${r.q}" oninput="A.cEd(${i},'q',this.value)"></div><div class="field" style="margin:0"><label>Harga per pcs</label><input type="number" step="any" value="${r.p}" oninput="A.cEd(${i},'p',this.value)"></div></div><div class="row" style="cursor:default;margin:8px 0 0"><span>Subtotal</span><strong class="tail" id="cs${i}">${rp(r.q*r.p)}</strong><button class="pill" onclick="A.cDel(${i})">Hapus</button></div></div>`).join('');A.cTot()};
A.cEd=(i,k,v)=>{CL.rows[i][k]=k==='n'?v:(parseFloat(v)||0);$('#cs'+i).textContent=rp(CL.rows[i].q*CL.rows[i].p);A.cTot()};
A.cTot=()=>{$('#ctotal').textContent=rp(CL.rows.reduce((a,r)=>a+r.q*r.p,0))};
A.cAdd=()=>{CL.rows.push(blank());A.cRows()};
A.cDel=i=>{CL.rows.splice(i,1);if(!CL.rows.length)CL.rows.push(blank());A.cRows()};
A.cNew=()=>{CL.tpl=null;CL.rows=[blank()];render()};
A.cLoad=async id=>{const[t,it]=await Promise.all([q(sb.from('templates').select('*').eq('id',id).single()),q(sb.from('template_items').select('*').eq('template_id',id).order('sort_order'))]);
 CL.tpl={id:t.id,name:t.name,kind:t.kind};CL.rows=it.map(i=>({n:i.item_name,q:+i.qty,p:+i.unit_price}));if(!CL.rows.length)CL.rows=[blank()];render();scrollTo(0,0)};
A.cSave=asNew=>{const rows=CL.rows.filter(r=>r.n.trim());if(!rows.length)return toast('Isi minimal satu nama barang.');
 const up=CL.tpl&&!asNew;
 sheet(up?'Perbarui template':'Simpan template',[{k:'name',l:'Nama template',v:up?CL.tpl.name:'',req:1},{k:'kind',l:'Jenis template',t:'select',o:[['freebies','Freebies'],['packing','Packing'],['nota','Nota / lainnya']],v:up?CL.tpl.kind:'freebies'}],async v=>{
  let id;if(up){id=CL.tpl.id;await upd('templates',id,{name:v.name,kind:v.kind});await q(sb.from('template_items').delete().eq('template_id',id))}else{id=(await ins('templates',{name:v.name,kind:v.kind})).id}
  await q(sb.from('template_items').insert(rows.map((r,i)=>({template_id:id,item_name:r.n.trim(),qty:r.q>0?r.q:1,unit_price:r.p||0,sort_order:i}))));
  CL.tpl={id,name:v.name,kind:v.kind};log(up?'ubah':'buat','template',id,v.name);toast('Template tersimpan')})};
A.cDelTpl=async()=>{if(!CL.tpl||!confirm('Hapus template ini? Biaya PO yang sudah memakainya tidak berubah.'))return;await del('templates',CL.tpl.id);log('hapus','template',CL.tpl.id,CL.tpl.name);CL.tpl=null;CL.rows=[blank()];render()};
A.cUse=async()=>{const rows=CL.rows.filter(r=>r.n.trim()&&r.q>0);if(!rows.length)return toast('Isi minimal satu barang dengan qty lebih dari 0.');
 const pos=await q(sb.from('pos').select('id,name').order('created_at',{ascending:false}));if(!pos.length)return toast('Buat batch PO dulu.');
 const k=CL.tpl?CL.tpl.kind:'nota';
 sheet('Pakai ke batch PO',[{k:'po',l:'Batch PO',t:'select',o:pos.map(p=>[p.id,p.name]),v:pos.find(p=>p.id===S.po)?S.po:pos[0].id},{k:'ct',l:'Masuk ke biaya',t:'select',o:[['packing','Packing'],['freebies','Freebies'],['produksi','Produksi'],['lain','Biaya lain']],v:k==='packing'?'packing':k==='freebies'?'freebies':'lain'},{k:'mul',l:'Jumlah paket (qty dikali ini)',t:'number',v:1,req:1}],
  async v=>{const m=v.mul>0?v.mul:1,lab=CL.tpl?CL.tpl.name:'Kalkulator nota';
   await q(sb.from('po_cost_lines').insert(rows.map(r=>({po_id:v.po,cost_type:v.ct,item_name:r.n.trim(),qty:r.q*m,unit_price:r.p,source_template_id:CL.tpl?CL.tpl.id:null,source_label:lab+(m>1?' ×'+m:'')}))));
   log('buat','biaya PO',v.po,lab+': '+rows.length+' item');toast('Disalin ke biaya batch (harga disimpan sebagai snapshot)')},null,'Pakai')};
A.margin=()=>{const g=i=>+$('#m'+i).value||0,j=g(1),c=g(2)+g(3)+g(4)+g(5),l=j-c,t=g(6),mg=g(7);
 $('#mres').innerHTML=`Total modal per pcs: <b>${rp(c)}</b><br>Laba bersih
