"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  { href: "/", label: "Inicio", match: "/" },
  { href: "/ofertas", label: "Ofertas", match: "/ofertas" },
  { href: "/comercios", label: "Comercios", match: "/comercios" },
  { href: "/#campanas", label: "Campañas", match: "/campanas" }
];

export function PublicNavigation() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <nav className="mobile-bottom-nav" aria-label="Navegación móvil">
      {navigationItems.map((item) => {
        const isActive =
          item.match === "/"
            ? pathname === "/"
            : pathname.startsWith(item.match);

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={isActive ? "is-active" : undefined}
            href={item.href}
            key={item.label}
          >
            <span aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
