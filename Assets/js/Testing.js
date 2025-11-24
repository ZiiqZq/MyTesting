// Assets/js/Testing.js - NO CONFIRMATION MODAL FOR DELETE

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

// ============================================
// MODAL FUNCTIONS - FIXED SUCCESS MODAL
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

    // FIX: Setup success modal close event properly
    setupSuccessModalClose();
  }
}

function closeSuccessModal(event) {
  // If event is passed and clicked on modal background, close it
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

  // Remove old listeners by cloning
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
// SUCCESS MODAL CLOSE SETUP - NEW FUNCTION
// ============================================
function setupSuccessModalClose() {
  const btnCloseSuccess = document.getElementById("btnCloseSuccess");
  const modalSuccess = document.getElementById("modalSuccess");

  if (btnCloseSuccess) {
    // Remove any existing listeners by cloning
    const newBtn = btnCloseSuccess.cloneNode(true);
    btnCloseSuccess.parentNode.replaceChild(newBtn, btnCloseSuccess);

    // Add new click listener
    newBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      const modal = document.getElementById("modalSuccess");
      if (modal) {
        modal.classList.remove("active");
        location.reload();
      }
    });
  }

  // Also setup background click to close
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
// DELETE LAST ROW - NEW FUNCTION (NO CONFIRMATION MODAL)
// ============================================
function deleteLastRow() {
  if (tableRows.length <= 1) {
    showErrorModal("Cannot delete the last row. Minimum 1 row required.");
    return;
  }

  const lastRow = tableRows[tableRows.length - 1];
  if (lastRow) {
    lastRow.remove();
    tableRows.pop();

    // Update test information
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

    console.log("✅ Last row deleted, total rows:", tableRows.length);
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

  // Extract numeric part from serial number
  const numericPart = parseInt(startSerial) || 0;
  const endSerial = numericPart + qty - 1;

  display.innerHTML = `<strong>Range:</strong> ${numericPart} - ${endSerial}`;
}

// ============================================
// INITIALIZE
// ============================================
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🧪 Testing Page Loaded");

  // Set default date to today
  const testDateInput = document.getElementById("inputTestDate");
  if (testDateInput) {
    const today = new Date().toISOString().split("T")[0];
    testDateInput.value = today;
  }

  await loadProducts();
  setupEventListeners();

  // Setup modal close events
  setupModalCloseEvents();

  // Prevent navigation during testing
  window.addEventListener("beforeunload", (e) => {
    if (testingInProgress) {
      e.preventDefault();
      e.returnValue =
        "Testing in progress! All data will be lost if you leave.";
      return e.returnValue;
    }
  });
});

// ============================================
// MODAL CLOSE EVENTS SETUP - NEW FUNCTION
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

  // Setup success modal close button
  setupSuccessModalClose();
}

// ============================================
// LOAD PRODUCTS
// ============================================
async function loadProducts() {
  try {
    console.log("🔄 Loading products...");
    const result = await window.electronAPI.getProducts();

    if (result.success) {
      allProducts = result.data;
      console.log("✅ Products loaded:", allProducts);
      populateProductDropdown();
    } else {
      console.error("❌ Error loading products:", result.error);
      showErrorModal("Error loading products: " + result.error);
    }
  } catch (err) {
    console.error("❌ Error loading products:", err);
    showErrorModal("Error loading products: " + err.message);
  }
}

