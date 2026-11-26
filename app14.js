/* ---------- Tahap F (1/2): vendor, penawaran harga, sample ---------- */
const VN={tab:'vendor',q:'',fs:'',cp:''},VT={};
const SL={dipesan:['Dipesan',''],dikirim:['Dikirim','packing'],diterima:['Diterima','selesai'],dibatalkan:['Dibatalkan','']};
const AL={menunggu:['Menunggu','dp'],disetujui:['Disetujui','lunas'],ditolak:['Ditolak','']};
const vchip=(m,k)=>`<span class="status ${(m[k]||['',''])[1]}">${(m[k]||[k,''])[0]}</span>`;
const sampleRow=(s,vn)=>`<div class="row" onclick="A.sampleForm('${s.id}')"><span class="iconbox">▣</span><div><b>${esc(s.product_name)}</b><div class="desc">${vn?esc(vn)+' · ':''}${s.ordered_at||'tanggal belum diisi'}<br>${vchip(SL,s.status)} ${vchip(AL,s.approval)}${s.result_notes?'<br>'+esc(s.result_notes):''}</div></div><strong class="tail">${rp(s.price)}</strong></div>`;
A.vendorForm=async id=>{const v0=id?await q(sb.from('vendors').select('*').eq('id',id).single()):null;
 sheet(v0?'Ubah vendor':'Vendor baru',[{k:'name',l:'Nama vendor',v:v0?.name,req:1},{k:'contact',l:'Kontak (WA, IG, alamat)',v:v0?.contact},{k:'notes',l:'Catatan',t:'area',v:v0?.notes}],
  async v=>{if(v0)await upd('vendors',id,v);else{const r=await ins('vendors',v);log('buat','vendor',r.id,v.name)}},
  v0?async()=>{await del('vendors',id);log('hapus','vendor',id,v0.name);S.page='vendors'}:null)};
PAGES.vendor=async()=>{
 const id=S.vd;if(!id)return head('Vendor');
 const[v,of,sm]=await Promise.all([q(sb.from('vendors').select('*').eq('id',id).single()),q(sb.from('vendor_offers').select('*').eq('vendor_id',id).order('recorded_at',{ascending:false}).order('created_at',{ascending:false})),q(sb.from('samples').select('*').eq('vendor_id',id).order('created_at',{ascending:false}))]);
 return head(esc(v.name),v.contact?esc(v.contact):'')+(v.notes?`<p class="smallmuted">${esc(v.notes)}</p>`:'')+`<div class="quick" style="grid-template-columns:1fr 1fr"><button onclick="A.offerForm(null,'${id}')"><span class="icon">＋</span>Produk & harga</button><button onclick="A.sampleForm(null,'${id}')"><span class="icon">▣</span>Sample</button></div><div class="actions"><button class="btn light sm" onclick="A.vendorForm('${id}')">✎ Ubah / hapus vendor</button></div>
 <div class="sect"><h3>Produk & harga (riwayat)</h3><span class="pill">${of.length}</span></div>`+
 (of.map(o=>`<div class="row" onclick="A.offerForm('${o.id}')"><span class="iconbox">◈</span><div><b>${esc(o.product_name)}</b><div class="desc">${o.recorded_at} · produksi ${o.lead_time_days?o.lead_time_days+' hari':'—'} · MOQ ${o.min_order||'—'}${o.notes?' · '+esc(o.notes):''}</div></div><strong class="tail">${rp(o.price)}</strong></div>`).join('')||'<div class="card empty">Belum ada produk atau harga. Tiap perubahan harga dicatat sebagai baris baru supaya riwayatnya terlihat.</div>')+
 `<div class="sect"><h3>Sample</h3><span class="pill">${sm.length}</span></div>`+(sm.map(s=>sampleRow(s)).join('')||'<div class="card empty">Belum ada sample dari vendor ini.</div>')};
A.offerForm=async(id,vid)=>{const o=id?await q(sb.from('vendor_offers').select('*').eq('id',id).single()):null,vd=o?o.vendor_id:vid;
 sheet(o?'Ubah produk & harga':'Produk & harga baru',[{k:'product_name',l:'Nama produk',v:o?.product_name,req:1},{k:'price',l:'Harga per pcs',t:'number',v:o?.price,z:1},{k:'lead_time_days',l:'Waktu produksi (hari)',t:'number',v:o?.lead_time_days},{k:'min_order',l:'Minimum order (pcs)',t:'number',v:o?.min_order},{k:'recorded_at',l:'Tanggal harga berlaku',t:'date',v:o?.recorded_at||today(),req:1},{k:'notes',l:'Catatan',t:'area',v:o?.notes}],
  v=>{const r={...v,lead_time_days:v.lead_time_days==null?null:Math.round(v.lead_time_days),min_order:v.min_order==null?null:Math.round(v.min_order)};return o?upd('vendor_offers',id,r):ins('vendor_offers',{...r,vendor_id:vd})},o?()=>del('vendor_offers',id):null)};
A.sampleForm=async(id,vid)=>{const[s,vs]=await Promise.all([id?q(sb.from('samples').select('*').eq('id',id).single()):null,q(sb.from('vendors').select('id,name').order('name'))]);
 if(!vs.length)return toast('Buat vendor dulu sebelum mencatat sample.');
 sheet(s?'Ubah sample':'Sample baru',[{k:'vendor_id',l:'Vendor',t:'select',o:vs.map(x=>[x.id,x.name]),v:s?.vendor_id||vid||vs[0].id,req:1},{k:'product_name',l:'Produk sample',v:s?.product_name,req:1},{k:'price',l:'Harga sample',t:'number',v:s?.price,z:1},{k:'ordered_at',l:'Tanggal order',t:'date',v:s?.ordered_at||today()},
  {k:'status',l:'Status sample',t:'select',o:Object.entries(SL).map(([k,a])=>[k,a[0]]),v:s?.status||'dipesan'},{k:'approval',l:'Approval',t:'select',o:Object.entries(AL).map(([k,a])=>[k,a[0]]),v:s?.approval||'menunggu'},{k:'result_notes',l:'Hasil / catatan sample',t:'area',v:s?.result_notes}],
  async v=>{if(s)await upd('samples',id,v);else{const r=await ins('samples',v);log('buat','sample',r.id,v.product_name)}},s?()=>del('samples',id):null)};
