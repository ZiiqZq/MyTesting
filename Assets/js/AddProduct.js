// Assets/js/AddProduct.js

// ============================================
// STATE MANAGEMENT
// ============================================
let testSequence = [];
let testParameters = {};
let allTestTypes = [];
let sequenceCounter = 0;
let existingProducts = [];
let existingSeries = {};
let pendingNewTestTypes = [];

// ============================================
// INITIALIZE
// ============================================
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 AddProduct page loaded");
  await loadExistingProducts();
  await loadTestTypes();
  setupEventListeners();
  setupAutocomplete();
});

// ============================================
// NEW: LOAD EXISTING PRODUCTS FOR AUTOCOMPLETE
// ============================================
async function loadExistingProducts() {
  try {
    const result = await window.electronAPI.getProducts();
    if (result.success) {
      existingProducts = result.data;

      // Build series map for quick lookup
      existingSeries = {};
      existingProducts.forEach((product) => {
        if (product.series_number && product.series) {
          existingSeries[product.series_number] = product.series;
        }
      });

      console.log("✅ Existing products loaded:", existingProducts.length);
      console.log("✅ Series map:", existingSeries);
    }
  } catch (err) {
    console.error("Error loading existing products:", err);
  }
}

// ============================================
// NEW: SETUP AUTOCOMPLETE
// ============================================
function setupAutocomplete() {
  const productNameInput = document.getElementById("productName");
  const seriesNumberInput = document.getElementById("seriesNumber");
  const seriesNameInput = document.getElementById("seriesName");

  // Product Name Autocomplete
  if (productNameInput) {
    const productDropdown = createDropdown("productNameDropdown");
    productNameInput.parentElement.style.position = "relative";
    productNameInput.parentElement.appendChild(productDropdown);

    productNameInput.addEventListener("input", (e) => {
      const value = e.target.value.toLowerCase();
      if (value.length < 1) {
        productDropdown.classList.add("hidden");
        return;
      }

      const matches = existingProducts.filter((p) =>
        p.product_name.toLowerCase().includes(value)
      );

      renderDropdown(productDropdown, matches, (product) => {
        productNameInput.value = product.product_name;
        seriesNumberInput.value = product.series_number || "";
        seriesNameInput.value = product.series || "";
        productDropdown.classList.add("hidden");
      });
    });

    productNameInput.addEventListener("focus", () => {
      if (productNameInput.value.length > 0) {
        productNameInput.dispatchEvent(new Event("input"));
      }
    });
  }

  // Series Number Autocomplete
  if (seriesNumberInput) {
    const seriesNumberDropdown = createDropdown("seriesNumberDropdown");
    seriesNumberInput.parentElement.style.position = "relative";
    seriesNumberInput.parentElement.appendChild(seriesNumberDropdown);

    seriesNumberInput.addEventListener("input", (e) => {
      const value = e.target.value.toLowerCase();
      if (value.length < 1) {
        seriesNumberDropdown.classList.add("hidden");
        return;
      }

      const matches = [
        ...new Set(
          existingProducts
            .filter(
              (p) =>
                p.series_number && p.series_number.toLowerCase().includes(value)
            )
            .map((p) => ({ series_number: p.series_number, series: p.series }))
        ),
      ];

      renderSeriesDropdown(seriesNumberDropdown, matches, (series) => {
        seriesNumberInput.value = series.series_number;
        seriesNameInput.value = series.series || "";
        seriesNumberDropdown.classList.add("hidden");
      });
    });

    seriesNumberInput.addEventListener("focus", () => {
      if (seriesNumberInput.value.length > 0) {
        seriesNumberInput.dispatchEvent(new Event("input"));
      }
    });
  }

  // Series Name Autocomplete
  if (seriesNameInput) {
    const seriesNameDropdown = createDropdown("seriesNameDropdown");
    seriesNameInput.parentElement.style.position = "relative";
    seriesNameInput.parentElement.appendChild(seriesNameDropdown);

    seriesNameInput.addEventListener("input", (e) => {
      const value = e.target.value.toLowerCase();
      if (value.length < 1) {
        seriesNameDropdown.classList.add("hidden");
        return;
      }

      const matches = [
        ...new Set(
          existingProducts
            .filter((p) => p.series && p.series.toLowerCase().includes(value))
            .map((p) => ({ series_number: p.series_number, series: p.series }))
        ),
      ];

      renderSeriesDropdown(seriesNameDropdown, matches, (series) => {
        seriesNameInput.value = series.series || "";
        if (series.series_number) {
          seriesNumberInput.value = series.series_number;
        }
        seriesNameDropdown.classList.add("hidden");
      });
    });
  }

  // Close dropdowns when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".autocomplete-input")) {
      document.querySelectorAll(".autocomplete-dropdown").forEach((dd) => {
        dd.classList.add("hidden");
      });
    }
  });
}

