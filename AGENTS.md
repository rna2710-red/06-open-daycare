<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Commands

- `npm run lint` — ESLint 9 flat config (`eslint.config.mjs`)
- `npm run build` — production build; also the only typecheck gate (no separate typecheck script)
- No test framework is configured — don't invent test commands. Verify changes with `npm run lint` + `npm run build`.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript strict. App dir is `app/` at repo root (no `src/`).
- Tailwind v4, CSS-first config: theme tokens live in `app/globals.css` (`@import "tailwindcss"` + `@theme`). There is no `tailwind.config.js` — don't create one.

## UI source of truth: `references/`

- `app/page.tsx` is still create-next-app boilerplate; the product design exists only in `references/`.
- `references/pantallas/*.dc.html` — self-contained HTML mockups of every screen (login, feed, niños, perfil-niño, resumen-día, vincular-padre, avisos, …). Read the matching mockup before building any screen; they define layout, colors, and copy.
- `references/screenshots/*.png` — screenshots of the same screens.
- Mockups use Fredoka (headings) + Nunito (body).

## Spec-driven workflow

- Features are designed with the `spec` skill (specs are saved under `specs/`) and implemented with `spec-impl`, which creates a branch named after the spec. Both live in `.agents/skills/`.
- /spec Usaremos esta habilidad para crear las especificaciones.
- /spec-impl Usaremos esta skill para hacer las implementaciones.

## Command
- /verify-spec Usaremos el agente `spec-verifier` para validar y corregir los criterios de aceptación de un spec. Revisa lint, build, Next.js best practices vía Context7, compara screenshots con mockups vía Playwright, y corrige tanto el spec como el código cuando hay desviaciones.

## Agents

- `spec-verifier` — Valida y corrige los criterios de aceptación de un spec. Ejecuta lint, build, verifica Next.js best practices vía Context7, compara screenshots con mockups usando Playwright, y corrige tanto el spec como el código cuando hay desviaciones. Guarda screenshots en `.playwright-mcp/`.

## Language

- The product is Spanish: UI copy, mockups, and specs are written in Spanish. Keep user-facing strings in Spanish.

## MCPs

- Playwright screenshots y cualquier cosa relacionada a Playwright tienen que estar en la carpeta .playwright-mcp.
- Context7 usaremos este MCP para traer la documentación actualizada del framework.


## reglas de codigo

- Usar codigo limpio nombres, variables, funciones etc. en inglés 