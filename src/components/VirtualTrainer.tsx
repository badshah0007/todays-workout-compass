import { Suspense, useEffect, useMemo, useRef, useState, Component, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, ContactShadows, useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { AnimKey } from "@/components/ExerciseAnimation";
import { FOCUS, MOVES, REGION_LABEL, type Move, type Pose, type Region } from "@/components/trainer-data";

const D = Math.PI / 180;
// GLTFLoader strips dots from node names ("spine.001" -> "spine001").
const norm = (s: string) => s.replace(/\./g, "");
const MODEL_URL = "/models/trainer.glb"; // CC0 male base mesh (BoQsc / orange-juice-games), Rigify skeleton
const SKIN = new THREE.Color("#b9825f");
const SHIRT = new THREE.Color("#141518");
const SHORTS = new THREE.Color("#2b2e35");

/* ---------- shared playback state (mutated per frame, read by UI at low rate) ---------- */
type Playback = { phase: number; playing: boolean; speed: number; scrub: number | null };

/* ---------- invisible guide skeleton: computes joint directions from pose angles ---------- */
type Guide = Record<"root" | "torso" | "armL" | "armR" | "foreL" | "foreR" | "legL" | "legR" | "shinL" | "shinR", THREE.Object3D>;
function makeGuide(): Guide {
  const o = () => new THREE.Object3D();
  const g = { root: o(), torso: o(), armL: o(), armR: o(), foreL: o(), foreR: o(), legL: o(), legR: o(), shinL: o(), shinR: o() };
  g.root.add(g.torso, g.legL, g.legR);
  g.torso.add(g.armL, g.armR);
  g.armL.add(g.foreL); g.armR.add(g.foreR);
  g.legL.add(g.shinL); g.legR.add(g.shinR);
  return g;
}

function applyPose(g: Guide, move: Move, t: number) {
  const tR = move.alt ? 1 - t : t;
  const v = (k: keyof Pose, def: number) => { const a = move.a[k] ?? def, b = move.b[k] ?? def; return a + (b - a) * t; };
  const side = (k: keyof Pose, kR: keyof Pose, def: number) => {
    const a = move.a[kR] ?? move.a[k] ?? def, b = move.b[kR] ?? move.b[k] ?? def; return a + (b - a) * tR;
  };
  g.root.position.set(0, v("y", 0.95), 0);
  g.root.rotation.set(move.setup === "lie" ? -Math.PI / 2 : 0, 0, 0);
  g.torso.rotation.set(v("lean", 0) * D, 0, 0);
  const roll = v("roll", 6) * D;
  g.armL.rotation.set(-v("sh", 0) * D, 0, roll);
  g.armR.rotation.set(-side("sh", "shR", 0) * D, 0, -roll);
  g.foreL.rotation.set(-v("el", 8) * D, 0, 0);
  g.foreR.rotation.set(-side("el", "elR", 8) * D, 0, 0);
  g.legL.rotation.set(-v("hip", 0) * D, 0, 0.03);
  g.legR.rotation.set(-side("hip", "hipR", 0) * D, 0, -0.03);
  g.shinL.rotation.set(v("knee", 0) * D, 0, 0);
  g.shinR.rotation.set(side("knee", "kneeR", 0) * D, 0, 0);
  g.root.updateMatrixWorld(true);
  return v("headZ", 0);
}

const _q = new THREE.Quaternion(), _pq = new THREE.Quaternion(), _y = new THREE.Vector3(), _d = new THREE.Vector3();
const DOWN = new THREE.Vector3(0, -1, 0), UP = new THREE.Vector3(0, 1, 0);
function dirOf(o: THREE.Object3D, base: THREE.Vector3, out: THREE.Vector3) {
  return out.copy(base).applyQuaternion(o.getWorldQuaternion(_q)).normalize();
}
/** Rotate bone (from its rest local rotation) so its +Y axis points along world direction d. */
function aim(bone: THREE.Bone, rest: THREE.Quaternion, d: THREE.Vector3) {
  bone.quaternion.copy(rest);
  bone.parent!.getWorldQuaternion(_pq);
  const worldQ = _pq.clone().multiply(rest);
  _y.set(0, 1, 0).applyQuaternion(worldQ);
  const delta = new THREE.Quaternion().setFromUnitVectors(_y, d);
  bone.quaternion.copy(_pq.invert().multiply(delta.multiply(worldQ)));
  bone.updateMatrixWorld(true);
}

/* ---------- body regions → bones (+ front/back split for torso) ---------- */
const REGION_BONES: Record<Region, { bones: string[]; zSide?: 1 | -1 }> = {
  chest: { bones: ["spine.003", "spine.002"], zSide: 1 },
  upperBack: { bones: ["spine.003", "spine.002", "shoulder.L", "shoulder.R"], zSide: -1 },
  core: { bones: ["spine.001", "spine.002"], zSide: 1 },
  shoulders: { bones: ["shoulder.L", "shoulder.R", "upper_arm.L", "upper_arm.R"] },
  upperArms: { bones: ["upper_arm.L", "upper_arm.R"] },
  forearms: { bones: ["forearm.L", "forearm.R", "hand.L", "hand.R"] },
  glutes: { bones: ["spine", "pelvis.L", "pelvis.R", "thigh.L", "thigh.R"], zSide: -1 },
  thighs: { bones: ["thigh.L", "thigh.R"] },
  calves: { bones: ["shin.L", "shin.R"] },
  neck: { bones: ["spine.004", "spine.005"] },
};

type Rigged = {
  root: THREE.Group; mesh: THREE.SkinnedMesh; bones: Record<string, THREE.Bone>; rest: Record<string, THREE.Quaternion>;
  hipOffset: THREE.Vector3; glow: { value: number }; base: Float32Array; centerZ: number; scale: number;
};

function useRiggedTrainer(): Rigged {
  const gltf = useGLTF(MODEL_URL);
  return useMemo(() => {
    // Clone so repeated memo runs (StrictMode / remounts) never share or re-scale one scene.
    const scene = cloneSkinned(gltf.scene);
    let mesh: THREE.SkinnedMesh | undefined;
    scene.traverse((o) => { if ((o as THREE.SkinnedMesh).isSkinnedMesh) mesh = o as THREE.SkinnedMesh; });
    if (!mesh) throw new Error("Trainer model has no skinned mesh");
    const box = new THREE.Box3().setFromObject(scene);
    const scale = 1.78 / (box.max.y - box.min.y);
    scene.scale.setScalar(scale);
    scene.position.set(0, 0, 0);
    scene.rotation.set(0, -Math.PI / 2, 0); // source rig faces +X; turn it to face +Z like the guide
    scene.updateMatrixWorld(true);

    const bones: Record<string, THREE.Bone> = {}, rest: Record<string, THREE.Quaternion> = {};
    mesh.skeleton.bones.forEach((b) => { bones[norm(b.name)] = b; rest[norm(b.name)] = b.quaternion.clone(); });
    const hipOffset = bones[norm("spine")]!.getWorldPosition(new THREE.Vector3());

    // Vertex colors (skin / tank top / shorts) from dominant bone weight
    const geo = mesh.geometry;
    geo.computeVertexNormals();
    const pos = geo.attributes["position"]!, si = geo.attributes["skinIndex"]!, sw = geo.attributes["skinWeight"]!;
    const names = mesh.skeleton.bones.map((b) => norm(b.name));
    const gb = new THREE.Box3().setFromBufferAttribute(pos as THREE.BufferAttribute);
    const h = gb.max.y - gb.min.y;
    const colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      let best = 0, bw = -1;
      for (let k = 0; k < 4; k++) { const w = sw.getComponent(i, k); if (w > bw) { bw = w; best = si.getComponent(i, k); } }
      const n = names[best] ?? "";
      const y = (pos.getY(i) - gb.min.y) / h;
      let c = SKIN;
      if (/^spine00[123]$/.test(n) && y < 0.8) c = SHIRT;
      else if ((n === "spine" || n.startsWith("pelvis") || n.startsWith("thigh")) && y > 0.42) c = SHORTS;
      colors.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors.slice(), 3));
    geo.setAttribute("aGlow", new THREE.BufferAttribute(new Float32Array(pos.count), 1));

    const glow = { value: 0 };
    const mat = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.48, metalness: 0, sheen: 0.6, sheenRoughness: 0.5, sheenColor: new THREE.Color("#ffd9c2"), clearcoat: 0.15, clearcoatRoughness: 0.6 });
    mesh.material = mat;
    mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;

    const root = new THREE.Group();
    root.add(scene);
    return { root, mesh, bones, rest, hipOffset, glow, base: colors, centerZ: (gb.max.z + gb.min.z) / 2, scale };
  }, [gltf]);
}

