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
        if (!file) {
            alert("Gambar wajib diisi");
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
                <button onclick="editProduk(${i})">Edit</button>
                <button onclick="hapusProduk(${i})">Hapus</button>
            </div>
        </div>`;
    });
}

function editProduk(i) {
    editIndex = i;
    namaProduk.value = produk[i].nama;
    hargaProduk.value = produk[i].harga;
    btnSimpan.innerText = "Update Produk";
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
}

// ================== TRANSAKSI ==================
function renderProdukTransaksi() {
    produkTransaksi.innerHTML = "";
    produk.forEach((p, i) => {
        produkTransaksi.innerHTML += `
        <div class="produk-card">
            <img src="${p.foto}">
            <h4>${p.nama}</h4>
            <p>Rp ${formatRupiah(p.harga)}</p>
            <button onclick="beliProduk(${i})">🛒 Beli</button>
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
}

function renderKeranjang() {
    keranjang.innerHTML = "";
    totalBayar = 0;

    keranjangData.forEach((item, i) => {
        totalBayar += item.subtotal;
        keranjang.innerHTML += `
        <tr>
            <td>${item.nama}</td>
            <td>${item.qty}</td>
            <td>Rp ${formatRupiah(item.subtotal)}</td>
            <td><button onclick="hapusItem(${i})">✖</button></td>
        </tr>`;
    });

    total.innerText = formatRupiah(totalBayar);
    hitungKembalian();
}

function hapusItem(i) {
    keranjangData.splice(i, 1);
    renderKeranjang();
}

// ================== BAYAR ==================
function hitungKembalian() {
    const bayarVal = Number(bayar.value) || 0;
    kembalian.innerText = formatRupiah(Math.max(bayarVal - totalBayar, 0));
}

function prosesBayar() {
    const bayarVal = Number(bayar.value) || 0;

    if (keranjangData.length === 0) {
        alert("Keranjang kosong!");
        return;
    }
    if (bayarVal < totalBayar) {
        alert("Uang kurang!");
        return;
    }

    const now = new Date();
    const transaksi = {
        tanggal: now.toLocaleDateString("id-ID"),
        waktu: now.toLocaleTimeString("id-ID"),
        total: totalBayar,
        bayar: bayarVal,
        kembali: bayarVal - totalBayar,
        items: [...keranjangData]
    };

    riwayat.push(transaksi);
    localStorage.setItem("riwayat", JSON.stringify(riwayat));

    // 🔥 KIRIM KE FLUTTER BLUETOOTH
    kirimKeBluetoothPrinter(transaksi);

    // 🖨 PRINT BROWSER (OPSIONAL)
    cetakStruk(transaksi);

    keranjangData = [];
    bayar.value = "";
    renderKeranjang();
    showPage("riwayat");
}

// ================== FLUTTER BLUETOOTH ==================
function kirimKeBluetoothPrinter(transaksi) {
    if (window.PrintChannel) {
        window.PrintChannel.postMessage(JSON.stringify({
            toko: "TOKO MAJU JAYA",
            alamat: "Jl. Contoh No. 123",
            ...transaksi,
            footer: "Terima Kasih 🙏"
        }));
    }
}

// ================== PRINT BROWSER ==================
function cetakStruk(data) {
    window.print();
}

// ================== RIWAYAT ==================
function tampilRiwayat() {
    riwayatList.innerHTML = "";
    riwayat.forEach((r, i) => {
        riwayatList.innerHTML += `
        <tr>
            <td>${r.tanggal} ${r.waktu}</td>
            <td>Rp ${formatRupiah(r.total)}</td>
            <td><button onclick="cetakUlang(${i})">🖨</button></td>
        </tr>`;
    });
}

function cetakUlang(i) {
    kirimKeBluetoothPrinter(riwayat[i]);
    cetakStruk(riwayat[i]);
}

// ================== INIT ==================
document.addEventListener("DOMContentLoaded", () => {
    renderProduk();
    showPage("produk");
});
