import { cn } from "@/lib/utils";

/* ================================================================== */
/* The crew — playful hand-drawn scenes for the hire pages.            */
/* Loose monoline people in the dossier's ink, one vermilion accent   */
/* per scene, gentle CSS motion.                                       */
/*                                                                     */
/* Positioning rule: the SVG transform ATTRIBUTE and CSS transform    */
/* animations override each other — every animated group is wrapped:  */
/* an outer <g transform="translate(...)"> positions, an inner        */
/* <g class="crew-bob"> animates. Never both on one element.          */
/* ================================================================== */

type Pose = "walk" | "push" | "wave" | "holdUp" | "point" | "ride" | "launch" | "console" | "clap";

/** One doodle person, feet on the ground line (y=232). */
function Person({
  x,
  y = 232,
  flip = false,
  pose = "walk",
  accent = false,
}: {
  x: number;
  /** Ground line for this person (defaults to the scene ground). */
  y?: number;
  flip?: boolean;
  pose?: Pose;
  accent?: boolean;
}) {
  const bob = pose === "ride" || pose === "console" ? "" : "crew-bob";
  return (
    <g transform={`translate(${x} ${y})${flip ? " scale(-1 1)" : ""}`}>
      <g className={bob}>
        {/* head */}
        <circle cx="1" cy="-158" r="12" />
        {/* spine */}
        <path d="M1 -146 C -3 -126 5 -110 1 -88" />
        {/* legs */}
        {pose === "ride" ? (
          <>
            <path d="M1 -88 C -14 -78 -26 -66 -34 -52" />
            <path d="M1 -88 C 10 -74 16 -60 22 -46" />
          </>
        ) : pose === "push" ? (
          <>
            <path d="M1 -88 C -8 -62 -18 -34 -26 0" />
            <path d="M1 -88 C 8 -60 12 -30 10 1" />
          </>
        ) : pose === "console" ? (
          <>
            <path d="M1 -88 C -8 -66 -14 -34 -16 0" />
            <path d="M1 -88 C 10 -66 14 -34 14 1" />
          </>
        ) : (
          <>
            <path d="M1 -88 C -7 -62 -15 -34 -19 0" />
            <path d="M1 -88 C 8 -60 15 -30 13 1" />
          </>
        )}
        {/* feet */}
        <path d="M-19 0 h-9" />
        <path d="M13 1 h9" />
        {/* arms */}
        {pose === "wave" ? (
          <>
            <path d="M0 -128 C -10 -118 -16 -108 -18 -98" />
            <g className="crew-wave">
              <path d="M0 -128 C 10 -134 18 -142 22 -152" />
              <path d="M22 -152 l7 -6" />
            </g>
          </>
        ) : pose === "push" ? (
          <>
            <path d="M0 -126 C 14 -120 28 -114 40 -108" />
            <path d="M0 -118 C 12 -112 26 -106 36 -100" />
          </>
        ) : pose === "holdUp" ? (
          <>
            <path d="M0 -126 C 10 -132 20 -138 30 -142" />
            <path d="M0 -118 C 12 -124 24 -130 32 -134" />
          </>
        ) : pose === "point" ? (
          <>
            <path d="M0 -126 C -10 -118 -18 -112 -26 -108" />
            <path d="M0 -122 C 12 -122 24 -124 36 -128" />
          </>
        ) : pose === "launch" ? (
          <>
            <path d="M0 -126 C -12 -130 -24 -134 -34 -138" />
            <path d="M0 -118 C 10 -114 20 -110 28 -104" />
          </>
        ) : pose === "ride" ? (
          <>
            <path d="M0 -126 C 10 -130 20 -136 30 -142" />
            <path d="M0 -120 C -8 -116 -16 -112 -24 -110" />
          </>
        ) : pose === "console" ? (
          <>
            {/* typing at a console */}
            <path d="M0 -126 C 12 -122 22 -118 30 -114" />
            <path d="M0 -120 C 12 -116 22 -112 30 -108" />
          </>
        ) : pose === "clap" ? (
          <>
            <g className="crew-wave">
              <path d="M0 -126 C -12 -132 -22 -138 -30 -144" />
            </g>
            <g className="crew-wave" style={{ animationDelay: "-0.7s" }}>
              <path d="M0 -126 C 12 -132 22 -138 30 -144" />
            </g>
          </>
        ) : (
          <>
            <path d="M0 -126 C -8 -114 -14 -104 -16 -94" />
            <path d="M0 -122 C 8 -112 14 -102 16 -92" />
          </>
        )}
        {/* the one accent person wears the mark */}
        {accent ? <rect x="-4" y="-104" width="8" height="8" className="fill-accent stroke-none" /> : null}
      </g>
    </g>
  );
}

/* ------------------------- shared doodads -------------------------- */

/** Wobbly ground line across the scene. */
function Ground() {
  return (
    <>
      <path
        d="M10 233 C 120 230 240 234 360 232 C 480 230 600 234 720 232 C 800 231 860 233 908 232"
        className="text-border"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* pebbles */}
      <g className="text-muted/60" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none">
        <path d="M96 240 h5" />
        <path d="M252 243 h4" />
        <path d="M512 241 h5" />
        <path d="M752 244 h4" />
        <path d="M866 240 h5" />
      </g>
    </>
  );
}

/** Grass tuft. */
function Grass({ x, s = 1 }: { x: number; s?: number }) {
  return (
    <g transform={`translate(${x} 233) scale(${s})`} className="text-muted/70" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none">
      <path d="M-6 0 C -7 -6 -9 -9 -11 -11" />
      <path d="M0 0 C 0 -7 1 -11 1 -14" />
      <path d="M6 0 C 7 -6 9 -9 11 -11" />
    </g>
  );
}

/** Doodle sun with slowly turning rays. */
function Sun({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} className="text-foreground/70">
      <circle r="15" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <g className="crew-wheel" style={{ animationDuration: "26s" }} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M-24 0 H-19 M24 0 H19 M0 -24 V-19 M0 24 V19" />
        <path d="M-17 -17 l3.5 3.5 M17 17 l-3.5 -3.5 M17 -17 l-3.5 3.5 M-17 17 l3.5 -3.5" />
      </g>
      {/* one warm accent ray */}
      <path d="M0 -24 V-19" className="stroke-accent" strokeWidth="2.2" strokeLinecap="round" />
    </g>
  );
}

/** Puffy doodle cloud. */
function Cloud({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="text-muted/70" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none">
      <path d="M-34 8 C -44 8 -48 -2 -40 -7 C -38 -16 -24 -19 -18 -12 C -12 -22 6 -22 10 -12 C 22 -14 30 -4 22 4 C 18 8 8 8 2 8 Z" strokeLinejoin="round" />
    </g>
  );
}

