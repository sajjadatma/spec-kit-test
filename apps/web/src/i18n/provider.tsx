"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import en from "./en.json";
import fa from "./fa.json";
type Locale = "en" | "fa";
const dictionary = { en, fa };
const Context = createContext<{ locale: Locale; setLocale(locale: Locale): void; t(key: keyof typeof en): string } | null>(null);
export function LocaleProvider({ children }: { children: React.ReactNode }) { const [locale, setLocale] = useState<Locale>("en"); useEffect(() => { const saved = localStorage.getItem("locale"); if (saved === "fa" || saved === "en") setLocale(saved); }, []); useEffect(() => { document.documentElement.lang = locale; document.documentElement.dir = locale === "fa" ? "rtl" : "ltr"; localStorage.setItem("locale", locale); }, [locale]); const value = useMemo(() => ({ locale, setLocale, t: (key: keyof typeof en) => dictionary[locale][key] }), [locale]); return <Context.Provider value={value}>{children}</Context.Provider>; }
export function useLocale() { const value = useContext(Context); if (!value) throw new Error("LocaleProvider is required"); return value; }
