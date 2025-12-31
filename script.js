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
    if (typeof closeMenu === "function") closeMenu();
}

// ================== FOTO (FLUTTER BRIDGE) ==================
function ambilFoto() {
    if (window.ImageChannel) {
        window.ImageChannel.postMessage("pick");
    } else {
        alert("Gunakan aplikasi mobile untuk mengambil foto.");
    }
}

window.setFoto = function(base64) {
    if (fotoProduk) fotoProduk.value = base64;
    if (previewFoto) {
        previewFoto.src = base64;
        previewFoto.style.display = "block";
    }
};

// ================== MANAJEMEN PRODUK ==================
function simpanProduk() {
    const nama = namaProduk.value.trim();
    const harga = parseInt(hargaProduk.value);
    const fotoBase64 = fotoProduk.value;

    if (!nama || isNaN(harga) || harga <= 0 || !fotoBase64) {
        alert("Lengkapi data produk dan foto!");
        return;
    }

    if (editIndex !== null) {
        produk[editIndex] = { nama, harga, foto: fotoBase64 };
        editIndex = null;
    } else {
        produk.push({ nama, harga, foto: fotoBase64 });
    }

    localStorage.setItem("produk", JSON.stringify(produk));
    resetForm();
    renderProduk();
    alert("Produk disimpan!");
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
                    <button onclick="editProduk(${i})" style="background:#ff9800; flex:1; color:white;">Edit</button>
                    <button onclick="hapusProduk(${i})" style="background:#f44336; flex:1; color:white;">Hapus</button>
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
    window.scrollTo(0,0);
}

function hapusProduk(i) {
    if (confirm("Hapus produk ini?")) {
        produk.splice(i, 1);
        localStorage.setItem("produk", JSON.stringify(produk));
        renderProduk();
    }
}

function resetForm() {
    namaProduk.value = "";
    hargaProduk.value = "";
    fotoProduk.value = "";
    previewFoto.style.display = "none";
    btnSimpan.innerText = "Tambah Produk";
}

// ================== TRANSAKSI (KASIR) ==================
function renderProdukTransaksi() {
    if (!produkTransaksi) return;
    produkTransaksi.innerHTML = "";
    produk.forEach((p, i) => {
        produkTransaksi.innerHTML += `
            <div class="produk-card">
                <img src="${p.foto}">
                <div class="info">
                    <h4>${p.nama}</h4>
                    <p>Rp ${formatRupiah(p.harga)}</p>
                </div>
                <button class="btn-beli" onclick="beliProduk(${i})">🛒 Beli</button>
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
                <td><button onclick="hapusItem(${i})" style="color:red; background:none; border:none;">✖</button></td>
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
}

if (bayarInput) {
    bayarInput.addEventListener("input", hitungKembalian);
}

// ================== CHECKOUT & PRINT ==================
function checkout() {
    if (keranjangData.length === 0) return alert("Keranjang belanja kosong!");
    
    const bayarVal = Number(bayarInput.value) || 0;
    if (bayarVal < totalBayar) return alert("Uang pembayaran kurang!");

    // Buat data transaksi lengkap
    const transaksiBaru = {
        id: "TRX-" + Date.now(),
        tanggal: new Date().toLocaleString('id-ID'),
        items: [...keranjangData],
        total: totalBayar,
        bayar: bayarVal,
        kembali: bayarVal - totalBayar,
        toko: "KASIR UMKM PRO", // Opsional: Tambahkan info toko
        alamat: "Jl. Raya Ekonomi No. 1"
    };

    // 1. Simpan ke LocalStorage
    let listRiwayat = JSON.parse(localStorage.getItem("riwayat")) || [];
    listRiwayat.push(transaksiBaru);
    localStorage.setItem("riwayat", JSON.stringify(listRiwayat));

    // 2. TRIGGER CETAK KE PRINTER FLUTTER
    if (window.PrintChannel) {
        window.PrintChannel.postMessage(JSON.stringify(transaksiBaru));
    } else {
        console.log("PrintChannel tidak tersedia (Mungkin buka di browser biasa)");
    }

    alert("Transaksi Berhasil & Mencetak Struk...");

    // 3. Reset Form Kasir
    keranjangData = [];
    bayarInput.value = "";
    renderKeranjang();
    
    // 4. Pindah ke halaman riwayat
    showPage('riwayat');
}

// Fungsi Cetak Ulang (untuk dipanggil dari tabel riwayat)
function cetakUlang(index) {
    const dataRiwayat = JSON.parse(localStorage.getItem("riwayat")) || [];
    // Ambil data berdasarkan urutan asli (bukan urutan reverse)
    const data = dataRiwayat[index];
    
    if (window.PrintChannel && data) {
        window.PrintChannel.postMessage(JSON.stringify(data));
        alert("Mencetak ulang struk...");
    } else {
        alert("Printer tidak tersedia atau data tidak ditemukan.");
    }
}

function renderRiwayat() {
    if (!riwayatList) return;
    
    const dataRiwayat = JSON.parse(localStorage.getItem("riwayat")) || [];
    riwayatList.innerHTML = "";

    if (dataRiwayat.length === 0) {
        riwayatList.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px;">Belum ada riwayat transaksi.</td></tr>`;
        return;
    }

    // Kita reverse agar yang terbaru di atas, tapi simpan index aslinya
    const sortedRiwayat = dataRiwayat.map((item, index) => ({...item, originalIndex: index})).reverse();

    sortedRiwayat.forEach((item) => {
        riwayatList.innerHTML += `
            <tr>
                <td>${item.tanggal}</td>
                <td style="font-weight:bold; color:#d84315;">Rp ${formatRupiah(item.total)}</td>
                <td style="display:flex; gap:5px; justify-content:center;">
                    <button onclick="cetakUlang(${item.originalIndex})" style="background:#2196f3; color:white; border:none; padding:5px 8px; border-radius:5px;">🖨️</button>
                    <button onclick="hapusRiwayat(${item.originalIndex})" style="background:#f44336; color:white; border:none; padding:5px 8px; border-radius:5px;">🗑️</button>
                </td>
            </tr>`;
    });
}

function hapusRiwayat(index) {
    if (confirm("Hapus catatan riwayat ini?")) {
        let listRiwayat = JSON.parse(localStorage.getItem("riwayat")) || [];
        listRiwayat.splice(index, 1);
        localStorage.setItem("riwayat", JSON.stringify(listRiwayat));
        renderRiwayat();
    }
}

// ================== INITIALIZATION ==================
document.addEventListener("DOMContentLoaded", () => {
    showPage("produk");
});
