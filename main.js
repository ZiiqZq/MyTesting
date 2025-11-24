const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

// Import koneksi dan handler DB
const { connectToDatabase } = require('./database/connection');
const { registerDatabaseHandlers } = require('./database/handler');

let win;
let db;
let currentFilePath = 'Page/Dashboard.html'; // 🎯 Track current file path

const createWindow = () => {
  win = new BrowserWindow({
    titleBarStyle: 'hiddenInset',
    autoHideMenuBar: true,
    width: 1200,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.setMinimumSize(800, 600);
  win.webContents.openDevTools();
  win.loadFile(path.join(__dirname, 'Page/Dashboard.html'));

  // 🎯 Notify renderer when page loads
  win.webContents.on('did-finish-load', () => {
    const fileName = path.basename(currentFilePath, '.html');
    const pageName = fileName.toLowerCase();
    win.webContents.send('page-loaded', pageName);
  });

  // ============================================
  // 🎯 FIXED NAVIGATION HANDLER
  // ============================================
  ipcMain.on("navigate-to", (event, pagePath) => {
    try {
      // Normalize paths for comparison (handle \ and /)
      const normalizedNewPath = pagePath.replace(/\\/g, '/');
      const normalizedCurrentPath = currentFilePath.replace(/\\/g, '/');
      
      // 🎯 Check if trying to navigate to the same file
      if (normalizedCurrentPath === normalizedNewPath) {
        console.log(`ℹ️ Already on ${pagePath}, skipping reload`);
        return; // Skip reload - no flickering!
      }
      
      // Navigate to new page
      const fullPath = path.join(__dirname, pagePath);
      console.log(`📄 Navigating from ${currentFilePath} to ${pagePath}`);
      
      // Update current path BEFORE loading
      currentFilePath = pagePath;
      
      win.loadFile(fullPath);
    } catch (error) {
      console.error('❌ Navigation error:', error);
    }
  });

  // ============================================
  // NAVIGATION HANDLERS - GUNAKAN SATU SET SAJA
  // ============================================

  ipcMain.on('First', (event, data) => {
    console.log('Navigation to First:', data);
    win.loadFile('Page/First.html');
  });

  ipcMain.on('Final', (event, data) => {
    console.log('Navigation to Final:', data);
    win.loadFile('Page/Final.html');
  });

  ipcMain.on('Spec', (event, data) => {
    console.log('Navigation to Spec:', data);
    win.loadFile('Page/Spectro.html');
  });

  ipcMain.on('Admin', (event, data) => {
    console.log('Navigation to Admin:', data);
    win.loadFile('Page/Admin.html');
  });

  ipcMain.on('Generate', (event, data) => {
    console.log('Navigation to Generate:', data);
    win.loadFile('Page/Generate.html');
  });

  ipcMain.on('DataEntry', (event, data) => {
    console.log('Navigation to DataEntry:', data);
    win.loadFile('Page/DataEntry.html');
  });

  ipcMain.on('Kembali', (event, data) => {
    console.log('Navigation back:', data);
    win.loadFile('Page/Dashboard.html');
  });

  // ============================================
  // NEW NAVIGATION HANDLER FOR ADD PRODUCT
  // ============================================
  ipcMain.on('AddProduct', (event, data) => {
    console.log('🚀 Navigation to AddProduct:', data);
    win.loadFile('Page/AddProduct.html')
      .then(() => {
        console.log('✅ AddProduct page loaded successfully');
      })
      .catch((err) => {
        console.error('❌ Error loading AddProduct page:', err);
      });
  });
};

ipcMain.on('Testing', (event, data) => {
    console.log('Navigation to Testing:', data);
    win.loadFile('Page/Testing.html')
      .then(() => {
        console.log('✅ Testing page loaded successfully');
      })
      .catch((err) => {
        console.error('❌ Error loading Testing page:', err);
      });
  });

app.whenReady().then(async () => {
  try {
    console.log('🔄 Connecting to database...');
    db = connectToDatabase();
    
    // Tunggu koneksi database siap
    await new Promise((resolve, reject) => {
      db.promise().query('SELECT 1')
        .then(() => {
          console.log('✅ Database connection verified');
          resolve();
        })
        .catch(reject);
    });
    
    // Daftarkan handlers (sudah include data entry handlers)
    console.log('📋 Registering database handlers...');
    registerDatabaseHandlers(db);
    
    // Buat window
    console.log('🚀 Creating main window...');
    createWindow();
    
    console.log('🎉 App started successfully!');
    
  } catch (error) {
    console.error('❌ Failed to start app:', error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});