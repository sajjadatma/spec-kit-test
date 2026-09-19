import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "../i18n/provider";
import { LocaleToggle } from "../components/locale-toggle";

export const metadata: Metadata = { title: "Industrial Dashboard", description: "Ceramic and tile management" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" dir="ltr"><body><LocaleProvider><header><LocaleToggle /></header>{children}</LocaleProvider></body></html>;
}
