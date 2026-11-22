"use client";

import { useFormStatus } from "react-dom";

type Props = {
  children: React.ReactNode;
  /** Libellé affiché pendant l'envoi — le bouton est alors désactivé. */
  pendingLabel: string;
  variant?: "primary" | "quiet";
};

/**
 * Bouton de soumission des formulaires d'authentification.
 * Pendant l'envoi : désactivé (pas de double soumission), libellé remplacé,
 * indicateur visuel et annonce pour les lecteurs d'écran.
 */
export function SubmitButton({ children, pendingLabel, variant = "primary" }: Props) {
  const { pending } = useFormStatus();

  const skin =
    variant === "primary"
      ? "bg-[rgb(var(--btn))] text-[rgb(var(--btn-ink))] hover:bg-[rgb(var(--btn-hover))]"
      : "border border-line bg-surface text-fg hover:bg-surface2";

  return (
    <>
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending || undefined}
        className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent))] focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-progress disabled:opacity-75 ${skin}`}
      >
        {pending && (
          <span
            aria-hidden="true"
            className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent"
          />
        )}
        {pending ? pendingLabel : children}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {pending ? pendingLabel : ""}
      </span>
    </>
  );
}