function paintRegions(r: Rigged, focus: { p: Region[]; s: Region[] }) {
  const geo = r.mesh.geometry;
  const attr = geo.attributes["aGlow"] as THREE.BufferAttribute;
  const pos = geo.attributes["position"]!, si = geo.attributes["skinIndex"]!, sw = geo.attributes["skinWeight"]!;
  const names = r.mesh.skeleton.bones.map((b) => norm(b.name));
  for (let i = 0; i < pos.count; i++) {
    let g = 0;
    const z = pos.getZ(i) - r.centerZ;
    for (const [level, list] of [[1, focus.p], [0.4, focus.s]] as const) {
      for (const reg of list) {
        const def = REGION_BONES[reg];
        if (def.zSide && Math.sign(z) !== def.zSide) continue;
        let w = 0;
        for (let k = 0; k < 4; k++) if (def.bones.map(norm).includes(names[si.getComponent(i, k)] ?? "")) w += sw.getComponent(i, k);
        g = Math.max(g, Math.min(1, w * 1.3) * level);
      }
    }
    attr.setX(i, g);
  }
  attr.needsUpdate = true;
}

function Trainer({ move, kind, pb }: { move: Move; kind: AnimKey; pb: React.MutableRefObject<Playback> }) {
  const r = useRiggedTrainer();
  const guide = useMemo(makeGuide, []);
  const dbL = useRef<THREE.Group>(null), dbR = useRef<THREE.Group>(null);
  const focus = FOCUS[kind];
  const db = move.props?.includes("dumbbells");
  useEffect(() => { paintRegions(r, focus); }, [r, focus]);
  useEffect(() => { (globalThis as any).__tr = r; }, [r]);

  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    const p = pb.current;
    if (p.scrub != null) p.phase = p.scrub;
    else if (p.playing) p.phase = (p.phase + (dt * p.speed) / move.secs) % 1;
    const t = (1 - Math.cos(p.phase * Math.PI * 2)) / 2; // ease in/out between pose a and b
    const headZ = applyPose(guide, move, t);

    const effort = focus.effortAtB === false ? 1 - t : t;
    r.glow.value = 0.35 + 0.65 * effort;
    // tint active muscles toward lime, brighter as the muscle works harder
    const col = r.mesh.geometry.attributes["color"] as THREE.BufferAttribute, ga = r.mesh.geometry.attributes["aGlow"] as THREE.BufferAttribute;
    const arr = col.array as Float32Array, gl = r.glow.value;
    for (let i = 0; i < ga.count; i++) {
      const a = ga.getX(i) * gl;
      arr[i * 3] = r.base[i * 3]! * (1 - a * 0.6) + 0.55 * a;
      arr[i * 3 + 1] = r.base[i * 3 + 1]! * (1 - a * 0.6) + 0.95 * a;
      arr[i * 3 + 2] = r.base[i * 3 + 2]! * (1 - a * 0.6) + 0.1 * a;
    }
    col.needsUpdate = true;

    // place hips at the guide root
    r.root.position.copy(guide.root.position).sub(r.hipOffset);
    r.root.updateMatrixWorld(true);
    const B = r.bones, R = r.rest, tmp = new THREE.Vector3();
    const torsoUp = dirOf(guide.torso, UP, new THREE.Vector3());
    const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(guide.torso.getWorldQuaternion(new THREE.Quaternion()));
    const hipsUp = dirOf(guide.root, UP, new THREE.Vector3()).lerp(torsoUp, 0.35).normalize();
    aim(B[norm("spine")]!, R[norm("spine")]!, hipsUp);
    for (const [n, f] of [["spine.001", 0.6], ["spine.002", 0.85], ["spine.003", 1]] as const)
      aim(B[norm(n)]!, R[norm(n)]!, tmp.copy(hipsUp).lerp(torsoUp, f).normalize());
    const headDir = new THREE.Vector3().copy(torsoUp).addScaledVector(fwd, headZ * 4).normalize();
    aim(B[norm("spine.004")]!, R[norm("spine.004")]!, headDir);
    aim(B[norm("spine.005")]!, R[norm("spine.005")]!, headDir);
    for (const s of ["L", "R"] as const) {
      B[norm(`shoulder.${s}`)]!.updateMatrixWorld(true);
      aim(B[norm(`upper_arm.${s}`)]!, R[norm(`upper_arm.${s}`)]!, dirOf(guide[`arm${s}`], DOWN, tmp));
      aim(B[norm(`forearm.${s}`)]!, R[norm(`forearm.${s}`)]!, dirOf(guide[`fore${s}`], DOWN, tmp));
      B[norm(`pelvis.${s}`)]?.updateMatrixWorld(true);
      aim(B[norm(`thigh.${s}`)]!, R[norm(`thigh.${s}`)]!, dirOf(guide[`leg${s}`], DOWN, tmp));
      aim(B[norm(`shin.${s}`)]!, R[norm(`shin.${s}`)]!, dirOf(guide[`shin${s}`], DOWN, tmp));
    }
    if (db) {
      for (const [ref, s] of [[dbL, "L"], [dbR, "R"]] as const) {
        const g = ref.current; if (!g) continue;
        B[norm(`hand.${s}`)]!.getWorldPosition(g.position);
        g.quaternion.copy(guide[`fore${s}`].getWorldQuaternion(_q));
      }
    }
  });

  return (
    <>
      <primitive object={r.root} />
      {db && [dbL, dbR].map((ref, i) => (
        <group key={i} ref={ref}>
          <group position={[0, -0.05, 0]} rotation-z={Math.PI / 2}>
            <mesh castShadow><cylinderGeometry args={[0.014, 0.014, 0.24, 12]} /><meshStandardMaterial color="#9a9ca2" metalness={0.9} roughness={0.25} /></mesh>
            {[-0.09, 0.09].map((y) => <mesh key={y} position={[0, y, 0]} castShadow><cylinderGeometry args={[0.055, 0.055, 0.05, 6]} /><meshStandardMaterial color="#1c1d20" roughness={0.6} /></mesh>)}
          </group>
        </group>
      ))}
    </>
  );
}

