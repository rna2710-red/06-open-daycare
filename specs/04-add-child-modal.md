# SPEC 04 — Modal "Agregar niño"

> **Estado:** Aprobado
> **Depende de:** SPEC 02
> **Fecha:** 2026-09-17
> **Objetivo:** Implementar el modal "Agregar niño" que se abre desde el botón "+ Agregar niño" en la vista `/kids`, replicando el mockup `agregar-nino.dc.html` con campos de formulario, salas hardcodeadas y máscara de fecha de nacimiento.

## Por qué existe este spec

El SPEC 02 dejó el botón "Agregar niño" como placeholder visual. Esta pantalla es el primer paso del flujo de alta de niños: la maestra necesita poder registrar un niño nuevo desde la vista de gestión. El mockup `agregar-nino.dc.html` define el diseño del modal con todos los campos requeridos.

## Alcance

**In:**

- Componente `AddChildModal` (`app/components/kids/AddChildModal.tsx`): modal/dialog que se abre al presionar el botón "+ Agregar niños" en `/kids`. Replica el mockup `references/pantallas/agregar-nino.dc.html`.
- Header del modal: "Cancelar" (cierra el modal y navega a `/kids`), título "Agregar niño", "Guardar" (placeholder, cierra el modal).
- Campo "NOMBRE COMPLETO": input text con placeholder "Ej. Martina López".
- Campo "FECHA DE NACIMIENTO": input con máscara `dd/mm/aaaa` — al escribir "12032022" se muestra "12/03/2022". Separadores automáticos.
- Campo "SALA": dropdown/select con 3 salas hardcodeadas: "Soles", "Lunas", "Estrellas". Estilo similar al mockup (con SVG chevron).
- Campo "ALERGIAS (ETIQUETAS)": input text con placeholder "Ej. Maní, Lactosa" — texto plano, sin funcionalidad de tags.
- Campo "NOTAS MÉDICAS": textarea con placeholder "Indicaciones, medicación, contactos…".
- Integración en `/kids`: el botón "Agregar niños" (ya existente como placeholder) abre el modal en lugar de ser inerte.
- Datos de salas hardcodeadas en `lib/mock/kids.ts` (array `rooms`).

**Fuera de alcance (specs futuros):**

- Persistencia del formulario (no se guarda nada, los botones son placeholders).
- Validación de campos (campos obligatorios, formato de fecha, etc.).
- Funcionalidad de tags en el campo de alergías (por ahora es texto plano).
- CRUD real de niños (crear, editar, eliminar).
- Subida de fotos o documentos.
- Conexión a base de datos o API.

## Modelo de datos

```ts
// lib/mock/kids.ts (se agrega al archivo existente)

export interface Room {
  id: string;                  // "soles"
  name: string;                // "Soles"
}

export const rooms: Room[] = [
  { id: "soles", name: "Soles" },
  { id: "lunas", name: "Lunas" },
  { id: "estrellas", name: "Estrellas" },
];
```

No se introduce una nueva interfaz para el formulario del modal. Los campos se manejan con `useState` local en el componente. No se modifica la interfaz `Child` existente.

## Plan de implementación

1. **Agregar salas al mock.** Agregar la interfaz `Room` y el array `rooms` a `lib/mock/kids.ts`. Verificar: `npm run build` compila.
2. **Componente AddChildModal.** Crear `app/components/kids/AddChildModal.tsx` (`"use client"`): recibe `isOpen` (boolean) y `onClose` (callback). Renderiza un overlay oscuro (`rgba(0,0,0,.4)`) con el modal centrado. Si `isOpen` es false, no renderiza nada. Modal: fondo `#FBF4EC`, borde `#ECE0D0`, border-radius 24px, max-width 520px, shadow `0 20px 50px -24px rgba(63,54,46,.35)`. Header: flex con "Cancelar" (`#94887B` 700 15px), título "Agregar niño" (Fredoka 600 18px), "Guardar" (`#D9583C` 800 15px). Cuerpo: padding 24px 26px. Verificar: build compila.
3. **Campos del formulario.** Dentro del modal, agregar cada campo con su label (12px 800 `#94887B`, letter-spacing .7px) y estilo de input (padding 13px 16px, border-radius 14px, border 1.5px `#EADFD0`, fondo `#fff`, font-size 15px, color `#3F362E`). "NOMBRE COMPLETO" es un input normal. "FECHA DE NACIMIENTO" usa la máscara. "SALA" es un select/dropdown nativo o custom con las 3 salas y SVG chevron. "ALERGIAS" es un input normal. "NOTAS MÉDICAS" es un textarea (min-height 90px). Verificar: todos los campos se renderizan.
4. **Máscara de fecha.** Implementar la lógica de máscara en el componente: al escribir, insertar `/` automáticamente después del 2° y 4° dígito. Limitar a 10 caracteres. Permitir solo dígitos. Placeholder "dd/mm/aaaa". Verificar: escribir "12032022" muestra "12/03/2022".
5. **Integración en `/kids`.** En `app/kids/page.tsx`, importar `AddChildModal`. Agregar estado `useState` para `isModalOpen`. El botón "Agregar niños" ejecuta `setIsModalOpen(true)`. Renderizar `<AddChildModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />`. Verificar: click en "Agregar niños" abre el modal, "Cancelar" lo cierra.
6. **Verificación visual.** Tomar screenshot del modal abierto y comparar con `references/pantallas/agregar-nino.dc.html`. Ajustar tokens Tailwind donde difiera.