function createDropdown(id) {
  const dropdown = document.createElement("div");
  dropdown.id = id;
  dropdown.className =
    "autocomplete-dropdown hidden absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto";
  return dropdown;
}

function renderDropdown(dropdown, matches, onSelect) {
  dropdown.innerHTML = "";

  if (matches.length === 0) {
    dropdown.classList.add("hidden");
    return;
  }

  matches.slice(0, 10).forEach((product) => {
    const item = document.createElement("div");
    item.className =
      "px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 transition-colors duration-150";
    item.innerHTML = `
            <div class="font-semibold text-gray-800">${
              product.product_name
            }</div>
            <div class="text-xs text-gray-500">
                ${product.series_number || "N/A"} - ${
      product.series || "No series"
    }
            </div>
        `;
    item.onclick = () => onSelect(product);
    dropdown.appendChild(item);
  });

  const newItem = document.createElement("div");
  // newItem.className = 'px-4 py-3 bg-green-50 hover:bg-green-100 cursor-pointer border-t-2 border-green-300 transition-colors duration-150';
  // newItem.innerHTML = `
  //     <div class="font-semibold text-green-800">➕ Add as New Product</div>
  //     <div class="text-xs text-green-600">This will create a new product entry</div>
  // `;
  newItem.onclick = () => {
    dropdown.classList.add("hidden");
  };
  dropdown.appendChild(newItem);

  dropdown.classList.remove("hidden");
}

