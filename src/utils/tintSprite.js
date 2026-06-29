/**
 * Load a PNG silhouette and tint it to a given hex color using canvas.
 * Uses globalCompositeOperation 'source-in' to colorize the black silhouette.
 * Returns a data URL of the tinted image at the requested pixel size.
 *
 * @param {string} url     - path to the PNG sprite
 * @param {string} color   - hex color string e.g. '#8B5E3C'
 * @param {number} size    - output pixel size (square)
 * @returns {Promise<string>} data URL of tinted PNG
 */
export function tintSprite(url, color, size) {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Draw the original silhouette
        ctx.drawImage(img, 0, 0, size, size);

        // Tint: fill with color, keep only where silhouette pixels exist
        ctx.globalCompositeOperation = 'source-in';
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, size, size);

        resolve(canvas.toDataURL('image/png'));
      } catch {
        // Tainted canvas (missing CORS headers on the response) — fall
        // back to no icon rather than leaving the caller's promise unresolved.
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Cache of tinted sprite data URLs keyed by "type-color-size".
 * Avoids re-drawing the same combination multiple times.
 */
const cache = new Map();

export async function getCachedSprite(type, color, size) {
  const key = `${type}-${color}-${size}`;
  if (cache.has(key)) return cache.get(key);
  const url = `/sprites/${type}.png`;
  const dataUrl = await tintSprite(url, color, size);
  if (dataUrl) cache.set(key, dataUrl);
  return dataUrl;
}
