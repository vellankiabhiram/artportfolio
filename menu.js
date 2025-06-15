document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const closeSidebar = document.getElementById('close-sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    
    // Function to save sidebar state
    function saveSidebarState(isOpen) {
        localStorage.setItem('sidebarState', isOpen ? 'open' : 'closed');
    }
    
    // Function to open sidebar
    function openSidebar() {
        sidebar.classList.add('active');
        sidebarOverlay.classList.add('active');
        menuToggle.classList.add('active');
        saveSidebarState(true);
    }
    
    // Function to close sidebar
    function closeSidebarFn() {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        menuToggle.classList.remove('active');
        saveSidebarState(false);
    }
    
    // Check saved state on load
    const savedState = localStorage.getItem('sidebarState');
    if (savedState === 'open') {
        openSidebar();
    }
    
    // Toggle sidebar
    menuToggle.addEventListener('click', function() {
        if (sidebar.classList.contains('active')) {
            closeSidebarFn();
        } else {
            openSidebar();
        }
    });
    
    // Close sidebar
    closeSidebar.addEventListener('click', closeSidebarFn);
    sidebarOverlay.addEventListener('click', closeSidebarFn);
    
    // Close on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebar.classList.contains('active')) {
            closeSidebarFn();
        }
    });
    
    // Update active nav link
    function setActiveNavLink() {
        const currentPath = window.location.pathname.split('/').pop();
        const navLinks = document.querySelectorAll('#sidebar a');
        navLinks.forEach(link => {
            if (link.getAttribute('href') === currentPath) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
    
    // Add click event to nav links (only prevent default for same-page anchors)
    const navLinks = document.querySelectorAll('#sidebar a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Only prevent default for same-page anchors
            const href = this.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
            // Do NOT close sidebar after navigation
            // But save state as open since we're staying on same page
            saveSidebarState(true);
        });
    });
    
    // Initialize
    setActiveNavLink();
});
