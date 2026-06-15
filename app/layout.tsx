import type { Metadata } from "next";
import Link from "next/link";
import { PublicNavigation } from "@/components/ui/PublicNavigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "Comercio Vivo",
  description: "Plataforma local para descubrir comercios y usar ofertas medibles."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <header className="site-header">
          <Link className="brand" href="/">
            <span className="brand-mark" aria-hidden="true">CV</span>
            <span>Comercio Vivo</span>
          </Link>
          <nav className="main-nav" aria-label="Navegación principal">
            <Link href="/ofertas">Ofertas</Link>
            <Link href="/comercios">Comercios</Link>
            <Link href="/#campanas">Campañas</Link>
          </nav>
        </header>
        <main>{children}</main>
        <PublicNavigation />
        <footer className="site-footer">
          <Link className="brand footer-brand" href="/">
            Comercio Vivo
          </Link>
          <p>Compra cerca. Descubre más. Haz barrio.</p>
        </footer>
      </body>
    </html>
  );
}
