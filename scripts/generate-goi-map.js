/**
 * generate-goi-map.js
 * Generates a GoI-compliant India states GeoJSON.
 *
 * Key GoI boundary requirements (per Survey of India):
 *  - J&K UT includes Pakistan-Occupied Kashmir (AJK + Gilgit-Baltistan)
 *  - Ladakh UT includes Aksai Chin (China-administered, Indian claim)
 *  - Arunachal Pradesh shows full territory (McMahon Line)
 *
 * Strategy: Take the existing OpenStreetMap-derived GeoJSON (which has correct
 * boundaries for all other states) and replace J&K + Ladakh polygons with
 * GoI-compliant simplified polygons based on the 1947 Instrument of Accession
 * territory and the Survey of India reference maps.
 */

import fs from "fs";
import path from "path";

const INPUT  = "client/public/maps/india-states-simplified.geojson";
const OUTPUT = "client/public/maps/india-states-simplified.geojson";

// ── GoI J&K UT (including AJK + Gilgit-Baltistan, excl. Aksai Chin → Ladakh)
// Simplified clockwise polygon of the full GoI-claimed J&K UT territory.
// Reference: Survey of India, 1:250 000 series, TopoSheets of J&K state
// (pre-2019 J&K minus the Ladakh division area)
const JK_GOI_POLYGON = [
  // South boundary (India-Pakistan "international line" as per GoI)
  [74.40, 32.20], [74.85, 32.10], [75.30, 32.08], [75.70, 32.10],
  [76.10, 32.22], [76.45, 32.28], [76.77, 32.40],

  // East boundary (J&K/Ladakh UT internal boundary, then LoC upper stretch)
  [76.87, 32.80], [76.90, 33.30], [76.82, 33.80],
  [76.95, 34.45], [77.00, 35.10],

  // Siachen / Karakoram Pass area (GoI claims to Karakoram ridge ~77°E/36°N)
  [77.10, 35.50], [77.20, 36.00], [76.90, 36.50], [76.60, 36.80],

  // Northern boundary (GoI claim: along watershed to Afghan Wakhan border)
  [76.00, 37.10], [75.40, 37.20], [74.80, 37.10], [74.30, 36.95],

  // Northwest — Gilgit-Baltistan / Afghan Wakhan tri-junction
  [73.80, 36.80], [73.40, 36.55],

  // GB west boundary going south (Chitral/KPK border area)
  [73.10, 36.20], [72.90, 35.80], [72.80, 35.40],
  [73.00, 35.10], [73.20, 34.80],

  // AJK corridor (Neelum / Jhelum valley spine going south)
  [73.40, 34.40], [73.60, 34.10], [73.45, 33.80],
  [73.65, 33.50], [73.80, 33.20],

  // Approach to LoC / ceasefire line near Muzaffarabad
  [73.90, 32.90], [74.00, 32.60], [74.20, 32.40], [74.40, 32.20],
];

// ── GoI Ladakh UT (including Aksai Chin and Trans-Karakoram Tract)
// Simplified clockwise polygon of the full GoI-claimed Ladakh UT territory.
// Reference: Survey of India Ladakh map (Aksai Chin eastern limit ~80.3°E)
const LADAKH_GOI_POLYGON = [
  // SW corner — shared with J&K at Kargil/Zanskar boundary
  [76.77, 32.40], [77.00, 32.35],

  // South boundary along HP/Uttarakhand border
  [77.50, 32.28], [78.00, 32.20], [78.50, 32.15],
  [79.00, 32.22], [79.46, 32.42],

  // SE corner — meets Nepal/Uttarakhand (Shipki La area)
  [79.80, 32.55], [80.10, 32.80],

  // Aksai Chin south boundary (GoI claim follows 1899 MacCartney-MacDonald line)
  [80.30, 33.10], [80.50, 33.50], [80.50, 34.00],

  // Aksai Chin east boundary (Karakoram watershed)
  [80.30, 34.60], [80.20, 35.10], [79.95, 35.60],

  // Aksai Chin north boundary / Kun Lun range foothills
  [79.60, 36.10], [79.20, 36.50], [78.80, 36.80],

  // North boundary — Karakoram Pass, meeting J&K claim
  [78.40, 37.00], [77.80, 37.05], [77.20, 36.90],

  // NW — Siachen Glacier / Karakoram ridge (joins J&K internal boundary)
  [77.10, 36.40], [77.10, 35.50], [77.00, 35.10],

  // West boundary back down to SW corner
  [76.95, 34.45], [76.82, 33.80], [76.90, 33.30],
  [76.87, 32.80], [76.77, 32.40],
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeFeature(name, hasc, hcKey, hcA2, polygon) {
  return {
    type: "Feature",
    id: `goi-${hcKey}`,
    properties: {
      hasc,
      name,
      "iso3166-2": hasc,
      "hc-group": "admin1",
      "hc-key": hcKey,
      "hc-a2": hcA2,
    },
    geometry: {
      type: "Polygon",
      coordinates: [[...polygon, polygon[0]]], // close ring
    },
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────

const raw = fs.readFileSync(INPUT, "utf8");
const geojson = JSON.parse(raw);

// Remove existing J&K and Ladakh features (they only show administered area)
const filtered = geojson.features.filter((f) => {
  const name = f.properties?.name || "";
  return name !== "Jammu and Kashmir" && name !== "Ladakh";
});

// Add GoI-compliant J&K and Ladakh
const jkFeature = makeFeature(
  "Jammu and Kashmir",
  "IN.JK",
  "in-jk",
  "JK",
  JK_GOI_POLYGON
);
const ladakhFeature = makeFeature(
  "Ladakh",
  "IN.LA",
  "in-la",
  "LA",
  LADAKH_GOI_POLYGON
);

const updated = {
  ...geojson,
  features: [...filtered, jkFeature, ladakhFeature],
};

fs.writeFileSync(OUTPUT, JSON.stringify(updated));
console.log(`✅ GoI-compliant GeoJSON written to ${OUTPUT}`);
console.log(`   Total features: ${updated.features.length}`);
console.log(`   J&K UT (incl. PoK/GB): ${JK_GOI_POLYGON.length} vertices`);
console.log(`   Ladakh UT (incl. Aksai Chin): ${LADAKH_GOI_POLYGON.length} vertices`);
console.log(`   J&K lon range: ${Math.min(...JK_GOI_POLYGON.map(p=>p[0])).toFixed(2)} – ${Math.max(...JK_GOI_POLYGON.map(p=>p[0])).toFixed(2)}`);
console.log(`   J&K lat range: ${Math.min(...JK_GOI_POLYGON.map(p=>p[1])).toFixed(2)} – ${Math.max(...JK_GOI_POLYGON.map(p=>p[1])).toFixed(2)}`);
console.log(`   Ladakh lon range: ${Math.min(...LADAKH_GOI_POLYGON.map(p=>p[0])).toFixed(2)} – ${Math.max(...LADAKH_GOI_POLYGON.map(p=>p[0])).toFixed(2)}`);
console.log(`   Ladakh lat range: ${Math.min(...LADAKH_GOI_POLYGON.map(p=>p[1])).toFixed(2)} – ${Math.max(...LADAKH_GOI_POLYGON.map(p=>p[1])).toFixed(2)}`);