function Props({ move }: { move: Move }) {
  const p = move.props ?? [];
  const pad = <meshStandardMaterial color="#1a1b1e" roughness={0.7} />;
  const steel = <meshStandardMaterial color="#8c8f96" metalness={0.9} roughness={0.3} />;
  return (
    <>
      {p.includes("bench") && (move.setup === "lie"
        ? <group><mesh position={[0, 0.42, -0.25]} castShadow receiveShadow><boxGeometry args={[0.32, 0.08, 1.25]} />{pad}</mesh>
            {[-0.6, 0.1].map((z) => <mesh key={z} position={[0, 0.19, z]} castShadow><boxGeometry args={[0.06, 0.38, 0.06]} />{steel}</mesh>)}</group>
        : <group><mesh position={[0, 0.42, -0.02]} castShadow receiveShadow><boxGeometry args={[0.42, 0.08, 0.4]} />{pad}</mesh>
            <mesh position={[0, 0.19, -0.02]} castShadow><boxGeometry args={[0.06, 0.38, 0.06]} />{steel}</mesh>
            <mesh position={[0, 0.02, -0.02]}><boxGeometry args={[0.5, 0.04, 0.08]} />{steel}</mesh></group>)}
      {p.includes("bar") && (
        <group>
          <mesh position={[0, 2.3, 0]} rotation-z={Math.PI / 2} castShadow><cylinderGeometry args={[0.018, 0.018, 1.4, 16]} />{steel}</mesh>
          {[-0.7, 0.7].map((x) => <mesh key={x} position={[x, 1.15, -0.1]} castShadow><boxGeometry args={[0.06, 2.3, 0.06]} />{steel}</mesh>)}
        </group>
      )}
    </>
  );
}

