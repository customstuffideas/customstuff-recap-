const CFG='cs_cfg',$=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rp=n=>(n<0?'-':'')+'Rp'+Math.abs(Math.round(Number(n||0))).toLocaleString('id-ID');
const today=()=>new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
const sum=(a,k)=>a.reduce((x,y)=>x+Number(y[k]||0),0);
const ls=(k,d)=>localStorage.getItem(k)||d;
let sb=null,session=null,F=[],hist=[],PM={};
const S={page:'home',folder:null,po:null,order:null,tab:'customer',onlyUn:false,from:'',to:'',q:'',fp:''};
const A={},PAGES={};
const MENU=[['home','⌂','Beranda'],['folders','▱','Folder & PO'],['orders','▤','Data Orderan'],['addorder','＋','Tambah Order'],['expenses','◈','Biaya & Pengeluaran'],['inventory','□','Stok & Pembelian'],['calculator','∑','Kalkulator & Template'],['reports','▥','Laporan Keuangan'],['vendors','⌁','Vendor & Sample'],['reminders','✨','Reminder & To-do'],['activity','◷','Aktivitas Terakhir'],['backup','▣','Backup & Export'],['settings','⚙','Pengaturan']];
const TAB={home:'home',folders:'folders',podetail:'folders',orders:'orders',addorder:'orders',order:'orders',reports:'reports'};
function toast(m){const t=$('#toast');t.textContent=m;t.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>t.style.display='none',3500)}
async function q(p){const{data,error}=await p;if(error){toast(error.message);throw error}return data}
const ins=(t,o)=>q(sb.from(t).insert(o).select().single());
const upd=(t,id,o)=>q(sb.from(t).update(o).eq('id',id));
const del=(t,id)=>q(sb.from(t).delete().eq('id',id));
const log=(a,e,id,s)=>sb.from('activity_log').insert({action:a,entity:e,entity_id:id,summary:s}).then(()=>{},()=>{});
const fpath=id=>{const o=[];let c=F.find(f=>f.id===id);while(c){o.unshift(c.name);c=F.find(f=>f.id===c.parent_id)}return o.join(' / ')};
const desc=id=>{const r=[id];F.filter(f=>f.parent_id===id).forEach(c=>r.push(...desc(c.id)));return r};
const fopts=()=>[['','(Tanpa folder)'],...F.map(f=>[f.id,fpath(f.id)]).sort((a,b)=>a[1].localeCompare(b[1]))];
const loadF=async()=>{F=await q(sb.from('folders').select('*').order('name'))};
const poStat=p=>p.status_shipping==='selesai'?'Selesai':p.status_shipping==='berjalan'?'Pengiriman':p.status_packing!=='belum'?'Packing':p.status_production!=='belum'?'Produksi':'Open PO';
const stCls=s=>s.toLowerCase().replace(' ','');
const stChip=p=>{const s=poStat(p);return`<span class="status ${stCls(s)}">${s}</span>`};
const PAYL={belum:['Belum lunas',''],sebagian:['DP','dp'],lunas:['Lunas','lunas']};
const payChip=s=>`<span class="status ${PAYL[s][1]}">${PAYL[s][0]}</span>`;
const head=(t,sub)=>`<div class="pagehead"><button class="back" onclick="back()">←</button><h2>${t}</h2></div>${sub?`<p class="smallmuted">${sub}</p>`:''}`;
const stage=(t,sub,tahap,d)=>head(t,sub)+`<div class="card empty">🌸<br><b>Dibangun di Tahap ${tahap}</b><br>${d}<br><span class="smallmuted">Struktur database sudah siap. Tampilan dan formnya menyusul.</span></div>`;

/* ---------- drawer, navigasi, modal ---------- */
const drawerOpen=()=>{drawMenu();$('#shade').style.display='block'};
const drawerClose=e=>{if(!e||e.target.id==='shade')$('#shade').style.display='none'};
function drawMenu(){$('#drawerlist').innerHTML=MENU.map(([id,ic,l])=>`<button class="draweritem ${S.page===id?'active':''}" onclick="go('${id}')"><span class="iconbox">${ic}</span>${l}</button>`).join('')}
function go(id,x={},push=true){if(push){if(S.page!==id)hist.push(S.page);history.pushState({r:1},'','#'+id)}Object.assign(S,{page:id},x);drawerClose();render();scrollTo(0,0)}
function back(){
 if($('#shade').style.display==='block'){drawerClose();return}
 if($('#modalshade').style.display==='flex'){modalClose();return}
 if(hist.length)go(hist.pop(),{},false);else if(S.page!=='home')go('home',{},false)}
