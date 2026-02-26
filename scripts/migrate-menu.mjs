#!/usr/bin/env node
/**
 * One-time migration script: converts Hugo's data/es/menu.yml into
 * the per-item JSON structure used by the Astro site.
 *
 * Output:
 *   src/data/menu/config.json      – UI config (title, steps, pagination, field labels)
 *   src/data/menu/categories.json  – category tree
 *   src/data/menu/items/*.json     – one file per menu item
 *
 * Usage:
 *   node scripts/migrate-menu.mjs            # dry-run (prints stats)
 *   node scripts/migrate-menu.mjs --write    # writes files to disk
 */

import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── Helpers ──────────────────────────────────────────────────────────

/** Slugify a Spanish string for use as a filename (no extension). */
function slugify(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")    // non-alphanum → hyphen
    .replace(/^-+|-+$/g, "");       // trim leading/trailing hyphens
}

/** Strip null/undefined/empty-string values from an object. */
function stripEmpty(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== null && v !== undefined && v !== "") {
      out[k] = v;
    }
  }
  return out;
}

/** Write JSON with 2-space indent, ensuring parent dirs exist. */
function writeJSON(relPath, data) {
  const abs = join(ROOT, relPath);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, JSON.stringify(data, null, 2) + "\n");
}

// ── Parse YAML ───────────────────────────────────────────────────────

const yamlPath = join(ROOT, "data/es/menu.yml");
if (!existsSync(yamlPath)) {
  console.error("ERROR: data/es/menu.yml not found");
  process.exit(1);
}

const raw = yaml.load(readFileSync(yamlPath, "utf8"));

// ── Extract config (everything except categorias and items) ──────────

const config = {
  title: raw.title,
  description: raw.description,
  description_icon: raw.description_icon,
  paso1: raw.paso1,
  paso2: raw.paso2,
  paso3: raw.paso3,
  items_iniciales: raw.items_iniciales,
  items_incremento: raw.items_incremento,
  no_items_mensaje: raw.no_items_mensaje,
  no_items_icono: raw.no_items_icono,
  nombres_datos: raw.nombres_datos,
  titulos_datos: raw.titulos_datos,
  iconos_datos: raw.iconos_datos,
  icono_todo: raw.icono_todo,
  color_todo: raw.color_todo,
  color_bordes: raw.color_bordes,
};

// ── Extract categories ───────────────────────────────────────────────

const categories = raw.categorias.map((cat) => {
  const entry = { nombre: cat.nombre, icono: cat.icono, color: cat.color };
  if (cat.subcategorias && cat.subcategorias.length > 0) {
    entry.subcategorias = cat.subcategorias.map((sub) => ({
      nombre: sub.nombre,
    }));
  }
  return entry;
});

// ── Extract items into per-file JSON ─────────────────────────────────

// Items can share the same nombre (e.g. "Veggie Chips" appears in multiple
// categories). In Hugo they are separate YAML entries rendered independently.
// We preserve them as separate files by appending a counter to duplicate slugs.

const slugCounts = new Map();
const items = [];

for (const item of raw.items || []) {
  const clean = stripEmpty({
    nombre: item.nombre?.trim(),
    prioridad: item.prioridad === true ? true : undefined,
    disponible: item.disponible === false ? false : undefined,
    imagen: item.imagen?.trim(),
    imagen_pequenya: item.imagen_pequenya?.trim(),
    categorias: item.categorias,
    ingredientes: item.ingredientes?.trim?.() || item.ingredientes,
    alergenos: item.alergenos?.trim?.() || item.alergenos,
    txt_aclaraciones: item.txt_aclaraciones?.trim?.() || item.txt_aclaraciones,
    txt_temporal: item.txt_temporal?.trim?.() || item.txt_temporal,
    grad_alcoholica: item.grad_alcoholica?.trim?.() || item.grad_alcoholica,
    vol_ml: item.vol_ml?.trim?.() || item.vol_ml,
    edul_gr: item.edul_gr?.trim?.() || item.edul_gr,
    pvp_local: item.pvp_local?.trim?.() || item.pvp_local,
    pvp_terraza: item.pvp_terraza?.trim?.() || item.pvp_terraza,
    pvp: item.pvp?.trim?.() || item.pvp,
  });

  if (!clean.nombre) {
    console.warn("WARNING: skipping item with no nombre");
    continue;
  }

  // Ensure categorias is always an array
  if (!Array.isArray(clean.categorias)) {
    clean.categorias = clean.categorias ? [clean.categorias] : [];
  }

  // Deduplicate slugs
  const baseSlug = slugify(clean.nombre);
  const count = slugCounts.get(baseSlug) || 0;
  slugCounts.set(baseSlug, count + 1);
  const slug = count === 0 ? baseSlug : `${baseSlug}-${count + 1}`;

  items.push({ slug, data: clean });
}

// ── Output ───────────────────────────────────────────────────────────

const dryRun = !process.argv.includes("--write");

console.log(`\nMigration summary:`);
console.log(`  Categories: ${categories.length}`);
console.log(`  Items:      ${items.length}`);
console.log(`  Unique slugs: ${slugCounts.size}`);
console.log(`  Duplicated names: ${[...slugCounts.values()].filter((c) => c > 1).length}`);
console.log();

if (dryRun) {
  console.log("Dry run — pass --write to write files.\n");

  // Show first 5 items as sample
  console.log("Sample items:");
  for (const { slug, data } of items.slice(0, 5)) {
    console.log(`  ${slug}.json → ${data.nombre} [${data.categorias.join(", ")}]`);
  }

  // Show any duplicate names
  const dupes = [...slugCounts.entries()].filter(([, c]) => c > 1);
  if (dupes.length > 0) {
    console.log("\nDuplicate names (will get suffixed slugs):");
    for (const [slug, count] of dupes) {
      console.log(`  ${slug} (×${count})`);
    }
  }
} else {
  writeJSON("src/data/menu/config.json", config);
  console.log("  ✓ src/data/menu/config.json");

  writeJSON("src/data/menu/categories.json", categories);
  console.log("  ✓ src/data/menu/categories.json");

  for (const { slug, data } of items) {
    writeJSON(`src/data/menu/items/${slug}.json`, data);
  }
  console.log(`  ✓ src/data/menu/items/ (${items.length} files)`);

  console.log("\nDone!");
}
