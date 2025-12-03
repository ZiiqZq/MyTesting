// Assets/js/Testing.js

// ============================================
// STATE MANAGEMENT
// ============================================
let allProducts = [];
let productSeries = [];
let selectedProduct = null;
let selectedTestType = null;
let testParameters = [];
let templateData = null;
let testingInProgress = false;
let testInformation = {};
let tableRows = [];
let rowCounter = 0;

// Simpan data untuk dropdown
let productNames = [];
let currentSeriesOptions = [];

// ============================================
// RESET FUNCTIONS
// ============================================

function resetSeriesAndBelow() {
    console.log("Resetting series and below...");
    
    const seriesContainer = document.getElementById("seriesContainer");
    const testTypeSection = document.getElementById("testTypeSection");
    const testInfoSection = document.getElementById("testInfoSection");
    
    if (seriesContainer) seriesContainer.classList.add("hidden");
    if (testTypeSection) testTypeSection.classList.add("hidden");
    if (testInfoSection) testInfoSection.classList.add("hidden");
    
    // Reset state - HANYA reset yang terkait series dan di bawahnya
    selectedTestType = null;
    templateData = null;
    testParameters = [];
    currentSeriesOptions = [];
    productSeries = [];
    
    // Clear test type buttons
    const testTypeList = document.getElementById("testTypeList");
    if (testTypeList) testTypeList.innerHTML = "";
    
    // Clear test parameters display
    const testParametersDisplay = document.getElementById("testParametersDisplay");
    if (testParametersDisplay) testParametersDisplay.innerHTML = "";
    
    // Reset series input
    const seriesInput = document.getElementById("selectSeries");
    if (seriesInput) {
        seriesInput.value = "";
        seriesInput.classList.remove("invalid");
        // Clear series dropdown
        const seriesDropdown = document.getElementById("seriesDropdown");
        if (seriesDropdown) {
            seriesDropdown.innerHTML = "";
            seriesDropdown.classList.remove("active");
        }
    }
    
    console.log("Series and below have been reset");
}

function resetTestTypeAndBelow() {
    console.log("Resetting test type and below...");
    
    const testTypeSection = document.getElementById("testTypeSection");
    const testInfoSection = document.getElementById("testInfoSection");
    
    if (testTypeSection) testTypeSection.classList.add("hidden");
    if (testInfoSection) testInfoSection.classList.add("hidden");
    
    // Reset state - TIDAK reset selectedProduct di sini
    selectedTestType = null;
    templateData = null;
    testParameters = [];
    
    // Clear test type buttons
    const testTypeList = document.getElementById("testTypeList");
    if (testTypeList) testTypeList.innerHTML = "";
    
    // Clear test parameters display
    const testParametersDisplay = document.getElementById("testParametersDisplay");
    if (testParametersDisplay) testParametersDisplay.innerHTML = "";
    
    console.log("Test type and below have been reset");
}

// ============================================
// MODAL FUNCTIONS
// ============================================
function showErrorModal(message) {
  const errorMessage = document.getElementById("errorMessage");
  const modalError = document.getElementById("modalError");

  if (errorMessage && modalError) {
    errorMessage.textContent = message;
    modalError.classList.add("active");
  }
}

function closeErrorModal(event) {
  if (event && event.target.id !== "modalError") {
    return;
  }
  const modal = document.getElementById("modalError");
  if (modal) {
    modal.classList.remove("active");
  }
}

function showSuccessModal(message) {
  const successMessage = document.getElementById("successMessage");
  const modalSuccess = document.getElementById("modalSuccess");

  if (successMessage && modalSuccess) {
    successMessage.textContent = message;
    modalSuccess.classList.add("active");

    setupSuccessModalClose();
  }
}

function closeSuccessModal(event) {
  if (event && event.target.id !== "modalSuccess") {
    return;
  }
  const modal = document.getElementById("modalSuccess");
  if (modal) {
    modal.classList.remove("active");
    location.reload();
  }
}

function closeConfirmModal(event) {
  if (event && event.target.id !== "modalConfirm") {
    return;
  }
  const modal = document.getElementById("modalConfirm");
  if (modal) {
    modal.classList.remove("active");
  }
}

function showConfirmModal(title, message, onConfirm) {
  const confirmTitle = document.getElementById("confirmTitle");
  const confirmMessage = document.getElementById("confirmMessage");
  const modal = document.getElementById("modalConfirm");

  if (!confirmTitle || !confirmMessage || !modal) return;

  confirmTitle.textContent = title;
  confirmMessage.textContent = message;

  modal.classList.add("active");

  const btnYes = document.getElementById("btnConfirmYes");
  const btnNo = document.getElementById("btnConfirmNo");

  const newBtnYes = btnYes.cloneNode(true);
  const newBtnNo = btnNo.cloneNode(true);

  if (btnYes.parentNode && btnNo.parentNode) {
    btnYes.parentNode.replaceChild(newBtnYes, btnYes);
    btnNo.parentNode.replaceChild(newBtnNo, btnNo);
  }

  newBtnYes.addEventListener("click", () => {
    modal.classList.remove("active");
    onConfirm();
  });

  newBtnNo.addEventListener("click", () => {
    modal.classList.remove("active");
  });
}

// ============================================
// SUCCESS MODAL CLOSE SETUP
// ============================================
function setupSuccessModalClose() {
  const btnCloseSuccess = document.getElementById("btnCloseSuccess");
  const modalSuccess = document.getElementById("modalSuccess");

  if (btnCloseSuccess) {
    const newBtn = btnCloseSuccess.cloneNode(true);
    btnCloseSuccess.parentNode.replaceChild(newBtn, btnCloseSuccess);

    newBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      const modal = document.getElementById("modalSuccess");
      if (modal) {
        modal.classList.remove("active");
        location.reload();
      }
    });
  }

  if (modalSuccess) {
    modalSuccess.addEventListener("click", function (e) {
      if (e.target === this) {
        closeSuccessModal(e);
      }
    });
  }
}

// ============================================
// QTY CONTROLS
// ============================================
function incrementQty() {
  const input = document.getElementById("inputQty");
  if (!input) return;

  const currentValue = parseInt(input.value) || 1;
  if (currentValue < 100) {
    input.value = currentValue + 1;
    updateSerialRangeDisplay();
  }
}

function decrementQty() {
  const input = document.getElementById("inputQty");
  if (!input) return;

  const currentValue = parseInt(input.value) || 1;
  if (currentValue > 1) {
    input.value = currentValue - 1;
    updateSerialRangeDisplay();
  }
}

