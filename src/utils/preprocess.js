export const COLOR_MAP = {
  black:  '#2C2C2A',
  brown:  '#8B5E3C',
  gray:   '#888780',
  yellow: '#EF9F27',
  white:  '#C8C5B8',
  red:    '#D85A30',
  other:  '#7F77DD',
};

// Pixel sizes for markers
export const SIZE_PX = {
  dog: { small: 28, medium: 38, large: 52 },
  cat: { kitten: 28, cat: 34 },
};

function getPrimaryColor(colorField) {
  if (!colorField) return COLOR_MAP.other;
  const first = colorField.trim().split(' ')[0].toLowerCase();
  return COLOR_MAP[first] ?? COLOR_MAP.other;
}

/**
 * Preprocess a raw ArcGIS feature + computed centroid into
 * a normalized object ready for the map and UI.
 */
export function preprocessFeature(arcgisFeature, centroid) {
  const p = arcgisFeature.attributes;
  const type = (p.catDog ?? '').toLowerCase();
  const icon = type === 'cat' ? 'cat' : 'dog';

  const sizeKey = type === 'dog'
    ? (p.dog_size ?? 'medium').toLowerCase()
    : (p.cat_age ?? 'cat').toLowerCase();

  const sizePx = type === 'dog'
    ? (SIZE_PX.dog[sizeKey] ?? 38)
    : (SIZE_PX.cat[sizeKey] ?? 34);

  const colorField = type === 'dog' ? p.dog_color : p.cat_color;
  const markerColor = getPrimaryColor(colorField);

  // Parse all colors for detail display
  const allColors = colorField
    ? colorField.trim().split(' ').map(c => c.toLowerCase())
    : [];

  return {
    objectid:    p.objectid,
    occur:       p.occur ? new Date(p.occur) : null,
    findLost:    p.findLost ?? 'Unknown',
    catDog:      p.catDog ?? 'Unknown',
    dog_size:    p.dog_size,
    dog_color:   p.dog_color,
    dog_pattern: p.dog_pattern,
    cat_age:     p.cat_age,
    cat_color:   p.cat_color,
    cat_hair:    p.cat_hair,
    cat_pattern: p.cat_pattern,
    // Map rendering
    latlng:      [centroid[1], centroid[0]], // Leaflet uses [lat, lng]
    icon,
    sizePx,
    markerColor,
    allColors,
  };
}