/** A little bird — two loose arcs, flapping gently. */
function Bird({ x, y, flip = false }: { x: number; y: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})${flip ? " scale(-1 1)" : ""}`}>
      <g className="crew-bob-slow text-foreground/70" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none">
        <path d="M-9 0 C -5 -6 -2 -7 0 -3 C 2 -7 5 -6 9 0" />
      </g>
    </g>
  );
}

/** Four-point sparkle, pulsing. */
function Sparkle({ x, y, s = 1, delay = "0s" }: { x: number; y: number; s?: number; delay?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="crew-dash stroke-accent" style={{ animationDelay: delay }} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none">
      <path d="M0 -7 V7 M-7 0 H7" />
      <path d="M-4 -4 L4 4 M4 -4 L-4 4" strokeWidth="1.1" />
    </g>
  );
}

/** Road sign with a short mono label. */
function SignPost({ x, label, flip = false }: { x: number; label: string; flip?: boolean }) {
  return (
    <g transform={`translate(${x} 232)`}>
      <path d="M0 0 V-70" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <g transform={flip ? "scale(-1 1)" : ""}>
        <path
          d="M2 -70 L 2 -92 L 10 -100 L 62 -100 L 70 -92 L 70 -70 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <text
          x="36"
          y="-79"
          textAnchor="middle"
          className="fill-current text-muted"
          style={{ fontFamily: "var(--font-mono)", fontSize: "13px", letterSpacing: "0.08em" }}
        >
          {label}
        </text>
      </g>
    </g>
  );
}

/** Motion dashes behind a moving object. */
function Dashes({ x, y, n = 3 }: { x: number; y: number; n?: number }) {
  return (
    <g className="text-muted/70" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      {Array.from({ length: n }).map((_, i) => (
        <path
          key={i}
          d={`M${x} ${y + i * 14} h ${28 - i * 6}`}
          className="crew-dash"
          style={{ animationDelay: `${i * 0.35}s` }}
        />
      ))}
    </g>
  );
}

/** A spoked wheel that spins. */
function Wheel({ x, y, r = 20 }: { x: number; y: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill="none" stroke="currentColor" strokeWidth="2.2" />
      <g className="crew-wheel" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d={`M${-r + 4} 0 H${r - 4}`} />
        <path d={`M0 ${-r + 4} V${r - 4}`} />
        <path d={`M${-(r - 5)} ${-(r - 5)} L${r - 5} ${r - 5}`} />
        <path d={`M${r - 5} ${-(r - 5)} L${-(r - 5)} ${r - 5}`} />
      </g>
    </g>
  );
}

/** Parcels — the deliverables, stacked or flying. */
function Parcel({ x, y, s = 1, spin = false, delay = "0s" }: { x: number; y: number; s?: number; spin?: boolean; delay?: string }) {
  const inner = (
    <>
      <rect x="-13" y="-11" width="26" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M-13 -3 H13" stroke="currentColor" strokeWidth="1.3" />
      <path d="M-4 -11 V11" stroke="currentColor" strokeWidth="1.1" />
      <path d="M-6 -6 l5 4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </>
  );
  return spin ? (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g className="crew-bob" style={{ animationDelay: delay }}>
        {inner}
      </g>
    </g>
  ) : (
    <g transform={`translate(${x} ${y}) scale(${s})`}>{inner}</g>
  );
}

/* ---------------------------- Scenes ------------------------------ */

function VanScene() {
  return (
    <>
      {/* sky */}
      <Sun x={108} y={54} />
      <Cloud x={330} y={46} s={0.9} />
      <Cloud x={640} y={38} s={0.7} />
      <Bird x={505} y={70} />
      <Bird x={780} y={88} flip />
      {/* the Savo van, doodled, square-windowed, slightly proud */}
      <g transform="translate(330 0)">
        <g className="crew-bob-slow">
          <path
            d="M96 232 C 92 200 94 176 96 168 C 140 162 208 162 236 166 C 252 168 262 178 268 192 L 288 192 C 296 192 300 200 300 210 L 300 232"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="246" y="176" width="40" height="26" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M246 189 h40" stroke="currentColor" strokeWidth="1.4" />
          {/* a passenger waving from the window */}
          <circle cx="266" cy="190" r="5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <g className="crew-wave">
            <path d="M272 188 C 277 184 280 180 282 175" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </g>
          <rect x="120" y="182" width="86" height="34" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M120 199 h86" stroke="currentColor" strokeWidth="1.2" />
          <rect x="152" y="188" width="9" height="9" className="fill-accent" stroke="none" />
        </g>
        <Wheel x={140} y={230} r={19} />
        <Wheel x={256} y={230} r={19} />
      </g>
      {/* parcels launched from the top, matched profiles flying out */}
      <Parcel x={470} y={140} s={0.8} spin delay="-0.4s" />
      <Parcel x={520} y={110} s={0.6} spin delay="-1.1s" />
      <Parcel x={432} y={100} s={0.5} spin delay="-1.7s" />
      {/* crew: two pushing, one ahead waving */}
      <Person x={300} pose="push" flip />
      <Person x={348} pose="push" flip accent />
      <Person x={700} pose="wave" />
      <Dashes x={40} y={140} n={3} />
      {/* signage and flora */}
      <SignPost x={200} label="48 HRS →" />
      <SignPost x={840} label="SHIP IT" flip />
      <Grass x={160} />
      <Grass x={628} s={0.8} />
      <Grass x={880} s={0.9} />
      {/* the finish flag */}
      <g transform="translate(800 232)">
        <path d="M0 0 V-96" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M0 -96 L 54 -84 L 0 -70 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <rect x="18" y="-88" width="6" height="6" className="fill-accent" stroke="none" />
      </g>
    </>
  );
}

function RobotScene() {
  return (
    <>
      {/* sky */}
      <Sun x={806} y={52} />
      <Cloud x={220} y={44} s={0.8} />
      <Bird x={520} y={60} />
      <Person x={260} pose="walk" accent />
      {/* the big robot on a leash */}
      <g transform="translate(392 232)">
        <g className="crew-bob-slow">
          <rect x="-26" y="-92" width="52" height="60" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
          <rect x="-18" y="-124" width="36" height="28" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
          <rect x="-8" y="-115" width="8" height="8" className="fill-accent" stroke="none" />
          <path d="M0 -124 V-138" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="0" cy="-142" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M-26 -78 C -40 -74 -48 -66 -52 -56" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M26 -78 C 40 -74 48 -66 52 -56" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          {/* chest gauge, training progress */}
          <path d="M-14 -60 h28" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M-14 -60 h14" className="stroke-accent" strokeWidth="2.4" strokeLinecap="round" />
        </g>
        <Wheel x={-14} y={-14} r={13} />
        <Wheel x={14} y={-14} r={13} />
      </g>
      {/* a baby robot chasing behind */}
      <g transform="translate(190 232)">
        <g className="crew-bob" style={{ animationDelay: "-0.8s" }}>
          <rect x="-12" y="-52" width="24" height="30" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <rect x="-8" y="-68" width="16" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <circle cx="-2" cy="-61" r="2" className="fill-accent stroke-none" />
          <path d="M0 -68 V-76" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </g>
        <Wheel x={-7} y={-8} r={7} />
        <Wheel x={7} y={-8} r={7} />
      </g>
      {/* leash */}
      <path
        d="M282 108 C 320 96 356 100 380 118"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeDasharray="1 7"
      />
      {/* data particles trailing the robot */}
      <g className="text-muted/80">
        <rect x="474" y="150" width="6" height="6" className="crew-dash fill-accent stroke-none" />
        <rect x="500" y="128" width="5" height="5" className="crew-dash fill-none stroke-current" strokeWidth="1.5" style={{ animationDelay: "0.5s" }} />
        <rect x="490" y="176" width="5" height="5" className="crew-dash fill-none stroke-current" strokeWidth="1.5" style={{ animationDelay: "1s" }} />
      </g>
      {/* thought bubble from the robot */}
      <g transform="translate(452 92)" className="text-foreground/80" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinejoin="round">
        <rect x="0" y="-30" width="52" height="30" />
        <path d="M10 0 l-6 10 l12 -10" strokeLinecap="round" />
        <path d="M9 -20 h20 M9 -12 h12" strokeWidth="1.3" strokeLinecap="round" />
      </g>
      {/* crew member carrying a laptop, pointing at the robot */}
      <Person x={620} pose="walk" />
      <g transform="translate(620 232)">
        <rect x="14" y="-128" width="34" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M14 -117 h34" stroke="currentColor" strokeWidth="1.2" />
      </g>
      <Person x={760} pose="point" flip />
      <Dashes x={60} y={160} n={2} />
      <SignPost x={120} label="MODEL →" />
      <Grass x={560} />
      <Grass x={880} s={0.9} />
      <Sparkle x={560} y={98} s={0.8} />
    </>
  );
}

function BrowserScene() {
  return (
    <>
      {/* sky */}
      <Sun x={780} y={54} />
      <Cloud x={140} y={46} s={0.8} />
      <Bird x={640} y={66} flip />
      {/* the big browser frame, held up like a banner */}
      <g transform="translate(300 232)">
        <g className="crew-bob-slow">
          <rect x="0" y="-210" width="280" height="176" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M0 -182 H280" stroke="currentColor" strokeWidth="2" />
          <circle cx="16" cy="-196" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="28" cy="-196" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M22 -160 H130" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M22 -142 H96" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <rect x="22" y="-122" width="64" height="40" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <rect x="106" y="-122" width="64" height="40" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <rect x="190" y="-122" width="64" height="40" className="fill-accent/20 stroke-accent" strokeWidth="2" />
          <rect x="212" y="-104" width="9" height="9" className="fill-accent stroke-none" />
          <path d="M40 -34 V0 M240 -34 V0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </g>
      </g>
      {/* a ladder beside the frame, someone is placing the accent block */}
      <g transform="translate(560 232)" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none">
        <path d="M-70 0 V-150 M-40 0 V-150" />
        <path d="M-70 -20 H-40 M-70 -60 H-40 M-70 -100 H-40 M-70 -140 H-40" />
      </g>
      <Person x={286} pose="holdUp" />
      <Person x={620} pose="point" />
      {/* designer with a tablet, sketching the next block */}
      <Person x={820} pose="console" />
      <g transform="translate(820 232)">
        <rect x="24" y="-124" width="30" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M29 -114 h8 M29 -108 h14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </g>
      {/* big doodle cursor, pointing at the accent block */}
      <g transform="translate(596 96) rotate(12)" className="text-foreground/85">
        <path d="M0 0 L 0 26 L 7 20 L 12 30 L 17 27 L 12 18 L 21 17 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </g>
      <Sparkle x={486} y={84} s={0.9} />
      <Sparkle x={420} y={60} s={0.6} delay="0.6s" />
      {/* keyboard and coffee on the ground */}
      <g transform="translate(160 226)" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round">
        <rect x="0" y="0" width="56" height="8" />
        <path d="M8 4 h2 M14 4 h2 M20 4 h2 M26 4 h2 M32 4 h2 M38 4 h2 M44 4 h2" strokeWidth="1" />
      </g>
      <g transform="translate(712 226)" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round">
        <path d="M0 0 h18 v-12 h-18 Z" strokeLinejoin="round" />
        <path d="M18 -9 C 26 -9 26 -3 18 -3" />
        <path d="M4 -16 C 4 -19 8 -19 8 -16 M8 -16 C 8 -19 12 -19 12 -16" strokeWidth="1.2" />
      </g>
      <Grass x={100} />
      <Grass x={880} s={0.9} />
    </>
  );
}

function RackScene() {
  return (
    <>
      {/* sky */}
      <Sun x={120} y={56} />
      <Cloud x={560} y={44} s={0.85} />
      <Bird x={700} y={72} />
      {/* the rack on a cart */}
      <g transform="translate(360 232)">
        <g className="crew-bob-slow">
          <rect x="0" y="-176" width="120" height="150" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M0 -148 H120 M0 -120 H120 M0 -92 H120 M0 -64 H120" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="16" cy="-132" r="3.2" className="crew-dash stroke-accent" fill="none" strokeWidth="2" />
          <circle
            cx="16"
            cy="-76"
            r="3.2"
            className="crew-dash stroke-accent"
            fill="none"
            strokeWidth="2"
            style={{ animationDelay: "0.6s" }}
          />
          <path d="M96 -132 h10 M96 -76 h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          {/* terminal on top of the rack, deploy log scrolling */}
          <rect x="18" y="-216" width="84" height="34" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M24 -206 h20 M24 -198 h34 M24 -190 h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <rect x="78" y="-208" width="4" height="4" className="fill-accent stroke-none" />
        </g>
        {/* the server cat, riding on top */}
        <g transform="translate(96 -176)">
          <g className="crew-bob-slow" style={{ animationDelay: "-0.5s" }}>
            <path d="M-14 0 C -20 -2 -22 -10 -16 -14 L -14 -20 L -9 -15 C -5 -17 3 -17 7 -15 L 12 -20 L 14 -14 C 20 -10 18 -2 12 0 Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
            <path d="M-10 -8 h2 M-2 -8 h2" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M-4 -4 l2 2 l2 -2" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M12 -6 C 20 -8 24 -4 26 0" strokeWidth="1.4" strokeLinecap="round" />
          </g>
        </g>
        <path d="M-14 -26 H134" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <Wheel x={14} y={-13} r={13} />
        <Wheel x={106} y={-13} r={13} />
      </g>
      {/* cable trailing from the rack to a plug post */}
      <path
        d="M360 96 C 300 110 250 190 196 210 C 160 224 150 226 128 228"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        className="text-muted/80"
      />
      <g transform="translate(104 228)" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round">
        <path d="M0 0 V-16" />
        <rect x="-9" y="-30" width="18" height="14" strokeLinejoin="round" />
        <path d="M-4 -36 l0 4 M4 -36 l0 4" />
      </g>
      <Person x={330} pose="push" flip accent />
      <Person x={700} pose="walk" />
      {/* SRE checking the uptime gauge */}
      <Person x={800} pose="console" />
      <g transform="translate(800 232)" stroke="currentColor" strokeWidth="1.7" fill="none">
        <path d="M26 -124 a 14 14 0 1 1 -0.1 0" strokeLinecap="round" />
        <path d="M26 -124 L 34 -132" strokeLinecap="round" />
        <path d="M22 -118 l3 3 l5 -6" strokeWidth="1.4" strokeLinecap="round" className="stroke-accent" />
      </g>
      <Dashes x={50} y={150} n={3} />
      <SignPost x={580} label="99.98%" />
      <Grass x={640} s={0.8} />
      <Grass x={880} />
      <Sparkle x={500} y={80} s={0.7} />
    </>
  );
}

function JuggleScene() {
  return (
    <>
      {/* sky */}
      <Sun x={820} y={52} />
      <Cloud x={180} y={44} s={0.85} />
      <Bird x={600} y={64} flip />
      <Person x={430} pose="holdUp" accent />
      {/* the whole stack in the air: database, server, browser, phone */}
      <g transform="translate(430 40) skewX(-16)">
        <g className="crew-bob">
          <rect x="-56" y="-14" width="112" height="26" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
          <rect x="-6" y="-6" width="10" height="10" className="fill-accent stroke-none" />
        </g>
      </g>
      {/* database cylinder */}
      <g transform="translate(340 84)">
        <g className="crew-bob-slow">
          <ellipse cx="0" cy="-12" rx="20" ry="7" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M-20 -12 V10 C -20 15 20 15 20 10 V-12" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M-20 0 C -20 5 20 5 20 0" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </g>
      </g>
      {/* tiny browser */}
      <g transform="translate(524 78)">
        <g className="crew-bob-slow" style={{ animationDelay: "-1.2s" }}>
          <rect x="-22" y="-14" width="44" height="30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M-22 -7 H22" strokeWidth="1.4" />
          <path d="M-16 0 H6" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M-16 7 H0" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      </g>
      {/* tiny phone */}
      <g transform="translate(392 34)">
        <g className="crew-bob" style={{ animationDelay: "-0.9s" }}>
          <rect x="-9" y="-15" width="18" height="30" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M-3 -11 H3" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      </g>
      {/* coffee balanced on the juggler's head, obviously */}
      <g transform="translate(430 62)">
        <g stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round">
          <path d="M-9 0 h18 v-11 h-18 Z" strokeLinejoin="round" />
          <path d="M9 -8 C 15 -8 15 -3 9 -3" />
          <path d="M-4 -14 C -4 -17 0 -17 0 -14 M0 -14 C 0 -17 4 -17 4 -14" strokeWidth="1.2" />
        </g>
      </g>
      {/* spectators: one pointing, one clapping */}
      <Person x={200} pose="point" />
      <Person x={680} pose="clap" />
      <Sparkle x={300} y={70} s={0.8} />
      <Sparkle x={560} y={54} s={0.6} delay="0.5s" />
      <SignPost x={120} label="1 DEV" />
      <SignPost x={830} label="ALL OF IT" flip />
      <Grass x={600} />
      <Grass x={880} s={0.9} />
    </>
  );
}

function ScooterScene() {
  return (
    <>
      {/* sky */}
      <Sun x={130} y={54} />
      <Cloud x={400} y={42} s={0.8} />
      <Bird x={620} y={58} />
      {/* phone-shaped balloon floating above */}
      <g transform="translate(560 92)">
        <g className="crew-bob-slow">
          <rect x="-12" y="-22" width="24" height="40" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M-5 -17 H5" strokeWidth="1.4" strokeLinecap="round" />
          <rect x="-6" y="-10" width="12" height="12" className="fill-accent stroke-none" />
          <path d="M0 18 C -2 26 2 30 0 36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      </g>
      {/* a bird carrying a push notification */}
      <g transform="translate(700 96)" className="text-foreground/80">
        <g className="crew-bob-slow" style={{ animationDelay: "-1s" }}>
          <path d="M-9 0 C -5 -6 -2 -7 0 -3 C 2 -7 5 -6 9 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <rect x="10" y="-8" width="14" height="10" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path d="M13 -5 h8" strokeWidth="1.1" strokeLinecap="round" />
        </g>
      </g>
      {/* the rider, rides with the scooter, no separate bob */}
      <Person x={430} pose="ride" accent />
      {/* scooter */}
      <g transform="translate(400 232)">
        <path d="M20 0 C 24 -30 34 -52 52 -64" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M52 -64 C 66 -72 84 -76 104 -78" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M100 -78 C 106 -84 112 -86 120 -86" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <rect x="120" y="-102" width="18" height="28" fill="none" stroke="currentColor" strokeWidth="2" />
        <rect x="124" y="-96" width="10" height="12" className="fill-accent stroke-none" />
        <path d="M6 -12 C 20 -18 44 -20 64 -20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <Wheel x={4} y={-6} r={16} />
        <Wheel x={66} y={-6} r={12} />
      </g>
      {/* a second rider racing behind */}
      <Person x={190} pose="ride" flip />
      <g transform="translate(220 232)">
        <path d="M-16 0 C -13 -24 -6 -42 6 -52" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M-16 0 C -24 -6 -30 -10 -36 -12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M-20 -8 C -12 -12 -2 -14 8 -14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <Wheel x={-30} y={-6} r={13} />
        <Wheel x={4} y={-6} r={11} />
      </g>
      {/* scarf flutter */}
      <path
        d="M418 104 C 400 100 384 104 370 112"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="crew-dash"
      />
      <Person x={680} pose="wave" />
      {/* traffic light: green, obviously */}
      <g transform="translate(828 232)" stroke="currentColor" strokeWidth="1.9" fill="none" strokeLinecap="round">
        <path d="M0 0 V-88" />
        <rect x="-13" y="-128" width="26" height="40" strokeLinejoin="round" />
        <circle cx="0" cy="-118" r="3.4" className="stroke-muted" strokeWidth="1.6" />
        <circle cx="0" cy="-108" r="3.4" className="stroke-muted" strokeWidth="1.6" />
        <circle cx="0" cy="-98" r="3.4" className="crew-dash stroke-accent" strokeWidth="2" />
      </g>
      <Dashes x={40} y={140} n={3} />
      <SignPost x={110} label="WEEKLY" />
      <Grass x={600} s={0.85} />
      <Grass x={760} />
    </>
  );
}

function RocketScene() {
  return (
    <>
      {/* night-ish sky: stars instead of a sun */}
      <Sparkle x={110} y={54} s={1} />
      <Sparkle x={250} y={38} s={0.7} delay="0.7s" />
      <Sparkle x={560} y={50} s={0.8} delay="1.2s" />
      <Sparkle x={720} y={34} s={0.6} delay="0.3s" />
      <Sparkle x={860} y={64} s={0.9} delay="1.6s" />
      {/* a cloud the rocket just punched through */}
      <Cloud x={560} y={76} s={0.65} />
      {/* the rocket, just cleared the pad */}
      <g transform="translate(430 232)">
        <g className="crew-bob-slow">
          <g transform="translate(0 -166) rotate(18)">
            <path
              d="M-16 44 C -18 8 -12 -28 0 -52 C 12 -28 18 8 16 44 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
            <path
              d="M0 -52 C 6 -40 10 -28 12 -16 C 6 -22 -6 -22 -12 -16 C -10 -28 -6 -40 0 -52 Z"
              className="fill-accent/20 stroke-accent"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <circle cx="0" cy="4" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M-16 30 C -26 38 -30 46 -30 54 L -16 46 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M16 30 C 26 38 30 46 30 54 L 16 46 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path
              d="M-8 46 C -4 60 0 70 0 70 C 0 70 4 60 8 46"
              className="crew-dash stroke-accent"
              fill="none"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </g>
        </g>
        {/* launch pad */}
        <path d="M-44 0 H44" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M-30 0 V-14 M30 0 V-14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </g>
      {/* mission control: console operator tracking the trajectory */}
      <g transform="translate(150 232)" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round">
        <rect x="-8" y="-52" width="76" height="34" strokeLinejoin="round" />
        <path d="M0 -42 h24 M0 -34 h40 M0 -26 h16" strokeWidth="1.3" />
        <path d="M46 -44 C 56 -52 64 -48 66 -40" className="stroke-accent" strokeWidth="1.6" />
        <path d="M-14 -18 H74" />
        <path d="M-8 -18 V0 M66 -18 V0" />
      </g>
      <Person x={180} pose="console" accent />
      {/* countdown board */}
      <g transform="translate(80 232)">
        <path d="M0 0 V-64" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <rect x="-34" y="-100" width="68" height="36" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <text
          x="0"
          y="-76"
          textAnchor="middle"
          className="fill-current text-accent"
          style={{ fontFamily: "var(--font-mono)", fontSize: "15px", letterSpacing: "0.08em" }}
        >
          T-0
        </text>
      </g>
      {/* the queue: next rocket already on its pad */}
      <g transform="translate(700 232)">
        <g transform="translate(0 -44) rotate(10)">
          <path
            d="M-11 30 C -12 6 -8 -18 0 -34 C 8 -18 12 6 11 30 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinejoin="round"
            className="text-foreground/70"
          />
          <circle cx="0" cy="4" r="5" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-foreground/70" />
        </g>
        <path d="M-26 0 H26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-foreground/70" />
      </g>
      <Person x={300} pose="launch" />
      {/* QA with a clipboard, signing off */}
      <Person x={640} pose="walk" />
      <g transform="translate(640 232)">
        <rect x="16" y="-138" width="26" height="34" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M21 -128 h14 M21 -120 h14 M21 -112 h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M24 -104 l4 4 l7 -8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="stroke-accent" />
      </g>
      <Grass x={520} />
      <Grass x={880} s={0.9} />
    </>
  );
}


/* ------------------------ service scenes --------------------------- */

function WebBuildScene() {
  return (
    <>
      <Sun x={112} y={52} />
      <Cloud x={300} y={42} s={0.8} />
      <Bird x={610} y={62} flip />
      {/* the frame under construction, mast and jib first */}
      <g stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none">
        <path d="M660 232 V44" />
        <path d="M660 44 L 400 76" />
        <path d="M660 232 L 560 200 M660 232 L 730 210" />
        <path d="M660 44 L 730 80 L 730 130" />
      </g>
      {/* the hanging headline block, swaying on its cable */}
      <g transform="translate(430 96)">
        <g className="crew-bob-slow">
          <path d="M0 -58 V-12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <rect x="-52" y="-12" width="104" height="26" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
          <rect x="-4" y="-3" width="9" height="9" className="fill-accent stroke-none" />
        </g>
      </g>
      {/* the page being assembled */}
      <g transform="translate(190 232)">
        <g className="crew-bob-slow">
          <rect x="0" y="-150" width="220" height="130" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M0 -122 H220" strokeWidth="2" />
          <circle cx="14" cy="-136" r="3" strokeWidth="1.6" />
          <circle cx="26" cy="-136" r="3" strokeWidth="1.6" />
          <path d="M18 -100 H120" strokeWidth="2" strokeLinecap="round" />
          <path d="M18 -84 H90" strokeWidth="2" strokeLinecap="round" />
          <rect x="18" y="-64" width="52" height="30" strokeWidth="1.8" />
          <rect x="86" y="-64" width="52" height="30" strokeWidth="1.8" />
          <path d="M30 0 V-20 M190 0 V-20" strokeWidth="2" strokeLinecap="round" />
        </g>
      </g>
      {/* ladder against the frame */}
      <g transform="translate(430 232)" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none">
        <path d="M-60 0 V-130 M-30 0 V-130" />
        <path d="M-60 -20 H-30 M-60 -60 H-30 M-60 -100 H-30" />
      </g>
      <Person x={40} pose="push" accent />
      <Person x={560} pose="point" />
      {/* wheelbarrow of fresh blocks */}
      <g transform="translate(110 214)">
        <path d="M-24 -14 H24 L 16 6 H -16 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M-16 6 L -24 18 M16 6 L 24 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <Wheel x={0} y={18} r={9} />
        <rect x="-12" y="-24" width="14" height="10" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <rect x="4" y="-28" width="12" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" />
      </g>
      <Dashes x={0} y={160} n={2} />
      <SignPost x={780} label="LCP 2.5s" flip />
      <Grass x={330} />
      <Grass x={880} s={0.9} />
      <Sparkle x={330} y={90} s={0.7} />
    </>
  );
}

function BalloonScene() {
  return (
    <>
      <Sun x={812} y={50} />
      <Cloud x={220} y={44} s={0.85} />
      <Bird x={560} y={56} />
      {/* the phone-shaped hot air balloon */}
      <g transform="translate(420 110)">
        <g className="crew-bob-slow">
          <rect x="-58" y="-88" width="116" height="150" rx="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M-20 -74 H20" strokeWidth="1.6" strokeLinecap="round" />
          <rect x="-26" y="-40" width="52" height="52" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <rect x="-8" y="-22" width="16" height="16" className="fill-accent stroke-none" />
          <path d="M-34 62 L -22 92 M34 62 L 22 92" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M-30 78 h60" strokeWidth="1.4" strokeLinecap="round" />
          {/* the rider in the basket */}
          <circle cx="-10" cy="84" r="7" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M-10 91 C -14 98 -13 104 -12 108" strokeWidth="1.8" strokeLinecap="round" />
          <rect x="-26" y="104" width="52" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <g className="crew-wave">
            <path d="M-2 96 C 6 92 12 86 15 79" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </g>
        </g>
      </g>
      {/* ground crew holding the tether */}
      <Person x={210} pose="push" flip />
      <path d="M252 124 C 300 130 350 140 388 200" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="1 7" />
      <Person x={660} pose="wave" />
      <Person x={790} pose="point" flip />
      <Dashes x={60} y={150} n={3} />
      <SignPost x={110} label="2 STORES" />
      <Grass x={560} />
      <Grass x={880} s={0.9} />
      <Sparkle x={560} y={60} s={0.8} delay="0.6s" />
    </>
  );
}

function EaselScene() {
  return (
    <>
      <Sun x={800} y={54} />
      <Cloud x={170} y={42} s={0.8} />
      <Bird x={640} y={60} flip />
      {/* the easel holding the canvas */}
      <g transform="translate(330 232)" stroke="currentColor" strokeLinecap="round" fill="none">
        <path d="M-10 0 L 30 -160 M110 0 L 70 -160 M-10 0 L 110 0" strokeWidth="2.2" />
        <g className="crew-bob-slow">
          <rect x="6" y="-214" width="108" height="96" strokeWidth="2.4" strokeLinejoin="round" />
          {/* the wireframe being drawn */}
          <path d="M18 -196 H84" strokeWidth="2" />
          <path d="M18 -182 H60" strokeWidth="2" />
          <rect x="18" y="-168" width="30" height="22" strokeWidth="1.8" />
          <rect x="56" y="-168" width="30" height="22" strokeWidth="1.8" />
          <rect x="74" y="-202" width="12" height="12" className="fill-accent stroke-none" />
        </g>
        {/* the tray */}
        <path d="M2 -116 H118" strokeWidth="2" />
      </g>
      {/* the designer, mid-stroke with the giant pen */}
      <Person x={290} pose="holdUp" accent />
      <g transform="translate(290 232)">
        <g className="crew-wave">
          <path d="M32 -134 L 96 -196" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M96 -196 l10 10 l-12 4 l-4 -12 Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </g>
      </g>
      {/* palette carrier */}
      <Person x={620} pose="walk" />
      <g transform="translate(620 232)">
        <ellipse cx="26" cy="-116" rx="18" ry="12" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="20" cy="-120" r="2.4" className="fill-accent stroke-none" />
        <circle cx="30" cy="-122" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="34" cy="-113" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
      </g>
      <Person x={780} pose="point" />
      <SignPost x={130} label="WCAG AA" />
      <Grass x={540} />
      <Grass x={880} s={0.9} />
      <Sparkle x={480} y={70} s={0.8} />
      <Sparkle x={550} y={100} s={0.55} delay="0.5s" />
    </>
  );
}

function CloudUploadScene() {
  return (
    <>
      <Sun x={110} y={50} />
      <Bird x={620} y={56} flip />
      {/* the big cloud, waiting to be filled */}
      <g transform="translate(620 96)" className="text-foreground/85">
        <path
          d="M-84 20 C -104 20 -110 -4 -92 -14 C -88 -38 -50 -46 -34 -30 C -22 -50 22 -50 32 -30 C 60 -36 80 -12 64 6 C 54 20 30 20 12 20 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <rect x="-16" y="-14" width="12" height="12" className="fill-accent stroke-none" />
      </g>
      {/* the upload ramp with rollers */}
      <g transform="translate(140 232)">
        <path d="M0 0 L 380 -104" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <Wheel x={40} y={-11} r={8} />
        <Wheel x={150} y={-41} r={8} />
        <Wheel x={260} y={-71} r={8} />
        <path d="M-20 4 H0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </g>
      {/* parcels on the belt, one lifting off into the cloud */}
      <Parcel x={200} y={198} s={0.9} />
      <Parcel x={310} y={168} s={0.85} />
      <Parcel x={430} y={128} s={0.8} spin delay="-0.5s" />
      <Parcel x={560} y={88} s={0.7} spin delay="-1.3s" />
      {/* the pusher and the valve operator */}
      <Person x={110} pose="push" accent />
      <g transform="translate(790 232)">
        <g transform="translate(0 -34)">
          <Wheel x={0} y={0} r={20} />
        </g>
        <path d="M-8 -34 L 8 -62" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M8 -62 h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </g>
      <Person x={790} pose="console" />
      <Dashes x={30} y={150} n={2} />
      <SignPost x={520} label="PIPELINE" flip />
      <Grass x={640} s={0.8} />
      <Grass x={880} />
      <Sparkle x={720} y={140} s={0.7} delay="0.4s" />
    </>
  );
}

function FlipchartScene() {
  return (
    <>
      <Sun x={820} y={52} />
      <Cloud x={200} y={44} s={0.8} />
      <Bird x={540} y={64} />
      {/* the flipchart with the rising line */}
      <g transform="translate(330 232)" stroke="currentColor" strokeLinecap="round" fill="none">
        <path d="M-10 0 L 30 -160 M110 0 L 70 -160 M-10 0 L 110 0" strokeWidth="2.2" />
        <g className="crew-bob-slow">
          <rect x="2" y="-212" width="116" height="94" strokeWidth="2.4" strokeLinejoin="round" />
          {/* bars */}
          <path d="M18 -142 V-160 M38 -142 V-176 M58 -142 V-190 M78 -142 V-202" strokeWidth="2.4" />
          {/* the trend line, climbing */}
          <path d="M18 -156 L 38 -172 L 58 -184 L 78 -198" className="stroke-accent" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M70 -198 l8 -2 l-2 8" className="stroke-accent" strokeWidth="1.8" strokeLinejoin="round" />
        </g>
        <path d="M-2 -114 H122" strokeWidth="2" />
      </g>
      {/* the analyst marks the peak from a step stool */}
      <g transform="translate(470 232)" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round">
        <rect x="-22" y="-40" width="44" height="40" strokeLinejoin="round" />
        <path d="M-22 -20 H22" strokeWidth="1.2" />
      </g>
      <Person x={470} pose="console" accent />
      {/* chart roll carrier + a second reader */}
      <Person x={640} pose="walk" />
      <g transform="translate(640 232)">
        <g transform="rotate(-14 30 -112)">
          <rect x="16" y="-124" width="28" height="12" strokeWidth="1.8" />
        </g>
      </g>
      <Person x={790} pose="point" flip />
      <SignPost x={130} label="1 TRUTH" />
      <Grass x={580} />
      <Grass x={880} s={0.9} />
      <Sparkle x={560} y={70} s={0.75} />
    </>
  );
}

function ConductorScene() {
  return (
    <>
      <Sun x={120} y={52} />
      <Cloud x={330} y={42} s={0.8} />
      <Bird x={620} y={58} flip />
      {/* the conductor */}
      <Person x={250} pose="launch" accent />
      <g transform="translate(250 232)">
        <g className="crew-wave">
          <path d="M-36 -138 L -52 -170" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <rect x="-58" y="-178" width="9" height="9" className="fill-accent stroke-none" />
        </g>
      </g>
      {/* the small orchestra: three robots on stands */}
      {[420, 560, 700].map((x, i) => (
        <g key={x} transform={`translate(${x} 232)`}>
          <g className="crew-bob-slow" style={{ animationDelay: `${-0.6 * i}s` }}>
            <rect x="-16" y="-96" width="32" height="38" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <rect x="-10" y="-118" width="20" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <rect x="-4" y="-113" width="6" height="6" className="fill-accent stroke-none" />
            <path d="M0 -118 V-128" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            {/* the singing squiggle */}
            <path
              d={`M20 ${-112 - i * 6} c 6 -4 10 4 16 0 c 4 -3 8 3 12 0`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </g>
          {/* the stand leg */}
          <path d="M0 -58 L -12 -20 M0 -58 L 12 -20 M0 -58 V-20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
        </g>
      ))}
      {/* a music stand with the score */}
      <g transform="translate(320 232)" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round">
        <path d="M0 0 V-96" />
        <rect x="-20" y="-126" width="40" height="30" strokeLinejoin="round" />
        <path d="M-12 -118 h24 M-12 -111 h16 M-12 -104 h20" strokeWidth="1.2" />
      </g>
      <SignPost x={110} label="GUARDED" />
      <Grass x={810} />
      <Grass x={880} s={0.9} />
      <Sparkle x={800} y={80} s={0.7} delay="0.5s" />
    </>
  );
}

function GearScene() {
  return (
    <>
      <Sun x={812} y={52} />
      <Cloud x={200} y={44} s={0.8} />
      <Bird x={580} y={62} />
      {/* two interlocked gears, one winds the other */}
      <g transform="translate(400 130)">
        <g className="crew-wheel" style={{ animationDuration: "18s" }} stroke="currentColor" fill="none">
          <circle r="52" strokeWidth="2.4" />
          <circle r="14" strokeWidth="2" />
          <path d="M0 -52 V-66 M0 52 V66 M-52 0 H-66 M52 0 H66" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M-37 -37 l-10 -10 M37 37 l10 10 M37 -37 l10 -10 M-37 37 l-10 10" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M-26 -26 L 26 26" strokeWidth="1.6" />
        </g>
      </g>
      <g transform="translate(508 196)">
        <g className="crew-wheel" style={{ animationDuration: "12s", animationDirection: "reverse" }} stroke="currentColor" fill="none">
          <circle r="34" strokeWidth="2.4" />
          <circle r="10" strokeWidth="2" />
          <path d="M0 -34 V-44 M0 34 V44 M-34 0 H-44 M34 0 H44" strokeWidth="2" strokeLinecap="round" />
          <path d="M-24 24 L 24 -24" strokeWidth="1.4" />
        </g>
      </g>
      <rect x="394" y="124" width="12" height="12" className="fill-accent stroke-none" />
      {/* the operator turns the crank */}
      <Person x={330} pose="push" flip />
      <g transform="translate(330 232)">
        <path d="M40 -108 L 64 -130" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M64 -130 h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </g>
      {/* the wrench carrier */}
      <Person x={680} pose="walk" accent />
      <g transform="translate(680 232)">
        <g transform="rotate(24 34 -110)">
          <path d="M26 -122 L 52 -148" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M52 -148 c 8 -8 20 -6 24 2 c -6 -2 -12 0 -16 6 c -4 -6 -10 -8 -16 -6 c -2 0 -4 2 -4 2 Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </g>
      </g>
      <Dashes x={60} y={150} n={2} />
      <SignPost x={120} label="MADE 2 FIT" />
      <Grass x={560} s={0.8} />
      <Grass x={880} />
      <Sparkle x={620} y={70} s={0.7} delay="0.6s" />
    </>
  );
}

function MegaphoneScene() {
  return (
    <>
      <Sun x={120} y={52} />
      <Cloud x={560} y={42} s={0.8} />
      <Bird x={430} y={58} flip />
      {/* the announcer on a crate */}
      <g transform="translate(240 232)" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round">
        <rect x="-26" y="-34" width="52" height="34" strokeLinejoin="round" />
        <path d="M-26 -17 H26" strokeWidth="1.2" />
      </g>
      <Person x={240} pose="console" accent />
      {/* the megaphone */}
      <g transform="translate(240 232)">
        <g className="crew-wave">
          <path d="M30 -116 L 74 -138" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M74 -138 L 108 -158 L 108 -108 L 74 -124 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <rect x="96" y="-140" width="8" height="8" className="fill-accent stroke-none" />
        </g>
        {/* sound waves, rolling out */}
        <path d="M116 -146 C 126 -140 126 -128 116 -122" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="crew-dash" />
        <path d="M130 -152 C 144 -142 144 -124 130 -114" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="crew-dash" style={{ animationDelay: "0.4s" }} />
        <path d="M144 -158 C 162 -144 162 -120 144 -106" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="crew-dash" style={{ animationDelay: "0.8s" }} />
      </g>
      {/* the crowd reacting */}
      <Person x={560} pose="wave" />
      <Person x={690} pose="clap" />
      {/* rankings flag climbing the pole */}
      <g transform="translate(830 232)">
        <path d="M0 0 V-150" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <g className="crew-bob-slow">
          <path d="M0 -96 L 46 -106 L 0 -118 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M0 -150 l8 10 l-8 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>
      <SignPost x={110} label="PAGE ONE" />
      <Grass x={460} />
      <Grass x={760} />
      <Sparkle x={760} y={80} s={0.7} delay="0.5s" />
    </>
  );
}

function BugHuntScene() {
  return (
    <>
      <Sun x={812} y={52} />
      <Cloud x={220} y={44} s={0.8} />
      <Bird x={600} y={60} flip />
      {/* the bug, big, doodled, doomed */}
      <g transform="translate(600 226)">
        <g className="crew-bob-slow">
          <ellipse cx="0" cy="-16" rx="34" ry="22" fill="none" stroke="currentColor" strokeWidth="2.2" />
          <path d="M-34 -16 L -50 -30 M34 -16 L 50 -30 M-30 -2 L -44 8 M30 -2 L 44 8 M-24 -30 L -30 -44 M24 -30 L 30 -44" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="-14" cy="-26" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="14" cy="-26" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M-14 -34 L -20 -46 M14 -34 L 20 -46" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M-12 -16 h10 M12 -16 h-10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          {/* one accent spot, it's the rare one */}
          <rect x="-4" y="-20" width="8" height="8" className="fill-accent stroke-none" />
        </g>
      </g>
      {/* the hunter with the magnifier */}
      <Person x={420} pose="point" accent />
      <g transform="translate(420 232)">
        <g className="crew-wave">
          <path d="M36 -128 L 62 -152" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="72" cy="-162" r="14" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M62 -152 L 52 -142" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </g>
      </g>
      {/* the net holder, flanking */}
      <Person x={760} pose="holdUp" flip />
      <g transform="translate(760 232)">
        <path d="M-34 -136 L -52 -170" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="-58" cy="-180" rx="12" ry="16" fill="none" stroke="currentColor" strokeWidth="1.8" transform="rotate(-24 -58 -180)" />
      </g>
      {/* the release gate: closed until clean */}
      <g transform="translate(110 232)" stroke="currentColor" strokeWidth="1.9" fill="none" strokeLinecap="round">
        <path d="M0 0 V-64" />
        <rect x="-30" y="-96" width="60" height="32" strokeLinejoin="round" />
        <path d="M-30 -80 H30" strokeWidth="1.4" />
        <rect x="-8" y="-90" width="8" height="8" className="fill-accent stroke-none" />
      </g>
      <SignPost x={300} label="0 ESCAPED" flip />
      <Grass x={220} />
      <Grass x={880} s={0.9} />
      <Sparkle x={300} y={70} s={0.7} />
    </>
  );
}

function ShipItScene() {
  return (
    <>
      <Sun x={112} y={52} />
      <Cloud x={330} y={42} s={0.8} />
      <Bird x={640} y={58} flip />
      {/* the ramp up to the shipping platform */}
      <g stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none">
        <path d="M180 232 L 520 128" />
        <path d="M520 128 H 700" />
        <path d="M700 128 V 232" strokeWidth="1.6" />
        <path d="M520 128 V 160" strokeWidth="1.6" />
      </g>
      {/* the feature cube, halfway up */}
      <g transform="translate(380 172)">
        <g className="crew-bob-slow">
          <rect x="-24" y="-24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" transform="rotate(12)" />
          <rect x="-6" y="-6" width="12" height="12" className="fill-accent stroke-none" transform="rotate(12)" />
        </g>
      </g>
      {/* crew: two pushing the cube; one up top planting the flag (compact, the platform is high) */}
      <Person x={300} pose="push" accent />
      <Person x={348} pose="push" />
      <g transform="translate(660 128)">
        <circle cx="0" cy="-36" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M0 -27 C -3 -18 3 -12 0 -4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <g className="crew-wave">
          <path d="M0 -24 C 8 -28 14 -34 17 -42" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      </g>
      <g transform="translate(686 128)">
        <path d="M0 0 V-58" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M0 -58 L 34 -50 L 0 -42 Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </g>
      {/* the cart waiting at the bottom of the platform */}
      <g transform="translate(760 232)">
        <path d="M-30 -8 H30 L 22 -26 H -22 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <Wheel x={-16} y={0} r={10} />
        <Wheel x={16} y={0} r={10} />
      </g>
      <Dashes x={80} y={150} n={3} />
      <SignPost x={120} label="SHIP FRI" />
      <Grass x={560} s={0.8} />
      <Grass x={880} />
      <Sparkle x={580} y={66} s={0.8} />
    </>
  );
}

const SCENES: Record<string, () => React.JSX.Element> = {
  index: VanScene,
  "ai-ml-engineers": RobotScene,
  "frontend-developers": BrowserScene,
  "backend-developers": RackScene,
  "full-stack-developers": JuggleScene,
  "mobile-developers": ScooterScene,
  "devops-qa-engineers": RocketScene,
  "svc-index": JuggleScene,
  "web-development": WebBuildScene,
  "mobile-apps": BalloonScene,
  "ui-ux": EaselScene,
  "cloud-devops": CloudUploadScene,
  "data-analytics": FlipchartScene,
  "ai-agent-development": ConductorScene,
  "custom-software": GearScene,
  "digital-marketing": MegaphoneScene,
  "qa-testing": BugHuntScene,
  "product-engineering": ShipItScene,
};

const CAPTIONS: Record<string, { title: string; note: string }> = {
  index: { title: "Your next senior is already moving.", note: "matched in 48 hours, the van knows the way" },
  "ai-ml-engineers": { title: "Trained, leashed, shipping.", note: "our robots stay friendly on a short retrieval lead" },
  "frontend-developers": { title: "Pixels, held to a higher standard.", note: "every block placed by hand, no lorem ipsum survived" },
  "backend-developers": { title: "Heavy lifting, quiet wheels.", note: "the rack rides smoothly; the pager stays silent" },
  "full-stack-developers": { title: "The whole stack, in the air at once.", note: "juggling since the first commit, nothing dropped yet" },
  "mobile-developers": { title: "Weekly releases, one handed.", note: "shipping to both stores while holding a coffee" },
  "devops-qa-engineers": { title: "Deployments this boring, on purpose.", note: "the rocket goes up; the 3am page does not" },
  "svc-index": { title: "Everything a product needs. End to end.", note: "the whole stack, kept in the air with style" },
  "web-development": { title: "Built block by block, budgeted to the byte.", note: "the crane lifts nothing we can't measure" },
  "mobile-apps": { title: "One build, two stores, clear skies.", note: "shipping updates while the balloon stays up" },
  "ui-ux": { title: "Drawn before it is built.", note: "the wireframe survives contact with the user" },
  "cloud-devops": { title: "Your infrastructure, delivered by pulley.", note: "parcels of pipeline, uploaded nightly" },
  "data-analytics": { title: "One number, one truth, one flipchart.", note: "the trend is up; the meeting is short" },
  "ai-agent-development": { title: "Three robots, one conductor, zero chaos.", note: "every note they play is grounded" },
  "custom-software": { title: "Gears cut to fit your machine.", note: "nothing off the shelf, nothing rattling" },
  "digital-marketing": { title: "Louder where it matters.", note: "the megaphone only says true things" },
  "qa-testing": { title: "Every release, hunted like it owes us.", note: "the bug never sees Friday" },
  "product-engineering": { title: "Up the ramp and onto the ship.", note: "rolled by hand, every single week" },
};

export function CrewScene({ variant, className }: { variant: string; className?: string }) {
  const Scene = SCENES[variant] ?? VanScene;
  return (
    <svg
      viewBox="0 0 920 260"
      fill="none"
      aria-hidden="true"
      className={cn("w-full text-foreground/85", className)}
    >
      <Ground />
      <Scene />
    </svg>
  );
}

export function crewCopy(variant: string) {
  return CAPTIONS[variant] ?? CAPTIONS.index;
}
