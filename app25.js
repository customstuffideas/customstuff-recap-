/* ---------- Tahap H (5/5): catatan terakhir dan halaman Panduan & Batasan ---------- */
const _act2=PAGES.activity;
PAGES.activity=async()=>{const h=await _act2();
 const src=[['pos','Batch PO'],['orders','Order'],['expenses','Pengeluaran'],['stock_movements','Stok'],['todos','Reminder']];
 const rs=await Promise.all(src.map(([t,l])=>q(sb.from(t).select('notes,created_at').not('notes','is',null).order('created_at',{ascending:false}).limit(1)).then(r=>r[0]?{...r[0],l}:null).catch(()=>null)));
 const n=rs.filter(Boolean).sort((a,b)=>(b.created_at||'').localeCompare(a.created_at||''))[0];
 const row=`<div class="row" style="cursor:default"><span class="iconbox">✎</span><div><b>Catatan terakhir</b><div class="desc">${n?esc(n.notes)+' · '+n.l+' · '+(n.created_at?new Date(n.created_at).toLocaleDateString('id-ID'):''):'Belum ada catatan'}</div></div></div>`;
 return h.replace('<div class="sect"><h3>Riwayat</h3></div>',()=>row+'<div class="sect"><h3>Riwayat</h3></div>')};
MENU.push(['panduan','?','Panduan & Batasan']);PGS.push(['panduan','Panduan & Batasan']);
const GD=(t,b)=>`<div class="card"><h3>${t}</h3>${b}</div>`,PP=t=>`<p class="desc">${t}</p>`;
PAGES.panduan=async()=>head('Panduan & Batasan','Cara memakai, menyimpan, backup, restore, dan memasang aplikasi.')+
 GD('Alur dasar',PP('Buat folder, lalu batch PO di dalamnya. Isi produk dan harga di batch, lalu masukkan customer atau order. Catat biaya, pakai template atau stok bila perlu, dan lihat hasilnya di Beranda dan Laporan.'))+
 GD('Di mana data tersimpan',PP('Semua data tersimpan di database Supabase milikmu, bukan di HP. Kamu masuk dengan email dan password. Data tetap ada selama project Supabase aktif.'))+
 GD('Backup',PP('Buka Backup & Export lalu ketuk Backup sekarang. File .json terunduh ke HP. Lakukan rutin (misalnya seminggu sekali) dan simpan salinannya di tempat lain seperti Google Drive. Backup otomatis tidak ada karena aplikasi ini tidak punya server sendiri.'))+
 GD('Restore',PP('Buka Backup & Export, ketuk Restore, pilih file backup, lihat pratinjau, lalu konfirmasi. Data digabungkan ke data yang sudah ada dan tidak ada yang dihapus. Baris dengan ID yang sama diperbarui sesuai file.'))+
 GD('Memasang di layar utama',PP('Buka alamat aplikasi di Chrome, ketuk menu ⋮, lalu pilih Tambahkan ke layar utama atau Instal aplikasi. Pemasangan butuh alamat HTTPS, dan GitHub Pages sudah menyediakannya.'))+
 GD('Offline',PP('Tampilan aplikasi bisa terbuka tanpa internet, tapi datanya butuh internet karena tersimpan di Supabase. Jadi tanpa internet kamu belum bisa melihat atau mencatat data.'))+
 GD('Aturan hitung',PP('Omzet dihitung otomatis dari order. Uang masuk dicatat terpisah dan bukan laba. Modal produk memakai biaya produksi yang dicatat di batch, atau harga modal produk bila belum ada. Pembelian stok belum menjadi biaya sampai stoknya dipakai, dan ongkir restock ikut masuk ke harga stok (rata-rata bergerak). Pengeluaran yang belum ditautkan ke PO tidak ikut laba PO manapun. Harga di order, template, dan pemakaian stok disimpan sebagai salinan, jadi laporan lama tidak berubah.'))+
 GD('Batasan',PP('Notifikasi hanya muncul saat aplikasi dibuka, bukan saat tertutup. PDF dibuat lewat jendela cetak (Simpan sebagai PDF). Setahuku project Supabase gratis bisa dijeda kalau lama tidak dipakai, jadi buka aplikasinya minimal seminggu sekali.'))+
 GD('Keamanan',PP('Di aplikasi hanya pakai key Publishable (atau anon). Jangan pernah memakai key Secret atau service_role. Matikan pendaftaran user baru di Supabase supaya hanya kamu yang bisa masuk.'));
