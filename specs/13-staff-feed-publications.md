# SPEC 13 — Publicaciones reales en el feed del staff

> **Estado:** Borrador
> **Depende de:** SPEC DB 01 (tablas posts + bucket), SPEC 06 (modal Nueva publicación), SPEC 10 (rooms + children)
> **Fecha:** 2026-10-13
> **Objetivo:** Que el staff publique en el feed desde el modal —con texto y hasta 10 fotos opcionales— y que el feed deje los datos mock para mostrar las publicaciones reales de su guardería.

## Por qué existe este spec

El modal "Nueva publicación" (SPEC 06) es una cáscara visual: usa datos mock, no persiste nada y "Publicar" solo muestra un toast. El home renderiza un feed hardcodeado. SPEC DB 01 ya define las tablas `posts`, `post_children`, `post_photos` y el bucket `post-photos`. Este spec conecta las dos puntas: formulario real → servidor → feed real.

## Alcance

**In:**

- Server action `createPost` en `app/actions/posts.ts`: crea la publicación validando rol `staff`, tipo, texto y audiencia; inserta `posts`, `post_children` (si aplica) y `post_photos`.
- Server action `getPostOptions` en `app/actions/posts.ts`: retorna salas y niños activos del daycare del usuario (RLS filtra).
- Server action `getFeedPosts` en `app/actions/posts.ts`: retorna las publicaciones del daycare ordenadas por `published_at` DESC con autor, sala, niños etiquetados y fotos (URLs firmadas, expiración 1 hora).
- Subida de fotos desde el cliente directamente a Storage (`post-photos/{daycare_id}/{uuid}.{ext}`) al hacer clic en "Publicar", antes de llamar `createPost`. Máximo 10 fotos, 4 MB por foto, formatos JPG/PNG/WebP/GIF.
- Reescritura de `CreatePostModal.tsx`:
  - Sección PARA: dropdown de salas (dato real) → al elegir sala aparecen chips de sus niños + botón "Toda la sala" → opción "Toda la guardería" visible solo cuando el tipo es "Anuncio".
  - Tipos alineados al enum `post_type` (6 tipos, sin "ánimo").
  - Descripción obligatoria (no vacía).
  - Selector real de fotos con previews, contador n/10, quitar foto, validación de tamaño y formato.
  - Estados de carga ("Publicando…") y errores en español.
- Contexto `PostComposerProvider` (`app/components/home/PostComposerProvider.tsx`): estado compartido del modal + toast; lo usan el botón del Sidebar y el "Compartí un momento…" del home.
- `Sidebar.tsx`: botón "Nueva publicación" abre el modal vía contexto; bloque de usuario usa el perfil real (`useUser()`), no el mock.
- `app/page.tsx`: feed server-side con datos reales; encabezado con nombre real del usuario y de la guardería; fecha real; link "Compartí un momento…" abre el modal; estado vacío "Todavía no hay publicaciones".
- `PostCard.tsx`: soporta array de fotos reales (grid), etiqueta de audiencia derivada de datos reales, badge para los 6 tipos; sin link "Editar".
- Tokens de color de badge para Comida, Siesta y Foto en `app/globals.css`.
- `lib/mock/feed.ts`: `postTypes` alineados a los 6 tipos del enum (ids en inglés); se elimina el tipo "ánimo".

**Fuera de alcance (specs futuros):**

- Likes/reacciones (`reactions`) y comentarios (`comments`): el footer de `PostCard` muestra contadores en 0; los botones no interactúan.
- Edición o eliminación de publicaciones.
- Vista del feed para familias (`familia-feed`).
- Notificaciones al publicar (`notify_on_post` no se consume).
- Reacción optimista o actualización por Realtime (`router.refresh()` tras publicar alcanza).
- Limpieza de fotos huérfanas en Storage si `createPost` falla tras subir.
- Cambiar el label mock "Sala Soles" del Sidebar por el nombre real de la guardería (el perfil del usuario sí se vuelve real).
- Paginación del feed (se cargan las últimas 50 publicaciones).

## Modelo de datos

