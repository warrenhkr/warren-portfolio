import type { Config } from "tailwindcss";

const v = (n: string) => `rgb(var(--${n}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: v("bg"),
        raise: v("raise"),
        raise2: v("raise2"),
        fg: v("fg"),
        muted: v("muted"),
        line: v("line"),
        ember: v("ember"),
        signal: v("signal"),
        // alias historiques conservés pour l'espace ADMIN (habillage isolé)
        surface: v("surface"),
        surface2: v("surface2"),
        side: v("side"),
        accent: v("accent"),
      },
      fontFamily: {
        sans: ['"Inter Variable"', "Inter", "system-ui", "sans-serif"],
        heading: ["Poppins", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: { "4xl": "2rem", "5xl": "2.75rem" },
      boxShadow: {
        glass: "inset 0 1px 0 var(--glass-hi), var(--shadow-1)",
        lift: "var(--shadow-2)",
        ember: "0 20px 60px -24px rgb(196 90 0 / 0.55)",
        signal: "0 20px 60px -24px rgb(26 59 204 / 0.55)",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.16, 1, 0.3, 1)",
        inOut: "cubic-bezier(0.76, 0, 0.24, 1)",
      },
      keyframes: {
        floaty: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
        drift: { "0%,100%": { transform: "translate3d(0,0,0) scale(1)" }, "50%": { transform: "translate3d(2%,-3%,0) scale(1.06)" } },
        pulseDot: { "0%,100%": { opacity: "0.35" }, "50%": { opacity: "1" } },
        sheen: { from: { transform: "translateX(-120%)" }, to: { transform: "translateX(220%)" } },
        flow: { to: { strokeDashoffset: "-200" } },
        rise: { from: { opacity: "0", transform: "translateY(18px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        scrollDot: { "0%": { transform: "translateY(0)", opacity: "0" }, "30%": { opacity: "1" }, "100%": { transform: "translateY(16px)", opacity: "0" } },
      },
      animation: {
        floaty: "floaty 7s ease-in-out infinite",
        drift: "drift 18s ease-in-out infinite",
        pulseDot: "pulseDot 2.6s ease-in-out infinite",
        sheen: "sheen 1.6s cubic-bezier(0.16,1,0.3,1)",
        flow: "flow 3s linear infinite",
        rise: "rise 0.7s cubic-bezier(0.16,1,0.3,1) both",
        scrollDot: "scrollDot 2.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
