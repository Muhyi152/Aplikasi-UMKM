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
let editIndex = null;
let keranjangData = [];
let totalBayar = 0;

const Toast = Swal.mixin({
    toast: true,
    position: 'top',
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
});

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
        const MAX_WIDTH = 400; // Ukuran diperkecil agar muat banyak
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

        // Kompresi ke JPEG kualitas 0.6
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
            text: 'Data produk telah diperbarui.',
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

// ================== KASIR & RIWAYAT ==================
function renderProdukTransaksi() {
    if (!produkTransaksi) return;
    produkTransaksi.innerHTML = produk.length === 0 ? "<p style='text-align:center; width:100%;'>Belum ada produk.</p>" : "";
    produk.forEach((p, i) => {
        produkTransaksi.innerHTML += `
            <div class="produk-card">
                <img src="${p.foto}">
                <div class="info">
                    <h4>${p.nama}</h4>
                    <p>Rp ${formatRupiah(p.harga)}</p>
                </div>
                <button onclick="beliProduk(${i})" style="width:100%; padding:10px; background:#4CAF50; color:white; border:none; cursor:pointer;">🛒 Tambah</button>
            </div>`;
    });
}

function beliProduk(i) {
    const p = produk[i];
    const item = keranjangData.find(x => x.nama === p.nama);
    if (item) { item.qty++; item.subtotal = item.qty * item.harga; } 
    else { keranjangData.push({ nama: p.nama, harga: p.harga, qty: 1, subtotal: p.harga }); }
    Toast.fire({ icon: 'success', title: p.nama + ' ditambah' });
    renderKeranjang();
}

function renderKeranjang() {
    keranjang.innerHTML = ""; totalBayar = 0;
    keranjangData.forEach((item, i) => {
        totalBayar += item.subtotal;
        keranjang.innerHTML += `<tr><td>${item.nama}</td><td>${item.qty}x</td><td>${formatRupiah(item.subtotal)}</td><td><button onclick="hapusItem(${i})" style="color:red; background:none; border:none;">✖</button></td></tr>`;
    });
    total.innerText = formatRupiah(totalBayar);
    hitungKembalian();
}

function hapusItem(i) { keranjangData.splice(i, 1); renderKeranjang(); }

function hitungKembalian() {
    const bayarVal = Number(bayarInput.value) || 0;
    const sisa = bayarVal - totalBayar;
    kembalian.innerText = formatRupiah(sisa > 0 ? sisa : 0);
}
bayarInput.addEventListener("input", hitungKembalian);

function checkout() {
    const bayarVal = Number(bayarInput.value) || 0;
    if (keranjangData.length === 0 || bayarVal < totalBayar) {
        Swal.fire('Gagal', 'Keranjang kosong atau uang kurang!', 'error'); return;
    }
    const trx = { id: "TRX-"+Date.now(), tanggal: new Date().toLocaleString('id-ID'), items: [...keranjangData], total: totalBayar, bayar: bayarVal, kembali: bayarVal - totalBayar };
    let riwayat = JSON.parse(localStorage.getItem("riwayat")) || [];
    riwayat.push(trx);
    localStorage.setItem("riwayat", JSON.stringify(riwayat));
    if (window.PrintChannel) window.PrintChannel.postMessage(JSON.stringify(trx));
    
    Swal.fire('Berhasil!', 'Transaksi Selesai', 'success').then(() => {
        keranjangData = []; bayarInput.value = ""; renderKeranjang(); showPage('riwayat');
    });
}

function renderRiwayat() {
    const data = JSON.parse(localStorage.getItem("riwayat")) || [];
    riwayatList.innerHTML = data.length === 0 ? "<tr><td colspan='3'>Kosong</td></tr>" : "";
    data.reverse().forEach((item, i) => {
        riwayatList.innerHTML += `<tr><td>${item.tanggal}</td><td>Rp ${formatRupiah(item.total)}</td><td><button onclick="hapusRiwayat(${data.length-1-i})" style="background:red; color:white; border:none; padding:5px 10px; border-radius:5px;">Hapus</button></td></tr>`;
    });
}

function hapusRiwayat(index) {
    let riwayat = JSON.parse(localStorage.getItem("riwayat")) || [];
    riwayat.splice(index, 1);
    localStorage.setItem("riwayat", JSON.stringify(riwayat));
    renderRiwayat();
    Toast.fire({ icon: 'success', title: 'Riwayat dihapus' });
}

document.addEventListener("DOMContentLoaded", () => { renderProduk(); showPage('produk'); });