No introduce tablas nuevas. Consume SPEC DB 01.

```ts
// app/actions/posts.ts (tipos exportados)

export type PostType =
  | "meal"
  | "nap"
  | "activity"
  | "achievement"
  | "photo"
  | "announcement";

export interface CreatePostInput {
  type: PostType;
  body: string;
  /** Presente cuando la audiencia es "Toda la sala". */
  roomId?: string;
  /** Presente cuando la audiencia son niños específicos. */
  childIds?: string[];
  /** "Toda la guardería": type='announcement', sin roomId ni childIds. */
  photos: { path: string; width?: number; height?: number }[];
}

export interface FeedPost {
  id: string;
  type: PostType;
  authorName: string;
  publishedByYou: boolean;
  audienceLabel: string;
  text: string;
  photoUrls: string[];
  time: string; // HH:MM local
}
```

Validaciones de `createPost` (servidor, además de las del cliente):

- Sesión activa y `users.role = 'staff'` (patrón de `app/actions/invitations.ts`).
- `type` ∈ enum `post_type`.
- `body.trim()` no vacío.
- Audiencia: si `type !== 'announcement'` exige `roomId` o `childIds` no vacío. Si `type === 'announcement'` sin `roomId` ni `childIds` se interpreta como "toda la guardería".
- `photos.length <= 10`.
- `roomId` (si viene) y cada `childId` (si vienen) pertenecen al daycare del usuario (query con el cliente del usuario; RLS también filtra).

## Plan de implementación

1. **Migración DB.** Aplicar SPEC DB 01 (tablas + bucket). Verificar: `supabase_list_tables` muestra las tres tablas; `supabase_list_storage_buckets` incluye `post-photos`.
2. **Tipos de post en UI.** Actualizar `lib/mock/feed.ts`: `PostCategory` pasa a ser el union de los 6 ids del enum (`meal` | `nap` | …); `postTypes` con esos ids, labels en español y los colores del SPEC 06; eliminar "ánimo". Extender `badgeByType` en `PostCard.tsx` a 6 entradas. Agregar tokens `badge-meal`, `badge-nap`, `badge-photo` (texto + fondo) en `app/globals.css`, siguiendo el patrón de los existentes. Verificar: `npm run build` compila.
3. **Server actions de posts.** Crear `app/actions/posts.ts` con `getPostOptions`, `createPost` y `getFeedPosts` según el Modelo de datos y las validaciones. `getFeedPosts` usa `createSignedUrls` de `@supabase/ssr`/storage con 3600 s de expiración. Verificar: build compila.
4. **Proveedor del composor.** Crear `app/components/home/PostComposerProvider.tsx` (`"use client"`): contexto con `openComposer()`, estado del modal y del toast; renderiza `CreatePostModal` + `Toast`; tras publicar con éxito hace `router.refresh()`. Envolver en `app/layout.tsx` dentro de `Providers`. Verificar: build compila; el modal no rompe otras páginas.
5. **Modal con datos reales.** Reescribir `CreatePostModal.tsx`: al abrir llama `getPostOptions` y cachea salas/niños; dropdown de sala; chips de niños filtrados por sala con "Toda la sala" (interacción cruzada existente); "Toda la guardería" solo con tipo Anuncio y excluyente con sala/niños; fotos con `<input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif">`, previews (`URL.createObjectURL`), quitar foto, validación ≤4 MB y ≤10; al "Publicar": validar → subir fotos a Storage con el `daycare_id` del perfil → `createPost` → toast éxito + cerrar, o error en español sin cerrar. Botón "Publicar" deshabilitado y texto "Publicando…" durante el envío. Verificar: flujo manual crea la fila en `posts` y el archivo en el bucket.
6. **Sidebar real.** `Sidebar.tsx`: importar `usePostComposer` del contexto para abrir el modal (quitar `CreatePostModal`/`Toast` locales y sus states); bloque de usuario con `useUser()` (`profile.full_name`, `profile.role`); logout existente sin cambios. Verificar: botón "Nueva publicación" abre el modal y muestra el nombre real.
7. **Home real.** `app/page.tsx`: server component con `createClient(cookieStore)`; query de perfil + guardería + conteo de niños activos + `getFeedPosts` (o query inline equivalente); encabezado con datos reales y fecha con `toLocaleDateString('es-AR', …)`; "Compartí un momento…" como `<button>` que llama `openComposer()`; lista de `PostCard` o estado vacío. Quitar imports de `lib/mock/feed.ts`. Verificar: el feed muestra la publicación creada en el paso 5, de más reciente a más antigua.
8. **PostCard con fotos reales.** Adaptar `PostCard.tsx`: `photoUrls: string[]` renderiza `<img>` en grid (mismo alto del placeholder, `object-cover`, border-radius del mockup); `audienceLabel` ("familia de Mateo", "familias de Mateo, Sofía", "toda la sala", "toda la guardería"); quitar link "Editar"; likes y comments en 0 sin interacción. Verificar: publicación con 2 fotos muestra ambas.
9. **Verificación integral.** `npm run lint` y `npm run build`. Flujo E2E: crear publicación con foto y niños → aparece en feed; sin foto → aparece; anuncio "toda la guardería" → aparece; "Toda la sala" → aparece;Publicar sin descripción → error; foto > 4 MB → rechazo en cliente; cuenta `parent` no puede publicar (RLS + action). Screenshot del modal y del feed contra los mockups `crear-publicacion.dc.html` y `feed.dc.html`.

