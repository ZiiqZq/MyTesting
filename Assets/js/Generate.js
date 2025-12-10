// Assets/js/Generate.js

// ============================================
// STATE MANAGEMENT
// ============================================
let columns = [];
let colCount = 0;
let selectedProduct = null;
let selectedTestType = null;
let allProducts = [];
let productSeries = [];
let productTestTypes = [];
let referenceParameters = [];

// Simpan data untuk dropdown
let productNames = [];
let currentSeriesOptions = [];

// ============================================
// INITIALIZE
// ============================================
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Template Builder loaded!");
  await loadProducts();
  setupEventListeners();
  setupModalEvents();
  updateEmptyState();
});

// ============================================
// LOAD PRODUCTS
// ============================================
async function loadProducts() {
  try {
    const result = await window.electronAPI.getProducts();
    if (result.success) {
      allProducts = result.data;
      console.log("✅ Products loaded:", allProducts.length);
      populateProductDropdown();
    } else {
      console.error("Error loading products:", result.error);
      showErrorModal("Error Loading Products", result.error);
    }
  } catch (err) {
    console.error("Error loading products:", err);
    showErrorModal("Error Loading Products", err.message);
  }
}

// ============================================
// CUSTOM DROPDOWN FUNCTIONS
// ============================================

function populateProductDropdown() {
  const input = document.getElementById("selectProduct");
  const dropdown = document.getElementById("productDropdown");
  
  if (!input || !dropdown) {
    console.error("Elemen selectProduct tidak ditemukan");
    return;
  }

  dropdown.innerHTML = '';
  input.value = '';

  if (!allProducts || allProducts.length === 0) {
    console.warn("Tidak ada produk tersedia");
    input.disabled = true;
    input.placeholder = "Tidak ada produk tersedia";
    return;
  }

  input.disabled = false;

  // Get unique product names
  productNames = [...new Set(allProducts.map((p) => p.product_name))].sort();
  console.log("Nama produk tersedia:", productNames);

  // Initialize custom dropdown
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

  // Initialize custom dropdown
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
        
        // Reset test type dan reference parameters
        selectedTestType = null;
        productTestTypes = [];
        referenceParameters = [];
        columns = [];
        
        // Reset UI elements
        const testTypeSelectionDiv = document.getElementById("testTypeSelectionDiv");
        const templateNameDiv = document.getElementById("templateNameDiv");
        const testTypeList = document.getElementById("testTypeList");
        
        if (testTypeSelectionDiv) testTypeSelectionDiv.classList.add("hidden");
        if (templateNameDiv) templateNameDiv.classList.add("hidden");
        if (testTypeList) testTypeList.innerHTML = "";
        
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
// CUSTOM DROPDOWN INITIALIZATION
// ============================================

function initializeCustomDropdown(inputId, dropdownId, options, onSelectCallback, isProductDropdown = false) {
  const input = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);
  
  if (!input || !dropdown) return;

  let currentFilter = '';
  let selectedIndex = -1;
  let lastValidValue = '';
  let isManualInput = false;

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

  // Fungsi untuk memposisikan dropdown
  function positionDropdown() {
    const inputRect = input.getBoundingClientRect();
    
    // Set posisi dan styling dropdown
    dropdown.style.position = 'fixed';
    dropdown.style.top = `${inputRect.bottom + window.scrollY}px`;
    dropdown.style.left = `${inputRect.left + window.scrollX}px`;
    dropdown.style.width = `${inputRect.width}px`;
    dropdown.style.maxHeight = '300px';
    dropdown.style.zIndex = '9999';
    dropdown.style.backgroundColor = 'white';
    dropdown.style.border = '1px solid #d1d5db';
    dropdown.style.borderRadius = '0.5rem';
    dropdown.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
    dropdown.style.overflowY = 'auto';
  }

  // function resetCustomColumns() {
  //   columns = [];
  //   colCount = 0;
  //   renderColumns();
  //   updatePreview();
  //   updateEmptyState();
  //   console.log("Custom columns have been reset");
  // }

  // Show dropdown on focus
  input.addEventListener('focus', () => {
    dropdown.classList.add('active');
    renderDropdown('');
    selectedIndex = -1;
    positionDropdown();
  });

  // Event untuk input
  input.addEventListener('input', (e) => {
    const value = e.target.value.trim();
    dropdown.classList.add('active');
    renderDropdown(value);
    selectedIndex = -1;
    positionDropdown();
    
    // Check if input value is valid
    const isValid = options.includes(value);
    isManualInput = true;
    
    // Reset custom columns ketika input berubah (baik valid maupun tidak)
    // TAPI jangan renderColumns di sini, cukup reset state
    if (value !== lastValidValue) {
      columns = [];
      colCount = 0;
      console.log("Custom columns reset due to input change");
      
      // Untuk dropdown produk, juga reset bagian bawah
      if (isProductDropdown) {
        resetSeriesAndBelow();
      }
    }
    
    // Jika input berubah dan tidak valid, reset bagian bawah
    if (value && !isValid) {
      input.classList.add('invalid');
      
      // Reset bagian bawah berdasarkan tipe dropdown
      if (isProductDropdown) {
        // Jika ini dropdown product dan input tidak valid
        if (value !== lastValidValue) {
          resetSeriesAndBelow();
        }
      } else {
        // Jika ini dropdown series dan input tidak valid
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
        showErrorModal("Error", "Invalid choice, please select from the dropdown.");
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

  // Update posisi dropdown saat window di-resize atau di-scroll
  window.addEventListener('resize', () => {
    if (dropdown.classList.contains('active')) {
      positionDropdown();
    }
  });

  window.addEventListener('scroll', () => {
    if (dropdown.classList.contains('active')) {
      positionDropdown();
    }
  }, true);

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    // Jangan tutup jika klik terjadi di dalam input atau dropdown
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove('active');
      selectedIndex = -1;
      
      // Validate when losing focus
      const currentValue = input.value.trim();
      
      // Reset custom columns jika nilai berubah
      if (currentValue !== lastValidValue) {
        columns = [];
        colCount = 0;
        console.log("Custom columns reset due to focus loss");
        
        // Untuk dropdown produk, juga reset bagian bawah
        if (isProductDropdown) {
          resetSeriesAndBelow();
        }
      }
      
      // Jangan reset jika value valid atau sama dengan lastValidValue
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
        // Reset custom columns
        columns = [];
        colCount = 0;
        console.log("Custom columns reset due to empty input");
      }
    }
  });

  // Initial render
  renderDropdown('');
}


