# SPEC 02 — Listado de niños y perfil individual

> **Estado:** Aprobado
> **Depende de:** SPEC 01
> **Fecha:** 2026-09-14
> **Objetivo:** Implementar la ruta `/kids` con el listado de niños y `/kids/[slug]` con el perfil individual, replicando los mockups `ninos.dc.html` y `perfil-nino.dc.html` con datos simulados y sin base de datos.

## Por qué existe este spec

El sidebar del SPEC 01 ya tiene el link "Niños" apuntando a `/kids`. Esta pantalla es la segunda más usada del producto: la maestra necesita ver rápidamente el listado de su sala y acceder al perfil de cada niño para revisar alergias, padres vinculados y datos generales.

## Alcance

**In:**

- Ruta `/kids` (`app/kids/page.tsx`): replica el mockup `references/pantallas/ninos.dc.html` — encabezado "GESTIÓN / Niños", botón "Agregar niño" (placeholder), barra de búsqueda visual (sin funcionalidad), separador "SALA SOLES · 8 niños", grid de 2 columnas con tarjetas enlazadas a `/kids/{slug}`.
- Ruta `/kids/[slug]` (`app/kids/[slug]/page.tsx`): replica el mockup `references/pantallas/perfil-nino.dc.html` — botón "Volver a Niños" (link a `/kids`), avatar grande 84px, nombre, edad, sala, botón "Editar" (placeholder), caja "Alergias y notas", tabla de datos (fecha de nacimiento, sala, ingreso), sidebar derecha con "Resumen del día" (placeholder), "Padres vinculados" con badges ACTIVA/PENDIENTE, "Vincular otro padre" (placeholder).
- Tarjeta de niño (`app/components/kids/KidCard.tsx`): avatar circular con inicial y color, nombre en Fredoka, edad + padres vinculados en Nunito, badge de alergia si aplica o flecha chevron. Hover: borde `#F2A78E` + `translateY(-2px)`.
- Datos simulados tipados en `lib/mock/kids.ts` con los 8 niños del mockup.
- La sidebar reutiliza `app/components/shared/Sidebar.tsx` con `itemActivo="ninos"`.
- 404 si el slug no existe (`notFound()` de Next.js).

**Fuera de alcance (specs futuros):**

- Funcionalidad de búsqueda (el input es solo visual).
- CRUD de niños: agregar, editar, eliminar.
- Ruta "Resumen del día", "Vincular padre", "Agregar niño".
- Conexión a base de datos o API.
- Paginación, filtros por sala, ordenamiento.

## Modelo de datos

```ts
// lib/mock/kids.ts

export interface Parent {
  name: string;              // "Lucía Fernández"
  role: string;              // "Mamá" | "Papá"
  status: "active" | "pending";
  initial: string;           // "L"
  color: string;             // "#C9B6E8"
  textColor: string;         // "#fff"
}

export interface Child {
  id: string;                // "mateo-fernandez" (kebab-case, usado como slug)
  name: string;              // "Mateo Fernández"
  age: string;               // "3 años"
  room: string;              // "Soles"
  initial: string;           // "M"
  avatarColor: string;       // "#A9D9E8"
  avatarTextColor: string;   // "#1F7A93"
  allergyBadge?: string;     // "MANÍ" (solo si tiene alergia visible en tarjeta)
  allergies?: string;        // "Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila."
  birthday: string;          // "12 mar 2022"
  admissionDate: string;     // "feb 2025"
  parents: Parent[];
}

export const children: Child[] = [
  // Los 8 niños del mockup ninos.dc.html
];
```

El slug se almacena directamente en el campo `id` (kebab-case del nombre completo). No se usa un generador dinámico en runtime.

## Plan de implementación

1. **Datos simulados.** Crear `lib/mock/kids.ts` con las interfaces `Child` y `Parent` y el array `children` con los 8 niños del mockup (nombres, edades, iniciales, colores de avatar, alergias visibles, padres con nombre/rol/estado/color). Verificar: `npm run build` compila.
2. **Tarjeta de niño.** Crear `app/components/kids/KidCard.tsx` (server component): recibe un `Child`, renderiza `<a>` con href a `/kids/{id}`, avatar circular (48px) con `avatarColor`/`avatarTextColor` e inicial, nombre en Fredoka 600, línea de edad + padres vinculados en Nunito, badge de alergia (fondo `#FBD8CC` / texto `#D9684A`) si `allergyBadge` existe, o SVG chevron `#CBB89F` si no. Clase CSS `.kid` con `transition: .15s`, hover `border-color: #F2A78E; transform: translateY(-2px)`. Verificar: build compila.
3. **Página listado `/kids`.** Crear `app/kids/page.tsx`: flex con `<Sidebar itemActivo="ninos" />` y `<main>` con scroll propio (100vh), contenido centrado en 880px. Encabezado: "GESTIÓN" (12.5px, 800, `#D9583C`, letter-spacing .8px) + "Niños" (Fredoka 600, 30px). Botón "Agregar niño" con gradiente `#F4977E→#EE8164` (placeholder). Barra de búsqueda: input visual con ícono lupa `#B0A290`, borde `#ECE0D0`, fondo `#FFFDF9`. Separador: "SALA SOLES" (12.5px, 800) + "8 niños" (13px, `#A89A8B`) + línea `#E7DAC8`. Grid `grid-template-columns: repeat(2, 1fr)` con `gap: 14px` y `children.map(c => <KidCard key={c.id} child={c} />)`. Verificar: `/kids` muestra las 8 tarjetas.
4. **Página perfil `/kids/[slug]`.** Crear `app/kids/[slug]/page.tsx`: flex con `<Sidebar itemActivo="ninos" />` y `<main>` centrado en 820px. Si el slug no está en `children`, llamar `notFound()`. Sección izquierda (flex:1, min-width 300px): link "Volver a Niños" (`#94887B`, fontWeight 700, ícono flecha), avatar grande (84px, `avatarColor`, inicial en Fredoka 600 34px), nombre (Fredoka 600, 28px) + "3 años · Sala Soles" (`#94887B`), botón "Editar" (placeholder, borde `#ECE0D0`). Caja rosa `#FBDAD6` "Alergias y notas" con ícono triangular `#F4A8A0`, título `#C5413A`, texto `#B25249`. Tabla de datos (borde `#ECE0D0`, filas `#F0E6D8`): Fecha de nacimiento, Sala, Ingreso. Sección derecha (width 300px): botón "Resumen del día" (fondo `#3F362E`, blanco, ícono sol). Caja "Padres vinculados": etiqueta 12.5px 800 `#8A7C6D`, lista de padres con avatar circular (40px), nombre 800 14.5px, rol + estado 12.5px `#A89A8B`, badge `ACTIVA` (`#CFEBD8`/`#3E9B6C`) o `PENDIENTE` (`#F7E7A6`/`#9A7B1E`). Link "Vincular otro padre" con avatar dashed `#D8CBBA` y texto `#C5503A`. Verificar: `/kids/mateo-fernandez` muestra el perfil completo.
5. **Verificación visual.** Tomar screenshot de `/kids` a 1280×800 y comparar con `references/screenshots/ninos.png`. Tomar screenshot de `/kids/mateo-fernandez` y comparar con `references/pantallas/perfil-nino.dc.html`. Ajustar tokens Tailwind donde difiera.

