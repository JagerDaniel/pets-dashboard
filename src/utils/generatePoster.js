import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { buildShareLink } from './generateShareText.js';

const W = 215.9;
const H = 279.4;
const MARGIN = 10;
const INNER_W = W - MARGIN * 2;

const CRIMSON   = [144, 30,  30];
const GREEN     = [29,  158, 117];
const DARK      = [30,  30,  30];
const MID       = [90,  90,  90];

/**
 * Loads an image and returns its data URL plus natural dimensions, so
 * callers can fit it into a box without distorting its aspect ratio.
 */
async function urlToBase64(url) {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width  = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d').drawImage(img, 0, 0);
        resolve({
          dataUrl: canvas.toDataURL('image/jpeg', 0.85),
          width:   img.naturalWidth,
          height:  img.naturalHeight,
        });
      } catch {
        // Tainted canvas (missing CORS headers on the response) — skip the image
        // rather than leave the caller's Promise.all hanging forever.
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Draws an image inside a box, scaling to fit (preserving aspect ratio)
 * instead of stretching to fill it, then centers it within the box.
 */
function drawImageContain(doc, imgInfo, x, y, boxW, boxH) {
  const { dataUrl, width, height } = imgInfo;
  const scale = Math.min(boxW / width, boxH / height);
  const drawW = width * scale;
  const drawH = height * scale;
  const offsetX = x + (boxW - drawW) / 2;
  const offsetY = y + (boxH - drawH) / 2;
  doc.addImage(dataUrl, 'JPEG', offsetX, offsetY, drawW, drawH, undefined, 'MEDIUM');
}

/**
 * Fetch a static map image for the centroid using a single OSM tile.
 * Avoids any API key requirement.
 */
async function fetchStaticMap(lat, lng) {
  const zoom = 15;
  const width = 600;
  const height = 300;
  const tileUrl = buildOsmTileUrl(lat, lng, zoom, width, height);
  return urlToBase64(tileUrl);
}

/**
 * Build a single OSM tile URL covering the area around the centroid.
 * This avoids any API key requirement.
 */
function buildOsmTileUrl(lat, lng, zoom, width, height) {
  const tileX = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
  const tileY = Math.floor(
    (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI)
    / 2 * Math.pow(2, zoom)
  );
  return `https://tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`;
}

async function generateQR(pet, dashboardUrl) {
  const url = buildShareLink(pet, dashboardUrl);
  return QRCode.toDataURL(url, {
    width: 200, margin: 1,
    color: { dark: '#901e1e', light: '#f5f5dc' },
  });
}

/**
 * Draw a semi-transparent white rectangle without setOpacity (removed in jsPDF v4).
 * Uses an RGBA fill color instead.
 */
function drawSemiTransparentRect(doc, x, y, w, h) {
  const prev = doc.getFillColor();
  doc.setFillColor(255, 255, 255);
  // jsPDF v4 supports rgba via setFillColor with alpha as 4th arg
  try {
    doc.setFillColor(255, 255, 255, 0.75);
  } catch {
    doc.setFillColor(230, 225, 215); // fallback: opaque light beige
  }
  doc.rect(x, y, w, h, 'F');
  doc.setFillColor(prev);
}

export async function generatePoster(pet, photoUrl, dashboardUrl = window.location.origin) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });

  const isLost      = (pet.findLost ?? '').toLowerCase() === 'lost';
  const isDog       = (pet.catDog ?? '').toLowerCase() === 'dog';
  const statusColor = isLost ? CRIMSON : GREEN;
  const statusText  = isLost ? 'MISSING' : 'FOUND';

  const occurStr = pet.occur
    ? pet.occur.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'Unknown date';

  const attrs = isDog ? [
    ['Species', 'Dog'],
    ['Size',    pet.dog_size    ?? '—'],
    ['Color',   pet.allColors?.join(', ') ?? '—'],
    ['Pattern', pet.dog_pattern ?? '—'],
  ] : [
    ['Species', 'Cat'],
    ['Age',     pet.cat_age    ?? '—'],
    ['Color',   pet.allColors?.join(', ') ?? '—'],
    ['Hair',    pet.cat_hair   ?? '—'],
    ['Pattern', pet.cat_pattern ?? '—'],
  ];

  const [lat, lng] = pet.latlng;

  // Fetch all assets in parallel
  const [mapB64, qrDataUrl, photoB64] = await Promise.all([
    fetchStaticMap(lat, lng),
    generateQR(pet, dashboardUrl),
    photoUrl ? urlToBase64(photoUrl) : Promise.resolve(null),
  ]);

  // ── Background ────────────────────────────────────────────────
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, W, H, 'F');

  // ── Outer border ──────────────────────────────────────────────
  doc.setDrawColor(...CRIMSON);
  doc.setLineWidth(1.5);
  doc.rect(MARGIN, MARGIN, INNER_W, H - MARGIN * 2);

  // ── Header ────────────────────────────────────────────────────
  const headerH = 38;
  doc.setFillColor(...statusColor);
  doc.rect(MARGIN, MARGIN, INNER_W, headerH, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(48);
  doc.setTextColor(255, 255, 255);
  doc.text(statusText, W / 2, MARGIN + 22, { align: 'center' });

  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.text(`${isDog ? 'Dog' : 'Cat'}  ·  ${occurStr}`, W / 2, MARGIN + 33, { align: 'center' });

  doc.setDrawColor(...CRIMSON);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, MARGIN + headerH, MARGIN + INNER_W, MARGIN + headerH);

  // ── Layout math ───────────────────────────────────────────────
  // Photo + map sit side by side, each half-width (scaled to fit, no
  // stretching); the bottom strip is split left/right between the
  // attribute table and QR.
  const footerH    = 10;
  const contentTop = MARGIN + headerH;
  const contentBot = H - MARGIN - footerH;
  const available  = contentBot - contentTop;

  const bottomRowH   = 46;
  const humaneStripH = 29;
  const photoMapH    = available - bottomRowH - humaneStripH;
  const colGapTop   = 1;
  const photoMapColW = (INNER_W - colGapTop) / 2;
  const photoX = MARGIN;
  const mapX   = MARGIN + photoMapColW + colGapTop;

  // ── Photo ─────────────────────────────────────────────────────
  const photoY = contentTop;

  if (photoB64) {
    doc.setFillColor(255, 255, 255);
    doc.rect(photoX, photoY, photoMapColW, photoMapH, 'F');
    drawImageContain(doc, photoB64, photoX, photoY, photoMapColW, photoMapH);
  } else {
    doc.setFillColor(220, 210, 210);
    doc.rect(photoX, photoY, photoMapColW, photoMapH, 'F');
    doc.setTextColor(...MID);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'italic');
    doc.text('No photo available', photoX + photoMapColW / 2, photoY + photoMapH / 2, { align: 'center' });
  }

  // ── Map ───────────────────────────────────────────────────────
  const mapY = photoY;

  if (mapB64) {
    doc.setFillColor(255, 255, 255);
    doc.rect(mapX, mapY, photoMapColW, photoMapH, 'F');
    drawImageContain(doc, mapB64, mapX, mapY, photoMapColW, photoMapH);

    // Location label — opaque background (no setOpacity in jsPDF v4)
    doc.setFillColor(230, 225, 215);
    doc.rect(mapX, mapY + photoMapH - 7, photoMapColW, 7, 'F');
    doc.setFontSize(6.5);
    doc.setTextColor(...MID);
    doc.setFont('helvetica', 'italic');
    doc.text('General area only — not an exact address', mapX + 2, mapY + photoMapH - 2);
  } else {
    doc.setFillColor(220, 220, 210);
    doc.rect(mapX, mapY, photoMapColW, photoMapH, 'F');
    doc.setTextColor(...MID);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    doc.text('Map unavailable', mapX + photoMapColW / 2, mapY + photoMapH / 2, { align: 'center' });
  }

  doc.setDrawColor(...CRIMSON);
  doc.setLineWidth(0.5);
  doc.line(mapX - colGapTop / 2, photoY, mapX - colGapTop / 2, photoY + photoMapH);
  doc.line(MARGIN, photoY + photoMapH, MARGIN + INNER_W, photoY + photoMapH);

  // ── Animal Shelter / Animal Control info strip ──────────────────
  const humaneY = photoY + photoMapH;

  doc.setFillColor(255, 255, 255);
  doc.rect(MARGIN, humaneY, INNER_W, humaneStripH, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...CRIMSON);
  doc.text('Animal Shelter — 1007 S. Industrial Way, Ellensburg, WA 98926', W / 2, humaneY + 5.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...DARK);
  doc.text('Shelter: (509) 925-7387', W / 2, humaneY + 10.5, { align: 'center' });
  doc.text('Animal Control: (509) 962-7246  ·  aco@ci.ellensburg.wa.us', W / 2, humaneY + 15, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...CRIMSON);
  doc.text('Ellensburg Lost and Found: facebook.com/share/g/1DxnGTzfpa', W / 2, humaneY + 19.5, { align: 'center' });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6);
  doc.setTextColor(...MID);
  doc.text(
    'This poster is not affiliated with or endorsed by the City of Ellensburg, Animal Control, or the Facebook group above.',
    W / 2, humaneY + 25, { align: 'center' }
  );

  doc.setDrawColor(...CRIMSON);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, humaneY + humaneStripH, MARGIN + INNER_W, humaneY + humaneStripH);

  // ── Bottom row: attributes (left) + QR code (right) ────────────
  const bottomY     = humaneY + humaneStripH;
  const colGap      = 6;
  const tableColW   = INNER_W * 0.58 - colGap / 2;
  const qrColW      = INNER_W - tableColW - colGap;
  const qrColX      = MARGIN + tableColW + colGap;

  doc.setDrawColor(...CRIMSON);
  doc.setLineWidth(0.5);
  doc.line(qrColX - colGap / 2, bottomY + 4, qrColX - colGap / 2, bottomY + bottomRowH - 4);

  // Attributes table
  const labelX = MARGIN + 4;
  const valueX = MARGIN + 4 + tableColW * 0.42;
  const rowH   = 6.5;
  const tableH = rowH * attrs.length;
  let y = bottomY + (bottomRowH - tableH) / 2 + rowH * 0.7;

  doc.setFontSize(9);
  attrs.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...CRIMSON);
    doc.text(label, labelX, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK);
    const val = String(value);
    doc.text(val.charAt(0).toUpperCase() + val.slice(1), valueX, y);
    y += rowH;
  });

  // QR code
  const qrSize = Math.min(qrColW - 14, bottomRowH - 14);
  const qrX    = qrColX + (qrColW - qrSize) / 2;
  const qrY    = bottomY + (bottomRowH - qrSize) / 2 + 3;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...CRIMSON);
  doc.text('Scan to view online', qrColX + qrColW / 2, qrY - 3, { align: 'center' });

  doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

  // ── Footer ────────────────────────────────────────────────────
  const footerY = H - MARGIN - footerH;
  doc.setFillColor(...statusColor);
  doc.rect(MARGIN, footerY, INNER_W, footerH, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(
    pet.isTest
      ? 'EXAMPLE / TEST POSTING  ·  Ellensburg Pets, Lost and Found'
      : 'Ellensburg Pets, Lost and Found',
    W / 2, footerY + 6.5, { align: 'center' }
  );

  // ── Test-posting watermark ────────────────────────────────────
  // Drawn last so nothing paints over it; if GState opacity isn't
  // available the footer label above still flags the poster.
  if (pet.isTest) {
    try {
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: 0.15 }));
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(72);
      doc.setTextColor(...CRIMSON);
      doc.text('EXAMPLE ONLY', W / 2, H / 2, { align: 'center', angle: 45 });
      doc.restoreGraphicsState();
    } catch {
      // ignore — footer label is the fallback
    }
  }

  // ── Save ──────────────────────────────────────────────────────
  const filename = `${statusText.toLowerCase()}-${isDog ? 'dog' : 'cat'}-${pet.objectid}.pdf`;
  doc.save(filename);
}
