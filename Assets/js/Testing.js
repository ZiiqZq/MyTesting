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

// Selection system
let selectedCells = new Set();
let selectionStartCell = null;
let isShiftPressed = false;
let isCtrlPressed = false;

// Header mapping untuk tracking
let headerColumnMap = new Map(); // Maps: globalIndex -> {element, type, parentIndex}

// Navigation lock system
let navigationWarningActive = false;
let navigationTarget = null;

// ============================================
// NAVIGATION LOCK SYSTEM
// ============================================
function initNavigationLock() {
    console.log("Initializing navigation lock...");

    // Event listener untuk sebelum window ditutup
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Event listener untuk menangkap klik navigasi di sidebar
    setupSidebarNavigationLock();

    // Setup Electron close event
    setupElectronCloseHandler();
}

function cleanupNavigationLock() {
    console.log("Cleaning up navigation lock...");

    window.removeEventListener('beforeunload', handleBeforeUnload);
    removeSidebarNavigationLock();

    if (window.electronAPI && window.electronAPI.removeAllListeners) {
        window.electronAPI.removeAllListeners('close-warning');
    }

    navigationWarningActive = false;
    navigationTarget = null;
}

function handleBeforeUnload(event) {
    if (testingInProgress) {
        event.preventDefault();
        event.returnValue = 'Testing sedang berjalan! Semua data akan hilang jika Anda meninggalkan halaman.';

        // Jika Electron API tersedia, gunakan modal custom
        if (window.electronAPI) {
            showNavigationWarningModal('leave');
        }
        return event.returnValue;
    }
}

function setupSidebarNavigationLock() {
    console.log("Setting up sidebar navigation lock...");

    // Tangkap semua klik pada sidebar dan dropdown
    document.addEventListener('click', handleNavigationClick, true);
}

function removeSidebarNavigationLock() {
    document.removeEventListener('click', handleNavigationClick, true);
}

function handleNavigationClick(event) {
    if (!testingInProgress) return;

    const target = event.target.closest('[data-page], .sidebar-btn, .dropdown-item, .dropdown-item button');

    if (target) {
        // Cek jika ini adalah elemen navigasi
        const dataPage = target.getAttribute('data-page');
        const isSidebarBtn = target.classList.contains('sidebar-btn');
        const isDropdownItem = target.classList.contains('dropdown-item');
        const isDropdownBtn = target.closest('.dropdown-item') && target.tagName === 'BUTTON';

        const isNavigationElement = dataPage || isSidebarBtn || isDropdownItem || isDropdownBtn;

        if (isNavigationElement && !target.closest('#modalNavigationWarning')) {
            event.preventDefault();
            event.stopPropagation();

            // Dapatkan nama halaman target
            let pageName = dataPage;
            if (!pageName && (isDropdownItem || isDropdownBtn)) {
                // Coba dapatkan dari teks atau atribut lain
                const pageElement = isDropdownItem ? target : target.closest('.dropdown-item');
                if (pageElement) {
                    pageName = pageElement.getAttribute('data-page') ||
                        pageElement.textContent.trim().toLowerCase().replace(/\s+/g, '');
                }
            }

            if (pageName) {
                // Simpan target navigasi untuk digunakan nanti
                navigationTarget = {
                    element: target,
                    page: pageName
                };

                // Tampilkan warning modal
                showNavigationWarningModal('navigate');
            }
        }
    }
}

function setupElectronCloseHandler() {
    if (window.electronAPI && window.electronAPI.onCloseWarning) {
        window.electronAPI.onCloseWarning(() => {
            if (testingInProgress) {
                showNavigationWarningModal('leave');
                return true; // Mencegah window close
            }
            return false; // Izinkan window close
        });
    }
}

function showNavigationWarningModal(type) {
    if (navigationWarningActive) return;

    navigationWarningActive = true;

    const modal = document.getElementById('modalNavigationWarning');
    const title = modal.querySelector('h3');
    const message = modal.querySelector('p');
    const cancelBtn = document.getElementById('btnCancelNavigation');
    const confirmBtn = document.getElementById('btnConfirmNavigation');

    if (!modal || !title || !message || !cancelBtn || !confirmBtn) {
        console.error('Modal navigation warning elements not found');
        navigationWarningActive = false;
        return;
    }

    if (type === 'leave') {
        title.textContent = 'Keluar dari Testing';
        message.textContent = 'Testing sedang berjalan. Semua data testing akan hilang jika Anda meninggalkan halaman. Yakin ingin keluar?';
        confirmBtn.textContent = 'Keluar';
    } else {
        title.textContent = 'Pindah Halaman';
        message.textContent = 'Testing sedang berjalan. Semua data testing akan hilang jika Anda pindah halaman. Yakin ingin pindah?';
        confirmBtn.textContent = 'Pindah';
    }

    // Clone buttons untuk menghindari duplicate event listeners
    const newCancelBtn = cancelBtn.cloneNode(true);
    const newConfirmBtn = confirmBtn.cloneNode(true);

    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    // Setup event listeners baru
    newCancelBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        navigationWarningActive = false;
        navigationTarget = null;
    });

    newConfirmBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        navigationWarningActive = false;

        if (type === 'leave') {
            // Tutup aplikasi melalui Electron API
            resetTestingData();
            if (window.electronAPI && window.electronAPI.closeWindow) {
                window.electronAPI.closeWindow();
            }
        } else if (type === 'navigate' && navigationTarget) {
            // Reset semua data testing
            resetTestingData();

            // Lakukan navigasi
            if (navigationTarget.page) {
                const pageMap = {
                    'dashboard': 'Dashboard.html',
                    'view': 'View.html',
                    'about': 'Testing.html',
                    'dataentry': 'DataEntry.html',
                    'generate': 'Generate.html',
                    'testing': 'Testing.html',
                    'addproduct': 'AddProduct.html',
                    'settings': 'Settings.html',
                    'addproduct': 'AddProduct.html',
                    'manageproduct': 'Manage.html',
                    'generatecolumn': 'Generate.html'
                };

                const pageFile = pageMap[navigationTarget.page.toLowerCase()];
                if (pageFile && window.electronAPI && window.electronAPI.navigateTo) {
                    window.electronAPI.navigateTo(`Page/${pageFile}`);
                } else if (window.SidebarLoader && window.SidebarLoader.navigateToPage) {
                    window.SidebarLoader.navigateToPage(navigationTarget.page);
                }
            }
        }
    });

    modal.classList.add('active');

    // Close modal ketika klik di luar
    const closeModalOnOutsideClick = (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            navigationWarningActive = false;
            navigationTarget = null;
            modal.removeEventListener('click', closeModalOnOutsideClick);
        }
    };

    modal.addEventListener('click', closeModalOnOutsideClick);

    // Close modal dengan Escape key
    const closeModalOnEscape = (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            modal.classList.remove('active');
            navigationWarningActive = false;
            navigationTarget = null;
            document.removeEventListener('keydown', closeModalOnEscape);
        }
    };

    document.addEventListener('keydown', closeModalOnEscape);
}

