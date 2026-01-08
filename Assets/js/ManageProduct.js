// ManageProduct.js - VERSION TERBARU DENGAN PERBAIKAN BUG

// ============================================
// STATE MANAGEMENT
// ============================================
let allProducts = [];
let filteredProducts = [];
let currentEditData = {
  productId: null,
  testTypeId: null,
  originalProduct: null,
  originalParameters: [],
  originalTemplate: null,
  modifiedProduct: {},
  modifiedParameters: [],
  modifiedTemplate: null
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Manage Product page loaded!");
  await loadAllProducts();
  setupEventListeners();
  setupModalEvents();
});

// ============================================
// LOAD PRODUCTS WITH FULL DETAILS
// ============================================
async function loadAllProducts() {
  try {
    console.log("📦 Loading all products with details...");

    const result = await window.electronAPI.getProductsWithSequence();

    if (result.success) {
      allProducts = result.data;
      filteredProducts = [...allProducts];
      console.log("✅ Products loaded:", allProducts.length);
      renderProductTable();
    } else {
      console.error("❌ Error loading products:", result.error);
      showErrorModal("Error", "Failed to load products: " + result.error);
    }
  } catch (err) {
    console.error("❌ Error:", err);
    showErrorModal("Error", "An error occurred while loading products: " + err.message);
  }
}

