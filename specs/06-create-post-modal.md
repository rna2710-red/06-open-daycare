# SPEC 06 — Modal "Nueva publicación"

> **Estado:** Aprobado
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-09-18
> **Objetivo:** Implementar el modal "Nueva publicación" que se abre desde el botón "+ Nueva publicación" en el sidebar, replicando el mockup `crear-publicacion.dc.html` con selección de niños, tipo de publicación, descripción y fotos.

## Por qué existe este spec

El botón "+ Nueva publicación" en el sidebar es un placeholder sin funcionalidad. Esta pantalla permite a la maestra crear una publicación del día a día de los niños (comida, siesta, actividad, etc.). El mockup `crear-publicacion.dc.html` define el diseño del modal con todas las secciones requeridas.

## Alcance

**In:**

- Componente `CreatePostModal` (`app/components/home/CreatePostModal.tsx`): modal que se abre al presionar el botón "+ Nueva publicación" en el sidebar. Replica el mockup `references/pantallas/crear-publicacion.dc.html`.
- Header del modal: "Cancelar" (cierra el modal), título "Nueva publicación", "Publicar" (cierra el modal y muestra toast de confirmación).
- Sección "PARA": chips de selección de niños con avatar (initial, color de fondo, color de texto) usando datos de `lib/mock/kids.ts`. Selección múltiple: cada chip se puede activar/desactivar individualmente. Opción "Toda la sala" como chip adicional.
- Sección "TIPO": chips de categoría con colores fijos: Comida (`#9A7B1E`/`#fff`), Siesta (`#E7DCF6`/`#7B5FC0`), Actividad (`#2E89A6`/`#fff`), Logro (`#CFEBD8`/`#3E9B6C`), Ánimo (`#F9D2DE`/`#C56486`), Foto (`#FBD8CC`/`#D9684A`), Anuncio (`#CCD8F4`/`#4E72C8`). Selección de uno solo.
- Sección "DESCRIPCIÓN": textarea con placeholder "Contá cómo le fue hoy…".
- Sección "FOTOS": cuadro de foto existente (placeholder visual) y botón "+ Agregar" (placeholder visual, sin funcionalidad de subida).
- Componente `Toast` (`app/components/shared/Toast.tsx`): notificación breve que aparece al publicar. Mensaje: "Publicación enviada". Se cierra automáticamente después de 3 segundos o al hacer click.
- Integración en sidebar: el botón "+ Nueva publicación" abre el modal en lugar de ser un enlace a `#`.

**Fuera de alcance (specs futuros):**

- Persistencia de la publicación (no se guarda nada).
- Subida real de fotos.
- Validación de campos (descripción obligatoria, al menos un niño seleccionado, etc.).
- Edición o eliminación de publicaciones.
- Feed dinámico (las publicaciones no aparecen en el feed).
- Tipos de publicación configurables.

## Modelo de datos

```ts
// lib/mock/feed.ts (se agrega al archivo existente)

export interface PostType {
  id: string;
  label: string;
  bgColor: string;
  textColor: string;
}

export const postTypes: PostType[] = [
  { id: "comida", label: "Comida", bgColor: "#9A7B1E", textColor: "#fff" },
  { id: "siesta", label: "Siesta", bgColor: "#E7DCF6", textColor: "#7B5FC0" },
  { id: "actividad", label: "Actividad", bgColor: "#2E89A6", textColor: "#fff" },
  { id: "logro", label: "Logro", bgColor: "#CFEBD8", textColor: "#3E9B6C" },
  { id: "animo", label: "Ánimo", bgColor: "#F9D2DE", textColor: "#C56486" },
  { id: "foto", label: "Foto", bgColor: "#FBD8CC", textColor: "#D9684A" },
  { id: "anuncio", label: "Anuncio", bgColor: "#CCD8F4", textColor: "#4E72C8" },
];
```

No se introduce una nueva interfaz para la publicación. Los datos del formulario se manejan con `useState` local en el componente.

## Plan de implementación

