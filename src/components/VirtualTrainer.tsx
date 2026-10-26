import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import type { AnimKey } from "@/components/ExerciseAnimation";
import { MOVES, type Move, type Pose } from "@/components/trainer-data";

const D = Math.PI / 180;
const SKIN = "#c8916b";
const SHIRT = "#151618";
const SHORTS = "#2a2c31";
const ACCENT = "#c6f432";

type RigKey = "root" | "torso" | "head" | "armL" | "armR" | "foreL" | "foreR" | "legL" | "legR" | "shinL" | "shinR";
type Rig = Partial<Record<RigKey, THREE.Group | null>>;

function Limb({ len, r, color }: { len: number; r: number; color: string }) {
  return (
    <mesh position={[0, -len / 2, 0]} castShadow>
      <capsuleGeometry args={[r, len - r * 2, 6, 14]} />
      <meshStandardMaterial color={color} roughness={0.55} />
    </mesh>
  );
}

function Person({ move }: { move: Move }) {
  const rig = useRef<Rig>({});
  const set = (k: RigKey) => (g: THREE.Group | null) => { rig.current[k] = g; };
  const db = move.props?.includes("dumbbells");

  useFrame(({ clock }) => {
    const t = (Math.sin((clock.elapsedTime / move.secs) * Math.PI * 2 - Math.PI / 2) + 1) / 2;
    const tR = move.alt ? 1 - t : t;
    const v = (k: keyof Pose, def: number, tt = t) => {
      const a = move.a[k] ?? def, b = move.b[k] ?? def;
      return a + (b - a) * tt;
    };
    const side = (k: keyof Pose, kR: keyof Pose, def: number) => {
      const a = move.a[kR] ?? move.a[k] ?? def, b = move.b[kR] ?? move.b[k] ?? def;
      return a + (b - a) * tR;
    };
    const r = rig.current;
    if (!r.root) return;
    r.root.position.y = v("y", 0.95);
    r.root.rotation.x = move.setup === "lie" ? -Math.PI / 2 : 0;
    r.torso!.rotation.x = v("lean", 0) * D;
    r.head!.position.z = v("headZ", 0);
    const sh = v("sh", 0) * D, roll = v("roll", 4) * D;
    r.armL!.rotation.set(-sh, 0, roll);
    r.armR!.rotation.set(-side("sh", "shR", 0) * D, 0, -roll);
    r.foreL!.rotation.x = -v("el", 5) * D;
    r.foreR!.rotation.x = -side("el", "elR", 5) * D;
    r.legL!.rotation.x = -v("hip", 0) * D;
    r.legR!.rotation.x = -side("hip", "hipR", 0) * D;
    r.shinL!.rotation.x = v("knee", 0) * D;
    r.shinR!.rotation.x = side("knee", "kneeR", 0) * D;
  });

  const arm = (s: 1 | -1, k: "L" | "R") => (
    <group ref={set(`arm${k}`)} position={[0.21 * s, 0.56, 0]}>
      <Limb len={0.3} r={0.055} color={SKIN} />
      <group ref={set(`fore${k}`)} position={[0, -0.3, 0]}>
        <Limb len={0.28} r={0.045} color={SKIN} />
        <mesh position={[0, -0.3, 0]}><sphereGeometry args={[0.045, 12, 12]} /><meshStandardMaterial color={SKIN} /></mesh>
        {db && (
          <group position={[0, -0.31, 0]} rotation-z={Math.PI / 2}>
            <mesh castShadow><cylinderGeometry args={[0.015, 0.015, 0.22]} /><meshStandardMaterial color="#888" metalness={0.8} roughness={0.3} /></mesh>
            {[-0.09, 0.09].map((y) => <mesh key={y} position={[0, y, 0]} castShadow><cylinderGeometry args={[0.05, 0.05, 0.05, 16]} /><meshStandardMaterial color="#222" /></mesh>)}
          </group>
        )}
      </group>
    </group>
  );
  const leg = (s: 1 | -1, k: "L" | "R") => (
    <group ref={set(`leg${k}`)} position={[0.1 * s, 0, 0]}>
      <Limb len={0.45} r={0.075} color={SHORTS} />
      <group ref={set(`shin${k}`)} position={[0, -0.45, 0]}>
        <Limb len={0.45} r={0.058} color={SKIN} />
        <mesh position={[0, -0.47, 0.06]} castShadow><boxGeometry args={[0.1, 0.06, 0.24]} /><meshStandardMaterial color="#eee" /></mesh>
      </group>
    </group>
  );

  return (
    <group ref={set("root")}>
      <mesh castShadow><sphereGeometry args={[0.15, 16, 16]} /><meshStandardMaterial color={SHORTS} /></mesh>
      {leg(1, "L")}{leg(-1, "R")}
      <group ref={set("torso")}>
        <mesh position={[0, 0.32, 0]} castShadow scale={[1, 1, 0.65]}>
          <capsuleGeometry args={[0.17, 0.32, 8, 16]} />
          <meshStandardMaterial color={SHIRT} roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.66, 0]}><cylinderGeometry args={[0.05, 0.06, 0.1]} /><meshStandardMaterial color={SKIN} /></mesh>
        <group ref={set("head")} position={[0, 0.82, 0]}>
          <mesh castShadow scale={[0.9, 1.05, 1]}><sphereGeometry args={[0.11, 24, 24]} /><meshStandardMaterial color={SKIN} roughness={0.5} /></mesh>
          <mesh position={[0, 0.04, -0.01]} scale={[0.93, 0.8, 1]}><sphereGeometry args={[0.112, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#1b130e" /></mesh>
        </group>
        {arm(1, "L")}{arm(-1, "R")}
      </group>
    </group>
  );
}

