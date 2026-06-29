import { getCentroid } from './centroid.js';
import { preprocessFeature } from './preprocess.js';

const BASE = 'https://services6.arcgis.com/XZK8P2K8iP98wM2w/arcgis/rest/services/Ellensburg_Lost_and_Found_Pets_public/FeatureServer/0';

export { BASE as FEATURE_SERVICE_URL };

export async function fetchPets() {
  const params = new URLSearchParams({
    where: '1=1',
    outFields: [
      'objectid',
      'occur',
      'findLost',
      'catDog',
      'dog_size',
      'dog_color',
      'dog_pattern',
      'cat_age',
      'cat_color',
      'cat_hair',
      'cat_pattern',
    ].join(','),
    returnGeometry: 'true',
    outSR: '4326',
    f: 'json',
  });

  const res = await fetch(`${BASE}/query?${params}`);
  if (!res.ok) throw new Error(`Feature service HTTP error: ${res.status}`);

  const data = await res.json();
  if (data.error) throw new Error(`ArcGIS error: ${data.error.message}`);

  const features = data.features ?? [];

  return features
    .filter(f => f.geometry && f.geometry.rings?.length > 0)
    .map(f => {
      const centroid = getCentroid(f.geometry);
      return centroid ? preprocessFeature(f, centroid) : null;
    })
    .filter(Boolean);
}