function populateProductDropdown() {
  const select = document.getElementById("selectProduct");
  if (!select) {
    console.error("❌ selectProduct element not found");
    return;
  }

  select.innerHTML = '<option value="">-- Select Product --</option>';

  if (!allProducts || allProducts.length === 0) {
    console.warn("⚠️ No products available");
    return;
  }

  // Group products by product_name and get unique names
  const productNames = [
    ...new Set(allProducts.map((p) => p.product_name)),
  ].sort();

  console.log("📦 Available product names:", productNames);

  productNames.forEach((productName) => {
    const option = document.createElement("option");
    option.value = productName;
    option.textContent = productName;
    select.appendChild(option);
  });

  console.log(
    "✅ Product dropdown populated with",
    productNames.length,
    "products"
  );
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
  try {
    console.log("🔧 Setting up event listeners...");

    // Product selection
    const selectProduct = document.getElementById("selectProduct");
    const selectSeries = document.getElementById("selectSeries");
    const inputSerialNumber = document.getElementById("inputSerialNumber");
    const inputQty = document.getElementById("inputQty");
    const btnStartTesting = document.getElementById("btnStartTesting");
    const btnCancelTest = document.getElementById("btnCancelTest");
    const btnSubmitTest = document.getElementById("btnSubmitTest");
    const btnAddRow = document.getElementById("btnAddRow");
    const btnDeleteLastRow = document.getElementById("btnDeleteLastRow");

    if (selectProduct) {
      selectProduct.addEventListener("change", onProductChange);
      console.log("✅ selectProduct listener added");
    } else {
      console.error("❌ selectProduct element not found");
    }

    if (selectSeries) {
      selectSeries.addEventListener("change", onSeriesChange);
      console.log("✅ selectSeries listener added");
    }

    if (inputSerialNumber) {
      inputSerialNumber.addEventListener("input", updateSerialRangeDisplay);
      console.log("✅ inputSerialNumber listener added");
    }

    if (inputQty) {
      inputQty.addEventListener("input", updateSerialRangeDisplay);
      console.log("✅ inputQty listener added");
    }

    if (btnStartTesting) {
      btnStartTesting.addEventListener("click", startTesting);
      console.log("✅ btnStartTesting listener added");
    }

    if (btnCancelTest) {
      btnCancelTest.addEventListener("click", confirmCancelTest);
      console.log("✅ btnCancelTest listener added");
    }

    if (btnSubmitTest) {
      btnSubmitTest.addEventListener("click", submitTestResults);
      console.log("✅ btnSubmitTest listener added");
    }

    if (btnAddRow) {
      btnAddRow.addEventListener("click", addTableRow);
      console.log("✅ btnAddRow listener added");
    }

    if (btnDeleteLastRow) {
      btnDeleteLastRow.addEventListener("click", deleteLastRow);
      console.log("✅ btnDeleteLastRow listener added");
    }

    // ESC key to close modals
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeErrorModal();
        closeSuccessModal();
        closeConfirmModal();
      }
    });

    console.log("✅ All event listeners setup completed");
  } catch (error) {
    console.error("❌ Error setting up event listeners:", error);
  }
}

// ============================================
// PRODUCT SELECTION
// ============================================
function onProductChange(e) {
  const productName = e.target.value;
  const seriesContainer = document.getElementById("seriesContainer");
  const testTypeSection = document.getElementById("testTypeSection");
  const testInfoSection = document.getElementById("testInfoSection");

  console.log("🔄 Product changed to:", productName);

  selectedProduct = null;
  productSeries = [];

  if (seriesContainer) seriesContainer.classList.add("hidden");
  if (testTypeSection) testTypeSection.classList.add("hidden");
  if (testInfoSection) testInfoSection.classList.add("hidden");

  if (!productName) {
    console.log("ℹ️ No product selected");
    return;
  }

  // Filter products by selected product name
  productSeries = allProducts.filter((p) => p.product_name === productName);
  console.log("📦 Filtered product series:", productSeries);

  if (productSeries.length === 0) {
    console.warn("⚠️ No series found for product:", productName);
    return;
  }

  populateSeriesDropdown();

  if (seriesContainer) {
    seriesContainer.classList.remove("hidden");
    console.log("✅ Series container shown");
  }
}

function populateSeriesDropdown() {
  const select = document.getElementById("selectSeries");
  if (!select) {
    console.error("❌ selectSeries element not found");
    return;
  }

  select.innerHTML = '<option value="">-- Select Series --</option>';

  productSeries.forEach((product) => {
    const option = document.createElement("option");
    option.value = product.id;

    // Create display text for series
    let seriesDisplay = "";
    if (product.series_number && product.series) {
      seriesDisplay = `${product.series} - ${product.series_number}`;
    } else if (product.series_number) {
      seriesDisplay = product.series_number;
    } else if (product.series) {
      seriesDisplay = product.series;
    } else {
      seriesDisplay = "No Series Info";
    }

    option.textContent = seriesDisplay;
    option.setAttribute("data-product", JSON.stringify(product));
    select.appendChild(option);
  });

  console.log(
    "✅ Series dropdown populated with",
    productSeries.length,
    "options"
  );
}

