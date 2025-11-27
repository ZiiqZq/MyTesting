// Assets/js/Generate.js
// Template Builder - Custom Columns WAJIB

// ============================================
// LOAD SIDEBAR
// ============================================
document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM Content Loaded");

  if (typeof SidebarLoader !== "undefined") {
    await SidebarLoader.load("sidebar-container", "menu");

    if (window.electronAPI && window.electronAPI.onPageLoaded) {
      window.electronAPI.onPageLoaded((pageName) => {
        console.log("Page changed to:", pageName);
        SidebarLoader.setActivePage(pageName);
      });
    }
  } else {
    console.error("SidebarLoader not found!");
  }
});

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

// ============================================
// INITIALIZE
// ============================================
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Template Builder loaded!");
  await loadProducts();
  setupEventListeners();
  setupModalEvents();
  setupDeleteModalEvents();
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

function populateProductDropdown() {
  const select = document.getElementById("selectProduct");
  if (!select) return;

  select.innerHTML = '<option value="">-- Select Product Name --</option>';

  const productNames = [
    ...new Set(allProducts.map((p) => p.product_name)),
  ].sort();

  productNames.forEach((productName) => {
    const productsWithThisName = allProducts.filter(
      (p) => p.product_name === productName
    );
    const option = document.createElement("option");
    option.value = productName;
    option.textContent = `${productName} (${productsWithThisName.length} Devices)`;
    select.appendChild(option);
  });
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
  const selectProduct = document.getElementById("selectProduct");
  if (selectProduct) {
    selectProduct.addEventListener("change", onProductChange);
  }

  const selectSeries = document.getElementById("selectSeries");
  if (selectSeries) {
    selectSeries.addEventListener("change", onSeriesChange);
  }

  const btnAddColumn = document.getElementById("btnAddColumn");
  if (btnAddColumn) {
    btnAddColumn.addEventListener("click", () => addColumn());
  }

  const btnSave = document.getElementById("btnSave");
  if (btnSave) {
    btnSave.addEventListener("click", saveTemplate);
  }

  const btnBack = document.getElementById("btnBack");
  if (btnBack) {
    btnBack.addEventListener("click", () => {
      window.electronAPI.Generate("Kembali dari Generate");
    });
  }
}

// ============================================
// PRODUCT SELECTION
// ============================================
function onProductChange(e) {
  const productName = e.target.value;
  const seriesSelectionDiv = document.getElementById("seriesSelectionDiv");
  const testTypeSelectionDiv = document.getElementById("testTypeSelectionDiv");
  const templateNameDiv = document.getElementById("templateNameDiv");
  const referenceParamsDiv = document.getElementById("referenceParamsDiv");

  selectedProduct = null;
  selectedTestType = null;
  productSeries = [];
  productTestTypes = [];
  referenceParameters = [];
  columns = [];

  if (seriesSelectionDiv) seriesSelectionDiv.classList.add("hidden");
  if (testTypeSelectionDiv) testTypeSelectionDiv.classList.add("hidden");
  if (templateNameDiv) templateNameDiv.classList.add("hidden");
  if (referenceParamsDiv) referenceParamsDiv.classList.add("hidden");

  if (!productName) {
    updatePreview();
    updateEmptyState();
    return;
  }

  productSeries = allProducts.filter((p) => p.product_name === productName);
  populateSeriesDropdown();

  if (seriesSelectionDiv) seriesSelectionDiv.classList.remove("hidden");
}

function populateSeriesDropdown() {
  const select = document.getElementById("selectSeries");
  if (!select) return;

  select.innerHTML = '<option value="">-- Select Device --</option>';

  productSeries.forEach((product) => {
    const option = document.createElement("option");
    option.value = product.id;
    const seriesInfo = product.series_number
      ? `${product.series_number}${
          product.series ? ` (${product.series})` : ""
        }`
      : product.series || "No Series Info";
    option.textContent = seriesInfo;
    option.setAttribute("data-product", JSON.stringify(product));
    select.appendChild(option);
  });
}

