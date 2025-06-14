let currentImageIndex = 0;
let images = [];

async function fetchImgurAlbum(albumId) {
    try {
        const apiUrl = `https://api.imgur.com/3/album/${albumId}/images`;
        
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': 'Client-ID 546c25a59c58ad7'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch album: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        images = data.data.map(image => ({
            url: image.link,
            title: image.title || '',
            description: image.description || ''
        }));
        
        if (images.length === 0) {
            throw new Error('Album exists but contains no images');
        }
        
        return images;
    } catch (error) {
        console.error('Error fetching Imgur album:', error);
        const gallery = document.getElementById('gallery');
        gallery.innerHTML = `<div class="error">Failed to load images: ${error.message}</div>`;
        return [];
    }
}

function displayImages(images) {
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = '';
    
    if (images.length === 0) {
        gallery.innerHTML = '<div class="error">No images found in the album</div>';
        return;
    }
    
    images.forEach((image, index) => {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'gallery-item';
        
        const img = document.createElement('img');
        img.src = image.url;
        img.alt = image.title || 'Artwork';
        img.loading = 'lazy';
        
        img.addEventListener('click', function() {
            currentImageIndex = index;
            openLightbox(image);
        });
        
        imgContainer.appendChild(img);
        gallery.appendChild(imgContainer);
    });
}

function openLightbox(image) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    
    // Show loading indicator
    lightboxImg.style.display = 'none';
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    spinner.innerHTML = 'Loading...';
    lightbox.appendChild(spinner);
    
    // Create caption element if it doesn't exist
    let caption = document.getElementById('lightbox-caption');
    if (!caption) {
        caption = document.createElement('div');
        caption.id = 'lightbox-caption';
        lightbox.appendChild(caption);
    }
    
    // Set caption text (title or description)
    caption.textContent = image.title || image.description || '';
    
    // Load image
    lightboxImg.onload = function() {
        lightbox.removeChild(spinner);
        lightboxImg.style.display = 'block';
        
        // Position caption 20px below the image
        // Get image dimensions and position
        const imgRect = lightboxImg.getBoundingClientRect();
        const imgBottom = imgRect.bottom;
        
        // Set caption position
        caption.style.position = 'absolute';
        caption.style.top = (imgBottom + 20) + 'px';
        caption.style.left = '50%';
        caption.style.transform = 'translateX(-50%)';
    };
    
    lightboxImg.src = image.url;
    lightbox.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function showNextImage() {
    currentImageIndex = (currentImageIndex + 1) % images.length;
    openLightbox(images[currentImageIndex]);
}

function showPrevImage() {
    currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
    openLightbox(images[currentImageIndex]);
}

// Theme switching functionality
function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return; // Exit if no toggle button
    
    // Get current theme from localStorage or default to light
    const savedTheme = localStorage.getItem('theme');
    const currentTheme = savedTheme || 'light';
    
    // Set initial theme
    document.body.setAttribute('data-theme', currentTheme);
    themeToggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
    
    // Toggle theme on button click
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        localStorage.setItem('theme', newTheme);
    });
}

// Initialize theme toggle on all pages
document.addEventListener('DOMContentLoaded', function() {
    setupThemeToggle();
    
    // Only initialize gallery if gallery element exists
    if (document.getElementById('gallery')) {
        initGallery();
    }
});

// Map of page names to album IDs
const albumIds = {
    'index': '7LLqlEz',          // Existing home gallery
    'sketchbook': '7LLqlEz', // Placeholder for sketchbook
    'concept_art': '7LLqlEz',   // Placeholder for concept art
    'animation': '7LLqlEz' , // Placeholder for animation
};

// Get current page name from URL
function getPageName() {
    const path = window.location.pathname;
    return path.substring(path.lastIndexOf('/') + 1, path.lastIndexOf('.'));
}

// Initialize the gallery
(async function initGallery() {
    const pageName = getPageName();
    const albumId = albumIds[pageName] || '7LLqlEz'; // Default to home if not found
    
    if (albumId.includes('PLACEHOLDER')) {
        const gallery = document.getElementById('gallery');
        gallery.innerHTML = `
            <div class="info">
                <h3>Gallery Coming Soon</h3>
                <p>This gallery is under construction. Check back later!</p>
            </div>
        `;
        return;
    }

    await fetchImgurAlbum(albumId);
    displayImages(images);
    
    // Set up event listeners
    document.querySelector('.close-btn').addEventListener('click', closeLightbox);
    document.querySelector('.left-arrow').addEventListener('click', function(e) {
        e.stopPropagation();
        showPrevImage();
    });
    document.querySelector('.right-arrow').addEventListener('click', function(e) {
        e.stopPropagation();
        showNextImage();
    });
    
    document.getElementById('lightbox').addEventListener('click', function(e) {
        if (e.target !== document.getElementById('lightbox-img')) {
            closeLightbox();
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === 'ArrowLeft') {
            showPrevImage();
        } else if (e.key === 'ArrowRight') {
            showNextImage();
        }
    });
    
})();
