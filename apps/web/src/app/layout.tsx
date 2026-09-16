import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "../i18n/provider";

export const metadata: Metadata = { title: "Industrial Dashboard", description: "Ceramic and tile management" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" dir="ltr"><body><LocaleProvider>{children}</LocaleProvider></body></html>;
}