## Criterios de aceptación

- [ ] `npm run lint` pasa sin errores.
- [ ] `npm run build` compila sin errores de tipos.
- [ ] El modal muestra salas y niños reales del daycare (no `lib/mock/kids.ts`).
- [ ] Elegir una sala filtra los chips de niños a esa sala.
- [ ] "Toda la sala" y selección individual de niños son mutuamente excluyentes (comportamiento del SPEC 06).
- [ ] "Toda la guardería" aparece solo cuando el tipo seleccionado es Anuncio.
- [ ] Elegir "Toda la guardería" limpia sala y niños; elegir una sala limpia "Toda la guardería".
- [ ] La sección TIPO muestra 6 chips: Comida, Siesta, Actividad, Logro, Foto, Anuncio (sin Ánimo).
- [ ] El selector de fotos permite hasta 10 imágenes con previews y quitar cada una.
- [ ] Una foto mayor a 4 MB o de formato no soportado se rechaza con mensaje en español y no se agrega.
- [ ] "Publicar" sin descripción no crea la publicación y muestra error en español.
- [ ] "Publicar" sin audiencia (sin sala, sin niños, sin "Toda la guardería") no crea la publicación y muestra error.
- [ ] Durante el envío el botón "Publicar" está deshabilitado y muestra "Publicando…".
- [ ] Al publicar con éxito: toast "Publicación enviada", el modal cierra y el feed muestra la nueva publicación arriba sin recargar la página (vía `router.refresh()`).
- [ ] La foto se sube al bucket `post-photos` bajo la carpeta `{daycare_id}/` solo al hacer clic en "Publicar".
- [ ] `createPost` inserta `posts` con `author_id` del usuario de sesión y `published_at` actual.
- [ ] Con niños específicos se insertan filas en `post_children`; con "Toda la sala" se inserta `posts.room_id`; con "Toda la guardería" ambos quedan vacíos/nulos y `type = 'announcement'`.
- [ ] El feed del home consulta datos reales (no importa `posts` de `lib/mock/feed.ts`).
- [ ] El feed muestra todas las publicaciones del daycare del usuario, ordenadas de más reciente a más antigua.
- [ ] Un usuario de otro daycare no ve las publicaciones (RLS).
- [ ] Una cuenta `parent` no puede crear publicaciones (action las rechaza y RLS bloquea el INSERT).
- [ ] El encabezado del home muestra el nombre real del usuario y de la guardería.
- [ ] El bloque de usuario del Sidebar muestra el perfil real (`full_name`, `role`).
- [ ] El botón "Compartí un momento…" del home abre el mismo modal que el Sidebar.
- [ ] `PostCard` renderiza las fotos reales en grid y la etiqueta de audiencia correcta según el tipo de público.
- [ ] `PostCard` no muestra link "Editar"; likes y comments muestran 0.
- [ ] Estado vacío del feed muestra "Todavía no hay publicaciones".
- [ ] No hay errores en consola durante el flujo de publicación.

