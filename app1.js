const CFG='cs_cfg',$=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rp=n=>(n<0?'-':'')+'Rp'+Math.abs(Math.round(Number(n||0))).toLocaleString('id-ID');
const today=()=>new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
const sum=(a,k)=>a.reduce((x,y)=>x+Number(y[k]||0),0);
let sb=null,session=null,F=[],S={page:'home',folder:null,po:null,tab:'ringkasan',order:null,onlyUn:false,from:'',to:''};
const A={},PAGES={};
function toast(m){const t=$('#toast');t.textContent=m;t.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>t.style.display='none',3500)}
async function q(p){const{data,error}=await p;if(error){toast(error.message);throw error}return data}
const ins=(t,o)=>q(sb.from(t).insert(o).select().single());
const upd=(t,id,o)=>q(sb.from(t).update(o).eq('id',id));
const del=(t,id)=>q(sb.from(t).delete().eq('id',id));
const log=(a,e,id,s)=>sb.from('activity_log').insert({action:a,entity:e,entity_id:id,summary:s}).then(()=>{},()=>{});
const fpath=id=>{const o=[];let c=F.find(f=>f.id===id);while(c){o.unshift(c.name);c=F.find(f=>f.id===c.parent_id)}return o.join(' / ')};
const fopts=()=>[['','(Tanpa folder)'],...F.map(f=>[f.id,fpath(f.id)]).sort((a,b)=>a[1].localeCompare(b[1]))];
const desc=id=>{const r=[id];F.filter(f=>f.parent_id===id).forEach(c=>r.push(...desc(c.id)));return r};
const loadF=async()=>{F=await q(sb.from('folders').select('*').order('name'))};
const chip=s=>`<span class="chip ${s}">${s}</span>`;

/* ---------- form sheet ---------- */
function fh(f){const v=f.v??'',r=f.req?' required':'';
 if(f.t==='select')return`<label>${f.l}<select name="${f.k}"${r}>${f.o.map(o=>`<option value="${esc(o[0])}"${String(o[0])===String(v)?' selected':''}>${esc(o[1])}</option>`).join('')}</select></label>`;
 if(f.t==='check')return`<label class="ck"><input type="checkbox" name="${f.k}"${v?' checked':''}> ${f.l}</label>`;
 if(f.t==='area')return`<label>${f.l}<textarea name="${f.k}" rows="2">${esc(v)}</textarea></label>`;
 const ty=f.t||'text';return`<label>${f.l}<input name="${f.k}" type="${ty}"${ty==='number'?' step="any" inputmode="decimal"':''} value="${esc(v)}"${r}></label>`}
function sheet(title,fields,onSave,onDel,saveLabel){
 const el=document.createElement('div');el.className='ov';
 el.innerHTML=`<form class="sh"><h3>${esc(title)}</h3>${fields.map(fh).join('')}<div class="row"><button class="btn">${saveLabel||'Simpan'}</button>${onDel?'<button type="button" class="btn dng" id="d">Hapus</button>':''}<button type="button" class="btn ghost" id="c">Batal</button></div></form>`;
 document.body.append(el);const fm=el.querySelector('form'),close=()=>el.remove();
 el.querySelector('#c').onclick=close;
 if(onDel)el.querySelector('#d').onclick=async()=>{if(!confirm('Hapus data ini? Tidak bisa dibatalkan.'))return;try{await onDel();close();render()}catch(e){}};
 fm.onsubmit=async e=>{e.preventDefault();const v={};
  for(const f of fields){const x=fm.elements[f.k];
   if(f.t==='check')v[f.k]=x.checked;
   else if(f.t==='number')v[f.k]=x.value===''?(f.z?0:null):parseFloat(x.value);
   else{const s=x.value.trim();v[f.k]=s===''?null:s}}
  try{await onSave(v);close();render()}catch(e){}}}

/* ---------- setup & login ---------- */
function setup(){$('#nav').style.display='none';const c=JSON.parse(localStorage.getItem(CFG)||'{}');
 $('#main').innerHTML=`<h1>Setup Supabase</h1><p class="mut">Isi sekali saja. Pakai <b>Project URL</b> dan <b>anon/publishable key</b>. Jangan pernah pakai service_role key.</p><form class="card" id="f"><label>Project URL<input id="u" value="${esc(c.url||'')}" placeholder="https://xxxx.supabase.co" required></label><label>Anon / publishable key<input id="k" value="${esc(c.key||'')}" required></label><button class="btn">Simpan</button></form>`;
 $('#f').onsubmit=e=>{e.preventDefault();localStorage.setItem(CFG,JSON.stringify({url:$('#u').value.trim().replace(/\/$/,''),key:$('#k').value.trim()}));boot()}}
