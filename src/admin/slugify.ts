/** Slugify a Spanish string for use as a filename (no extension). */
export function slugify(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // non-alphanum → hyphen
    .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens
}
