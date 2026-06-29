# Ellensburg Lost & Found Pets — Dashboard

A public-facing web map that displays missing and found pet reports submitted by Kittitas County community members through an ArcGIS Survey123 form.

---

## How to run it

```bash
npm install      # download dependencies (only needed once)
npm run dev      # start the local development server
```

Then open your browser to `http://localhost:5173`

To build a production-ready version:
```bash
npm run build    # outputs a deployable `dist/` folder
```

---

## How the app is structured

The project is split into two main folders inside `src/`:

- **`components/`** — everything you can see on screen (map, cards, filters, photos)
- **`utils/`** — behind-the-scenes logic (fetching data, doing math, filtering lists)

Think of components as the "what it looks like" and utils as the "how it works."

---

## File-by-file guide

### Root files

#### `index.html`
The single HTML page the browser loads. It's mostly empty — just a `<div id="root">` placeholder where React mounts the app, and a link to the Leaflet map stylesheet. You won't need to edit this.

#### `src/main.jsx`
The startup file. It tells React to take over the `#root` div in `index.html` and render the `App` component. You won't need to edit this.

#### `src/index.css`
Global styles applied to the whole page — things like resetting margins, setting the page to full height, and the dark green background color. **If you want to change the overall background color of the app, this is the place.**

#### `src/App.jsx`
The brain of the application. This is where all the major pieces are connected together. It:
- Loads pet data from ArcGIS when the page opens
- Keeps track of which filters are active
- Keeps track of which pet is currently selected
- Passes data down to all the other components
- When you click a card, a photo, or a map marker, the logic for what happens next lives here

If you want to change how the overall page is laid out (e.g. make the sidebar wider, change the order of panels), look at the `return` section of this file.

#### `vite.config.js`
Configuration for Vite, the tool that runs the development server and builds the app for production. Currently very simple — just tells Vite to support React. You won't need to edit this.

#### `package.json`
Lists the libraries the app depends on (React, Leaflet, etc.) and the `npm run dev` / `npm run build` commands. You won't need to edit this unless you're adding a new library.

---

### Components — `src/components/`

These files control what you see on screen. Most styling in this project is written as inline JavaScript style objects (e.g. `style={{ color: '#fff', fontSize: 12 }}`). This means styles live right next to the elements they affect, which makes it easy to find and change them.

#### `StatusBar.jsx`
The dark green bar across the very top of the screen. Shows the app title, a green pulse dot, and summary counts (total reports, missing, found, dogs, cats). When filters are active, the count shows "3 / 12 reports" to indicate filtered vs total.

**To style:** Look for the `bar`, `title`, `dot`, and `pill()` objects near the bottom of the file.

#### `Sidebar.jsx`
The left-hand panel that contains the filter controls stacked above the card list. It's mostly a layout wrapper — it sets the width (currently `280px`), background color, and border, then renders `FilterPanel` on top and `CardList` below.

**To change the sidebar width:** Find `width: 280` in this file and change the number.

#### `FilterPanel.jsx`
The filter controls inside the sidebar. Contains:
- A "Showing X of Y reports" summary line
- Status toggle buttons (All / Missing / Found)
- Animal type toggle buttons (All / Dogs / Cats)
- Two date pickers (From / To)
- A color grid with swatches
- A "Clear all filters" button that appears when any filter is active

**To style the toggle buttons:** Look for the `toggle()` function — it returns different styles depending on whether the button is active or not.

**To style the color swatches:** Look for `colorBtn()` and `swatch()`.

**To add or remove filter options:** The status and animal type options are defined as simple arrays like `[['all','All'], ['lost','Missing'], ['found','Found']]` directly in the JSX.

#### `CardList.jsx`
The scrollable list of pet report cards below the filters. Renders one `PetCard` for each filtered pet. Also handles auto-scrolling the active card into view when you click a map marker.

**To change card list background or spacing:** Look for the `overflowY: 'auto'` div's style.

If there are no results, it shows a "No reports match your filters" message — you can find and edit that text directly.

#### `PetCard.jsx`
A single card in the card list. Shows:
- A colored MISSING or FOUND badge (red or green)
- A dog/cat emoji and species label
- The date the incident happened
- Size/age and color summary

Clicking the card flies the map to that pet's location and highlights the marker.

**To style the active card highlight:** Look for the `borderLeft` and `background` properties — the active card has a green left border (`#1D9E75`) and a slightly lighter background.

**To style the MISSING/FOUND badge:** Look for the `background` and `color` properties on the `<span>` with the status text.

#### `PetMap.jsx`
The Leaflet map that fills the right side of the screen. Sets the initial center (Ellensburg, WA) and zoom level, loads the Stadia Maps basemap tiles, and renders a `PetMarker` for each filtered pet.

Also contains a hidden `MapController` component that handles flying the map to a pet when you click a card or photo.

**To change the starting map position or zoom:** Find `CENTER` and `ZOOM` at the top of the file.

**To change the basemap style:** Replace the `TILE_URL` with a different Stadia Maps style. Available styles include `alidade_smooth`, `alidade_smooth_dark`, `stamen_terrain`, and `osm_bright`. Just swap the style name in the URL.

#### `PetMarker.jsx`
A single marker on the map. This component:
1. Loads the cat or dog silhouette PNG
2. Tints it to the pet's color using the canvas tinting utility
3. Sizes it based on dog size or cat age
4. Places it on the map at the polygon centroid location
5. Shows a popup with pet details when clicked

Active (selected) markers are scaled up 20% and rendered on top of other markers.

**The popup styling** is defined inline on the `<div>` elements inside the `<Popup>` tag — look for `style={{ fontFamily: 'sans-serif', minWidth: 170 }}` and the elements below it.

