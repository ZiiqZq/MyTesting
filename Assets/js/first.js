// Assets/js/dataEntry.js

// Global state
let state = {
  products: [],
  testTypes: [],
  templates: [],
  selectedProduct: null,
  selectedTestType: null,
  selectedTemplate: null,
  operatorInfo: null,
  dataRows: [],
  currentUser: JSON.parse(localStorage.getItem('currentUser')) || null
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Data Entry page loaded');
  await loadProducts();
});

// ============================================
// STEP 1: LOAD PRODUCTS
// ============================================
async function loadProducts() {
  try {
    const result = await window.electronAPI.getProducts();
    if (result.success) {
      state.products = result.data;
      populateProductDropdown();
    } else {
      showToast('Gagal memuat produk: ' + result.error, 'error');
    }
  } catch (error) {
    console.error('Error loading products:', error);
    showToast('Error: ' + error.message, 'error');
  }
}

function populateProductDropdown() {
  const select = document.getElementById('productSelect');
  select.innerHTML = '<option value="">-- Pilih Produk --</option>';
  
  state.products.forEach(product => {
    const option = document.createElement('option');
    option.value = product.id;
    option.textContent = `${product.product_name} ${product.product_code ? '(' + product.product_code + ')' : ''}`;
    select.appendChild(option);
  });
}

