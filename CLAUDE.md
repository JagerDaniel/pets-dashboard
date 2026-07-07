# Ellensburg Lost & Found Pets — Dashboard

## Project overview
A public-facing React web app displaying missing and found pet reports for Kittitas County, WA. Data comes from an ArcGIS Survey123 feature service. Pets are submitted as census block polygons; the dashboard computes centroids for display as map markers.

## Tech stack
- React 18 + Vite 8
- @vitejs/plugin-react v6
- Leaflet + react-leaflet (map)
- Stadia Maps tiles (free, no token needed in dev)
- jsPDF v4.2.1 (poster export)
- qrcode (QR generation)

## ArcGIS feature service
```
https://services6.arcgis.com/XZK8P2K8iP98wM2w/arcgis/rest/services/Ellensburg_Lost_and_Found_Pets_public/FeatureServer/0
```
- Geometry: esriGeometryPolygon (census block, privacy-preserving)
- Publicly accessible, anonymous query enabled
- Has photo attachments (fetched lazily per feature)

## Key survey fields
| Field | Type | Notes |
|---|---|---|
| occur | date | When incident happened |
| findLost | select_one | "lost" or "found" |
| catDog | select_one | "dog" or "cat" |
| dog_size | select_one | small / medium / large |
| dog_color | select_multiple | space-separated string |
| dog_pattern | select_one | merle, brindle, etc. |
| cat_age | select_one | kitten / cat |
| cat_color | select_multiple | space-separated string |
| cat_hair | select_one | short / long |
| cat_pattern | select_one | calico, tabby, etc. |

## Marker symbology
- Icon: cat.png or dog.png silhouettes from /public/sprites/
- Tinted via canvas (src/utils/tintSprite.js) — NOT Mapbox SDF
- Size: small dog/kitten=28px, adult cat=34px, medium dog=38px, large dog=52px
- Color: first value of dog_color/cat_color split on space → COLOR_MAP hex

## Color palette
| Name | Hex | Used for |
|---|---|---|
| Crimson | #901e1e | Borders, active states, MISSING status |
| Crimson dark | #DC143C | Header background |
| Green | #1D9E75 | FOUND status, active highlights |
| Beige | #f5f5dc | Component backgrounds, sidebar, cards |
| App background | #f7e8e8 | Page background (light tint of crimson) |

## File structure
```
src/
  App.jsx                  — root, state management, layout
  index.css                — global styles, page background
  components/
    StatusBar.jsx          — crimson header bar with title + count pills
    Sidebar.jsx            — left panel wrapper (320px)
    FilterPanel.jsx        — filters: status, animal, date slider, color
    CardList.jsx           — scrollable pet card list
    PetCard.jsx            — single card: badge, species, date, size/color
    PetMap.jsx             — Leaflet map + MapController for fly-to
    PetMarker.jsx          — single marker with tinted sprite + popup
    PhotoGallery.jsx       — collapsible bottom photo strip
    DetailPanel.jsx        — slide-in right panel with photo + export/share buttons
  utils/
    featureService.js      — ArcGIS REST fetch + field mapping
    centroid.js            — polygon ring → [lng, lat] centroid
    preprocess.js          — derives icon, sizePx, markerColor, allColors
    tintSprite.js          — canvas-based PNG colorization + cache
    filters.js             — applyFilters(), DEFAULT_FILTERS, COLOR_OPTIONS
    attachments.js         — lazy attachment fetch + cache
    generatePoster.js      — jsPDF v4 poster export with QR + static map
    generateShareText.js   — buildShareLink()/buildShareText() for the Facebook-post copy button
public/
  sprites/
    cat.png                — sitting cat silhouette (black on white)
    dog.png                — terrier silhouette (black on white)
```

## Build phases status
- ✅ Phase 1: Map + centroid markers + symbology
- ✅ Phase 2: Filters + card list + photo gallery
- ✅ Phase 3: Detail panel slide-in
- ✅ Phase 4: PDF poster export with QR code
- ✅ Phase 5: Shareable map-embed link + Facebook-post-style copy button

## Current task
None — Phase 5 complete. Next up: TBD.

## Shareable link / deep linking
- DetailPanel has a "Copy Facebook Post + Map Link" button (next to the poster export button) that copies a Facebook-ready caption (status, attributes, general-area note, link, contact info, hashtags) built by `generateShareText.js`.
- The link is `<origin><pathname>?petId=<id>&lat=<centroid lat>&lng=<centroid lng>&zoom=16` — same URL shape the poster QR code already encoded.
- `App.jsx` reads `?petId=` on initial load (once pets have fetched) and opens that pet's DetailPanel + flies the map to it, so the copied/QR link actually deep-links.

## Coding conventions
- Inline styles as JS objects throughout (no CSS classes except index.css)
- Colors as hex strings or rgb arrays for jsPDF
- All ArcGIS field values are lowercase codes (e.g. "lost" not "Lost")
- Capitalize for display using .charAt(0).toUpperCase() + .slice(1)
- No TypeScript — plain JSX throughout
- Lazy load attachments — never batch fetch on page load
