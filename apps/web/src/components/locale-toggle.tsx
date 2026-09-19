"use client";

import { useLocale } from "../i18n/provider";

export function LocaleToggle() {
  const { locale, setLocale } = useLocale();
  const next = locale === "en" ? "fa" : "en";
  return <button type="button" onClick={() => setLocale(next)} aria-label={next === "fa" ? "Switch to Persian" : "Switch to English"}>{next === "fa" ? "فارسی" : "English"}</button>;
}