// ============================================
// DELETE LAST ROW 
// ============================================
function deleteLastRow() {
  if (tableRows.length <= 1) {
    showErrorModal("Tidak bisa menghapus baris terakhir. Minimal 1 baris diperlukan.");
    return;
  }

  const lastRow = tableRows[tableRows.length - 1];
  if (lastRow) {
    lastRow.remove();
    tableRows.pop();

    testInformation.qty = tableRows.length;
    const displayQty = document.getElementById("displayQty");
    if (displayQty) {
      displayQty.textContent = testInformation.qty;
    }

    const endSerial = testInformation.startingSerial + testInformation.qty - 1;
    const displaySerial = document.getElementById("displaySerial");
    if (displaySerial) {
      displaySerial.textContent = `${testInformation.startingSerial} - ${endSerial}`;
    }

    console.log("Baris terakhir dihapus, total baris:", tableRows.length);
  }
}

// ============================================
// SERIAL RANGE DISPLAY
// ============================================
function updateSerialRangeDisplay() {
  const serialInput = document.getElementById("inputSerialNumber");
  const qtyInput = document.getElementById("inputQty");
  const display = document.getElementById("serialRangeDisplay");

  if (!serialInput || !qtyInput || !display) return;

  const startSerial = serialInput.value.trim();
  const qty = parseInt(qtyInput.value) || 1;

  if (!startSerial || !qty) {
    display.textContent = "";
    return;
  }

  const numericPart = parseInt(startSerial) || 0;
  const endSerial = numericPart + qty - 1;

  display.innerHTML = `<strong>Range :</strong> ${numericPart} - ${endSerial}`;
}

// ============================================
// INITIALIZE
// ============================================
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Halaman Testing Dimuat");

  const testDateInput = document.getElementById("inputTestDate");
  if (testDateInput) {
    const today = new Date().toISOString().split("T")[0];
    testDateInput.value = today;
  }

  await loadProducts();
  setupEventListeners();
  setupModalCloseEvents();

  window.addEventListener("beforeunload", (e) => {
    if (testingInProgress) {
      e.preventDefault();
      e.returnValue =
        "Testing sedang berjalan! Semua data akan hilang jika Anda meninggalkan halaman.";
      return e.returnValue;
    }
  });
});

// ============================================
// MODAL CLOSE EVENTS SETUP 
// ============================================
function setupModalCloseEvents() {
  // Error modal
  const modalError = document.getElementById("modalError");
  if (modalError) {
    modalError.addEventListener("click", function (e) {
      if (e.target === this) {
        closeErrorModal(e);
      }
    });
  }

  // Success modal
  const modalSuccess = document.getElementById("modalSuccess");
  if (modalSuccess) {
    modalSuccess.addEventListener("click", function (e) {
      if (e.target === this) {
        closeSuccessModal(e);
      }
    });
  }

  // Confirm modal
  const modalConfirm = document.getElementById("modalConfirm");
  if (modalConfirm) {
    modalConfirm.addEventListener("click", function (e) {
      if (e.target === this) {
        closeConfirmModal(e);
      }
    });
  }

  setupSuccessModalClose();
}

// ============================================
// LOAD PRODUCTS
// ============================================
async function loadProducts() {
  try {
    console.log("Memuat produk...");
    const result = await window.electronAPI.getProducts();

    if (result.success) {
      allProducts = result.data;
      console.log("Produk berhasil dimuat:", allProducts.length);
      populateProductDropdown();
    } else {
      console.error("Gagal memuat produk:", result.error);
      showErrorModal("Gagal memuat produk: " + result.error);
    }
  } catch (err) {
    console.error("Error memuat produk:", err);
    showErrorModal("Error memuat produk: " + err.message);
  }
}

// ============================================
// CUSTOM DROPDOWN FUNCTIONS dengan Reset Otomatis
// ============================================

function populateProductDropdown() {
  const input = document.getElementById("selectProduct");
  const dropdown = document.getElementById("productDropdown");
  
  if (!input || !dropdown) {
    console.error("Elemen selectProduct tidak ditemukan");
    return;
  }

  // Clear and reset
  dropdown.innerHTML = '';
  input.value = '';

  if (!allProducts || allProducts.length === 0) {
    console.warn("Tidak ada produk tersedia");
    input.disabled = true;
    input.placeholder = "Tidak ada produk tersedia";
    return;
  }

  input.disabled = false;
  input.placeholder = "Ketik atau pilih produk";

  // Get unique product names
  productNames = [...new Set(allProducts.map((p) => p.product_name))].sort();
  console.log("Nama produk tersedia:", productNames);

  // Initialize custom dropdown dengan reset otomatis
  initializeCustomDropdown(
    'selectProduct',
    'productDropdown',
    productNames,
    function(selectedValue) {
      console.log("Produk dipilih:", selectedValue);
      onProductSelect(selectedValue);
    },
    true // isProductDropdown
  );

  console.log("Dropdown produk diisi dengan", productNames.length, "produk");
}

function populateSeriesDropdown() {
  const input = document.getElementById("selectSeries");
  const dropdown = document.getElementById("seriesDropdown");
  
  if (!input || !dropdown) {
    console.error("Elemen selectSeries tidak ditemukan");
    return;
  }

  dropdown.innerHTML = '';
  input.value = '';

  if (!productSeries || productSeries.length === 0) {
    console.warn("Tidak ada device tersedia");
    input.disabled = true;
    input.placeholder = "Tidak ada device tersedia";
    return;
  }

  input.disabled = false;
  input.placeholder = "Ketik atau pilih device";

  // Create display options
  currentSeriesOptions = [];
  
  productSeries.forEach((product) => {
    let seriesDisplay = "";
    if (product.series_number && product.series) {
      seriesDisplay = `${product.series} - ${product.series_number}`;
    } else if (product.series_number) {
      seriesDisplay = product.series_number;
    } else if (product.series) {
      seriesDisplay = product.series;
    } else {
      seriesDisplay = "Tidak Ada Info Seri";
    }

    currentSeriesOptions.push({
      display: seriesDisplay,
      productId: product.id,
      productData: product
    });
  });

  // Get display strings for dropdown
  const seriesDisplayList = currentSeriesOptions.map(opt => opt.display);

  // Initialize custom dropdown dengan reset otomatis
  initializeCustomDropdown(
    'selectSeries',
    'seriesDropdown',
    seriesDisplayList,
    function(selectedValue) {
      const matchingOption = currentSeriesOptions.find(opt => opt.display === selectedValue);
      if (matchingOption) {
        const productData = matchingOption.productData;
        selectedProduct = {
          id: productData.id,
          name: productData.product_name,
          series_number: productData.series_number,
          series: productData.series,
        };
        
        console.log("Device dipilih, selectedProduct diupdate:", selectedProduct);
        
        // Reset validation state
        input.classList.remove('invalid');
        
        // Load test types untuk produk yang dipilih
        loadProductTestTypes(productData.id);
      } else {
        // Jika tidak cocok, set sebagai invalid
        input.classList.add('invalid');
        console.error("Device tidak ditemukan:", selectedValue);
        // Reset selectedProduct jika device tidak valid
        selectedProduct = null;
      }
    },
    false // isProductDropdown
  );

  console.log("Dropdown device diisi dengan", productSeries.length, "opsi");
}

