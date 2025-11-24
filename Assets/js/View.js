document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM Content Loaded');
  
  // Load Sidebar dengan SPA Navigation Support
  if (typeof SidebarLoader !== 'undefined') {
    await SidebarLoader.load('sidebar-container', 'view');
    
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


});