function renderSeriesDropdown(dropdown, matches, onSelect) {
  dropdown.innerHTML = "";

  if (matches.length === 0) {
    dropdown.classList.add("hidden");
    return;
  }

  const unique = [];
  const seen = new Set();
  matches.forEach((item) => {
    const key = `${item.series_number}-${item.series}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  });

  unique.slice(0, 10).forEach((series) => {
    const item = document.createElement("div");
    item.className =
      "px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 transition-colors duration-150";
    item.innerHTML = `
            <div class="font-semibold text-gray-800">${
              series.series_number
            }</div>
            <div class="text-xs text-gray-500">${
              series.series || "No series name"
            }</div>
        `;
    item.onclick = () => onSelect(series);
    dropdown.appendChild(item);
  });

  dropdown.classList.remove("hidden");
}

function showInfoMessage(message) {
  const infoDiv = document.getElementById("infoMessage");
  if (infoDiv) {
    infoDiv.textContent = message;
    infoDiv.classList.remove("hidden");
    setTimeout(() => {
      infoDiv.classList.add("hidden");
    }, 5000);
  }
}

// ============================================
// LOAD TEST TYPES
// ============================================
async function loadTestTypes() {
  try {
    const result = await window.electronAPI.getTestTypes();
    if (result.success) {
      allTestTypes = result.data;
      populateTestTypeDropdown();
      console.log("✅ Test types loaded:", allTestTypes.length);
    } else {
      showErrorModal("Failed to load test types: " + result.error);
    }
  } catch (err) {
    console.error("Error loading test types:", err);
    showErrorModal("Failed to load test types: " + err.message);
  }
}

function populateTestTypeDropdown() {
  const select = document.getElementById("selectTestTypeModal");
  if (!select) return;

  select.innerHTML = '<option value="">-- Select Test Type --</option>';

  allTestTypes.forEach((testType) => {
    const option = document.createElement("option");
    option.value = testType.id;
    option.textContent = testType.name;
    option.dataset.testTypeName = testType.name;
    select.appendChild(option);
  });
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
  const productNameInput = document.getElementById("productName");
  const seriesNumberInput = document.getElementById("seriesNumber");
  const seriesNameInput = document.getElementById("seriesName");

  if (productNameInput) productNameInput.classList.add("autocomplete-input");
  if (seriesNumberInput) seriesNumberInput.classList.add("autocomplete-input");
  if (seriesNameInput) seriesNameInput.classList.add("autocomplete-input");

  const btnAddTestType = document.getElementById("btnAddTestType");
  if (btnAddTestType) {
    btnAddTestType.addEventListener("click", openAddTestTypeModal);
  }

  const btnAddParameter = document.getElementById("btnAddParameter");
  if (btnAddParameter) {
    btnAddParameter.addEventListener("click", openAddParameterModal);
  }

  const btnSaveProduct = document.getElementById("btnSaveProduct");
  if (btnSaveProduct) {
    btnSaveProduct.addEventListener("click", saveProduct);
  }

  const btnBack = document.getElementById("btnBack");
  if (btnBack) {
    btnBack.addEventListener("click", () => {
      window.electronAPI.AddProduct("Back from Add Product");
    });
  }

  const selectTestForParams = document.getElementById("selectTestForParams");
  if (selectTestForParams) {
    selectTestForParams.addEventListener("change", renderParameters);
  }
}

// ============================================
// TEST SEQUENCE MANAGEMENT
// ============================================
function openAddTestTypeModal() {
  const modal = document.getElementById("modalAddTestType");
  if (!modal) return;

  modal.classList.remove("hidden");
  document.getElementById("selectTestTypeModal").value = "";
  document.getElementById("newTestTypeName").value = "";
}

function closeAddTestTypeModal() {
  const modal = document.getElementById("modalAddTestType");
  if (modal) modal.classList.add("hidden");
}

async function confirmAddTestType() {
  const select = document.getElementById("selectTestTypeModal");
  const newTypeName = document.getElementById("newTestTypeName").value.trim();

  let testTypeId, testTypeName;

  if (newTypeName) {
    testTypeId = "new_" + Date.now();
    testTypeName = newTypeName;

    pendingNewTestTypes.push({
      tempId: testTypeId,
      name: testTypeName,
    });

    console.log("🆕 New test type added to pending:", {
      tempId: testTypeId,
      name: testTypeName,
    });
  } else if (select.value) {
    testTypeId = parseInt(select.value);
    const option = select.options[select.selectedIndex];
    testTypeName = option.dataset.testTypeName || option.textContent;
  } else {
    showErrorModal("Please select or create a test type");
    return;
  }

  if (testSequence.some((t) => t.testTypeId === testTypeId)) {
    showErrorModal("This test type is already in the sequence");
    return;
  }

  sequenceCounter++;
  testSequence.push({
    id: "seq_" + sequenceCounter,
    testTypeId: testTypeId,
    testTypeName: testTypeName,
    sequenceOrder: testSequence.length + 1,
    isNew: newTypeName ? true : false,
  });

  testParameters[testTypeId] = testParameters[testTypeId] || [];

  renderTestSequence();
  updateParameterTestDropdown();
  closeAddTestTypeModal();
}

function renderTestSequence() {
  const list = document.getElementById("testSequenceList");
  const emptyState = document.getElementById("emptyTestSequence");
  const paramsSection = document.getElementById("testParametersSection");

  if (!list || !emptyState || !paramsSection) return;

  if (testSequence.length === 0) {
    list.innerHTML = "";
    emptyState.style.display = "block";
    paramsSection.classList.add("hidden");
    return;
  }

  emptyState.style.display = "none";
  paramsSection.classList.remove("hidden");

  list.innerHTML = "";

  testSequence.forEach((test, index) => {
    const div = document.createElement("div");
    div.className =
      "bg-green-100 border-l-4 border-[#354F52] rounded-lg p-4 flex items-center justify-between";

    const newBadge = test.isNew
      ? '<span class="ml-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">New</span>'
      : "";

    div.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="bg-[#52796F] text-white w-8 h-8 text-sm rounded-full flex items-center justify-center font-bold">
                    ${test.sequenceOrder}
                </div>
                <div>
                    <h3 class="font-bold text-gray-800 flex items-center">${
                      test.testTypeName
                    }${newBadge}</h3>
                    <p class="text-sm text-gray-600">
                        ${
                          testParameters[test.testTypeId]?.length || 0
                        } parameters defined
                    </p>
                </div>
            </div>
            <div class="flex gap-2">
                ${
                  index > 0
                    ? `<button onclick="moveTestUp(${index})" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm cursor-pointer">↑</button>`
                    : ""
                }
                ${
                  index < testSequence.length - 1
                    ? `<button onclick="moveTestDown(${index})" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm cursor-pointer">↓</button>`
                    : ""
                }
                <button onclick="removeTest('${
                  test.id
                }')" title="Remove Test" class="text-[#800f2f] hover:bg-[#590d22] hover:text-white border-2 border-[#590d22] w-10 h-10 rounded-full cursor-pointer text-xl">-</button>
            </div>
        `;

    list.appendChild(div);
  });
}

function moveTestUp(index) {
  if (index > 0) {
    [testSequence[index], testSequence[index - 1]] = [
      testSequence[index - 1],
      testSequence[index],
    ];
    testSequence.forEach((test, i) => (test.sequenceOrder = i + 1));
    renderTestSequence();
  }
}

function moveTestDown(index) {
  if (index < testSequence.length - 1) {
    [testSequence[index], testSequence[index + 1]] = [
      testSequence[index + 1],
      testSequence[index],
    ];
    testSequence.forEach((test, i) => (test.sequenceOrder = i + 1));
    renderTestSequence();
  }
}

function removeTest(testId) {
  const test = testSequence.find((t) => t.id === testId);
  if (test) {
    if (test.isNew) {
      pendingNewTestTypes = pendingNewTestTypes.filter(
        (nt) => nt.tempId !== test.testTypeId
      );
    }
    delete testParameters[test.testTypeId];
  }
  testSequence = testSequence.filter((t) => t.id !== testId);
  testSequence.forEach((test, i) => (test.sequenceOrder = i + 1));
  renderTestSequence();
  updateParameterTestDropdown();
}

// ============================================
// PARAMETERS MANAGEMENT
// ============================================
function updateParameterTestDropdown() {
  const select = document.getElementById("selectTestForParams");
  if (!select) return;

  select.innerHTML = '<option value="">-- Select Test Type --</option>';

  testSequence.forEach((test) => {
    const option = document.createElement("option");
    option.value = test.testTypeId;
    option.textContent = test.testTypeName + (test.isNew ? " (New)" : "");
    select.appendChild(option);
  });
}

function openAddParameterModal() {
  const selectedTest = document.getElementById("selectTestForParams").value;
  if (!selectedTest) {
    showErrorModal("Please select a test type first");
    return;
  }

  const modal = document.getElementById("modalAddParameter");
  if (!modal) return;

  modal.classList.remove("hidden");

  // Reset form fields
  document.getElementById("parameterName").value = "";
  document.getElementById("parameterValue").value = "";
}

function closeAddParameterModal() {
  const modal = document.getElementById("modalAddParameter");
  if (modal) modal.classList.add("hidden");
}

function confirmAddParameter() {
  const selectedTest = document.getElementById("selectTestForParams").value;
  if (!selectedTest) {
    showErrorModal("No test type selected");
    return;
  }

  const paramName = document.getElementById("parameterName").value.trim();
  const paramValue = document.getElementById("parameterValue").value.trim();

  if (!paramName) {
    showErrorModal("Parameter name is required");
    return;
  }

  if (!paramValue) {
    showErrorModal("Parameter value is required");
    return;
  }

  if (!testParameters[selectedTest]) {
    testParameters[selectedTest] = [];
  }

  if (testParameters[selectedTest].some((p) => p.name === paramName)) {
    showErrorModal(
      "Parameter with this name already exists for this test type"
    );
    return;
  }

  // Simpan parameter dengan struktur yang disederhanakan
  testParameters[selectedTest].push({
    name: paramName,
    value: paramValue,
    displayOrder: testParameters[selectedTest].length + 1,
  });

  renderParameters();
  renderTestSequence();
  closeAddParameterModal();
}

function renderParameters() {
  const selectedTest = document.getElementById("selectTestForParams")?.value;
  const list = document.getElementById("parametersList");

  if (!list) return;

  if (
    !selectedTest ||
    !testParameters[selectedTest] ||
    testParameters[selectedTest].length === 0
  ) {
    list.innerHTML =
      '<p class="text-center text-gray-400 py-8">No parameters defined for this test</p>';
    return;
  }

  list.innerHTML = "";

  testParameters[selectedTest].forEach((param, index) => {
    const div = document.createElement("div");
    div.className =
      "bg-cyan-50 border border-blue-300 rounded-lg p-4 flex justify-between items-center";

    div.innerHTML = `
            <div class="flex-1">
                <h4 class="font-bold text-gray-800">${param.name}</h4>
                <p class="text-sm text-gray-600 mt-1">${param.value}</p>
            </div>
            <button onclick="removeParameter('${selectedTest}', ${index})" title="Remove Parameter" class="text-[#800f2f] hover:bg-[#590d22] hover:text-white border-2 border-[#590d22] w-10 h-10 rounded-full cursor-pointer text-xl ml-4">
                -
            </button>
        `;

    list.appendChild(div);
  });
}

function removeParameter(testTypeId, index) {
  if (testParameters[testTypeId]) {
    testParameters[testTypeId].splice(index, 1);
    renderParameters();
    renderTestSequence();
  }
}

// ============================================
// SAVE PRODUCT
// ============================================
async function saveProduct() {
  const productName = document.getElementById("productName").value.trim();
  const seriesNumber = document.getElementById("seriesNumber").value.trim();
  const seriesName = document.getElementById("seriesName").value.trim();

  if (!productName) {
    showErrorModal("Product name is required");
    document.getElementById("productName").focus();
    return;
  }

  if (!seriesNumber) {
    showErrorModal("Series number is required");
    document.getElementById("seriesNumber").focus();
    return;
  }

  if (!seriesName) {
    showErrorModal("Series name is required");
    document.getElementById("seriesName").focus();
    return;
  }

  if (testSequence.length === 0) {
    showErrorModal(
      "At least one test type must be defined in the test sequence"
    );
    return;
  }

  const testTypesWithoutParams = testSequence.filter(
    (test) =>
      !testParameters[test.testTypeId] ||
      testParameters[test.testTypeId].length === 0
  );

  if (testTypesWithoutParams.length > 0) {
    const testNames = testTypesWithoutParams
      .map((t) => t.testTypeName)
      .join(", ");
    showErrorModal(
      `The following test types have no parameters: ${testNames}. Add at least one parameter for each.`
    );
    return;
  }

  if (pendingNewTestTypes.length > 0) {
    showLoading(true);

    try {
      // Buat test type baru di database
      for (const newTestType of pendingNewTestTypes) {
        const result = await window.electronAPI.addCustomTestType(
          newTestType.name
        );
        if (result.success) {
          testSequence.forEach((test) => {
            if (test.testTypeId === newTestType.tempId) {
              test.testTypeId = result.id;
              test.isNew = false;
            }
          });

          if (testParameters[newTestType.tempId]) {
            testParameters[result.id] = testParameters[newTestType.tempId];
            delete testParameters[newTestType.tempId];
          }

          console.log(
            `✅ New test type created: ${newTestType.name} (ID: ${result.id})`
          );
        } else {
          throw new Error(
            `Failed to create test type: ${newTestType.name} - ${result.error}`
          );
        }
      }

      // Reset pending setelah berhasil dibuat
      pendingNewTestTypes = [];
    } catch (err) {
      showLoading(false);
      showErrorModal("Error creating new test types: " + err.message);
      return;
    }
  }

  // Siapkan data untuk disimpan
  const productData = {
    productName,
    seriesNumber,
    seriesName,
    testSequence: testSequence.map((test) => ({
      testTypeId: parseInt(test.testTypeId),
      sequenceOrder: test.sequenceOrder,
    })),
    testParameters: testParameters,
  };

  console.log("Saving product:", productData);

  try {
    const result = await window.electronAPI.saveProductWithSequence(
      productData
    );

    if (result.success) {
      showSuccessModal(
        "Product saved successfully!"
      );
      setTimeout(() => {
        window.electronAPI.AddProduct(
          "Back to AddProduct after product creation"
        );
      }, 2000);
    } else {
      showErrorModal("Failed to save product: " + result.error);
    }
  } catch (err) {
    console.error("Error saving product:", err);
    showErrorModal("Error saving product: " + err.message);
  } finally {
    showLoading(false);
  }
}

function showLoading(show) {
  const btnSaveProduct = document.getElementById("btnSaveProduct");
  if (btnSaveProduct) {
    if (show) {
      btnSaveProduct.innerHTML =
        '<span class="animate-spin">⏳</span> Saving...';
      btnSaveProduct.disabled = true;
    } else {
      btnSaveProduct.innerHTML = "Save Product";
      btnSaveProduct.disabled = false;
    }
  }
}

// ============================================
// MODAL HELPERS
// ============================================
function showErrorModal(message) {
  const modal = document.getElementById("modalError");
  const messageEl = document.getElementById("errorMessage");
  if (modal && messageEl) {
    messageEl.textContent = message;
    modal.classList.remove("hidden");
  }
}

function closeErrorModal() {
  const modal = document.getElementById("modalError");
  if (modal) modal.classList.add("hidden");
}

function showSuccessModal(message) {
  const modal = document.getElementById("modalSuccess");
  const messageEl = document.getElementById("successMessage");
  if (modal && messageEl) {
    messageEl.textContent = message;
    modal.classList.remove("hidden");
  }
}

function closeSuccessModal() {
  const modal = document.getElementById("modalSuccess");
  if (modal) modal.classList.add("hidden");
}

document.addEventListener("click", (e) => {
  if (e.target.id === "modalError") closeErrorModal();
  if (e.target.id === "modalSuccess") closeSuccessModal();
  if (e.target.id === "modalAddTestType") closeAddTestTypeModal();
  if (e.target.id === "modalAddParameter") closeAddParameterModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeErrorModal();
    closeSuccessModal();
    closeAddTestTypeModal();
    closeAddParameterModal();
  }
});
