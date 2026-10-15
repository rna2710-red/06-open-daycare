# Spec Delta — family-panel

## Purpose

Define el área de la familia bajo `/family`: su layout con navegación propia (sin composición de publicaciones) y un home shell que en un cambio futuro mostrará el feed familiar con contenido real.

## ADDED Requirements

### Requirement: Layout del área familia

Toda ruta bajo `/family` SHALL renderizar el layout del área familia, que compone el `FamilySidebar` junto al contenido principal de la página.

#### Scenario: Parent accede al área

- **WHEN** un usuario con rol `parent` navega a cualquier ruta bajo `/family`
- **THEN** ve el `FamilySidebar` y el contenido de la página solicitada

### Requirement: FamilySidebar

El `FamilySidebar` SHALL mostrar los enlaces Feed (`/family`), Resumen del día (`/family/resumen`) y Mi cuenta (`/family/cuenta`). No SHALL incluir botón de nueva publicación ni enlaces al área staff.

#### Scenario: Navegación de la familia

- **WHEN** un usuario parent está en cualquier página del área familia
- **THEN** el sidebar muestra Feed, Resumen del día y Mi cuenta apuntando a rutas bajo `/family`

#### Scenario: Sin acceso a composición

- **WHEN** un usuario parent revisa su sidebar
- **THEN** no existe ningún control para crear publicaciones

### Requirement: Home shell en `/family`

`/family` SHALL mostrar una página de bienvenida con estado vacío (saludo y contexto de la guardería/familia). El feed familiar con publicaciones reales está fuera de alcance de este cambio y se construirá en una spec futura.

#### Scenario: Primer acceso del padre

- **WHEN** un parent autenticado navega a `/family` por primera vez
- **THEN** ve el shell de bienvenida con su sidebar, sin publicaciones todavía

### Requirement: Pantallas fuera de alcance del área familia

Los destinos "Resumen del día" (`/family/resumen`) y "Mi cuenta" (`/family/cuenta`) SHALL estar declarados en la navegación aunque sus pantallas se construyan en cambios futuros.

#### Scenario: Enlaces declarados

- **WHEN** un usuario parent revisa el sidebar
- **THEN** los enlaces apuntan a `/family/resumen` y `/family/cuenta` respectivamente