## Decisiones

- **Sí:** subida de fotos desde el cliente a Storage antes del server action — 10 × 4 MB exceden límites de body de server actions; el path `{daycare_id}/…` lo exige el policy de Storage del SPEC DB 01.
- **Sí:** `PostComposerProvider` en el layout — evita dos modales duplicados (Sidebar y home) y deja el toast en un solo lugar.
- **Sí:** server actions para leer opciones y feed — mantiene el patrón de `app/actions/` y centraliza tipos; RLS filtra por daycare automáticamente.
- **Sí:** URLs firmadas (1 h) para las fotos — el bucket es privado; se firman al cargar el feed.
- **Sí:** 6 tipos con ids del enum en inglés y labels en español — decisión del usuario (Q10); la DB es la fuente de verdad.
- **Sí:** "Toda la guardería" solo para anuncios — decisión del usuario (Q11, Q16); el action lo valida.
- **Sí:** dropdown de sala primero, luego chips de sus niños — decisión del usuario (Q20); no se listan todos los niños del daycare de golpe.
- **Sí:** texto obligatorio, foto opcional — decisión del usuario (Q9).
- **Sí:** máximo 10 fotos y 4 MB por foto, formatos imagen comunes — decisiones del usuario (Q17: varias hasta 10; Q21: 4 MB).
- **Sí:** sin validación de `photo_consent` — decisión explícita del usuario (Q12: NO).
- **Sí:** likes y comments en 0, sin "Editar" — las features están fuera de alcance (Q15); el mockup las muestra y mantenerlas evita regresión visual.
- **Sí:** `router.refresh()` tras publicar — actualiza el server component del feed sin Realtime (fuera de alcance).
- **Sí:** feed limitado a 50 publicaciones — sin paginación en esta iteración; suficiente para el volumen de una guardería.
- **Sí:** Sidebar con perfil real vía `useUser()` — el contexto ya existe en `app/providers.tsx`; es cambio mínimo y evita contradicción (nombre real en posts, nombre mock en Sidebar).
- **No:** notificaciones al publicar — fuera de alcance (Q22).
- **No:** vista de familias — fuera de alcance (Q15); `post_children` ya prepara el modelo.
- **No:** editar o eliminar publicaciones — fuera de alcance (Q15); sin policies de UPDATE/DELETE.
- **No:** Realtime en el feed — `router.refresh()` alcanza para una sola persona publicando.
- **No:** borrar `lib/mock/feed.ts` por completo — solo se deja de usar en el home; limpieza completa en otro paso.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Fotos subidas pero `createPost` falla → archivos huérfanos | Aceptado en esta iteración (anotado en alcance); mitigación futura con lifecycle rule o reintento de borde. |
| Upload lento con muchas fotos | Botón "Publicando…" deshabilitado; UX aceptable para ≤10 fotos en conexiones normales. |
| `createSignedUrls` falla parcialmente | Mostrar solo las fotos firmadas correctamente; la publicación no se rompe. |
| Perfil `useUser()` todavía `loading` al abrir modal | Deshabilitar "Publicar" hasta tener `profile.daycare_id`; el upload path lo necesita. |
| Children de otra sala elegidos por race condition | El action revalida que los `childId` pertenezcan al daycare; RLS en `post_children` es la última barrera. |

## Lo que **no** está en este spec

- Likes/reacciones y comentarios.
- Edición o eliminación de publicaciones.
- Vista del feed para familias.
- Notificaciones (push/email) al publicar.
- Realtime y paginación del feed.
- Limpieza de archivos huérfanos en Storage.
- Nombre real de la guardería en el label del Sidebar.

Cada una de esas, si llega, va en su propio spec.
