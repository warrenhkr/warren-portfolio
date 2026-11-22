"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { confirmSetup, finishSetup, type SetupState } from "./actions";
import { SubmitButton } from "./submit-button";

const initial: SetupState = {};

/**
 * Découpe une clé base32 en groupes de 4 caractères.
 * Les groupes sont des boîtes inline : le texte copié reste la clé brute, sans espace parasite.
 */
function groups4(value: string): string[] {
  const clean = value.replace(/\s+/g, "");
  const out: string[] = [];
  for (let i = 0; i < clean.length; i += 4) out.push(clean.slice(i, i + 4));
  return out;
}

/** Bouton de copie (presse-papiers) avec retour visuel et annonce lecteur d'écran. */
function CopyButton({ value, label, copiedLabel }: { value: string; label: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Repli (contexte non sécurisé) : on sélectionne la valeur pour un copier manuel.
      const el = document.getElementById("totp-secret-plain");
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
    setCopied(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2200);
  }, [value]);

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 text-[12px] font-medium text-fg transition-colors hover:border-[rgb(var(--accent))]/50 hover:text-[rgb(var(--accent))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent))]"
    >
      <span aria-hidden="true">{copied ? "✓" : "⧉"}</span>
      {copied ? copiedLabel : label}
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? copiedLabel : ""}
      </span>
    </button>
  );
}

/** Enrôlement du second facteur : confirmation du code, puis affichage unique des codes de secours. */
export function SetupForm({ secret, uri }: { secret: string; uri: string }) {
  const [state, formAction] = useFormState<SetupState, FormData>(confirmSetup, initial);
  const chunks = groups4(secret);

  if (state.codes) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-fg">Codes de secours</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Ils ne seront plus jamais affichés. Chacun fonctionne une seule fois, si tu perds ton téléphone.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CopyButton value={state.codes.join("\n")} label="Copier les 10 codes" copiedLabel="Codes copiés" />
          <span className="text-[11px] text-muted">Conserve-les hors ligne.</span>
        </div>
        <ul className="grid grid-cols-2 gap-2 font-mono text-[13px] text-fg">
          {state.codes.map((code) => (
            <li
              key={code}
              className="select-all rounded-lg border border-line bg-surface2 px-3 py-2 tracking-[0.08em]"
            >
              {code}
            </li>
          ))}
        </ul>
        <form action={finishSetup}>
          <SubmitButton pendingLabel="Ouverture de l’administration…">
            J&apos;ai enregistré mes codes — entrer
          </SubmitButton>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-fg">Configurer la double authentification</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          Ouvre ton application d&apos;authentification, ajoute une entrée à partir de cette clé, puis recopie
          le code à 6 chiffres qu&apos;elle affiche.
        </p>
      </div>

      <div className="rounded-xl border border-line bg-surface2 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
            Clé de configuration
          </p>
          <CopyButton value={secret} label="Copier la clé" copiedLabel="Clé copiée" />
        </div>

        {/* Groupes de 4 pour la lecture ; le texte sélectionné reste la clé brute. */}
        <p className="mt-2 select-all break-words font-mono text-[15px] leading-relaxed tracking-[0.02em] text-fg">
          {chunks.map((chunk, index) => (
            <span key={`${chunk}-${index}`} className="inline-block pr-2.5">
              {chunk}
            </span>
          ))}
        </p>
        {/* Valeur brute, pour le repli copier/coller hors presse-papiers. */}
        <span id="totp-secret-plain" className="sr-only">
          {secret}
        </span>

        <div className="mt-3 border-t border-line pt-2.5">
          <a
            href={uri}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[rgb(var(--accent))] underline underline-offset-4 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent))]"
          >
            Ouvrir directement dans l’application
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>

      <form action={formAction} className="space-y-2">
        <label htmlFor="code" className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
          Code à 6 chiffres
        </label>
        <input
          id="code"
          name="code"
          type="text"
          inputMode="numeric"
          pattern="[0-9]{6}"
          autoComplete="one-time-code"
          enterKeyHint="done"
          spellCheck={false}
          maxLength={6}
          required
          autoFocus
          aria-invalid={Boolean(state.error)}
          aria-describedby={state.error ? "code-error" : undefined}
          placeholder="000000"
          className="h-14 w-full rounded-xl border border-line bg-surface pl-[0.5em] text-center font-mono text-xl tracking-[0.4em] text-fg outline-none transition-colors placeholder:text-muted/50 hover:border-[rgb(var(--accent))]/40 focus:border-[rgb(var(--accent))] focus:ring-2 focus:ring-[rgb(var(--accent))]/25 aria-[invalid=true]:border-[rgb(var(--danger))]/70"
        />
        {state.error ? (
          <p
            id="code-error"
            role="alert"
            className="flex items-start gap-1.5 text-[12px] font-medium leading-snug text-[rgb(var(--danger-ink))]"
          >
            <span aria-hidden="true">⚠</span>
            {state.error}
          </p>
        ) : null}
        <div className="pt-1">
          <SubmitButton pendingLabel="Activation en cours…">Activer et entrer</SubmitButton>
        </div>
      </form>
    </div>
  );
}
