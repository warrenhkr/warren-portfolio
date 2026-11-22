"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLang } from "@/lib/i18n";
import { copy } from "@/content/copy";
import { cn, btn } from "./ui";
import { Icon } from "./Icon";

type Values = { name: string; email: string; subject: string; message: string };
type Errors = Partial<Record<keyof Values, string>>;
type Status = "idle" | "sending" | "success" | "error";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const empty: Values = { name: "", email: "", subject: "", message: "" };

const fieldBase =
  "w-full rounded-2xl border bg-[rgb(var(--bg)/0.45)] px-4 py-3.5 text-sm text-fg placeholder:text-muted transition duration-300 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ember)/0.8)]";

export function ContactForm() {
  const { tr } = useLang();
  const f = copy.contact.form;
  const [v, setV] = useState<Values>(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [serverError, setServerError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const refs = useRef<Partial<Record<keyof Values, HTMLElement | null>>>({});
  const successRef = useRef<HTMLHeadingElement>(null);
  const alertRef = useRef<HTMLParagraphElement>(null);

  const validate = (x: Values): Errors => {
    const e: Errors = {};
    if (x.name.trim().length < 2) e.name = tr(f.errName);
    if (!EMAIL.test(x.email.trim())) e.email = tr(f.errEmail);
    if (x.subject.trim().length < 3) e.subject = tr(f.errSubject);
    if (x.message.trim().length < 10) e.message = tr(f.errMessage);
    return e;
  };

  // Le focus est déplacé après le rendu des messages d'erreur (un effet, pas un rAF).
  useEffect(() => {
    if (!attempt) return;
    const first = (Object.keys(errors)[0] as keyof Values | undefined) ?? undefined;
    if (first) refs.current[first]?.focus();
  }, [attempt, errors]);

  // Fin d'envoi : pendant `sending` le bouton submit est désactivé, le focus
  // serait sinon renvoyé sur <body>. On l'amarre sur le retour utilisateur.
  useEffect(() => {
    if (status === "success") successRef.current?.focus();
    else if (status === "error") alertRef.current?.focus();
  }, [status]);

  async function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const found = validate(v);
    setErrors(found);
    setAttempt((a) => a + 1);

    if (Object.keys(found).length) return;

    const honeypot = (new FormData(ev.currentTarget).get("website") as string) || "";
    setStatus("sending");
    setServerError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...v, website: honeypot }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; code?: string } | null;
      if (res.ok && data?.ok) {
        setStatus("success");
        setV(empty);
        return;
      }
      setServerError(data?.code === "not_configured" ? tr(f.errNotConfigured) : tr(f.errServer));
      setStatus("error");
    } catch {
      setServerError(tr(f.errNetwork));
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div role="status" className="glass flex flex-col items-start gap-4 rounded-[28px] p-8 sm:p-10">
        <span className="grid size-12 place-items-center rounded-2xl border border-[rgb(var(--signal)/0.3)] bg-[rgb(var(--signal)/0.12)] text-signal">
          <Icon name="check" className="size-6" />
        </span>
        <h2 ref={successRef} tabIndex={-1} className="display text-2xl font-bold outline-none">
          {tr(f.successTitle)}
        </h2>
        <p className="max-w-sm text-[15px] leading-relaxed text-muted">{tr(f.successText)}</p>
        <button type="button" className={btn("secondary", "sm")} onClick={() => setStatus("idle")}>
          {tr(f.another)}
        </button>
      </div>
    );
  }

  const set = (k: keyof Values) => (e: { target: { value: string } }) => setV((s) => ({ ...s, [k]: e.target.value }));

  // Le message d'erreur est un frère du <label>, pas un enfant : sinon il
  // s'ajoute au nom accessible du champ (« Nom Votre nom doit… ») en plus d'être
  // annoncé via aria-describedby. La ligne visuelle reste identique.
  const label = (k: keyof Values, text: string) => (
    <div className="mb-2 flex items-center justify-between gap-3">
      <label htmlFor={k} className="text-[13px] font-medium">
        {text}
      </label>
      {errors[k] && (
        <span id={`${k}-err`} className="font-mono text-[10px] normal-case text-red-600 dark:text-red-400">
          {errors[k]}
        </span>
      )}
    </div>
  );

  return (
    <form onSubmit={onSubmit} noValidate aria-busy={status === "sending"} className="glass rounded-[28px] p-6 sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="mono-label">{tr(copy.contact.eyebrow)}</h2>
        <p className="font-mono text-[10px] text-muted">* {tr(f.required)}</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          {label("name", `${tr(f.name)} *`)}
          <input
            ref={(el) => {
              refs.current.name = el;
            }}
            id="name"
            name="name"
            required
            value={v.name}
            autoComplete="name"
            onChange={set("name")}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "name-err" : undefined}
            className={cn(fieldBase, errors.name ? "border-red-500/70" : "border-[rgb(var(--line)/0.12)] focus:border-[rgb(var(--ember)/0.6)]")}
            placeholder={tr(f.placeholderName)}
          />
        </div>

        <div>
          {label("email", `${tr(f.email)} *`)}
          <input
            ref={(el) => {
              refs.current.email = el;
            }}
            id="email"
            name="email"
            type="email"
            required
            value={v.email}
            autoComplete="email"
            onChange={set("email")}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "email-err" : undefined}
            className={cn(fieldBase, errors.email ? "border-red-500/70" : "border-[rgb(var(--line)/0.12)] focus:border-[rgb(var(--ember)/0.6)]")}
            placeholder={tr(f.placeholderEmail)}
          />
        </div>

        <div className="sm:col-span-2">
          {label("subject", `${tr(f.subject)} *`)}
          <input
            ref={(el) => {
              refs.current.subject = el;
            }}
            id="subject"
            name="subject"
            required
            value={v.subject}
            onChange={set("subject")}
            aria-invalid={errors.subject ? true : undefined}
            aria-describedby={errors.subject ? "subject-err" : undefined}
            className={cn(fieldBase, errors.subject ? "border-red-500/70" : "border-[rgb(var(--line)/0.12)] focus:border-[rgb(var(--ember)/0.6)]")}
          />
        </div>

        <div className="sm:col-span-2">
          {label("message", `${tr(f.message)} *`)}
          <textarea
            ref={(el) => {
              refs.current.message = el;
            }}
            id="message"
            name="message"
            rows={6}
            maxLength={2000}
            required
            value={v.message}
            onChange={set("message")}
            aria-invalid={errors.message ? true : undefined}
            aria-describedby={errors.message ? "message-err" : undefined}
            className={cn(fieldBase, "resize-y", errors.message ? "border-red-500/70" : "border-[rgb(var(--line)/0.12)] focus:border-[rgb(var(--ember)/0.6)]")}
          />
        </div>
      </div>

      <div className="absolute -left-[9999px] top-0" aria-hidden="true">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div aria-live="polite" aria-atomic="true">
        {status === "sending" && <p className="sr-only">{tr(f.sending)}</p>}
        {status === "error" && (
          <p
            ref={alertRef}
            tabIndex={-1}
            role="alert"
            className="mt-5 rounded-2xl border border-red-500/35 bg-red-500/10 p-4 text-[13px] leading-relaxed text-red-600 outline-none dark:text-red-300"
          >
            {serverError}
          </p>
        )}
      </div>

      <button type="submit" disabled={status === "sending"} className={cn(btn("ember"), "mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60")}>
        {status === "sending" ? (
          <>
            <span aria-hidden="true" className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {tr(f.sending)}
          </>
        ) : (
          <>
            {tr(f.send)}
            <Icon name="arrow" className="size-4" />
          </>
        )}
      </button>
    </form>
  );
}
