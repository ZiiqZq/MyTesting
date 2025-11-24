// === Event Saat DOM Siap ===
document.addEventListener('DOMContentLoaded', () => {
  const btnTambah = document.getElementById('btnTambah');
  const btnSimpan = document.getElementById('btnSimpan');
  const btnKembali = document.getElementById('kembali');
  const tableBody = document.getElementById('tableBody');

  // === IPC Button ===
  if (btnKembali) {
    btnKembali.addEventListener('click', () => {
      window.electronAPI.kembali("Kembali ke Dashboard");
    });
  }

  // === Fungsi Tambah Baris ===
  function tambahBaris() {
    const newRow = document.createElement('tr');
    newRow.classList.add('hover:bg-gray-50', 'transition-colors');
    newRow.innerHTML = `
      <td class="border border-gray-300 px-4 py-2 text-gray-700">${tableBody.children.length + 1}</td>
      <td class="border border-gray-300 px-2 py-2">
        <input type="text" class="w-full px-3 py-2 border border-gray-200 rounded 
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Masukkan nama">
      </td>
      <td class="border border-gray-300 px-2 py-2">
        <input type="email" class="w-full px-3 py-2 border border-gray-200 rounded 
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="email@example.com">
      </td>
      <td class="border border-gray-300 px-2 py-2">
        <input type="tel" class="w-full px-3 py-2 border border-gray-200 rounded 
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="08xx-xxxx-xxxx">
      </td>
      <td class="border border-gray-300 px-2 py-2">
        <input type="text" class="w-full px-3 py-2 border border-gray-200 rounded 
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Masukkan alamat">
      </td>
      <td class="border border-gray-300 px-2 py-2 text-center">
        <button class="btnHapus p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7
              m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16">
            </path>
          </svg>
        </button>
      </td>
    `;
    tableBody.appendChild(newRow);
    updateDeleteListeners();
  }

  // === Fungsi Hapus Baris ===
  function hapusBaris(button) {
    const row = button.closest('tr');
    if (tableBody.children.length > 1) {
      row.remove();
      updateRowNumbers();
    } else {
      alert("Minimal harus ada 1 baris data!");
    }
  }

  // === Update Nomor Baris ===
  function updateRowNumbers() {
    [...tableBody.children].forEach((row, index) => {
      row.children[0].textContent = index + 1;
    });
  }

  // === Pasang Listener Hapus ===
  function updateDeleteListeners() {
    const deleteButtons = document.querySelectorAll('.btnHapus');
    deleteButtons.forEach(btn => {
      btn.removeEventListener('click', onDeleteClick); // Hindari duplikasi
      btn.addEventListener('click', onDeleteClick);
    });
  }

  function onDeleteClick(event) {
    hapusBaris(event.currentTarget);
  }

  // === Fungsi Simpan Data ===
  function simpanData() {
    const rows = document.querySelectorAll('#tableBody tr');
    const data = [...rows].map((row, i) => ({
      no: i + 1,
      nama: row.cells[1].querySelector('input').value,
      email: row.cells[2].querySelector('input').value,
      telepon: row.cells[3].querySelector('input').value,
      alamat: row.cells[4].querySelector('input').value
    }));
    console.log('Data tersimpan:', data);
    alert('Data berhasil disimpan! Cek console untuk melihat data.');
  }

  // === Hubungkan Tombol ===
  if (btnTambah) btnTambah.addEventListener('click', tambahBaris);
  if (btnSimpan) btnSimpan.addEventListener('click', simpanData);

  // === Jalankan Listener Awal ===
  updateDeleteListeners();
});