function resetTestingData() {
    console.log('Resetting all testing data...');

    // Reset semua state variables
    selectedProduct = null;
    selectedTestType = null;
    testParameters = [];
    templateData = null;
    testingInProgress = false;
    testInformation = {};
    tableRows = [];
    selectedCells.clear();
    selectionStartCell = null;
    headerColumnMap.clear();

    // Reset UI ke state awal
    document.getElementById("setupSection").classList.remove("hidden");
    document.getElementById("testingSection").classList.add("hidden");

    // Reset semua input fields
    const resetFields = {
        "selectProduct": "",
        "selectSeries": "",
        "inputTesterName": "",
        "inputTestDate": new Date().toISOString().split("T")[0],
        "inputPONumber": "",
        "inputLotNumber": "",
        "inputSerialNumber": "",
        "inputQty": "1",
        "inputMultimeterSN": "",
        "inputOscilloscopeSN": ""
    };

    Object.entries(resetFields).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.value = value;
            element.classList.remove('invalid');
        }
    });

    // Sembunyikan semua section
    ["seriesContainer", "testTypeSection", "testInfoSection"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add("hidden");
    });

    // Kosongkan dropdowns
    const productDropdown = document.getElementById("productDropdown");
    const seriesDropdown = document.getElementById("seriesDropdown");
    if (productDropdown) productDropdown.innerHTML = "";
    if (seriesDropdown) seriesDropdown.innerHTML = "";

    document.getElementById("testTypeList").innerHTML = "";
    document.getElementById("testParametersDisplay").innerHTML = "";

    // Reset table
    const thead = document.getElementById("testingTableHead");
    const tbody = document.getElementById("testingTableBody");
    if (thead) thead.innerHTML = "";
    if (tbody) tbody.innerHTML = "";

    // Reset serial display
    updateSerialRangeDisplay();

    // Cleanup selection features
    clearSelection();

    // Cleanup navigation lock
    cleanupNavigationLock();

    console.log('Testing data reset complete');
}

// ============================================
// RESET FUNCTIONS
// ============================================
function resetSeriesAndBelow() {
    console.log("Resetting series and below...");

    ["seriesContainer", "testTypeSection", "testInfoSection"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add("hidden");
    });

    selectedTestType = null;
    templateData = null;
    testParameters = [];
    productSeries = [];
    headerColumnMap.clear();

    document.getElementById("testTypeList").innerHTML = "";
    document.getElementById("testParametersDisplay").innerHTML = "";

    const seriesInput = document.getElementById("selectSeries");
    if (seriesInput) {
        seriesInput.value = "";
        seriesInput.classList.remove("invalid");
        const seriesDropdown = document.getElementById("seriesDropdown");
        if (seriesDropdown) {
            seriesDropdown.innerHTML = "";
            seriesDropdown.classList.remove("active");
        }
    }
}

function resetTestTypeAndBelow() {
    console.log("Resetting test type and below...");

    ["testTypeSection", "testInfoSection"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add("hidden");
    });

    selectedTestType = null;
    templateData = null;
    testParameters = [];
    headerColumnMap.clear();

    document.getElementById("testTypeList").innerHTML = "";
    document.getElementById("testParametersDisplay").innerHTML = "";

    const testInfoInputs = {
        "inputTesterName": "",
        "inputTestDate": new Date().toISOString().split("T")[0],
        "inputPONumber": "",
        "inputLotNumber": "",
        "inputSerialNumber": "",
        "inputQty": "1",
        "inputMultimeterSN": "",
        "inputOscilloscopeSN": ""
    };

    Object.entries(testInfoInputs).forEach(([id, value]) => {
        const input = document.getElementById(id);
        if (input) input.value = value;
    });

    updateSerialRangeDisplay();
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

