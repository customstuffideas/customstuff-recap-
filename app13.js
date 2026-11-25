/* ---------- Tahap E (2/2): halaman pengaturan Quick Add ---------- */
const ICONS=['▤','◈','□','＋','♡','✧','∑','▥','⌁','◷','▣','↗','↓','✎','⚙','▱','⌂'];
const COLS=[['#f9a9ca','Pink'],['#8fbdf0','Biru pastel'],['#b9a8ee','Lavender'],['#8fd5b5','Mint'],['#f5cb62','Kuning'],['#f9c0a0','Peach'],['#e98ab9','Pink tua']];
const CATS=['Order','Keuangan','Stok','Lainnya'];
const actLabel=b=>((QACT[b.action_type]||['Aksi tidak dikenal'])[0])+(b.action_type==='page'?': '+((PGS.find(p=>p[0]===(b.action_params||{}).page)||[])[1]||'Beranda'):'');
PAGES.quickset=async()=>{const qa=await qaLoad();
 return head('Atur Quick Add','Tombol pintas di Beranda. Tambah, ubah, urutkan, atau hapus sesukamu.')+`<div class="actions" style="margin:0 0 10px"><button class="btn" onclick="A.qaForm()">＋ Tombol baru</button><button class="btn light" onclick="A.qaReset()">Pulihkan contoh</button></div>`+
 (qa.length?`<div class="sect"><h3>Pratinjau</h3></div><div class="quick">${qa.map(b=>`<button style="background:${esc(b.color)}" onclick="A.qa('${b.id}')"><span class="icon">${esc(b.icon)}</span>${esc(b.label)}</button>`).join('')}</div>`:'')+
 `<div class="sect"><h3>Daftar tombol</h3><span class="pill">${qa.length}</span></div>`+
 (qa.map((b,i)=>`<div class="row" onclick="A.qaForm('${b.id}')"><span class="iconbox" style="background:${esc(b.color)}">${esc(b.icon)}</span><div><b>${esc(b.label)}</b><div class="desc">${esc(b.category||'Lainnya')} · ${esc(actLabel(b))}</div></div><span class="tail"><button class="pill" onclick="event.stopPropagation();A.qaMove('${b.id}',-1)"${i?'':' disabled'}>↑</button> <button class="pill" onclick="event.stopPropagation();A.qaMove('${b.id}',1)"${i<qa.length-1?'':' disabled'}>↓</button></span></div>`).join('')||'<div class="card empty">Belum ada tombol.</div>')+'<p class="smallmuted">Ketuk baris untuk ubah nama, ikon, warna, kategori, atau aksinya.</p>'};
A.qaForm=async id=>{await qaLoad();const b=id?QA.find(x=>x.id===id):null,pr=b?(b.action_params||{}):{};
 sheet(b?'Ubah tombol':'Tombol baru',[{k:'label',l:'Nama tombol',v:b?.label,req:1},{k:'icon',l:'Ikon',t:'select',o:ICONS.map(g=>[g,g]),v:b?.icon||'▤'},{k:'color',l:'Warna',t:'select',o:COLS,v:b?.color||'#f9a9ca'},{k:'category',l:'Kategori',t:'select',o:CATS.map(c=>[c,c]),v:b?.category||'Lainnya'},{k:'action_type',l:'Aksi saat ditekan',t:'select',o:Object.entries(QACT).map(([k,a])=>[k,a[0]]),v:b?.action_type||'order'},{k:'page',l:'Halaman tujuan (khusus aksi Buka halaman)',t:'select',o:PGS,v:pr.page||'home'}],
  async v=>{const row={label:v.label,icon:v.icon,color:v.color,category:v.category,action_type:v.action_type,action_params:v.action_type==='page'?{page:v.page||'home'}:{}};
   if(b)await upd('quick_actions',b.id,row);else await ins('quick_actions',{...row,sort_order:QA.length?Math.max(...QA.map(x=>x.sort_order))+1:0})},
  b?()=>del('quick_actions',b.id):null)};
A.qaMove=async(id,d)=>{await qaLoad();const i=QA.findIndex(x=>x.id===id),j=i+d;if(i<0||j<0||j>=QA.length)return;const a=[...QA];[a[i],a[j]]=[a[j],a[i]];
 try{await Promise.all(a.map((x,n)=>x.sort_order===n?null:upd('quick_actions',x.id,{sort_order:n})));render()}catch(e){}};
A.qaReset=async()=>{if(!confirm('Tambahkan kembali tombol contoh yang hilang? Tombolmu yang lain tidak berubah.'))return;
 try{await qaLoad();const ex=QA.map(x=>x.label),add=QADEF.filter(d=>!ex.includes(d.label));if(!add.length)return toast('Semua tombol contoh sudah ada.');
  const base=QA.length?Math.max(...QA.map(x=>x.sort_order))+1:0;await q(sb.from('quick_actions').insert(add.map((d,i)=>({...d,sort_order:base+i}))));toast('Tombol contoh ditambahkan');render()}catch(e){}};
