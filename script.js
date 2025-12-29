// ================== DOM ELEMENTS ==================
const namaProduk = document.getElementById("namaProduk");
const hargaProduk = document.getElementById("hargaProduk");
const fotoProduk = document.getElementById("fotoProduk");
const btnSimpan = document.getElementById("btnSimpan");

const produkList = document.getElementById("produkList");
const produkTransaksi = document.getElementById("produkTransaksi");

const keranjang = document.getElementById("keranjang");
const total = document.getElementById("total");

const bayar = document.getElementById("bayar");
const kembalian = document.getElementById("kembalian");

const riwayatList = document.getElementById("riwayatList");

// ================== DATA & STATE ==================
let produk = JSON.parse(localStorage.getItem("produk")) || [];
let riwayat = JSON.parse(localStorage.getItem("riwayat")) || [];

let editIndex = null;
let keranjangData = [];
let totalBayar = 0;

// ================== HELPER ==================
function formatRupiah(angka = 0) {
    return Number(angka).toLocaleString("id-ID");
}

// ================== NAVIGASI ==================
function showPage(id) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(id).classList.add("active");

    if (id === "produk") renderProduk();
    if (id === "transaksi") renderProdukTransaksi();
    if (id === "riwayat") tampilRiwayat();
}

// ================== MANAJEMEN PRODUK ==================
function simpanProduk() {
    const nama = namaProduk.value.trim();
    const harga = parseInt(hargaProduk.value);
    const file = fotoProduk.files[0];

    if (!nama || isNaN(harga) || harga <= 0) {
        alert("Nama dan harga wajib diisi dengan benar");
        return;
    }

    if (editIndex !== null) {
        // Mode Edit
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                produk[editIndex] = { nama, harga, foto: reader.result };
                aksiSelesaiSimpan();
            };
            reader.readAsDataURL(file);
        } else {
            produk[editIndex].nama = nama;
            produk[editIndex].harga = harga;
            aksiSelesaiSimpan();
        }
    } else {
        // Mode Tambah Baru
        if (!file) {
            alert("Gambar wajib diisi untuk produk baru");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            produk.push({ nama, harga, foto: reader.result });
            aksiSelesaiSimpan();
        };
        reader.readAsDataURL(file);
    }
}

function aksiSelesaiSimpan() {
    localStorage.setItem("produk", JSON.stringify(produk));
    editIndex = null;
    resetForm();
    renderProduk();
    alert("Produk berhasil disimpan!");
}

function renderProduk() {
    produkList.innerHTML = "";
    produk.forEach((p, i) => {
        produkList.innerHTML += `
        <div class="produk-card">
            <img src="${p.foto}">
            <h4>${p.nama}</h4>
            <p>Rp ${formatRupiah(p.harga)}</p>
            <div class="produk-action">
                <button class="btn-edit" onclick="editProduk(${i})">Edit</button>
                <button class="btn-hapus" onclick="hapusProduk(${i})">Hapus</button>
            </div>
        </div>`;
    });
}

function editProduk(i) {
    editIndex = i;
    namaProduk.value = produk[i].nama;
    hargaProduk.value = produk[i].harga;
    btnSimpan.innerText = "Update Produk";
    window.scrollTo(0, 0);
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
    btnSimpan.innerText = "Tambah Produk";
    editIndex = null;
}

