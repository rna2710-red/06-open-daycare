---
description: Verifica y corrige los criterios de aceptación de un spec específico. Incluye lint, build, Next.js best practices, y comparación visual con mockups.
agent: spec-verifier
---

Verifica todos los criterios de aceptación del spec `specs/$ARGUMENTS.md` y corrige tanto el spec como el código cuando haya desviaciones.

## Instrucciones

1. **Leer el spec** `specs/$ARGUMENTS.md` y extraer los criterios de aceptación, alcance, modelo de datos y plan de implementación.

2. **Asegurar dev server**: Verificar si `localhost:3000` está activo. Si no responde, ejecutar `npm run dev` en background y esperar a que esté listo.

3. **Checks técnicos**:
   - Ejecutar `npm run lint` y reportar errores.
   - Ejecutar `npm run build` y reportar errores de tipo/compilación.
   - Corregir automáticamente errores simples (lint, tipos).

4. **Next.js best practices**: Usar Context7 para verificar que el código siga las recomendaciones de Next.js 16 (App Router, Server Components, etc.).

5. **Verificación visual**: Para cada criterio visual:
   - Resize del viewport a las dimensiones indicadas.
   - Navegar a la ruta correspondiente.
   - Tomar screenshot.
   - Comparar con el mockup de `references/screenshots/` o `references/pantallas/` usando visión.
   - Corregir desviaciones de color, spacing, texto o layout.

6. **Correcciones**: Aplicar correcciones directas al spec y al código. Reportar lo que requiera decisión humana.

7. **Reporte**: Actualizar los checkboxes del spec y generar resumen ejecutivo.