1. **Agregar postTypes al mock.** Agregar la interfaz `PostType` y el array `postTypes` a `lib/mock/feed.ts`. Verificar: `npm run build` compila.
2. **Componente Toast.** Crear `app/components/shared/Toast.tsx` (`"use client"`): recibe `message` (string), `isVisible` (boolean), `onClose` (callback). Renderiza un toast fijo abajo al centro, fondo `#3F362E`, texto blanco, border-radius 12px, padding 12px 20px. Se oculta con transición de opacidad. Verificar: build compila.
3. **Componente CreatePostModal.** Crear `app/components/home/CreatePostModal.tsx` (`"use client"`): recibe `isOpen` (boolean) y `onClose` (callback). Renderiza overlay oscuro (`rgba(0,0,0,.4)`) con modal centrado. Si `isOpen` es false, no renderiza nada. Modal: fondo `#FBF4EC`, borde `#ECE0D0`, border-radius 24px, max-width 580px, shadow `0 20px 50px -24px rgba(63,54,46,.35)`. Header: flex con "Cancelar" (`#94887B` 700 15px), título "Nueva publicación" (Fredoka 600 18px), "Publicar" (`#D9583C` 800 15px). Cuerpo: padding 24px 26px. Verificar: build compila.
4. **Sección PARA — chips de niños.** Importar `children` de `lib/mock/kids.ts`. Renderizar chips con avatar circular (initial, avatarColor, avatarTextColor), nombre, estilo pill (padding 6px 14px 6px 6px, border-radius 999px). Estado seleccionado: fondo `#3F362E`, borde `1.5px solid #3F362E`, texto `#fff`. Estado no seleccionado: fondo `#FFFDF9`, borde `1.5px solid #ECE0D0`, texto `#6E6359`. Botón "Toda la sala" sin avatar. Selección múltiple con `useState<string[]>`. Verificar: chips se renderizan con datos del mock.
5. **Sección TIPO — chips de categoría.** Renderizar chips tipo pill con colores de `postTypes`. Estado seleccionado: fondo del color, texto del color, sin borde. Estado no seleccionado: fondo del color con opacidad reducida, texto del color, sin borde. Selección de uno solo con `useState<string>`. Verificar: chips se renderizan con colores correctos.
6. **Sección DESCRIPCIÓN.** Label "DESCRIPCIÓN" (12px 800 `#94887B`, letter-spacing .7px). Textarea con placeholder "Contá cómo le fue hoy…", ancho completo, min-height 120px, border-radius 14px, border 1.5px `#EADFD0`, fondo `#fff`, font-size 15px, color `#3F362E`. Verificar: textarea se renderiza.
7. **Sección FOTOS.** Dos cuadros de 96×96px con border-radius 14px. Primero: fondo `#F4ECE1`, borde 1px `#ECE0D0`, icono de imagen SVG, color `#CBB89F`. Segundo: fondo `#F4ECE1`, borde 1.5px dashed `#DBCDBA`, icono "+" (`#C5503A`), texto "Agregar" (12px, `#B0A290`). Ambos son placeholders visuales. Verificar: cuadros se renderizan.
8. **Integración en sidebar.** En `app/components/shared/Sidebar.tsx`, importar `CreatePostModal`. Agregar estado `useState` para `isModalOpen`. El botón "+ Nueva publicación" ejecuta `e.preventDefault()` y `setIsModalOpen(true)`. Renderizar `<CreatePostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />`. Verificar: click en el botón abre el modal.
9. **Lógica de publicar.** Al hacer click en "Publicar": cerrar el modal y mostrar el toast con mensaje "Publicación enviada". El toast se cierra automáticamente después de 3 segundos. Verificar: click en "Publicar" cierra el modal y muestra el toast.
10. **Click fuera del modal.** Click en el overlay oscuro cierra el modal. Verificar: click fuera cierra.
11. **Verificación visual.** Tomar screenshot del modal abierto y comparar con `references/pantallas/crear-publicacion.dc.html`. Ajustar tokens Tailwind donde difiera.

## Criterios de aceptación