// ============================================
// CUSTOM DROPDOWN INITIALIZATION dengan Reset Otomatis - PERBAIKAN
// ============================================
function initializeCustomDropdown(inputId, dropdownId, options, onSelectCallback, isProductDropdown = false) {
  const input = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);
  
  if (!input || !dropdown) return;

  let currentFilter = '';
  let selectedIndex = -1;
  let lastValidValue = '';
  let isManualInput = false; // Flag untuk menandai input manual

  // Function to render dropdown items
  function renderDropdown(filterText = '') {
    dropdown.innerHTML = '';
    currentFilter = filterText.toLowerCase();
    
    // Filter options based on input
    const filteredOptions = options.filter(option => 
      option.toLowerCase().includes(currentFilter)
    );

    if (filteredOptions.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = 'custom-dropdown-no-results';
      noResults.textContent = 'Tidak ditemukan';
      dropdown.appendChild(noResults);
      return;
    }

    filteredOptions.forEach((option, index) => {
      const item = document.createElement('div');
      item.className = 'custom-dropdown-item';
      item.dataset.value = option;
      
      // Highlight matching text
      if (currentFilter && option.toLowerCase().includes(currentFilter)) {
        const regex = new RegExp(`(${currentFilter})`, 'gi');
        item.innerHTML = option.replace(regex, '<strong>$1</strong>');
      } else {
        item.textContent = option;
      }
      
      // Add click event
      item.addEventListener('click', () => {
        input.value = option;
        dropdown.classList.remove('active');
        selectedIndex = -1;
        lastValidValue = option;
        isManualInput = false;
        
        // Remove highlight from all items
        dropdown.querySelectorAll('.custom-dropdown-item').forEach(item => {
          item.classList.remove('highlighted', 'selected');
        });
        
        // Add selected class to clicked item
        item.classList.add('selected');
        
        // Remove invalid class when valid selection is made
        input.classList.remove('invalid');
        
        // Call callback if provided
        if (onSelectCallback) {
          onSelectCallback(option);
        }
      });
      
      dropdown.appendChild(item);
    });
  }

  // Show dropdown on focus
  input.addEventListener('focus', () => {
    dropdown.classList.add('active');
    renderDropdown('');
    selectedIndex = -1;
  });

  // Filter on input
  input.addEventListener('input', (e) => {
    const value = e.target.value.trim();
    dropdown.classList.add('active');
    renderDropdown(value);
    selectedIndex = -1;
    
    // Check if input value is valid
    const isValid = options.includes(value);
    isManualInput = true;
    
    // Jika input berubah dan tidak valid, reset bagian bawah
    if (value && !isValid) {
      input.classList.add('invalid');
      
      // Reset bagian bawah berdasarkan tipe dropdown
      if (isProductDropdown) {
        // Jika ini dropdown product dan input tidak valid, reset series dan ke bawah
        if (value !== lastValidValue) {
          resetSeriesAndBelow();
        }
      } else {
        // Jika ini dropdown series dan input tidak valid, reset test type dan ke bawah
        if (value !== lastValidValue) {
          resetTestTypeAndBelow();
          // Reset selectedProduct jika series tidak valid
          selectedProduct = null;
        }
      }
    } else {
      input.classList.remove('invalid');
      lastValidValue = value;
      // Jika valid dan manual input, jangan reset
      if (value && isValid) {
        isManualInput = false;
      }
    }
  });

  // Keyboard navigation
  input.addEventListener('keydown', (e) => {
    const items = dropdown.querySelectorAll('.custom-dropdown-item:not(.custom-dropdown-no-results)');
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % items.length;
      updateHighlightedItem(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = (selectedIndex - 1 + items.length) % items.length;
      updateHighlightedItem(items);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      items[selectedIndex].click();
    } else if (e.key === 'Enter') {
      // Check if current value is valid
      const currentValue = input.value.trim();
      const isValid = options.includes(currentValue);
      if (!isValid && currentValue) {
        input.classList.add('invalid');
        showErrorModal("Pilihan tidak valid. Silakan pilih dari daftar.");
        e.preventDefault();
      } else if (isValid) {
        // Jika valid, panggil callback
        if (onSelectCallback) {
          onSelectCallback(currentValue);
        }
      }
    } else if (e.key === 'Escape') {
      dropdown.classList.remove('active');
      selectedIndex = -1;
    }
  });

  // Function to update highlighted item
  function updateHighlightedItem(items) {
    items.forEach((item, index) => {
      item.classList.remove('highlighted');
      if (index === selectedIndex) {
        item.classList.add('highlighted');
        // Scroll into view if needed
        item.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  // PERBAIKAN: Close dropdown when clicking outside - tidak reset jika value valid
  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove('active');
      selectedIndex = -1;
      
      // Validate when losing focus
      const currentValue = input.value.trim();
      
      // PERBAIKAN: Jangan reset jika value valid atau sama dengan lastValidValue
      if (currentValue) {
        if (!options.includes(currentValue)) {
          input.classList.add('invalid');
          
          // Reset bagian bawah berdasarkan tipe dropdown
          if (isProductDropdown) {
            // Jika ini dropdown product dan input tidak valid
            if (isManualInput && currentValue !== lastValidValue) {
              resetSeriesAndBelow();
            }
          } else {
            // Jika ini dropdown series dan input tidak valid
            if (isManualInput && currentValue !== lastValidValue) {
              resetTestTypeAndBelow();
              selectedProduct = null;
            }
          }
        } else {
          // Nilai valid, jangan reset
          input.classList.remove('invalid');
        }
      } else {
        // Jika input kosong, reset bagian bawah
        if (isProductDropdown) {
          resetSeriesAndBelow();
          selectedProduct = null;
        } else {
          resetTestTypeAndBelow();
          selectedProduct = null;
        }
      }
    }
  });

  // Initial render
  renderDropdown('');
}

