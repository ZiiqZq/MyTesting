// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {

  // ============================================
  // NAVIGATION API
  // ============================================
  navigateTo: (pagePath) => ipcRenderer.send('navigate-to', pagePath),
  First: (data) => ipcRenderer.send('First', data),
  Final: (data) => ipcRenderer.send('Final', data),
  Spec: (data) => ipcRenderer.send('Spec', data),
  kembali: (data) => ipcRenderer.send('Kembali', data),
  Admin: (data) => ipcRenderer.send('Admin', data),
  Generate: (data) => ipcRenderer.send('Generate', data),
  DataEntry: (data) => ipcRenderer.send('DataEntry', data),
  AddProduct: (data) => ipcRenderer.send('AddProduct', data),
  Testing: (data) => ipcRenderer.send('Testing', data),

  // ============================================
  // USER MANAGEMENT API
  // ============================================
  getUsers: () => ipcRenderer.invoke('get-users'),

  // ============================================
  // TEMPLATE BUILDER API (EXISTING)
  // ============================================
  getProducts: () => ipcRenderer.invoke('get-products'),
  getTestTypes: () => ipcRenderer.invoke('get-test-types'),
  saveTemplate: (templateData) => ipcRenderer.invoke('save-template', templateData),
  addCustomTestType: (testTypeName) => ipcRenderer.invoke('add-custom-test-type', testTypeName),

  // ============================================
  // PRODUCT OPERATIONS (EXISTING)
  // ============================================
  saveProduct: (productData) => ipcRenderer.invoke('save-product', productData),

  // ============================================
  // NEW PRODUCT WITH SEQUENCE API
  // ============================================
  saveProductWithSequence: (productData) => ipcRenderer.invoke('save-product-with-sequence', productData),
  getProductsWithSequence: () => ipcRenderer.invoke('get-products-with-sequence'),
  getTestParameters: (data) => ipcRenderer.invoke('get-test-parameters', data),
  getProductTestTypes: (productId) => ipcRenderer.invoke('get-product-test-types', productId),
  getProductsBySeries: () => ipcRenderer.invoke('get-products-by-series'),

  // ============================================
  // DATA ENTRY API - HAPUS SATU DEFINISI
  // ============================================
  getTemplatesByProduct: (productId) => ipcRenderer.invoke('get-templates-by-product', productId),
  getCompletedTestsByProduct: (productId) => ipcRenderer.invoke('get-completed-tests-by-product', productId),
  checkPreviousTest: (data) => ipcRenderer.invoke('check-previous-test', data),
  submitTestEntries: (submitData) => ipcRenderer.invoke('submit-test-entries', submitData), // ← HANYA INI SATU
  
  // ============================================
  // RETEST API (ADMIN ONLY)
  // ============================================
  createRetestEntry: (data) => ipcRenderer.invoke('create-retest-entry', data),

  // ============================================
  // EVENT LISTENERS
  // ============================================
  onDBError: (callback) => ipcRenderer.on('db-error', (_event, message) => callback(message)),
  onDBSuccess: (callback) => ipcRenderer.on('db-success', (_event, message) => callback(message)),
  onPageLoaded: (callback) => ipcRenderer.on('page-loaded', (_event, pageName) => callback(pageName)),
});

console.log('🔌 Preload script loaded - electronAPI exposed with new product management APIs');