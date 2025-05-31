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
        images = data.data.map(image => image.link);
        
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

function displayImages(imageUrls) {
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = '';
    
    if (imageUrls.length === 0) {
        gallery.innerHTML = '<div class="error">No images found in the album</div>';
        return;
    }
    
    imageUrls.forEach((imageUrl, index) => {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'gallery-item';
        
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = 'Artwork';
        img.loading = 'lazy';
        
        img.addEventListener('click', function() {
            currentImageIndex = index;
            openLightbox(imageUrl);
        });
        
        imgContainer.appendChild(img);
        gallery.appendChild(imgContainer);
    });
}

function openLightbox(imageUrl) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    
    // Show loading indicator
    lightboxImg.style.display = 'none';
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    spinner.innerHTML = 'Loading...';
    lightbox.appendChild(spinner);
    
    // Load image
    lightboxImg.onload = function() {
        lightbox.removeChild(spinner);
        lightboxImg.style.display = 'block';
    };
    
    lightboxImg.src = imageUrl;
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
    const currentTheme = localStorage.getItem('theme') || 'light';
    
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

// Initialize the gallery
(async function initGallery() {
    const albumId = '7LLqlEz';
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
    
    // Set up theme toggle
    setupThemeToggle();
})();