// ============================================
// PRODUCT SELECTION HANDLER dengan Validasi - PERBAIKAN
// ============================================
function onProductSelect(productName) {
  console.log("Produk dipilih:", productName);

  // Reset state terlebih dahulu - HANYA reset yang terkait series dan di bawahnya
  productSeries = [];
  currentSeriesOptions = [];
  
  // Hanya reset selectedTestType, jangan reset selectedProduct
  selectedTestType = null;
  templateData = null;
  testParameters = [];

  const seriesContainer = document.getElementById("seriesContainer");
  const testTypeSection = document.getElementById("testTypeSection");
  const testInfoSection = document.getElementById("testInfoSection");

  if (seriesContainer) seriesContainer.classList.add("hidden");
  if (testTypeSection) testTypeSection.classList.add("hidden");
  if (testInfoSection) testInfoSection.classList.add("hidden");

  // Clear series input
  const seriesInput = document.getElementById("selectSeries");
  if (seriesInput) {
    seriesInput.value = '';
    seriesInput.classList.remove('invalid');
  }

  // Clear test type buttons
  const testTypeList = document.getElementById("testTypeList");
  if (testTypeList) testTypeList.innerHTML = "";

  if (!productName) {
    console.log("Tidak ada produk yang dipilih");
    // Reset selectedProduct hanya jika tidak ada produk yang dipilih
    selectedProduct = null;
    return;
  }

  // Validasi bahwa productName ada di daftar
  if (!productNames.includes(productName)) {
    const productInput = document.getElementById("selectProduct");
    if (productInput) {
      productInput.classList.add('invalid');
    }
    showErrorModal("Produk tidak valid. Silakan pilih dari daftar produk.");
    selectedProduct = null;
    return;
  }

  // Filter products by selected product name
  productSeries = allProducts.filter((p) => p.product_name === productName);
  console.log("Seri produk yang difilter:", productSeries);

  if (productSeries.length === 0) {
    console.warn("Tidak ada seri ditemukan untuk produk:", productName);
    showErrorModal("Tidak ada device ditemukan untuk produk ini.");
    selectedProduct = null;
    return;
  }

  // JANGAN set selectedProduct dari product pertama
  // Biarkan selectedProduct null sampai user benar-benar memilih device

  populateSeriesDropdown();

  if (seriesContainer) {
    seriesContainer.classList.remove("hidden");
    console.log("Kontainer seri ditampilkan");
  }
}

// ============================================
// EVENT LISTENERS - PERBAIKAN
// ============================================
function setupEventListeners() {
  try {
    console.log("Menyiapkan event listeners...");

    // Serial number and quantity listeners
    const inputSerialNumber = document.getElementById("inputSerialNumber");
    const inputQty = document.getElementById("inputQty");
    const btnStartTesting = document.getElementById("btnStartTesting");
    const btnCancelTest = document.getElementById("btnCancelTest");
    const btnSubmitTest = document.getElementById("btnSubmitTest");
    const btnAddRow = document.getElementById("btnAddRow");

    if (inputSerialNumber) {
      inputSerialNumber.addEventListener("input", updateSerialRangeDisplay);
      console.log("Listener inputSerialNumber ditambahkan");
    }

    if (inputQty) {
      inputQty.addEventListener("input", updateSerialRangeDisplay);
      console.log("Listener inputQty ditambahkan");
    }

    if (btnStartTesting) {
      btnStartTesting.addEventListener("click", startTesting);
      console.log("Listener btnStartTesting ditambahkan");
    }

    if (btnCancelTest) {
      btnCancelTest.addEventListener("click", confirmCancelTest);
      console.log("Listener btnCancelTest ditambahkan");
    }

    if (btnSubmitTest) {
      btnSubmitTest.addEventListener("click", submitTestResults);
      console.log("Listener btnSubmitTest ditambahkan");
    }

    if (btnAddRow) {
      btnAddRow.addEventListener("click", addTableRow);
      console.log("Listener btnAddRow ditambahkan");
    }

    // Input test information listeners - Mencegah reset saat fokus
    const testInfoInputs = [
      "inputTesterName", "inputTestDate", "inputPONumber",
      "inputSerialNumber", "inputQty", "inputMultimeterSN", "inputOscilloscopeSN"
    ];
    
    testInfoInputs.forEach(inputId => {
      const input = document.getElementById(inputId);
      if (input) {
        input.addEventListener('focus', () => {
          console.log(`Input ${inputId} mendapat fokus`);
          // Jangan reset saat input test information difokuskan
        });
      }
    });

    // ESC key to close modals
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeErrorModal();
        closeSuccessModal();
        closeConfirmModal();
      }
    });

    console.log("Semua event listeners berhasil disiapkan");
  } catch (error) {
    console.error("Error menyiapkan event listeners:", error);
  }
}

// ============================================
// LOAD TEST TYPES
// ============================================
async function loadProductTestTypes(productId) {
  try {
    console.log(`Memuat tipe test untuk produk ${productId}...`);
    const result = await window.electronAPI.getProductTestTypes(productId);

    if (result.success) {
      const testTypes = result.data;
      console.log("Tipe test berhasil dimuat:", testTypes);
      renderTestTypeButtons(testTypes);
    } else {
      console.error("Gagal memuat tipe test:", result.error);
      showErrorModal("Gagal memuat tipe test: " + result.error);
    }
  } catch (err) {
    console.error("Error memuat tipe test:", err);
    showErrorModal("Error memuat tipe test: " + err.message);
  }
}

