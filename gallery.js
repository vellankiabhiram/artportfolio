let currentImageIndex = 0;
let images = [];
let isVideoContent = false;

// Imgur API Client ID (consider moving to environment variable in production)
const IMGUR_CLIENT_ID = '546c25a59c58ad7';

async function fetchImgurAlbum(albumId) {
    try {
        const apiUrl = `https://api.imgur.com/3/album/${albumId}/images`;
        console.log(`Fetching Imgur album: ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Client-ID ${IMGUR_CLIENT_ID}`
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
        
        // Map images with metadata
        images = data.data.map(image => ({
            url: image.link,
            title: image.title || '',
            description: image.description || '',
            type: image.type || 'image/jpeg',
            animated: image.animated || false
        }));
        
        // Generate sizes object for each image
        images = images.map(imageData => {
            const id = imageData.url.split('/').pop().split('.')[0];
            return {
                ...imageData,
                sizes: {
                    small: `https://i.imgur.com/${id}m.jpg`,
                    medium: `https://i.imgur.com/${id}l.jpg`,
                    large: `https://i.imgur.com/${id}h.jpg`
                }
            };
        });
        
        if (images.length === 0) {
            throw new Error('Album exists but contains no images');
        }
        
        console.log(`Fetched ${images.length} images from album ${albumId}`);
        return images;
    } catch (error) {
        console.error('Error fetching Imgur album:', error);
        const gallery = document.getElementById('gallery');
        if (gallery) {
            gallery.innerHTML = `<div class="error">Failed to load images: ${error.message}</div>`;
        }
        return [];
    }
}

// Generate srcset string for responsive images
function generateSrcset(sizes) {
    return Object.entries(sizes)
        .map(([sizeName, url]) => `${url} ${sizeName === 'small' ? '320w' : sizeName === 'medium' ? '640w' : '1024w'}`)
        .join(', ');
}

/**
 * Decode HTML entities in a string (e.g. "&amp;#39;" -> "'", "&amp;" -> "&").
 * This is used to clean up image titles/descriptions coming from Imgur that may be double‑escaped.
 */
function decodeHTMLEntities(str) {
  const txt = document.createElement('textarea');
  txt.innerHTML = str;
  return txt.value;
}

/**
 * Reorder images array so that when rendered with a CSS multi‑column layout (column-count: 3)
 * the visual order appears left‑to‑right, top‑to‑bottom (row‑major).
 *
 * The column layout fills each column top‑to‑bottom before moving to the next column.
 * To achieve a row‑major visual flow we need to rearrange the source array.
 * This function treats the original array as a matrix with the given number of columns
 * (default 3) and then maps it to the order expected by the column layout.
 *
 * Example for 9 items (3 columns):
 *   Original (row‑major): [0,1,2,3,4,5,6,7,8]
 *   Reordered:            [0,3,6,1,4,7,2,5,8]
 *   Column layout will then render rows as:
 *     Row0: 0,1,2   Row1: 3,4,5   Row2: 6,7,8
 */
function reorderImagesForColumnLayout(images, columns = 3) {
  const rows = Math.ceil(images.length / columns);
  const reordered = new Array(images.length);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      const originalIdx = r * columns + c;
      if (originalIdx < images.length) {
        const newIdx = c * rows + r;
        reordered[newIdx] = images[originalIdx];
      }
    }
  }
  return reordered;
}

