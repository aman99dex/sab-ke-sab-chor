import { useEffect, useRef, useState, useCallback } from "react";

// Projection tuned so the full GoI-claimed territory (north to ~37.2°N,
// west to ~72.8°E, including PoK + Aksai Chin) fits the viewBox.
const SCALE = 21;
const CX = 295;
const CY = 400;
const REF_LAT = 22.5;
const REF_LON = 82.5;

function project(lon, lat) {
  const x = (lon - REF_LON) * Math.cos((REF_LAT * Math.PI) / 180) * SCALE + CX;
  const y = -(lat - REF_LAT) * SCALE + CY;
  return [x, y];
}

function ringToPath(ring) {
  if (!ring || ring.length < 2) return "";
  const pts = ring.map(([lon, lat]) => project(lon, lat));
  return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(" ") + " Z";
}

function featureToPath(geometry) {
  if (!geometry) return "";
  if (geometry.type === "Polygon") {
    return geometry.coordinates.map(ringToPath).join(" ");
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates
      .map((poly) => poly.map(ringToPath).join(" "))
      .join(" ");
  }
  return "";
}

function getStateCentroid(geometry) {
  if (!geometry) return null;
  let ring = null;
  if (geometry.type === "Polygon") ring = geometry.coordinates[0];
  else if (geometry.type === "MultiPolygon") ring = geometry.coordinates[0][0];
  if (!ring || ring.length === 0) return null;

  let sumLon = 0, sumLat = 0;
  for (const [lon, lat] of ring) { sumLon += lon; sumLat += lat; }
  const [x, y] = project(sumLon / ring.length, sumLat / ring.length);
  return { x, y };
}

const STATE_COLORS = {
  "Uttar Pradesh": "#ef4444",
  "Maharashtra": "#f97316",
  "Bihar": "#eab308",
  "West Bengal": "#22c55e",
  "Rajasthan": "#06b6d4",
  "Madhya Pradesh": "#8b5cf6",
  "Gujarat": "#ec4899",
  "Karnataka": "#14b8a6",
  "Andhra Pradesh": "#f59e0b",
  "Odisha": "#10b981",
  "Telangana": "#6366f1",
  "Kerala": "#84cc16",
  "Jharkhand": "#fb923c",
  "Assam": "#a78bfa",
  "Punjab": "#38bdf8",
  "Chhattisgarh": "#f472b6",
  "Haryana": "#4ade80",
  "Uttarakhand": "#fb7185",
  "Himachal Pradesh": "#a3e635",
  // GoI-official names (match GeoJSON property)
  "Jammu and Kashmir": "#c084fc",
  "Ladakh": "#818cf8",
  "Delhi": "#fbbf24",
  "Tamil Nadu": "#2dd4bf",
  "default": "#0ea5e9",
};

function getStateColor(name) {
  return STATE_COLORS[name] || STATE_COLORS.default;
}

export default function IndiaMapSVG({ onStateClick }) {
  const [features, setFeatures] = useState([]);
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const svgRef = useRef(null);

  useEffect(() => {
    fetch("/maps/india-states-simplified.geojson")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load map");
        return r.json();
      })
      .then((data) => {
        const processed = (data.features || [])
          .filter((f) => f.geometry && f.properties?.name)
          .map((f) => ({
            id: f.id || f.properties["hc-key"] || f.properties.name,
            name: f.properties.name,
            path: featureToPath(f.geometry),
            centroid: getStateCentroid(f.geometry),
            color: getStateColor(f.properties.name),
          }))
          .filter((f) => f.path);
        setFeatures(processed);
      })
      .catch(() => setLoadError(true));
  }, []);

  const handleClick = useCallback(
    (name) => {
      setSelected(name);
      if (onStateClick) onStateClick(name);
    },
    [onStateClick]
  );

  if (loadError) {
    return (
      <div className="india-map-error">
        <span>Map data unavailable</span>
      </div>
    );
  }

  return (
    <div className="india-svg-wrap">
      <svg
        ref={svgRef}
        viewBox="0 0 600 760"
        className="india-svg"
        role="img"
        aria-label="Interactive India States Map"
      >
        <defs>
          <filter id="glow-state">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-strong">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="mapBg" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#0f2744" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>
        </defs>

        <rect width="600" height="760" fill="url(#mapBg)" rx="8" />

        {features.length === 0 && (
          <text x="300" y="380" textAnchor="middle" fill="#94a3b8" fontSize="14">
            Loading map...
          </text>
        )}

        {features.map((f) => {
          const isHovered = hovered === f.name;
          const isSelected = selected === f.name;
          const color = f.color;
          const opacity = isSelected ? 1 : isHovered ? 0.85 : 0.55;
          const strokeWidth = isSelected ? 1.5 : isHovered ? 1.2 : 0.6;
          const strokeColor = isSelected ? "#fff" : isHovered ? "#e2e8f0" : "#334155";

          return (
            <path
              key={f.id}
              d={f.path}
              fill={color}
              fillOpacity={opacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              filter={isSelected ? "url(#glow-strong)" : isHovered ? "url(#glow-state)" : "none"}
              style={{ cursor: "pointer", transition: "fill-opacity 0.2s, stroke-width 0.2s" }}
              onMouseEnter={() => setHovered(f.name)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => handleClick(f.name)}
            />
          );
        })}

        {features.map((f) => {
          const isHovered = hovered === f.name;
          const isSelected = selected === f.name;
          if (!f.centroid || (!isHovered && !isSelected)) return null;

          return (
            <text
              key={`label-${f.id}`}
              x={f.centroid.x}
              y={f.centroid.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="9"
              fill="#fff"
              fontWeight="700"
              style={{ pointerEvents: "none", textShadow: "0 1px 3px #000" }}
              filter="url(#glow-state)"
            >
              {f.name.length > 14 ? f.name.split(" ").slice(0, 2).join(" ") : f.name}
            </text>
          );
        })}
      </svg>

      {(hovered || selected) && (
        <div className="india-map-tooltip">
          <div className="map-tooltip-dot" style={{ background: getStateColor(hovered || selected) }} />
          <span>{hovered || selected}</span>
        </div>
      )}
    </div>
  );
}