addEventListener('popstate',()=>back());
function modalClose(e){if(!e||e.target.id==='modalshade')$('#modalshade').style.display='none'}
function fh(f){const v=f.v??'',r=f.req?' required':'';
 if(f.t==='select')return`<div class="field"><label>${f.l}</label><select name="${f.k}"${r}>${f.o.map(o=>`<option value="${esc(o[0])}"${String(o[0])===String(v)?' selected':''}>${esc(o[1])}</option>`).join('')}</select></div>`;
 if(f.t==='check')return`<div class="field"><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" name="${f.k}"${v?' checked':''} style="width:auto"> ${f.l}</label></div>`;
 if(f.t==='area')return`<div class="field"><label>${f.l}</label><textarea name="${f.k}">${esc(v)}</textarea></div>`;
 const ty=f.t||'text';return`<div class="field"><label>${f.l}</label><input name="${f.k}" type="${ty}"${ty==='number'?' step="any" inputmode="decimal"':''} value="${esc(v)}"${r}></div>`}
function sheet(title,fields,onSave,onDel,saveLabel){
 $('#modalbody').innerHTML=`<form id="sf"><h3>${esc(title)}</h3>${fields.map(fh).join('')}<div class="actions"><button type="button" class="btn light" onclick="modalClose()">Batal</button>${onDel?'<button type="button" class="btn" id="sd" style="background:#c0392b;box-shadow:none">Hapus</button>':''}<button class="btn">${saveLabel||'Simpan'}</button></div></form>`;
 $('#modalshade').style.display='flex';const fm=$('#sf');
 if(onDel)$('#sd').onclick=async()=>{if(!confirm('Hapus data ini? Tidak bisa dibatalkan.'))return;try{await onDel();modalClose();render()}catch(e){}};
 fm.onsubmit=async e=>{e.preventDefault();const v={};
  for(const f of fields){const x=fm.elements[f.k];
   if(f.t==='check')v[f.k]=x.checked;
   else if(f.t==='number')v[f.k]=x.value===''?(f.z?0:null):parseFloat(x.value);
   else{const s=x.value.trim();v[f.k]=s===''?null:s}}
  try{await onSave(v);modalClose();render()}catch(e){}}}

/* ---------- setup & login ---------- */
function setup(){const c=JSON.parse(localStorage.getItem(CFG)||'{}');
 $('#main').innerHTML=`<h1>Setup Supabase</h1><p class="smallmuted">Isi sekali saja. Pakai <b>Project URL</b> dan <b>Publishable / anon key</b>. Jangan pernah pakai Secret atau service_role key.</p><form class="card" id="f"><div class="field"><label>Project URL</label><input id="u" value="${esc(c.url||'')}" placeholder="https://xxxx.supabase.co" required></div><div class="field"><label>Publishable / anon key</label><input id="k" value="${esc(c.key||'')}" required></div><button class="btn">Simpan</button></form>`;
 $('#f').onsubmit=e=>{e.preventDefault();const k=$('#k').value.trim();if(/^sb_secret_/.test(k))return toast('Itu key Secret. Pakai key Publishable.');localStorage.setItem(CFG,JSON.stringify({url:$('#u').value.trim().replace(/\/$/,''),key:k}));boot()}}
function login(){
 $('#main').innerHTML=`<h1 style="font:700 26px Georgia;color:#d7679e">Customstuff Recap</h1><form class="card" id="f"><div class="field"><label>Email</label><input id="e" type="email" autocomplete="username" required></div><div class="field"><label>Password</label><input id="p" type="password" autocomplete="current-password" required></div><button class="btn">Masuk</button></form><p class="smallmuted"><a href="#" onclick="A.reset();return false">Ubah setup Supabase</a></p>`;
 $('#f').onsubmit=async e=>{e.preventDefault();const{error}=await sb.auth.signInWithPassword({email:$('#e').value,password:$('#p').value});if(error)toast('Gagal masuk: '+error.message)}}
A.reset=()=>{localStorage.removeItem(CFG);sb=null;session=null;render()};