// ============================================
// RENDER PRODUCT TABLE
// ============================================
function renderProductTable() {
  const tbody = document.getElementById("productTableBody");

  if (!tbody) {
    console.error("❌ Table body not found");
    return;
  }

  tbody.innerHTML = "";

  if (filteredProducts.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-8 text-center text-gray-500">
          <div class="flex flex-col items-center">
            <svg class="w-12 h-12 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
            </svg>
            <p class="font-medium">No products found</p>
            <p class="text-sm mt-1">Try adjusting your filters or add new products</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  // Group products by product_name and device
  const groupedProducts = {};

  filteredProducts.forEach(product => {
    const deviceKey = `${product.product_name}_${product.series_number}_${product.series || ''}`;

    if (!groupedProducts[deviceKey]) {
      groupedProducts[deviceKey] = {
        product_name: product.product_name,
        device: product.series ? `${product.series} - ${product.series_number}` : product.series_number,
        testTypes: []
      };
    }

    // Add test types for this device
    if (product.testSequence && product.testSequence.length > 0) {
      product.testSequence.forEach(test => {
        if (!groupedProducts[deviceKey].testTypes.find(t => t.testTypeId === test.testTypeId)) {
          groupedProducts[deviceKey].testTypes.push({
            testTypeId: test.testTypeId,
            testTypeName: test.testTypeName,
            sequenceOrder: test.sequenceOrder,
            productId: product.id
          });
        }
      });
    }
  });

  let rowNumber = 1;

  Object.values(groupedProducts).forEach(group => {
    // Create row for each test type
    group.testTypes.forEach((testType, index) => {
      const tr = document.createElement("tr");
      tr.className = "bg-white border-b border-gray-200 hover:bg-gray-50";

      tr.innerHTML = `
        <td class="px-6 py-4">${rowNumber}</td>
        <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
          ${group.product_name}
        </th>
        <td class="px-6 py-4">${group.device}</td>
        <td class="px-6 py-4">${testType.testTypeName}</td>
        <td class="px-6 py-4">
          <button onclick="viewParameters(${testType.productId}, ${testType.testTypeId})" 
                  class="text-[#005fe5] hover:text-blue-900 rounded-md cursor-pointer"
                  aria-label="View parameters" title="View parameters">
            <svg class="w-8 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 14C3 9.02944 7.02944 5 12 5C16.9706 5 21 9.02944 21 14M17 14C17 16.7614 14.7614 19 12 19C9.23858 19 7 16.7614 7 14C7 11.2386 9.23858 9 12 9C14.7614 9 17 11.2386 17 14Z"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </td>
        <td class="px-6 py-4">
          <button onclick="viewTemplate(${testType.productId}, ${testType.testTypeId})" 
                  class="text-[#005fe5] hover:text-blue-900 rounded-md cursor-pointer"
                  aria-label="View template" title="View template">
            <svg class="w-8 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 14C3 9.02944 7.02944 5 12 5C16.9706 5 21 9.02944 21 14M17 14C17 16.7614 14.7614 19 12 19C9.23858 19 7 16.7614 7 14C7 11.2386 9.23858 9 12 9C14.7614 9 17 11.2386 17 14Z"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </td>
        <td class="px-6 py-4 flex justify-center items-center gap-1">
          <button onclick="editProduct(${testType.productId}, ${testType.testTypeId})"
                  class="group flex items-center justify-center w-10 h-10 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition-all duration-200 cursor-pointer shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
                  aria-label="Edit" title="Edit">
            <svg class="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none">
              <path d="M20,16v4a2,2,0,0,1-2,2H4a2,2,0,0,1-2-2V6A2,2,0,0,1,4,4H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <polygon points="12.5 15.8 22 6.2 17.8 2 8.3 11.5 8 16 12.5 15.8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button onclick="confirmDeleteProduct(${testType.productId}, ${testType.testTypeId})"
                  class="group flex items-center justify-center w-10 h-10 bg-red-500 hover:bg-red-700 text-white rounded-md transition-all duration-200 cursor-pointer shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                  aria-label="Delete" title="Delete">
            <svg class="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none">
              <path d="M10 12V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M14 12V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M4 7H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M6 10V18C6 19.6569 7.34315 21 9 21H15C16.6569 21 18 19.6569 18 18V10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V7H9V5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </td>
      `;

      tbody.appendChild(tr);
      rowNumber++;
    });
  });
}

// ============================================
// FILTER FUNCTIONS - FIXED
// ============================================
function applyFilters() {
  const searchInput = document.getElementById("filter_product");
  if (!searchInput) return;

  const searchQuery = searchInput.value.toLowerCase().trim();

  if (!searchQuery) {
    filteredProducts = [...allProducts];
    renderProductTable();
    return;
  }

  // Cari dalam semua field termasuk nomor
  filteredProducts = allProducts.filter(product => {
    // Product name
    const productName = (product.product_name || '').toLowerCase();

    // Device (series + series_number)
    const device = product.series
      ? `${product.series} - ${product.series_number}`.toLowerCase()
      : (product.series_number || '').toLowerCase();

    // Cari nomor (sequenceOrder)
    const sequenceNumber = product.testSequence
      ? product.testSequence.map(test => test.sequenceOrder.toString()).join(' ')
      : '';

    // Test types - perbaikan: cari kata per kata
    const testTypeNames = product.testSequence
      ? product.testSequence.map(test => test.testTypeName.toLowerCase())
      : [];

    // Gabungkan semua string pencarian
    const searchString = `${productName} ${device} ${sequenceNumber}`;

    // Periksa apakah searchQuery cocok dengan string gabungan
    if (searchString.includes(searchQuery)) {
      return true;
    }

    // Periksa apakah searchQuery cocok dengan salah satu test type name
    return testTypeNames.some(testType => {
      // Pencarian kata per kata, bukan hanya contains
      const words = testType.split(' ');
      return words.some(word => word.startsWith(searchQuery));
    });
  });

  renderProductTable();
}

function resetFilters() {
  const searchInput = document.getElementById("filter_product");
  if (searchInput) {
    searchInput.value = "";
  }

  filteredProducts = [...allProducts];
  renderProductTable();
}

// ============================================
// VIEW PARAMETERS - Hanya Name dan Value
// ============================================
async function viewParameters(productId, testTypeId) {
  try {
    console.log(`📋 Viewing parameters for product ${productId}, test ${testTypeId}`);

    const result = await window.electronAPI.getTestParameters({ productId, testTypeId });

    if (result.success && result.data.length > 0) {
      const parameters = result.data;
      const product = allProducts.find(p => p.id === productId);
      const testType = product?.testSequence.find(t => t.testTypeId === testTypeId);

      const modal = document.getElementById("modalViewParameters");
      const title = document.getElementById("viewParametersTitle");
      const content = document.getElementById("viewParametersContent");

      title.textContent = `Parameters: ${product?.product_name} - ${testType?.testTypeName}`;

      // Hanya tampilkan name dan value
      content.innerHTML = `
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left text-gray-700">
            <thead class="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th class="px-6 py-3">Name</th>
                <th class="px-6 py-3">Value</th>
              </tr>
            </thead>
            <tbody>
              ${parameters.map((param, index) => `
                <tr class="bg-white border-b hover:bg-gray-50">
                  <td class="px-6 py-4 font-medium text-gray-900">${param.parameter_name}</td>
                  <td class="px-6 py-4">${param.parameter_value || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      modal.classList.add("active");
    } else {
      showErrorModal("No Parameters", "No parameters found for this product and test type.");
    }
  } catch (err) {
    console.error("❌ Error viewing parameters:", err);
    showErrorModal("Error", "Failed to load parameters: " + err.message);
  }
}

// ============================================
// VIEW TEMPLATE - Dengan Split Cell Support
// ============================================
async function viewTemplate(productId, testTypeId) {
  try {
    console.log(`📋 Viewing template for product ${productId}, test ${testTypeId}`);

    const result = await window.electronAPI.getTemplatesByProduct(productId);

    if (result.success) {
      const template = result.data.find(t => t.test_type_id === testTypeId);

      if (template) {
        const product = allProducts.find(p => p.id === productId);

        const modal = document.getElementById("modalViewTemplate");
        const title = document.getElementById("viewTemplateTitle");
        const content = document.getElementById("viewTemplateContent");

        title.textContent = template.template_name;

        // Generate table preview mirip dengan Generate.js
        const columns = template.custom_columns.columns || [];
        const customColumns = columns.filter(col => !col.isReference);

        // Buat header tabel dengan split cell support
        let tableHTML = `
          <div class="overflow-x-auto border border-gray-200 rounded-lg">
            <table class="w-full text-sm border-collapse">
              <thead class="bg-gray-100">
                <tr>
        `;

        // Tambahkan header untuk custom columns
        customColumns.forEach(col => {
          if (col.isSplit && col.sub && col.sub.length > 0) {
            tableHTML += `<th class="px-4 py-3 border text-center bg-blue-50" colspan="${col.sub.length}">${col.name}</th>`;
          } else {
            // Header tunggal - tampilkan LSL dan USL jika ada
            let headerContent = `<div class="font-medium mb-1">${col.name}</div>`;

            // Tampilkan unit jika ada
            if (col.unit) {
              headerContent += `<div class="text-xs text-gray-600 mb-1">(${col.unit})</div>`;
            }

            // Tampilkan LSL/USL atau Pass/Fail info
            if (col.validationType === 'pass_fail') {
              headerContent += `<div class="mt-1 text-xs">
                <span class="px-1.5 py-0.5 bg-green-100 text-green-800 rounded">Pass/Fail</span>
              </div>`;
            } else if (col.validationType === 'lsl_usl') {
              // Tampilkan LSL dan USL jika ada
              if (col.lsl || col.usl) {
                headerContent += `<div class="mt-1 text-xs space-y-0.5">`;
                if (col.lsl) {
                  headerContent += `<div class="text-green-600 font-medium">LSL: ${col.lsl}</div>`;
                }
                if (col.usl) {
                  headerContent += `<div class="text-red-600 font-medium">USL: ${col.usl}</div>`;
                }
                headerContent += `</div>`;
              }
            }

            tableHTML += `<th class="px-4 py-3 border text-center bg-blue-50" rowspan="2">${headerContent}</th>`;
          }
        });

        tableHTML += `
                </tr>
        `;

        // Baris kedua untuk sub-columns jika ada split
        const hasSplitColumns = customColumns.some(col => col.isSplit && col.sub?.length > 0);
        if (hasSplitColumns) {
          tableHTML += `<tr>`;
          customColumns.forEach(col => {
            if (col.isSplit && col.sub && col.sub.length > 0) {
              col.sub.forEach(subCol => {
                let subHeader = `<div class="font-medium mb-1">${subCol.name}</div>`;

                // Tampilkan unit jika ada
                if (subCol.unit) {
                  subHeader += `<div class="text-xs text-gray-600 mb-1">(${subCol.unit})</div>`;
                }

                // Tampilkan LSL/USL atau Pass/Fail info untuk sub column
                if (subCol.validationType === 'pass_fail') {
                  subHeader += `<div class="mt-1 text-xs">
                    <span class="px-1 py-0.5 bg-green-100 text-green-800 rounded text-xs">Pass/Fail</span>
                  </div>`;
                } else if (subCol.validationType === 'lsl_usl') {
                  // Tampilkan LSL dan USL jika ada
                  if (subCol.lsl || subCol.usl) {
                    subHeader += `<div class="mt-1 text-xs space-y-0.5">`;
                    if (subCol.lsl) {
                      subHeader += `<div class="text-green-600 font-medium">LSL: ${subCol.lsl}</div>`;
                    }
                    if (subCol.usl) {
                      subHeader += `<div class="text-red-600 font-medium">USL: ${subCol.usl}</div>`;
                    }
                    subHeader += `</div>`;
                  }
                }

                tableHTML += `
                  <th class="px-3 py-2 border text-center text-xs bg-blue-100">
                    ${subHeader}
                  </th>
                `;
              });
            }
          });
          tableHTML += `</tr>`;
        }

        // Tambahkan body dengan contoh data
        tableHTML += `
              </thead>
            </table>
          </div>
          
          <div class="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 class="font-semibold text-gray-800 mb-2">Template Summary</h4>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div><span class="font-medium text-gray-600">Created:</span> ${template.created_at ? new Date(template.created_at).toLocaleDateString() : 'N/A'}</div>
            </div>
          </div>
        `;

        content.innerHTML = tableHTML;
        modal.classList.add("active");
      } else {
        showErrorModal("No Template", "No template found for this product and test type.");
      }
    } else {
      showErrorModal("Error", "Failed to load template: " + result.error);
    }
  } catch (err) {
    console.error("❌ Error viewing template:", err);
    showErrorModal("Error", "Failed to load template: " + err.message);
  }
}

// ============================================
// EDIT PRODUCT - FULL IMPLEMENTATION
// ============================================
async function editProduct(productId, testTypeId) {
  try {
    console.log(`✏️ Editing product ${productId}, test ${testTypeId}`);

    // Load all data
    const product = allProducts.find(p => p.id === productId);
    const parametersResult = await window.electronAPI.getTestParameters({ productId, testTypeId });
    const templatesResult = await window.electronAPI.getTemplatesByProduct(productId);
    const template = templatesResult.success ? templatesResult.data.find(t => t.test_type_id === testTypeId) : null;

    if (!product) {
      showErrorModal("Error", "Product not found");
      return;
    }

    // Store original data
    currentEditData = {
      productId,
      testTypeId,
      originalProduct: JSON.parse(JSON.stringify(product)),
      originalParameters: parametersResult.success ? JSON.parse(JSON.stringify(parametersResult.data)) : [],
      originalTemplate: template ? JSON.parse(JSON.stringify(template)) : null,
      modifiedProduct: JSON.parse(JSON.stringify(product)),
      modifiedParameters: parametersResult.success ? JSON.parse(JSON.stringify(parametersResult.data)) : [],
      modifiedTemplate: template ? JSON.parse(JSON.stringify(template)) : null
    };

    // Show edit modal
    const modal = document.getElementById("modalEdit");
    modal.classList.add("active");

    // Switch to Product Details tab by default
    switchEditTab('product');

  } catch (err) {
    console.error("❌ Error editing product:", err);
    showErrorModal("Error", "Failed to load product data: " + err.message);
  }
}

function switchEditTab(tab) {
  // Update tab buttons
  const tabs = ['product', 'parameters', 'template'];
  tabs.forEach(t => {
    const btn = document.getElementById(`tab${t.charAt(0).toUpperCase() + t.slice(1)}`);
    const content = document.getElementById(`${t}Content`);

    if (btn && content) {
      if (t === tab) {
        btn.classList.add('active');
        content.classList.remove('hidden');
      } else {
        btn.classList.remove('active');
        content.classList.add('hidden');
      }
    }
  });

  // Render content based on tab
  if (tab === 'product') {
    renderProductDetailsTab();
  } else if (tab === 'parameters') {
    renderParametersTab();
  } else if (tab === 'template') {
    renderTemplateTab();
  }
}

function renderProductDetailsTab() {
  const content = document.getElementById("productContent");
  const product = currentEditData.modifiedProduct;

  content.innerHTML = `
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-2">Product Name *</label>
        <input type="text" id="editProductName" value="${product.product_name || ''}"
               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
               placeholder="Enter product name">
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">Series Number *</label>
          <input type="text" id="editSeriesNumber" value="${product.series_number || ''}"
                 class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                 placeholder="Enter series number">
        </div>
        
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">Series Name</label>
          <input type="text" id="editSeriesName" value="${product.series || ''}"
                 class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                 placeholder="Enter series name (optional)">
        </div>
      </div>
      
      <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mt-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-blue-700">
              <strong>Note:</strong> Changing product details will affect all test types associated with this product.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;

  // Add event listeners
  document.getElementById("editProductName").addEventListener('input', (e) => {
    currentEditData.modifiedProduct.product_name = e.target.value;
  });

  document.getElementById("editSeriesNumber").addEventListener('input', (e) => {
    currentEditData.modifiedProduct.series_number = e.target.value;
  });

  document.getElementById("editSeriesName").addEventListener('input', (e) => {
    currentEditData.modifiedProduct.series = e.target.value;
  });
}

function renderParametersTab() {
  const content = document.getElementById("parametersContent");
  const parameters = currentEditData.modifiedParameters;

  let html = `
    <div class="mb-4 flex justify-between items-center">
      <h4 class="font-semibold text-gray-800">Test Parameters</h4>
      <button onclick="addNewParameter()" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
        + Add Parameter
      </button>
    </div>
    
    <div class="space-y-3" id="parametersList">
  `;

  if (parameters.length === 0) {
    html += `
      <div class="text-center py-8 text-gray-500">
        <p>No parameters defined. Click "Add Parameter" to create one.</p>
      </div>
    `;
  } else {
    parameters.forEach((param, index) => {
      html += renderParameterItem(param, index);
    });
  }

  html += `</div>`;
  content.innerHTML = html;
}

function renderParameterItem(param, index) {
  return `
    <div class="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
      <div class="flex justify-between items-start mb-3">
        <h5 class="font-semibold text-gray-700">Parameter ${index + 1}</h5>
        <button onclick="deleteParameter(${index})" class="text-red-500 hover:text-red-700 text-sm">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </div>
      
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Name *</label>
          <input type="text" value="${param.parameter_name || ''}"
                 onchange="updateParameter(${index}, 'parameter_name', this.value)"
                 class="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                 placeholder="Parameter name">
        </div>
        
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Value *</label>
          <input type="text" value="${param.parameter_value || ''}"
                 onchange="updateParameter(${index}, 'parameter_value', this.value)"
                 class="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                 placeholder="Parameter value">
        </div>
      </div>
    </div>
  `;
}

function addNewParameter() {
  const newParam = {
    parameter_name: '',
    parameter_value: '',
    display_order: currentEditData.modifiedParameters.length + 1
  };

  currentEditData.modifiedParameters.push(newParam);
  renderParametersTab();
}

function updateParameter(index, field, value) {
  if (currentEditData.modifiedParameters[index]) {
    currentEditData.modifiedParameters[index][field] = value;
  }
}

function deleteParameter(index) {
  currentEditData.modifiedParameters.splice(index, 1);
  // Update display_order
  currentEditData.modifiedParameters.forEach((param, idx) => {
    param.display_order = idx + 1;
  });
  renderParametersTab();
}

function renderTemplateTab() {
  const content = document.getElementById("templateContent");
  const template = currentEditData.modifiedTemplate;

  if (!template) {
    content.innerHTML = `
      <div class="text-center py-12 text-gray-500">
        <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <p class="font-medium">No template found</p>
        <p class="text-sm mt-1">Please create a template in the Generate page first</p>
      </div>
    `;
    return;
  }

  const columns = template.custom_columns.columns || [];
  const customColumns = columns.filter(col => !col.isReference);

  let html = `
    <div class="mb-4 flex justify-between items-center">
      <div>
        <h4 class="font-semibold text-gray-800">Template: ${template.template_name}</h4>
        <p class="text-xs text-gray-500 mt-1">Edit column specifications (LSL/USL, Pass/Fail, Split Columns)</p>
      </div>
    </div>
    
    <div class="space-y-3" id="columnsList">
  `;

  customColumns.forEach((col, index) => {
    html += renderColumnItem(col, index);
  });

  html += `</div>`;
  content.innerHTML = html;
}

function renderColumnItem(col, index) {
  let html = `
    <div class="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
      <div class="flex justify-between items-start mb-3">
        <div>
          <h5 class="font-semibold text-gray-700">${col.name || 'Column ' + (index + 1)}</h5>
          <div class="flex items-center gap-2 mt-1">
            ${col.isSplit ?
      '<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Split Column</span>' :
      '<span class="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">Single Column</span>'
    }
            ${col.validationType === 'pass_fail' ?
      '<span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Pass/Fail</span>' :
      '<span class="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">LSL/USL</span>'
    }
          </div>
        </div>
      </div>
  `;

  if (col.isSplit && col.sub && col.sub.length > 0) {
    html += `<div class="pl-4 space-y-3 border-l-2 border-blue-300">`;
    html += `<div class="font-medium text-sm text-gray-600 mb-2">Sub Columns:</div>`;
    col.sub.forEach((subCol, subIndex) => {
      html += renderSubColumnFields(subCol, index, subIndex);
    });
    html += `</div>`;
  } else {
    html += renderColumnFields(col, index);
  }

  html += `</div>`;
  return html;
}

function renderColumnFields(col, colIndex) {
  if (col.validationType === 'pass_fail') {
    return `
      <div class="bg-blue-50 p-4 rounded-lg">
        <div class="flex justify-between items-center mb-3">
          <span class="font-medium text-gray-700">Pass/Fail Configuration</span>
        </div>
        
        <div class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Column Name *</label>
            <input type="text" value="${col.name || ''}"
                   onchange="updateTemplateColumn(${colIndex}, null, 'name', this.value)"
                   class="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                   placeholder="Enter column name">
          </div>
          
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Validation Type *</label>
              <select onchange="updateTemplateColumn(${colIndex}, null, 'validationType', this.value)"
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option value="pass_fail" ${col.validationType === 'pass_fail' ? 'selected' : ''}>Pass/Fail</option>
                <option value="lsl_usl" ${col.validationType === 'lsl_usl' ? 'selected' : ''}>LSL/USL</option>
              </select>
            </div>
            
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Expected Value *</label>
              <select onchange="updateTemplateColumn(${colIndex}, null, 'expectedValue', this.value)"
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option value="Pass" ${col.expectedValue === 'Pass' ? 'selected' : ''}>Pass</option>
                <option value="Fail" ${col.expectedValue === 'Fail' ? 'selected' : ''}>Fail</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="space-y-3">
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">Column Name *</label>
        <input type="text" value="${col.name || ''}"
               onchange="updateTemplateColumn(${colIndex}, null, 'name', this.value)"
               class="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
               placeholder="Enter column name">
      </div>
      
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Validation Type *</label>
          <select onchange="updateTemplateColumn(${colIndex}, null, 'validationType', this.value)"
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none">
            <option value="lsl_usl" ${col.validationType === 'lsl_usl' ? 'selected' : ''}>LSL/USL</option>
            <option value="pass_fail" ${col.validationType === 'pass_fail' ? 'selected' : ''}>Pass/Fail</option>
          </select>
        </div>
        
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Unit</label>
          <input type="text" value="${col.unit || ''}"
                 onchange="updateTemplateColumn(${colIndex}, null, 'unit', this.value)"
                 class="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                 placeholder="kV, V, mm, etc">
        </div>
      </div>
      
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">LSL (Lower Limit)</label>
          <input type="text" value="${col.lsl || ''}"
                 onchange="updateTemplateColumn(${colIndex}, null, 'lsl', this.value)"
                 class="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                 placeholder="e.g., 10.5">
        </div>
        
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">USL (Upper Limit)</label>
          <input type="text" value="${col.usl || ''}"
                 onchange="updateTemplateColumn(${colIndex}, null, 'usl', this.value)"
                 class="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                 placeholder="e.g., 20.5">
        </div>
      </div>
    </div>
  `;
}

function renderSubColumnFields(subCol, colIndex, subIndex) {
  if (subCol.validationType === 'pass_fail') {
    return `
      <div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
        <div class="flex justify-between items-center mb-2">
          <span class="font-medium text-gray-700 text-sm">Sub Column ${subIndex + 1}</span>
          <span class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Pass/Fail</span>
        </div>
        
        <div class="space-y-2">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Sub Column Name *</label>
            <input type="text" value="${subCol.name || ''}"
                   onchange="updateTemplateColumn(${colIndex}, ${subIndex}, 'name', this.value)"
                   class="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none">
          </div>
          
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Validation Type</label>
              <select onchange="updateTemplateColumn(${colIndex}, ${subIndex}, 'validationType', this.value)"
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option value="pass_fail" ${subCol.validationType === 'pass_fail' ? 'selected' : ''}>Pass/Fail</option>
                <option value="lsl_usl" ${subCol.validationType === 'lsl_usl' ? 'selected' : ''}>LSL/USL</option>
              </select>
            </div>
            
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Expected Value</label>
              <select onchange="updateTemplateColumn(${colIndex}, ${subIndex}, 'expectedValue', this.value)"
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option value="Pass" ${subCol.expectedValue === 'Pass' ? 'selected' : ''}>Pass</option>
                <option value="Fail" ${subCol.expectedValue === 'Fail' ? 'selected' : ''}>Fail</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
      <div class="flex justify-between items-center mb-2">
        <span class="font-medium text-gray-700 text-sm">Sub Column ${subIndex + 1}</span>
        <span class="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">LSL/USL</span>
      </div>
      
      <div class="space-y-2">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Sub Column Name *</label>
          <input type="text" value="${subCol.name || ''}"
                 onchange="updateTemplateColumn(${colIndex}, ${subIndex}, 'name', this.value)"
                 class="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none">
        </div>
        
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Validation Type</label>
            <select onchange="updateTemplateColumn(${colIndex}, ${subIndex}, 'validationType', this.value)"
                    class="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="lsl_usl" ${subCol.validationType === 'lsl_usl' ? 'selected' : ''}>LSL/USL</option>
              <option value="pass_fail" ${subCol.validationType === 'pass_fail' ? 'selected' : ''}>Pass/Fail</option>
            </select>
          </div>
          
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Unit</label>
            <input type="text" value="${subCol.unit || ''}"
                   onchange="updateTemplateColumn(${colIndex}, ${subIndex}, 'unit', this.value)"
                   class="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                   placeholder="kV, V, mm, etc">
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">LSL</label>
            <input type="text" value="${subCol.lsl || ''}"
                   onchange="updateTemplateColumn(${colIndex}, ${subIndex}, 'lsl', this.value)"
                   class="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none">
          </div>
          
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">USL</label>
            <input type="text" value="${subCol.usl || ''}"
                   onchange="updateTemplateColumn(${colIndex}, ${subIndex}, 'usl', this.value)"
                   class="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none">
          </div>
        </div>
      </div>
    </div>
  `;
}

function updateTemplateColumn(colIndex, subIndex, field, value) {
  if (!currentEditData.modifiedTemplate) return;

  const columns = currentEditData.modifiedTemplate.custom_columns.columns;
  const customColumns = columns.filter(col => !col.isReference);

  if (subIndex === null) {
    // Update main column
    if (customColumns[colIndex]) {
      customColumns[colIndex][field] = value;

      // Jika validationType berubah, update UI
      if (field === 'validationType' && value === 'pass_fail') {
        customColumns[colIndex].lsl = '';
        customColumns[colIndex].usl = '';
        customColumns[colIndex].unit = '';
        customColumns[colIndex].expectedValue = 'Pass';
      } else if (field === 'validationType' && value === 'lsl_usl') {
        customColumns[colIndex].expectedValue = '';
      }

      // Re-render untuk memperbarui UI
      renderTemplateTab();
    }
  } else {
    // Update sub column
    if (customColumns[colIndex] && customColumns[colIndex].sub && customColumns[colIndex].sub[subIndex]) {
      customColumns[colIndex].sub[subIndex][field] = value;

      // Jika validationType berubah, update UI
      if (field === 'validationType' && value === 'pass_fail') {
        customColumns[colIndex].sub[subIndex].lsl = '';
        customColumns[colIndex].sub[subIndex].usl = '';
        customColumns[colIndex].sub[subIndex].unit = '';
        customColumns[colIndex].sub[subIndex].expectedValue = 'Pass';
      } else if (field === 'validationType' && value === 'lsl_usl') {
        customColumns[colIndex].sub[subIndex].expectedValue = '';
      }

      // Re-render untuk memperbarui UI
      renderTemplateTab();
    }
  }
}

async function saveEditChanges() {
  try {
    console.log("💾 Saving changes...");

    // Validate product details
    if (!currentEditData.modifiedProduct.product_name) {
      showErrorModal("Validation Error", "Product name is required");
      switchEditTab('product');
      return;
    }

    if (!currentEditData.modifiedProduct.series_number) {
      showErrorModal("Validation Error", "Series number is required");
      switchEditTab('product');
      return;
    }

    // Validate parameters
    for (let param of currentEditData.modifiedParameters) {
      if (!param.parameter_name) {
        showErrorModal("Validation Error", "All parameters must have a name");
        switchEditTab('parameters');
        return;
      }
    }

    // Check if there are any changes
    const hasProductChanges = JSON.stringify(currentEditData.originalProduct) !== JSON.stringify(currentEditData.modifiedProduct);
    const hasParameterChanges = JSON.stringify(currentEditData.originalParameters) !== JSON.stringify(currentEditData.modifiedParameters);
    const hasTemplateChanges = JSON.stringify(currentEditData.originalTemplate) !== JSON.stringify(currentEditData.modifiedTemplate);

    if (!hasProductChanges && !hasParameterChanges && !hasTemplateChanges) {
      showErrorModal("No Changes", "No changes detected. Please modify something before saving.");
      return;
    }

    // Show loading state
    const saveBtn = document.querySelector('#modalEdit button[onclick="saveEditChanges()"]');
    const originalText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    // Prepare data for backend
    const updateData = {
      productId: currentEditData.productId,
      testTypeId: currentEditData.testTypeId,
      product: hasProductChanges ? {
        product_name: currentEditData.modifiedProduct.product_name,
        series_number: currentEditData.modifiedProduct.series_number,
        series: currentEditData.modifiedProduct.series || null
      } : null,
      parameters: hasParameterChanges ? currentEditData.modifiedParameters : null,
      template: hasTemplateChanges ? currentEditData.modifiedTemplate : null
    };

    console.log("📤 Sending update data:", updateData);

    // Call backend API
    const result = await window.electronAPI.updateProductData(updateData);

    if (result.success) {
      console.log("✅ Update successful");

      // Close modal
      const modal = document.getElementById("modalEdit");
      modal.classList.remove("active");

      // Reset edit data
      currentEditData = {
        productId: null,
        testTypeId: null,
        originalProduct: null,
        originalParameters: [],
        originalTemplate: null,
        modifiedProduct: {},
        modifiedParameters: [],
        modifiedTemplate: null
      };

      // Show success and reload
      showSuccessModal("Changes saved successfully! The table will refresh automatically.");

      // Reload products
      setTimeout(async () => {
        await loadAllProducts();
      }, 1500);

    } else {
      console.error("❌ Update failed:", result.error);
      saveBtn.disabled = false;
      saveBtn.textContent = originalText;
      showErrorModal("Save Failed", result.error || "Failed to save changes. Please try again.");
    }

  } catch (err) {
    console.error("❌ Error saving changes:", err);
    const saveBtn = document.querySelector('#modalEdit button[onclick="saveEditChanges()"]');
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save Changes";
    }
    showErrorModal("Error", "Failed to save changes: " + err.message);
  }
}

function cancelEdit() {
  showConfirmModal(
    "Discard Changes",
    "Are you sure you want to discard all changes? This action cannot be undone.",
    () => {
      const modal = document.getElementById("modalEdit");
      modal.classList.remove("active");
      currentEditData = {
        productId: null,
        testTypeId: null,
        originalProduct: null,
        originalParameters: [],
        originalTemplate: null,
        modifiedProduct: {},
        modifiedParameters: [],
        modifiedTemplate: null
      };
    }
  );
}

// ============================================
// DELETE PRODUCT
// ============================================
function confirmDeleteProduct(productId, testTypeId) {
  const product = allProducts.find(p => p.id === productId);
  const testType = product?.testSequence.find(t => t.testTypeId === testTypeId);

  showConfirmModal(
    "Delete Product",
    `Are you sure you want to delete ${product?.product_name} - ${testType?.testTypeName}? This action cannot be undone.`,
    () => deleteProduct(productId, testTypeId)
  );
}

async function deleteProduct(productId, testTypeId) {
  try {
    console.log(`🗑️ Deleting product ${productId}, test type ${testTypeId}`);

    // Show loading state
    const result = await window.electronAPI.deleteProductData({ productId, testTypeId });

    if (result.success) {
      console.log("✅ Delete successful");

      // Show success message
      showSuccessModal("Product data deleted successfully! The table will refresh automatically.");

      // Reload products after a short delay
      setTimeout(async () => {
        await loadAllProducts();
      }, 1500);

    } else {
      console.error("❌ Delete failed:", result.error);
      showErrorModal("Delete Failed", result.error || "Failed to delete product data. Please try again.");
    }

  } catch (err) {
    console.error("❌ Error deleting product:", err);
    showErrorModal("Error", "Failed to delete product: " + err.message);
  }
}

// ============================================
// MODAL FUNCTIONS
// ============================================
function showSuccessModal(message) {
  const modal = document.getElementById("modalSuccess");
  const messageEl = document.getElementById("successMessage");

  if (modal && messageEl) {
    messageEl.textContent = message;
    modal.classList.add("active");

    // Auto close after 2 seconds
    setTimeout(() => {
      modal.classList.remove("active");
    }, 2000);
  }
}

function closeSuccessModal() {
  const modal = document.getElementById("modalSuccess");
  if (modal) modal.classList.remove("active");
}

function showErrorModal(title, message) {
  const modal = document.getElementById("modalError");
  const titleEl = document.getElementById("errorTitle");
  const messageEl = document.getElementById("errorMessage");

  if (modal && titleEl && messageEl) {
    titleEl.textContent = title;
    messageEl.textContent = message;
    modal.classList.add("active");
  }
}

function closeErrorModal() {
  const modal = document.getElementById("modalError");
  if (modal) modal.classList.remove("active");
}

function showConfirmModal(title, message, onConfirm) {
  const modal = document.getElementById("modalConfirm");
  const titleEl = document.getElementById("confirmTitle");
  const messageEl = document.getElementById("confirmMessage");
  const btnYes = document.getElementById("btnConfirmYes");
  const btnNo = document.getElementById("btnConfirmNo");

  if (modal && titleEl && messageEl && btnYes && btnNo) {
    titleEl.textContent = title;
    messageEl.textContent = message;

    // Clone buttons to remove old listeners
    const newBtnYes = btnYes.cloneNode(true);
    const newBtnNo = btnNo.cloneNode(true);
    btnYes.parentNode.replaceChild(newBtnYes, btnYes);
    btnNo.parentNode.replaceChild(newBtnNo, btnNo);

    newBtnYes.addEventListener("click", () => {
      modal.classList.remove("active");
      onConfirm();
    });

    newBtnNo.addEventListener("click", () => {
      modal.classList.remove("active");
    });

    modal.classList.add("active");
  }
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
  // Search input - real-time filtering dengan debounce
  const searchInput = document.getElementById("filter_product");
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(applyFilters, 300);
    });

    // Also trigger on Enter key
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        applyFilters();
      }
    });
  }

  // Reset filter button is handled by onclick in HTML
}

function setupModalEvents() {
  // Close modals when clicking outside
  const modals = ["modalViewParameters", "modalViewTemplate", "modalEdit", "modalError", "modalConfirm", "modalSuccess"];

  modals.forEach(modalId => {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.classList.remove("active");
        }
      });
    }
  });

  // ESC key to close modals
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove("active");
      });
    }
  });
}

// ============================================
// GLOBAL FUNCTIONS
// ============================================
window.viewParameters = viewParameters;
window.viewTemplate = viewTemplate;
window.editProduct = editProduct;
window.confirmDeleteProduct = confirmDeleteProduct;
window.resetFilters = resetFilters;
window.switchEditTab = switchEditTab;
window.addNewParameter = addNewParameter;
window.updateParameter = updateParameter;
window.deleteParameter = deleteParameter;
window.updateTemplateColumn = updateTemplateColumn;
window.saveEditChanges = saveEditChanges;
window.cancelEdit = cancelEdit;

console.log("✅ ManageProduct.js loaded successfully");