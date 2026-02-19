// The base URL for your self-hosted image proxy backend.
// When you deploy your backend, you will change this to your live URL.
// export const IMAGE_PROXY_URL = "http://localhost:3001/proxy";
// export const API_BASE_URL = "http://localhost:3001";
export const API_BASE_URL = "https://easysell-backend-aweq.onrender.com";

export const IMAGE_PROXY_URL = `${API_BASE_URL}/proxy`;

/**
 * A helper function to create a proxied URL for an image.
 * @param {string} originalUrl The original image URL (e.g., from Google Drive).
 * @returns {string} The new URL pointing to our proxy server.
 */
export const getProxiedUrl = (originalUrl) => {
  if (!originalUrl) {
    // Return an empty string or a placeholder image URL if no original URL is provided
    return '';
  }
  // Bypass the proxy and return the original URL directly as per user request
  return originalUrl;
};