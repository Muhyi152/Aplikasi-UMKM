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

// ================== DATA INITIALIZATION ==================
let produk = JSON.parse(localStorage.getItem("produk")) || [];
let riwayat = JSON.parse(localStorage.getItem("riwayat")) || [];
let editIndex = null;
let keranjangData = [];
let totalBayar = 0;

// ================== SWEETALERT MANTAP (TOAST) ==================
const Toast = Swal.mixin({
    toast: true,
    position: 'top',
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
});

// ================== HELPER ==================
function formatRupiah(angka = 0) {
    return Number(angka).toLocaleString("id-ID");
}

function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(section => {
        section.style.display = 'none';
        section.classList.remove('active');
    });
    const activePage = document.getElementById(pageId);
    if (activePage) {
        activePage.style.display = 'block';
        activePage.classList.add('active');
    }
    if (pageId === 'transaksi') renderProdukTransaksi();
    if (pageId === 'produk') renderProduk();
    if (pageId === 'riwayat') renderRiwayat();
    
    // Fungsi closeMenu diasumsikan ada di HTML untuk mobile sidebar
    if (typeof closeMenu === "function") closeMenu();
}

// ================== FOTO (FLUTTER BRIDGE) ==================
function ambilFoto() {
    if (window.ImageChannel) {
        window.ImageChannel.postMessage("pick");
    } else {
        Swal.fire({
            icon: 'info',
            title: 'Aplikasi Mobile',
            text: 'Fitur galeri hanya tersedia di aplikasi Android/iOS.',
            confirmButtonColor: '#ff5722'
        });
    }
}

window.setFoto = function(base64) {
    if (fotoProduk) fotoProduk.value = base64;
    if (previewFoto) {
        previewFoto.src = base64;
        previewFoto.style.display = "block";
    }
    Toast.fire({
        icon: 'success',
        title: 'Foto berhasil dimuat'
    });
};

