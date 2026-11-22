"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { L, Lang } from "./types";

type Ctx = { lang: Lang; setLang: (l: Lang) => void; tr: (v: L) => string };
const LangCtx = createContext<Ctx>({ lang: "fr", setLang: () => {}, tr: (v) => v.fr });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");

  useEffect(() => {
    let stored: string | null = null;
    try { stored = localStorage.getItem("lang"); } catch {}
    const initial: Lang = stored === "fr" || stored === "en" ? stored : navigator.language.toLowerCase().startsWith("en") ? "en" : "fr";
    setLangState(initial);
  }, []);

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("lang", l); } catch {}
  }, []);

  const value = useMemo<Ctx>(() => ({ lang, setLang, tr: (v) => v[lang] }), [lang, setLang]);
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export const useLang = () => useContext(LangCtx);
