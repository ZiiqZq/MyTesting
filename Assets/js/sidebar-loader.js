// sidebar-loader.js - SPA Navigation System (FIXED FOR YOUR STRUCTURE)

const SidebarLoader = {
  // Path adjusted for your Page/Components structure
  // When loading from Page/Dashboard.html, we need to go to Components/sidebar.html
  sidebarPath: './Components/sidebar.html',
  currentActivePage: 'dashboard',
  _cachedSidebarHTML: null,

  async load(containerId = 'sidebar-container', activePage = 'dashboard', customPath = null) {
    try {
      console.log('Loading sidebar...');

      this.currentActivePage = activePage;
      const path = customPath || this.sidebarPath;
      const container = document.getElementById(containerId);

      if (!container) {
        throw new Error(`Container with id "${containerId}" not found`);
      }

      // Use cached version if available
      if (this._cachedSidebarHTML) {
        container.innerHTML = this._cachedSidebarHTML;
      } else {
        console.log(`Fetching sidebar from: ${path}`);
        const response = await fetch(path);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} - Failed to load: ${path}`);
        }

        const html = await response.text();
        this._cachedSidebarHTML = html;
        container.innerHTML = html;
        console.log('Sidebar HTML loaded and cached');
      }

      // Ensure DOM updates are complete
      await new Promise(requestAnimationFrame);

      // Setup navigation listeners
      this.setupNavigationListeners();

      // Set active page
      this.setActivePage(activePage);

      console.log('✅ Sidebar loaded successfully');
    } catch (error) {
      console.error('❌ Error loading sidebar:', error);
      console.error('Attempted path:', customPath || this.sidebarPath);
    }
  },

  setupNavigationListeners() {
    const buttons = document.querySelectorAll('.sidebar-btn');
    console.log(`Setting up listeners for ${buttons.length} buttons`);
    
    buttons.forEach((button, index) => {
      const targetPage = button.getAttribute('data-page');
      console.log(`  Button ${index + 1}: ${targetPage}`);
      
      button.addEventListener('click', (e) => {
        e.preventDefault();
        
        if (targetPage) {
          console.log(`🖱️ User clicked: ${targetPage}`);
          this.navigateToPage(targetPage);
        }
      });
    });
  },

  navigateToPage(pageName) {
    // Map page names to file paths (relative to main.js root directory)
    // Based on your structure: Page/Dashboard.html
    const pageMap = {
      'dashboard': 'Page/Dashboard.html',
      'menu': 'Page/Generate.html',
      'view': 'Page/Testing.html',
      'about': 'Page/AddProduct.html',
      'dataentry': 'Page/DataEntry.html'
    };

    const pagePath = pageMap[pageName.toLowerCase()];
    
    if (!pagePath) {
      console.error(`❌ Page not found in pageMap: ${pageName}`);
      return;
    }

    // 🎯 FIX FLICKERING: Check if already on this page
    if (this.currentActivePage.toLowerCase() === pageName.toLowerCase()) {
      console.log(`ℹ️ Already on ${pageName} page, skipping navigation`);
      // Just update active state (in case it's not highlighted)
      this.setActivePage(pageName);
      return;
    }

    console.log(`📄 Navigating to: ${pageName} (${pagePath})`);

    // Check if electronAPI is available
    if (!window.electronAPI) {
      console.error('❌ electronAPI not available');
      console.error('   Make sure preload.js is loaded and contextBridge is set up');
      return;
    }

    // Check if navigateTo method exists
    if (!window.electronAPI.navigateTo) {
      console.error('❌ navigateTo method not found in electronAPI');
      console.error('   Available methods:', Object.keys(window.electronAPI));
      console.error('   Update your preload.js to include navigateTo method');
      return;
    }

    // Use Electron IPC to load new page
    try {
      console.log(`✅ Calling electronAPI.navigateTo('${pagePath}')`);
      window.electronAPI.navigateTo(pagePath);
      
      // Update active state immediately for better UX
      this.setActivePage(pageName);
    } catch (error) {
      console.error('❌ Error during navigation:', error);
    }
  },

  setActivePage(activePage) {
    const buttons = document.querySelectorAll('.sidebar-btn');
    if (!buttons.length) {
      console.warn('⚠️ No sidebar buttons found');
      return;
    }

    let activeFound = false;
    buttons.forEach(button => {
      const page = button.getAttribute('data-page');
      if (page === activePage.toLowerCase()) {
        button.classList.add('active');
        activeFound = true;
        console.log(`✅ Active state set: ${page}`);
      } else {
        button.classList.remove('active');
      }
    });

    if (!activeFound) {
      console.warn(`⚠️ No button found for page: ${activePage}`);
    }

    this.currentActivePage = activePage;
  },

  async reload(activePage = this.currentActivePage) {
    const container = document.getElementById('sidebar-container');
    if (container) {
      console.log('🔄 Reloading sidebar...');
      // Reset cache so updated version can be fetched
      this._cachedSidebarHTML = null;
      await this.load('sidebar-container', activePage);
    } else {
      console.warn('⚠️ Sidebar container not found during reload');
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SidebarLoader;
}

console.log('✅ Sidebar Loader script loaded');