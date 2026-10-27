import type { AnimKey } from "@/components/ExerciseAnimation";

// Angles in degrees. sh = shoulder forward raise, roll = arm out to side, el = elbow bend,
// hip = thigh forward raise, knee = knee bend, lean = torso forward tilt. *R = right-side override.
export type Pose = {
  lean?: number; sh?: number; roll?: number; el?: number; hip?: number; knee?: number;
  shR?: number; elR?: number; hipR?: number; kneeR?: number; y?: number; headZ?: number;
};
export type Setup = "stand" | "sit" | "lie" | "quad";
export type Move = {
  setup: Setup; a: Pose; b: Pose; alt?: boolean; secs: number;
  props?: ("bench" | "bar" | "dumbbells")[];
  muscles: string; mistake: string;
};

const SIT: Pose = { hip: 90, knee: 90, y: 0.5 };
const QUAD: Pose = { lean: 90, sh: 90, hip: 0, knee: 90, y: 0.5 };

export const MOVES: Record<AnimKey, Move> = {
  cycling: { setup: "sit", alt: true, secs: 1, props: ["bench"], a: { ...SIT, lean: 25, sh: 70, el: 20, hip: 100, knee: 110 }, b: { ...SIT, lean: 25, sh: 70, el: 20, hip: 50, knee: 30 }, muscles: "Quads · Glutes · Heart", mistake: "Bouncing on the seat — lower resistance and stay smooth." },
  chestPress: { setup: "sit", secs: 2.4, props: ["bench"], a: { ...SIT, sh: 80, roll: 40, el: 110 }, b: { ...SIT, sh: 85, roll: 10, el: 5 }, muscles: "Chest · Front shoulders · Triceps", mistake: "Lifting the back off the pad or locking elbows hard." },
  pullOver: { setup: "lie", secs: 3, props: ["bench", "dumbbells"], a: { sh: 170, el: 20, hip: 60, knee: 90, y: 0.55 }, b: { sh: 80, el: 20, hip: 60, knee: 90, y: 0.55 }, muscles: "Lats · Chest · Serratus", mistake: "Bending the elbows more to cheat the weight back up." },
  pecFly: { setup: "sit", secs: 2.4, props: ["bench"], a: { ...SIT, sh: 85, roll: 80, el: 20 }, b: { ...SIT, sh: 85, roll: 5, el: 20 }, muscles: "Chest · Front shoulders", mistake: "Turning it into a press by bending the elbows." },
  overheadExt: { setup: "stand", secs: 2.4, props: ["dumbbells"], a: { sh: 170, el: 150 }, b: { sh: 170, el: 0 }, muscles: "Triceps (long head)", mistake: "Elbows flaring wide and lower back arching." },
  pushDown: { setup: "stand", secs: 2, a: { lean: 10, sh: 10, el: 100 }, b: { lean: 10, sh: 5, el: 0 }, muscles: "Triceps", mistake: "Elbows drifting forward off your sides." },
  catCow: { setup: "quad", secs: 4, a: { ...QUAD, lean: 80, headZ: 0.05 }, b: { ...QUAD, lean: 100, headZ: -0.05 }, muscles: "Spine mobility", mistake: "Rushing — move one vertebra at a time." },
  hipFlexor: { setup: "stand", secs: 5, a: { hip: 90, knee: 90, hipR: -20, kneeR: 90, y: 0.5 }, b: { hip: 95, knee: 85, hipR: -30, kneeR: 90, y: 0.47 }, muscles: "Hip flexors · Quads", mistake: "Arching the lower back instead of tucking the pelvis." },
  wallAngels: { setup: "stand", secs: 3.2, a: { sh: 0, roll: 80, el: 90 }, b: { sh: 0, roll: 165, el: 10 }, muscles: "Upper back · Shoulders", mistake: "Ribs flaring and lower back lifting off the wall." },
  birdDog: { setup: "quad", secs: 3.5, a: { ...QUAD }, b: { ...QUAD, sh: 175, hipR: -85, kneeR: 5 }, muscles: "Core · Glutes · Back", mistake: "Rotating the hips as the leg lifts." },
  deadHang: { setup: "stand", secs: 5, props: ["bar"], a: { sh: 180, el: 0, y: 1.0 }, b: { sh: 178, el: 0, y: 0.98 }, muscles: "Grip · Shoulders · Lats", mistake: "Hanging through pain — stop if shoulders hurt." },
  chinTucks: { setup: "stand", secs: 3, a: { headZ: 0.05 }, b: { headZ: -0.03 }, muscles: "Deep neck flexors", mistake: "Tilting the head down instead of gliding it back." },
  chinUp: { setup: "stand", secs: 2.8, props: ["bar"], a: { sh: 180, el: 0, y: 0.9 }, b: { sh: 30, roll: 30, el: 125, y: 1.15 }, muscles: "Lats · Biceps", mistake: "Swinging the legs or half reps." },
  latPullDown: { setup: "sit", secs: 2.6, props: ["bench", "bar"], a: { ...SIT, sh: 170, roll: 20, el: 10 }, b: { ...SIT, sh: 20, roll: 40, el: 120 }, muscles: "Lats · Biceps · Rear delts", mistake: "Leaning far back and pulling with momentum." },
  seatedRow: { setup: "sit", secs: 2.6, props: ["bench"], a: { ...SIT, hip: 80, knee: 20, lean: 15, sh: 90, el: 0 }, b: { ...SIT, hip: 80, knee: 20, lean: 0, sh: 25, el: 115 }, muscles: "Mid back · Lats · Biceps", mistake: "Rocking the torso to move the weight." },
  curl: { setup: "stand", secs: 2.4, props: ["dumbbells"], a: { el: 10 }, b: { el: 140 }, muscles: "Biceps", mistake: "Swinging the body and elbows moving forward." },
  hammerCurl: { setup: "stand", secs: 2.4, props: ["dumbbells"], a: { el: 10, roll: 5 }, b: { el: 135, roll: 5 }, muscles: "Brachialis · Forearms · Biceps", mistake: "Rotating the wrists — keep palms facing in." },
  shoulderPress: { setup: "sit", secs: 2.6, props: ["bench"], a: { ...SIT, sh: 165, roll: 35, el: 120 }, b: { ...SIT, sh: 175, roll: 15, el: 0 }, muscles: "Shoulders · Triceps", mistake: "Arching the back off the pad." },
  frontRaise: { setup: "stand", secs: 2.6, props: ["dumbbells"], a: { sh: 0, el: 10 }, b: { sh: 90, el: 10 }, muscles: "Front shoulders", mistake: "Lifting above shoulder height with a swing." },
  squat: { setup: "stand", secs: 2.8, a: { sh: 0 }, b: { hip: 100, knee: 110, lean: 40, sh: 80, y: 0.6 }, muscles: "Quads · Glutes · Core", mistake: "Heels lifting or knees caving inward." },
  legPress: { setup: "sit", secs: 2.8, props: ["bench"], a: { ...SIT, lean: -30, hip: 120, knee: 110 }, b: { ...SIT, lean: -30, hip: 75, knee: 10 }, muscles: "Quads · Glutes · Hamstrings", mistake: "Locking the knees or hips lifting off the pad." },
  legCurl: { setup: "sit", secs: 2.6, props: ["bench"], a: { ...SIT, knee: 5 }, b: { ...SIT, knee: 100 }, muscles: "Hamstrings", mistake: "Lifting the hips to swing the weight." },
};

