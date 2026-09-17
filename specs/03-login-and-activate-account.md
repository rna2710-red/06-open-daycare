# SPEC 03 — Pantallas de login y activación de cuenta

> **Estado:** Implementado
> **Depende de:** ninguna
> **Fecha:** 2026-09-16
> **Objetivo:** Implementar las pantallas `/login` y `/activar-cuenta` replicando los mockups `login.dc.html` y `activar-cuenta.dc.html` sin autenticación real, sin validación de formularios y con datos simulados.

## Por qué existe este spec

Login y activación de cuenta son las primeras pantallas que ve un usuario nuevo. Son independientes del sidebar y del feed (spec 01) y no dependen de ninguna spec anterior. Se construyen solo el diseño visual: formularios inertes, sin lógica de autenticación ni persistencia.

## Alcance

**In:**

- Ruta `/login` (`app/login/page.tsx`): replica el mockup `references/pantallas/login.dc.html` **sin** los botones de selección de rol (Personal/Familia). Panel izquierdo decorativo con gradiente coral, logo OpenDayCare, título y subtítulo. Panel derecho con formulario: input email, input contraseña, link "¿Olvidaste tu contraseña?", botón "Iniciar sesión" (placeholder), link "Activá tu cuenta" que navega a `/activar-cuenta`.
- Ruta `/activar-cuenta` (`app/activar-cuenta/page.tsx`): replica el mockup `references/pantallas/activar-cuenta.dc.html`. Logo decorativo, título "Bienvenida a OpenDayCare", subtítulo, tarjeta de niño invitado (avatar + nombre + sala), input código de invitación, input email, input crear contraseña, checkbox de autorización de fotos (**funcional**: toggle on/off con estado visual), botón "Activar mi cuenta" (placeholder), link "¿Ya tenés cuenta?" que navega a `/login`.
- Componente `AuthCheckbox` (`app/components/auth/AuthCheckbox.tsx`): checkbox customizado con estado toggle. Fondo `#FBF1D6`, check verde `#5FB97E` cuando está marcado, borde gris cuando no. Maneja estado local con `useState`.
- Datos simulados en `lib/mock/auth.ts`: código de invitación, datos del niño invitado (nombre, sala, inicial, color de avatar).
- Ambas páginas usan el layout global (`app/layout.tsx`) con fuentes Fredoka/Nunito y tokens de color, pero **sin sidebar**.
- Navegación entre las dos pantallas: "Activá tu cuenta" → `/activar-cuenta`, "¿Ya tenés cuenta?" → `/login`.
- Botones de formulario ("Iniciar sesión", "Activar mi cuenta") son placeholders inertes (no navegan ni ejecutan acción).
- Links "¿Olvidaste tu contraseña?" y link del niño invitado son inertes.

**Fuera de alcance (specs futuros):**

- Autenticación real (JWT, sesiones, middleware de protección de rutas).
- Validación de formularios (campos obligatorios, formato email, fortaleza de contraseña).
- Lógica de activación de cuenta (verificar código, crear usuario, guardar contraseña).
- Persistencia de datos (localStorage, cookies, base de datos).
- Recuperación de contraseña.
- Redirección post-login (las pantallas apuntan a rutas que aún no existen o son placeholders).
- El botón de la tarjeta de niño invitado en activar-cuenta (solo decorativo).

## Modelo de datos

```ts
// lib/mock/auth.ts
export interface InvitedChild {
  name: string;              // "Mateo"
  room: string;              // "Sala Soles"
  initial: string;           // "M"
  avatarColor: string;       // "#A9D9E8"
  avatarTextColor: string;   // "#1F7A93"
}

export const invitedChild: InvitedChild = {
  name: "Mateo",
  room: "Sala Soles",
  initial: "M",
  avatarColor: "#A9D9E8",
  avatarTextColor: "#1F7A93",
};

export const invitationCode = "7K4P9";
```

El login no introduce datos simulados propios: solo renderiza inputs vacíos o con valores por defecto del mockup.

