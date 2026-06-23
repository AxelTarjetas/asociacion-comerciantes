"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type SearchSuggestion = {
  label: string;
  query: string;
};

type HomeSearchOverlayProps = {
  suggestions: SearchSuggestion[];
};

const RECENT_SEARCHES_KEY = "local-commerce-recent-searches";

const recommendedSearches = [
  "carne",
  "pan",
  "cafe",
  "peluqueria",
  "ropa",
  "comida",
  "belleza",
  "servicios"
];

function normalizeTerm(term: string) {
  return term.trim().replace(/\s+/g, " ");
}

function readRecentSearches() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    const parsed = stored ? JSON.parse(stored) : [];

    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string").slice(0, 5)
      : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(term: string) {
  if (typeof window === "undefined") {
    return [];
  }

  const cleanTerm = normalizeTerm(term);

  if (!cleanTerm) {
    return readRecentSearches();
  }

  const nextSearches = [
    cleanTerm,
    ...readRecentSearches().filter(
      (item) => item.toLocaleLowerCase() !== cleanTerm.toLocaleLowerCase()
    )
  ].slice(0, 5);

  window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(nextSearches));

  return nextSearches;
}

export function HomeSearchOverlay({ suggestions }: HomeSearchOverlayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const chipSuggestions = useMemo(() => {
    const unique = new Map<string, SearchSuggestion>();

    [...suggestions, ...recommendedSearches.map((item) => ({ label: item, query: item }))].forEach(
      (suggestion) => {
        const key = suggestion.query.toLocaleLowerCase();

        if (!unique.has(key)) {
          unique.set(key, suggestion);
        }
      }
    );

    return Array.from(unique.values()).slice(0, 10);
  }, [suggestions]);

  useEffect(() => {
    setRecentSearches(readRecentSearches());
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.body.classList.add("search-sheet-open");
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.classList.remove("search-sheet-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function rememberSearch(term: string) {
    const cleanTerm = normalizeTerm(term);

    if (!cleanTerm) {
      return false;
    }

    setRecentSearches(saveRecentSearch(cleanTerm));

    return true;
  }

  function storeSearch(term: string) {
    const wasStored = rememberSearch(term);

    if (wasStored) {
      setIsOpen(false);
    }

    return wasStored;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const input = event.currentTarget.elements.namedItem("q");
    const term = input instanceof HTMLInputElement ? input.value : "";
    const cleanTerm = normalizeTerm(term);

    event.preventDefault();

    if (!rememberSearch(cleanTerm)) {
      return;
    }

    window.location.assign(`/ofertas?q=${encodeURIComponent(cleanTerm)}`);
  }

  return (
    <section className="home-search-launch" aria-label="Buscar ofertas">
      <button
        aria-haspopup="dialog"
        className="home-search-trigger"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <span className="search-trigger-icon" aria-hidden="true" />
        <span>
          <strong>Busca lo que necesitas</strong>
          <small>Carne, pan, cafe, peluqueria...</small>
        </span>
      </button>

      {isOpen ? (
        <div className="home-search-sheet" role="dialog" aria-modal="true">
          <button
            aria-label="Cerrar busqueda"
            className="home-search-backdrop"
            onClick={() => setIsOpen(false)}
            type="button"
          />
          <div className="home-search-panel">
            <div className="home-search-panel-header">
              <div>
                <p className="eyebrow">Buscar ofertas</p>
                <h2>Que necesitas hoy?</h2>
              </div>
              <button
                aria-label="Cerrar busqueda"
                className="home-search-close"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                Cerrar
              </button>
            </div>

            <form
              action="/ofertas"
              className="home-search-panel-form"
              method="get"
              onSubmit={handleSubmit}
            >
              <label htmlFor="home-search-panel-input">Producto, tienda o necesidad</label>
              <div>
                <input
                  autoFocus
                  id="home-search-panel-input"
                  name="q"
                  placeholder="Busca carne, pan, cafe, ropa..."
                  type="search"
                />
                <button type="submit">Buscar</button>
              </div>
            </form>

            <div className="home-search-section">
              <h3>Busquedas recomendadas</h3>
              <div className="home-search-chip-grid">
                {chipSuggestions.map((suggestion) => (
                  <a
                    href={`/ofertas?q=${encodeURIComponent(suggestion.query)}`}
                    key={suggestion.query}
                    onClick={() => storeSearch(suggestion.query)}
                  >
                    {suggestion.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="home-search-section">
              <h3>Recientes</h3>
              {recentSearches.length > 0 ? (
                <div className="home-search-recent-list">
                  {recentSearches.map((term) => (
                    <a
                      href={`/ofertas?q=${encodeURIComponent(term)}`}
                      key={term}
                      onClick={() => storeSearch(term)}
                    >
                      {term}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="home-search-empty">Tus busquedas recientes apareceran aqui.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