// ============================================
// RESET FUNCTIONS
// ============================================

function resetSeriesAndBelow() {
  console.log("Resetting series and below...");
  
  const seriesSelectionDiv = document.getElementById("seriesSelectionDiv");
  const testTypeSelectionDiv = document.getElementById("testTypeSelectionDiv");
  const templateNameDiv = document.getElementById("templateNameDiv");
  
  if (seriesSelectionDiv) seriesSelectionDiv.classList.add("hidden");
  if (testTypeSelectionDiv) testTypeSelectionDiv.classList.add("hidden");
  if (templateNameDiv) templateNameDiv.classList.add("hidden");
  
  // Reset state
  selectedProduct = null;
  selectedTestType = null;
  productSeries = [];
  productTestTypes = [];
  referenceParameters = [];
  columns = [];
  colCount = 0;
  
  // Clear series input
  const seriesInput = document.getElementById("selectSeries");
  if (seriesInput) {
    seriesInput.value = '';
    seriesInput.classList.remove('invalid');
    // Clear series dropdown
    const seriesDropdown = document.getElementById("seriesDropdown");
    if (seriesDropdown) {
      seriesDropdown.innerHTML = "";
      seriesDropdown.classList.remove("active");
    }
  }
  
  // Clear test type buttons
  const testTypeList = document.getElementById("testTypeList");
  if (testTypeList) testTypeList.innerHTML = "";
  
  // Clear preview
  updatePreview();
  updateEmptyState();
  
  console.log("Series and below have been reset");
}