function login(){$('#nav').style.display='none';
 $('#main').innerHTML=`<h1>Customstuff Recap</h1><form class="card" id="f"><label>Email<input id="e" type="email" autocomplete="username" required></label><label>Password<input id="p" type="password" autocomplete="current-password" required></label><button class="btn">Masuk</button></form><p class="mut"><a href="#" onclick="A.reset();return false">Ubah setup Supabase</a></p>`;
 $('#f').onsubmit=async e=>{e.preventDefault();const{error}=await sb.auth.signInWithPassword({email:$('#e').value,password:$('#p').value});if(error)toast('Gagal masuk: '+error.message)}}
A.reset=()=>{localStorage.removeItem(CFG);sb=null;setup()};

/* ---------- navigation ---------- */
const NAV=[['home','🏠','Beranda'],['po','📦','PO'],['exp','🧾','Biaya'],['rep','📊','Laporan'],['more','⚙️','Lainnya']];
const go=(p,x={})=>{Object.assign(S,{page:p},x);render();scrollTo(0,0)};
async function render(){
 if(!sb)return setup();if(!session)return login();
 const base=['poDetail','order'].includes(S.page)?'po':S.page;
 $('#nav').style.display='flex';
 $('#nav').innerHTML=NAV.map(n=>`<button class="${n[0]===base?'on':''}" onclick="go('${n[0]}',{${n[0]==='po'?'po:null,folder:null':''}})">${n[1]}<br>${n[2]}</button>`).join('');
 $('#main').innerHTML='<p class="mut">Memuat…</p>';
 try{await loadF();$('#main').innerHTML=await PAGES[S.page]()}catch(e){$('#main').innerHTML=`<p class="err">Gagal memuat: ${esc(e.message)}</p>`}}

/* ---------- beranda ---------- */
PAGES.home=async()=>{
 const[fin,un,os]=await Promise.all([q(sb.from('v_po_finance').select('*')),q(sb.from('v_unallocated_expenses').select('total')),q(sb.from('v_order_summary').select('remaining,payment_status'))]);
 const lb=+localStorage.getItem('cs_lastbackup')||0,d=lb?Math.floor((Date.now()-lb)/864e5):null;
 const owed=os.filter(o=>o.payment_status!=='lunas'),laba=sum(fin,'laba_bersih');
 return`<h1>Beranda</h1>
 ${d===null||d>=7?`<div class="card" style="background:var(--soft)">⚠️ ${d===null?'Belum pernah backup.':'Terakhir backup '+d+' hari lalu.'} <a href="#" onclick="go('more');return false">Backup sekarang</a></div>`:''}
 <div class="row" style="margin-bottom:10px"><button class="btn sm" onclick="A.quickOrder()">+ Order</button><button class="btn sm" onclick="A.expForm()">+ Pengeluaran</button><button class="btn sm" onclick="go('po');setTimeout(A.poForm,50)">+ PO</button></div>
 <div class="grid"><div class="met">Omzet<b>${rp(sum(fin,'omzet'))}</b></div><div class="met">Total biaya<b>${rp(sum(fin,'total_biaya'))}</b></div>
 <div class="met">Laba bersih<b class="${laba<0?'neg':'pos'}">${rp(laba)}</b></div><div class="met">Jumlah PO<b>${fin.length}</b></div>
 <div class="met">Belum lunas<b>${owed.length} order</b><span class="mut">${rp(sum(owed,'remaining'))}</span></div>
 <div class="met tap" onclick="go('exp',{onlyUn:true})">Belum dialokasikan<b>${rp(sum(un,'total'))}</b><span class="mut">${un.length} pengeluaran</span></div></div>
 <p class="mut">Omzet = total order. Laba = omzet dikurangi modal & biaya PO. Uang masuk dicatat terpisah di tiap order.</p>`};
A.quickOrder=async()=>{const p=await q(sb.from('pos').select('id,name').eq('archived',false).order('po_date',{ascending:false}));
 if(!p.length)return toast('Buat PO dulu');
 sheet('Order untuk PO mana?',[{k:'po',l:'PO',t:'select',o:p.map(x=>[x.id,x.name])}],async v=>{S.po=v.po;S.page='poDetail';S.tab='order';setTimeout(()=>A.orderForm(v.po),80)},null,'Lanjut')};