function displayImages(images) {
    const gallery = document.getElementById('gallery');
    if (!gallery) return;
    
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
    
    // Create Intersection Observer for lazy loading with smoother loading
    const lazyLoadObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const container = img.closest('.gallery-item');
                
                // Add skeleton loading effect
                container.classList.add('skeleton');
                
                // Load actual image
                img.src = img.dataset.src;
                img.srcset = img.dataset.srcset;
                
                // Remove blur and skeleton effect when loaded
                img.onload = () => {
                    img.style.filter = 'none';
                    img.style.opacity = '1';
                    container.classList.remove('skeleton');
                };
                
                img.onerror = () => {
                    container.classList.remove('skeleton');
                    container.innerHTML = '<div class="error">Failed to load image</div>';
                };
                
                observer.unobserve(img);
            }
        });
    }, { rootMargin: '200px 0px', threshold: 0.01 });
    
    images.forEach((image, index) => {
        // Decode any HTML entities in the title for proper display in alt text and ARIA labels
        const decodedTitle = decodeHTMLEntities(image.title || '');
        const imgContainer = document.createElement('div');
        imgContainer.className = 'gallery-item';
        imgContainer.setAttribute('role', 'button');
        imgContainer.setAttribute('tabindex', '0');
        imgContainer.setAttribute('aria-label', `View ${decodedTitle || 'artwork'} in full size`);
        
        // Check if this is a video based on type or extension
        const isVideo = image.type.startsWith('video/') || 
                       /\.(mp4|webm|ogg)$/i.test(image.url);
        
        const img = document.createElement('img');
        
        // Extract image ID from URL
        const id = image.url.split('/').pop().split('.')[0];
        
        // Use WebP if supported, otherwise use JPEG
        if (supportsWebP && !isVideo) {
            img.dataset.src = `https://i.imgur.com/${id}l.webp`;
            img.dataset.srcset = `https://i.imgur.com/${id}m.webp 320w, https://i.imgur.com/${id}l.webp 640w, https://i.imgur.com/${id}h.webp 1024w`;
        } else {
            img.dataset.src = image.sizes.medium;
            img.dataset.srcset = generateSrcset(image.sizes);
        }
        
        img.sizes = "(max-width: 600px) 320px, (max-width: 1000px) 640px, 1024px";
        img.alt = decodedTitle || 'Artwork';
        img.loading = 'lazy';
        img.style.filter = 'blur(10px)';
        img.style.opacity = '0.8';
        img.style.transition = 'filter 0.5s ease, opacity 0.5s ease';
        img.style.width = '100%';
        img.style.height = 'auto';
        img.style.display = 'block';
        
        
        // Click handler
        const handleClick = () => {
            currentImageIndex = index;
            if (isVideo) {
                openVideoLightbox(image.url, image.title || '');
            } else {
                openLightbox(image);
            }
        };
        
        img.addEventListener('click', handleClick);
        
        // Keyboard accessibility
        imgContainer.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick();
            }
        });
        
        imgContainer.appendChild(img);
        gallery.appendChild(imgContainer);
        
        // Mark as loaded after image loads for staggered animation
        img.addEventListener('load', () => {
            imgContainer.classList.add('loaded');
        });

        // Start observing
        lazyLoadObserver.observe(img);
    });
}


