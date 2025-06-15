let currentImageIndex = 0;
let images = [];

async function fetchImgurAlbum(albumId) {
    try {
        const apiUrl = `https://api.imgur.com/3/album/${albumId}/images`;
        console.log(`Fetching Imgur album: ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': 'Client-ID 546c25a59c58ad7'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch album: ${response.status} ${response.statusText}\n${errorText}`);
        }
        
        const data = await response.json();
        console.log('Imgur API response:', data);
        
        // Check if data.data exists and is an array
        if (!data.data || !Array.isArray(data.data)) {
            throw new Error('Invalid Imgur API response format');
        }
        
        images = data.data.map(image => image.link);
        
        // Generate sizes object for each image
        const imagesWithSizes = images.map(url => {
            const id = url.split('/').pop().split('.')[0];
            return {
                url,
                sizes: {
                    small: `https://i.imgur.com/${id}m.jpg`,
                    medium: `https://i.imgur.com/${id}l.jpg`,
                    large: `https://i.imgur.com/${id}h.jpg`
                }
            };
        });
        images = imagesWithSizes;
        
        if (images.length === 0) {
            throw new Error('Album exists but contains no images');
        }
        
        console.log(`Fetched ${images.length} images from album ${albumId}`);
        return images;
    } catch (error) {
        console.error('Error fetching Imgur album:', error);
        const gallery = document.getElementById('gallery');
        gallery.innerHTML = `<div class="error">Failed to load images: ${error.message}</div>`;
        return [];
    }
}

// Generate srcset string for responsive images
function generateSrcset(sizes) {
    return Object.entries(sizes)
        .map(([sizeName, url]) => `${url} ${sizeName === 'small' ? '320w' : sizeName === 'medium' ? '640w' : '1024w'}`)
        .join(', ');
}

function displayImages(images) {
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = '';
    
    if (images.length === 0) {
        gallery.innerHTML = '<div class="error">No images found in the album</div>';
        return;
    }
    
    // Check WebP support
    const supportsWebP = (function() {
        const canvas = document.createElement('canvas');
        if (canvas.getContext && canvas.getContext('2d')) {
            return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
        }
        return false;
    })();
    
    // Create Intersection Observer for lazy loading
    const lazyLoadObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const container = img.closest('.gallery-item');
                
                // Load actual image
                img.src = img.dataset.src;
                img.srcset = img.dataset.srcset;
                
                // Remove blur effect when loaded
                img.onload = () => {
                    img.style.filter = 'none';
                    img.style.opacity = '1';
                };
                
                observer.unobserve(img);
            }
        });
    }, { rootMargin: '200px 0px' });
    
    images.forEach((image, index) => {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'gallery-item';
        
        const img = document.createElement('img');
        // Set data attributes for lazy loading
        
        // Extract image ID from URL
        const id = image.url.split('/').pop().split('.')[0];
        
        // Use WebP if supported, otherwise use JPEG
        if (supportsWebP) {
            img.dataset.src = `https://i.imgur.com/${id}l.webp`;
            img.dataset.srcset = `https://i.imgur.com/${id}m.webp 320w, https://i.imgur.com/${id}l.webp 640w, https://i.imgur.com/${id}h.webp 1024w`;
        } else {
            img.dataset.src = image.sizes.medium;
            img.dataset.srcset = generateSrcset(image.sizes);
        }
        
        img.sizes = "(max-width: 600px) 320px, (max-width: 1000px) 640px, 1024px";
        img.alt = image.title || 'Artwork';
        img.style.filter = 'blur(10px)';
        img.style.opacity = '0.8';
        img.style.transition = 'filter 0.5s ease, opacity 0.5s ease';
        img.style.width = '100%';
        img.style.height = 'auto';
        
        img.addEventListener('click', function() {
            currentImageIndex = index;
            openLightbox(image);
        });
        
        imgContainer.appendChild(img);
        gallery.appendChild(imgContainer);
        
        // Start observing
        lazyLoadObserver.observe(img);
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
        
        // Apply theme to entire document
        document.body.setAttribute('data-theme', newTheme);
        
        // Update toggle icon
        themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        
        // Persist preference
        localStorage.setItem('theme', newTheme);
    });
}

// Set active navigation link
function setActiveNavLink() {
    const currentPath = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (linkPath === currentPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Initialize theme toggle on all pages
document.addEventListener('DOMContentLoaded', function() {
    // Always initialize theme toggle, regardless of gallery presence
    setupThemeToggle();
    
    // Set active navigation link
    setActiveNavLink();
    
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
