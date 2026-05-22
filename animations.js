/**
 * Animation and Video Gallery Module
 * Handles video playback, GIF animations, and animated content
 */

// Video gallery data structure
let videoGallery = [];

/**
 * Fetch videos from a source (can be extended for different APIs)
 * @param {string} source - The source identifier
 * @returns {Promise<Array>} Array of video objects
 */
async function fetchVideoGallery(source) {
    try {
        // This is a placeholder - implement based on your video hosting solution
        // Options: Vimeo API, YouTube API, direct file hosting, etc.
        
        const response = await fetch(`/api/videos?source=${source}`);
        if (!response.ok) throw new Error('Failed to fetch videos');
        
        const data = await response.json();
        videoGallery = data.videos || [];
        return videoGallery;
    } catch (error) {
        console.error('Error fetching video gallery:', error);
        return [];
    }
}

/**
 * Display video gallery in the DOM
 * @param {Array} videos - Array of video objects
 */
function displayVideoGallery(videos) {
    const gallery = document.getElementById('gallery');
    if (!gallery) return;
    
    gallery.innerHTML = '';
    
    if (videos.length === 0) {
        gallery.innerHTML = '<div class="error">No videos found</div>';
        return;
    }
    
    videos.forEach((video, index) => {
        const container = document.createElement('div');
        container.className = 'gallery-item video-item';
        container.setAttribute('role', 'button');
        container.setAttribute('tabindex', '0');
        container.setAttribute('aria-label', `Play ${video.title || 'video'}`);
        
        // Create thumbnail or video preview
        const thumbnail = document.createElement('div');
        thumbnail.className = 'video-thumbnail';
        
        if (video.thumbnail) {
            const img = document.createElement('img');
            img.src = video.thumbnail;
            img.alt = video.title || 'Video thumbnail';
            img.loading = 'lazy';
            thumbnail.appendChild(img);
        } else {
            thumbnail.innerHTML = '<div class="video-placeholder">🎬</div>';
        }
        
        // Play button overlay
        const playButton = document.createElement('div');
        playButton.className = 'play-button';
        playButton.innerHTML = '▶';
        thumbnail.appendChild(playButton);
        
        // Video info
        const info = document.createElement('div');
        info.className = 'video-info';
        info.innerHTML = `
            <h3>${video.title || 'Untitled'}</h3>
            ${video.duration ? `<span class="duration">${formatDuration(video.duration)}</span>` : ''}
        `;
        
        container.appendChild(thumbnail);
        container.appendChild(info);
        gallery.appendChild(container);
        
        // Click handler
        const handleClick = () => {
            if (video.type === 'gif' || video.animated) {
                openLightbox({ url: video.url, title: video.title });
            } else {
                openVideoLightbox(video.url, video.title);
            }
        };
        
        container.addEventListener('click', handleClick);
        container.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick();
            }
        });
    });
}

/**
 * Format duration in seconds to MM:SS
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Initialize animation gallery with mixed content (images, GIFs, videos)
 */
async function initAnimationGallery() {
    const gallery = document.getElementById('gallery');
    if (!gallery) return;
    
    // Show loading state
    gallery.innerHTML = '<div class="skeleton" style="height: 200px;"></div>';
    
    // For now, use the existing image gallery
    // In production, you'd fetch from a video API or database
    const pageName = getPageName();
    const albumId = albumIds[pageName] || '7LLqlEz';
    
    await fetchImgurAlbum(albumId);
    displayImages(images);
}

/**
 * Auto-play GIFs when they come into view
 */
function setupGifAutoPlay() {
    const gifObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const img = entry.target;
            if (entry.isIntersecting) {
                // Start loading/playing GIF
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                }
            } else {
                // Pause GIF by removing src (optional, saves bandwidth)
                // img.src = '';
            }
        });
    }, { rootMargin: '50px 0px' });
    
    document.querySelectorAll('img[data-animated="true"]').forEach(img => {
        gifObserver.observe(img);
    });
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('gallery')) {
        initAnimationGallery();
    }
    setupGifAutoPlay();
});
