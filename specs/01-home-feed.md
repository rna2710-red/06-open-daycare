# SPEC 01 — Home feed (réplica del mockup feed.dc.html)

> **Estado:** Aprobado
> **Depende de:** ninguna
> **Fecha:** 2026-09-12
> **Objetivo:** Implementar el mockup `references/pantallas/feed.dc.html` como página home (`/`) con datos simulados, sin autenticación ni base de datos.

## Por qué existe este spec

Es la primera pantalla del producto y establece la base visual que reutilizarán las demás (tokens de color, fuentes Fredoka/Nunito, sidebar compartida). Se construye solo el diseño: sin auth, sin DB y con todos los links inertes.

## Alcance

**In:**

- Página home `/` (`app/page.tsx`): reemplaza por completo el scaffold de create-next-app y replica la pantalla de referencia `references/pantallas/feed.dc.html`: saludo "Buenas, Caro", caja "Compartí un momento…", separador "PUBLICADO HOY" y las 3 publicaciones (logro, actividad con placeholder de foto, anuncio).
- Sidebar reutilizable (`app/components/shared/Sidebar.tsx`): logo OpenDayCare + "Sala Soles", botón "Nueva publicación" con gradiente, nav Feed/Niños/Avisos/Mi cuenta con Feed activo, perfil "Caro Giménez" e icono cerrar sesión.
- Tarjeta de publicación (`app/components/home/PostCard.tsx`): render de cada post según su tipo.
- Sidebar responsive: <768px barra superior con hamburguesa que abre la misma sidebar como drawer overlay; ≥768px fija de 248px como el mockup.
- Tokens de la paleta del mockup en `app/globals.css` (`@theme`) y fuentes Fredoka + Nunito vía `next/font/google` en `app/layout.tsx` (`lang="es"`, metadata "OpenDayCare").
- Datos simulados tipados en `lib/mock/feed.ts`.

**Fuera de alcance (specs futuros):**

- Autenticación y pantalla login.
- Base de datos y persistencia (todo hardcodeado).
- Rutas Niños, Avisos, Mi cuenta, crear/detalle publicación, foto.
- Interactividad real: likes, comentarios, editar, crear publicación.
- Fecha dinámica del saludo (queda fijo "martes 17 jun").
- Vista familia (`familia-feed.dc.html`) y modo oscuro.

## Modelo de datos

```ts
// lib/mock/feed.ts
export type PostType = "achievement" | "activity" | "announcement";

export interface Post {
  id: string;
  type: PostType;
  child: string | null;       // null → "Anuncio general"
  initial: string;            // avatar initial, e.g. "M"
  time: string;               // e.g. "14:20"
  publishedByYou: boolean;
  audience: string;           // UI copy: "familia de Mateo" | "toda la sala"
  text: string;
  photo?: string;             // caption of the dashed placeholder
  likes: number;
  comments: number;
}

export interface User {
  name: string;               // "Caro Giménez"
  role: string;               // "Maestra · Soles"
  initial: string;            // "C"
}

export const classroom = { name: "Sala Soles", childrenCount: 12, today: "martes 17 jun" };
export const user: User = { /* Caro */ };
export const posts: Post[] = [ /* the 3 posts from the mockup */ ];
```

Convenciones de render (derivadas, no guardadas en datos):

- Avatar: post de niño → fondo `#A9D9E8` / texto `#1F7A93` con la inicial; `child === null` → fondo `#CCD8F4` / icono megáfono `#4E72C8`.
- Badge por tipo (etiqueta visual en español, tipo interno en inglés): `achievement` → LOGRO `#3E9B6C` sobre `#CFEBD8`; `activity` → ACTIVIDAD `#2E89A6` sobre `#C7E7F1`; `announcement` → ANUNCIO `#4E72C8` sobre `#CCD8F4`.

## Plan de implementación

