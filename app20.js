/* ---------- Tahap G (2/2) C: notifikasi reminder (jujur) dan ringkasan aktivitas terakhir ---------- */
const NCAP='Notification' in window,nState=()=>NCAP?Notification.permission:'unsupported';
const notify=(t,b,tag)=>{if(!NCAP||Notification.permission!=='granted')return;const o={body:b,tag,icon:'IMG_20261119_141722_069.jpg'};
 if(navigator.serviceWorker&&navigator.serviceWorker.ready)navigator.serviceWorker.ready.then(r=>r.showNotification(t,o)).catch(()=>{try{new Notification(t,o)}catch(e){}});else{try{new Notification(t,o)}catch(e){}}};
A.askNotif=async()=>{if(!NCAP)return toast('Browser ini tidak mendukung notifikasi.');const r=await Notification.requestPermission();toast(r==='granted'?'Notifikasi diaktifkan. Muncul saat aplikasi dibuka.':'Izin notifikasi tidak diberikan.');render()};
const dueTodos=()=>q(sb.from('todos').select('*').eq('done',false).not('due_date','is',null).lte('due_date',today()).order('due_date'));
const _home3=PAGES.home;
PAGES.home=async()=>{const h=await _home3();let t=[];try{t=await dueTodos()}catch(e){}
 if(!t.length)return h;
 const seen=JSON.parse(localStorage.getItem('cs_notif')||'{}'),d=today(),m={};t.forEach(x=>{const k=x.id+d;m[k]=1;if(!seen[k])notify('✧ '+x.title,(x.due_date<d?'Terlambat sejak ':'Deadline ')+x.due_date,x.id)});localStorage.setItem('cs_notif',JSON.stringify(m));
 const ban=`<div class="card" style="background:var(--yellow)"><b>✧ ${t.length} pengingat jatuh tempo atau terlambat</b>${t.slice(0,3).map(x=>`<div class="desc">${x.due_date<d?'Terlambat':'Hari ini'} · ${esc(x.title)}</div>`).join('')}<button class="btn soft sm" style="margin-top:8px" onclick="go('reminders')">Lihat</button></div>`;
 return h.replace('<div class="sect"><h3>Quick Add</h3>',()=>ban+'<div class="sect"><h3>Quick Add</h3>')};
const _rem=PAGES.reminders;
PAGES.reminders=async()=>{const h=await _rem(),s=nState();
 const st=s==='granted'?'Aktif. Notifikasi muncul saat aplikasi dibuka dan ada pengingat jatuh tempo.':s==='denied'?'Diblokir di browser. Aktifkan lewat pengaturan situs di browser.':s==='unsupported'?'Browser ini tidak mendukung notifikasi.':'Belum aktif.';
 const card=`<div class="card"><b>Notifikasi browser</b><div class="desc">${st}<br>Notifikasi hanya muncul saat aplikasi dibuka, bukan saat aplikasi tertutup.</div>${s==='default'?'<button class="btn soft sm" style="margin-top:8px" onclick="A.askNotif()">Aktifkan notifikasi</button>':''}</div>`;
 return h.replace('<p class="smallmuted">Pengingat tampil saat',()=>card+'<p class="smallmuted">Pengingat tampil saat')};
A.setStatus=async(k,v)=>{const p=await q(sb.from('pos').select('name').eq('id',S.po).single());await upd('pos',S.po,{[k]:v});log('ubah','status PO',S.po,p.name+': '+({status_production:'Produksi',status_packing:'Packing',status_shipping:'Pengiriman'}[k]||k)+' → '+v);toast('Status batch disimpan');render()};
const _act=PAGES.activity;
PAGES.activity=async()=>{const h=await _act();
 const one=(t,s)=>q(sb.from(t).select(s).order('created_at',{ascending:false}).limit(1)).then(r=>r[0]||null).catch(()=>null);
 const[ex,po,od,sm,st]=await Promise.all([one('expenses','item_name,total,spent_at,created_at'),one('pos','id,name,created_at'),one('orders','id,order_no,buyer,created_at'),one('stock_movements','kind,qty,created_at,stock_items(name,unit)'),q(sb.from('activity_log').select('summary,created_at').eq('entity','status PO').order('created_at',{ascending:false}).limit(1)).then(r=>r[0]||null).catch(()=>null)]);
 const d=x=>new Date(x.created_at).toLocaleDateString('id-ID'),c=(ic,t,b,a)=>`<div class="row"${a?` onclick="${a}"`:' style="cursor:default"'}><span class="iconbox">${ic}</span><div><b>${t}</b><div class="desc">${b}</div></div></div>`;
 const sec='<div class="sect"><h3>Terakhir kali</h3></div>'+c('◈','Pembelian terakhir',ex?esc(ex.item_name)+' · '+rp(ex.total)+' · '+ex.spent_at:'Belum ada',ex?"go('expenses')":'')+c('▱','PO terakhir dibuat',po?esc(po.name)+' · '+d(po):'Belum ada',po?`A.openPO('${po.id}')`:'')+c('▤','Order terakhir',od?esc(od.buyer)+' · '+esc(od.order_no)+' · '+d(od):'Belum ada',od?`go('order',{order:'${od.id}'})`:'')+
  c('□','Stok terakhir diperbarui',sm?esc((sm.stock_items||{}).name||'Item')+' · '+({beli:'restock',pakai:'dipakai',koreksi:'koreksi'}[sm.kind]||sm.kind)+' '+(+sm.qty)+' · '+d(sm):'Belum ada',sm?"go('inventory')":'')+c('◷','Status PO terakhir diubah',st?esc(st.summary)+' · '+d(st):'Belum ada (tercatat mulai sekarang)','')+'<div class="sect"><h3>Riwayat</h3></div>';
 return h.replace('<p class="smallmuted">Jejak pekerjaan dan perubahan.</p>',()=>'<p class="smallmuted">Jejak pekerjaan dan perubahan.</p>'+sec)};
