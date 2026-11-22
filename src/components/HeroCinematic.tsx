"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";
import { copy } from "@/content/copy";
import { site } from "@/content/site";

type Phase = 0 | 1 | 2 | 3; // 0 écran clair · 1 fissure · 2 ouverture · 3 terminé

/* Palette (fixe : l'intro est une pièce à part, indépendante du thème) */
const PAPER = "#F1EDE6"; // écran
const INK = "#12100E"; // encre
const EMBER = "#C45A00"; // accent chaud (fissure, lueur)
/* gris chaud #6E685F (4,73:1 sur le papier #F1EDE6) et bleu signal #1A3BCC */

/* Déroulé (ms) — enveloppe totale 3 040 ms, sous la limite de 3,2 s */
const T = { crack: 760, open: 1880, finish: 3040 } as const;
const OPEN_MS = 1050; // durée d'un pan
const OPEN_LAG = 70; // décalage du pan droit (effet couture)

/** useLayoutEffect côté serveur → useEffect (évite l'avertissement SSR) */
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
const EASE_SEAM = "cubic-bezier(0.76, 0, 0.24, 1)";
const EASE_CRACK = "cubic-bezier(0.33, 0.9, 0.24, 1)";

/* Styles locaux : keyframes préfixées + une règle d'empilement.
   L'intro vit dans un conteneur transformé (`.page-enter`), qui la confine sous la nav :
   on remonte ce conteneur le temps de la séquence (aucun autre fichier touché). */
const STYLES = `
html[data-intro="play"] body *:has(.intro-overlay) { position: relative; z-index: 95; }
@keyframes hcx-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes hcx-rise { from { opacity: 0; transform: translate3d(0, 12px, 0) } to { opacity: 1; transform: translate3d(0, 0, 0) } }
@keyframes hcx-rule { from { transform: scaleX(0); opacity: 0 } 35% { opacity: 1 } to { transform: scaleX(1); opacity: 1 } }
@keyframes hcx-flare { 0% { opacity: 0 } 16% { opacity: .85 } 100% { opacity: 0 } }
@keyframes hcx-grow { from { transform: scaleY(0) } to { transform: scaleY(1) } }
`;

/* Bords complémentaires : miroir exact (les deux pans font 52 %), profondeur
   0,2–1 % de la largeur du pan ≈ quelques pixels — une déchirure fine, pas une scie. */
const SEAM_DEPTHS = [0, 0.55, 0.22, 0.85, 0.34, 1.05, 0.48, 0.16, 0.92, 0.6, 0.3, 1, 0.44, 0.72, 0.2, 0.58, 0];
const SEAM_Y = [0, 7.5, 12, 21, 27.5, 33, 41, 47.5, 54, 62, 67, 74.5, 80, 88, 93, 97, 100];
const seamLeft = `polygon(${[
  "0 0",
  ...SEAM_Y.slice(0, -1).map((y, i) => `${(100 - SEAM_DEPTHS[i]).toFixed(2)}% ${y}%`),
  "100% 100%",
  "0 100%",
].join(", ")})`;
const seamRight = `polygon(${[
  "100% 0",
  ...SEAM_Y.slice(0, -1).map((y, i) => `${SEAM_DEPTHS[i].toFixed(2)}% ${y}%`),
  "0 100%",
  "100% 100%",
].join(", ")})`;

/* Tracé de la fissure : cassure franche, quasi verticale, avec ramifications anguleuses */
const CRACK_MAIN =
  "M50 0 L50.35 9 L49.85 14.5 L50.3 22 L49.7 27 L50.15 34 L49.6 39.5 L50.25 46 L49.75 51 L50.3 58 L49.8 63 L50.2 70 L49.7 76 L50.2 82 L49.75 88 L50.15 94 L50 100";
const BRANCHES: { d: string; w: number; o: number }[] = [
  { d: "M50.3 22 L52.4 25.5 L53.6 30.2", w: 0.8, o: 0.8 },
  { d: "M49.6 39.5 L47.2 42.8 L46.3 47.5", w: 0.75, o: 0.7 },
  { d: "M50.25 46 L51.9 49.2", w: 0.6, o: 0.55 },
  { d: "M49.8 63 L47.5 66.2 L46.7 70.4", w: 0.62, o: 0.55 },
  { d: "M49.7 76 L51.4 79.2", w: 0.5, o: 0.45 },
  { d: "M49.75 88 L48.1 90.6", w: 0.45, o: 0.38 },
];

/** Une portion de fissure. Son tracé progressif est assuré par le masque du groupe. */
function Crack({
  d,
  width,
  opacity = 1,
  color = INK,
}: {
  d: string;
  width: number;
  opacity?: number;
  color?: string;
}) {
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="miter"
      vectorEffect="non-scaling-stroke"
      opacity={opacity}
    />
  );
}