1. **Fuentes y tokens.** Reescribir `app/globals.css`: `@theme` con la paleta (`--color-fondo:#F6ECDF`, `--color-superficie:#FFFDF9`, `--color-borde:#ECE0D0`, `--color-borde-suave:#F0E6D8`, `--color-tinta:#3F362E`, `--color-tinta-media:#6E6359`, `--color-tinta-suave:#94887B`, `--color-tinta-mute:#A89A8B`, corales `#F4977E/#EE8164/#F2937A/#F8C3A8`, acentos `#D9583C/#E0654A/#C5503A/#FBE3D8`, pares de badge/avatar) y variables `--font-display`/`--font-sans`. Quitar el bloque dark-mode del boilerplate. Actualizar `app/layout.tsx`: Fredoka (400–700) + Nunito (400–800) con `next/font/google`, `lang="es"`, metadata. Verificar: `npm run build` compila.
2. **Datos simulados.** Crear `lib/mock/feed.ts` con los tipos y constantes del modelo. Verificar: build pasa.
3. **Sidebar.** Crear `app/components/shared/Sidebar.tsx` (`"use client"`, prop `itemActivo`): aside fija de 248px ≥768px y, <768px, barra superior con logo + hamburguesa que abre la misma sidebar como drawer overlay. Links inertes.
4. **Tarjeta de publicación.** Crear `app/components/home/PostCard.tsx`: cabecera (avatar, nombre, hora, badge), "Para: …", texto, placeholder dashed de 200px si hay foto, footer corazones/comentarios/Editar inertes.
5. **Home.** Reescribir `app/page.tsx`: flex con `<Sidebar itemActivo="feed" />` y `<main>` con scroll propio (alto 100vh), contenido centrado en 760px: saludo, caja "Compartí un momento…", separador "PUBLICADO HOY" y `posts.map()` con `<PostCard />`.

## Criterios de aceptación

- [ ] `npm run lint` pasa sin errores.
- [ ] `npm run build` compila sin errores de tipos.
- [ ] A 1280×800 la home replica el mockup: sidebar 248px `#FFFDF9` con borde `#ECE0D0`, botón "Nueva publicación" con gradiente `#F4977E→#EE8164`, saludo "Buenas, Caro", "12 niños · martes 17 jun", caja "Compartí un momento…", separador "PUBLICADO HOY" y los textos exactos de las 3 tarjetas.
- [ ] Badges LOGRO/ACTIVIDAD/ANUNCIO con los pares de color definidos arriba.
- [ ] La tarjeta de actividad muestra el placeholder dashed "Foto · pintando con témperas" (alto 200px).
- [ ] Contadores visibles: 3/1, 5/2 y 8/0 (corazones/comentarios).
- [ ] Encabezados en Fredoka y cuerpo en Nunito.
- [ ] Ningún link navega a otra ruta y no hay errores en consola.
- [ ] A 375×812: sin scroll horizontal, sidebar fija oculta, hamburguesa visible; el drawer se abre y se cierra al tocar el botón o fuera del panel.

## Decisiones

- **Sí:** sidebar como componente reutilizable — aparece en casi todas las pantallas del mockup.
- **Sí:** datos tipados en `lib/mock/feed.ts` — al conectar la DB solo cambia el origen, no la UI.
- **Sí:** identificadores de código en inglés (`PostType`, `child`, `audience`…), textos visuales en español (LOGRO/ACTIVIDAD/ANUNCIO, "familia de Mateo"…) — regla de código limpio del repo.
- **Sí:** links inertes — se pidió solo el diseño; las rutas se cablean en sus propios specs.
- **Sí:** Tailwind v4 + `@theme` — convención del repo; los tokens sirven para el resto de pantallas.
- **Sí:** drawer hamburguesa <768px — el mockup no define móvil; se reusa la misma sidebar sin inventar UI nueva.
- **Sí:** saludo estático ("martes 17 jun") — réplica exacta, cero lógica.
- **Sí:** Fredoka + Nunito con `next/font/google` — self-hosted en build, sin requests externos en runtime; reemplazan Geist.
- **No:** modo oscuro — el diseño es claro fijo; se elimina `prefers-color-scheme` del boilerplate.
- **No:** fecha dinámica, interactividad de likes/comentarios — fuera de alcance.
- **Sí:** componentes en `app/components/`, organizados por contenido: `shared/` para elementos comunes a varias pantallas (Sidebar) y una subcarpeta por página para los propios (`home/` con PostCard; futuras: `ninos/`, `avisos/`…). Imports directos al archivo, sin barrel files.
- `Sidebar` es client component por el estado del drawer; `PostCard` y la página son server components.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Fidelidad píxel-perfect con utilidades Tailwind | Screenshot comparativo contra el mockup en `.playwright-mcp/` antes de dar por terminado; `arbitrary values` donde falte un token |
| Render de fuentes difiere del mockup | Mismas familias y pesos del `<link>` de Google Fonts, cargadas con `next/font` |

## Lo que **no** está en este spec

- Autenticación / login.
- Base de datos y persistencia.
- Rutas de Niños, Avisos, Mi cuenta, crear/detalle publicación.
- Interactividad de publicaciones (likes, comentarios, editar).
- Vista familia, modo oscuro, fecha dinámica.

Cada una de esas, si llega, va en su propio spec.
