# SPEC 05 — Pantalla "Vincular padre"

> **Estado:** Aprobado
> **Depende de:** SPEC 02
> **Fecha:** 2026-09-18
> **Objetivo:** Implementar la pantalla "Vincular padre" que se accede desde el perfil del niño en `/kids/[nombre-niño]`, replicando el mockup `vincular-padre.dc.html` con formulario de nombre, email, parentesco y código de invitación generado automáticamente.

## Por qué existe este spec

El SPEC 02 dejó el botón "Vincular padre" en el perfil del niño como placeholder. Esta pantalla permite a la maestra agregar un familiar (Papá, Mamá o Tutor) para que reciba el feed del niño. El mockup `vincular-padre.dc.html` define el diseño del formulario con código de invitación auto-generado.

## Alcance

**In:**

- Ruta `/kids/[nombre-niño]/vincular-padre` (`app/kids/[nombre-niño]/vincular-padre/page.tsx`): replica el mockup `references/pantallas/vincular-padre.dc.html`.
- Header: título "Vincular padre", subtítulo "a [nombre del niño]", botón cerrar (X) que navega a `/kids/[nombre-niño]`.
- Info box azul: mensaje "Le enviaremos un correo con un código para que active su cuenta. Solo verá el feed de [nombre del niño]."
- Campo "NOMBRE DEL PADRE/MADRE": input text con placeholder "Ej. Diego Fernández".
- Campo "EMAIL": input email con placeholder "correo@ejemplo.com".
- Validación de campos (nombre obligatorio, formato email, etc.).
- Campo "PARENTESCO": botones tipo radio (Mamá / Papá / Tutor/a). Mamá inicia seleccionado por defecto (fondo `#CCD8F4`, borde `#9FB8EC`, texto `#4E72C8`). Los demás con fondo `#FFFDF9`, borde `#ECE0D0`, texto `#6E6359`.
- Caja de código de invitación: fondo `#FBF1D6`, borde dashed `#E6D08A`, border-radius 16px. Código generado automáticamente (5 caracteres alfanuméricos mayúsculos), texto Fredoka 600 34px, letter-spacing 7px, color `#8A7234`. Texto "Vence en 7 días" debajo.
- Botón "Enviar invitación": gradiente `#F4977E→#EE8164`, sombra, SVG avión de papel, ancho completo. Al presionar, navega a `/kids/[nombre-niño]`.
- Integración en `/kids/[nombre-niño]`: el botón "Vincular padre" (placeholder existente) navega a la nueva ruta.
- Generación de código de invitación: función que genera 5 caracteres alfanuméricos mayúsculos aleatorios.

**Fuera de alcance (specs futuros):**

- Envío real de correo con código de invitación.
- Persistencia de la invitación (no se guarda nada).
- Activación de cuenta del familiar.
- Gestión de familiares vinculados (lista, editar, eliminar).
- Límite de tiempo real de 7 días para el código.

## Modelo de datos

```ts
// lib/mock/kids.ts (se agrega al archivo existente)

export function generateInvitationCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
```

No se introduce una nueva interfaz. El código se genera al cargar la página y se maneja con `useState` local.

## Plan de implementación

1. **Función de generar código.** Agregar `generateInvitationCode()` a `lib/mock/kids.ts`. Verificar: `npm run build` compila.
2. **Página vincular padre.** Crear `app/kids/[nombre-niño]/vincular-padre/page.tsx`: página cliente con useParams para obtener `nombre-niño`. Header con título, subtítulo dinámico y botón X. Info box azul. Campos del formulario. Caja de código con valor generado. Botón enviar. Verificar: build compila.
3. **Estilos del formulario.** Aplicar estilos fieles al mockup: labels 12px 800 `#94887B`, inputs con border-radius 14px, botones de parentesco tipo radio con estado seleccionado. Verificar: formulario se ve como el mockup.
4. **Lógica de parentesco.** Implementar selección de parentesco con `useState`: Mamá seleccionado por defecto, click en otro botón cambia la selección. Verificar: los botones cambian visualmente al seleccionar.
5. **Integración en perfil del niño.** En `app/kids/[nombre-niño]/page.tsx`, agregar botón "Vincular padre" que navegue a `/kids/[nombre-niño]/vincular-padre`. Verificar: click navega a la nueva ruta.
6. **Navegación de retorno.** Botón X y botón "Enviar invitación" navegan a `/kids/[nombre-niño]`. Verificar: ambos botones regresan al perfil.
7. **Verificación visual.** Tomar screenshot de la pantalla y comparar con `references/pantallas/vincular-padre.dc.html`. Ajustar tokens Tailwind donde difiera.