function closeErrorModal(e) {
    if (e && e.target.id !== "modalError") return;
    document.getElementById("modalError")?.classList.remove("active");
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

function closeSuccessModal(e) {
    if (e && e.target.id !== "modalSuccess") return;
    document.getElementById("modalSuccess")?.classList.remove("active");
    location.reload();
}

function closeConfirmModal(e) {
    if (e && e.target.id !== "modalConfirm") return;
    document.getElementById("modalConfirm")?.classList.remove("active");
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

    if (btnYes && btnNo) {
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
    }
}

function setupSuccessModalClose() {
    const btnCloseSuccess = document.getElementById("btnCloseSuccess");
    if (btnCloseSuccess) {
        const newBtn = btnCloseSuccess.cloneNode(true);
        btnCloseSuccess.parentNode.replaceChild(newBtn, btnCloseSuccess);
        newBtn.addEventListener("click", () => {
            document.getElementById("modalSuccess")?.classList.remove("active");
            location.reload();
        });
    }

    const modalSuccess = document.getElementById("modalSuccess");
    if (modalSuccess) {
        modalSuccess.addEventListener("click", (e) => {
            if (e.target === modalSuccess) closeSuccessModal(e);
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
// INITIALIZATION
// ============================================
document.addEventListener("DOMContentLoaded", async () => {
    console.log("Halaman Testing Dimuat");

    const testDateInput = document.getElementById("inputTestDate");
    if (testDateInput) {
        testDateInput.value = new Date().toISOString().split("T")[0];
    }

    await loadProducts();
    setupEventListeners();
    setupModalCloseEvents();

    // Setup untuk modal after submit
    setupAfterSubmitModalHandlers();
});

// ============================================
// SELECTION SYSTEM
// ============================================
function initSelectionFeatures() {
    setupKeyboardEvents();
    setupSelectionToolbarButtons();

    setTimeout(() => {
        setupTableSelectionEvents();
        setupHeaderColumnMapping();
    }, 100);

    document.addEventListener('click', (e) => {
        const table = document.getElementById('testingTable');
        const toolbar = document.querySelector('.table-toolbar');
        const leftPanel = document.querySelector('.left-panel');

        if (!table?.contains(e.target) &&
            !toolbar?.contains(e.target) &&
            !leftPanel?.contains(e.target)) {
            if (!e.target.closest('.modal') &&
                !e.target.closest('.custom-dropdown-menu') &&
                !e.target.closest('.action-buttons')) {
                clearSelection();
            }
        }
    });
}

function setupHeaderColumnMapping() {
    headerColumnMap.clear();
    const table = document.getElementById('testingTable');
    if (!table) return;

    const thead = table.querySelector('thead');
    if (!thead) return;

    const headers = thead.querySelectorAll('th');
    headers.forEach(header => {
        const globalIndex = header.getAttribute('data-global-index');
        if (globalIndex) {
            const index = parseInt(globalIndex);
            headerColumnMap.set(index, {
                element: header,
                type: header.classList.contains('sub-header') ? 'sub' : 'main',
                colspan: parseInt(header.getAttribute('colspan') || '1'),
                rowspan: parseInt(header.getAttribute('rowspan') || '1')
            });
        }
    });
}

function setupKeyboardEvents() {
    document.addEventListener('keydown', (e) => {
        isShiftPressed = e.shiftKey;
        isCtrlPressed = e.ctrlKey || e.metaKey;

        if (e.key === 'Escape') clearSelection();
        if (isCtrlPressed && e.key === 'a') {
            e.preventDefault();
            selectAllEditableCells();
        }

        if (selectedCells.size > 0 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            if (e.key.length === 1 || ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                const firstCell = getFirstSelectedCell();
                if (firstCell && !document.activeElement.matches('input, select, textarea')) {
                    const input = firstCell.querySelector('input, select');
                    if (input) {
                        input.focus();
                        if (e.key.length === 1 && !e.ctrlKey && !e.altKey) {
                            setTimeout(() => {
                                if (input.tagName === 'SELECT') {
                                    input.value = e.key;
                                    input.dispatchEvent(new Event('change'));
                                } else {
                                    input.value += e.key;
                                    input.dispatchEvent(new Event('input'));
                                }
                            }, 50);
                            e.preventDefault();
                        }
                    }
                }
            }
        }
    });

    document.addEventListener('keyup', (e) => {
        isShiftPressed = e.shiftKey;
        isCtrlPressed = e.ctrlKey || e.metaKey;
    });
}

function setupSelectionToolbarButtons() {
    const selectAllBtn = document.getElementById('btnSelectAll');
    const clearBtn = document.getElementById('btnClearSelection');

    if (selectAllBtn) selectAllBtn.addEventListener('click', selectAllEditableCells);
    if (clearBtn) clearBtn.addEventListener('click', clearSelection);
}

function setupTableSelectionEvents() {
    const table = document.getElementById('testingTable');
    if (!table) return;

    const tbody = table.querySelector('tbody');
    const thead = table.querySelector('thead');

    if (tbody) {
        tbody.addEventListener('click', handleCellClick);
        tbody.addEventListener('focusin', handleCellFocus, true);
        tbody.addEventListener('input', handleCellInput);
        tbody.addEventListener('keydown', handleCellKeyDown);
    }

    if (thead) {
        thead.addEventListener('click', handleHeaderClick);

        // Tambahkan visual feedback untuk header yang bisa diklik
        thead.querySelectorAll('th[data-global-index]').forEach(th => {
            if (parseInt(th.getAttribute('data-global-index')) >= 2) {
                th.style.cursor = 'pointer';
                th.title = 'Klik untuk memilih kolom ini';
            }
        });
    }

    // Global keyboard listener untuk menangani input saat kolom dipilih
    document.addEventListener('keydown', (e) => {
        // Jika tidak ada input yang aktif, tapi ada sel yang dipilih
        if (!document.activeElement.matches('input, select') && selectedCells.size > 0) {
            // Jika pengguna mengetik karakter langsung
            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                // Cari sel pertama yang dipilih
                const firstCell = getFirstSelectedCell();
                if (firstCell) {
                    const input = firstCell.querySelector('input, select');
                    if (input) {
                        e.preventDefault();
                        input.focus();

                        // Set nilai (untuk input kosong atau replace)
                        if (input.type === 'text' || input.type === 'number') {
                            input.value = e.key;
                            input.setSelectionRange(1, 1);

                            // Trigger input event
                            const inputEvent = new Event('input', { bubbles: true });
                            input.dispatchEvent(inputEvent);

                            // Apply ke semua sel yang dipilih
                            if (selectedCells.size > 1) {
                                applyToSelectedCellsImmediate(input, e.key);
                            }
                        }
                    }
                }
            }
        }
    });
}
function handleCellClick(e) {
    const td = e.target.closest('td');
    if (!td) return;

    const cellPos = getCellPosition(td);
    if (cellPos.col < 2) return;

    td.classList.add('selectable');

    if (isShiftPressed && selectionStartCell) {
        selectCellRange(selectionStartCell, cellPos);
    } else if (isCtrlPressed) {
        toggleCellSelection(cellPos.row, cellPos.col);
        selectionStartCell = cellPos;
    } else {
        clearSelection();
        selectCell(cellPos.row, cellPos.col);
        selectionStartCell = cellPos;

        // Fokuskan input jika diklik langsung
        const input = td.querySelector('input, select');
        if (input) {
            setTimeout(() => {
                input.focus();
                input.setSelectionRange(0, input.value.length);
            }, 10);
        }
    }

    updateColumnInfo(td);
    updateSelectionInfo();
}

function handleCellFocus(e) {
    const input = e.target;
    if (!input.matches('input, select')) return;

    const td = input.closest('td');
    if (td) updateColumnInfo(td);
}

function handleCellInput(e) {
    const input = e.target;
    if (!input.matches('input, select')) return;

    // Debounce untuk mencegah multiple calls
    clearTimeout(input._inputTimeout);
    input._inputTimeout = setTimeout(() => {
        if (selectedCells.size > 1) {
            applyToSelectedCells(input);
        }
    }, 50);
}

function handleCellKeyDown(e) {
    const input = e.target;
    if (!input.matches('input, select')) return;

    // Simpan nilai lama
    const oldValue = input.value;

    // Tangkap semua tombol yang mengubah input
    const isTypingKey = e.key.length === 1 ||
        e.key === 'Backspace' ||
        e.key === 'Delete' ||
        e.key === 'Tab' ||
        e.key === 'Enter';

    if (!e.ctrlKey && !e.metaKey && !e.altKey && isTypingKey) {
        // Gunakan setTimeout untuk menunggu nilai berubah
        setTimeout(() => {
            const newValue = input.value;

            // Jika nilai berubah atau tombol Backspace/Delete ditekan
            if (newValue !== oldValue || e.key === 'Backspace' || e.key === 'Delete') {
                // Terapkan ke semua sel yang dipilih (kecuali yang sedang aktif)
                if (selectedCells.size > 1) {
                    applyToSelectedCellsImmediate(input, newValue);
                }
            }
        }, 0);
    }
}

function applyToSelectedCellsImmediate(sourceInput, value) {
    if (!sourceInput || selectedCells.size <= 1) return;

    const inputType = sourceInput.tagName;
    const isSelect = inputType === 'SELECT';

    // Flag untuk mencegah event loop
    if (sourceInput._applyingBatch) return;
    sourceInput._applyingBatch = true;

    try {
        selectedCells.forEach(cellKey => {
            const [row, col] = cellKey.split('-').map(Number);
            const td = getCellByPosition(row, col);

            if (td) {
                const targetInput = td.querySelector('input, select');
                if (targetInput && targetInput.tagName === inputType && targetInput !== sourceInput) {
                    // Update nilai jika berbeda
                    if (targetInput.value !== value) {
                        targetInput.value = value;

                        // Trigger events untuk validasi
                        if (isSelect) {
                            targetInput.dispatchEvent(new Event('change', { bubbles: true }));
                        } else {
                            const inputEvent = new Event('input', { bubbles: true });
                            targetInput.dispatchEvent(inputEvent);
                        }

                        // Update UI
                        targetInput.classList.add('batch-updated');
                        setTimeout(() => {
                            targetInput.classList.remove('batch-updated');
                        }, 100);
                    }
                }
            }
        });
    } finally {
        setTimeout(() => {
            sourceInput._applyingBatch = false;
        }, 10);
    }
}

function handleHeaderClick(e) {
    const th = e.target.closest('th');
    if (!th) return;

    e.stopPropagation();

    const globalIndex = parseInt(th.getAttribute('data-global-index'));
    if (isNaN(globalIndex) || globalIndex < 2) return;

    console.log(`Clicked header: ${th.textContent}, Global Index: ${globalIndex}`);

    if (isShiftPressed && selectionStartCell) {
        const startCol = Math.min(selectionStartCell.col, globalIndex);
        const endCol = Math.max(selectionStartCell.col, globalIndex);
        selectColumnRange(startCol, endCol);

        // Fokus ke sel pertama di kolom pertama range
        setTimeout(() => focusFirstCellInColumn(startCol), 10);
    } else {
        selectColumn(globalIndex);

        // Fokus ke sel pertama di kolom yang dipilih
        setTimeout(() => focusFirstCellInColumn(globalIndex), 10);
    }

    updateColumnInfoFromHeader(th);
    updateSelectionInfo();
}


function focusFirstCellInSelectedRange(startCol, endCol) {
    if (startCol < 2) return;

    const firstRow = 0;
    const cellKey = `${firstRow}-${startCol}`;

    if (selectedCells.has(cellKey)) {
        const td = getCellByPosition(firstRow, startCol);
        if (td) {
            const input = td.querySelector('input, select');
            if (input) {
                setTimeout(() => {
                    input.focus();

                    if (input.tagName === 'SELECT') {
                        input.focus();
                    } else if (input.type === 'text' || input.type === 'number') {
                        input.focus();
                        input.setSelectionRange(input.value.length, input.value.length);
                    }

                    selectionStartCell = { row: firstRow, col: startCol };
                }, 10);
            }
        }
    }
}

function focusFirstCellInColumn(colIndex) {
    if (colIndex < 2) return;

    const firstRow = 0;
    const td = getCellByPosition(firstRow, colIndex);

    if (td) {
        const input = td.querySelector('input, select');
        if (input) {
            // Gunakan setTimeout untuk memastikan DOM sudah siap
            setTimeout(() => {
                input.focus();

                // Pilih semua teks yang ada (jika ada)
                if (input.type === 'text' || input.type === 'number') {
                    input.setSelectionRange(0, input.value.length);
                }

                // Simpan sebagai starting cell
                selectionStartCell = { row: firstRow, col: colIndex };

                // Tambahkan class untuk styling fokus
                td.classList.add('force-focused');
                input.classList.add('force-focused');

                // Hapus class setelah beberapa saat
                setTimeout(() => {
                    td.classList.remove('force-focused');
                    input.classList.remove('force-focused');
                }, 300);

                console.log('Focused input in column:', colIndex, 'value:', input.value);
            }, 0);
        }
    }
}

// ============================================
// SELECTION UTILITIES
// ============================================
function getCellPosition(td) {
    const row = td.closest('tr');
    const tbody = row.closest('tbody');

    const rowIndex = Array.from(tbody.children).indexOf(row);
    const colIndex = Array.from(row.children).indexOf(td);

    return { row: rowIndex, col: colIndex };
}

function getCellByPosition(row, col) {
    const table = document.getElementById('testingTable');
    const tbody = table.querySelector('tbody');

    if (!tbody || row >= tbody.children.length) return null;

    const tr = tbody.children[row];
    if (!tr || col >= tr.children.length) return null;

    return tr.children[col];
}

function selectCell(row, col) {
    if (col < 2) return;

    const cellKey = `${row}-${col}`;
    selectedCells.add(cellKey);

    const td = getCellByPosition(row, col);
    if (td) td.classList.add('selected');
}

function toggleCellSelection(row, col) {
    if (col < 2) return;

    const cellKey = `${row}-${col}`;
    const td = getCellByPosition(row, col);

    if (selectedCells.has(cellKey)) {
        selectedCells.delete(cellKey);
        if (td) td.classList.remove('selected');
    } else {
        selectedCells.add(cellKey);
        if (td) td.classList.add('selected');
    }
}

function selectCellRange(start, end) {
    const startRow = Math.min(start.row, end.row);
    const endRow = Math.max(start.row, end.row);
    const startCol = Math.min(start.col, end.col);
    const endCol = Math.max(start.col, end.col);

    for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
            if (col >= 2) selectCell(row, col);
        }
    }

    const firstSelectableCol = Math.max(startCol, 2);
    const firstCell = getCellByPosition(startRow, firstSelectableCol);
    if (firstCell) {
        const input = firstCell.querySelector('input, select');
        if (input) {
            setTimeout(() => {
                input.focus();
                if (input.type === 'text' || input.tagName === 'SELECT') {
                    input.setSelectionRange(input.value.length, input.value.length);
                }
            }, 10);
        }
    }
}

function selectColumn(colIndex) {
    if (colIndex < 2) return;

    const table = document.getElementById('testingTable');
    const tbody = table.querySelector('tbody');
    const rows = tbody.children;

    clearSelection();

    for (let row = 0; row < rows.length; row++) {
        const cellKey = `${row}-${colIndex}`;
        selectedCells.add(cellKey);

        const td = getCellByPosition(row, colIndex);
        if (td) {
            td.classList.add('selected');

            // Tambahkan class khusus untuk kolom yang dipilih dari header
            if (row === 0) {
                td.classList.add('header-selected');
                const input = td.querySelector('input, select');
                if (input) {
                    input.classList.add('header-selected-input');
                }
            }
        }
    }

    const headerInfo = headerColumnMap.get(colIndex);
    if (headerInfo) {
        headerInfo.element.classList.add('selected');
    }

    console.log('Selected column:', colIndex, 'cells:', selectedCells.size);
}
function selectColumnRange(startCol, endCol) {
    if (startCol < 2) return;

    const table = document.getElementById('testingTable');
    const tbody = table.querySelector('tbody');
    const rows = tbody.children;

    clearSelection();

    for (let row = 0; row < rows.length; row++) {
        for (let col = startCol; col <= endCol; col++) {
            if (col >= 2) {
                const cellKey = `${row}-${col}`;
                selectedCells.add(cellKey);

                const td = getCellByPosition(row, col);
                if (td) {
                    td.classList.add('selected');

                    // Tambahkan class khusus untuk baris pertama
                    if (row === 0) {
                        td.classList.add('header-selected');
                        const input = td.querySelector('input, select');
                        if (input) {
                            input.classList.add('header-selected-input');
                        }
                    }
                }
            }
        }
    }

    for (let col = startCol; col <= endCol; col++) {
        if (col >= 2) {
            const headerInfo = headerColumnMap.get(col);
            if (headerInfo) {
                headerInfo.element.classList.add('selected');
            }
        }
    }

    console.log('Selected column range:', startCol, '-', endCol, 'cells:', selectedCells.size);
}

function selectAllEditableCells() {
    const table = document.getElementById('testingTable');
    const tbody = table.querySelector('tbody');
    const rows = tbody.children;

    clearSelection();

    for (let row = 0; row < rows.length; row++) {
        const cells = rows[row].children;
        for (let col = 2; col < cells.length; col++) {
            selectCell(row, col);
        }
    }

    headerColumnMap.forEach((info, index) => {
        if (index >= 2) {
            info.element.classList.add('selected');
        }
    });

    updateSelectionInfo();
}

function clearSelection() {
    selectedCells.forEach(cellKey => {
        const [row, col] = cellKey.split('-').map(Number);
        const td = getCellByPosition(row, col);
        if (td) {
            td.classList.remove('selected', 'selectable', 'header-selected', 'force-focused');

            // Hapus class dari input
            const input = td.querySelector('input, select');
            if (input) {
                input.classList.remove('header-selected-input', 'force-focused');
            }
        }
    });

    selectedCells.clear();

    const table = document.getElementById('testingTable');
    if (table) {
        table.querySelectorAll('th.selected').forEach(header => {
            header.classList.remove('selected');
        });
    }

    selectionStartCell = null;

    const clearBtn = document.getElementById('btnClearSelection');
    if (clearBtn) clearBtn.style.display = 'none';

    updateSelectionInfo("Selection cleared");
}


function getFirstSelectedCell() {
    if (selectedCells.size === 0) return null;

    // Urutkan sel berdasarkan baris lalu kolom
    const sortedCells = Array.from(selectedCells)
        .map(key => {
            const [row, col] = key.split('-').map(Number);
            return { row, col, key };
        })
        .sort((a, b) => {
            if (a.row === b.row) return a.col - b.col;
            return a.row - b.row;
        });

    const firstCell = sortedCells[0];
    return getCellByPosition(firstCell.row, firstCell.col);
}

// ============================================
// BATCH EDITING
// ============================================
function applyToSelectedCells(sourceInput) {
    if (!sourceInput || selectedCells.size <= 1) return;

    const value = sourceInput.value;
    const inputType = sourceInput.tagName;

    // Skip jika ini dari batch update
    if (sourceInput._applyingBatch) return;

    selectedCells.forEach(cellKey => {
        const [row, col] = cellKey.split('-').map(Number);
        const td = getCellByPosition(row, col);

        if (td) {
            const targetInput = td.querySelector('input, select');
            if (targetInput && targetInput.tagName === inputType && targetInput !== sourceInput) {
                if (targetInput.value !== value) {
                    targetInput.value = value;

                    if (targetInput.tagName === 'SELECT') {
                        targetInput.dispatchEvent(new Event('change', { bubbles: true }));
                    } else {
                        const inputEvent = new Event('input', { bubbles: true });
                        targetInput.dispatchEvent(inputEvent);
                    }
                }
            }
        }
    });
}
// ============================================
// COLUMN INFO
// ============================================
function updateColumnInfo(td) {
    const columnName = td.getAttribute('data-column-name') || '-';
    const lsl = td.getAttribute('data-lsl') || '-';
    const usl = td.getAttribute('data-usl') || '-';
    const unit = td.getAttribute('data-unit') || '';

    let lslDisplay = '-';
    let uslDisplay = '-';

    if (lsl !== '-' && lsl !== '') {
        lslDisplay = unit ? `${lsl} ${unit}` : lsl;
    }

    if (usl !== '-' && usl !== '') {
        uslDisplay = unit ? `${usl} ${unit}` : usl;
    }

    document.getElementById('columnName').textContent = columnName;
    document.getElementById('columnLSL').textContent = lslDisplay;
    document.getElementById('columnUSL').textContent = uslDisplay;
}

function updateColumnInfoFromHeader(th) {
    const columnName = th.textContent.trim();
    const lsl = th.getAttribute('data-lsl') || '-';
    const usl = th.getAttribute('data-usl') || '-';
    const unit = th.getAttribute('data-unit') || '';

    let lslDisplay = '-';
    let uslDisplay = '-';

    if (lsl !== '-' && lsl !== '') {
        lslDisplay = unit ? `${lsl} ${unit}` : lsl;
    }

    if (usl !== '-' && usl !== '') {
        uslDisplay = unit ? `${usl} ${unit}` : usl;
    }

    document.getElementById('columnName').textContent = columnName;
    document.getElementById('columnLSL').textContent = lslDisplay;
    document.getElementById('columnUSL').textContent = uslDisplay;
}

// ============================================
// SELECTION INFO DISPLAY
// ============================================
function updateSelectionInfo(message) {
    const infoElement = document.getElementById('selectionInfo');
    const clearBtn = document.getElementById('btnClearSelection');

    if (message) {
        infoElement.textContent = message;
    } else {
        const cellCount = selectedCells.size;
        if (cellCount === 0) {
            infoElement.textContent = "No cells selected";
            if (clearBtn) clearBtn.style.display = 'none';
        } else {
            infoElement.textContent = `${cellCount} cell${cellCount !== 1 ? 's' : ''} selected`;
            if (clearBtn) clearBtn.style.display = 'inline-flex';
        }
    }
}

// ============================================
// MODAL CLOSE EVENTS SETUP
// ============================================
function setupModalCloseEvents() {
    const modals = ['modalError', 'modalSuccess', 'modalConfirm', 'modalAfterSubmit', 'modalNavigationWarning'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.addEventListener("click", function (e) {
                if (e.target === this) {
                    if (modalId === 'modalError') closeErrorModal(e);
                    else if (modalId === 'modalSuccess') closeSuccessModal(e);
                    else if (modalId === 'modalConfirm') closeConfirmModal(e);
                    else if (modalId === 'modalNavigationWarning') {
                        modal.classList.remove("active");
                        navigationWarningActive = false;
                        navigationTarget = null;
                    }
                }
            });
        }
    });

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
        input.disabled = true;
        input.placeholder = "Tidak ada produk tersedia";
        return;
    }

    input.disabled = false;
    input.placeholder = "Ketik atau pilih produk";

    const productNames = [...new Set(allProducts.map((p) => p.product_name))].sort();

    initializeCustomDropdown(
        'selectProduct',
        'productDropdown',
        productNames,
        function (selectedValue) {
            console.log("Produk dipilih:", selectedValue);
            onProductSelect(selectedValue);
        },
        true
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
        input.disabled = true;
        input.placeholder = "Tidak ada device tersedia";
        return;
    }

    input.disabled = false;
    input.placeholder = "Ketik atau pilih device";

    const seriesOptions = [];

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

        seriesOptions.push({
            display: seriesDisplay,
            productId: product.id,
            productData: product
        });
    });

    const seriesDisplayList = seriesOptions.map(opt => opt.display);

    initializeCustomDropdown(
        'selectSeries',
        'seriesDropdown',
        seriesDisplayList,
        function (selectedValue) {
            const matchingOption = seriesOptions.find(opt => opt.display === selectedValue);
            if (matchingOption) {
                const productData = matchingOption.productData;
                selectedProduct = {
                    id: productData.id,
                    name: productData.product_name,
                    series_number: productData.series_number,
                    series: productData.series,
                };

                console.log("Device dipilih:", selectedProduct);
                input.classList.remove('invalid');
                loadProductTestTypes(productData.id);
            } else {
                input.classList.add('invalid');
                console.error("Device tidak ditemukan:", selectedValue);
                selectedProduct = null;
            }
        },
        false
    );

    console.log("Dropdown device diisi dengan", productSeries.length, "opsi");
}