// Body regions the 3D trainer can light up (mapped to skeleton bones in VirtualTrainer).
export type Region = "chest" | "upperBack" | "shoulders" | "upperArms" | "forearms" | "core" | "glutes" | "thighs" | "calves" | "neck";
export const REGION_LABEL: Record<Region, string> = {
  chest: "Chest", upperBack: "Upper back / lats", shoulders: "Shoulders", upperArms: "Arms (biceps / triceps)",
  forearms: "Forearms / grip", core: "Core", glutes: "Glutes / hips", thighs: "Quads / hamstrings", calves: "Calves", neck: "Neck",
};

// p = primary drivers, s = secondary stabilisers. effortAtB=false when pose b is the easy/lowered end (e.g. squat bottom).
export const FOCUS: Record<AnimKey, { p: Region[]; s: Region[]; effortAtB?: boolean }> = {
  cycling: { p: ["thighs"], s: ["glutes", "calves"] },
  chestPress: { p: ["chest"], s: ["shoulders", "upperArms"] },
  pullOver: { p: ["upperBack", "chest"], s: ["core", "upperArms"], effortAtB: true },
  pecFly: { p: ["chest"], s: ["shoulders"] },
  overheadExt: { p: ["upperArms"], s: ["shoulders", "core"] },
  pushDown: { p: ["upperArms"], s: ["forearms"] },
  catCow: { p: ["core", "upperBack"], s: ["neck"] },
  hipFlexor: { p: ["thighs", "glutes"], s: ["core"] },
  wallAngels: { p: ["upperBack", "shoulders"], s: ["core"] },
  birdDog: { p: ["core", "glutes"], s: ["upperBack", "shoulders"] },
  deadHang: { p: ["forearms", "upperBack"], s: ["shoulders"] },
  chinTucks: { p: ["neck"], s: ["upperBack"] },
  chinUp: { p: ["upperBack", "upperArms"], s: ["forearms", "core"] },
  latPullDown: { p: ["upperBack"], s: ["upperArms", "shoulders"] },
  seatedRow: { p: ["upperBack"], s: ["upperArms", "shoulders"] },
  curl: { p: ["upperArms"], s: ["forearms"] },
  hammerCurl: { p: ["upperArms", "forearms"], s: ["shoulders"] },
  shoulderPress: { p: ["shoulders"], s: ["upperArms", "upperBack"] },
  frontRaise: { p: ["shoulders"], s: ["upperBack", "core"] },
  squat: { p: ["thighs", "glutes"], s: ["core", "calves"], effortAtB: false },
  legPress: { p: ["thighs", "glutes"], s: ["calves"] },
  legCurl: { p: ["thighs"], s: ["calves"] },
};