function renderTestTypeButtons(testTypes) {
  const testTypeList = document.getElementById("testTypeList");
  const testTypeSection = document.getElementById("testTypeSection");

  if (!testTypeList || !testTypeSection) {
    console.error("Elemen tipe test tidak ditemukan");
    return;
  }

  if (testTypes.length === 0) {
    testTypeList.innerHTML =
      '<p class="col-span-3 text-center text-gray-500 text-sm">Tidak ada tipe test tersedia untuk produk ini</p>';
    testTypeSection.classList.remove("hidden");
    console.log("Tidak ada tipe test tersedia");
    return;
  }

  testTypeList.innerHTML = "";

  testTypes.forEach((testType) => {
    const button = document.createElement("button");
    button.className = "test-type-btn";
    button.setAttribute("data-test-type-id", testType.id);
    button.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <div class="font-semibold text-gray-800">${testType.name}</div>
                </div>
                <div class="bg-gray-700 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                    ${testType.sequence_order}
                </div>
            </div>
        `;
    button.onclick = (e) => {
      // Simpan event untuk digunakan nanti
      if (e) e.stopPropagation();
      selectTestType(testType);
    };
    testTypeList.appendChild(button);
  });

  testTypeSection.classList.remove("hidden");
  console.log("Tombol tipe test dirender:", testTypes.length);
}

// ============================================
// TEST TYPE SELECTION - PERBAIKAN
// ============================================
async function selectTestType(testType) {
  // Validasi bahwa selectedProduct tidak null
  if (!selectedProduct || !selectedProduct.id) {
    console.error("selectedProduct tidak valid saat memilih test type:", selectedProduct);
    showErrorModal("Silakan pilih produk dan device terlebih dahulu sebelum memilih tipe test.");
    return;
  }

  selectedTestType = {
    id: testType.id,
    name: testType.name,
    sequence: testType.sequence_order,
  };
  console.log("Tipe test dipilih:", selectedTestType);

  // Update UI untuk menunjukkan test type yang dipilih
  document.querySelectorAll("#testTypeList button").forEach((btn) => {
    btn.classList.remove("selected");
  });
  
  // Gunakan current event atau fallback
  const currentEvent = event || window.event;
  if (currentEvent && currentEvent.target) {
    currentEvent.target.closest("button").classList.add("selected");
  } else {
    // Fallback: jika event tidak tersedia, pilih button pertama
    const button = document.querySelector(`#testTypeList button[data-test-type-id="${testType.id}"]`);
    if (button) {
      button.classList.add("selected");
    }
  }

  try {
    await loadTestParameters();
    await loadTemplate();

    const testInfoSection = document.getElementById("testInfoSection");
    if (testInfoSection) {
      if (templateData) {
        testInfoSection.classList.remove("hidden");
        console.log("Section info test ditampilkan");
      } else {
        testInfoSection.classList.add("hidden");
        console.log("Section info test disembunyikan - tidak ada template");
      }
    }
  } catch (error) {
    console.error("Error saat memilih test type:", error);
    showErrorModal("Terjadi kesalahan saat memuat template. Silakan coba lagi.");
  }
}

// ============================================
// LOAD TEST PARAMETERS
// ============================================
async function loadTestParameters() {
  try {
    console.log(
      `Memuat parameter test untuk produk ${selectedProduct.id}, test ${selectedTestType.id}`
    );
    const result = await window.electronAPI.getTestParameters({
      productId: selectedProduct.id,
      testTypeId: selectedTestType.id,
    });

    if (result.success) {
      testParameters = result.data;
      console.log("Parameter test berhasil dimuat:", testParameters.length);
    } else {
      console.error("Gagal memuat parameter:", result.error);
      testParameters = [];
    }
  } catch (err) {
    console.error("Error memuat parameter:", err);
    testParameters = [];
  }
}

// ============================================
// LOAD TEMPLATE - PERBAIKAN
// ============================================
async function loadTemplate() {
  try {
    console.log(`Memuat template untuk produk:`, selectedProduct);

    // Validasi bahwa selectedProduct tidak null
    if (!selectedProduct || !selectedProduct.id) {
      console.error("selectedProduct tidak valid di loadTemplate:", selectedProduct);
      showErrorModal("Produk tidak valid. Silakan pilih produk dan device kembali.");
      templateData = null;
      return;
    }

    // Validasi bahwa selectedTestType tidak null
    if (!selectedTestType || !selectedTestType.id) {
      console.error("selectedTestType tidak valid di loadTemplate:", selectedTestType);
      showErrorModal("Tipe test tidak valid. Silakan pilih tipe test kembali.");
      templateData = null;
      return;
    }

    console.log(`Memuat template untuk produk ${selectedProduct.id} dan test type ${selectedTestType.id}`);
    const result = await window.electronAPI.getTemplatesByProduct(
      selectedProduct.id
    );

    if (result.success) {
      const templates = result.data;
      console.log("Template tersedia:", templates);
      
      const template = templates.find(
        (t) => t.test_type_id === selectedTestType.id
      );

      if (template) {
        templateData = template;
        console.log("Template berhasil dimuat:", templateData.template_name);
        
        // Tampilkan test parameters setelah template dimuat
        displayTestParameters();
      } else {
        console.warn("Tidak ada template ditemukan untuk produk dan tipe test ini");
        console.log("Product ID:", selectedProduct.id, "Test Type ID:", selectedTestType.id);
        console.log("Available templates:", templates);
        
        showErrorModal(
          "Tidak ada template ditemukan untuk produk dan tipe test ini. Silakan buat template terlebih dahulu di halaman Generate."
        );
        templateData = null;
        
        // Sembunyikan test info section jika tidak ada template
        const testInfoSection = document.getElementById("testInfoSection");
        if (testInfoSection) {
          testInfoSection.classList.add("hidden");
        }
      }
    } else {
      console.error("Gagal memuat template:", result.error);
      showErrorModal("Gagal memuat template: " + result.error);
      templateData = null;
    }
  } catch (err) {
    console.error("Error memuat template:", err);
    showErrorModal("Error memuat template: " + err.message);
    templateData = null;
  }
}

// ============================================
// DISPLAY TEST PARAMETERS
// ============================================
function displayTestParameters() {
  const container = document.getElementById("testParametersDisplay");
  if (!container) {
    console.error("Kontainer testParametersDisplay tidak ditemukan");
    return;
  }

  if (testParameters.length === 0) {
    container.innerHTML =
      '<p class="text-[11px] text-gray-600">Tidak ada parameter test yang ditentukan untuk tipe test ini</p>';
    return;
  }

  let html = '<div class="grid grid-cols-1 gap-2">';

  testParameters.forEach((param) => {
    html += `
      <div class="grid grid-cols-3 items-center gap-2 pb-1">
        <div class="text-[10px] text-gray-600 col-span-1">
          ${param.parameter_name} :
        </div>
        <div class="var-display col-span-2 text-[11px] text-gray-800">
          ${param.parameter_value}
        </div>
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;
  console.log("Parameter test ditampilkan");
}

// ============================================
// START TESTING dengan Validasi Ketat - PERBAIKAN
// ============================================
function startTesting() {
  console.log("Memulai testing...");

  // Validasi bahwa selectedProduct sudah ada (device sudah dipilih)
  if (!selectedProduct || !selectedProduct.id) {
    showErrorModal("Silakan pilih device terlebih dahulu sebelum memulai testing.");
    return;
  }

  // Validate inputs
  const testerName = document.getElementById("inputTesterName")?.value.trim();
  const testDate = document.getElementById("inputTestDate")?.value;
  const poNumber = document.getElementById("inputPONumber")?.value.trim();
  const serialNumber = document.getElementById("inputSerialNumber")?.value.trim();
  const qtyInput = document.getElementById("inputQty");
  const qty = qtyInput ? parseInt(qtyInput.value) : 0;
  
  // Validasi untuk input product dan series yang baru
  const productInput = document.getElementById("selectProduct");
  const seriesInput = document.getElementById("selectSeries");
  
  if (!productInput || !seriesInput) {
    showErrorModal("Elemen input tidak ditemukan");
    return;
  }
  
  const productName = productInput.value.trim();
  const seriesDisplay = seriesInput.value.trim();

  console.log("Data validasi:", {
    testerName,
    testDate,
    poNumber,
    serialNumber,
    qty,
    productName,
    seriesDisplay,
    selectedProduct
  });

  if (!testerName) {
    showErrorModal("Masukkan nama tester");
    return;
  }

  if (!testDate) {
    showErrorModal("Pilih tanggal test");
    return;
  }

  if (!poNumber) {
    showErrorModal("Masukkan nomor PO");
    return;
  }

  if (!serialNumber) {
    showErrorModal("Masukkan nomor serial awal");
    return;
  }

  if (!qty || qty < 1) {
    showErrorModal("Masukkan jumlah yang valid");
    return;
  }

  if (!templateData) {
    showErrorModal("Template tidak tersedia. Silakan buat template terlebih dahulu.");
    return;
  }

  // VALIDASI KETAT: Product harus valid
  if (!productName || !productNames.includes(productName)) {
    productInput.classList.add('invalid');
    showErrorModal("Produk tidak valid. Silakan pilih dari daftar produk.");
    return;
  }

  // VALIDASI KETAT: Device harus valid
  const matchingSeries = currentSeriesOptions.find(opt => opt.display === seriesDisplay);
  
  if (!matchingSeries) {
    seriesInput.classList.add('invalid');
    showErrorModal("Device tidak valid. Silakan pilih dari daftar device.");
    return;
  }

  // Pastikan test type sudah dipilih
  if (!selectedTestType) {
    showErrorModal("Silakan pilih tipe test terlebih dahulu.");
    return;
  }

  // Store test information
  testInformation = {
    testerName,
    testDate,
    multimeterSN: document.getElementById("inputMultimeterSN")?.value.trim() || "",
    oscilloscopeSN: document.getElementById("inputOscilloscopeSN")?.value.trim() || "",
    poNumber,
    startingSerial: parseInt(serialNumber) || 0,
    qty,
    productName: `${matchingSeries.productData.product_name} - ${
      matchingSeries.productData.series_number || matchingSeries.productData.series || ""
    }`,
    testTypeName: selectedTestType.name,
  };

  // Simpan selectedProduct dari matchingSeries
  selectedProduct = {
    id: matchingSeries.productData.id,
    name: matchingSeries.productData.product_name,
    series_number: matchingSeries.productData.series_number,
    series: matchingSeries.productData.series,
  };

  console.log("Informasi test disimpan:", testInformation);

  // Switch to testing section
  document.getElementById("setupSection").classList.add("hidden");
  document.getElementById("testingSection").classList.remove("hidden");
  testingInProgress = true;

  // Display test information
  displayTestInformation();
  displayTestParameters();
  generateTestingTable();

  console.log("Testing berhasil dimulai");
}

// ============================================
// DISPLAY TEST INFORMATION
// ============================================
function displayTestInformation() {
  const elements = {
    product: document.getElementById("displayProduct"),
    testType: document.getElementById("displayTestType"),
    tester: document.getElementById("displayTester"),
    date: document.getElementById("displayDate"),
    po: document.getElementById("displayPO"),
    serial: document.getElementById("displaySerial"),
    qty: document.getElementById("displayQty"),
  };

  // Check if all elements exist
  for (const [key, element] of Object.entries(elements)) {
    if (!element) {
      console.error(`Elemen display${key} tidak ditemukan`);
      return;
    }
  }

  // FIX: Display series and series_number instead of product name
  let productDisplay = "";
  if (selectedProduct.series && selectedProduct.series_number) {
    productDisplay = `${selectedProduct.series} - ${selectedProduct.series_number}`;
  } else if (selectedProduct.series) {
    productDisplay = selectedProduct.series;
  } else if (selectedProduct.series_number) {
    productDisplay = selectedProduct.series_number;
  } else {
    // Fallback to product name if no series info available
    productDisplay = selectedProduct.name;
  }

  elements.product.textContent = productDisplay;
  elements.testType.textContent = testInformation.testTypeName;
  elements.tester.textContent = testInformation.testerName;
  elements.date.textContent = testInformation.testDate;
  elements.po.textContent = testInformation.poNumber;

  const endSerial = testInformation.startingSerial + testInformation.qty - 1;
  elements.serial.textContent = `${testInformation.startingSerial} - ${endSerial}`;
  elements.qty.textContent = testInformation.qty;

  console.log(
    "Informasi test ditampilkan dengan info seri:",
    productDisplay
  );
}

// ============================================
// GENERATE TESTING TABLE
// ============================================
function generateTestingTable() {
  if (!templateData || !templateData.custom_columns) {
    showErrorModal("Data template tidak valid");
    return;
  }

  // Filter out reference parameters (product_test_parameters)
  const allColumns = templateData.custom_columns.columns || [];
  const customColumns = allColumns.filter((col) => !col.isReference);

  if (customColumns.length === 0) {
    showErrorModal("Tidak ada kolom custom ditemukan di template");
    return;
  }

  const thead = document.getElementById("testingTableHead");
  const tbody = document.getElementById("testingTableBody");

  if (!thead || !tbody) {
    console.error("Elemen tabel tidak ditemukan");
    return;
  }

  // Generate table headers
  thead.innerHTML = "";
  tbody.innerHTML = "";

  const headerRow1 = document.createElement("tr");
  const headerRow2 = document.createElement("tr");
  let hasSubColumns = false;

  // Default columns
  ["No", "Serial Number"].forEach((name) => {
    const th = document.createElement("th");
    th.rowSpan = 2;
    th.textContent = name;
    headerRow1.appendChild(th);
  });

  // Custom columns from template
  customColumns.forEach((col, index) => {
    if (col.isSplit && col.sub && col.sub.length > 0) {
      hasSubColumns = true;
      const th = document.createElement("th");
      th.colSpan = col.sub.length;
      th.textContent = col.name;
      headerRow1.appendChild(th);

      col.sub.forEach((subCol) => {
        const subTh = document.createElement("th");
        subTh.className = "sub-header";

        // MODIFIED: Unit ditempatkan setelah LSL dan USL
        let headerContent = `<div class="text-[0.6rem] font-semibold">${subCol.name}</div>`;

        if (subCol.validationType === "lsl_usl") {
          if (subCol.lsl || subCol.usl) {
            headerContent += `<div class="text-[0.6rem] text-gray-100">`;
            if (subCol.lsl) headerContent += `LSL: ${subCol.lsl}`;
            if (subCol.lsl && subCol.usl) headerContent += ` | `;
            if (subCol.usl) headerContent += `USL: ${subCol.usl}`;
            // Tambahkan unit setelah LSL/USL jika ada
            if (subCol.unit) headerContent += ` ${subCol.unit}`;
            headerContent += `</div>`;
          } else if (subCol.unit) {
            // Jika tidak ada LSL/USL tapi ada unit, tampilkan unit saja
            headerContent += `<div class="text-[0.6rem] text-gray-100">Unit: ${subCol.unit}</div>`;
          }
        } else if (subCol.validationType === "pass_fail") {
          // Hanya tampilkan nama dan unit (jika ada) untuk pass_fail
          if (subCol.unit) {
            headerContent += `<div class="text-[0.6rem] text-gray-100">Unit: ${subCol.unit}</div>`;
          }
          // Expected value dihapus dari header pass/fail
        }

        subTh.innerHTML = headerContent;
        subTh.setAttribute("data-col-id", `${index}_${subCol.id}`);
        subTh.setAttribute("data-validation", subCol.validationType);
        subTh.setAttribute("data-lsl", subCol.lsl || "");
        subTh.setAttribute("data-usl", subCol.usl || "");
        subTh.setAttribute("data-expected", subCol.expectedValue || "");
        headerRow2.appendChild(subTh);
      });
    } else {
      const th = document.createElement("th");
      th.rowSpan = 2;

      // MODIFIED: Unit ditempatkan setelah LSL dan USL
      let headerContent = `<div class="font-semibold">${col.name}</div>`;

      if (col.validationType === "lsl_usl") {
        if (col.lsl || col.usl) {
          headerContent += `<div class="text-xs text-gray-100">`;
          if (col.lsl) headerContent += `LSL: ${col.lsl}`;
          if (col.lsl && col.usl) headerContent += ` | `;
          if (col.usl) headerContent += `USL: ${col.usl}`;
          // Tambahkan unit setelah LSL/USL jika ada
          if (col.unit) headerContent += ` ${col.unit}`;
          headerContent += `</div>`;
        } else if (col.unit) {
          // Jika tidak ada LSL/USL tapi ada unit, tampilkan unit saja
          headerContent += `<div class="text-xs text-gray-100">Unit: ${col.unit}</div>`;
        }
      } else if (col.validationType === "pass_fail") {
        // Hanya tampilkan nama dan unit (jika ada) untuk pass_fail
        if (col.unit) {
          headerContent += `<div class="text-xs text-gray-100">Unit: ${col.unit}</div>`;
        }
        // HAPUS: Expected value dihapus dari header pass/fail
      }

      th.innerHTML = headerContent;
      th.setAttribute("data-col-id", index);
      th.setAttribute("data-validation", col.validationType);
      th.setAttribute("data-lsl", col.lsl || "");
      th.setAttribute("data-usl", col.usl || "");
      th.setAttribute("data-expected", col.expectedValue || "");
      headerRow1.appendChild(th);
    }
  });

  // Status and Remarks columns
  const statusTh = document.createElement("th");
  statusTh.rowSpan = 2;
  statusTh.textContent = "Status";
  headerRow1.appendChild(statusTh);

  const remarksTh = document.createElement("th");
  remarksTh.rowSpan = 2;
  remarksTh.textContent = "Remarks";
  headerRow1.appendChild(remarksTh);

  thead.appendChild(headerRow1);
  if (hasSubColumns) thead.appendChild(headerRow2);

  // Generate rows based on quantity
  tableRows = [];
  rowCounter = 0;
  for (let i = 0; i < testInformation.qty; i++) {
    const row = generateTableRow(customColumns, i + 1);
    tbody.appendChild(row);
    tableRows.push(row);
  }

  console.log("Tabel testing dibuat dengan", testInformation.qty, "baris");
}

function generateTableRow(columns, rowNumber) {
  const tr = document.createElement("tr");
  tr.setAttribute("data-row-id", rowNumber);

  const currentSerial = testInformation.startingSerial + rowNumber - 1;

  // No
  const tdNo = document.createElement("td");
  tdNo.textContent = rowNumber;
  tdNo.className = "font-semibold text-gray-700";
  tr.appendChild(tdNo);

  // Serial Number
  const tdSerial = document.createElement("td");
  tdSerial.textContent = currentSerial;
  tdSerial.className = "font-semibold text-gray-800";
  tdSerial.setAttribute("data-serial", currentSerial);
  tr.appendChild(tdSerial);

  // Custom columns
  columns.forEach((col, colIndex) => {
    if (col.isSplit && col.sub && col.sub.length > 0) {
      col.sub.forEach((subCol) => {
        const td = document.createElement("td");

        if (subCol.validationType === "pass_fail") {
          const select = document.createElement("select");
          select.className = "w-full";
          select.innerHTML = `
                        <option value="">--</option>
                        <option value="Pass">Pass</option>
                        <option value="Fail">Fail</option>
                    `;
          select.setAttribute("data-col-id", `${colIndex}_${subCol.id}`);
          select.setAttribute("data-validation", subCol.validationType);
          select.setAttribute("data-expected", subCol.expectedValue || "Pass");
          select.addEventListener("change", () => {
            validateInput(select, tr);
            updateDropdownColor(select);
          });
          td.appendChild(select);
        } else {
          // Use input for LSL/USL
          const input = document.createElement("input");
          input.type = "number";
          input.step = "any";
          input.className = "w-full no-spinner";
          input.setAttribute("data-col-id", `${colIndex}_${subCol.id}`);
          input.setAttribute("data-validation", subCol.validationType);
          input.setAttribute("data-lsl", subCol.lsl || "");
          input.setAttribute("data-usl", subCol.usl || "");
          input.addEventListener("input", () => validateInput(input, tr));
          td.appendChild(input);
        }

        tr.appendChild(td);
      });
    } else {
      const td = document.createElement("td");

      if (col.validationType === "pass_fail") {
        // Use dropdown for pass/fail with color update
        const select = document.createElement("select");
        select.className = "w-full";
        select.innerHTML = `
                    <option value="">--</option>
                    <option value="Pass">Pass</option>
                    <option value="Fail">Fail</option>
                `;
        select.setAttribute("data-col-id", colIndex);
        select.setAttribute("data-validation", col.validationType);
        select.setAttribute("data-expected", col.expectedValue || "Pass");
        select.addEventListener("change", () => {
          validateInput(select, tr);
          updateDropdownColor(select);
        });
        td.appendChild(select);
      } else {
        // Use input for LSL/USL
        const input = document.createElement("input");
        input.type = "number";
        input.step = "any";
        input.className = "w-full no-spinner";
        input.setAttribute("data-col-id", colIndex);
        input.setAttribute("data-validation", col.validationType);
        input.setAttribute("data-lsl", col.lsl || "");
        input.setAttribute("data-usl", col.usl || "");
        input.addEventListener("input", () => validateInput(input, tr));
        td.appendChild(input);
      }

      tr.appendChild(td);
    }
  });

  // Status - Default FAIL
  const tdStatus = document.createElement("td");
  tdStatus.className = "status-cell";
  const statusDiv = document.createElement("div");
  statusDiv.className = "status-fail";
  statusDiv.textContent = "Fail";
  tdStatus.appendChild(statusDiv);
  tr.appendChild(tdStatus);

  // Remarks
  const tdRemarks = document.createElement("td");
  const remarksInput = document.createElement("input");
  remarksInput.type = "text";
  remarksInput.className = "w-full";
  tdRemarks.appendChild(remarksInput);
  tr.appendChild(tdRemarks);

  return tr;
}

// ============================================
// ADD ROW
// ============================================
function addTableRow() {
  const tbody = document.getElementById("testingTableBody");
  if (!tbody) return;

  const allColumns = templateData.custom_columns.columns || [];
  const customColumns = allColumns.filter((col) => !col.isReference);

  const newRowNumber = tableRows.length + 1;
  const row = generateTableRow(customColumns, newRowNumber);
  tbody.appendChild(row);
  tableRows.push(row);

  // Update test information qty
  testInformation.qty = tableRows.length;
  const displayQty = document.getElementById("displayQty");
  if (displayQty) {
    displayQty.textContent = testInformation.qty;
  }

  const endSerial = testInformation.startingSerial + testInformation.qty - 1;
  const displaySerial = document.getElementById("displaySerial");
  if (displaySerial) {
    displaySerial.textContent = `${testInformation.startingSerial} - ${endSerial}`;
  }

  console.log("Baris ditambahkan, total baris:", tableRows.length);
}

// ============================================
// UPDATE DROPDOWN COLOR
// ============================================
function updateDropdownColor(select) {
  const value = select.value.trim();
  const expectedValue = select.getAttribute("data-expected");

  select.classList.remove("valid", "invalid");

  if (!value || value === "--") {
    return;
  }

  if (value === expectedValue) {
    select.classList.add("valid");
  } else {
    select.classList.add("invalid");
  }
}

// ============================================
// VALIDATE INPUT
// ============================================
function validateInput(element, row) {
  const validationType = element.getAttribute("data-validation");
  const value = element.value.trim();

  if (!value) {
    element.classList.remove("valid", "invalid");
    checkRowCompletion(row);
    return;
  }

  let isValid = true;

  if (validationType === "lsl_usl") {
    const numValue = parseFloat(value);
    const lsl = element.getAttribute("data-lsl");
    const usl = element.getAttribute("data-usl");

    if (lsl && numValue < parseFloat(lsl)) {
      isValid = false;
    }
    if (usl && numValue > parseFloat(usl)) {
      isValid = false;
    }

    element.classList.remove("valid", "invalid");
    element.classList.add(isValid ? "valid" : "invalid");
  } else if (validationType === "pass_fail") {
    const expectedValue = element.getAttribute("data-expected");
    isValid = value === expectedValue;

    element.classList.remove("valid", "invalid");
    element.classList.add(isValid ? "valid" : "invalid");
  }

  checkRowCompletion(row);
}

function checkRowCompletion(row) {
  const inputs = row.querySelectorAll(
    "input[data-validation], select[data-validation]"
  );
  let allFilled = true;
  let allValid = true;

  inputs.forEach((element) => {
    const value = element.value.trim();

    if (!value) {
      allFilled = false;
      return;
    }

    const validationType = element.getAttribute("data-validation");

    if (validationType === "lsl_usl") {
      const numValue = parseFloat(value);
      const lsl = element.getAttribute("data-lsl");
      const usl = element.getAttribute("data-usl");

      if (lsl && numValue < parseFloat(lsl)) allValid = false;
      if (usl && numValue > parseFloat(usl)) allValid = false;
    } else if (validationType === "pass_fail") {
      const expectedValue = element.getAttribute("data-expected");
      if (value !== expectedValue) allValid = false;
    }
  });

  // Default is FAIL, only PASS if all filled and valid
  if (allFilled && allValid) {
    updateRowStatus(row, "pass");
  } else {
    updateRowStatus(row, "fail");
  }
}

function updateRowStatus(row, status) {
  const statusCell = row.querySelector(".status-cell div");
  if (!statusCell) return;

  statusCell.className = "";
  if (status === "pass") {
    statusCell.className = "status-pass";
    statusCell.textContent = "Pass";
  } else {
    statusCell.className = "status-fail";
    statusCell.textContent = "Fail";
  }
}

// ============================================
// SUBMIT TEST RESULTS
// ============================================
async function submitTestResults() {
  // Validate all rows are complete
  let allComplete = true;
  const entries = [];

  tableRows.forEach((row, index) => {
    const inputs = row.querySelectorAll(
      "input[data-validation], select[data-validation]"
    );
    const remarksInput = row.querySelector("td:nth-last-child(1) input");
    const statusDiv = row.querySelector(".status-cell div");
    const serialCell = row.querySelector("td:nth-child(2)");
    const serialNumber = serialCell
      ? serialCell.getAttribute("data-serial")
      : "";

    let rowData = {
      rowNumber: index + 1,
      serialNumber: serialNumber,
      displaySerialNumber: serialNumber,
      status: statusDiv ? statusDiv.textContent : "Fail",
      remarks: remarksInput ? remarksInput.value : "",
      testResults: {},
    };

    inputs.forEach((element) => {
      if (!element.value.trim()) {
        allComplete = false;
      }

      const colId = element.getAttribute("data-col-id");
      rowData.testResults[colId] = {
        value: element.value,
        validation: element.getAttribute("data-validation"),
        lsl: element.getAttribute("data-lsl") || "",
        usl: element.getAttribute("data-usl") || "",
        expected: element.getAttribute("data-expected") || "",
      };
    });

    entries.push(rowData);
  });

  if (!allComplete) {
    showErrorModal(
      "Harap lengkapi semua entri test sebelum submit. Semua field harus diisi."
    );
    return;
  }

  // Confirm submission
  const passCount = entries.filter((e) => e.status === "Pass").length;
  const failCount = entries.filter((e) => e.status === "Fail").length;

  showConfirmModal(
    "Submit Hasil Test",
    `Siap submit ${entries.length} entri test:\n\nLulus: ${passCount}\nGagal: ${failCount}\n\nLanjutkan submit?`,
    async () => {
      try {
        const submitData = {
          templateId: templateData.id,
          productId: selectedProduct.id,
          testTypeId: selectedTestType.id,
          operatorName: testInformation.testerName,
          testDate: testInformation.testDate,
          poNumber: testInformation.poNumber,
          entries: entries,
        };

        const result = await window.electronAPI.submitTestEntries(submitData);

        if (result.success) {
          testingInProgress = false;
          showSuccessModal(
            `Data testing berhasil disubmit!\n\n Pass: ${passCount} | Fail: ${failCount}`
          );
        } else {
          showErrorModal("Gagal submit: " + result.error);
        }
      } catch (err) {
        console.error("Error submitting:", err);
        showErrorModal("Error submit: " + err.message);
      }
    }
  );
}

// ============================================
// CANCEL TEST
// ============================================
function confirmCancelTest() {
  showConfirmModal(
    "Batalkan Testing",
    "Yakin ingin membatalkan? Semua data testing akan hilang permanen.",
    () => {
      testingInProgress = false;
      location.reload();
    }
  );
}

// ============================================
// MAKE FUNCTIONS GLOBAL
// ============================================
window.incrementQty = incrementQty;
window.decrementQty = decrementQty;
window.deleteLastRow = deleteLastRow;
window.closeErrorModal = closeErrorModal;
window.closeSuccessModal = closeSuccessModal;
window.closeConfirmModal = closeConfirmModal;

console.log(
  "Testing.js berhasil dimuat - Semua fungsi terekspos ke window"
);