export function formatDate(date: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(date));
}

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function getGoogleMapsSearchUrl(
  address?: string | null,
  city?: string | null
) {
  const query = [address, city]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .join(", ");

  if (!query) {
    return null;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