// ============================================
// SERIES SELECTION
// ============================================
async function onSeriesChange(e) {
  const productId = e.target.value;
  const testTypeSection = document.getElementById("testTypeSection");
  const testInfoSection = document.getElementById("testInfoSection");

  console.log("🔄 Series changed to product ID:", productId);

  selectedTestType = null;
  if (testInfoSection) testInfoSection.classList.add("hidden");

  if (!productId) {
    selectedProduct = null;
    if (testTypeSection) testTypeSection.classList.add("hidden");
    console.log("ℹ️ No series selected");
    return;
  }

  const selectedOption = e.target.options[e.target.selectedIndex];
  if (!selectedOption) {
    console.error("❌ No option selected");
    return;
  }

  try {
    const productData = JSON.parse(selectedOption.getAttribute("data-product"));
    selectedProduct = {
      id: productData.id,
      name: productData.product_name,
      series_number: productData.series_number,
      series: productData.series,
    };

    console.log("✅ Product selected:", selectedProduct);
    await loadProductTestTypes(productData.id);
  } catch (error) {
    console.error("❌ Error parsing product data:", error);
    showErrorModal("Error selecting product series");
  }
}

// ============================================
// LOAD TEST TYPES
// ============================================
async function loadProductTestTypes(productId) {
  try {
    console.log(`🔄 Loading test types for product ${productId}...`);
    const result = await window.electronAPI.getProductTestTypes(productId);

    if (result.success) {
      const testTypes = result.data;
      console.log("✅ Test types loaded:", testTypes);
      renderTestTypeButtons(testTypes);
    } else {
      console.error("❌ Error loading test types:", result.error);
      showErrorModal("Error loading test types: " + result.error);
    }
  } catch (err) {
    console.error("❌ Error loading test types:", err);
    showErrorModal("Error loading test types: " + err.message);
  }
}

