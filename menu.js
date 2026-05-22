document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const closeSidebarBtn = document.getElementById('close-sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    
    // Exit early if sidebar elements don't exist
    if (!menuToggle || !sidebar) return;
    
    // Function to save sidebar state
    function saveSidebarState(isOpen) {
        try {
            localStorage.setItem('sidebarState', isOpen ? 'open' : 'closed');
        } catch (e) {
            console.warn('LocalStorage not available');
        }
    }
    
    // Function to open sidebar
    function openSidebar() {
        sidebar.classList.add('active');
        if (sidebarOverlay) sidebarOverlay.classList.add('active');
        menuToggle.classList.add('active');
        saveSidebarState(true);
    }
    
    // Function to close sidebar
    function closeSidebarFn() {
        sidebar.classList.remove('active');
        if (sidebarOverlay) sidebarOverlay.classList.remove('active');
        menuToggle.classList.remove('active');
        saveSidebarState(false);
    }
    
    // Check saved state on load
    try {
        const savedState = localStorage.getItem('sidebarState');
        if (savedState === 'open') {
            openSidebar();
        }
    } catch (e) {
        console.warn('LocalStorage not available');
    }
    
    // Toggle sidebar
    menuToggle.addEventListener('click', function() {
        if (sidebar.classList.contains('active')) {
            closeSidebarFn();
        } else {
            openSidebar();
        }
    });
    
    // Close sidebar button
    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener('click', closeSidebarFn);
    }
    
    // Close on overlay click
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebarFn);
    }
    
    // Close on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebar.classList.contains('active')) {
            closeSidebarFn();
        }
    });
    
    // Add smooth scroll and prevent closing on navigation
    const navLinks = document.querySelectorAll('#sidebar a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Only prevent default for same-page anchors
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
            // Save state as open since we're navigating
            saveSidebarState(true);
        });
    });
});
