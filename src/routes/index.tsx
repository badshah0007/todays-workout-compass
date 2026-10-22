import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { type AnimKey } from "@/components/ExerciseAnimation";
import { WorkoutCarousel } from "@/components/WorkoutCarousel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today's Workout" },
      { name: "description", content: "Your daily gym routine, shown automatically for today." },
      { property: "og:title", content: "Today's Workout" },
      { property: "og:description", content: "Your daily gym routine, shown automatically for today." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

type Ex = { name: string; sets?: string; anim?: AnimKey; cue?: string };
const WARMUP: Ex = { name: "Warmup — Cycling 10 min" };
const SETS = "15 · 12 · 10";

const PLANS: Record<string, { title: string; focus: string; list: Ex[] }> = {
  A: {
    title: "MON – THU",
    focus: "Chest & Triceps",
    list: [
      { ...WARMUP, anim: "cycling", cue: "Steady pace, light resistance to warm up." },
      { name: "M/C Chest Press", sets: SETS, anim: "chestPress", cue: "Back flat on pad, push handles forward, control the return." },
      { name: "D/B Pull Over", sets: SETS, anim: "pullOver", cue: "Arms slightly bent, lower weight behind head, pull back over chest." },
      { name: "M/C Pec Fly", sets: SETS, anim: "pecFly", cue: "Open arms wide, squeeze chest to bring them together." },
      { name: "D/B Both Hand Ext", sets: SETS, anim: "overheadExt", cue: "Elbows fixed up, lower weight behind head, extend straight up." },
      { name: "Cable Push Down", sets: SETS, anim: "pushDown", cue: "Elbows tucked at sides, push bar down till arms are straight." },
    ],
  },
  B: {
    title: "TUE – FRI",
    focus: "Back & Biceps",
    list: [WARMUP, { name: "M/C Chin Up", sets: SETS }, { name: "M/C Lat Pull Down", sets: SETS }, { name: "D/B Pull Over", sets: SETS }, { name: "M/C Seated Row", sets: SETS }, { name: "D/B Curl", sets: SETS }, { name: "D/B Hammer Curl", sets: SETS }],
  },
  C: {
    title: "WED – SAT",
    focus: "Shoulders & Legs",
    list: [WARMUP, { name: "M/C Shoulder Press", sets: SETS }, { name: "D/B Front Raise", sets: SETS }, { name: "Squat", sets: SETS }, { name: "Leg Press M/C", sets: SETS }, { name: "M/C Leg Curl", sets: SETS }],
  },
};
const DAY_PLAN = [null, "A", "B", "C", "A", "B", "C"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Same cooldown for every training day, shown after the workout.
const COOLDOWN: Ex[] = [
  { name: "Cat–Cow", sets: "10 slow reps", cue: "Mobilize your spine without forcing the movement." },
  { name: "Kneeling Hip-Flexor Stretch", sets: "2 × 30s each side", cue: "Keep your pelvis controlled and avoid excessive lower-back arching." },
  { name: "Wall Angels", sets: "2 × 10 reps", cue: "Improve shoulder movement and upper-back positioning." },
  { name: "Bird Dog", sets: "2 × 8 each side", cue: "Maintain a stable torso as you extend the opposite arm and leg." },
  { name: "Dead Hang — optional", sets: "2 × 20–30s", cue: "Use a comfortable grip and stop if your shoulders hurt. Any decompression is temporary, not permanent height growth." },
  { name: "Chin Tucks", sets: "2 × 10 reps", cue: "Gently draw your chin backward without tilting your head up or down." },
];

function Index() {
  const [day, setDay] = useState<number | null>(null);
  useEffect(() => setDay(new Date().getDay()), []);
  const key = day === null ? null : DAY_PLAN[day];
  const plan = key ? PLANS[key] : null;

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="relative mx-auto max-w-3xl px-5 py-8 sm:py-12">
        <p className="animate-in fade-in slide-in-from-top-4 text-sm uppercase tracking-[0.3em] text-muted-foreground duration-700">
          {day !== null ? DAYS[day] : ""}
        </p>
        <h1 className="mt-2 text-4xl font-black uppercase sm:text-5xl">
          {plan ? plan.focus : day === 0 ? "Rest Day" : ""}
        </h1>
        {plan && <p className="mt-2 font-mono text-primary">{plan.title}</p>}

        {plan ? (
          <>
            <WorkoutCarousel key={key} exercises={plan.list} />
            <section className="mt-16 border-t border-border pt-10">
              <h2 className="animate-in fade-in slide-in-from-top-4 text-sm uppercase tracking-[0.3em] text-muted-foreground duration-700">
                Cooldown
              </h2>
              <p className="mt-2 font-mono text-primary">Every training day, after the workout</p>
              <WorkoutCarousel key={`${key}-cooldown`} exercises={COOLDOWN} label="Cooldown exercises" />
            </section>
          </>
        ) : day === 0 ? (
          <p className="mt-8 text-lg text-muted-foreground">Recover, stretch, and come back stronger tomorrow. 💤</p>
        ) : null}
      </div>
    </main>
  );
}