function renderTestTypeButtons(testTypes) {
  const testTypeList = document.getElementById("testTypeList");
  const testTypeSection = document.getElementById("testTypeSection");

  if (!testTypeList || !testTypeSection) {
    console.error("❌ Test type elements not found");
    return;
  }

  if (testTypes.length === 0) {
    testTypeList.innerHTML =
      '<p class="col-span-3 text-center text-gray-500 text-sm">No test types available for this product</p>';
    testTypeSection.classList.remove("hidden");
    console.log("ℹ️ No test types available");
    return;
  }

  testTypeList.innerHTML = "";

  testTypes.forEach((testType) => {
    const button = document.createElement("button");
    button.className = "test-type-btn";
    button.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <div class="font-semibold text-gray-800">${testType.name}</div>
                    <div class="text-xs text-gray-600">Sequence: ${testType.sequence_order}</div>
                </div>
                <div class="bg-gray-700 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                    ${testType.sequence_order}
                </div>
            </div>
        `;
    button.onclick = () => selectTestType(testType);
    testTypeList.appendChild(button);
  });

  testTypeSection.classList.remove("hidden");
  console.log("✅ Test type buttons rendered:", testTypes.length);
}

// ============================================
// TEST TYPE SELECTION
// ============================================
async function selectTestType(testType) {
  selectedTestType = {
    id: testType.id,
    name: testType.name,
    sequence: testType.sequence_order,
  };
  console.log("✅ Test type selected:", selectedTestType);

  // Highlight selected
  document.querySelectorAll("#testTypeList button").forEach((btn) => {
    btn.classList.remove("selected");
  });
  event.target.closest("button").classList.add("selected");

  // Load parameters and template
  await loadTestParameters();
  await loadTemplate();

  // Show test info section ONLY if template exists
  const testInfoSection = document.getElementById("testInfoSection");
  if (testInfoSection) {
    if (templateData) {
      testInfoSection.classList.remove("hidden");
      console.log("✅ Test info section shown");
    } else {
      testInfoSection.classList.add("hidden");
      console.log("ℹ️ Test info section hidden - no template");
    }
  }
}

// ============================================
// LOAD TEST PARAMETERS
// ============================================
async function loadTestParameters() {
  try {
    console.log(
      `🔄 Loading test parameters for product ${selectedProduct.id}, test ${selectedTestType.id}`
    );
    const result = await window.electronAPI.getTestParameters({
      productId: selectedProduct.id,
      testTypeId: selectedTestType.id,
    });

    if (result.success) {
      testParameters = result.data;
      console.log("✅ Test parameters loaded:", testParameters.length);
    } else {
      console.error("❌ Error loading parameters:", result.error);
      testParameters = [];
    }
  } catch (err) {
    console.error("❌ Error loading parameters:", err);
    testParameters = [];
  }
}

// ============================================
// LOAD TEMPLATE
// ============================================
async function loadTemplate() {
  try {
    console.log(`🔄 Loading template for product ${selectedProduct.id}`);
    const result = await window.electronAPI.getTemplatesByProduct(
      selectedProduct.id
    );

    if (result.success) {
      const templates = result.data;
      const template = templates.find(
        (t) => t.test_type_id === selectedTestType.id
      );

      if (template) {
        templateData = template;
        console.log("✅ Template loaded:", templateData.template_name);
      } else {
        console.warn("⚠️ No template found for this product and test type");
        showErrorModal(
          "No template found for this product and test type. Please create a template first in Generate page."
        );
        templateData = null;
      }
    } else {
      console.error("❌ Error loading template:", result.error);
      showErrorModal("Error loading template: " + result.error);
      templateData = null;
    }
  } catch (err) {
    console.error("❌ Error loading template:", err);
    showErrorModal("Error loading template: " + err.message);
    templateData = null;
  }
}

// ============================================
// DISPLAY TEST PARAMETERS
// ============================================
function displayTestParameters() {
  const container = document.getElementById("testParametersDisplay");
  if (!container) {
    console.error("❌ testParametersDisplay container not found");
    return;
  }

  if (testParameters.length === 0) {
    container.innerHTML =
      '<p class="text-[11px] text-gray-600">No predefined test parameters for this test type</p>';
    return;
  }

  let html = '<div class="grid grid-cols-1 gap-2">';

  testParameters.forEach((param) => {
    html += `
      <div class="grid grid-cols-3 items-center gap-2">
        <div class="text-[10px] text-gray-600 col-span-1">
          ${param.parameter_name} :
        </div>
        <div class="var-display col-span-2 text-[11px]">
          ${param.parameter_unit ? `Unit: ${param.parameter_unit}` : ""}
          ${param.lsl ? ` | LSL: ${param.lsl}` : ""}
          ${param.usl ? ` | USL: ${param.usl}` : ""}
        </div>
      </div>
    `;
  });

  html += "</div>";
  container.innerHTML = html;
  console.log("✅ Test parameters displayed");
}

// ============================================
// START TESTING
// ============================================
function startTesting() {
  console.log("🔄 Starting testing...");

  // Validate inputs
  const testerName = document.getElementById("inputTesterName")?.value.trim();
  const testDate = document.getElementById("inputTestDate")?.value;
  const poNumber = document.getElementById("inputPONumber")?.value.trim();
  const serialNumber = document
    .getElementById("inputSerialNumber")
    ?.value.trim();
  const qtyInput = document.getElementById("inputQty");
  const qty = qtyInput ? parseInt(qtyInput.value) : 0;

  console.log("📋 Validation data:", {
    testerName,
    testDate,
    poNumber,
    serialNumber,
    qty,
  });

  if (!testerName) {
    showErrorModal("Please enter tester name");
    return;
  }

  if (!testDate) {
    showErrorModal("Please select test date");
    return;
  }

  if (!poNumber) {
    showErrorModal("Please enter PO number");
    return;
  }

  if (!serialNumber) {
    showErrorModal("Please enter starting serial number");
    return;
  }

  if (!qty || qty < 1) {
    showErrorModal("Please enter valid quantity");
    return;
  }

  if (!templateData) {
    showErrorModal("No template available. Please create template first.");
    return;
  }

  if (!selectedProduct || !selectedTestType) {
    showErrorModal("Please select product and test type first.");
    return;
  }

  // Store test information
  testInformation = {
    testerName,
    testDate,
    multimeterSN:
      document.getElementById("inputMultimeterSN")?.value.trim() || "",
    oscilloscopeSN:
      document.getElementById("inputOscilloscopeSN")?.value.trim() || "",
    poNumber,
    startingSerial: parseInt(serialNumber) || 0,
    qty,
    productName: `${selectedProduct.name} - ${
      selectedProduct.series_number || selectedProduct.series || ""
    }`,
    testTypeName: selectedTestType.name,
  };

  console.log("✅ Test information stored:", testInformation);

  // Switch to testing section
  document.getElementById("setupSection").classList.add("hidden");
  document.getElementById("testingSection").classList.remove("hidden");
  testingInProgress = true;

  // Display test information
  displayTestInformation();
  displayTestParameters();
  generateTestingTable();

  console.log("✅ Testing started successfully");
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
      console.error(`❌ display${key} element not found`);
      return;
    }
  }

  elements.product.textContent = testInformation.productName;
  elements.testType.textContent = testInformation.testTypeName;
  elements.tester.textContent = testInformation.testerName;
  elements.date.textContent = testInformation.testDate;
  elements.po.textContent = testInformation.poNumber;

  const endSerial = testInformation.startingSerial + testInformation.qty - 1;
  elements.serial.textContent = `${testInformation.startingSerial} - ${endSerial}`;
  elements.qty.textContent = testInformation.qty;

  console.log("✅ Test information displayed");
}

// ============================================
// GENERATE TESTING TABLE
// ============================================
function generateTestingTable() {
  if (!templateData || !templateData.custom_columns) {
    showErrorModal("Template data is invalid");
    return;
  }

  // Filter out reference parameters (product_test_parameters)
  const allColumns = templateData.custom_columns.columns || [];
  const customColumns = allColumns.filter((col) => !col.isReference);

  if (customColumns.length === 0) {
    showErrorModal("No custom columns found in template");
    return;
  }

  const thead = document.getElementById("testingTableHead");
  const tbody = document.getElementById("testingTableBody");

  if (!thead || !tbody) {
    console.error("❌ Table elements not found");
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
        subTh.textContent = `${subCol.name}${
          subCol.unit ? " (" + subCol.unit + ")" : ""
        }`;
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
      th.textContent = `${col.name}${col.unit ? " (" + col.unit + ")" : ""}`;
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

  console.log("✅ Testing table generated with", testInformation.qty, "rows");
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
          // Use dropdown for pass/fail with color update
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
          input.className = "w-full";
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
        input.className = "w-full";
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

  console.log("✅ Row added, total rows:", tableRows.length);
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
      "Please complete all test entries before submitting. All fields must be filled."
    );
    return;
  }

  // Confirm submission
  const passCount = entries.filter((e) => e.status === "Pass").length;
  const failCount = entries.filter((e) => e.status === "Fail").length;

  showConfirmModal(
    "Submit Test Results",
    `Ready to submit ${entries.length} test entries:\n\n✓ Pass: ${passCount}\n✗ Fail: ${failCount}\n\nProceed with submission?`,
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
            `✓ Successfully submitted ${result.insertedCount} test entries!\n\nPass: ${passCount} | Fail: ${failCount}`
          );
        } else {
          showErrorModal("Failed to submit: " + result.error);
        }
      } catch (err) {
        console.error("Error submitting:", err);
        showErrorModal("Error submitting: " + err.message);
      }
    }
  );
}

// ============================================
// CANCEL TEST
// ============================================
function confirmCancelTest() {
  showConfirmModal(
    "Cancel Testing",
    "Are you sure you want to cancel? All test data will be lost and cannot be recovered.",
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
window.validateNumericInput = validateNumericInput;

console.log(
  "✅ Testing.js loaded successfully - All functions exposed to window"
);
