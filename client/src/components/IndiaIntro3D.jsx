import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState, Component } from "react";
import * as THREE from "three";

const MAP_SOURCE = "/maps/india-states-simplified.geojson";

class WebGLErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

function projectLonLat(lon, lat) {
  const refLat = 22.5;
  const x = (lon - 82.5) * Math.cos((refLat * Math.PI) / 180);
  const y = lat - refLat;
  return [x, y];
}

function buildStateSegments(geojson) {
  if (!geojson?.features?.length) return [];

  const rawSegments = [];
  const points = [];

  for (const feature of geojson.features) {
    const stateName = feature?.properties?.name || "Unknown State";
    const geometry = feature?.geometry;
    if (!geometry?.coordinates) continue;

    const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;

    polygons.forEach((polygonCoordinates, polygonIndex) => {
      if (!polygonCoordinates?.[0]?.length) return;

      const outer = polygonCoordinates[0];
      const shape = new THREE.Shape();
      outer.forEach(([lon, lat], pointIndex) => {
        const [x, y] = projectLonLat(lon, lat);
        points.push([x, y]);
        if (pointIndex === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      });
      shape.closePath();

      for (let i = 1; i < polygonCoordinates.length; i += 1) {
        const holeCoordinates = polygonCoordinates[i];
        if (!holeCoordinates?.length) continue;
        const hole = new THREE.Path();
        holeCoordinates.forEach(([lon, lat], pointIndex) => {
          const [x, y] = projectLonLat(lon, lat);
          points.push([x, y]);
          if (pointIndex === 0) hole.moveTo(x, y);
          else hole.lineTo(x, y);
        });
        hole.closePath();
        shape.holes.push(hole);
      }

      rawSegments.push({
        stateName,
        shape,
        key: `${stateName}-${polygonIndex}`,
      });
    });
  }

  if (points.length === 0) return [];

  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const span = Math.max(maxX - minX, maxY - minY) || 1;
  const scale = 10.8 / span;

  return rawSegments.map((segment) => ({
    ...segment,
    centerX,
    centerY,
    scale,
  }));
}

function StateMesh({ segment, focused, selectedState, hoveredState, setHoveredState, setSelectedState }) {
  const meshRef = useRef(null);

  const geometry = useMemo(() => {
    const extrude = new THREE.ExtrudeGeometry(segment.shape, {
      depth: 0.44,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.035,
      bevelThickness: 0.05,
      steps: 1,
    });

    extrude.translate(-segment.centerX, -segment.centerY, -0.22);
    extrude.scale(segment.scale, segment.scale, 1);
    return extrude;
  }, [segment]);

  const edgeGeometry = useMemo(() => {
    const edges = new THREE.EdgesGeometry(geometry, 30);
    return edges;
  }, [geometry]);

  const isSelected = selectedState === segment.stateName;
  const isHovered = hoveredState === segment.stateName;

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const targetZ = isSelected ? 0.3 : isHovered ? 0.15 : 0;
    meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, targetZ, 0.15);
    meshRef.current.material.emissiveIntensity = THREE.MathUtils.lerp(
      meshRef.current.material.emissiveIntensity,
      isSelected ? 0.72 : focused ? 0.24 + Math.sin(t * 1.4 + segment.centerX) * 0.04 : 0.16,
      0.12
    );
  });

  const color = isSelected ? "#ef4444" : isHovered ? "#f97316" : focused ? "#0ea5e9" : "#14b8a6";
  const emissive = isSelected ? "#7f1d1d" : isHovered ? "#9a3412" : "#0f172a";

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={geometry}
        onPointerOver={(event) => {
          event.stopPropagation();
          setHoveredState(segment.stateName);
        }}
        onPointerOut={() => setHoveredState(null)}
        onClick={(event) => {
          event.stopPropagation();
          setSelectedState(segment.stateName);
        }}
      >
        <meshStandardMaterial color={color} emissive={emissive} metalness={0.42} roughness={0.3} emissiveIntensity={0.2} />
      </mesh>
      <lineSegments geometry={edgeGeometry}>
        <lineBasicMaterial color="#bae6fd" transparent opacity={0.35} />
      </lineSegments>
    </group>
  );
}

