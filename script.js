// ================== DOM ELEMENTS ==================
const namaProduk = document.getElementById("namaProduk");
const hargaProduk = document.getElementById("hargaProduk");
const fotoProduk = document.getElementById("fotoProduk"); // hidden input base64
const btnSimpan = document.getElementById("btnSimpan");

const produkList = document.getElementById("produkList");
const produkTransaksi = document.getElementById("produkTransaksi");

const keranjang = document.getElementById("keranjang");
const total = document.getElementById("total");

const bayarInput = document.getElementById("bayar"); // ganti nama agar tidak bentrok dengan fungsi
const kembalian = document.getElementById("kembalian");

const riwayatList = document.getElementById("riwayatList");
const previewFoto = document.getElementById("previewFoto");

// ================== DATA ==================
let produk = JSON.parse(localStorage.getItem("produk")) || [];
let riwayat = JSON.parse(localStorage.getItem("riwayat")) || [];

let editIndex = null;
let keranjangData = [];
let totalBayar = 0;

// ================== HELPER ==================
function formatRupiah(angka = 0) {
    return Number(angka).toLocaleString("id-ID");
}

// Fungsi Navigasi Halaman (Penting agar menu bisa berpindah)
function showPage(pageId) {
    // Sembunyikan semua section
    document.querySelectorAll('.page-section').forEach(section => {
        section.style.display = 'none';
    });
    // Tampilkan yang dipilih
    const activePage = document.getElementById(pageId);
    if (activePage) activePage.style.display = 'block';

    if (pageId === 'transaksi') renderProdukTransaksi();
    if (pageId === 'produk') renderProduk();
    if (pageId === 'riwayat') renderRiwayat();
}

// ================== FOTO (FLUTTER BRIDGE) ==================
function ambilFoto() {
    // Cek apakah ImageChannel sudah tersedia dari Flutter
    if (typeof ImageChannel !== 'undefined') {
        ImageChannel.postMessage("pick");
    } else if (window.ImageChannel) {
        window.ImageChannel.postMessage("pick");
    } else {
        alert("Koneksi ke aplikasi belum siap. Pastikan Anda membuka di aplikasi Flutter.");
    }
}

// Fungsi ini WAJIB GLOBAL agar bisa dipanggil Flutter
window.setFoto = function(base64) {
    if (fotoProduk) fotoProduk.value = base64;
    if (previewFoto) {
        previewFoto.src = base64;
        previewFoto.style.display = "block";
    }
};

// ================== PRODUK ==================
function simpanProduk() {
    const nama = namaProduk.value.trim();
    const harga = parseInt(hargaProduk.value);
    const fotoBase64 = fotoProduk.value;

    if (!nama || isNaN(harga) || harga <= 0) {
        alert("Nama dan harga wajib diisi dengan benar");
        return;
    }

    if (!fotoBase64) {
        alert("Foto produk belum dipilih");
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
    alert("Produk berhasil disimpan");
}

function renderProduk() {
    if (!produkList) return;
    produkList.innerHTML = "";
    produk.forEach((p, i) => {
        produkList.innerHTML += `
      <div class="produk-card">
        <img src="${p.foto}" style="width:100%; height:100px; object-fit:cover;">
        <h4>${p.nama}</h4>
        <p>Rp ${formatRupiah(p.harga)}</p>
        <div class="produk-action">
          <button onclick="editProduk(${i})">Edit</button>
          <button onclick="hapusProduk(${i})" style="background:red; color:white;">Hapus</button>
        </div>
      </div>
    `;
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
    window.scrollTo(0, 0); // Scroll ke atas untuk edit
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

// ================== TRANSAKSI ==================
function renderProdukTransaksi() {
    if (!produkTransaksi) return;
    produkTransaksi.innerHTML = "";
    produk.forEach((p, i) => {
        produkTransaksi.innerHTML += `
      <div class="produk-card">
        <img src="${p.foto}" style="width:100%; height:80px; object-fit:cover;">
        <h4>${p.nama}</h4>
        <p>Rp ${formatRupiah(p.harga)}</p>
        <button onclick="beliProduk(${i})" style="width:100%; background:green; color:white;">🛒 Beli</button>
      </div>
    `;
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
        <td><button onclick="hapusItem(${i})" style="background:none; border:none; color:red;">✖</button></td>
      </tr>
    `;
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
    const hasil = bayarVal - totalBayar;
    kembalian.innerText = formatRupiah(hasil > 0 ? hasil : 0);
}

// Menangani input pembayaran secara realtime
if (bayarInput) {
    bayarInput.addEventListener("input", hitungKembalian);
}

// ================== SELESAI TRANSAKSI ==================
function checkout() {
    if (keranjangData.length === 0) return alert("Keranjang kosong");
    if (Number(bayarInput.value) < totalBayar) return alert("Uang pembayaran kurang");

    const struk = {
        id: Date.now(),
        tanggal: new Date().toLocaleString(),
        items: [...keranjangData],
        total: totalBayar,
        bayar: Number(bayarInput.value),
        kembali: Number(bayarInput.value) - totalBayar
    };

    riwayat.push(struk);
    localStorage.setItem("riwayat", JSON.stringify(riwayat));

    alert("Transaksi Berhasil!");
    
    // Kirim data ke printer Flutter (Jika Anda sudah membuat channel printer)
    if (window.PrintChannel) {
        window.PrintChannel.postMessage(JSON.stringify(struk));
    }

    keranjangData = [];
    bayarInput.value = "";
    renderKeranjang();
}

// ================== INIT ==================
document.addEventListener("DOMContentLoaded", () => {
    // Pastikan halaman pertama yang tampil adalah 'produk'
    showPage("produk");
});