function initializeCustomDropdown(inputId, dropdownId, options, onSelectCallback, isProductDropdown = false) {
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);

    if (!input || !dropdown) return;

    let selectedIndex = -1;
    let lastValidValue = '';
    let isManualInput = false;

    function renderDropdown(filterText = '') {
        dropdown.innerHTML = '';
        const filter = filterText.toLowerCase();

        const filteredOptions = options.filter(option =>
            option.toLowerCase().includes(filter)
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

            if (filter && option.toLowerCase().includes(filter)) {
                const regex = new RegExp(`(${filter})`, 'gi');
                item.innerHTML = option.replace(regex, '<strong>$1</strong>');
            } else {
                item.textContent = option;
            }

            item.addEventListener('click', () => {
                input.value = option;
                dropdown.classList.remove('active');
                selectedIndex = -1;
                lastValidValue = option;
                isManualInput = false;

                dropdown.querySelectorAll('.custom-dropdown-item').forEach(item => {
                    item.classList.remove('highlighted', 'selected');
                });

                item.classList.add('selected');
                input.classList.remove('invalid');

                if (onSelectCallback) onSelectCallback(option);
            });

            dropdown.appendChild(item);
        });
    }

    input.addEventListener('focus', () => {
        dropdown.classList.add('active');
        renderDropdown('');
        selectedIndex = -1;
    });

    input.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        dropdown.classList.add('active');
        renderDropdown(value);
        selectedIndex = -1;

        const isValid = options.includes(value);
        isManualInput = true;

        if (value && !isValid) {
            input.classList.add('invalid');

            if (isProductDropdown) {
                if (value !== lastValidValue) resetSeriesAndBelow();
            } else {
                if (value !== lastValidValue) {
                    resetTestTypeAndBelow();
                    selectedProduct = null;
                }
            }
        } else {
            input.classList.remove('invalid');
            lastValidValue = value;
            if (value && isValid) isManualInput = false;
        }
    });

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
            const currentValue = input.value.trim();
            const isValid = options.includes(currentValue);
            if (!isValid && currentValue) {
                input.classList.add('invalid');
                showErrorModal("Pilihan tidak valid. Silakan pilih dari daftar.");
                e.preventDefault();
            } else if (isValid && onSelectCallback) {
                onSelectCallback(currentValue);
            }
        } else if (e.key === 'Escape') {
            dropdown.classList.remove('active');
            selectedIndex = -1;
        }
    });

    function updateHighlightedItem(items) {
        items.forEach((item, index) => {
            item.classList.remove('highlighted');
            if (index === selectedIndex) {
                item.classList.add('highlighted');
                item.scrollIntoView({ block: 'nearest' });
            }
        });
    }

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
            selectedIndex = -1;

            const currentValue = input.value.trim();

            if (currentValue) {
                if (!options.includes(currentValue)) {
                    input.classList.add('invalid');

                    if (isProductDropdown) {
                        if (isManualInput && currentValue !== lastValidValue) resetSeriesAndBelow();
                    } else {
                        if (isManualInput && currentValue !== lastValidValue) {
                            resetTestTypeAndBelow();
                            selectedProduct = null;
                        }
                    }
                } else {
                    input.classList.remove('invalid');
                }
            } else {
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

    renderDropdown('');
}

