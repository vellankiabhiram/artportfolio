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
    const albumId = albumIds[pageName];
    
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