function Props({ move }: { move: Move }) {
  const p = move.props ?? [];
  return (
    <>
      {p.includes("bench") && (
        move.setup === "lie"
          ? <mesh position={[0, 0.25, -0.3]} castShadow receiveShadow><boxGeometry args={[0.4, 0.5, 1.2]} /><meshStandardMaterial color="#222" /></mesh>
          : <mesh position={[0, 0.2, 0]} castShadow receiveShadow><boxGeometry args={[0.45, 0.4, 0.45]} /><meshStandardMaterial color="#222" /></mesh>
      )}
      {p.includes("bar") && (
        <mesh position={[0, 2.25, 0]} rotation-z={Math.PI / 2}><cylinderGeometry args={[0.02, 0.02, 1.2]} /><meshStandardMaterial color="#999" metalness={0.8} roughness={0.3} /></mesh>
      )}
    </>
  );
}

const VIEWS = { Front: [0, 1.3, 3.6], Side: [3.6, 1.3, 0], "Close-up": [1.1, 1.5, 1.6] } as const;
type View = keyof typeof VIEWS;

function CameraRig({ view }: { view: View }) {
  const { camera } = useThree();
  useEffect(() => { const [x, y, z] = VIEWS[view]; camera.position.set(x, y, z); }, [view, camera]);
  return null;
}

export default function VirtualTrainer({ kind, name, cue }: { kind?: AnimKey | undefined; name: string; cue?: string | undefined }) {
  const [view, setView] = useState<View>("Front");
  const [spin, setSpin] = useState(false);
  const move = kind ? MOVES[kind] : undefined;
  if (!move) return null;

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-border bg-card sm:aspect-[6/5]">
        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 1.3, 3.6], fov: 40 }}>
          <color attach="background" args={["#17181c"]} />
          <ambientLight intensity={0.4} />
          <directionalLight position={[3, 5, 3]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
          <pointLight position={[-2, 2, -2]} intensity={6} color={ACCENT} />
          <Environment>
            <Lightformer intensity={2} position={[0, 5, 0]} scale={[10, 10, 1]} />
            <Lightformer intensity={1} color="#9ab" position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 1, 1]} />
          </Environment>
          <Person move={move} />
          <Props move={move} />
          <mesh rotation-x={-Math.PI / 2} receiveShadow><circleGeometry args={[2.5, 48]} /><meshStandardMaterial color="#202227" roughness={0.9} /></mesh>
          <gridHelper args={[5, 20, "#3a3d44", "#2a2c31"]} position={[0, 0.002, 0]} />
          <ContactShadows position={[0, 0.005, 0]} opacity={0.5} blur={2} scale={4} />
          <CameraRig view={view} />
          <OrbitControls makeDefault target={[0, 0.9, 0]} enablePan={false} minDistance={1.2} maxDistance={6} autoRotate={spin} autoRotateSpeed={2} />
        </Canvas>
        <div className="absolute left-3 top-3 flex gap-2">
          {(Object.keys(VIEWS) as View[]).map((v) => (
            <button key={v} onClick={() => setView(v)} className={`rounded-md px-3 py-1.5 font-mono text-xs uppercase ${view === v ? "bg-primary text-primary-foreground" : "bg-background/80 text-foreground"}`}>{v}</button>
          ))}
        </div>
        <button onClick={() => setSpin((s) => !s)} className={`absolute right-3 top-3 rounded-md px-3 py-1.5 font-mono text-xs uppercase ${spin ? "bg-primary text-primary-foreground" : "bg-background/80 text-foreground"}`}>360°</button>
        <p className="pointer-events-none absolute bottom-3 left-3 font-mono text-xs text-muted-foreground">Drag to rotate · pinch to zoom</p>
      </div>
      <div className="mt-5">
        <h3 className="text-2xl font-bold uppercase">{name}</h3>
        <p className="mt-2 font-mono text-sm text-primary">Target: {move.muscles}</p>
        {cue && <p className="mt-3 text-muted-foreground"><span className="text-foreground">Technique:</span> {cue}</p>}
        <p className="mt-2 text-muted-foreground"><span className="text-accent">Avoid:</span> {move.mistake}</p>
      </div>
    </div>
  );
}