// ================== TRANSAKSI & KERANJANG ==================
function renderProdukTransaksi() {
    produkTransaksi.innerHTML = "";
    produk.forEach((p, i) => {
        produkTransaksi.innerHTML += `
        <div class="produk-card">
            <img src="${p.foto}">
            <h4>${p.nama}</h4>
            <p>Rp ${formatRupiah(p.harga)}</p>
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
        keranjangData.push({
            nama: p.nama,
            harga: p.harga,
            qty: 1,
            subtotal: p.harga
        });
    }
    renderKeranjang();
     const target = document.getElementById("keranjangSection");
    if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

function renderKeranjang() {
    keranjang.innerHTML = "";
    totalBayar = 0;

    keranjangData.forEach((item, i) => {
        totalBayar += item.subtotal;
        keranjang.innerHTML += `
        <tr>
            <td>${item.nama}</td>
            <td>Rp ${formatRupiah(item.harga)}</td>
            <td>
                <div class="qty-control">
                    <!-- Tambahkan class 'qty-btn minus' -->
                    <button class="qty-btn minus" onclick="kurangQty(${i})">−</button>
                    <span class="qty-value">${item.qty}</span>
                    <!-- Tambahkan class 'qty-btn plus' -->
                    <button class="qty-btn plus" onclick="tambahQty(${i})">+</button>
                </div>
            </td>
            <td>Rp ${formatRupiah(item.subtotal)}</td>
            <td>
                <!-- Tambahkan class 'btn-hapus-cart' -->
                <button class="btn-hapus-cart" onclick="hapusItem(${i})">✖</button>
            </td>
        </tr>`;
    });
    total.innerText = formatRupiah(totalBayar);
    hitungKembalian();
}

function tambahQty(i) {
    keranjangData[i].qty++;
    keranjangData[i].subtotal = keranjangData[i].qty * keranjangData[i].harga;
    renderKeranjang();
}

function kurangQty(i) {
    if (keranjangData[i].qty > 1) {
        keranjangData[i].qty--;
        keranjangData[i].subtotal = keranjangData[i].qty * keranjangData[i].harga;
    } else {
        keranjangData.splice(i, 1);
    }
    renderKeranjang();
}

function hapusItem(i) {
    keranjangData.splice(i, 1);
    renderKeranjang();
}

// ================== PROSES BAYAR ==================
function hitungKembalian() {
    const bayarVal = Number(bayar.value) || 0;
    const kembali = bayarVal - totalBayar;
    kembalian.innerText = formatRupiah(kembali > 0 ? kembali : 0);
}

function prosesBayar() {
    const bayarVal = Number(bayar.value) || 0;

    if (keranjangData.length === 0) {
        alert("Keranjang masih kosong!");
        return;
    }

    if (bayarVal < totalBayar) {
        alert("Uang pembayaran kurang!");
        return;
    }

    const now = new Date();
    const transaksi = {
        tanggal: now.toLocaleDateString("id-ID"),
        waktu: now.toLocaleTimeString("id-ID"),
        total: totalBayar,
        bayar: bayarVal,
        kembali: bayarVal - totalBayar,
        items: [...keranjangData] // Copy array keranjang
    };

    riwayat.push(transaksi);
    localStorage.setItem("riwayat", JSON.stringify(riwayat));

    // Panggil fungsi cetak
    cetakStruk(transaksi);

    // Reset Form Transaksi (Tanpa reload halaman)
    keranjangData = [];
    bayar.value = "";
    renderKeranjang();
    showPage("riwayat"); // Pindah ke riwayat untuk melihat hasil
}

function cetakStruk(data) {
    // 1. Masukkan data ke elemen HTML struk (sama seperti sebelumnya)
    document.getElementById("pTanggal").innerText = `${data.tanggal} ${data.waktu}`;
    document.getElementById("pTotal").innerText = formatRupiah(data.total);
    document.getElementById("pBayar").innerText = formatRupiah(data.bayar);
    document.getElementById("pKembali").innerText = formatRupiah(data.kembali);

    const pItems = document.getElementById("pItems");
    pItems.innerHTML = "";
    data.items.forEach(item => {
        pItems.innerHTML += `
        <tr>
            <td style="padding: 5px 0;">${item.nama}</td>
            <td align="center">${item.qty}</td>
            <td align="right">${formatRupiah(item.subtotal)}</td>
        </tr>`;
    });

    // 2. Panggil perintah cetak browser secara langsung
    // Karena kita sudah pakai CSS @media print di atas, 
    // browser akan otomatis hanya mencetak area struk saja.
    window.print();
}

function tampilRiwayat() {
    riwayatList.innerHTML = "";
    riwayat.forEach((r, i) => {
        riwayatList.innerHTML += `
        <tr>
            <td>${r.tanggal} ${r.waktu}</td>
            <td>Rp ${formatRupiah(r.total)}</td>
            <td>Rp ${formatRupiah(r.bayar)}</td>
            <td>Rp ${formatRupiah(r.kembali)}</td>
            <td><button onclick="cetakUlang(${i})">🖨 Cetak</button></td>
        </tr>`;
    });
    hitungPendapatanHarian();
}

function cetakUlang(index) {
    cetakStruk(riwayat[index]);
}

function hitungPendapatanHarian() {
    const pendapatanHarian = document.getElementById("pendapatanHarian");
    const pendapatanHariIni = document.getElementById("pendapatanHariIni");
    
    if (!pendapatanHarian) return;

    let totalHariIni = 0;
    const tglSekarang = new Date().toLocaleDateString("id-ID");

    // Kelompokkan data berdasarkan tanggal
    const rekap = riwayat.reduce((acc, curr) => {
        acc[curr.tanggal] = (acc[curr.tanggal] || 0) + curr.total;
        if (curr.tanggal === tglSekarang) totalHariIni += curr.total;
        return acc;
    }, {});

    pendapatanHarian.innerHTML = "";
    for (let tgl in rekap) {
        pendapatanHarian.innerHTML += `
        <tr>
            <td>${tgl}</td>
            <td>Rp ${formatRupiah(rekap[tgl])}</td>
        </tr>`;
    }
    
    if(pendapatanHariIni) pendapatanHariIni.innerText = "Rp " + formatRupiah(totalHariIni);
}

function resetRiwayat() {
    if (confirm("Hapus semua riwayat transaksi?")) {
        riwayat = [];
        localStorage.setItem("riwayat", JSON.stringify(riwayat));
        tampilRiwayat();
    }
}

// ================== INISIALISASI AWAL ==================
document.addEventListener("DOMContentLoaded", () => {
    renderProduk();
    // Default buka halaman produk
    showPage('produk');
});