## Criterios de aceptación

- [x] `npm run lint` pasa sin errores.
- [x] `npm run build` compila sin errores de tipos.
- [x] Click en "Vincular padre" desde `/kids/[nombre-niño]` navega a `/kids/[nombre-niño]/vincular-padre`.
- [x] A 1280×800 la ruta replica el mockup: header con título y subtítulo, info box azul, campos nombre/email/parentesco, código de invitación, botón enviar.
- [x] Campo "NOMBRE DEL PADRE/MADRE" tiene placeholder "Ej. Diego Fernández".
- [x] Campo "EMAIL" tiene placeholder "correo@ejemplo.com".
- [x] Los 3 botones de parentesco se renderizan: Mamá, Papá, Tutor/a.
- [x] Mamá inicia seleccionado por defecto con estilo diferente (fondo `#CCD8F4`, borde `#9FB8EC`).
- [x] Click en Papá o Tutor/a cambia la selección visualmente.
- [x] Código de invitación se muestra con 5 caracteres alfanuméricos mayúsculos.
- [x] Código usa Fredoka 600 34px, letter-spacing 7px, color `#8A7234`.
- [x] Texto "Vence en 7 días" debajo del código.
- [x] Click en "Enviar invitación" navega a `/kids/[nombre-niño]`.
- [x] Click en botón X (cerrar) navega a `/kids/[nombre-niño]`.
- [x] El subtítulo muestra el nombre del niño dinámicamente.
- [x] Encabezados en Fredoka y cuerpo en Nunito.
- [x] No hay errores en consola.

## Decisiones

- **Sí:** ruta anidada `/kids/[nombre-niño]/vincular-padre` — sigue la convención de rutas del proyecto y mantiene el contexto del niño.
- **Sí:** código generado automáticamente con `generateInvitationCode()` — más realista que hardcodear; el mockup muestra uno específico pero en producción sería dinámico.
- **Sí:** Mamá seleccionado por defecto — como en el mockup, es el primer botón y tiene el estilo seleccionado.
- **Sí:** botón "Enviar invitación" navega al perfil del niño — opción (a) del usuario, da feedback de que la acción se completó.
- **Sí:** página cliente (`"use client"`) — necesita useParams y estado local para el parentesco y el código.
- **Sí:** reutilizar `lib/mock/kids.ts` para la función de código — ya contiene datos de niños; agregar la función al mismo archivo mantiene la convención.
- **No:** persistencia de la invitación — va en otro spec cuando haya backend.
- **No:** validación de campos — va en otro spec.
- **No:** envío real de correo — va en otro spec.
- **No:** gestión de familiares vinculados — va en otro spec.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Fidelidad visual contra el mockup (colores de botones radio, sombras del código) | Screenshot comparativo en `.playwright-mcp/`; `arbitrary values` donde falte un token |
| Código de invitación puede repetirse entre sesiones | Función genera 5 chars de 36 posibles (60M combinaciones); suficiente para demo |
| Nombre del niño en la URL puede tener caracteres especiales (espacios, ñ) | Usar `decodeURIComponent` en useParams para manejar URL encoding |

## Lo que **no** está en este spec

- Envío real de correo con código de invitación.
- Validación de campos.
- Persistencia de la invitación.
- Activación de cuenta del familiar.
- Gestión de familiares vinculados.
- Límite de tiempo real de 7 días.

Cada una de esas, si llega, va en su propio spec.
