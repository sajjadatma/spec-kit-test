export default function ProtectedLayout({ children }: { children: React.ReactNode }) { return <main aria-label="Authenticated application">{children}</main>; }