function IndiaStatesMap({ segments, focused, selectedState, hoveredState, setHoveredState, setSelectedState }) {
  const groupRef = useRef(null);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * (focused ? 0.045 : 0.02);
    groupRef.current.rotation.x = -0.45 + Math.sin(clock.getElapsedTime() * 0.4) * 0.02;

    const targetScale = focused ? 1.16 : 1;
    const next = THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, 0.06);
    groupRef.current.scale.set(next, next, next);
  });

  return (
    <group ref={groupRef} position={[0, 0.45, 0]}>
      {segments.map((segment) => (
        <StateMesh
          key={segment.key}
          segment={segment}
          focused={focused}
          selectedState={selectedState}
          hoveredState={hoveredState}
          setHoveredState={setHoveredState}
          setSelectedState={setSelectedState}
        />
      ))}
    </group>
  );
}

function SceneCamera({ focused, isExiting }) {
  const { camera } = useThree();
  const far = useMemo(() => new THREE.Vector3(0, 0.5, 15), []);
  const near = useMemo(() => new THREE.Vector3(0.06, 0.2, 7), []);
  const dive = useMemo(() => new THREE.Vector3(0.08, 0.0, 4.1), []);

  useFrame(() => {
    const target = isExiting ? dive : focused ? near : far;
    camera.position.lerp(target, isExiting ? 0.07 : 0.05);
    camera.lookAt(0, 0.2, 0);
  });

  return null;
}

function IntroCanvas({ segments, focused, isExiting, selectedState, hoveredState, setHoveredState, setSelectedState }) {
  return (
    <Canvas camera={{ position: [0, 0.5, 15], fov: 40 }} dpr={[1, 1.6]} gl={{ failIfMajorPerformanceCaveat: false }}>
      <fog attach="fog" args={["#020617", 8, 28]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[9, 10, 6]} intensity={1.15} color="#f8fafc" />
      <pointLight position={[-7, -2, 5]} intensity={0.95} color="#ef4444" />
      <pointLight position={[8, 1, 5]} intensity={0.72} color="#38bdf8" />

      <Stars radius={95} depth={48} count={4800} factor={3.4} saturation={0} fade speed={0.8} />
      {segments.length > 0 && (
        <IndiaStatesMap
          segments={segments}
          focused={focused || isExiting}
          selectedState={selectedState}
          hoveredState={hoveredState}
          setHoveredState={setHoveredState}
          setSelectedState={setSelectedState}
        />
      )}
      <SceneCamera focused={focused} isExiting={isExiting} />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        maxPolarAngle={Math.PI / 1.55}
        minPolarAngle={Math.PI / 2.55}
        autoRotate={!focused && !isExiting}
        autoRotateSpeed={0.22}
      />
    </Canvas>
  );
}

export default function IndiaIntro3D({ onEnter, isExiting }) {
  const [focused, setFocused] = useState(false);
  const [launchQueued, setLaunchQueued] = useState(false);
  const [segments, setSegments] = useState([]);
  const [selectedState, setSelectedState] = useState(null);
  const [hoveredState, setHoveredState] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMapData() {
      try {
        const response = await fetch(MAP_SOURCE);
        if (!response.ok) throw new Error("Could not load India map data");
        const geojson = await response.json();
        if (!cancelled) {
          setSegments(buildStateSegments(geojson));
        }
      } catch {
        if (!cancelled) {
          setSegments([]);
        }
      }
    }

    loadMapData();
    return () => {
      cancelled = true;
    };
  }, []);

  const triggerLaunch = () => {
    if (launchQueued || isExiting) return;
    setFocused(true);
    setLaunchQueued(true);
    setTimeout(() => {
      onEnter();
    }, 900);
  };

  const activeState = hoveredState || selectedState;

  return (
    <section className="india-intro-wrap">
      <div className="india-intro-canvas">
        <WebGLErrorBoundary fallback={<div className="india-intro-canvas-fallback" />}>
          <IntroCanvas
            segments={segments}
            focused={focused}
            isExiting={isExiting}
            selectedState={selectedState}
            hoveredState={hoveredState}
            setHoveredState={setHoveredState}
            setSelectedState={(stateName) => {
              setSelectedState(stateName);
              setFocused(true);
            }}
          />
        </WebGLErrorBoundary>
      </div>

      <div className="india-intro-overlay">
        <div className="intro-badge">National Crime Intelligence Grid</div>
        <h1>
          {focused || isExiting
            ? "Entering criminal network heatmap..."
            : "Click any state. Dive into the crime map."}
        </h1>
        <p>
          State-level mesh loaded from boundary data. Inspect hotspots, then launch into live allegations and investigations.
        </p>

        {activeState && <div className="state-preview-chip">Focused state: {activeState}</div>}

        <div className="intro-actions">
          <button className="btn-primary" onClick={triggerLaunch}>
            Launch Dashboard
          </button>
          {!focused && !isExiting && (
            <button className="btn-ghost" onClick={() => setFocused(true)}>
              Zoom All States
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
