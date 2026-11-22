import { brandIcons } from "@/content/brand-icons";

const isDark = (hex: string) => {
  const n = parseInt(hex, 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum < 0.3;
};

/** Logo officiel (Simple Icons) ; couleur de marque, ou couleur du texte si la marque est trop sombre pour le thème. */
export function BrandLogo({ icon, name, className = "size-10" }: { icon?: string; name: string; className?: string }) {
  const b = icon ? brandIcons[icon] : undefined;
  if (!b) {
    return <span aria-hidden="true" className={`grid place-items-center rounded-xl border border-line bg-raise2 font-heading text-lg font-bold text-ember ${className}`}>{name.charAt(0)}</span>;
  }
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label={name} className={className} style={isDark(b.hex) ? { color: "rgb(var(--fg))" } : { color: `#${b.hex}` }}>
      <path fill="currentColor" d={b.path} />
    </svg>
  );
}