function resetTestTypeAndBelow() {
  console.log("Resetting test type and below...");
  
  const testTypeSelectionDiv = document.getElementById("testTypeSelectionDiv");
  const templateNameDiv = document.getElementById("templateNameDiv");
  
  if (testTypeSelectionDiv) testTypeSelectionDiv.classList.add("hidden");
  if (templateNameDiv) templateNameDiv.classList.add("hidden");
  
  // Reset state - TIDAK reset selectedProduct di sini
  selectedTestType = null;
  productTestTypes = [];
  referenceParameters = [];
  columns = [];
  colCount = 0;
  
  // Clear test type buttons
  const testTypeList = document.getElementById("testTypeList");
  if (testTypeList) testTypeList.innerHTML = "";
  
  // Update UI tanpa renderColumns (karena columns kosong)
  updatePreview();
  updateEmptyState();
  
  console.log("Test type and below have been reset");
}
// ============================================
// PRODUCT SELECTION HANDLER
// ============================================
function onProductSelect(productName) {
  console.log("Produk dipilih:", productName);

  // Reset state terlebih dahulu - HANYA reset yang terkait series dan di bawahnya
  productSeries = [];
  currentSeriesOptions = [];
  
  // Reset custom columns
  columns = [];
  colCount = 0;
  
  // Hanya reset selectedTestType, jangan reset selectedProduct
  selectedTestType = null;
  productTestTypes = [];
  referenceParameters = [];

  const seriesSelectionDiv = document.getElementById("seriesSelectionDiv");
  const testTypeSelectionDiv = document.getElementById("testTypeSelectionDiv");
  const templateNameDiv = document.getElementById("templateNameDiv");

  if (seriesSelectionDiv) seriesSelectionDiv.classList.add("hidden");
  if (testTypeSelectionDiv) testTypeSelectionDiv.classList.add("hidden");
  if (templateNameDiv) templateNameDiv.classList.add("hidden");

  // Clear series input
  const seriesInput = document.getElementById("selectSeries");
  if (seriesInput) {
    seriesInput.value = '';
    seriesInput.classList.remove('invalid');
  }

  // Clear test type buttons
  const testTypeList = document.getElementById("testTypeList");
  if (testTypeList) testTypeList.innerHTML = "";

  // Clear preview dan columns
  renderColumns();
  updatePreview();
  updateEmptyState();

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
    showErrorModal("Error", "Invalid choice, please select Product from the dropdown.");
    selectedProduct = null;
    return;
  }

  // Filter products by selected product name
  productSeries = allProducts.filter((p) => p.product_name === productName);
  console.log("Seri produk yang difilter:", productSeries);

  if (productSeries.length === 0) {
    console.warn("Tidak ada seri ditemukan untuk produk:", productName);
    showErrorModal("Error", "No device found for this product.");
    selectedProduct = null;
    return;
  }

  // JANGAN set selectedProduct dari product pertama
  // Biarkan selectedProduct null sampai user benar-benar memilih device

  populateSeriesDropdown();

  if (seriesSelectionDiv) {
    seriesSelectionDiv.classList.remove("hidden");
    console.log("Kontainer seri ditampilkan");
  }
}
// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
  const btnAddColumn = document.getElementById("btnAddColumn");
  if (btnAddColumn) {
    btnAddColumn.addEventListener("click", () => addColumn());
  }

  const btnSave = document.getElementById("btnSave");
  if (btnSave) {
    btnSave.addEventListener("click", saveTemplate);
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
      productTestTypes = result.data;
      console.log("Tipe test berhasil dimuat:", productTestTypes.length);
      renderTestTypeButtons();
      
      // Show test type selection
      const testTypeSelectionDiv = document.getElementById("testTypeSelectionDiv");
      if (testTypeSelectionDiv) {
        testTypeSelectionDiv.classList.remove("hidden");
      }
    } else {
      console.error("Gagal memuat tipe test:", result.error);
      showErrorModal("Error", "Failed to load test type: " + result.error);
    }
  } catch (err) {
    console.error("Error memuat tipe test:", err);
    showErrorModal("Error", "Error loading test type: " + err.message);
  }
}

