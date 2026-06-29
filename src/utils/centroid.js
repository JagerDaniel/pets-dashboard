/**
 * Compute the centroid of an ArcGIS polygon geometry.
 * Uses the outer ring (index 0) and averages all vertices.
 * Returns [longitude, latitude] (ArcGIS / GeoJSON order).
 */
export function getCentroid(geometry) {
  if (!geometry?.rings?.length) return null;
  const ring = geometry.rings[0];
  if (!ring?.length) return null;

  const count = ring.length;
  let sumLng = 0, sumLat = 0;
  for (let i = 0; i < count; i++) {
    sumLng += ring[i][0];
    sumLat += ring[i][1];
  }
  return [sumLng / count, sumLat / count];
}
