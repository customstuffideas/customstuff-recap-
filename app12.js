/* ---------- Tahap E (1/2): Quick Add yang bisa diatur ---------- */
let QA=[],qaBusy=null;
const QADEF=[{label:'Order',icon:'▤',color:'#f9a9ca',category:'Order',action_type:'order',action_params:{}},{label:'Pengeluaran',icon:'◈',color:'#f9a9ca',category:'Keuangan',action_type:'expense',action_params:{}},{label:'PO Baru',icon:'□',color:'#f9a9ca',category:'Order',action_type:'po',action_params:{}},{label:'Restock',icon:'＋',color:'#f9a9ca',category:'Stok',action_type:'restock',action_params:{}},{label:'Reminder',icon:'✧',color:'#f9a9ca',category:'Lainnya',action_type:'todo',action_params:{}}];
const QAQ=()=>q(sb.from('quick_actions').select('*').order('sort_order').order('created_at'));
document.head.insertAdjacentHTML('beforeend','<style>.lav{background:#ffeadc}</style>');
let qaFix=false;
async function qaLoad(){let r=await QAQ();
 if(!qaFix){qaFix=true;const f=await q(sb.from('settings').select('key').eq('key','qa_color_fix'));if(!f.length){const o=r.filter(x=>(x.label==='Restock'&&x.color==='#8fd5b5')||(x.label==='Reminder'&&x.color==='#b9a8ee'));await Promise.all(o.map(x=>upd('quick_actions',x.id,{color:'#f9a9ca'})));await sb.from('settings').insert({key:'qa_color_fix',value:{v:1}});if(o.length)r=await QAQ()}}
 if(!r.length){qaBusy=qaBusy||(async()=>{const f=await q(sb.from('settings').select('key').eq('key','quick_seeded'));if(!f.length){await q(sb.from('quick_actions').insert(QADEF.map((d,i)=>({...d,sort_order:i}))));await sb.from('settings').insert({key:'quick_seeded',value:{v:1}})}})();try{await qaBusy}finally{qaBusy=null}r=await QAQ()}
 QA=r;return r}
const PGS=[['home','Beranda'],['folders','Folder & PO'],['orders','Data Orderan'],['addorder','Tambah Order'],['expenses','Biaya & Pengeluaran'],['inventory','Stok & Pembelian'],['calculator','Kalkulator & Template'],['reports','Laporan Keuangan'],['vendors','Vendor & Sample'],['reminders','Reminder & To-do'],['activity','Aktivitas Terakhir'],['backup','Backup & Export'],['settings','Pengaturan']];
const pickStock=async(title,fn)=>{const s=await q(sb.from('stock_items').select('id,name,unit').order('name'));if(!s.length)return toast('Belum ada item stok. Buat dulu di Stok & Pembelian.');
 sheet(title,[{k:'id',l:'Item stok',t:'select',o:s.map(x=>[x.id,x.name+' ('+x.unit+')'])}],v=>{setTimeout(()=>fn(v.id),60)},null,'Lanjut')};
const pickOrder=async()=>{const o=(await q(sb.from('v_order_summary').select('*').order('order_date',{ascending:false}))).filter(x=>x.payment_status!=='lunas');if(!o.length)return toast('Semua order sudah lunas.');
 sheet('Pembayaran untuk order mana?',[{k:'id',l:'Order belum lunas',t:'select',o:o.map(x=>[x.order_id,x.order_no+' · '+x.buyer+' (sisa '+rp(x.remaining)+')'])}],v=>{const x=o.find(y=>y.order_id===v.id);S.order=v.id;setTimeout(()=>A.payForm(Math.max(0,x.remaining)),60)},null,'Lanjut')};
const QACT={order:['Tambah customer/order',()=>go('addorder')],expense:['Catat pengeluaran / belanja',()=>A.expForm()],po:['Batch PO baru',()=>A.poForm()],folder:['Folder baru',()=>{S.folder=null;A.folderForm()}],todo:['Tambah reminder',()=>A.todoForm()],payment:['Catat pembayaran masuk (pemasukan)',pickOrder],restock:['Restock stok (pembelian)',()=>pickStock('Restock item mana?',A.restock)],usage:['Pakai stok',()=>pickStock('Pakai item mana?',A.usage)],stock_new:['Item stok baru',()=>A.stockForm()],page:['Buka halaman',p=>go(p.page||'home')]};
A.qa=id=>{const b=QA.find(x=>x.id===id);if(!b)return;const a=QACT[b.action_type];if(!a)return toast('Aksi tombol ini tidak dikenal. Ubah tombolnya.');a[1](b.action_params||{})};
const _home2=PAGES.home;
PAGES.home=async()=>{const h=await _home2(),qa=await qaLoad();
 const blk=qa.length?`<div class="quick">${qa.map(b=>`<button style="background:${esc(b.color)}" onclick="A.qa('${b.id}')"><span class="icon">${esc(b.icon)}</span>${esc(b.label)}</button>`).join('')}</div>`:'<div class="card empty">Belum ada tombol. Ketuk Atur shortcut untuk menambah.</div>';
 return h.replace(/<div class="quick">[\s\S]*?<\/div>/,()=>blk).replace("onclick=\"go('settings')\">Atur shortcut",()=>"onclick=\"go('quickset')\">Atur shortcut")};
const _st=PAGES.settings;
PAGES.settings=async()=>{const h=await _st();return h.replace(/<p class="smallmuted">Tombol Quick Add[^<]*<\/p>/,()=>'<p class="smallmuted">Atur tombol pintas di Beranda: nama, ikon, warna, urutan, kategori, dan aksinya.</p><button class="btn light sm" onclick="go(\'quickset\')">Atur Quick Add</button>')};
