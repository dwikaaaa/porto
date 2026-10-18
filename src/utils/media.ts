/**
 * Normalizes media and thumbnail URLs returned from the API.
 * Ensures HTTPS for trycloudflare.com to prevent mixed-content blocks,
 * and formats relative URLs against the origin domain.
 */
export function getMediaUrl(url?: string | null): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return '';
  }

  const trimmed = url.trim();

  // Upgrade http:// to https:// on Cloudflare Tunnel domains
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    if (trimmed.includes('trycloudflare.com')) {
      return trimmed.replace(/^http:\/\//i, 'https://');
    }
    return trimmed;
  }

  // Handle relative image paths from the backend storage
  const rawApiUrl = import.meta.env.VITE_API_URL || '';
  const origin = rawApiUrl.replace(/\/api\/?$/i, '').replace(/\/+$/, '');
  return `${origin}/${trimmed.replace(/^\/+/, '')}`;
}