function renderTestTypeButtons() {
  const testTypeList = document.getElementById("testTypeList");
  if (!testTypeList) return;

  if (productTestTypes.length === 0) {
    testTypeList.innerHTML =
      '<p class="col-span-3 text-center text-gray-500 text-sm">Tidak ada tipe test tersedia untuk produk ini</p>';
    return;
  }

  testTypeList.innerHTML = "";

  productTestTypes.forEach((testType) => {
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

  console.log("Tombol tipe test dirender:", productTestTypes.length);
}

// ============================================
// TEST TYPE SELECTION
// ============================================
async function selectTestType(testType) {
  // Validasi bahwa selectedProduct tidak null
  if (!selectedProduct || !selectedProduct.id) {
    console.error("selectedProduct tidak valid saat memilih test type:", selectedProduct);
    showErrorModal("Select product, device, and test type before adding a column.");
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
  if (event && event.target) {
    event.target.closest("button").classList.add("selected");
  } else {
    // Fallback: jika event tidak tersedia, pilih button pertama
    const button = document.querySelector(`#testTypeList button[data-test-type-id="${testType.id}"]`);
    if (button) {
      button.classList.add("selected");
    }
  }

  try {
    await loadReferenceParameters(selectedProduct.id, selectedTestType.id);
    updateTemplateName();
    updatePreview();
  } catch (error) {
    console.error("Error saat memilih test type:", error);
    showErrorModal("Error", "An error occurred while loading the template. Please try again.");
  }
}

// ============================================
// LOAD REFERENCE PARAMETERS
// ============================================
async function loadReferenceParameters(productId, testTypeId) {
  try {
    const result = await window.electronAPI.getTestParameters({
      productId,
      testTypeId,
    });
    if (result.success) {
      referenceParameters = result.data;
      console.log(
        "✅ Reference parameters loaded:",
        referenceParameters.length
      );
      renderReferenceParametersInfo();
    } else {
      console.error("Error loading parameters:", result.error);
    }
  } catch (err) {
    console.error("Error loading parameters:", err);
  }
}

function renderReferenceParametersInfo() {
  const div = document.getElementById("referenceParamsDiv");
  const list = document.getElementById("referenceParamsList");

  if (!div || !list) return;

  if (referenceParameters.length === 0) {
    div.classList.add("hidden");
    return;
  }

  list.innerHTML = "";

  const infoP = document.createElement("p");
  infoP.className = "text-blue-800 font-semibold";
  infoP.innerHTML = `✅ ${referenceParameters.length} pre-defined parameter(s) found for this test.`;
  list.appendChild(infoP);

  const noteP = document.createElement("p");
  noteP.className = "text-blue-600 text-xs mt-2";
  noteP.innerHTML =
    "💡 These parameters will be automatically included in your testing form. You can add additional custom columns below if needed.";
  list.appendChild(noteP);

  const paramNames = referenceParameters
    .map((p) => p.parameter_name)
    .join(", ");
  const namesP = document.createElement("p");
  namesP.className = "text-blue-700 text-sm mt-2";
  namesP.innerHTML = `<strong>Parameters:</strong> ${paramNames}`;
  list.appendChild(namesP);

  div.classList.remove("hidden");
}

function updateTemplateName() {
  if (selectedProduct && selectedTestType) {
    const templateName = `${selectedProduct.name} - ( ${selectedProduct.series}-${selectedProduct.series_number} ) - ${selectedTestType.name}`;
    const input = document.getElementById("templateName");
    const div = document.getElementById("templateNameDiv");
    if (input) input.value = templateName;
    if (div) div.classList.remove("hidden");
  }
}

// ============================================
// COLUMN MANAGEMENT
// ============================================
function addColumn(parentId = null) {
  // Validasi: hanya bisa menambahkan kolom jika produk dan test type sudah dipilih
  if (!selectedProduct || !selectedTestType) {
    showErrorModal("Error", "Select product, device, and test type before adding a column.");
    return;
  }
  
  // Cari nomor kolom terbesar yang sudah ada
  let maxNumber = 0;
  
  function findMaxNumber(cols) {
    cols.forEach(col => {
      // Hanya hitung kolom yang tidak split (parent dengan sub)
      if (!col.isSplit) {
        const match = col.id.match(/col_(\d+)/);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      }
      // Cek sub kolom jika ada
      if (col.sub && col.sub.length > 0) {
        findMaxNumber(col.sub);
      }
    });
  }
  
  findMaxNumber(columns);
  
  // Gunakan nomor berikutnya
  const nextNumber = maxNumber + 1;
  
  const col = {
    id: "col_" + nextNumber,
    name: "",
    isSplit: false,
    validationType: "lsl_usl",
    lsl: "",
    usl: "",
    unit: "",
    expectedValue: "",
    parentId: parentId,
    sub: [],
  };

  if (parentId) {
    const parent = findColumn(parentId);
    if (parent) {
      parent.sub.push(col);
      parent.isSplit = true;
      parent.validationType = null;
    }
  } else {
    columns.push(col);
  }

  // Update colCount untuk referensi berikutnya
  colCount = nextNumber;
  
  renderColumns();
  updatePreview();
  updateEmptyState();
}
function findColumn(id, cols = columns) {
  for (let col of cols) {
    if (col.id === id) return col;
    if (col.sub.length > 0) {
      const found = findColumn(id, col.sub);
      if (found) return found;
    }
  }
  return null;
}

// Fungsi untuk menghapus column langsung tanpa modal konfirmasi
function deleteColumn(columnId) {
  function removeFromArray(arr) {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].id === columnId) {
        arr.splice(i, 1);
        return true;
      }
      if (arr[i].sub.length > 0) {
        if (removeFromArray(arr[i].sub)) return true;
      }
    }
    return false;
  }

  if (removeFromArray(columns)) {
    // Renumber columns setelah menghapus
    renumberColumns();
    renderColumns();
    updatePreview();
    updateEmptyState();
  }
}

// Fungsi untuk menomori ulang kolom setelah penghapusan
function renumberColumns() {
  let counter = 1;
  
  function renumber(cols) {
    for (let i = 0; i < cols.length; i++) {
      const col = cols[i];
      // Hanya renumber kolom yang bukan parent split
      if (!col.isSplit) {
        col.id = "col_" + counter;
        counter++;
      }
      // Rekursif untuk sub kolom jika ada
      if (col.sub && col.sub.length > 0) {
        renumber(col.sub);
      }
    }
  }
  
  renumber(columns);
  // Update colCount ke nilai terbesar
  colCount = counter - 1;
}

