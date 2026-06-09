import type { Metadata } from "next";
import Link from "next/link";
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
            Comercio Vivo
          </Link>
          <nav className="main-nav" aria-label="Navegación principal">
            <Link href="/comercios">Comercios</Link>
            <Link href="/ofertas">Ofertas</Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <p>Una base sencilla para asociaciones de comerciantes locales.</p>
        </footer>
      </body>
    </html>
  );
}
