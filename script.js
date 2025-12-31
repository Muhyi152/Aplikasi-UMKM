// ================== DOM ELEMENTS ==================
const namaProduk = document.getElementById("namaProduk");
const hargaProduk = document.getElementById("hargaProduk");
const fotoProduk = document.getElementById("fotoProduk"); // hidden input base64
const btnSimpan = document.getElementById("btnSimpan");

const produkList = document.getElementById("produkList");
const produkTransaksi = document.getElementById("produkTransaksi");

const keranjang = document.getElementById("keranjang");
const total = document.getElementById("total");

const bayar = document.getElementById("bayar");
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

// ================== FOTO (FLUTTER) ==================
function ambilFoto() {
  if (window.ImageChannel) {
    window.ImageChannel.postMessage("pick");
  } else {
    alert("Image picker belum siap");
  }
}

// Dipanggil oleh Flutter
function setFoto(base64) {
  fotoProduk.value = base64;
  previewFoto.src = base64;
  previewFoto.style.display = "block";
}

// ================== PRODUK ==================
function simpanProduk() {
  const nama = namaProduk.value.trim();
  const harga = parseInt(hargaProduk.value);
  const fotoBase64 = fotoProduk.value;

  if (!nama || isNaN(harga) || harga <= 0) {
    alert("Nama dan harga wajib diisi");
    return;
  }

  if (!fotoBase64) {
    alert("Foto produk wajib dipilih");
    return;
  }

  if (editIndex !== null) {
    produk[editIndex] = { nama, harga, foto: fotoBase64 };
  } else {
    produk.push({ nama, harga, foto: fotoBase64 });
  }

  localStorage.setItem("produk", JSON.stringify(produk));
  resetForm();
  renderProduk();
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
  editIndex = null;

  previewFoto.style.display = "none";
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

// ================== BAYAR ==================
function hitungKembalian() {
  const bayarVal = Number(bayar.value) || 0;
  kembalian.innerText = formatRupiah(Math.max(bayarVal - totalBayar, 0));
}

// ================== INIT ==================
document.addEventListener("DOMContentLoaded", () => {
  renderProduk();
  showPage("produk");
});
