const BASE = 'https://services6.arcgis.com/XZK8P2K8iP98wM2w/arcgis/rest/services/Ellensburg_Lost_and_Found_Pets_public/FeatureServer/0';

// Cache so we don't re-fetch the same objectid twice. Capped with LRU
// eviction so a long browsing session doesn't grow this unbounded.
const CACHE_LIMIT = 200;
const cache = new Map();

function cacheSet(key, value) {
  cache.delete(key);
  cache.set(key, value);
  if (cache.size > CACHE_LIMIT) {
    cache.delete(cache.keys().next().value);
  }
}

function cacheGet(key) {
  if (!cache.has(key)) return undefined;
  const value = cache.get(key);
  // Refresh recency on access
  cache.delete(key);
  cache.set(key, value);
  return value;
}

export async function fetchAttachments(objectid) {
  if (cache.has(objectid)) return cacheGet(objectid);

  const res = await fetch(`${BASE}/${objectid}/attachments?f=json`);
  if (!res.ok) return [];
  const data = await res.json();
  const attachments = (data.attachmentInfos ?? []).map(a => ({
    id: a.id,
    name: a.name,
    url: `${BASE}/${objectid}/attachments/${a.id}`,
    contentType: a.contentType,
    objectid,
  }));

  cacheSet(objectid, attachments);
  return attachments;
}

/**
 * Fetch attachments for a list of pets in parallel (max 6 concurrent).
 * Returns a flat array of attachment objects, each with pet info attached.
 */
export async function fetchAttachmentsForPets(pets) {
  const results = [];
  // Chunk into groups of 6 to avoid hammering the service
  for (let i = 0; i < pets.length; i += 6) {
    const chunk = pets.slice(i, i + 6);
    const chunkResults = await Promise.all(
      chunk.map(async pet => {
        const attachments = await fetchAttachments(pet.objectid);
        return attachments
          .filter(a => a.contentType?.startsWith('image/'))
          .map(a => ({ ...a, pet }));
      })
    );
    results.push(...chunkResults.flat());
  }
  return results;
}