// ============================================
// SERIES SELECTION
// ============================================
function onSeriesChange(e) {
  const productId = e.target.value;
  const testTypeSelectionDiv = document.getElementById("testTypeSelectionDiv");
  const templateNameDiv = document.getElementById("templateNameDiv");
  const referenceParamsDiv = document.getElementById("referenceParamsDiv");

  selectedTestType = null;
  productTestTypes = [];
  referenceParameters = [];
  columns = [];

  if (testTypeSelectionDiv) testTypeSelectionDiv.classList.add("hidden");
  if (templateNameDiv) templateNameDiv.classList.add("hidden");
  if (referenceParamsDiv) referenceParamsDiv.classList.add("hidden");

  if (!productId) {
    selectedProduct = null;
    updatePreview();
    updateEmptyState();
    return;
  }

  const selectedOption = e.target.options[e.target.selectedIndex];
  const productData = JSON.parse(selectedOption.getAttribute("data-product"));
  selectedProduct = {
    id: productData.id,
    name: productData.product_name,
    series_number: productData.series_number,
    series: productData.series,
  };

  console.log("✅ Product selected:", selectedProduct);

  loadProductTestTypes(productData.id);
}

// ============================================
// LOAD TEST TYPES
// ============================================
async function loadProductTestTypes(productId) {
  try {
    const result = await window.electronAPI.getProductTestTypes(productId);
    if (result.success) {
      productTestTypes = result.data;
      console.log("✅ Test types loaded:", productTestTypes.length);
      renderTestTypeSelection();
    } else {
      showErrorModal("Error Loading Test Types", result.error);
    }
  } catch (err) {
    console.error("Error loading test types:", err);
    showErrorModal("Error Loading Test Types", err.message);
  }
}

