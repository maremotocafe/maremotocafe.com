# AGENTS.md

Cocktail bar website (Maremoto Beach, Zaragoza). Mobile-first, SEO-focused, static site.

## Stack

- **Astro 5** (static output) + **React 19** for interactive components
- **Tailwind CSS 4** (Vite plugin, no config file)
- **TypeScript** (strict mode)
- Deployed to **GitHub Pages** via `peaceiris/actions-gh-pages` on push to `master`
- Analytics: **Plausible** (cloud, script snippet)

## Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run check` | `astro check && tsc --noEmit` |
| `npm run format` | Prettier (write) |
| `npm run format:check` | Prettier (check only) |

## Linting & formatting

- **No ESLint** — we rely on `astro check` + `tsc --noEmit` for type safety
- **Prettier** for formatting (with `prettier-plugin-astro`)
- CI runs `astro check` + `build` on every push/PR

## Data model

Menu data lives in `src/data/menu/` as static JSON:

- `categories.json` — category/subcategory definitions
- `config.json` — menu display config
- `items/*.json` — one file per menu item

The admin UI (`src/admin/`) provides CRUD for these JSON files at runtime via a custom Vite plugin (`vite-plugin-jesus-mode`). Changes are written directly to disk and committed via the admin interface. Each item belongs to **one category** and optionally **one subcategory** (enforced in the editor).

## Key directories

```
src/admin/          # Admin panel (React components + API client)
src/components/     # Site components (Menu, ContactForm, etc.)
src/data/menu/      # Menu JSON data (source of truth)
src/assets/carta/   # Menu item images
src/pages/          # Astro pages
src/styles/         # Global CSS
```
