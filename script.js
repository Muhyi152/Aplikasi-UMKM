// ================== DOM ELEMENTS ==================
const namaProduk = document.getElementById("namaProduk");
const hargaProduk = document.getElementById("hargaProduk");
const fotoProduk = document.getElementById("fotoProduk"); 
const btnSimpan = document.getElementById("btnSimpan");
const produkList = document.getElementById("produkList");
const produkTransaksi = document.getElementById("produkTransaksi");
const keranjang = document.getElementById("keranjang");
const total = document.getElementById("total");
const bayarInput = document.getElementById("bayar");
const kembalian = document.getElementById("kembalian");
const riwayatList = document.getElementById("riwayatList");
const previewFoto = document.getElementById("previewFoto");
const totalHariIniBanner = document.getElementById("totalHariIni");

// ================== DATA INITIALIZATION ==================
let produk = JSON.parse(localStorage.getItem("produk")) || [];
let editIndex = null;
let keranjangData = [];
let totalBayar = 0;

// ================== SWEETALERT CONFIG ==================
const Toast = Swal.mixin({
    toast: true,
    position: 'top',
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
});

// ================== HELPERS ==================
function formatRupiah(angka = 0) {
    return Number(angka).toLocaleString("id-ID");
}

function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    const activePage = document.getElementById(pageId);
    if (activePage) {
        activePage.classList.add('active');
        activePage.style.display = 'block';
    }
    
    // Auto-refresh data saat pindah halaman
    if (pageId === 'transaksi') renderProdukTransaksi();
    if (pageId === 'produk') renderProduk();
    if (pageId === 'riwayat') renderRiwayat();
    if (typeof closeMenu === "function") closeMenu();
}

// ================== FOTO DENGAN KOMPRESI (SOLUSI MEMORI) ==================
function ambilFoto() {
    if (window.ImageChannel) {
        window.ImageChannel.postMessage("pick");
    } else {
        Swal.fire('Info', 'Fitur galeri hanya tersedia di aplikasi HP.', 'info');
    }
}

window.setFoto = function(base64) {
    const img = new Image();
    img.onload = function() {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400; // Ukuran diperkecil agar localStorage tidak cepat penuh
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Kompresi ke JPEG kualitas 0.6 (60%)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
        fotoProduk.value = compressedBase64;
        previewFoto.src = compressedBase64;
        previewFoto.style.display = "block";
        
        Toast.fire({ icon: 'success', title: 'Foto berhasil dimuat' });
    };
    img.src = base64;
};

// ================== MANAJEMEN PRODUK ==================
function simpanProduk() {
    const nama = namaProduk.value.trim();
    const harga = parseInt(hargaProduk.value);
    const fotoBase64 = fotoProduk.value;

    if (!nama || !harga || !fotoBase64) {
        Swal.fire('Oops!', 'Nama, Harga, dan Foto wajib diisi!', 'warning');
        return;
    }

    if (editIndex !== null) {
        // Logika UPDATE
        produk[editIndex] = { nama, harga, foto: fotoBase64 };
        editIndex = null;
        Swal.fire({
            icon: 'success',
            title: 'Berhasil Update!',
            text: `Data "${nama}" telah diperbarui.`,
            timer: 1500,
            showConfirmButton: false
        });
    } else {
        // Logika TAMBAH BARU
        produk.push({ nama, harga, foto: fotoBase64 });
        Toast.fire({ icon: 'success', title: 'Produk berhasil ditambah' });
    }

    localStorage.setItem("produk", JSON.stringify(produk));
    resetForm();
    renderProduk();
}

function renderProduk() {
    if (!produkList) return;
    produkList.innerHTML = "";
    produk.forEach((p, i) => {
        produkList.innerHTML += `
            <div class="produk-card">
                <img src="${p.foto}">
                <div class="info">
                    <h4>${p.nama}</h4>
                    <p>Rp ${formatRupiah(p.harga)}</p>
                </div>
                <div style="padding:10px; display:flex; gap:5px;">
                    <button onclick="editProduk(${i})" style="background:#ff9800; flex:1; color:white; border:none; padding:8px; border-radius:8px; cursor:pointer;">Edit</button>
                    <button onclick="hapusProduk(${i})" style="background:#f44336; flex:1; color:white; border:none; padding:8px; border-radius:8px; cursor:pointer;">Hapus</button>
                </div>
            </div>`;
    });
}