const VIEWS = { Front: [0, 1.3, 3.4], Side: [3.4, 1.3, 0], Rear: [0, 1.3, -3.4], Close: [1.0, 1.45, 1.5] } as const;
type View = keyof typeof VIEWS;

function CameraRig({ view }: { view: View }) {
  const { camera } = useThree();
  useEffect(() => { const [x, y, z] = VIEWS[view]; camera.position.set(x, y, z); }, [view, camera]);
  return null;
}

class ModelBoundary extends Component<{ children: ReactNode }, { err: boolean }> {
  override state = { err: false };
  static getDerivedStateFromError() { return { err: true }; }
  override render() {
    return this.state.err
      ? <Html center><p className="whitespace-nowrap rounded-md bg-background/90 px-3 py-2 font-mono text-xs text-muted-foreground">Couldn't load the 3D trainer. Refresh to retry.</p></Html>
      : this.props.children;
  }
}

function phaseLabel(phase: number, effortAtB: boolean) {
  const rising = phase < 0.5;
  const t = (1 - Math.cos(phase * Math.PI * 2)) / 2;
  if (t > 0.9) return effortAtB ? "Peak squeeze" : "Bottom — stay tight";
  if (t < 0.1) return effortAtB ? "Start — full stretch" : "Top — reset";
  return rising === effortAtB ? "Lifting — concentric" : "Lowering — eccentric (slow)";
}