## Criterios de aceptación

- [] `npm run lint` pasa sin errores.
- [] `npm run build` compila sin errores de tipos.
- [] Click en "+ Agregar niño" en `/kids` abre el modal.
- [] El modal replica el mockup: header con "Cancelar", título "Agregar niño", "Guardar"; campos nombre, fecha, sala, alergias, notas médicas.
- [] Campo "FECHA DE NACIMIENTO" tiene máscara `dd/mm/aaaa`: al escribir dígitos se insertan separadores automáticamente.
- [] La máscara limita a 10 caracteres y solo permite dígitos.
- [] El placeholder de fecha es "dd/mm/aaaa".
- [] Dropdown "SALA" muestra las 3 opciones: "Soles", "Lunas", "Estrellas".
- [] Dropdown tiene SVG chevron como en el mockup.
- [] Click en "Cancelar" cierra el modal y permanece en `/kids`.
- [] Click en "Guardar" cierra el modal (placeholder, no guarda datos).
- [] Overlay oscuro cubre la pantalla al abrir el modal.
- [] Click fuera del modal cierra el modal.
- [] A 1280×800 el modal se ve centrado y con el estilo del mockup.
- [] Encabezados en Fredoka y cuerpo en Nunito.
- [] No hay errores en consola.

## Decisiones

- **Sí:** modal como componente client (`"use client"`) — maneja estado local (`isOpen`) y máscara de fecha con `useState`.
- **Sí:** máscara de fecha con insertión automática de `/` — más natural que tres inputs separados, sigue el formato del mockup.
- **Sí:** dropdown nativo o custom con las 3 salas hardcodeadas — suficiente para la fase actual; las salas se definen en `lib/mock/kids.ts` para reutilizar si es necesario.
- **Sí:** alergias como input de texto plano — sin funcionalidad de tags; el mockup no muestra tags creados, solo el input con placeholder.
- **Sí:** botones "Cancelar" y "Guardar" cierran el modal — placeholders visuales, sin persistencia ni validación.
- **Sí:** click fuera del modal cierra — comportamiento estándar de modales.
- **Sí:** reutilizar `lib/mock/kids.ts` para las salas — ya contiene los datos de niños; agregar `rooms` al mismo archivo mantiene la convención.
- **No:** persistencia del formulario — va en otro spec cuando haya backend.
- **No:** validación de campos — va en otro spec.
- **No:** funcionalidad de tags en alergías — va en otro spec si se necesita.
- **No:** responsive con drawer — el modal es un overlay simple; en móvil se adapta automáticamente por max-width.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Fidelidad visual contra el mockup (sombras, border-radius, espaciados) | Screenshot comparativo en `.playwright-mcp/`; `arbitrary values` donde falte un token |
| Máscara de fecha puede fallar en pegar texto o en navegación con flechas | Limitar a input controlado: solo dígitos, insertar `/` en posiciones específicas, rechazar input no numérico |
| Dropdown nativo puede no verse fiel al mockup | Usar `<select>` con estilo custom o un componente custom si el nativo no alcanza; el mockup muestra un div con chevron, no un `<select>` nativo |

## Lo que **no** está en este spec

- Persistencia del formulario (no se guarda nada).
- Validación de campos.
- Funcionalidad de tags en alergías.
- CRUD real de niños.
- Subida de fotos o documentos.
- Conexión a base de datos o API.

Cada una de esas, si llega, va en su propio spec.
