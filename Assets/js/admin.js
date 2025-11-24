// === IPC Button ===
const buttonKembali = document.getElementById("kembali");
const buttonGenerate = document.getElementById("Generate");

buttonKembali.addEventListener("click", () => {
  window.electronAPI.kembali("Kembali ke Dashboard");
});

buttonGenerate.addEventListener("click", () =>{
    window.electronAPI.Generate("Masuk ke Generate-Page");
})
