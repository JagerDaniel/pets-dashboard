/**
 * Builds a shareable link that reopens the dashboard zoomed to a pet's
 * general location, and a Facebook-post-style caption to go with it.
 */

export function buildShareLink(pet, dashboardUrl = window.location.origin + window.location.pathname) {
  const [lat, lng] = pet.latlng;
  return `${dashboardUrl}?petId=${pet.objectid}&lat=${lat.toFixed(5)}&lng=${lng.toFixed(5)}&zoom=16`;
}

export function buildShareText(pet, dashboardUrl) {
  const isLost = (pet.findLost ?? '').toLowerCase() === 'lost';
  const isDog  = (pet.catDog ?? '').toLowerCase() === 'dog';

  const occurStr = pet.occur
    ? pet.occur.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'an unknown date';

  const attrs = isDog ? [
    ['Size',    pet.dog_size],
    ['Color',   pet.allColors?.join(', ')],
    ['Pattern', pet.dog_pattern],
  ] : [
    ['Age',     pet.cat_age],
    ['Color',   pet.allColors?.join(', ')],
    ['Hair',    pet.cat_hair],
    ['Pattern', pet.cat_pattern],
  ];

  const attrLines = attrs
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${value.charAt(0).toUpperCase() + value.slice(1)}`)
    .join('\n');

  const headline = isLost
    ? `🚨 MISSING ${isDog ? 'DOG' : 'CAT'} 🚨`
    : `📣 FOUND ${isDog ? 'DOG' : 'CAT'} 📣`;

  const seenLine = isLost
    ? `Last seen ${occurStr}.`
    : `Found ${occurStr}.`;

  const link = buildShareLink(pet, dashboardUrl);

  return [
    ...(pet.isTest ? ['🧪 EXAMPLE / TEST POSTING — not a real report 🧪', ''] : []),
    headline,
    '',
    seenLine,
    attrLines,
    '',
    '📍 General area shown on the map below (exact address withheld for privacy):',
    link,
    '',
    `#EllensburgPets #Kittitas${isLost ? 'Missing' : 'Found'}${isDog ? 'Dog' : 'Cat'} #LostAndFound`,
  ].filter(line => line !== undefined).join('\n');
}