## Plan de implementación

1. **Datos simulados.** Crear `lib/mock/auth.ts` con la interfaz `InvitedChild`, la constante `invitedChild` y `invitationCode`. Verificar: `npm run build` compila.
2. **Componente AuthCheckbox.** Crear `app/components/auth/AuthCheckbox.tsx` (`"use client"`): recibe `checked` (boolean) y `onChange` (callback). Renderiza un `<label>` con flex, fondo `#FBF1D6`, border-radius 14px, padding 14px 16px. Interior: cuadro de check (24×24px, border-radius 8px) que cambia de fondo gris a `#5FB97E` con SVG check blanco cuando está marcado, y texto "Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro de la app." en 14px `#8A7234`. El componente maneja su estado con `useState`. Verificar: build compila.
3. **Página login `/login`.** Crear `app/login/page.tsx`: div full-screen `min-h-screen` con `display: grid; grid-template-columns: 1.05fr 1fr` y fondo `#FBF4EC`. Panel izquierdo: gradiente `linear-gradient(155deg, #F6A98E 0%, #F2937A 45%, #EC7E62 100%)`, círculos decorativos semitransparentes, logo OpenDayCare (SVG sol + "OpenDayCare" en Fredoka 600 21px), título "El día de cada niño, compartido con su familia." (Fredoka 600 42px), subtítulo en 17px `rgba(255,255,255,.92)`, footer "🌿 Guardería Sala Soles". Panel derecho: centrado, max-width 392px, formulario con: título "Iniciar sesión" (Fredoka 600 30px), subtítulo "Ingresá para ver el día de hoy." (`#94887B` 15px), input email (borde `#EADFD0`, fondo `#fff`, border-radius 14px, padding 14px 16px), input contraseña (mismo estilo, placeholder "••••••••"), link "¿Olvidaste tu contraseña?" (`#C5503A` 13.5px 700, alineado a la derecha), botón "Iniciar sesión" (gradiente `#F4977E→#EE8164`, ancho completo, padding 15px, border-radius 15px, sombra, texto blanco 800 16px), texto "¿Te invitó la guardería?" con link "Activá tu cuenta" (`#C5503A` 800) que navega a `/activar-cuenta`. Verificar: `/login` muestra el formulario correctamente.
4. **Página activar cuenta `/activar-cuenta`.** Crear `app/activar-cuenta/page.tsx`: div full-screen `min-h-screen` centrado flex, fondo `#FBF4EC`, padding 40px. Contenido max-width 440px: logo decorativo (58×58px, gradiente `#F8C3A8→#F2937A`, sombra, SVG sol blanco), título "Bienvenida a OpenDayCare" (Fredoka 600 32px), subtítulo (`#94887B` 15.5px), tarjeta de niño invitado (flex, fondo `#fff`, borde `#EADFD0`, border-radius 16px, padding 14px 16px: avatar circular 44×44px con `avatarColor` e inicial en Fredoka 600 19px, texto "Te invitaron a seguir a" 13px `#94887B` + "Mateo · Sala Soles" Fredoka 600 17px `#3F362E`), input código de invitación (letter-spacing 3px, font-weight 700, Fredoka, valor por defecto "7K4P9"), input email, input crear contraseña (borde `#F2A78E` como en el mockup), `<AuthCheckbox checked={true} />` con estado funcional, botón "Activar mi cuenta" (mismo estilo que login), texto "¿Ya tenés cuenta?" con link "Iniciar sesión" (`#C5503A` 800) que navega a `/login`. Verificar: `/activar-cuenta` muestra el formulario y el checkbox hace toggle.
5. **Verificación visual.** Tomar screenshot de `/login` a 1280×800 y comparar con `references/pantallas/login.dc.html`. Tomar screenshot de `/activar-cuenta` y comparar con `references/pantallas/activar-cuenta.dc.html`. Ajustar tokens Tailwind donde difiera.

## Criterios de aceptación

