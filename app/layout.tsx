import type { Metadata } from "next";
import Link from "next/link";
import { PublicNavigation } from "@/components/ui/PublicNavigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "Comercio Vivo",
  description: "Ofertas de comercios cercanos para usar en tienda."
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
            <Link href="/comercios">Tiendas</Link>
            <Link href="/#especiales">Especiales</Link>
          </nav>
        </header>
        <main>{children}</main>
        <PublicNavigation />
        <footer className="site-footer">
          <Link className="brand footer-brand" href="/">
            Comercio Vivo
          </Link>
          <p>Compra cerca. Ahorra hoy. Haz barrio.</p>
        </footer>
      </body>
    </html>
  );
}
