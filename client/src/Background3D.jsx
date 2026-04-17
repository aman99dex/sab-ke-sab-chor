import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { useRef, useMemo } from "react";

function Globe() {
  const globeRef = useRef();
  const ringRef = useRef();

  useFrame((_, delta) => {
    if (globeRef.current) globeRef.current.rotation.y += delta * 0.07;
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.05;
      ringRef.current.rotation.x += delta * 0.012;
    }
  });

  return (
    <group position={[4.5, 0.5, -4]}>
      {/* Core wireframe sphere */}
      <mesh ref={globeRef}>
        <icosahedronGeometry args={[2, 3]} />
        <meshBasicMaterial color="#6366f1" wireframe transparent opacity={0.1} />
      </mesh>
      {/* Inner solid glow */}
      <mesh>
        <sphereGeometry args={[1.96, 32, 32]} />
        <meshBasicMaterial color="#6366f1" transparent opacity={0.025} />
      </mesh>
      {/* Orbit ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 3.5, 0.5, 0]}>
        <torusGeometry args={[2.9, 0.012, 6, 80]} />
        <meshBasicMaterial color="#818cf8" transparent opacity={0.25} />
      </mesh>
      {/* Second tilt ring */}
      <mesh rotation={[Math.PI / 6, 1.2, 0]}>
        <torusGeometry args={[3.3, 0.008, 6, 80]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

function FloatingParticles() {
  const ref = useRef();
  const COUNT = 1800;

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);

    for (let i = 0; i < COUNT; i++) {
      // Spread particles in a wide hemisphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 5 + Math.random() * 18;

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12;

      // Gradient from purple (#6366f1) to blue (#3b82f6)
      const t = Math.random();
      col[i * 3] = 0.22 + t * 0.16;      // R
      col[i * 3 + 1] = 0.40 + t * 0.10; // G
      col[i * 3 + 2] = 0.95 - t * 0.33; // B
    }
    return [pos, col];
  }, []);

  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.getElapsedTime();
      ref.current.rotation.y = t * 0.006;
      ref.current.rotation.x = Math.sin(t * 0.004) * 0.08;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.055}
        vertexColors
        transparent
        opacity={0.55}
        sizeAttenuation
      />
    </points>
  );
}

function GridPlane() {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = -4 + (Math.sin(clock.getElapsedTime() * 0.3) * 0.3);
    }
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -4, 0]}>
      <planeGeometry args={[40, 40, 20, 20]} />
      <meshBasicMaterial color="#6366f1" wireframe transparent opacity={0.04} />
    </mesh>
  );
}

export default function Background3D() {
  return (
    <div className="canvas-bg">
      <Canvas
        camera={{ position: [0, 0, 9], fov: 55 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ background: "transparent" }}
        dpr={[1, 1.5]}
      >
        <Stars
          radius={90}
          depth={60}
          count={4500}
          factor={2.5}
          saturation={0}
          fade
          speed={0.4}
        />
        <Globe />
        <FloatingParticles />
        <GridPlane />
      </Canvas>
    </div>
  );
}