// ============================================
// STEP 2: LOAD TEST TYPES
// ============================================
async function loadTestTypes() {
  const productId = document.getElementById('productSelect').value;
  
  if (!productId) {
    showToast('Pilih produk terlebih dahulu', 'warning');
    return;
  }

  state.selectedProduct = state.products.find(p => p.id == productId);
  
  try {
    // Load templates untuk produk ini
    const templatesResult = await window.electronAPI.getTemplatesByProduct(productId);
    
    if (!templatesResult.success) {
      showToast('Gagal memuat template: ' + templatesResult.error, 'error');
      return;
    }

    state.templates = templatesResult.data;

    if (state.templates.length === 0) {
      showToast('Belum ada template untuk produk ini. Silakan buat template terlebih dahulu.', 'warning');
      return;
    }

    // Load test types
    const testTypesResult = await window.electronAPI.getTestTypes();
    if (testTypesResult.success) {
      state.testTypes = testTypesResult.data;
      await renderTestTypeButtons(productId);
      
      // Show step 2
      document.getElementById('step2-select-test').classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error loading test types:', error);
    showToast('Error: ' + error.message, 'error');
  }
}

async function renderTestTypeButtons(productId) {
  const container = document.getElementById('testTypeList');
  container.innerHTML = '';

  // Cek test mana yang sudah dilakukan untuk produk ini
  const completedTests = await window.electronAPI.getCompletedTestsByProduct(productId);
  
  // Sort test types by sequence
  const sortedTestTypes = state.testTypes.sort((a, b) => a.sequence_order - b.sequence_order);

  for (const testType of sortedTestTypes) {
    // Cek apakah ada template untuk test type ini
    const hasTemplate = state.templates.some(t => t.test_type_id === testType.id);
    
    if (!hasTemplate) continue; // Skip jika tidak ada template

    // Cek apakah test sebelumnya sudah selesai
    const canAccess = await canAccessTestType(testType, completedTests.data || []);
    
    const button = document.createElement('button');
    button.className = `p-4 rounded-lg border-2 transition ${
      canAccess 
        ? 'border-blue-500 bg-blue-50 hover:bg-blue-100 cursor-pointer' 
        : 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-50'
    }`;
    button.disabled = !canAccess;
    
    button.innerHTML = `
      <div class="text-lg font-semibold ${canAccess ? 'text-blue-700' : 'text-gray-500'}">
        ${testType.name}
      </div>
      <div class="text-sm ${canAccess ? 'text-blue-600' : 'text-gray-400'}">
        Sequence: ${testType.sequence_order}
      </div>
      ${!canAccess ? '<div class="text-xs text-red-600 mt-1">⚠️ Test sebelumnya belum selesai</div>' : ''}
    `;
    
    if (canAccess) {
      button.onclick = () => selectTestType(testType);
    }
    
    container.appendChild(button);
  }
}

async function canAccessTestType(testType, completedTests) {
  // First Test selalu bisa diakses
  if (testType.sequence_order === 1) return true;

  // Cek apakah test sebelumnya (sequence - 1) sudah pass
  const previousTestType = state.testTypes.find(t => t.sequence_order === testType.sequence_order - 1);
  
  if (!previousTestType) return true;

  // Cek apakah ada entry yang pass untuk test sebelumnya
  const hasPreviousPass = completedTests.some(test => 
    test.test_type_id === previousTestType.id && 
    test.status === 'Pass'
  );

  return hasPreviousPass;
}

// ============================================
// STEP 3: SELECT TEST TYPE & SHOW MODAL
// ============================================
function selectTestType(testType) {
  state.selectedTestType = testType;
  state.selectedTemplate = state.templates.find(t => t.test_type_id === testType.id);
  
  if (!state.selectedTemplate) {
    showToast('Template tidak ditemukan untuk test ini', 'error');
    return;
  }

  // Show modal untuk input operator info
  document.getElementById('modalOperatorInfo').classList.remove('hidden');
}

function closeOperatorModal() {
  document.getElementById('modalOperatorInfo').classList.add('hidden');
  // Reset fields
  document.getElementById('operatorName').value = '';
  document.getElementById('poNumber').value = '';
  document.getElementById('startSerial').value = '';
  document.getElementById('quantity').value = '1';
}

// ============================================
// STEP 4: GENERATE DATA ENTRY TABLE
// ============================================
function generateDataEntryTable() {
  const operatorName = document.getElementById('operatorName').value.trim();
  const poNumber = document.getElementById('poNumber').value.trim();
  const startSerial = document.getElementById('startSerial').value.trim();
  const quantity = parseInt(document.getElementById('quantity').value);

  // Validation
  if (!operatorName || !poNumber || !startSerial || !quantity) {
    showToast('Semua field harus diisi!', 'warning');
    return;
  }

  if (quantity < 1 || quantity > 100) {
    showToast('Jumlah harus antara 1-100', 'warning');
    return;
  }

  // Save operator info
  state.operatorInfo = { operatorName, poNumber, startSerial, quantity };

  // Generate serial numbers
  const serialNumbers = generateSerialNumbers(startSerial, quantity);
  
  // Create data rows
  state.dataRows = serialNumbers.map(sn => ({
    serialNumber: sn,
    displaySerialNumber: sn,
    values: {},
    status: 'empty'
  }));

  // Render table
  renderDataEntryTable();

  // Close modal
  closeOperatorModal();

  // Show step 4
  document.getElementById('step4-data-entry').classList.remove('hidden');
  
  // Update test info
  document.getElementById('testInfo').textContent = 
    `${state.selectedProduct.product_name} - ${state.selectedTestType.name} | PO: ${poNumber} | Operator: ${operatorName}`;
}

function generateSerialNumbers(startSerial, quantity) {
  const serialNumbers = [];
  
  // Check if serial is numeric
  if (/^\d+$/.test(startSerial)) {
    let num = parseInt(startSerial);
    for (let i = 0; i < quantity; i++) {
      serialNumbers.push((num + i).toString());
    }
  } else {
    // Alphanumeric serial
    for (let i = 0; i < quantity; i++) {
      serialNumbers.push(`${startSerial}-${i + 1}`);
    }
  }
  
  return serialNumbers;
}

function renderDataEntryTable() {
  const table = document.getElementById('dataEntryTable');
  const columns = state.selectedTemplate.custom_columns.columns || [];

  // Build table header
  let headerHTML = '<thead class="bg-gray-100"><tr>';
  headerHTML += '<th class="sticky left-0 bg-gray-100 z-10">No</th>';
  headerHTML += '<th class="sticky left-0 bg-gray-100 z-10" style="left: 50px;">Serial Number</th>';
  
  columns.forEach(col => {
    const unitText = col.unit ? ` (${col.unit})` : '';
    const lslText = col.lsl ? `LSL: ${col.lsl}` : '';
    const uslText = col.usl ? `USL: ${col.usl}` : '';
    const limits = [lslText, uslText].filter(Boolean).join(' | ');
    
    headerHTML += `
      <th class="min-w-[150px]">
        <div class="font-semibold">${col.name}${unitText}</div>
        ${limits ? `<div class="text-xs text-gray-600 font-normal">${limits}</div>` : ''}
      </th>
    `;
  });
  
  headerHTML += '<th>Status</th>';
  headerHTML += '<th>Action</th>';
  headerHTML += '</tr></thead>';

  // Build table body
  let bodyHTML = '<tbody>';
  state.dataRows.forEach((row, index) => {
    bodyHTML += `<tr data-row="${index}">`;
    bodyHTML += `<td class="sticky left-0 bg-white z-10">${index + 1}</td>`;
    bodyHTML += `<td class="sticky left-0 bg-white z-10" style="left: 50px;">${row.serialNumber}</td>`;
    
    columns.forEach(col => {
      if (col.type === 'number') {
        bodyHTML += `
          <td>
            <input 
              type="text" 
              data-row="${index}" 
              data-col="${col.id}"
              data-type="number"
              data-lsl="${col.lsl || ''}"
              data-usl="${col.usl || ''}"
              onchange="validateAndUpdateCell(this)"
              placeholder="..."
            />
          </td>
        `;
      } else if (col.type === 'passfail') {
        bodyHTML += `
          <td>
            <select 
              data-row="${index}" 
              data-col="${col.id}"
              data-type="passfail"
              onchange="validateAndUpdateCell(this)"
            >
              <option value="">--</option>
              <option value="Pass">Pass</option>
              <option value="Fail">Fail</option>
            </select>
          </td>
        `;
      }
    });
    
    bodyHTML += `<td><span id="status-${index}" class="px-3 py-1 rounded status-empty">Empty</span></td>`;
    bodyHTML += `<td><button onclick="deleteRow(${index})" class="text-red-600 hover:text-red-800 font-medium">🗑️ Delete</button></td>`;
    bodyHTML += '</tr>';
  });
  bodyHTML += '</tbody>';

  table.innerHTML = headerHTML + bodyHTML;
  updateSummary();
}

// ============================================
// VALIDATION & UPDATE
// ============================================
function validateAndUpdateCell(element) {
  const rowIndex = parseInt(element.dataset.row);
  const colId = element.dataset.col;
  const type = element.dataset.type;
  const value = element.value.trim();

  let isPass = false;

  if (type === 'number') {
    const lsl = element.dataset.lsl ? parseFloat(element.dataset.lsl.replace(',', '.')) : null;
    const usl = element.dataset.usl ? parseFloat(element.dataset.usl.replace(',', '.')) : null;
    const numValue = parseFloat(value.replace(',', '.'));

    if (isNaN(numValue)) {
      element.style.borderColor = '#ef4444';
      isPass = false;
    } else {
      // Validasi LSL/USL
      if (lsl !== null && numValue < lsl) {
        isPass = false;
        element.style.borderColor = '#ef4444';
        element.style.backgroundColor = '#fee2e2';
      } else if (usl !== null && numValue > usl) {
        isPass = false;
        element.style.borderColor = '#ef4444';
        element.style.backgroundColor = '#fee2e2';
      } else {
        isPass = true;
        element.style.borderColor = '#10b981';
        element.style.backgroundColor = '#d1fae5';
      }
    }
  } else if (type === 'passfail') {
    isPass = value === 'Pass';
    element.style.borderColor = isPass ? '#10b981' : '#ef4444';
    element.style.backgroundColor = isPass ? '#d1fae5' : '#fee2e2';
  }

  // Update state
  state.dataRows[rowIndex].values[colId] = { value, isPass };
  
  // Update row status
  updateRowStatus(rowIndex);
  updateSummary();
}

function updateRowStatus(rowIndex) {
  const row = state.dataRows[rowIndex];
  const columns = state.selectedTemplate.custom_columns.columns || [];
  
  const allFilled = columns.every(col => row.values[col.id]?.value);
  
  if (!allFilled) {
    row.status = 'empty';
  } else {
    const allPass = columns.every(col => row.values[col.id]?.isPass);
    row.status = allPass ? 'Pass' : 'Fail';
  }

  // Update UI
  const statusElement = document.getElementById(`status-${rowIndex}`);
  statusElement.textContent = row.status;
  statusElement.className = `px-3 py-1 rounded status-${row.status.toLowerCase()}`;
}

function updateSummary() {
  const total = state.dataRows.length;
  const pass = state.dataRows.filter(r => r.status === 'Pass').length;
  const fail = state.dataRows.filter(r => r.status === 'Fail').length;
  const empty = state.dataRows.filter(r => r.status === 'empty').length;

  document.getElementById('totalCount').textContent = total;
  document.getElementById('passCount').textContent = pass;
  document.getElementById('failCount').textContent = fail;
  document.getElementById('emptyCount').textContent = empty;
}

// ============================================
// DELETE ROW
// ============================================
function deleteRow(index) {
  if (confirm(`Hapus row dengan serial number ${state.dataRows[index].serialNumber}?`)) {
    state.dataRows.splice(index, 1);
    renderDataEntryTable();
    showToast('Row berhasil dihapus', 'success');
  }
}

// ============================================
// SUBMIT DATA
// ============================================
async function submitDataEntry() {
  // Validation
  const emptyRows = state.dataRows.filter(r => r.status === 'empty');
  
  if (emptyRows.length > 0) {
    showToast(`Masih ada ${emptyRows.length} row yang belum diisi lengkap!`, 'warning');
    return;
  }

  if (!confirm(`Submit ${state.dataRows.length} entries untuk ${state.selectedProduct.product_name} - ${state.selectedTestType.name}?`)) {
    return;
  }

  try {
    const submitData = {
      templateId: state.selectedTemplate.id,
      productId: state.selectedProduct.id,
      testTypeId: state.selectedTestType.id,
      operatorName: state.operatorInfo.operatorName,
      poNumber: state.operatorInfo.poNumber,
      testDate: new Date().toISOString().split('T')[0],
      entries: state.dataRows.map(row => ({
        serialNumber: row.serialNumber,
        displaySerialNumber: row.displaySerialNumber,
        testResults: row.values,
        status: row.status
      }))
    };

    const result = await window.electronAPI.submitTestEntries(submitData);

    if (result.success) {
      showToast('✅ Data berhasil disimpan!', 'success');
      setTimeout(() => {
        resetDataEntry();
      }, 2000);
    } else {
      showToast('Gagal menyimpan data: ' + result.error, 'error');
    }
  } catch (error) {
    console.error('Error submitting data:', error);
    showToast('Error: ' + error.message, 'error');
  }
}

// ============================================
// RESET
// ============================================
function resetDataEntry() {
  state.selectedProduct = null;
  state.selectedTestType = null;
  state.selectedTemplate = null;
  state.operatorInfo = null;
  state.dataRows = [];

  document.getElementById('productSelect').value = '';
  document.getElementById('step2-select-test').classList.add('hidden');
  document.getElementById('step4-data-entry').classList.add('hidden');
}

// ============================================
// NAVIGATION
// ============================================
function goBack() {
  window.electronAPI.kembali();
}

// ============================================
// TOAST NOTIFICATION
// ============================================
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');
  
  toastMessage.textContent = message;
  
  const colors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-yellow-600',
    info: 'bg-blue-600'
  };
  
  toast.className = `fixed bottom-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 fade-in`;
  toast.classList.remove('hidden');
  
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}