// ============================================
// PRODUCT SELECTION HANDLER
// ============================================
function onProductSelect(productName) {
    console.log("Produk dipilih:", productName);

    productSeries = [];
    selectedTestType = null;
    templateData = null;
    testParameters = [];
    headerColumnMap.clear();

    ["seriesContainer", "testTypeSection", "testInfoSection"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add("hidden");
    });

    const seriesInput = document.getElementById("selectSeries");
    if (seriesInput) {
        seriesInput.value = '';
        seriesInput.classList.remove('invalid');
    }

    document.getElementById("testTypeList").innerHTML = "";

    if (!productName) {
        console.log("Tidak ada produk yang dipilih");
        selectedProduct = null;
        return;
    }

    const productNames = [...new Set(allProducts.map((p) => p.product_name))];
    if (!productNames.includes(productName)) {
        const productInput = document.getElementById("selectProduct");
        if (productInput) productInput.classList.add('invalid');
        showErrorModal("Produk tidak valid. Silakan pilih dari daftar produk.");
        selectedProduct = null;
        return;
    }

    productSeries = allProducts.filter((p) => p.product_name === productName);
    console.log("Seri produk yang difilter:", productSeries);

    if (productSeries.length === 0) {
        showErrorModal("Tidak ada device ditemukan untuk produk ini.");
        selectedProduct = null;
        return;
    }

    populateSeriesDropdown();

    const seriesContainer = document.getElementById("seriesContainer");
    if (seriesContainer) seriesContainer.classList.remove("hidden");
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
    try {
        console.log("Menyiapkan event listeners...");

        const inputSerialNumber = document.getElementById("inputSerialNumber");
        const inputQty = document.getElementById("inputQty");
        const btnStartTesting = document.getElementById("btnStartTesting");
        const btnCancelTest = document.getElementById("btnCancelTest");
        const btnSubmitTest = document.getElementById("btnSubmitTest");

        if (inputSerialNumber) inputSerialNumber.addEventListener("input", updateSerialRangeDisplay);
        if (inputQty) inputQty.addEventListener("input", updateSerialRangeDisplay);
        if (btnStartTesting) btnStartTesting.addEventListener("click", startTesting);
        if (btnCancelTest) btnCancelTest.addEventListener("click", confirmCancelTest);
        if (btnSubmitTest) btnSubmitTest.addEventListener("click", submitTestResults);

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                closeErrorModal();
                closeSuccessModal();
                closeConfirmModal();

                const navModal = document.getElementById("modalNavigationWarning");
                if (navModal && navModal.classList.contains("active")) {
                    navModal.classList.remove("active");
                    navigationWarningActive = false;
                    navigationTarget = null;
                }
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

    if (!testTypeList || !testTypeSection) return;

    if (testTypes.length === 0) {
        testTypeList.innerHTML = '<p class="col-span-3 text-center text-gray-500 text-sm">Tidak ada tipe test tersedia untuk produk ini</p>';
        testTypeSection.classList.remove("hidden");
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
            e.stopPropagation();
            selectTestType(testType);
        };
        testTypeList.appendChild(button);
    });

    testTypeSection.classList.remove("hidden");
    console.log("Tombol tipe test dirender:", testTypes.length);
}