#### `PhotoGallery.jsx`
The collapsible photo strip along the bottom of the map. It:
- Shows a header bar you can click to open/close it (the ▾/▴ toggle)
- When open, fetches photo attachments from ArcGIS and displays them as a horizontal scrollable strip
- Without filters: shows photos for the 10 most recent pets
- With filters active: shows photos for all matching pets
- Highlights the active pet's photo with a green border
- Each photo has a MISSING/FOUND badge overlaid at the bottom

**To change the gallery height:** Find `GALLERY_HEIGHT = 160` at the top of the file and change the number (in pixels).

**To change how many photos show without filters:** Find `MAX_UNFILTERED = 10` and change the number.

**To style the photo cards:** Look for the `width: 120, height: 140` values on the photo wrapper div — these control individual photo card dimensions.

---

### Utilities — `src/utils/`

These files contain logic and data processing. They don't render anything on screen — they're called by components to do work behind the scenes.

#### `featureService.js`
Handles all communication with the ArcGIS feature service. When the app loads, this file sends a query to the ArcGIS REST API asking for all pet report features, including their polygon geometry and all attribute fields.

The URL of the feature service is defined at the top of this file (`const BASE = 'https://...'`). If the feature service URL ever changes, update it here.

After fetching, it passes each feature through `centroid.js` and `preprocess.js` before returning the finished list to `App.jsx`.

#### `centroid.js`
Takes an ArcGIS polygon geometry (the census block polygon from the survey) and calculates its center point. This is how a polygon submission becomes a single point on the map.

It works by averaging the X and Y coordinates of all the polygon's corner points. This is accurate enough for compact census block shapes.

You won't need to edit this file.

#### `preprocess.js`
Transforms a raw ArcGIS feature into a clean object that the rest of the app can use. For each pet it calculates:

- **`icon`** — `"cat"` or `"dog"` (which silhouette image to use)
- **`sizePx`** — the pixel size for the marker (28px for small dogs and kittens, 34px for adult cats, 38px for medium dogs, 52px for large dogs)
- **`markerColor`** — the hex color for the marker tint, based on the first color in the pet's color list
- **`allColors`** — the full list of colors (used in popups and cards)
- **`latlng`** — the centroid coordinates in Leaflet format ([lat, lng])

**The color-to-hex mapping** is defined in the `COLOR_MAP` object at the top of this file. If you want to adjust the colors used for map markers, change the hex values here:

```js
const COLOR_MAP = {
  black:  '#2C2C2A',
  brown:  '#8B5E3C',
  gray:   '#888780',
  yellow: '#EF9F27',
  white:  '#C8C5B8',
  red:    '#D85A30',
  other:  '#7F77DD',
};
```

**The size scale** is defined in `SIZE_PX`:
```js
const SIZE_PX = {
  dog: { small: 28, medium: 38, large: 52 },
  cat: { kitten: 28, cat: 34 },
};
```

#### `tintSprite.js`
Takes a PNG silhouette image (cat or dog) and colorizes it to a given hex color using an HTML canvas. The technique:
1. Draws the original black silhouette onto a canvas
2. Switches the canvas blend mode to `source-in` (which means "only paint where there are already pixels")
3. Fills the entire canvas with the target color — which only affects the silhouette shape

Results are cached so the same color+size combination is only generated once per session.

You won't need to edit this file, but if you want to swap in different silhouette images, update the file names in `featureService.js` (which copies them from `public/sprites/`).

#### `filters.js`
Contains two things:

1. **`applyFilters(pets, filters)`** — takes the full list of pets and the current filter state, and returns only the pets that pass all active filters. All filters use AND logic (a pet must match every active filter to appear).

2. **`DEFAULT_FILTERS`** — the starting filter state when the app loads (everything set to "all", no colors selected, no dates).

3. **`COLOR_OPTIONS`** — the list of color choices shown in the filter panel, including their display labels and hex swatches. If you add a new color to the survey, add it here too.

#### `attachments.js`
Handles fetching photo attachments from ArcGIS. ArcGIS stores photo attachments separately from feature attributes, so they require their own API call per feature.

This file:
- Fetches the attachment list for a given feature's `objectid`
- Filters to only image attachments (ignores PDFs or other file types)
- Caches results so each feature's attachments are only fetched once
- Fetches attachments for a list of pets in parallel batches of 6 to avoid overloading the service

You won't need to edit this file.

---

## Key things to know for style editing

All styles in this project are written as **JavaScript objects** passed to the `style` prop, not as CSS classes. For example:

```jsx
<div style={{ color: '#fff', fontSize: 14, padding: '8px 12px' }}>
  Hello
</div>
```

This means:
- CSS property names are **camelCase** (`backgroundColor` not `background-color`)
- Pixel values can be plain numbers (`fontSize: 14`) or strings (`padding: '8px 12px'`)
- Colors are hex strings (`'#1D9E75'`) or rgba (`'rgba(255,255,255,0.5)'`)

The color palette used throughout the app:

| Color | Hex | Used for |
|---|---|---|
| Dark green | `#1D5C3A` | Accents, active states |
| Mid green | `#1D9E75` | Found status, highlights |
| Background | `#1A2E25` | App background |
| Sidebar | `rgba(26,46,37,0.97)` | Sidebar and status bar |
| Missing/red | `#D85A30` | Lost status |
| Text primary | `#F0EDE6` | Main text |
| Text muted | `rgba(255,255,255,0.4)` | Labels and secondary text |
| Border | `rgba(255,255,255,0.08)` | Dividers and borders |