function updateCol(id, prop, value) {
  const col = findColumn(id);
  if (col) {
    col[prop] = value;

    if (prop === "validationType") {
      if (value === "pass_fail") {
        col.lsl = "";
        col.usl = "";
        col.unit = "";
        col.expectedValue = "Pass";  // Set default ke "Pass"
      } else if (value === "lsl_usl") {
        col.expectedValue = "";
      }
      renderColumns();
    }

    updatePreview();
  }
}

// Fungsi untuk mendapatkan nomor urut kolom
function getColumnNumber(colId) {
  const match = colId.match(/col_(\d+)/);
  return match ? match[1] : "";
}

function renderColumns() {
  const list = document.getElementById("columnList");
  if (!list) return;

  list.innerHTML = "";

  function renderColumn(col, level = 0) {
    const isParent = col.isSplit && col.sub.length > 0;
    const isSub = level > 0;
    const colNumber = getColumnNumber(col.id);
    const validationType = col.validationType || "lsl_usl";
    const expectedValue = col.expectedValue || "Pass";
    
    // Validasi: jika kolom tidak memiliki id yang valid, beri id baru
    if (!col.id || !col.id.startsWith('col_')) {
      const nextNumber = colCount + 1;
      col.id = "col_" + nextNumber;
      colCount = nextNumber;
    }
    
    // Buat label berdasarkan tipe kolom
    let columnLabel = "";
    if (isParent) {
      columnLabel = `Column ${colNumber}`;
    } else if (isSub) {
      columnLabel = `Sub Column`;
    } else {
      columnLabel = `Column ${colNumber}`;
    }

    const div = document.createElement("div");
    div.className = isSub
      ? "bg-white border-l-4 border-amber-400 rounded-xl p-5 ml-6 mb-4 shadow-sm hover:shadow transition-all duration-300 transform hover:-translate-y-0.5"
      : isParent
      ? "bg-gradient-to-br from-white to-blue-50 border border-blue-100 rounded-xl p-5 mb-4 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
      : "bg-white border border-gray-100 rounded-xl p-5 mb-4 shadow hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1";

    const levelStyle = isSub ? `style="position: relative; padding-left: ${level * 8}px;"` : "";
    
    // Pastikan colNumber valid
    const displayNumber = colNumber || getColumnNumber(col.id);
    
    div.innerHTML = `
            <div ${levelStyle}>
                <div class="flex justify-between items-center mb-4">
                    <div class="flex items-center gap-3">
                        <div class="flex items-center">
                            <div class="${isParent ? 'bg-blue-100 text-blue-600' : isSub ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-600'} w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold mr-3 shadow-sm">
                                ${isParent ? '<i class="fas fa-layer-group text-xs"></i>' : isSub ? '<i class="fas fa-chevron-right text-xs"></i>' : displayNumber}
                            </div>
                            <div>
                                <h4 class="text-base font-semibold ${isParent ? 'text-blue-700' : isSub ? 'text-amber-700' : 'text-gray-700'}">
                                    ${columnLabel}
                                </h4>
                                <p class="text-xs text-gray-500 mt-0.5">
                                    ${isParent ? 'Parent column with sub-columns' : isSub ? 'Child column' : 'Single column'}
                                </p>
                            </div>
                        </div>
                        ${
                          isParent
                            ? '<span class="ml-2 bg-blue-100 text-blue-600 text-xs px-3 py-1 rounded-full font-medium border border-blue-200"><i class="fas fa-sitemap mr-1"></i> Parent</span>'
                            : ""
                        }
                        ${
                          isSub
                            ? '<span class="ml-2 bg-amber-100 text-amber-600 text-xs px-3 py-1 rounded-full font-medium border border-amber-200"><i class="fas fa-chevron-circle-right mr-1"></i> Sub</span>'
                            : ""
                        }
                    </div>
                    <div class="flex gap-2">
                        ${
                          !isSub && !isParent
                            ? `<button onclick="addColumn('${col.id}')" class="cursor-pointer bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow flex items-center gap-2">
                                <i class="fas fa-code-branch text-xs"></i>
                                Split
                               </button>`
                            : ""
                        }
                        ${
                          isParent
                            ? `<button onclick="addColumn('${col.id}')" class="cursor-pointer bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow flex items-center gap-2">
                                <i class="fas fa-plus-circle text-xs"></i>
                                Add Sub
                               </button>`
                            : ""
                        }
                        <button onclick="deleteColumn('${col.id}')" class="cursor-pointer bg-white hover:bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow flex items-center gap-2">
                            <i class="fas fa-trash-alt text-xs"></i>
                            Delete
                        </button>
                    </div>
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        ${isParent ? "Header Name" : "Column Name"}
                        <span class="text-red-500 ml-1">*</span>
                    </label>
                    <input type="text" value="${col.name || ''}" 
                           onchange="updateCol('${col.id}', 'name', this.value)"
                           placeholder="${isParent ? "Enter header name" : "Enter column name"}"
                           class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all duration-200 bg-white placeholder-gray-400">
                </div>

                ${
                  !isParent
                    ? `
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Validation Type <span class="text-red-500 ml-1">*</span></label>
                        <div class="relative">
                            <select onchange="updateCol('${col.id}', 'validationType', this.value)" 
                                    class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all duration-200 bg-white appearance-none">
                                <option value="lsl_usl" ${validationType === "lsl_usl" ? "selected" : ""}>Number (LSL/USL)</option>
                                <option value="pass_fail" ${validationType === "pass_fail" ? "selected" : ""}>Pass/Fail</option>
                            </select>
                            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                                <i class="fas fa-chevron-down text-sm"></i>
                            </div>
                        </div>
                    </div>

                    ${
                      validationType === "lsl_usl"
                        ? `
                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                                <input type="text" value="${col.unit || ''}" 
                                       onchange="updateCol('${col.id}', 'unit', this.value)"
                                       placeholder="kV, V, mm, etc"
                                       class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all duration-200 bg-white placeholder-gray-400">
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">LSL (Lower Spec Limit)</label>
                                <input type="text" value="${col.lsl || ''}" 
                                       oninput="validateNumberInput(this)"
                                       onchange="updateCol('${col.id}', 'lsl', this.value)"
                                       class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all duration-200 bg-white placeholder-gray-400">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">USL (Upper Spec Limit)</label>
                                <input type="text" value="${col.usl || ''}" 
                                       oninput="validateNumberInput(this)"
                                       onchange="updateCol('${col.id}', 'usl', this.value)"
                                       class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all duration-200 bg-white placeholder-gray-400">
                            </div>
                        </div>
                        <p class="text-xs text-gray-500 mt-3 flex items-center">
                            <i class="fas fa-info-circle mr-2 text-blue-400"></i>
                            At least one value (LSL or USL) must be provided
                        </p>
                    `
                        : `
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Expected Value <span class="text-red-500 ml-1">*</span></label>
                            <div class="relative">
                                <select onchange="updateCol('${col.id}', 'expectedValue', this.value)" 
                                        class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all duration-200 bg-white appearance-none">
                                    <option value="Pass" ${expectedValue === "Pass" ? "selected" : ""}>Pass</option>
                                    <option value="Fail" ${expectedValue === "Fail" ? "selected" : ""}>Fail</option>
                                </select>
                                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                                    <i class="fas fa-chevron-down text-sm"></i>
                                </div>
                            </div>
                        </div>
                    `
                    }
                `
                : `
                `
            }
        `;

    list.appendChild(div);

    if (col.sub.length > 0) {
      // Render sub kolom
      col.sub.forEach((sub, index) => {
        renderColumn(sub, level + 1);
      });
    }
  }

  columns.forEach((col) => renderColumn(col));
}

