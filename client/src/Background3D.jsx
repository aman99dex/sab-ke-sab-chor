import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { useMemo, useRef, Component } from "react";

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

function SirenLights({ mode }) {
  const redRef = useRef(null);
  const blueRef = useRef(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (redRef.current) {
      redRef.current.position.x = Math.sin(t * 0.6) * 6;
      redRef.current.position.z = 6 + Math.cos(t * 0.5) * 2;
      redRef.current.intensity = mode === "intro" ? 1.8 : 1.25;
    }
    if (blueRef.current) {
      blueRef.current.position.x = Math.cos(t * 0.52 + 1.8) * 6;
      blueRef.current.position.z = 5 + Math.sin(t * 0.4) * 2;
      blueRef.current.intensity = mode === "intro" ? 1.4 : 1.0;
    }
  });

  return (
    <>
      <pointLight ref={redRef} color="#ef4444" distance={28} decay={1.8} intensity={1.4} position={[5, 2, 6]} />
      <pointLight ref={blueRef} color="#38bdf8" distance={24} decay={2} intensity={1.0} position={[-5, 1, 5]} />
    </>
  );
}

function EvidenceRain() {
  const ref = useRef(null);
  const count = 1700;

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 34;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 2] = -Math.random() * 24;

      const t = Math.random();
      col[i * 3] = 0.6 + t * 0.3;
      col[i * 3 + 1] = 0.12 + t * 0.38;
      col[i * 3 + 2] = 0.12 + (1 - t) * 0.68;
    }

    return [pos, col];
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.rotation.y = t * 0.018;
    ref.current.position.y = Math.sin(t * 0.23) * 0.5;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.045} vertexColors transparent opacity={0.56} sizeAttenuation />
    </points>
  );
}

function CrimeGrid() {
  const groupRef = useRef(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.rotation.z = Math.sin(t * 0.07) * 0.04;
    groupRef.current.position.y = -3 + Math.sin(t * 0.3) * 0.2;
  });

  return (
    <group ref={groupRef}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, -4]}>
        <planeGeometry args={[56, 56, 32, 32]} />
        <meshBasicMaterial color="#ef4444" wireframe transparent opacity={0.05} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.2, -4]}>
        <planeGeometry args={[56, 56, 18, 18]} />
        <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.04} />
      </mesh>
    </group>
  );
}

function WireNodes() {
  const group = useRef(null);
  const nodes = useMemo(
    () => [
      [-5, 1.5, -8],
      [-2, 0.6, -6],
      [1, 1.3, -7],
      [4, 0.2, -8],
      [-3, -0.9, -9],
      [2.4, -1.1, -10],
      [0, 2.2, -9],
    ],
    []
  );

  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.08) * 0.18;
  });

  return (
    <group ref={group}>
      {nodes.map((node, index) => (
        <mesh key={`${node.join("-")}-${index}`} position={node}>
          <sphereGeometry args={[0.11, 18, 18]} />
          <meshStandardMaterial
            color={index % 2 === 0 ? "#ef4444" : "#38bdf8"}
            emissive={index % 2 === 0 ? "#b91c1c" : "#0369a1"}
            emissiveIntensity={0.65}
          />
        </mesh>
      ))}
    </group>
  );
}

function Background3DCanvas({ mode }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 10], fov: 54 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance", failIfMajorPerformanceCaveat: false }}
      style={{ background: "transparent" }}
      dpr={[1, 1.5]}
    >
      <fog attach="fog" args={["#020617", 9, 34]} />
      <ambientLight intensity={0.24} />
      <directionalLight position={[3, 9, 6]} intensity={0.54} color="#e2e8f0" />

      <Stars radius={95} depth={52} count={3400} factor={2.8} saturation={0} fade speed={0.3} />
      <SirenLights mode={mode} />
      <EvidenceRain />
      <CrimeGrid />
      <WireNodes />
    </Canvas>
  );
}

export default function Background3D({ mode = "app" }) {
  return (
    <div className="canvas-bg">
      <WebGLErrorBoundary fallback={<div className="canvas-bg-fallback" />}>
        <Background3DCanvas mode={mode} />
      </WebGLErrorBoundary>
    </div>
  );
}
