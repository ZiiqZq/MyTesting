// dashboard.js - JavaScript untuk halaman Dashboard (Updated with SPA Navigation)

// ===========================================
// == 1. LOAD SIDEBAR SAAT HALAMAN LOAD ==
// ===========================================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM Content Loaded');
  
  // Load Sidebar dengan SPA Navigation Support
  if (typeof SidebarLoader !== 'undefined') {
    await SidebarLoader.load('sidebar-container', 'dashboard');
    
    // Listen for page changes from main process
    if (window.electronAPI && window.electronAPI.onPageLoaded) {
      window.electronAPI.onPageLoaded((pageName) => {
        console.log('Page changed to:', pageName);
        SidebarLoader.setActivePage(pageName);
      });
    }
  } else {
    console.error('SidebarLoader not found! Make sure sidebar-loader.js is loaded.');
  }

  // Inisialisasi dashboard
  initDashboard();
});

// ===================================
// == 2. INISIALISASI DASHBOARD ==
// ===================================
function initDashboard() {
  console.log('Dashboard initialized');

  // Setup button event listeners
  setupButtonListeners();

  // Setup database connection feedback
  setupDatabaseListeners();

  // Load dashboard data
  loadDashboardData();
}

// =======================================
// == 3. BUTTON EVENT LISTENERS (ELECTRON) ==
// =======================================
function setupButtonListeners() {
  const buttonFirst = document.getElementById("First");
  const buttonFinal = document.getElementById("Final");
  const buttonSpec = document.getElementById("Spec");
  const buttonAdmin = document.getElementById("Admin");

  if (buttonFirst) {
    buttonFirst.addEventListener("click", () => {
      console.log('First button clicked');
      if (window.electronAPI) {
        window.electronAPI.First("Masuk ke First-Test");
      } else {
        console.error('electronAPI not available');
      }
    });
  }

  if (buttonFinal) {
    buttonFinal.addEventListener("click", () => {
      console.log('Final button clicked');
      if (window.electronAPI) {
        window.electronAPI.Final("Masuk ke Final-Test");
      } else {
        console.error('electronAPI not available');
      }
    });
  }

  if (buttonSpec) {
    buttonSpec.addEventListener("click", () => {
      console.log('Spec button clicked');
      if (window.electronAPI) {
        window.electronAPI.Spec("Masuk ke Spectro-Test");
      } else {
        console.error('electronAPI not available');
      }
    });
  }

  if (buttonAdmin) {
    buttonAdmin.addEventListener("click", () => {
      console.log('Admin button clicked');
      if (window.electronAPI) {
        window.electronAPI.Admin("Masuk ke Halaman Admin");
      } else {
        console.error('electronAPI not available');
      }
    });
  }
}

// ================================================
// == 4. DATABASE CONNECTION FEEDBACK (ELECTRON) ==
// ================================================
function setupDatabaseListeners() {
  // Cek apakah electronAPI tersedia
  if (!window.electronAPI) {
    console.warn('electronAPI not available, skipping database listeners');
    return;
  }

  // Kalau koneksi database gagal
  window.electronAPI.onDBError((error) => {
    console.error('Database Error:', error);
    showNotification(`❌ Gagal konek ke database! Error: ${error}`, 'error');
  });

  // Kalau sukses (opsional)
  window.electronAPI.onDBSuccess((msg) => {
    console.log('Database Success:', msg);
    showNotification(msg, 'success');
  });
}

// ========================================
// == 5. LOAD DASHBOARD DATA (OPTIONAL) ==
// ========================================
async function loadDashboardData() {
  try {
    console.log('Loading dashboard data...');
    
    // Contoh: Load data dari database menggunakan Electron IPC
    if (window.electronAPI && window.electronAPI.getDashboardData) {
      const data = await window.electronAPI.getDashboardData();
      updateDashboard(data);
    } else {
      // Mock data untuk testing (jika API belum ada)
      console.log('Using mock dashboard data');
      // updateDashboard(mockData);
    }
    
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    showNotification('Error loading dashboard data', 'error');
  }
}

// Contoh fungsi untuk update dashboard dengan data
function updateDashboard(data) {
  console.log('Updating dashboard with data:', data);
  // Implementasi update UI dengan data
  // Contoh:
  // document.querySelector('.total-users').textContent = data.totalUsers;
  // document.querySelector('.revenue').textContent = formatCurrency(data.revenue);
}

// ==============================
// == 6. UTILITY FUNCTIONS ==
// ==============================
function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
}

function formatDate(date) {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date));
}

function formatNumber(number) {
  return new Intl.NumberFormat('id-ID').format(number);
}

// =======================================
// == 7. NOTIFICATION HELPER (ENHANCED) ==
// =======================================
function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll('.dashboard-notification');
  existingNotifications.forEach(n => n.remove());

  const notification = document.createElement('div');
  notification.className = `dashboard-notification fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg ${
    type === 'success' ? 'bg-green-500' : 
    type === 'error' ? 'bg-red-500' : 
    type === 'warning' ? 'bg-yellow-500' :
    'bg-blue-500'
  } text-white z-50 transition-all duration-300 opacity-100`;
  
  // Add icon based on type
  const icon = type === 'success' ? '✓' : 
               type === 'error' ? '✗' : 
               type === 'warning' ? '⚠' : 'ℹ';
  
  notification.innerHTML = `
    <div class="flex items-center gap-2">
      <span class="text-lg font-bold">${icon}</span>
      <span>${message}</span>
    </div>
  `;

  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 10);

  // Fade out and remove
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  }, 3000);
}

// =======================================
// == 8. REFRESH DASHBOARD DATA ==
// =======================================
function refreshDashboard() {
  console.log('Refreshing dashboard...');
  showNotification('Refreshing dashboard data...', 'info');
  loadDashboardData();
}

// =======================================
// == 9. EXPORT FUNCTIONS (OPTIONAL) ==
// =======================================
// Untuk digunakan dari console atau script lain
window.dashboardUtils = {
  refresh: refreshDashboard,
  showNotification,
  formatCurrency,
  formatDate,
  formatNumber
};

console.log('Dashboard script loaded and initialized');