- [ ] `npm run lint` pasa sin errores.
- [ ] `npm run build` compila sin errores de tipos.
- [ ] A 1280×800 la ruta `/login` replica el mockup: panel izquierdo con gradiente coral, logo OpenDayCare, título y subtítulo; panel derecho con formulario de email y contraseña, botón "Iniciar sesión" y link "Activá tu cuenta".
- [ ] La ruta `/login` **no** muestra los botones de selección de rol (Personal/Familia).
- [ ] Click en "Activá tu cuenta" navega a `/activar-cuenta`.
- [ ] A 1280×800 la ruta `/activar-cuenta` replica el mockup: logo decorativo, título "Bienvenida a OpenDayCare", tarjeta de niño invitado, inputs de código/email/contraseña, checkbox de autorización, botón "Activar mi cuenta".
- [ ] El checkbox de autorización es funcional: cambia visualmente entre marcado (fondo verde `#5FB97E` con check blanco) y desmarcado al hacer click.
- [ ] El checkbox inicia marcado por defecto (como en el mockup).
- [ ] Click en "Iniciar sesión" (desde activar-cuenta) navega a `/login`.
- [ ] Botones "Iniciar sesión" y "Activar mi cuenta" no ejecutan acción de envío (son placeholders).
- [ ] Link "¿Olvidaste tu contraseña?" es inerte (no navega).
- [ ] A 375×812: sin scroll horizontal, los paneles se apilan verticalmente (panel izquierdo arriba, formulario abajo).
- [ ] Encabezados en Fredoka y cuerpo en Nunito.
- [ ] No hay errores en consola.

## Decisiones

- **Sí:** layout global sin sidebar — las pantallas de auth son full-screen; el sidebar no aplica aquí.
- **Sí:** sin botones de rol (Personal/Familia) en login — el usuario indicó que no se ocupan. Se eliminan del diseño.
- **Sí:** checkbox funcional con `useState` — el usuario pidió que funcione. El estado se maneja localmente, sin persistencia.
- **Sí:** datos simulados en `lib/mock/auth.ts` — separados de `feed.ts` y `kids.ts`; al conectar DB solo cambia el origen.
- **Sí:** componente `AuthCheckbox` en `app/components/auth/` — sigue la convención de organizar por contenido (`home/`, `kids/`, `auth/`). Imports directos, sin barrel files.
- **Sí:** `AuthCheckbox` es client component — necesita `useState` para el toggle. Las páginas `/login` y `/activar-cuenta` son server components que importan el client component.
- **Sí:** links de navegación entre login ↔ activar-cuenta — son las únicas rutas funcionales del spec. Los botones de formulario son placeholders.
- **Sí:** input contraseña de activar-cuenta con borde `#F2A78E` — fiel al mockup (diferente al login que usa `#EADFD0`).
- **Sí:** valor por defecto del código de invitación "7K4P9" — réplica del mockup.
- **No:** autenticación real — va en otro spec.
- **No:** validación de formularios — va en otro spec.
- **No:** persistencia del checkbox de autorización — por ahora es solo local.
- **No:** responsive con drawer — a diferencia del sidebar, estas pantallas no tienen navegación compleja; el responsive es apilamiento vertical simple.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Fidelidad visual contra los mockups (colores de gradiente, sombras, espaciados) | Screenshot comparativo en `.playwright-mcp/`; `arbitrary values` donde falte un token |
| El panel izquierdo de login se ve cortado en pantallas pequeñas | Usar `min-h-screen` y `overflow-hidden` en el panel; en móvil (<768px) apilar verticalmente con el panel superior fijo |
| Checkbox no visible en fondos claros | Usar contraste suficiente: fondo `#FBF1D6` con texto `#8A7234` y check `#5FB97E` — colores verificados en el mockup |

## Lo que **no** está en este spec

- Autenticación real (JWT, sesiones, middleware).
- Validación de formularios.
- Activación de cuenta (verificar código, crear usuario).
- Recuperación de contraseña.
- Redirección post-login.
- Persistencia de datos.

Cada una de esas, si llega, va en su propio spec.
