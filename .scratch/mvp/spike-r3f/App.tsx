import { Canvas, useFrame } from "@react-three/fiber/native";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import * as THREE from "three";

const PARTICLE_COUNT = 192;
const BURST_COUNT = 4;
const LOOP_SECONDS = 10;
const POOL_SIZE = 4;

type Burst = {
  age: number;
  origin: THREE.Vector3;
  active: boolean;
};

function Fortress() {
  const geometry = useMemo(() => new THREE.BoxGeometry(1.7, 1.1, 1.7), []);
  const battlement = useMemo(() => new THREE.BoxGeometry(0.3, 0.45, 0.3), []);
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#b45309", roughness: 0.9 }),
    [],
  );
  const towerPositions = useMemo(
    () => [
      [-0.68, 0.78, -0.68],
      [0.68, 0.78, -0.68],
      [-0.68, 0.78, 0.68],
      [0.68, 0.78, 0.68],
    ] as const,
    [],
  );
  return (
    <group>
      <mesh geometry={geometry} material={material} position={[0, 0.55, 0]} />
      {towerPositions.map((position, index) => (
        <mesh key={index} geometry={battlement} material={material} position={position} />
      ))}
    </group>
  );
}

function ShieldDome({ opacity }: { opacity: number }) {
  const geometry = useMemo(
    () => new THREE.SphereGeometry(1.55, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    [],
  );
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#38bdf8",
        transparent: true,
        opacity,
        side: THREE.DoubleSide,
        wireframe: true,
      }),
    [],
  );
  material.opacity = opacity;
  return <mesh geometry={geometry} material={material} position={[0, 0.42, 0]} />;
}

function Projectiles({ launch }: { launch: number }) {
  const refs = useRef<Array<THREE.Mesh | null>>([]);
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(0.11, 0), []);
  const material = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#fef08a" }),
    [],
  );
  useFrame(({ clock }) => {
    const time = (clock.getElapsedTime() + launch) % 2.1;
    refs.current.forEach((mesh, index) => {
      if (!mesh) return;
      const phase = (time + index * 0.53) % 2.1;
      const progress = Math.min(1, phase / 1.1);
      mesh.position.set(-3 + progress * 3, 1.15 - progress * 0.45, 0);
      mesh.visible = phase < 1.35;
    });
  });
  return (
    <group>
      {Array.from({ length: POOL_SIZE }, (_, index) => (
        <mesh
          key={index}
          ref={(mesh) => {
            refs.current[index] = mesh;
          }}
          geometry={geometry}
          material={material}
        />
      ))}
    </group>
  );
}

function BurstParticles({ bursts }: { bursts: React.MutableRefObject<Burst[]> }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(0.045, 0), []);
  const material = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#fb7185", transparent: true }),
    [],
  );
  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;
    let slot = 0;
    bursts.current.forEach((burst) => {
      if (!burst.active) return;
      const progress = burst.age / 0.7;
      for (let i = 0; i < PARTICLE_COUNT / BURST_COUNT; i += 1) {
        const angle = (i / (PARTICLE_COUNT / BURST_COUNT)) * Math.PI * 2;
        const radius = progress * (0.6 + (i % 7) * 0.06);
        dummy.position.set(
          burst.origin.x + Math.cos(angle) * radius,
          burst.origin.y + Math.sin(angle * 1.7) * radius,
          burst.origin.z + Math.sin(angle) * radius,
        );
        dummy.scale.setScalar(Math.max(0, 1 - progress));
        dummy.updateMatrix();
        mesh.setMatrixAt(slot, dummy.matrix);
        slot += 1;
      }
    });
    while (slot < PARTICLE_COUNT) {
      dummy.scale.setScalar(0);
      dummy.updateMatrix();
      mesh.setMatrixAt(slot, dummy.matrix);
      slot += 1;
    }
    mesh.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, PARTICLE_COUNT]}
      frustumCulled={false}
    />
  );
}

function Scene({ onFps }: { onFps: (fps: number, frameTime: number) => void }) {
  const startedAt = useRef(0);
  const lastFrame = useRef(0);
  const frameTimes = useRef<number[]>([]);
  const launch = useRef(0);
  const bursts = useRef<Burst[]>(
    Array.from({ length: BURST_COUNT }, () => ({
      age: 1,
      origin: new THREE.Vector3(0, 0.8, 0),
      active: false,
    })),
  );
  const [shieldOpacity, setShieldOpacity] = useState(0.3);

  useEffect(() => {
    startedAt.current = performance.now();
    lastFrame.current = startedAt.current;
  }, []);

  useFrame(() => {
    const now = performance.now();
    const elapsed = (now - startedAt.current) / 1000;
    const frameTime = now - lastFrame.current;
    lastFrame.current = now;
    frameTimes.current.push(frameTime);
    if (frameTimes.current.length > 60) frameTimes.current.shift();
    if (elapsed > LOOP_SECONDS) return;

    const cycle = elapsed % 2.1;
    if (cycle < 0.05) {
      launch.current = elapsed;
      const burst = bursts.current[Math.floor(elapsed / 2.1) % BURST_COUNT];
      burst.age = 0;
      burst.active = true;
      burst.origin.set(0, 0.8, 0);
      setShieldOpacity(0.08);
    }
    bursts.current.forEach((burst) => {
      if (!burst.active) return;
      burst.age += frameTime / 1000;
      if (burst.age > 0.7) burst.active = false;
    });
    if (cycle > 0.7 && cycle < 0.75) setShieldOpacity(0.3);

    if (frameTimes.current.length === 60) {
      const average = frameTimes.current.reduce((sum, value) => sum + value, 0) / 60;
      onFps(1000 / average, average);
    }
  });

  return (
    <>
      <color attach="background" args={["#07111f"]} />
      <ambientLight intensity={1.3} />
      <directionalLight position={[2, 5, 3]} intensity={2} />
      <Fortress />
      <ShieldDome opacity={shieldOpacity} />
      <Projectiles launch={launch.current} />
      <BurstParticles bursts={bursts} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[9, 9]} />
        <meshStandardMaterial color="#164e63" />
      </mesh>
    </>
  );
}

function readHeapMB(): string {
  const memory = (
    globalThis as typeof globalThis & {
      performance?: Performance & {
        memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number };
      };
    }
  ).performance?.memory;
  return memory ? `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(1)} MB JS` : "native heap: n/a";
}

export default function App() {
  const [metrics, setMetrics] = useState({ fps: 0, frameTime: 0 });
  const [heap, setHeap] = useState(readHeapMB());

  useEffect(() => {
    const timer = setInterval(() => setHeap(readHeapMB()), 500);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <Canvas camera={{ position: [0, 2.4, 6.2], fov: 42 }} frameloop="always">
        <Scene onFps={(fps, frameTime) => setMetrics({ fps, frameTime })} />
      </Canvas>
      <View pointerEvents="none" style={styles.readout}>
        <Text style={styles.title}>R3F release spike</Text>
        <Text style={styles.metric}>FPS {metrics.fps.toFixed(1)}</Text>
        <Text style={styles.metric}>frame {metrics.frameTime.toFixed(2)} ms</Text>
        <Text style={styles.metric}>{heap}</Text>
        <Text style={styles.metric}>loop {LOOP_SECONDS}s · pooled burst {PARTICLE_COUNT}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#07111f" },
  readout: {
    position: "absolute",
    top: 52,
    left: 16,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "rgba(3, 7, 18, 0.82)",
  },
  title: { color: "#f8fafc", fontWeight: "700", marginBottom: 4 },
  metric: { color: "#bae6fd", fontVariant: ["tabular-nums"], fontSize: 12 },
});
