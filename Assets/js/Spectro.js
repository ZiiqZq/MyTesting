// === IPC Button ===
const buttonKembali = document.getElementById("kembali");
buttonKembali.addEventListener("click", () => {
  window.electronAPI.kembali("Kembali ke Dashboard");
});

// === Load data dari MySQL ===
window.addEventListener("DOMContentLoaded", async () => {
  try {
    const users = await window.electronAPI.getUsers();
    console.log("Data dari database:", users);

    // tampilkan data di halaman (contoh)
    const container = document.createElement("div");
    container.innerHTML = "<h2>Data User:</h2>";
    users.forEach(u => {
      const p = document.createElement("p");
      p.textContent = `${u.nama} (${u.umur} tahun) - ${u.hobi}`;
      container.appendChild(p);
    });
    
    document.body.appendChild(container);
  } catch (err) {
    console.error("Gagal ambil data:", err);
  }
});