function renderTestTypeSelection() {
  const testTypeList = document.getElementById("testTypeList");
  const testTypeSelectionDiv = document.getElementById("testTypeSelectionDiv");

  if (!testTypeList || !testTypeSelectionDiv) return;

  if (productTestTypes.length === 0) {
    testTypeList.innerHTML =
      '<p class="col-span-2 text-center text-gray-500">No test types defined for this product</p>';
    testTypeSelectionDiv.classList.remove("hidden");
    return;
  }

  testTypeList.innerHTML = "";

  productTestTypes.forEach((testType) => {
    const button = document.createElement("button");
    button.className =
      "bg-green-50 hover:bg-green-100 border-2 border-green-300 rounded-lg p-4 text-left transition-all duration-200 cursor-pointer";
    button.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <div class="font-bold text-green-800">${testType.name}</div>
                </div>
                <div class="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                    ${testType.sequence_order}
                </div>
            </div>
        `;
    button.onclick = () => selectTestType(testType);
    testTypeList.appendChild(button);
  });

  testTypeSelectionDiv.classList.remove("hidden");
}

// ============================================
// TEST TYPE SELECTION
// ============================================
async function selectTestType(testType) {
  selectedTestType = { id: testType.id, name: testType.name };
  console.log("✅ Test type selected:", selectedTestType);

  document.querySelectorAll("#testTypeList button").forEach((btn) => {
    btn.classList.remove("bg-green-200", "border-green-600");
    btn.classList.add("bg-green-50", "border-green-300");
  });
  event.target
    .closest("button")
    .classList.add("bg-green-200", "border-green-600");

  await loadReferenceParameters(selectedProduct.id, selectedTestType.id);

  updateTemplateName();
  updatePreview();
}

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
    const templateName = `${selectedProduct.name} - ${selectedProduct.series_number} (${selectedProduct.series}) - ${selectedTestType.name}`;
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
  colCount++;
  const col = {
    id: "col_" + colCount,
    name: "",
    isSplit: false,
    validationType: "lsl_usl",
    lsl: "",
    usl: "",
    unit: "",
    expectedValue: "Pass",
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

let currentColumnToDelete = null;

function openDeleteModal(columnId) {
  currentColumnToDelete = columnId;
  const modal = document.getElementById("modalDeleteConfirm");
  const messageEl = document.getElementById("deleteMessage");

  if (modal && messageEl) {
    messageEl.textContent = `Yakin ingin menghapus column?`;
    modal.classList.remove("hidden");
  }
}

function closeDeleteModal() {
  const modal = document.getElementById("modalDeleteConfirm");
  if (modal) {
    modal.classList.add("hidden");
    currentColumnToDelete = null;
  }
}

function confirmDelete() {
  if (currentColumnToDelete) {
    executeColumnDelete(currentColumnToDelete);
  }
  closeDeleteModal();
}

function executeColumnDelete(columnId) {
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

  removeFromArray(columns);
  renderColumns();
  updatePreview();
  updateEmptyState();
}

function setupDeleteModalEvents() {
  const modal = document.getElementById("modalDeleteConfirm");
  if (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target === modal) closeDeleteModal();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modal.classList.contains("hidden")) {
        closeDeleteModal();
      }
    });
  }
}

function updateCol(id, prop, value) {
  const col = findColumn(id);
  if (col) {
    col[prop] = value;

    if (prop === "validationType") {
      if (value === "pass_fail") {
        col.lsl = "";
        col.usl = "";
        col.expectedValue = "Pass";
      } else if (value === "lsl_usl") {
        col.expectedValue = "";
      }
      renderColumns();
    }

    updatePreview();
  }
}

function renderColumns() {
  const list = document.getElementById("columnList");
  if (!list) return;

  list.innerHTML = "";

  function renderColumn(col, level = 0) {
    const isParent = col.isSplit && col.sub.length > 0;
    const isSub = level > 0;

    const div = document.createElement("div");
    div.className = isSub
      ? "bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-5 ml-10"
      : isParent
      ? "bg-blue-50 border-2 border-blue-400 rounded-lg p-5"
      : "bg-[#f8f9fa] border border-[#CAD2C5] rounded-lg p-5";

    div.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <h4 class="text-lg font-bold text-gray-800">
                    ${isSub ? "└─ " : ""}Column ${col.id.replace("col_", "")}
                    ${
                      isParent
                        ? '<span class="ml-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">PARENT</span>'
                        : ""
                    }
                    ${
                      isSub
                        ? '<span class="ml-2 bg-yellow-600 text-white text-xs px-2 py-1 rounded">SUB</span>'
                        : ""
                    }
                </h4>
                <div class="flex gap-2">
                    ${
                      !isSub && !isParent
                        ? `<button onclick="addColumn('${col.id}')" class="cursor-pointer bg-[#52796F] hover:bg-[#2F3E46] text-white px-4 py-2 rounded-sm text-sm font-semibold">Split</button>`
                        : ""
                    }
                    ${
                      isParent
                        ? `<button onclick="addColumn('${col.id}')" class="cursor-pointer bg-[#84A98C] hover:bg-[#52796F] text-white px-4 py-2 rounded-sm text-sm font-semibold">+ Add Sub</button>`
                        : ""
                    }
                    <button onclick="openDeleteModal('${
                      col.id
                    }')" class="cursor-pointer bg-[#800f2f] hover:bg-[#590d22] text-white px-4 py-2 rounded-sm text-sm font-semibold">Delete</button>
                </div>
            </div>

            <div class="mb-4">
                <label class="block text-sm font-semibold text-gray-700 mb-2">${
                  isParent ? "Parent Name *" : "Column Name *"
                }</label>
                <input type="text" value="${col.name}" 
                       onchange="updateCol('${col.id}', 'name', this.value)"
                       placeholder="${
                         isParent ? "Header Column" : "Column Name"
                       }"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none">
            </div>

            ${
              !isParent
                ? `
                <div class="mb-4">
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Validation Type *</label>
                    <select onchange="updateCol('${
                      col.id
                    }', 'validationType', this.value)" 
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                        <option value="lsl_usl" ${
                          col.validationType === "lsl_usl" ? "selected" : ""
                        }>Number (LSL/USL)</option>
                        <option value="pass_fail" ${
                          col.validationType === "pass_fail" ? "selected" : ""
                        }>Pass/Fail</option>
                    </select>
                </div>

                ${
                  col.validationType === "lsl_usl"
                    ? `
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Unit</label>
                            <input type="text" value="${col.unit}" 
                                   onchange="updateCol('${col.id}', 'unit', this.value)"
                                   placeholder="e.g., kV, V"
                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                        </div>
                        <div></div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">LSL</label>
                            <input type="text" value="${col.lsl}" 
                                   oninput="validateNumberInput(this)"
                                   onchange="updateCol('${col.id}', 'lsl', this.value)"
                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">USL</label>
                            <input type="text" value="${col.usl}" 
                                   oninput="validateNumberInput(this)"
                                   onchange="updateCol('${col.id}', 'usl', this.value)"
                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                        </div>
                    </div>
                    <p class="text-xs text-red-500 mt-2">At least one value (LSL or USL) must be filled in!</p>
                `
                    : `
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Expected Value</label>
                        <select onchange="updateCol('${
                          col.id
                        }', 'expectedValue', this.value)"
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                            <option value="Pass" ${
                              col.expectedValue === "Pass" ? "selected" : ""
                            }>Pass</option>
                            <option value="Fail" ${
                              col.expectedValue === "Fail" ? "selected" : ""
                            }>Fail</option>
                        </select>
                    </div>
                `
                }
            `
                : ""
            }
        `;

    list.appendChild(div);

    if (col.sub.length > 0) {
      col.sub.forEach((sub) => renderColumn(sub, level + 1));
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
  if (!head) return;

  head.innerHTML = "";

  if (!selectedProduct || !selectedTestType) {
    head.innerHTML =
      '<tr><td colspan="100" class="px-4 py-8 text-center text-gray-500 font-medium italic">Preview will appear after selecting product and test type</td></tr>';
    return;
  }

  // UBAH: Sekarang columns WAJIB, jadi jika belum ada, tampilkan pesan yang sesuai
  if (columns.length === 0) {
    const message = 'Click "Add Column" to start building your test template.';
    head.innerHTML = `<tr><td colspan="100" class="px-4 py-8 text-center text-gray-600 font-medium">${message}</td></tr>`;
    return;
  }

  const row1 = document.createElement("tr");
  const row2 = document.createElement("tr");
  let hasSubColumns = false;

  // Default columns - warna abu-abu professional
  ["No", "Operator", "Test Date", "PO Number", "Serial Number"].forEach(
    (name) => {
      const th = document.createElement("th");
      th.className =
        "bg-gray-200 text-gray-800 px-4 py-3 border border-gray-300 text-center font-semibold text-sm";
      th.rowSpan = 2;
      th.textContent = name;
      row1.appendChild(th);
    }
  );

  // Custom columns - warna biru professional
  columns.forEach((col) => {
    if (col.isSplit && col.sub.length > 0) {
      hasSubColumns = true;
      const th = document.createElement("th");
      th.className =
        "bg-blue-100 text-blue-800 px-4 py-3 border border-blue-200 text-center font-semibold";
      th.colSpan = col.sub.length;
      th.textContent = col.name || "Parent Header";
      row1.appendChild(th);

      col.sub.forEach((sub) => {
        const subTh = document.createElement("th");
        subTh.className =
          "bg-blue-50 text-blue-700 px-4 py-2 border border-blue-100 text-center text-sm font-medium";
        let text = sub.name || "Sub";
        if (sub.unit) text += ` (${sub.unit})`;
        if (sub.validationType === "lsl_usl" && (sub.lsl || sub.usl)) {
          text += "\n";
          if (sub.lsl) text += `LSL: ${sub.lsl} `;
          if (sub.usl) text += `USL: ${sub.usl}`;
        }
        subTh.style.whiteSpace = "pre-line";
        subTh.textContent = text;
        row2.appendChild(subTh);
      });
    } else {
      const th = document.createElement("th");
      th.className =
        "bg-blue-100 text-blue-800 px-4 py-3 border border-blue-200 text-center font-semibold";
      th.rowSpan = 2;
      let text = col.name || "Column";
      if (col.unit) text += ` (${col.unit})`;
      if (col.validationType === "lsl_usl" && (col.lsl || col.usl)) {
        text += "\n";
        if (col.lsl) text += `LSL: ${col.lsl} `;
        if (col.usl) text += `USL: ${col.usl}`;
      }
      th.style.whiteSpace = "pre-line";
      th.textContent = text;
      row1.appendChild(th);
    }
  });

  // End columns - warna hijau professional untuk status, abu-abu untuk remarks
  const statusTh = document.createElement("th");
  statusTh.className =
    "bg-green-100 text-green-800 px-4 py-3 border border-green-200 text-center font-semibold";
  statusTh.rowSpan = 2;
  statusTh.textContent = "Status";
  row1.appendChild(statusTh);

  const keteranganTh = document.createElement("th");
  keteranganTh.className =
    "bg-gray-100 text-gray-800 px-4 py-3 border border-gray-200 text-center font-semibold";
  keteranganTh.rowSpan = 2;
  keteranganTh.textContent = "Remarks";
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
    showErrorModal("Validasi Error", "Pilih produk terlebih dahulu!");
    return;
  }

  if (!selectedTestType) {
    showErrorModal("Validasi Error", "Pilih test type terlebih dahulu!");
    return;
  }

  // Custom columns
  if (columns.length === 0) {
    showErrorModal(
      "Validasi Error",
      "Minimal harus ada 1 custom column! Template tidak bisa dibuat tanpa custom columns."
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
        showErrorModal("Validasi Error", "Semua column harus punya nama!");
        return false;
      }

      if (!col.isSplit && col.validationType === "lsl_usl") {
        if (!col.lsl && !col.usl) {
          showErrorModal(
            "Validasi Error",
            `Column "${col.name}": LSL atau USL minimal 1 harus diisi!`
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
      showErrorModal("Gagal Menyimpan Template", result.error);
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
    titleEl.textContent = title || "Sukses";
    messageEl.textContent = message;
    modal.classList.remove("hidden");
  } else {
    alert(`${title || "Sukses"}: ${message}`);
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