function editProduk(i) {
    editIndex = i;
    namaProduk.value = produk[i].nama;
    hargaProduk.value = produk[i].harga;
    fotoProduk.value = produk[i].foto;
    previewFoto.src = produk[i].foto;
    previewFoto.style.display = "block";
    btnSimpan.innerText = "Update Produk";
    btnSimpan.style.background = "#ff9800";
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    Toast.fire({ icon: 'info', title: 'Mode Edit: ' + produk[i].nama });
}

function hapusProduk(i) {
    Swal.fire({
        title: 'Hapus Produk?',
        text: `Produk "${produk[i].nama}" akan dihapus permanen.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#f44336',
        cancelButtonColor: '#607d8b',
        confirmButtonText: 'Ya, Hapus!',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            produk.splice(i, 1);
            localStorage.setItem("produk", JSON.stringify(produk));
            renderProduk();
            Swal.fire('Terhapus!', 'Produk telah dihapus.', 'success');
        }
    });
}

function resetForm() {
    namaProduk.value = "";
    hargaProduk.value = "";
    fotoProduk.value = "";
    previewFoto.style.display = "none";
    btnSimpan.innerText = "Simpan Produk";
    btnSimpan.style.background = "#4CAF50";
    editIndex = null;
}

// ================== KASIR (TRANSAKSI) ==================
function renderProdukTransaksi() {
    if (!produkTransaksi) return;
    produkTransaksi.innerHTML = produk.length === 0 ? "<p style='text-align:center; width:100%; grid-column: 1/-1;'>Belum ada produk.</p>" : "";
    produk.forEach((p, i) => {
        produkTransaksi.innerHTML += `
            <div class="produk-card">
                <img src="${p.foto}">
                <div class="info">
                    <h4>${p.nama}</h4>
                    <p>Rp ${formatRupiah(p.harga)}</p>
                </div>
                <button onclick="beliProduk(${i})" style="width:100%; padding:10px; background:#4CAF50; color:white; border:none; cursor:pointer; font-weight:bold;">🛒 Tambah</button>
            </div>`;
    });
}

function beliProduk(i) {
    const p = produk[i];
    const item = keranjangData.find(x => x.nama === p.nama);
    if (item) { 
        item.qty++; 
        item.subtotal = item.qty * item.harga; 
    } else { 
        keranjangData.push({ nama: p.nama, harga: p.harga, qty: 1, subtotal: p.harga }); 
    }
    Toast.fire({ icon: 'success', title: p.nama + ' ditambah' });
    renderKeranjang();
}

function renderKeranjang() {
    keranjang.innerHTML = ""; 
    totalBayar = 0;
    keranjangData.forEach((item, i) => {
        totalBayar += item.subtotal;
        keranjang.innerHTML += `
            <tr>
                <td>${item.nama}</td>
                <td>${item.qty}x</td>
                <td>${formatRupiah(item.subtotal)}</td>
                <td><button onclick="hapusItem(${i})" style="color:red; background:none; border:none; font-size:1.2rem; cursor:pointer;">✖</button></td>
            </tr>`;
    });
    total.innerText = formatRupiah(totalBayar);
    hitungKembalian();
}

function hapusItem(i) { 
    keranjangData.splice(i, 1); 
    renderKeranjang(); 
}

function hitungKembalian() {
    const bayarVal = Number(bayarInput.value) || 0;
    const sisa = bayarVal - totalBayar;
    kembalian.innerText = formatRupiah(sisa > 0 ? sisa : 0);
    if (sisa < 0) kembalian.classList.add('text-danger');
    else kembalian.classList.remove('text-danger');
}
bayarInput.addEventListener("input", hitungKembalian);

function checkout() {
    const bayarVal = Number(bayarInput.value) || 0;
    if (keranjangData.length === 0) {
        Swal.fire('Gagal', 'Keranjang masih kosong!', 'error'); return;
    }
    if (bayarVal < totalBayar) {
        Swal.fire('Uang Kurang', 'Jumlah bayar tidak cukup!', 'warning'); return;
    }

    const trx = { 
        id: "TRX-" + Date.now(), 
        tanggal: new Date().toLocaleString('id-ID'), 
        items: [...keranjangData], 
        total: totalBayar, 
        bayar: bayarVal, 
        kembali: bayarVal - totalBayar 
    };

    let riwayat = JSON.parse(localStorage.getItem("riwayat")) || [];
    riwayat.push(trx);
    localStorage.setItem("riwayat", JSON.stringify(riwayat));

    // Kirim ke Printer Flutter
    if (window.PrintChannel) {
        window.PrintChannel.postMessage(JSON.stringify(trx));
    }
    
    Swal.fire('Berhasil!', 'Transaksi Selesai & Struk Dicetak', 'success').then(() => {
        keranjangData = []; 
        bayarInput.value = ""; 
        renderKeranjang(); 
        showPage('riwayat');
    });
}

// ================== RIWAYAT & PENDAPATAN ==================
function renderRiwayat() {
    if (!riwayatList) return;
    const data = JSON.parse(localStorage.getItem("riwayat")) || [];
    riwayatList.innerHTML = "";
    
    const hariIni = new Date().toLocaleDateString('id-ID');
    let pendapatanHariIni = 0;

    if (data.length === 0) {
        riwayatList.innerHTML = "<tr><td colspan='3' style='text-align:center; padding:20px;'>Belum ada transaksi.</td></tr>";
        totalHariIniBanner.innerText = "Rp 0";
        return;
    }

    // Urutkan dari yang terbaru (reverse)
    const reversedData = [...data].reverse();

    reversedData.forEach((item, index) => {
        const originalIndex = data.length - 1 - index;

        // Hitung pendapatan hari ini
        if (item.tanggal.includes(hariIni)) {
            pendapatanHariIni += item.total;
        }

        riwayatList.innerHTML += `
            <tr>
                <td style="font-size:0.8rem;">${item.tanggal}</td>
                <td style="font-weight:bold;">Rp ${formatRupiah(item.total)}</td>
                <td style="text-align:center;">
                    <div style="display:flex; gap:5px; justify-content:center;">
                        <button onclick="reprintStruk(${originalIndex})" style="background:#2196F3; color:white; border:none; padding:8px; border-radius:6px; cursor:pointer;">🖨️</button>
                        <button onclick="hapusRiwayat(${originalIndex})" style="background:#f44336; color:white; border:none; padding:8px; border-radius:6px; cursor:pointer;">🗑️</button>
                    </div>
                </td>
            </tr>`;
    });

    totalHariIniBanner.innerText = "Rp " + formatRupiah(pendapatanHariIni);
}

function reprintStruk(index) {
    const data = JSON.parse(localStorage.getItem("riwayat")) || [];
    const trx = data[index];
    if (window.PrintChannel && trx) {
        window.PrintChannel.postMessage(JSON.stringify(trx));
        Toast.fire({ icon: 'success', title: 'Mencetak ulang struk...' });
    } else {
        Swal.fire('Info', 'Fitur cetak hanya tersedia di aplikasi.', 'info');
    }
}

function hapusRiwayat(index) {
    Swal.fire({
        title: 'Hapus Riwayat?',
        text: "Data transaksi ini akan dihapus permanen.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#f44336',
        confirmButtonText: 'Ya, Hapus!'
    }).then((result) => {
        if (result.isConfirmed) {
            let riwayat = JSON.parse(localStorage.getItem("riwayat")) || [];
            riwayat.splice(index, 1);
            localStorage.setItem("riwayat", JSON.stringify(riwayat));
            renderRiwayat();
            Toast.fire({ icon: 'success', title: 'Riwayat dihapus' });
        }
    });
}

function resetPendapatanHariIni() {
    Swal.fire({
        title: 'Reset Hari Ini?',
        text: "Semua riwayat tanggal hari ini akan dihapus!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Ya, Reset!'
    }).then((result) => {
        if (result.isConfirmed) {
            let dataRiwayat = JSON.parse(localStorage.getItem("riwayat")) || [];
            const hariIni = new Date().toLocaleDateString('id-ID');
            
            // Filter: Hanya simpan yang bukan hari ini
            const sisaData = dataRiwayat.filter(item => !item.tanggal.includes(hariIni));
            
            localStorage.setItem("riwayat", JSON.stringify(sisaData));
            renderRiwayat();
            Swal.fire('Berhasil', 'Data hari ini telah dibersihkan.', 'success');
        }
    });
}

// ================== INITIAL LOAD ==================
document.addEventListener("DOMContentLoaded", () => { 
    renderProduk(); 
    showPage('produk'); 
});