function openLightbox(image) {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;
    
    const lightboxImg = document.getElementById('lightbox-img');
    if (!lightboxImg) return;
    
    // Hide any existing video content
    const existingVideo = lightbox.querySelector('.lightbox-video-container');
    if (existingVideo) {
        existingVideo.remove();
    }
    
    isVideoContent = false;
    
    // Show loading indicator
    lightboxImg.style.display = 'none';
    let spinner = lightbox.querySelector('.spinner');
    if (!spinner) {
        spinner = document.createElement('div');
        spinner.className = 'spinner';
        spinner.innerHTML = 'Loading...';
        lightbox.appendChild(spinner);
    }
    
    // Create caption element if it doesn't exist
    let caption = document.getElementById('lightbox-caption');
    if (!caption) {
        caption = document.createElement('div');
        caption.id = 'lightbox-caption';
        lightbox.appendChild(caption);
    }
    
    // Set caption text (title or description)
    const captionText = image.title || image.description || '';
    const decodedCaption = decodeHTMLEntities(captionText);
    caption.textContent = decodedCaption;
    caption.classList.remove('show');
    
    // Load image
    lightboxImg.onload = function() {
        if (spinner) spinner.remove();
        lightboxImg.style.display = 'block';
        
        // Show caption with fade-in animation
        if (captionText) {
            caption.classList.add('show');
        }
    };
    
    lightboxImg.onerror = function() {
        if (spinner) spinner.remove();
        lightboxImg.style.display = 'none';
        caption.textContent = 'Failed to load image';
        caption.classList.add('show');
    };
    
    lightboxImg.src = image.url;
    lightbox.style.display = 'block';
    // Add active class to trigger opacity transition and make lightbox visible
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Function to open video in lightbox
function openVideoLightbox(videoUrl, title = '') {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;
    
    const lightboxImg = document.getElementById('lightbox-img');
    if (lightboxImg) lightboxImg.style.display = 'none';
    
    isVideoContent = true;
    
    // Remove existing video if any
    const existingVideo = lightbox.querySelector('.lightbox-video-container');
    if (existingVideo) {
        existingVideo.remove();
    }
    
    // Create video container
    const videoContainer = document.createElement('div');
    videoContainer.className = 'lightbox-video-container';
    
    const video = document.createElement('video');
    video.className = 'lightbox-video';
    video.src = videoUrl;
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    
    videoContainer.appendChild(video);
    lightbox.appendChild(videoContainer);
    
    // Setup caption
    let caption = document.getElementById('lightbox-caption');
    if (!caption) {
        caption = document.createElement('div');
        caption.id = 'lightbox-caption';
        lightbox.appendChild(caption);
    }
    
    const decodedTitle = decodeHTMLEntities(title || '');
    caption.textContent = decodedTitle;
    if (title) {
        caption.classList.add('show');
    }
    
    lightbox.style.display = 'block';
    // Add active class for video lightbox as well
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Cleanup on close
    video.onended = () => {
        video.pause();
    };
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;
    
    lightbox.style.display = 'none';
    // Remove active class to hide lightbox properly
    lightbox.classList.remove('active');
    document.body.style.overflow = 'auto';
    
    // Pause and remove any video content
    const videoContainer = lightbox.querySelector('.lightbox-video-container');
    if (videoContainer) {
        const video = videoContainer.querySelector('video');
        if (video) {
            video.pause();
            video.currentTime = 0;
        }
        videoContainer.remove();
    }
    
    // Hide caption
    const caption = document.getElementById('lightbox-caption');
    if (caption) {
        caption.classList.remove('show');
        caption.textContent = '';
    }
    
    isVideoContent = false;
}


function showNextImage() {
    // Jump forward by one column's height
    currentImageIndex = (currentImageIndex + 1 + images.length) % images.length;
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

// Set active navigation link - consolidated function
function setActiveNavLink() {
    const currentPath = window.location.pathname.split('/').pop();
    
    // Handle both main nav and sidebar nav
    const navLinks = document.querySelectorAll('nav a, #sidebar a');
    
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

// Map of page names to album IDs (page name is derived from the filename without extension)
const albumIds = {
    'index': '7LLqlEz',          // Existing home gallery
    'sketchbook': '3y23c8O', // Placeholder for sketchbook
    'concept_art': '7LLqlEz',   // Placeholder for concept art
    'animation': 'ODraTKQ',
    '3d': '7LLqlEz' // 3D page uses same album as home by default; can be customized
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
    // Reorder images to achieve left-to-right row-major layout with 3 columns
    images = reorderImagesForColumnLayout(images, 3);
    displayImages(images);
    
    // Set up event listeners with null checks
    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeLightbox);
    }
    
    const leftArrow = document.querySelector('.left-arrow');
    if (leftArrow) {
        leftArrow.addEventListener('click', function(e) {
            e.stopPropagation();
            showPrevImage();
        });
    }
    
    const rightArrow = document.querySelector('.right-arrow');
    if (rightArrow) {
        rightArrow.addEventListener('click', function(e) {
            e.stopPropagation();
            showNextImage();
        });
    }
    
    const lightboxEl = document.getElementById('lightbox');
    if (lightboxEl) {
        lightboxEl.addEventListener('click', function(e) {
            if (e.target !== document.getElementById('lightbox-img') && 
                !e.target.closest('.arrow') && 
                !e.target.closest('#lightbox-caption')) {
                closeLightbox();
            }
        });
    }
    
    document.addEventListener('keydown', function(e) {
        const lightbox = document.getElementById('lightbox');
        if (!lightbox || lightbox.style.display === 'none') return;
        
        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === 'ArrowLeft') {
            showPrevImage();
        } else if (e.key === 'ArrowRight') {
            showNextImage();
        }
    });
    
})();
