import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

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

type Ex = { name: string; sets?: string };
const WARMUP: Ex = { name: "Warmup — Cycling 10 min" };
const SETS = "15 · 12 · 10";

const PLANS: Record<string, { title: string; focus: string; list: Ex[] }> = {
  A: {
    title: "MON – THU",
    focus: "Chest & Triceps",
    list: [WARMUP, { name: "M/C Chest Press", sets: SETS }, { name: "D/B Pull Over", sets: SETS }, { name: "M/C Pec Fly", sets: SETS }, { name: "D/B Both Hand Ext", sets: SETS }, { name: "Cable Push Down", sets: SETS }],
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

function Index() {
  const [day, setDay] = useState<number | null>(null);
  useEffect(() => setDay(new Date().getDay()), []);
  const key = day === null ? null : DAY_PLAN[day];
  const plan = key ? PLANS[key] : null;

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 animate-pulse rounded-full bg-primary/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 animate-pulse rounded-full bg-accent/40 blur-3xl [animation-delay:1s]" />

      <div className="relative mx-auto max-w-2xl px-5 py-14">
        <p className="animate-in fade-in slide-in-from-top-4 text-sm uppercase tracking-[0.3em] text-muted-foreground duration-700">
          {day !== null ? DAYS[day] : ""}
        </p>
        <h1 className="mt-2 animate-in fade-in slide-in-from-left-6 text-5xl font-black uppercase tracking-tight duration-700 md:text-7xl">
          {plan ? plan.focus : day === 0 ? "Rest Day" : ""}
        </h1>
        {plan && <p className="mt-2 font-mono text-primary">{plan.title}</p>}

        {plan ? (
          <ol className="mt-10 space-y-3">
            {plan.list.map((ex, i) => (
              <li
                key={ex.name}
                style={{ animationDelay: `${i * 120}ms` }}
                className="group flex items-center gap-4 rounded-xl border border-border bg-card/70 p-4 backdrop-blur animate-in fade-in slide-in-from-bottom-6 fill-mode-both duration-700 transition-transform hover:-translate-y-1 hover:border-primary"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary font-black text-primary-foreground">
                  {i === 0 ? "🚴" : i}
                </span>
                <span className="flex-1 font-semibold uppercase tracking-wide">{ex.name}</span>
                {ex.sets && <span className="font-mono text-sm text-muted-foreground">{ex.sets}</span>}
              </li>
            ))}
          </ol>
        ) : day === 0 ? (
          <p className="mt-8 text-lg text-muted-foreground">Recover, stretch, and come back stronger tomorrow. 💤</p>
        ) : null}
      </div>
    </main>
  );
}