- [ ] `npm run lint` pasa sin errores.
- [ ] `npm run build` compila sin errores de tipos.
- [ ] Click en "+ Nueva publicación" en el sidebar abre el modal.
- [ ] El modal replica el mockup: header con "Cancelar", título "Nueva publicación", "Publicar".
- [ ] Sección "PARA" muestra chips de niños con avatar (initial, color) usando datos de `kids.ts`.
- [ ] Cada chip de niño tiene nombre y avatar circular con color de fondo y texto.
- [ ] Chips de niños son seleccionables (múltiple): click activa/desactiva.
- [ ] Estado seleccionado del chip: fondo `#3F362E`, borde `#3F362E`, texto `#fff`.
- [ ] Estado no seleccionado del chip: fondo `#FFFDF9`, borde `#ECE0D0`, texto `#6E6359`.
- [ ] Botón "Toda la sala" está presente en la sección PARA.
- [ ] Sección "TIPO" muestra 7 chips de categoría: Comida, Siesta, Actividad, Logro, Ánimo, Foto, Anuncio.
- [ ] Cada chip de tipo tiene el color de fondo y texto correcto según el mockup.
- [ ] Selección de tipo es de uno solo: click en uno deselecciona el anterior.
- [ ] Sección "DESCRIPCIÓN" tiene textarea con placeholder "Contá cómo le fue hoy…".
- [ ] Sección "FOTOS" muestra dos cuadros: uno con icono de imagen y otro con "+" y "Agregar".
- [ ] Click en "Cancelar" cierra el modal.
- [ ] Click en "Publicar" cierra el modal y muestra toast "Publicación enviada".
- [ ] Toast aparece fijo abajo al centro con fondo oscuro y texto blanco.
- [ ] Toast se cierra automáticamente después de 3 segundos.
- [ ] Click en el overlay oscuro cierra el modal.
- [ ] A 1280×800 el modal se ve centrado y con el estilo del mockup.
- [ ] Encabezados en Fredoka y cuerpo en Nunito.
- [ ] No hay errores en consola.

## Decisiones

- **Sí:** modal como componente client (`"use client"`) — maneja estado local de selección de niños, tipo, descripción y visibilidad.
- **Sí:** selección múltiple de niños — el mockup muestra chips individuales, no un select múltiple; cada chip se activa/desactiva independientemente. Permite seleccionar uno, varios o todos.
- **Sí:** "Toda la sala" como chip adicional — no afecta la selección individual de niños; es una opción más en la lista.
- **Sí:** selección de tipo es de uno solo — el mockup sugiere categorías excluyentes (una publicación es de un tipo).
- **Sí:** colores de tipos como constants en `lib/mock/feed.ts` — reutilizables y fáciles de mantener; siguen la convención de centralizar datos mock.
- **Sí:** toast como componente separado (`Toast.tsx`) — reutilizable para otras acciones del proyecto.
- **Sí:** fotos como placeholders visuales — el mockup muestra cuadros estáticos; sin funcionalidad de subida.
- **Sí:** reutilizar `children` de `lib/mock/kids.ts` — ya contiene los datos de niños con avatar; no duplicar datos.
- **No:** persistencia de la publicación — va en otro spec cuando haya backend.
- **No:** validación de campos — va en otro spec.
- **No:** subida real de fotos — va en otro spec.
- **No:** feed dinámico — las publicaciones no aparecen en el feed; va en otro spec.
- **No:** responsive con drawer — el modal es un overlay simple; en móvil se adapta automáticamente por max-width.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Fidelidad visual contra el mockup (colores de tipos, espaciados de chips, sombras del modal) | Screenshot comparativo en `.playwright-mcp/`; `arbitrary values` donde falte un token |
| Selección de niños puede ser confusa con muchos niños | Chips con scroll horizontal si exceden el ancho; el mockup muestra solo 3 pero el array tiene 8 |
| Toast puede superponerse con otros elementos | Posicionamiento fijo abajo al centro con z-index alto; transición de opacidad suave |
| Nombre del niño en el chip puede ser largo | Truncar nombre con `truncate` si excede el ancho del chip |

## Lo que **no** está en este spec

- Persistencia de la publicación.
- Validación de campos.
- Subida real de fotos.
- Feed dinámico (las publicaciones no aparecen en el feed).
- Edición o eliminación de publicaciones.
- Tipos de publicación configurables.

Cada una de esas, si llega, va en su propio spec.