## Criterios de aceptación

- [ ] `npm run lint` pasa sin errores.
- [ ] `npm run build` compila sin errores de tipos.
- [ ] A 1280×800 la ruta `/kids` replica el mockup: sidebar 248px con "Niños" activo (`#FBE3D8`/`#D9583C`), encabezado "GESTIÓN / Niños", barra de búsqueda, separador "SALA SOLES · 8 niños", grid de 2 columnas con las 8 tarjetas.
- [ ] Cada tarjeta muestra: avatar circular 48px con inicial y color, nombre en Fredoka 600, edad + padres vinculados en Nunito, badge de alergia (fondo `#FBD8CC` / texto `#D9684A`) si aplica, o flecha chevron `#CBB89F`.
- [ ] Hover en tarjeta: borde `#F2A78E` y `translateY(-2px)`.
- [ ] Click en tarjeta navega a `/kids/{slug}` con el slug kebab-case del nombre.
- [ ] A 1280×800 la ruta `/kids/mateo-fernandez` replica el mockup del perfil: avatar 84px, nombre "Mateo Fernández", "3 años · Sala Soles", caja "Alergias y notas" rosa, tabla de datos, "Padres vinculados" con badges ACTIVA/PENDIENTE.
- [ ] Botón "Volver a Niños" en el perfil regresa a `/kids`.
- [ ] Botones "Agregar niño", "Editar", "Resumen del día", "Vincular otro padre" son placeholders visuales (no navegan ni ejecutan acción).
- [ ] Barra de búsqueda es solo visual (sin filtrado).
- [ ] Si el slug no existe se muestra 404.
- [ ] A 375×812: sin scroll horizontal, sidebar fija oculta, hamburguesa visible, drawer funciona (reutiliza componente existente).
- [ ] Encabezados en Fredoka y cuerpo en Nunito.
- [ ] No hay errores en consola.

## Decisiones

- **Sí:** slug kebab-case del nombre completo (`mateo-fernandez`) — más legible que IDs numéricos, el mockup no define URLs.
- **Sí:** solo campos visibles en tarjeta de listado (nombre, edad, padres vinculados, alergia badge) — el perfil completo muestra el resto.
- **Sí:** barra de búsqueda solo visual — se pidió sin funcionalidad; el filtrado puede ir en otro spec.
- **Sí:** botones placeholders — misma convención del SPEC 01 (links inertes hasta specs de funcionalidad).
- **Sí:** reusar `Sidebar.tsx` con `itemActivo="ninos"` — ya existe y funciona.
- **Sí:** datos en `lib/mock/kids.ts` — separados de `lib/mock/feed.ts`; al conectar DB solo cambia el origen.
- **Sí:** interfaz `Child` con campos `avatarColor` y `avatarTextColor` — cada niño tiene su color, no se calcula; ambos puntos (lista y perfil) usan el mismo valor.
- **Sí:** componente `KidCard` en `app/components/kids/` — sigue la convención de organizar por contenido (`home/`, `kids/`, `avisos/`…). Imports directos al archivo, sin barrel files.
- **Sí:** `KidCard` es server component; la página `/kids` también. La página `/kids/[slug]` es server component con `params` async (Next.js 16).
- **Sí:** 404 con `notFound()` de Next.js si el slug no existe en `children`.
- **No:** CRUD de niños — va en otro spec.
- **No:** funcionalidad de búsqueda — va en otro spec.
- **No:** ruta "Resumen del día" — va en otro spec.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Fidelidad visual contra los mockups | Screenshots comparativos en `.playwright-mcp/` antes de dar por terminado; `arbitrary values` donde falte un token |
| Colores de avatar inconsistentes entre lista y perfil | El campo `avatarColor`/`avatarTextColor` está en los datos, no se calcula — ambos puntos usan el mismo valor |

## Lo que **no** está en este spec

- Funcionalidad de búsqueda.
- CRUD de niños (agregar, editar, eliminar).
- Ruta "Resumen del día", "Vincular padre".
- Conexión a base de datos o API.
- Paginación, filtros por sala.

Cada una de esas, si llega, va en su propio spec.