const btn = (on: boolean) => `rounded-md px-3 py-1.5 font-mono text-xs uppercase ${on ? "bg-primary text-primary-foreground" : "bg-background/80 text-foreground"}`;

export default function VirtualTrainer({ kind, name, cue }: { kind?: AnimKey | undefined; name: string; cue?: string | undefined }) {
  const [view, setView] = useState<View>("Front");
  const [spin, setSpin] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [slow, setSlow] = useState(false);
  const [ui, setUi] = useState({ phase: 0 });
  const pb = useRef<Playback>({ phase: 0, playing: true, speed: 1, scrub: null });
  pb.current.playing = playing;
  pb.current.speed = slow ? 0.4 : 1;

  useEffect(() => { const id = setInterval(() => setUi({ phase: pb.current.phase }), 120); return () => clearInterval(id); }, []);
  useEffect(() => { pb.current.phase = 0; }, [kind]);

  const move = kind ? MOVES[kind] : undefined;
  if (!move || !kind) return null;
  const focus = FOCUS[kind];

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-border bg-card sm:aspect-[6/5]">
        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 1.3, 3.4], fov: 40 }}>
          <color attach="background" args={["#141519"]} />
          <fog attach="fog" args={["#141519", 6, 12]} />
          <ambientLight intensity={0.25} />
          <directionalLight position={[2.5, 5, 3]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0005} />
          <spotLight position={[-2.5, 3, -2.5]} intensity={18} angle={0.6} penumbra={0.8} color="#c6f432" />
          <Environment>
            <Lightformer intensity={1.6} position={[0, 5, 0]} scale={[10, 10, 1]} />
            <Lightformer intensity={0.8} color="#9ab" position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 1, 1]} />
            <Lightformer intensity={0.6} color="#ffd8b0" position={[5, 1, 2]} rotation-y={-Math.PI / 2} scale={[20, 1, 1]} />
          </Environment>
          <ModelBoundary>
            <Suspense fallback={<Html center><p className="font-mono text-xs text-muted-foreground">Loading trainer…</p></Html>}>
              <Trainer move={move} kind={kind} pb={pb} />
            </Suspense>
          </ModelBoundary>
          <Props move={move} />
          <mesh rotation-x={-Math.PI / 2} receiveShadow><circleGeometry args={[3, 48]} /><meshStandardMaterial color="#1d1f24" roughness={0.85} /></mesh>
          <gridHelper args={[6, 24, "#33363d", "#25272c"]} position={[0, 0.002, 0]} />
          <ContactShadows position={[0, 0.005, 0]} opacity={0.55} blur={2.2} scale={4} />
          <CameraRig view={view} />
          <OrbitControls makeDefault target={[0, 0.95, 0]} enablePan={false} minDistance={1.1} maxDistance={6} autoRotate={spin} autoRotateSpeed={2} />
        </Canvas>
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {(Object.keys(VIEWS) as View[]).map((v) => <button key={v} onClick={() => setView(v)} className={btn(view === v)}>{v}</button>)}
        </div>
        <button onClick={() => setSpin((s) => !s)} className={`absolute right-3 top-3 ${btn(spin)}`}>360°</button>
        <p className="pointer-events-none absolute bottom-3 left-3 rounded bg-background/70 px-2 py-1 font-mono text-xs text-primary">{phaseLabel(ui.phase, focus.effortAtB !== false)}</p>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button onClick={() => setPlaying((p) => !p)} className={btn(playing)} aria-label={playing ? "Pause" : "Play"}>{playing ? "Pause" : "Play"}</button>
        <button onClick={() => setSlow((s) => !s)} className={btn(slow)}>{slow ? "0.4×" : "1×"}</button>
        <input
          type="range" min={0} max={1000} aria-label="Scrub repetition" className="flex-1 accent-[var(--color-primary)]"
          value={Math.round(ui.phase * 1000)}
          onChange={(e) => { const v = Number(e.target.value) / 1000; pb.current.scrub = v; pb.current.phase = v; setUi({ phase: v }); }}
          onPointerUp={() => { pb.current.scrub = null; setPlaying(false); }}
          onKeyUp={() => { pb.current.scrub = null; setPlaying(false); }}
        />
      </div>

      <div className="mt-5">
        <h3 className="text-2xl font-bold uppercase">{name}</h3>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {focus.p.map((r) => <span key={r} className="rounded-md bg-primary px-2 py-1 font-mono text-xs uppercase text-primary-foreground">{REGION_LABEL[r]}</span>)}
          {focus.s.map((r) => <span key={r} className="rounded-md border border-primary/50 px-2 py-1 font-mono text-xs uppercase text-primary">{REGION_LABEL[r]}</span>)}
        </div>
        <p className="mt-1 font-mono text-xs text-muted-foreground">Solid = main muscles · outline = helpers</p>
        {cue && <p className="mt-3 text-muted-foreground"><span className="text-foreground">Technique:</span> {cue}</p>}
        <p className="mt-2 text-muted-foreground"><span className="text-accent">Avoid:</span> {move.mistake}</p>
      </div>
    </div>
  );
}

useGLTF.preload(MODEL_URL);
