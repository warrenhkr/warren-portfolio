import { notFound } from "next/navigation";
import { SetupForm } from "../setup-form";

export const metadata = { title: { absolute: "Aperçu enrôlement · Administration" }, robots: { index: false, follow: false } };
// Rendue à la demande : la garde ci-dessous est ainsi évaluée à chaque requête (une page
// statiquement prérendue aurait figé la réponse du build, en développement comme en production).
export const dynamic = "force-dynamic";

/**
 * Écran de vérification visuelle de l'enrôlement 2FA (jeton factice, aucune écriture en base).
 * Réservé au développement : en production la route répond 404, pour qu'aucune page d'aperçu
 * de l'administration ne traîne sur le site public.
 */
export default function SetupPreview() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(60%_50%_at_50%_0%,rgb(var(--accent)/0.14),transparent_70%),radial-gradient(40%_40%_at_85%_10%,rgb(var(--signal)/0.10),transparent_72%)]"
      />
      <div className="relative w-full max-w-[420px]">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,rgb(var(--accent)),rgb(var(--signal)))] text-[13px] font-bold text-white">
            WH
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight text-fg">WARREN HOUNKANRIN</p>
            <p className="truncate font-mono text-[10px] uppercase tracking-[0.18em] text-muted">warren_hkr</p>
          </div>
        </div>
        <section className="rounded-2xl border border-line bg-surface/85 p-5 backdrop-blur-xl sm:p-7">
          <h1 className="text-xl font-semibold tracking-[-0.01em] text-fg">Première connexion</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Le second facteur n&apos;est pas encore activé sur ce compte : il faut l&apos;enrôler maintenant.
          </p>
          <div className="mt-6">
            <SetupForm secret="JV7W3AXNYQ4VURSETL4BPY4XEHFREMV4" uri="otpauth://totp/Warren:warrenhkr@gmail.com?secret=JV7W3AXNYQ4VURSETL4BPY4XEHFREMV4&issuer=Warren" />
          </div>
        </section>
        <div className="mt-5 text-center">
          <span className="text-xs text-muted">← Retour au site</span>
        </div>
      </div>
    </main>
  );
}