/**
 * Introduction cinématique : écran clair → fissure tracée → le panneau s'ouvre → hero sombre.
 * - skippable (bouton, Échap, Entrée, espace, molette, touchmove)
 * - jouée une seule fois par session (sessionStorage + data-intro posé sur <html>)
 * - désactivée si prefers-reduced-motion (état final immédiat)
 */
export function HeroCinematic() {
  const { tr } = useLang();
  const [phase, setPhase] = useState<Phase>(0);
  const [gone, setGone] = useState(false);
  const timers = useRef<number[]>([]);
  const settled = useRef(false);
  const prevOverflow = useRef<string>("");
  /* Le conteneur de page est transformé (`.page-enter`) : il capte les enfants
     `fixed`. On recale donc l'écran sur le viewport, puis on s'arrête dès que l'écart est nul. */
  const rootRef = useRef<HTMLDivElement | null>(null);
  const shiftRef = useRef({ x: 0, y: 0 });
  const [shift, setShift] = useState({ x: 0, y: 0 });
  const [alignTick, setAlignTick] = useState(0);

  useIsoLayoutEffect(() => {
    if (gone) return;
    const el = rootRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (Math.abs(r.x) < 0.5 && Math.abs(r.y) < 0.5) return;
    const next = { x: Math.round(shiftRef.current.x - r.x), y: Math.round(shiftRef.current.y - r.y) };
    shiftRef.current = next;
    setShift(next);
  }, [gone, shift, alignTick]);

  useEffect(() => {
    if (gone) return;
    const bump = () => setAlignTick((t) => t + 1);
    window.addEventListener("resize", bump);
    return () => window.removeEventListener("resize", bump);
  }, [gone]);
  const finish = useCallback(() => {
    if (settled.current) return;
    settled.current = true;
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    document.documentElement.dataset.intro = "done";
    try {
      sessionStorage.setItem("intro", "done");
    } catch {}
    document.body.style.overflow = prevOverflow.current;
    setPhase(3);
    timers.current.push(window.setTimeout(() => setGone(true), 260));
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const already = document.documentElement.dataset.intro === "done";
    if (reduced || already) {
      document.documentElement.dataset.intro = "done";
      try {
        sessionStorage.setItem("intro", "done");
      } catch {}
      setGone(true);
      return;
    }

    prevOverflow.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const push = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
    push(() => setPhase(1), T.crack);
    push(() => setPhase(2), T.open);
    push(finish, T.finish);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") finish();
    };
    const onScrollIntent = () => finish();
    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", onScrollIntent, { passive: true });
    window.addEventListener("touchmove", onScrollIntent, { passive: true });
    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onScrollIntent);
      window.removeEventListener("touchmove", onScrollIntent);
      document.body.style.overflow = prevOverflow.current;
    };
  }, [finish]);

  if (gone) return null;

  const open = phase >= 2;
  const draw = phase >= 1;

  return (
    <div
      ref={rootRef}
      className="intro-overlay fixed z-[92] overflow-hidden"
      style={{
        top: shift.y,
        left: shift.x,
        width: "100vw",
        height: "100vh",
        transition: "opacity 260ms ease",
        opacity: phase === 3 ? 0 : 1,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* ── Pans de l'écran clair ───────────────────────────────── */}
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[52%]"
        style={{
          backgroundColor: PAPER,
          clipPath: seamLeft,
          transform: open ? "translate3d(-101%, 0, 0)" : "translate3d(0, 0, 0)",
          transition: `transform ${OPEN_MS}ms ${EASE_SEAM}`,
          filter: "drop-shadow(0 0 26px rgba(18,16,14,.16))",
          willChange: "transform",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-y-0 right-0 w-[52%]"
        style={{
          backgroundColor: PAPER,
          clipPath: seamRight,
          transform: open ? "translate3d(101%, 0, 0)" : "translate3d(0, 0, 0)",
          transition: `transform ${OPEN_MS}ms ${EASE_SEAM} ${OPEN_LAG}ms`,
          filter: "drop-shadow(0 0 26px rgba(18,16,14,.16))",
          willChange: "transform",
        }}
      />

      {/* ── Lueur chaude, très contenue, derrière la fissure ────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "36vmax",
          height: "36vmax",
          background: `radial-gradient(circle, rgba(196,90,0,.17) 0%, rgba(196,90,0,.075) 30%, rgba(26,59,204,.022) 54%, transparent 74%)`,
          filter: "blur(34px)",
          opacity: draw && !open ? 1 : 0,
          transition: "opacity 720ms ease",
        }}
      />
      {/* éclat bref au moment où la couture cède */}
      {phase === 2 && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-1/2 w-[26vmax] -translate-x-1/2"
          style={{
            background: `linear-gradient(90deg, transparent, rgba(196,90,0,.22) 42%, rgba(26,59,204,.10) 58%, transparent)`,
            filter: "blur(28px)",
            animation: "hcx-flare 900ms ease-out both",
          }}
        />
      )}

      {/* ── La fissure ──────────────────────────────────────────── */}
      {draw && (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ opacity: open ? 0 : 1, transition: "opacity 240ms ease" }}
        >
          {/* le masque ouvre le tracé depuis le centre vers le haut et le bas */}
          <defs>
            <mask id="hcx-crack" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="-20" y="-5" width="140" height="110">
              <rect
                x="-20"
                y="0"
                width="140"
                height="100"
                fill="#fff"
                style={{
                  transformBox: "fill-box",
                  transformOrigin: "50% 50%",
                  animation: `hcx-grow 1020ms ${EASE_CRACK} both`,
                }}
              />
            </mask>
          </defs>
          <g mask="url(#hcx-crack)">
            {/* halo chaud le long du trait (blur en unités SVG : 1 u ≈ 14 px) */}
            <g style={{ filter: "blur(0.55px)", opacity: 0.55 }}>
              <Crack d={CRACK_MAIN} width={6} color={EMBER} />
            </g>
            {/* ombre portée du trait (profondeur de la matière) */}
            <g style={{ filter: "blur(0.16px)", opacity: 0.3 }}>
              <Crack d={CRACK_MAIN} width={2.6} />
            </g>
            {/* trait net + ramifications, épaisseur décroissante */}
            <Crack d={CRACK_MAIN} width={1.35} />
            {BRANCHES.map((b) => (
              <Crack key={b.d} d={b.d} width={b.w} opacity={b.o} />
            ))}
          </g>
        </svg>
      )}

      {/* ── Signature typographique ─────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ opacity: phase === 0 ? 1 : 0, transition: "opacity 260ms ease" }}
      >
        <div
          className="absolute left-6 top-6 sm:left-10 sm:top-9"
          style={{ animation: `hcx-fade 620ms 140ms ${EASE_OUT} both` }}
        >
          <span className="block font-mono text-[10px] leading-none tracking-[0.44em] text-[#6E685F]">01 / 01</span>
          <span className="mt-2.5 block h-px w-6 bg-[#12100E]/15" />
        </div>

        <div className="grid h-full place-items-center px-6">
          <div className="text-center">
            <span
              className="mx-auto block h-px w-9 bg-[#C45A00]"
              style={{ animation: `hcx-rule 780ms 220ms ${EASE_OUT} both` }}
            />
            <p
              className="mt-7 font-heading text-[13px] font-medium uppercase leading-none text-[#12100E] sm:text-[15px]"
              style={{
                letterSpacing: "0.46em",
                paddingLeft: "0.46em",
                animation: `hcx-rise 900ms 280ms ${EASE_OUT} both`,
              }}
            >
              {site.name}
            </p>
            <p
              className="mt-5 font-mono text-[10px] uppercase leading-none text-[#6E685F]"
              style={{
                letterSpacing: "0.48em",
                paddingLeft: "0.48em",
                animation: `hcx-fade 720ms 560ms ${EASE_OUT} both`,
              }}
            >
              {tr(copy.hero.kicker)}
            </p>
          </div>
        </div>

        <span
          aria-hidden="true"
          className="absolute bottom-6 left-6 block h-px w-10 bg-[#12100E]/10 sm:bottom-9 sm:left-10"
          style={{ animation: `hcx-rule 900ms 340ms ${EASE_OUT} both` }}
        />
      </div>

      {/* ── Passer ──────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={finish}
        aria-label={tr(copy.common.skip)}
        className="group absolute bottom-5 right-5 z-10 inline-flex items-center gap-2.5 rounded-full border border-[#12100E]/12 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[#5C564D] outline-none transition-colors duration-300 hover:border-[#12100E]/35 hover:text-[#12100E] focus-visible:border-[#12100E]/50 focus-visible:text-[#12100E] focus-visible:ring-2 focus-visible:ring-[#C45A00]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F1EDE6] sm:bottom-8 sm:right-8 sm:px-5 sm:py-2.5"
        style={{ animation: `hcx-fade 600ms 760ms ${EASE_OUT} both` }}
      >
        {tr(copy.common.skip)}
        <span aria-hidden="true" className="text-[#C45A00] transition-transform duration-300 group-hover:translate-x-0.5">
          →
        </span>
      </button>
    </div>
  );
}
