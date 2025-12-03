// sidebar-loader.js

const SidebarLoader = {
  sidebarPath: "./Components/sidebar.html",
  currentActivePage: "dashboard",
  _cachedSidebarHTML: null,

  async load(
    containerId = "sidebar-container",
    activePage = "dashboard",
    customPath = null
  ) {
    try {
      console.log("Loading sidebar...");

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
          throw new Error(
            `HTTP error! status: ${response.status} - Failed to load: ${path}`
          );
        }

        const html = await response.text();
        this._cachedSidebarHTML = html;
        container.innerHTML = html;
        console.log("Sidebar HTML loaded and cached");
      }

      // Ensure DOM updates are complete
      await new Promise(requestAnimationFrame);

      // Setup navigation listeners
      this.setupNavigationListeners();

      // Setup dropdown functionality
      this.setupDropdown();

      // Set active page
      this.setActivePage(activePage);

      console.log("✅ Sidebar loaded successfully");
    } catch (error) {
      console.error("❌ Error loading sidebar:", error);
      console.error("Attempted path:", customPath || this.sidebarPath);
    }
  },

  setupNavigationListeners() {
    const buttons = document.querySelectorAll(".sidebar-btn[data-page]");
    console.log(`Setting up listeners for ${buttons.length} buttons`);

    buttons.forEach((button, index) => {
      const targetPage = button.getAttribute("data-page");
      console.log(`  Button ${index + 1}: ${targetPage}`);

      button.addEventListener("click", (e) => {
        e.preventDefault();

        if (targetPage) {
          console.log(`🖱️ User clicked: ${targetPage}`);
          this.navigateToPage(targetPage);
        }
      });
    });
  },

setupDropdown() {
  console.log("Setting up dropdown functionality...");

  const dropdownBtn = document.getElementById("menu-dropdown-btn");
  const dropdownMenu = document.getElementById("dropdown-menu");

  if (!dropdownBtn || !dropdownMenu) {
    console.error("Dropdown elements not found:", {
      dropdownBtn: !!dropdownBtn,
      dropdownMenu: !!dropdownMenu,
    });
    return;
  }

  console.log("Dropdown elements found, setting up event listeners");

  // Hapus event listener lama untuk menghindari duplikasi
  dropdownBtn.replaceWith(dropdownBtn.cloneNode(true));
  const newDropdownBtn = document.getElementById("menu-dropdown-btn");
  
  newDropdownBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    console.log("Dropdown button clicked");

    // Toggle dropdown visibility
    const isShowing = dropdownMenu.classList.contains("show");
    
    if (isShowing) {
      dropdownMenu.classList.remove("show");
      console.log("Dropdown closed");
    } else {
      // Tutup semua dropdown lain yang mungkin terbuka
      document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
        if (menu !== dropdownMenu) menu.classList.remove('show');
      });
      
      dropdownMenu.classList.add("show");
      console.log("Dropdown opened");
    }
  });

  // Close dropdown when clicking outside - IMPROVED
  document.addEventListener("click", function (e) {
    if (dropdownMenu.classList.contains("show") && 
        !dropdownMenu.contains(e.target) && 
        !newDropdownBtn.contains(e.target)) {
      dropdownMenu.classList.remove("show");
      console.log("Dropdown closed by outside click");
    }
  });

  // Close dropdown with Escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && dropdownMenu.classList.contains("show")) {
      dropdownMenu.classList.remove("show");
      newDropdownBtn.focus();
      console.log("Dropdown closed with Escape key");
    }
  });

  // Handle dropdown item clicks
  const dropdownItems = document.querySelectorAll(".dropdown-item");
  dropdownItems.forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      const targetPage = this.getAttribute("data-page");
      console.log("Dropdown item clicked:", targetPage);

      // Close dropdown
      dropdownMenu.classList.remove("show");

      // Navigate to the selected page
      if (targetPage) {
        console.log('Calling navigateToPage with:', targetPage);
        SidebarLoader.navigateToPage(targetPage);
      }
    });
  });

  console.log("Dropdown functionality setup complete");
},

  navigateToPage(pageName) {
    // Map page names to file paths (relative to main.js root directory)
    const pageMap = {
      dashboard: "Page/Dashboard.html",
      view: "Page/View.html",
      about: "Page/Testing.html",
      dataentry: "Page/DataEntry.html",
      generate: "Page/Generate.html",
      testing: "Page/Testing.html",
      addproduct: "Page/AddProduct.html",
      settings: "Page/Settings.html"
    };

    const pagePath = pageMap[pageName.toLowerCase()];

    if (!pagePath) {
      console.error(`❌ Page not found in pageMap: ${pageName}`);
      return;
    }

    // Check if already on this page
    if (this.currentActivePage.toLowerCase() === pageName.toLowerCase()) {
      console.log(`ℹ️ Already on ${pageName} page, skipping navigation`);
      this.setActivePage(pageName);
      return;
    }

    console.log(`📄 Navigating to: ${pageName} (${pagePath})`);

    // Check if electronAPI is available
    if (!window.electronAPI) {
      console.error("❌ electronAPI not available");
      console.error(
        "   Make sure preload.js is loaded and contextBridge is set up"
      );
      return;
    }

    // Check if navigateTo method exists
    if (!window.electronAPI.navigateTo) {
      console.error("❌ navigateTo method not found in electronAPI");
      console.error("   Available methods:", Object.keys(window.electronAPI));
      console.error("   Update your preload.js to include navigateTo method");
      return;
    }

    // Use Electron IPC to load new page
    try {
      console.log(`✅ Calling electronAPI.navigateTo('${pagePath}')`);
      window.electronAPI.navigateTo(pagePath);

      // Update active state immediately for better UX
      this.setActivePage(pageName);
    } catch (error) {
      console.error("❌ Error during navigation:", error);
    }
  },

  setActivePage(activePage) {
    // Get all sidebar buttons with data-page attribute
    const buttons = document.querySelectorAll(".sidebar-btn[data-page]");
    // Get the menu dropdown button (doesn't have data-page)
    const menuButton = document.querySelector('.menu-dropdown-btn');
    
    // Remove active class from all buttons first
    buttons.forEach(button => {
      button.classList.remove("active");
    });
    
    if (menuButton) {
      menuButton.classList.remove("active");
    }

    let activeFound = false;

    // Define which pages should highlight the menu button
    const menuPages = ['generate', 'dataentry', 'addproduct', 'testing', 'settings'];
    
    // Check if this is a menu page
    if (menuPages.includes(activePage.toLowerCase())) {
      if (menuButton) {
        menuButton.classList.add("active");
        activeFound = true;
        console.log(`Menu button activated for: ${activePage}`);
      }
    } else {
      // Look for regular sidebar buttons
      buttons.forEach((button) => {
        const page = button.getAttribute("data-page");
        if (page === activePage.toLowerCase()) {
          button.classList.add("active");
          activeFound = true;
          console.log(`Active state set: ${page}`);
        }
      });
    }

    if (!activeFound) {
      console.warn(`No button found for page: ${activePage}`);
    }

    this.currentActivePage = activePage;
  },

  async reload(activePage = this.currentActivePage) {
    const container = document.getElementById("sidebar-container");
    if (container) {
      console.log("🔄 Reloading sidebar...");
      // Reset cache so updated version can be fetched
      this._cachedSidebarHTML = null;
      await this.load("sidebar-container", activePage);
    } else {
      console.warn("Sidebar container not found during reload");
    }
  },
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = SidebarLoader;
}

console.log("✅ Sidebar Loader script loaded");