function validateNumberInput(input) {
  let value = input.value;
  value = value.replace(/[^0-9.-]/g, "");
  const minusCount = (value.match(/-/g) || []).length;
  if (minusCount > 1) {
    value = value.replace(/-/g, (match, offset) => (offset === 0 ? match : ""));
  }
  if (value.indexOf("-") > 0) {
    value = value.replace(/-/g, "");
    value = "-" + value;
  }
  const decimalCount = (value.match(/\./g) || []).length;
  if (decimalCount > 1) {
    const parts = value.split(".");
    value = parts[0] + "." + parts.slice(1).join("");
  }
  input.value = value;
  if (value && !isValidNumber(value)) {
    input.classList.add("border-red-500");
  } else {
    input.classList.remove("border-red-500");
  }
}

function isValidNumber(str) {
  return /^-?\d*\.?\d*$/.test(str) && str !== "" && str !== "-" && str !== ".";
}

// ============================================
// PREVIEW TABLE
// ============================================
function updatePreview() {
  const head = document.getElementById("previewHead");
  const columnCount = document.getElementById("columnCount");
  if (!head) return;

  head.innerHTML = "";

  if (!selectedProduct || !selectedTestType) {
    head.innerHTML = `
      <tr>
        <td colspan="100" class="px-6 py-12 text-center">
          <div class="flex flex-col items-center justify-center">
            <div class="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg class="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
            </div>
            <p class="font-medium text-gray-700 mb-2">Select Product and Test Type</p>
            <p class="text-gray-500 text-sm">Choose from the dropdowns above to start</p>
          </div>
        </td>
      </tr>
    `;
    if (columnCount) columnCount.textContent = "0";
    return;
  }

  // Update column count
  if (columnCount) {
    const totalCols = columns.reduce((total, col) => {
      return total + (col.isSplit && col.sub.length > 0 ? col.sub.length : 1);
    }, 0) + 7; // Default columns + status + remarks
    columnCount.textContent = totalCols.toString();
  }

  if (columns.length === 0) {
    head.innerHTML = `
      <tr>
        <td colspan="100" class="px-6 py-12 text-center">
          <div class="flex flex-col items-center justify-center">
            <div class="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 border border-blue-100">
              <svg class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
            </div>
            <p class="font-medium text-gray-700 mb-2">Start Building Your Table</p>
            <p class="text-gray-500 text-sm">Click "+ Add Column" to create your first column</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  const row1 = document.createElement("tr");
  const row2 = document.createElement("tr");
  let hasSubColumns = false;

  // Default columns - styling lebih refined
  ["No", "Operator", "Test Date", "PO Number", "Serial Number"].forEach(
    (name) => {
      const th = document.createElement("th");
      th.className = "bg-gray-50 text-gray-700 px-4 py-3.5 border border-gray-200 text-left font-medium text-sm text-center";
      th.rowSpan = 2;
      th.textContent = name;
      row1.appendChild(th);
    }
  );

  // Custom columns
  columns.forEach((col, index) => {
    if (col.isSplit && col.sub.length > 0) {
      hasSubColumns = true;
      const th = document.createElement("th");
      th.className = "bg-blue-50 text-blue-800 px-4 py-3.5 border border-blue-200 text-center font-semibold text-sm";
      th.colSpan = col.sub.length;
      th.textContent = col.name || "Column Header";
      row1.appendChild(th);

      col.sub.forEach((sub, subIndex) => {
        const subTh = document.createElement("th");
        subTh.className = "bg-blue-100/50 text-blue-700 px-4 py-3 border border-blue-200 text-center text-sm font-medium";
        
        let html = `<div class="font-medium">${sub.name || "Sub Column"}</div>`;
        if (sub.unit) {
          html += `<div class="text-xs text-blue-600 mt-1">${sub.unit}</div>`;
        }
        if (sub.validationType === "lsl_usl" && (sub.lsl || sub.usl)) {
          html += `<div class="mt-2 space-y-1">`;
          if (sub.lsl) html += `<div class="text-xs text-green-600">LSL: ${sub.lsl}</div>`;
          if (sub.usl) html += `<div class="text-xs text-red-600">USL: ${sub.usl}</div>`;
          html += `</div>`;
        }
        
        subTh.innerHTML = html;
        row2.appendChild(subTh);
      });
    } else {
      const th = document.createElement("th");
      th.className = "bg-blue-50 text-blue-800 px-4 py-3.5 border border-blue-200 text-center font-semibold text-sm";
      th.rowSpan = 2;
      
      let html = `<div class="font-medium">${col.name || "Column"}</div>`;
      if (col.unit) {
        html += `<div class="text-xs text-blue-600 mt-1">${col.unit}</div>`;
      }
      if (col.validationType === "lsl_usl" && (col.lsl || col.usl)) {
        html += `<div class="mt-2 space-y-1">`;
        if (col.lsl) html += `<div class="text-xs text-green-600">LSL: ${col.lsl}</div>`;
        if (col.usl) html += `<div class="text-xs text-red-600">USL: ${col.usl}</div>`;
        html += `</div>`;
      }
      
      th.innerHTML = html;
      row1.appendChild(th);
    }
  });

  // Status column
  const statusTh = document.createElement("th");
  statusTh.className = "bg-green-50 text-green-800 px-4 py-3.5 border border-green-200 text-center font-semibold text-sm";
  statusTh.rowSpan = 2;
  statusTh.innerHTML = `
    <div>Status</div>
  `;
  row1.appendChild(statusTh);

  // Remarks column
  const keteranganTh = document.createElement("th");
  keteranganTh.className = "bg-gray-50 text-gray-800 px-4 py-3.5 border border-gray-200 text-center font-semibold text-sm";
  keteranganTh.rowSpan = 2;
  keteranganTh.innerHTML = `
    <div>Remarks</div>
  `;
  row1.appendChild(keteranganTh);

  head.appendChild(row1);
  if (hasSubColumns) head.appendChild(row2);
}

function updateEmptyState() {
  const emptyState = document.getElementById("emptyState");
  if (emptyState) {
    // UBAH: Sekarang columns WAJIB, jadi empty state harus lebih "urgent"
    emptyState.style.display = columns.length === 0 ? "block" : "none";

    // Update pesan empty state
    if (columns.length === 0) {
      const messageElement = emptyState.querySelector("p");
      if (messageElement) {
        messageElement.innerHTML =
          '<span class="text-red-600 font-semibold">⚠️ Custom Columns Required</span><br><span class="text-gray-600">You must add at least one custom column to create a template</span>';
      }
    }
  }
}

// ============================================
// SAVE TEMPLATE
// ============================================
async function saveTemplate() {
  if (!selectedProduct) {
    showErrorModal("Validation Error", "Please select a product first!");
    return;
  }

  if (!selectedTestType) {
    showErrorModal("Validation Error", "Please select a Test Type first!");
    return;
  }

  // Custom columns
  if (columns.length === 0) {
    showErrorModal(
      "Validation Error",
      "At least one custom column is required! The template cannot be created without custom columns."
    );
    // Scroll ke section columns
    document
      .getElementById("btnAddColumn")
      .scrollIntoView({ behavior: "smooth" });
    return;
  }

  // Validasi columns
  function validateColumns(cols) {
    for (let col of cols) {
      if (!col.name) {
        showErrorModal("Validation Error", "All columns must have a name!");
        return false;
      }

      if (!col.isSplit && col.validationType === "lsl_usl") {
        if (!col.lsl && !col.usl) {
          showErrorModal(
            "Validation Error",
            `Column "${col.name}": At least one of LSL or USL must be filled in!`
          );
          return false;
        }
      }

      if (col.sub.length > 0) {
        if (!validateColumns(col.sub)) return false;
      }
    }
    return true;
  }

  if (!validateColumns(columns)) return;

  const templateName = document.getElementById("templateName").value;

  // Reference parameters tetap disimpan tapi tidak ditampilkan di preview
  const allColumns = [
    ...referenceParameters.map((p) => ({
      id: "ref_" + p.id,
      name: p.parameter_name,
      type: p.validation_type === "pass_fail" ? "passfail" : "number",
      validationType: p.validation_type,
      unit: p.parameter_unit || "",
      lsl: p.lsl || "",
      usl: p.usl || "",
      expectedValue: p.validation_type === "pass_fail" ? "Pass" : "",
      isReference: true,
      parentId: null,
      sub: [],
    })),
    ...columns,
  ];

  const templateData = {
    productId: selectedProduct.id,
    testTypeId: selectedTestType.id,
    templateName: templateName,
    columns: allColumns,
  };

  console.log("Saving template with reference parameters:", templateData);

  try {
    const result = await window.electronAPI.saveTemplate(templateData);

    if (result.success) {
      showSuccessModal(
        "Template Berhasil Disimpan!" +
          "\n\n" +
          (referenceParameters.length > 0
            ? `✅ ${referenceParameters.length} reference parameters included\n`
            : "") +
          `✅ ${columns.length} custom columns added`
      );
      setTimeout(() => {
        location.reload();
      }, 2000);
    } else {
      showErrorModal("Failed to save template", result.error);
    }
  } catch (err) {
    console.error("Error:", err);
    showErrorModal("Error", err.message);
  }
}

// ============================================
// MODAL HELPERS
// ============================================
function showErrorModal(title, message) {
  const modal = document.getElementById("modalError");
  const titleEl = document.getElementById("errorTitle");
  const messageEl = document.getElementById("errorMessage");

  if (modal && titleEl && messageEl) {
    titleEl.textContent = title || "Error";
    messageEl.textContent = message;
    modal.classList.remove("hidden");
  } else {
    alert(`${title || "Error"}: ${message}`);
  }
}

function closeErrorModal() {
  const modal = document.getElementById("modalError");
  if (modal) {
    modal.classList.add("hidden");
  }
}

function showSuccessModal(title, message) {
  const modal = document.getElementById("modalSuccess");
  const titleEl = document.getElementById("successTitle");
  const messageEl = document.getElementById("successMessage");

  if (modal && titleEl && messageEl) {
    titleEl.textContent = title || "Success";
    messageEl.textContent = message;
    modal.classList.remove("hidden");
  } else {
    alert(`${title || "Success"}: ${message}`);
  }
}

function closeSuccessModal() {
  const modal = document.getElementById("modalSuccess");
  if (modal) {
    modal.classList.add("hidden");
  }
}

function setupModalEvents() {
  const errorModal = document.getElementById("modalError");
  if (errorModal) {
    errorModal.addEventListener("click", function (e) {
      if (e.target === errorModal) {
        closeErrorModal();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !errorModal.classList.contains("hidden")) {
        closeErrorModal();
      }
    });
  }

  const successModal = document.getElementById("modalSuccess");
  if (successModal) {
    successModal.addEventListener("click", function (e) {
      if (e.target === successModal) {
        closeSuccessModal();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !successModal.classList.contains("hidden")) {
        closeSuccessModal();
      }
    });
  }
}