async function render(){
 document.body.classList.toggle('bare',!(sb&&session));
 if(!sb)return setup();if(!session)return login();
 document.querySelectorAll('.bottom button').forEach(b=>b.classList.toggle('active',b.dataset.tab===(TAB[S.page]||'more')));
 const m=$('#main');m.innerHTML='<div class="empty">Memuat…</div>';
 try{await loadF();m.innerHTML=await PAGES[S.page]()}catch(e){m.innerHTML=`<div class="card empty">Gagal memuat: ${esc(e.message)}</div>`}
 if(A.after){const f=A.after;A.after=null;f()}}

/* ---------- beranda ---------- */
PAGES.home=async()=>{
 const[fin,un,os,pos,td]=await Promise.all([q(sb.from('v_po_finance').select('*')),q(sb.from('v_unallocated_expenses').select('total')),q(sb.from('v_order_summary').select('remaining,payment_status')),
  q(sb.from('pos').select('*').order('created_at',{ascending:false}).limit(3)),q(sb.from('todos').select('*').eq('done',false).order('due_date',{ascending:true}).limit(3))]);
 const lb=+localStorage.getItem('cs_lastbackup')||0,d=lb?Math.floor((Date.now()-lb)/864e5):null;
 const owed=os.filter(o=>o.payment_status!=='lunas'),laba=sum(fin,'laba_bersih');
 return`<section class="welcome"><span class="bow"></span><h2>Hai, ${esc(ls('cs_name','Customstuff'))}!</h2><p>Pelan-pelan, bisnis juga bisa rapi hari ini.</p><div class="smallmuted" style="margin-top:9px">Dashboard ringkas kamu</div></section>
 ${d===null||d>=7?`<div class="card" style="background:var(--yellow)">⚠️ ${d===null?'Belum pernah backup.':'Terakhir backup '+d+' hari lalu.'} <a href="#" onclick="go('backup');return false">Backup sekarang</a></div>`:''}
 <div class="sect"><h3>Quick Add</h3><button class="btn light sm" onclick="go('settings')">Atur shortcut</button></div>
 <div class="quick"><button onclick="go('addorder')"><span class="icon">▤</span>Order</button><button onclick="A.expForm()"><span class="icon">◈</span>Pengeluaran</button><button onclick="A.poForm()"><span class="icon">□</span>PO Baru</button></div>
 <div class="sect"><h3>Ringkasan bisnis</h3></div>
 <div class="grid"><div class="stat pink"><span class="mark">▤</span><div class="label">Order tercatat</div><strong>${os.length}</strong></div><div class="stat blue"><span class="mark">◈</span><div class="label">Total omzet</div><strong>${rp(sum(fin,'omzet'))}</strong></div>
 <div class="stat yellow"><span class="mark">□</span><div class="label">Total biaya</div><strong>${rp(sum(fin,'total_biaya'))}</strong></div><div class="stat green"><span class="mark">↗</span><div class="label">Laba sementara</div><strong>${rp(laba)}</strong></div>
 <div class="stat lav" onclick="go('orders',{fp:'belum'})"><div class="label">Belum lunas</div><strong>${owed.length} order</strong><div class="desc">${rp(sum(owed,'remaining'))}</div></div>
 <div class="stat peach" onclick="go('expenses',{onlyUn:true})"><div class="label">Belum dialokasikan</div><strong>${rp(sum(un,'total'))}</strong><div class="desc">${un.length} pengeluaran</div></div></div>
 <div class="sect"><h3>PO & folder terbaru</h3><button class="btn soft sm" onclick="go('folders',{folder:null})">Lihat semua</button></div>
 ${pos.map(p=>`<div class="row" onclick="A.openPO('${p.id}')"><span class="iconbox">▱</span><div><b>${esc(p.name)}</b><div class="desc">${esc(fpath(p.folder_id)||'Tanpa folder')} · ${stChip(p)}</div></div><span class="tail">›</span></div>`).join('')||'<div class="card empty">Belum ada PO. Mulai dari tombol PO Baru.</div>'}
 <div class="sect"><h3>Reminder ✨</h3><button class="btn soft sm" onclick="go('reminders')">Kelola</button></div>
 ${td.map(t=>`<div class="row" onclick="go('reminders')"><span class="iconbox">✨</span><div><b>${esc(t.title)}</b><div class="desc">${t.due_date||'Tanpa tanggal'}</div></div></div>`).join('')||'<div class="card"><div class="row"><span class="iconbox">✨</span><div><b>Belum ada deadline</b><div class="desc">Tambah pengingat PO, packing, atau drop-off.</div></div></div></div>'}`};
