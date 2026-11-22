import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdmin, currentPendingSession } from "@/lib/auth/require";
import { loginWithPassword, secretForSetup, verifyRecoveryCode, verifySecondFactor } from "./actions";
import { SetupForm } from "./setup-form";
import { SubmitButton } from "./submit-button";

export const metadata: Metadata = {
  title: "Connexion · Administration",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  creds: "E-mail ou mot de passe incorrect.",
  rate: "Trop de tentatives. Réessaie dans un quart d'heure.",
  missing: "Renseigne l'e-mail et le mot de passe.",
  code: "Code refusé.",
  expired: "Session expirée. Reconnecte-toi.",
  db: "Base de données injoignable pour l'instant. Réessaie dans un instant.",
};

/* Jetons de l'ADMIN (admin.css, portés par le layout (auth)) : forge en clair, forge éclaircie en sombre. */
const inputClass =
  "h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-fg outline-none transition-colors placeholder:text-muted/70 hover:border-[rgb(var(--accent))]/40 focus:border-[rgb(var(--accent))] focus:ring-2 focus:ring-[rgb(var(--accent))]/25 aria-[invalid=true]:border-[rgb(var(--danger))]/70";

const labelClass = "block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted";

function ErrorLine({ message, id }: { message: string | null; id?: string }) {
  if (!message) return null;
  return (
    <p
      id={id}
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-[rgb(var(--danger))]/35 bg-[rgb(var(--danger))]/10 px-3 py-2 text-[13px] font-medium leading-snug text-[rgb(var(--danger-ink))]"
    >
      <span aria-hidden="true" className="mt-px">⚠</span>
      <span>{message}</span>
    </p>
  );
}

export default async function LoginPage({ searchParams }: { searchParams: { step?: string; e?: string } }) {
  const already = await getCurrentAdmin();
  if (already) redirect("/admin");

  let ctx: Awaited<ReturnType<typeof currentPendingSession>> = null;
  let unreachable = false;
  try {
    ctx = await currentPendingSession();
  } catch {
    unreachable = true;
  }

  const error = searchParams.e ? (ERRORS[searchParams.e] ?? "La connexion a échoué.") : null;

  if (unreachable) {
    return (
      <Card
        title="Base injoignable"
        subtitle="La connexion à PostgreSQL n'a pas abouti. Rien n'est cassé : réessaie dans quelques instants."
      >
        <a
          href="/admin/login"
          className="flex w-full items-center justify-center rounded-xl bg-[rgb(var(--btn))] px-4 py-3 text-sm font-semibold text-[rgb(var(--btn-ink))] transition-colors hover:bg-[rgb(var(--btn-hover))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent))] focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          Réessayer
        </a>
      </Card>
    );
  }

  /* ---------- étape 1 : mot de passe ---------- */
  if (!ctx) {
    return (
      <Card
        title="Administration"
        subtitle="Accès réservé. Le mot de passe est suivi d'un code à usage unique."
        footer={<Link href="/" className="text-xs text-muted hover:text-fg">← Retour au site</Link>}
      >
        <form action={loginWithPassword} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className={labelClass}>
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              spellCheck={false}
              required
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "login-error" : undefined}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className={labelClass}>
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "login-error" : undefined}
              className={inputClass}
            />
          </div>
          <ErrorLine id="login-error" message={error} />
          <SubmitButton pendingLabel="Vérification du mot de passe…">Continuer</SubmitButton>
        </form>
      </Card>
    );
  }

  /* ---------- étape 2 : code TOTP ---------- */
  if (ctx.admin.totp_enabled && ctx.admin.totp_secret_enc) {
    return (
      <Card
        title="Vérification"
        subtitle={`Saisis le code à 6 chiffres de ton application d'authentification pour ${ctx.admin.email}.`}
        footer={<Link href="/" className="text-xs text-muted hover:text-fg">← Retour au site</Link>}
      >
        <form action={verifySecondFactor} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="code" className={labelClass}>
              Code à 6 chiffres
            </label>
            <input
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              autoComplete="one-time-code"
              autoFocus
              enterKeyHint="done"
              spellCheck={false}
              maxLength={6}
              required
              placeholder="000000"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "code-error" : undefined}
              /* le letter-spacing ajoute une piste après le dernier chiffre : on la compense pour rester centré */
              className="h-16 w-full rounded-xl border border-line bg-surface pl-[0.5em] text-center font-mono text-2xl tracking-[0.5em] text-fg outline-none transition-colors placeholder:text-muted/50 hover:border-[rgb(var(--accent))]/40 focus:border-[rgb(var(--accent))] focus:ring-2 focus:ring-[rgb(var(--accent))]/25 aria-[invalid=true]:border-[rgb(var(--danger))]/70"
            />
          </div>
          <ErrorLine id="code-error" message={error} />
          <SubmitButton pendingLabel="Vérification du code…">Vérifier</SubmitButton>
        </form>
        <details className="mt-5 border-t border-line pt-4 text-sm text-muted">
          <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.12em] hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent))]">
            Utiliser un code de secours
          </summary>
          <form action={verifyRecoveryCode} className="mt-3 space-y-3">
            <label htmlFor="recovery" className="sr-only">
              Code de secours
            </label>
            <input
              id="recovery"
              name="code"
              placeholder="XXXXX-XXXXX"
              autoComplete="off"
              spellCheck={false}
              required
              className="h-11 w-full rounded-xl border border-line bg-surface px-3.5 font-mono text-sm tracking-widest text-fg outline-none transition-colors placeholder:text-muted/50 hover:border-[rgb(var(--accent))]/40 focus:border-[rgb(var(--accent))] focus:ring-2 focus:ring-[rgb(var(--accent))]/25"
            />
            <SubmitButton variant="quiet" pendingLabel="Vérification…">
              Entrer avec un code de secours
            </SubmitButton>
          </form>
        </details>
      </Card>
    );
  }

  /* ---------- premier passage : enrôlement obligatoire ---------- */
  let setup: { secret: string; uri: string } | null = null;
  try {
    setup = await secretForSetup();
  } catch (setupError) {
    console.error("[auth] enrôlement indisponible :", setupError instanceof Error ? setupError.message : setupError);
  }
  if (!setup) redirect("/admin/login?e=db");

  return (
    <Card
      title="Première connexion"
      subtitle="Le second facteur n'est pas encore activé sur ce compte : il faut l'enrôler maintenant."
      footer={<Link href="/" className="text-xs text-muted hover:text-fg">← Retour au site</Link>}
    >
      <SetupForm secret={setup.secret} uri={setup.uri} />
    </Card>
  );
}

function Card({
  title,
  subtitle,
  footer,
  children,
}: {
  title: string;
  subtitle: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
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
          <h1 className="text-xl font-semibold tracking-[-0.01em] text-fg">{title}</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </section>
        <div className="mt-5 text-center">{footer}</div>
      </div>
    </main>
  );
}
