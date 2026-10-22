// Animated stick-figure demos built with SVG SMIL (no external assets).
export type AnimKey = "cycling" | "chestPress" | "pullOver" | "pecFly" | "overheadExt" | "pushDown";

const S = { stroke: "currentColor", strokeWidth: 5, strokeLinecap: "round" as const, fill: "none" };
const W = { fill: "var(--primary)" };
const dur = "2s";
const rot = (values: string, d = dur) => (
  <animateTransform attributeName="transform" type="rotate" values={values} dur={d} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1" keyTimes="0;0.5;1" />
);

export function ExerciseAnimation({ kind }: { kind: AnimKey }) {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full text-foreground">
      {kind === "cycling" && (
        <g>
          <circle cx="40" cy="100" r="14" {...S} strokeWidth={3} opacity={0.4} />
          <circle cx="90" cy="100" r="14" {...S} strokeWidth={3} opacity={0.4} />
          <circle cx="55" cy="22" r="8" {...S} />
          <line x1="55" y1="30" x2="60" y2="62" {...S} />
          <line x1="57" y1="40" x2="82" y2="60" {...S} />
          <g>
            <line x1="60" y1="62" x2="72" y2="80" {...S} />
            <line x1="72" y1="80" x2="65" y2="100" {...S} />
            <circle cx="65" cy="100" r="3" {...W} />
            <animateTransform attributeName="transform" type="rotate" from="0 65 92" to="360 65 92" dur="1.2s" repeatCount="indefinite" />
          </g>
        </g>
      )}
      {kind === "chestPress" && (
        <g>
          <rect x="22" y="30" width="8" height="60" rx="3" fill="var(--muted)" />
          <circle cx="40" cy="28" r="8" {...S} />
          <line x1="38" y1="36" x2="38" y2="78" {...S} />
          <path d="M38 78 L68 80 L70 108" {...S} />
          <g>
            <line x1="40" y1="48" x2="62" y2="52" {...S} />
            <rect x="60" y="44" width="6" height="16" rx="2" {...W} />
            <animateTransform attributeName="transform" type="translate" values="0 0;22 0;0 0" dur={dur} repeatCount="indefinite" />
          </g>
        </g>
      )}
      {kind === "pullOver" && (
        <g>
          <rect x="20" y="72" width="80" height="8" rx="3" fill="var(--muted)" />
          <circle cx="30" cy="62" r="8" {...S} />
          <line x1="38" y1="66" x2="78" y2="66" {...S} />
          <path d="M78 66 L92 50 L100 70" {...S} />
          <g>
            <line x1="40" y1="64" x2="40" y2="30" {...S} />
            <rect x="32" y="22" width="16" height="8" rx="3" {...W} />
            {rot("0 40 64;-100 40 64;0 40 64")}
          </g>
        </g>
      )}
      {kind === "pecFly" && (
        <g>
          <circle cx="60" cy="24" r="9" {...S} />
          <line x1="60" y1="33" x2="60" y2="75" {...S} />
          <path d="M60 75 L48 108 M60 75 L72 108" {...S} />
          <g>
            <line x1="56" y1="42" x2="22" y2="46" {...S} />
            <circle cx="22" cy="46" r="5" {...W} />
            {rot("0 56 42;-70 56 42;0 56 42")}
          </g>
          <g>
            <line x1="64" y1="42" x2="98" y2="46" {...S} />
            <circle cx="98" cy="46" r="5" {...W} />
            {rot("0 64 42;70 64 42;0 64 42")}
          </g>
        </g>
      )}
      {kind === "overheadExt" && (
        <g>
          <circle cx="58" cy="34" r="9" {...S} />
          <line x1="58" y1="43" x2="58" y2="82" {...S} />
          <path d="M58 82 L48 112 M58 82 L68 112" {...S} />
          <line x1="60" y1="48" x2="66" y2="18" {...S} />
          <g>
            <line x1="66" y1="18" x2="66" y2="-4" {...S} />
            <rect x="58" y="-10" width="16" height="8" rx="3" {...W} />
            {rot("0 66 18;-150 66 18;0 66 18")}
          </g>
        </g>
      )}
      {kind === "pushDown" && (
        <g>
          <line x1="92" y1="0" x2="92" y2="120" stroke="var(--muted)" strokeWidth={6} />
          <circle cx="52" cy="22" r="9" {...S} />
          <line x1="52" y1="31" x2="54" y2="74" {...S} />
          <path d="M54 74 L46 112 M54 74 L62 112" {...S} />
          <line x1="53" y1="40" x2="58" y2="62" {...S} />
          <g>
            <line x1="58" y1="62" x2="80" y2="62" {...S} />
            <rect x="78" y="58" width="6" height="8" rx="2" {...W} />
            {rot("-70 58 62;80 58 62;-70 58 62")}
          </g>
        </g>
      )}
    </svg>
  );
}