// ============================================
// TEST TYPE SELECTION
// ============================================
async function selectTestType(testType) {
    if (!selectedProduct || !selectedProduct.id) {
        showErrorModal("Silakan pilih produk dan device terlebih dahulu sebelum memilih tipe test.");
        return;
    }

    selectedTestType = {
        id: testType.id,
        name: testType.name,
        sequence: testType.sequence_order,
    };
    console.log("Tipe test dipilih:", selectedTestType);

    document.querySelectorAll("#testTypeList button").forEach((btn) => {
        btn.classList.remove("selected");
    });

    const button = document.querySelector(`#testTypeList button[data-test-type-id="${testType.id}"]`);
    if (button) button.classList.add("selected");

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
        console.log(`Memuat parameter test untuk produk ${selectedProduct.id}, test ${selectedTestType.id}`);
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
// LOAD TEMPLATE
// ============================================
async function loadTemplate() {
    try {
        console.log(`Memuat template untuk produk:`, selectedProduct);

        if (!selectedProduct || !selectedProduct.id) {
            showErrorModal("Produk tidak valid. Silakan pilih produk dan device kembali.");
            templateData = null;
            return;
        }

        if (!selectedTestType || !selectedTestType.id) {
            showErrorModal("Tipe test tidak valid. Silakan pilih tipe test kembali.");
            templateData = null;
            return;
        }

        console.log(`Memuat template untuk produk ${selectedProduct.id} dan test type ${selectedTestType.id}`);
        const result = await window.electronAPI.getTemplatesByProduct(selectedProduct.id);

        if (result.success) {
            const templates = result.data;
            console.log("Template tersedia:", templates);

            const template = templates.find((t) => t.test_type_id === selectedTestType.id);

            if (template) {
                templateData = template;
                console.log("Template berhasil dimuat:", templateData.template_name);
                displayTestParameters();
            } else {
                console.warn("Tidak ada template ditemukan untuk produk dan tipe test ini");
                showErrorModal("Tidak ada template ditemukan untuk produk dan tipe test ini. Silakan buat template terlebih dahulu di halaman Generate.");
                templateData = null;

                const testInfoSection = document.getElementById("testInfoSection");
                if (testInfoSection) testInfoSection.classList.add("hidden");
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
    if (!container) return;

    if (testParameters.length === 0) {
        container.innerHTML = '<p class="text-[11px] text-gray-600">Tidak ada parameter test yang ditentukan untuk tipe test ini</p>';
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
// START TESTING
// ============================================
function startTesting() {
    console.log("Memulai testing...");

    if (!selectedProduct || !selectedProduct.id) {
        showErrorModal("Silakan pilih device terlebih dahulu sebelum memulai testing.");
        return;
    }

    const testerName = document.getElementById("inputTesterName")?.value.trim();
    const testDate = document.getElementById("inputTestDate")?.value;
    const poNumber = document.getElementById("inputPONumber")?.value.trim();
    const lotNumber = document.getElementById("inputLotNumber")?.value.trim();
    const serialNumber = document.getElementById("inputSerialNumber")?.value.trim();
    const qtyInput = document.getElementById("inputQty");
    const qty = qtyInput ? parseInt(qtyInput.value) : 0;

    const productInput = document.getElementById("selectProduct");
    const seriesInput = document.getElementById("selectSeries");

    if (!productInput || !seriesInput) {
        showErrorModal("Elemen input tidak ditemukan");
        return;
    }

    const productName = productInput.value.trim();
    const seriesDisplay = seriesInput.value.trim();

    console.log("Data validasi:", {
        testerName, testDate, poNumber, lotNumber, serialNumber, qty, productName, seriesDisplay
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

    const productNames = [...new Set(allProducts.map((p) => p.product_name))];
    if (!productName || !productNames.includes(productName)) {
        productInput.classList.add('invalid');
        showErrorModal("Produk tidak valid. Silakan pilih dari daftar produk.");
        return;
    }

    const matchingSeries = productSeries.find(p => {
        let display = "";
        if (p.series_number && p.series) {
            display = `${p.series} - ${p.series_number}`;
        } else if (p.series_number) {
            display = p.series_number;
        } else if (p.series) {
            display = p.series;
        }
        return display === seriesDisplay;
    });

    if (!matchingSeries) {
        seriesInput.classList.add('invalid');
        showErrorModal("Device tidak valid. Silakan pilih dari daftar device.");
        return;
    }

    if (!selectedTestType) {
        showErrorModal("Silakan pilih tipe test terlebih dahulu.");
        return;
    }

    testInformation = {
        testerName,
        testDate,
        poNumber,
        lotNumber: lotNumber || "",
        multimeterSN: document.getElementById("inputMultimeterSN")?.value.trim() || "",
        oscilloscopeSN: document.getElementById("inputOscilloscopeSN")?.value.trim() || "",
        startingSerial: parseInt(serialNumber) || 0,
        qty,
        productName: `${matchingSeries.product_name} - ${matchingSeries.series_number || matchingSeries.series || ""}`,
        testTypeName: selectedTestType.name,
    };

    selectedProduct = {
        id: matchingSeries.id,
        name: matchingSeries.product_name,
        series_number: matchingSeries.series_number,
        series: matchingSeries.series,
    };

    console.log("Informasi test disimpan:", testInformation);

    document.getElementById("setupSection").classList.add("hidden");
    document.getElementById("testingSection").classList.remove("hidden");
    testingInProgress = true;

    // Initialize navigation lock
    initNavigationLock();

    displayTestInformation();
    displayTestParameters();
    generateTestingTable();

    setTimeout(() => {
        initSelectionFeatures();
    }, 100);

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

    for (const [key, element] of Object.entries(elements)) {
        if (!element) {
            console.error(`Elemen display${key} tidak ditemukan`);
            return;
        }
    }

    let productDisplay = "";
    if (selectedProduct.series && selectedProduct.series_number) {
        productDisplay = `${selectedProduct.series} - ${selectedProduct.series_number}`;
    } else if (selectedProduct.series) {
        productDisplay = selectedProduct.series;
    } else if (selectedProduct.series_number) {
        productDisplay = selectedProduct.series_number;
    } else {
        productDisplay = selectedProduct.name;
    }

    elements.product.textContent = productDisplay;
    elements.testType.textContent = testInformation.testTypeName;
    elements.tester.textContent = testInformation.testerName;
    elements.date.textContent = testInformation.testDate;

    if (testInformation.lotNumber && testInformation.lotNumber.trim() !== "") {
        elements.po.textContent = `${testInformation.poNumber} - ${testInformation.lotNumber}`;
    } else {
        elements.po.textContent = testInformation.poNumber;
    }

    const endSerial = testInformation.startingSerial + testInformation.qty - 1;
    elements.serial.textContent = `${testInformation.startingSerial} - ${endSerial}`;
    elements.qty.textContent = testInformation.qty;
}

// ============================================
// GENERATE TESTING TABLE
// ============================================
function generateTestingTable() {
    if (!templateData || !templateData.custom_columns) {
        showErrorModal("Data template tidak valid");
        return;
    }

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

    thead.innerHTML = "";
    tbody.innerHTML = "";
    tableRows = [];
    headerColumnMap.clear();

    const headerRow1 = document.createElement("tr");
    const headerRow2 = document.createElement("tr");
    let hasSubColumns = false;

    const defaultHeaders = [
        { name: "NO", rowspan: 2 },
        { name: "SERIAL NO.", rowspan: 2 }
    ];

    defaultHeaders.forEach((header) => {
        const th = document.createElement("th");
        th.rowSpan = header.rowspan;
        th.textContent = header.name;
        headerRow1.appendChild(th);
    });

    let globalColumnIndex = 2;

    customColumns.forEach((col, index) => {
        const fullName = col.name || "";

        if (col.isSplit && col.sub && col.sub.length > 0) {
            hasSubColumns = true;
            const th = document.createElement("th");
            th.colSpan = col.sub.length;
            th.textContent = fullName;
            th.setAttribute("data-global-start", globalColumnIndex);
            th.setAttribute("data-colspan", col.sub.length);
            headerRow1.appendChild(th);

            col.sub.forEach((subCol, subIndex) => {
                const subTh = document.createElement("th");
                subTh.className = "sub-header";
                subTh.textContent = subCol.name || "";

                subTh.setAttribute("data-lsl", subCol.lsl || "");
                subTh.setAttribute("data-usl", subCol.usl || "");
                subTh.setAttribute("data-unit", subCol.unit || "");
                subTh.setAttribute("data-global-index", globalColumnIndex);
                subTh.setAttribute("data-column-name", subCol.name || "");

                headerColumnMap.set(globalColumnIndex, {
                    element: subTh,
                    type: 'sub',
                    colspan: 1,
                    rowspan: 1
                });

                headerRow2.appendChild(subTh);
                globalColumnIndex++;
            });
        } else {
            const th = document.createElement("th");
            th.rowSpan = 2;
            th.textContent = fullName;

            th.setAttribute("data-lsl", col.lsl || "");
            th.setAttribute("data-usl", col.usl || "");
            th.setAttribute("data-unit", col.unit || "");
            th.setAttribute("data-global-index", globalColumnIndex);
            th.setAttribute("data-column-name", fullName || "");

            headerColumnMap.set(globalColumnIndex, {
                element: th,
                type: 'main',
                colspan: 1,
                rowspan: 2
            });

            headerRow1.appendChild(th);
            globalColumnIndex++;
        }
    });

    const statusTh = document.createElement("th");
    statusTh.rowSpan = 2;
    statusTh.textContent = "STATUS";
    statusTh.setAttribute("data-global-index", globalColumnIndex);
    headerColumnMap.set(globalColumnIndex, {
        element: statusTh,
        type: 'main',
        colspan: 1,
        rowspan: 2
    });
    headerRow1.appendChild(statusTh);
    globalColumnIndex++;

    const remarksTh = document.createElement("th");
    remarksTh.rowSpan = 2;
    remarksTh.textContent = "REMARKS";
    remarksTh.setAttribute("data-global-index", globalColumnIndex);
    headerColumnMap.set(globalColumnIndex, {
        element: remarksTh,
        type: 'main',
        colspan: 1,
        rowspan: 2
    });
    headerRow1.appendChild(remarksTh);
    globalColumnIndex++;

    thead.appendChild(headerRow1);
    if (hasSubColumns) thead.appendChild(headerRow2);

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

    const tdNo = document.createElement("td");
    tdNo.textContent = rowNumber;
    tdNo.className = "font-semibold text-gray-700 text-center";
    tr.appendChild(tdNo);

    const tdSerial = document.createElement("td");
    tdSerial.textContent = currentSerial;
    tdSerial.className = "font-semibold text-gray-800 text-center";
    tdSerial.setAttribute("data-serial", currentSerial);
    tr.appendChild(tdSerial);

    let globalColumnIndex = 2;

    columns.forEach((col, colIndex) => {
        if (col.isSplit && col.sub && col.sub.length > 0) {
            col.sub.forEach((subCol, subIndex) => {
                const td = document.createElement("td");
                td.setAttribute("data-global-index", globalColumnIndex);

                td.setAttribute('data-column-name', subCol.name || `Sub-${subIndex + 1}`);
                td.setAttribute('data-lsl', subCol.lsl || '');
                td.setAttribute('data-usl', subCol.usl || '');
                td.setAttribute('data-unit', subCol.unit || '');

                if (subCol.validationType === "pass_fail") {
                    const select = document.createElement("select");
                    select.className = "w-full border border-gray-300 rounded px-2 py-1 text-sm";
                    select.innerHTML = `
                        <option value="">--</option>
                        <option value="Pass">Pass</option>
                        <option value="Fail">Fail</option>
                    `;
                    select.setAttribute("data-col-id", `${colIndex}_${subIndex}`);
                    select.setAttribute("data-validation", subCol.validationType || "");
                    select.setAttribute("data-expected", subCol.expectedValue || "Pass");
                    select.addEventListener("change", () => {
                        validateInput(select, tr);
                        updateDropdownColor(select);
                    });
                    td.appendChild(select);
                } else {
                    const input = document.createElement("input");
                    input.type = "number";
                    input.step = "any";
                    input.className = "w-full border border-gray-300 rounded px-2 py-1 text-sm no-spinner";
                    input.setAttribute("data-col-id", `${colIndex}_${subIndex}`);
                    input.setAttribute("data-validation", subCol.validationType || "");
                    input.setAttribute("data-lsl", subCol.lsl || "");
                    input.setAttribute("data-usl", subCol.usl || "");
                    input.addEventListener("input", () => validateInput(input, tr));
                    td.appendChild(input);
                }

                tr.appendChild(td);
                globalColumnIndex++;
            });
        } else {
            const td = document.createElement("td");
            td.setAttribute("data-global-index", globalColumnIndex);

            td.setAttribute('data-column-name', col.name || "");
            td.setAttribute('data-lsl', col.lsl || "");
            td.setAttribute('data-usl', col.usl || "");
            td.setAttribute('data-unit', col.unit || "");

            if (col.validationType === "pass_fail") {
                const select = document.createElement("select");
                select.className = "w-full border border-gray-300 rounded px-2 py-1 text-sm";
                select.innerHTML = `
                    <option value="">--</option>
                    <option value="Pass">Pass</option>
                    <option value="Fail">Fail</option>
                `;
                select.setAttribute("data-col-id", colIndex);
                select.setAttribute("data-validation", col.validationType || "");
                select.setAttribute("data-expected", col.expectedValue || "Pass");
                select.addEventListener("change", () => {
                    validateInput(select, tr);
                    updateDropdownColor(select);
                });
                td.appendChild(select);
            } else {
                const input = document.createElement("input");
                input.type = "number";
                input.step = "any";
                input.className = "w-full border border-gray-300 rounded px-2 py-1 text-sm no-spinner";
                input.setAttribute("data-col-id", colIndex);
                input.setAttribute("data-validation", col.validationType || "");
                input.setAttribute("data-lsl", col.lsl || "");
                input.setAttribute("data-usl", col.usl || "");
                input.addEventListener("input", () => validateInput(input, tr));
                td.appendChild(input);
            }

            tr.appendChild(td);
            globalColumnIndex++;
        }
    });

    const tdStatus = document.createElement("td");
    tdStatus.className = "status-cell text-center";
    tdStatus.setAttribute("data-global-index", globalColumnIndex);
    const statusDiv = document.createElement("div");
    statusDiv.className = "status-fail text-xs font-semibold";
    statusDiv.textContent = "FAIL";
    tdStatus.appendChild(statusDiv);
    tr.appendChild(tdStatus);
    globalColumnIndex++;

    const tdRemarks = document.createElement("td");
    tdRemarks.setAttribute("data-global-index", globalColumnIndex);
    const remarksInput = document.createElement("input");
    remarksInput.type = "text";
    remarksInput.className = "w-full border border-gray-300 rounded px-2 py-1 text-sm";
    tdRemarks.appendChild(remarksInput);
    tr.appendChild(tdRemarks);

    return tr;
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================
function updateDropdownColor(select) {
    const value = select.value.trim();
    const expectedValue = select.getAttribute("data-expected");

    select.classList.remove("valid", "invalid");

    if (!value || value === "--") return;

    if (value === expectedValue) {
        select.classList.add("valid");
    } else {
        select.classList.add("invalid");
    }
}

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

        if (lsl && numValue < parseFloat(lsl)) isValid = false;
        if (usl && numValue > parseFloat(usl)) isValid = false;

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
    const inputs = row.querySelectorAll("input[data-validation], select[data-validation]");
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
    let allComplete = true;
    const entries = [];

    tableRows.forEach((row, index) => {
        const inputs = row.querySelectorAll("input[data-validation], select[data-validation]");
        const remarksInput = row.querySelector("td:nth-last-child(1) input");
        const statusDiv = row.querySelector(".status-cell div");
        const serialCell = row.querySelector("td:nth-child(2)");
        const serialNumber = serialCell ? serialCell.getAttribute("data-serial") : "";

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
                usl: element.getAttribute('data-usl') || "",
                expected: element.getAttribute("data-expected") || "",
            };
        });

        entries.push(rowData);
    });

    if (!allComplete) {
        showErrorModal("Harap lengkapi semua entri test sebelum submit. Semua field harus diisi.");
        return;
    }

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
                    lotNumber: testInformation.lotNumber,
                    multimeterSN: testInformation.multimeterSN,
                    oscilloscopeSN: testInformation.oscilloscopeSN,
                    entries: entries,
                };

                console.log('📤 Data yang dikirim ke backend:', submitData);

                const result = await window.electronAPI.submitTestEntries(submitData);

                if (result.success) {
                    testingInProgress = false;
                    cleanupNavigationLock();

                    showAfterSubmitOptions(passCount, failCount);

                } else {
                    console.error('❌ Error dari backend:', result.error);
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
// MODAL AFTER SUBMIT FUNCTIONS
// ============================================
function showAfterSubmitOptions(passCount, failCount) {
    const modal = document.getElementById("modalAfterSubmit");
    const messageElement = modal.querySelector("p");

    if (messageElement) {
        messageElement.textContent = `Testing submitted successfully!\nPass: ${passCount} | Fail: ${failCount}\n\nWhat would you like to do next?`;
    }

    modal.classList.add("active");
    setupAfterSubmitModalHandlers();
}

function closeAfterSubmitModal() {
    const modal = document.getElementById("modalAfterSubmit");
    if (modal) modal.classList.remove("active");
}

function setupAfterSubmitModalHandlers() {
    const modal = document.getElementById("modalAfterSubmit");
    if (!modal) return;

    const buttons = ['btnNewPO', 'btnNewLot', 'btnNewDevice'];

    buttons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
        }
    });

    document.getElementById("btnNewPO")?.addEventListener("click", handleNewPO);
    document.getElementById("btnNewLot")?.addEventListener("click", handleNewLot);
    document.getElementById("btnNewDevice")?.addEventListener("click", handleNewDevice);
}

function handleNewPO() {
    console.log("New PO selected");
    closeAfterSubmitModal();

    document.getElementById("inputPONumber").value = "";
    document.getElementById("inputTestDate").value = new Date().toISOString().split("T")[0];
    document.getElementById("inputLotNumber").value = "";
    document.getElementById("inputSerialNumber").value = "";
    document.getElementById("inputQty").value = "1";
    document.getElementById("inputMultimeterSN").value = "";
    document.getElementById("inputOscilloscopeSN").value = "";

    updateSerialRangeDisplay();

    document.getElementById("testingSection").classList.add("hidden");
    document.getElementById("setupSection").classList.remove("hidden");
    document.getElementById("testInfoSection").classList.remove("hidden");

    setTimeout(() => {
        document.getElementById("inputPONumber").focus();
    }, 100);
}

function handleNewLot() {
    console.log("New Lot selected");
    closeAfterSubmitModal();

    document.getElementById("inputLotNumber").value = "";
    document.getElementById("inputSerialNumber").value = "";
    document.getElementById("inputQty").value = "1";
    document.getElementById("inputTestDate").value = new Date().toISOString().split("T")[0];

    updateSerialRangeDisplay();

    document.getElementById("testingSection").classList.add("hidden");
    document.getElementById("setupSection").classList.remove("hidden");
    document.getElementById("testInfoSection").classList.remove("hidden");

    setTimeout(() => {
        document.getElementById("inputLotNumber").focus();
    }, 100);
}

function handleNewDevice() {
    console.log("New Device selected");
    closeAfterSubmitModal();

    resetTestingData();

    setTimeout(() => {
        document.getElementById("selectSeries").focus();
    }, 100);
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
            resetTestingData();
        }
    );
}

// ============================================
// GLOBAL FUNCTIONS
// ============================================
window.incrementQty = incrementQty;
window.decrementQty = decrementQty;
window.closeErrorModal = closeErrorModal;
window.closeSuccessModal = closeSuccessModal;
window.closeConfirmModal = closeConfirmModal;

console.log("Testing.js berhasil dimuat - Semua fungsi terekspos ke window");