// ================== MANAJEMEN PRODUK ==================
function simpanProduk() {
    const nama = namaProduk.value.trim();
    const harga = parseInt(hargaProduk.value);
    const fotoBase64 = fotoProduk.value;

    if (!nama || isNaN(harga) || harga <= 0 || !fotoBase64) {
        Swal.fire('Oops!', 'Nama, Harga, dan Foto wajib diisi!', 'warning');
        return;
    }

    if (editIndex !== null) {
        produk[editIndex] = { nama, harga, foto: fotoBase64 };
        editIndex = null;
        Swal.fire('Berhasil!', 'Produk telah diperbarui.', 'success');
    } else {
        produk.push({ nama, harga, foto: fotoBase64 });
        Toast.fire({ icon: 'success', title: 'Produk ditambahkan' });
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
                <div class="produk-action" style="padding:10px; display:flex; gap:5px;">
                    <button onclick="editProduk(${i})" style="background:#ff9800; flex:1; color:white; border:none; padding:8px; border-radius:8px;">Edit</button>
                    <button onclick="hapusProduk(${i})" style="background:#f44336; flex:1; color:white; border:none; padding:8px; border-radius:8px;">Hapus</button>
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hapusProduk(i) {
    Swal.fire({
        title: 'Hapus Produk?',
        text: "Produk ini akan hilang dari daftar.",
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
            Toast.fire({ icon: 'success', title: 'Produk dihapus' });
        }
    });
}

function resetForm() {
    namaProduk.value = "";
    hargaProduk.value = "";
    fotoProduk.value = "";
    previewFoto.style.display = "none";
    btnSimpan.innerText = "Tambah Produk";
    editIndex = null;
}

// ================== TRANSAKSI (KASIR) ==================
function renderProdukTransaksi() {
    if (!produkTransaksi) return;
    produkTransaksi.innerHTML = "";
    if (produk.length === 0) {
        produkTransaksi.innerHTML = "<p style='grid-column: 1/-1; text-align:center;'>Belum ada produk.</p>";
        return;
    }
    produk.forEach((p, i) => {
        produkTransaksi.innerHTML += `
            <div class="produk-card">
                <img src="${p.foto}">
                <div class="info">
                    <h4>${p.nama}</h4>
                    <p>Rp ${formatRupiah(p.harga)}</p>
                </div>
                <button class="btn-beli" onclick="beliProduk(${i})" style="border:none; cursor:pointer;">🛒 Beli</button>
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
    Toast.fire({ icon: 'success', title: `${p.nama} masuk keranjang` });
    renderKeranjang();
}

function renderKeranjang() {
    if (!keranjang) return;
    keranjang.innerHTML = "";
    totalBayar = 0;
    keranjangData.forEach((item, i) => {
        totalBayar += item.subtotal;
        keranjang.innerHTML += `
            <tr>
                <td>${item.nama}</td>
                <td>${item.qty}x</td>
                <td>Rp ${formatRupiah(item.subtotal)}</td>
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
    if (sisa < 0) {
        kembalian.classList.add('text-danger');
    } else {
        kembalian.classList.remove('text-danger');
    }
}

if (bayarInput) {
    bayarInput.addEventListener("input", hitungKembalian);
}

// ================== CHECKOUT & PRINT ==================
function checkout() {
    if (keranjangData.length === 0) {
        Swal.fire('Keranjang Kosong', 'Pilih produk terlebih dahulu!', 'info');
        return;
    }
    
    const bayarVal = Number(bayarInput.value) || 0;
    if (bayarVal < totalBayar) {
        Swal.fire('Uang Kurang!', 'Jumlah bayar tidak mencukupi total belanja.', 'error');
        return;
    }

    const transaksiBaru = {
        id: "TRX-" + Date.now(),
        tanggal: new Date().toLocaleString('id-ID'),
        items: [...keranjangData],
        total: totalBayar,
        bayar: bayarVal,
        kembali: bayarVal - totalBayar,
        toko: "KASIR UMKM PRO",
        alamat: "Jl. Raya Bisnis Digital No. 1"
    };

    // 1. Simpan ke LocalStorage
    let listRiwayat = JSON.parse(localStorage.getItem("riwayat")) || [];
    listRiwayat.push(transaksiBaru);
    localStorage.setItem("riwayat", JSON.stringify(listRiwayat));

    // 2. TRIGGER CETAK KE PRINTER FLUTTER
    if (window.PrintChannel) {
        window.PrintChannel.postMessage(JSON.stringify(transaksiBaru));
    }

    Swal.fire({
        icon: 'success',
        title: 'Transaksi Berhasil!',
        text: 'Struk sedang dicetak...',
        showConfirmButton: false,
        timer: 2500
    });

    // 3. Reset Form Kasir
    keranjangData = [];
    bayarInput.value = "";
    renderKeranjang();
    
    // 4. Pindah ke halaman riwayat
    setTimeout(() => showPage('riwayat'), 2500);
}

function cetakUlang(index) {
    const dataRiwayat = JSON.parse(localStorage.getItem("riwayat")) || [];
    const data = dataRiwayat[index];
    
    if (window.PrintChannel && data) {
        window.PrintChannel.postMessage(JSON.stringify(data));
        Toast.fire({ icon: 'info', title: 'Mengirim data ke printer...' });
    } else {
        Swal.fire('Gagal', 'Printer tidak terdeteksi.', 'error');
    }
}

function renderRiwayat() {
    if (!riwayatList) return;
    const dataRiwayat = JSON.parse(localStorage.getItem("riwayat")) || [];
    riwayatList.innerHTML = "";

    if (dataRiwayat.length === 0) {
        riwayatList.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px;">Belum ada riwayat.</td></tr>`;
        return;
    }

    // Map untuk mempertahankan index asli saat di-reverse
    const sortedRiwayat = dataRiwayat.map((item, index) => ({...item, originalIndex: index})).reverse();

    sortedRiwayat.forEach((item) => {
        riwayatList.innerHTML += `
            <tr>
                <td>${item.tanggal}</td>
                <td style="font-weight:bold; color:#d84315;">Rp ${formatRupiah(item.total)}</td>
                <td style="display:flex; gap:5px; justify-content:center;">
                    <button onclick="cetakUlang(${item.originalIndex})" style="background:#2196f3; color:white; border:none; padding:8px; border-radius:8px; cursor:pointer;">🖨️</button>
                    <button onclick="hapusRiwayat(${item.originalIndex})" style="background:#f44336; color:white; border:none; padding:8px; border-radius:8px; cursor:pointer;">🗑️</button>
                </td>
            </tr>`;
    });
}

function hapusRiwayat(index) {
    Swal.fire({
        title: 'Hapus Riwayat?',
        text: "Catatan transaksi ini akan dihapus permanen.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#f44336',
        confirmButtonText: 'Ya, Hapus!'
    }).then((result) => {
        if (result.isConfirmed) {
            let listRiwayat = JSON.parse(localStorage.getItem("riwayat")) || [];
            listRiwayat.splice(index, 1);
            localStorage.setItem("riwayat", JSON.stringify(listRiwayat));
            renderRiwayat();
            Toast.fire({ icon: 'success', title: 'Riwayat dihapus' });
        }
    });
}

// ================== INITIALIZATION ==================
document.addEventListener("DOMContentLoaded", () => {
    showPage("produk");
});
