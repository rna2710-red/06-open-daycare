# Spec Delta — staff-panel

## Purpose

Define el área de gestión del personal de la guardería bajo `/staff`: su layout con navegación propia, el feed de publicaciones y la gestión de niños, todo trasladado desde las rutas planas actuales.

## ADDED Requirements

### Requirement: Layout del área staff

Toda ruta bajo `/staff` SHALL renderizar el layout del área staff, que compone el `StaffSidebar` junto al contenido principal de la página.

#### Scenario: Staff accede al área

- **WHEN** un usuario con rol `staff` o `admin` navega a cualquier ruta bajo `/staff`
- **THEN** ve el `StaffSidebar` y el contenido de la página solicitada

### Requirement: Rutas del área staff

El área staff SHALL exponer el feed de publicaciones en `/staff`, el roster de niños en `/staff/kids` y el perfil de un niño en `/staff/kids/<slug>`. Las rutas anteriores `/` y `/kids` dejan de servir estas pantallas.

#### Scenario: Feed staff en su nueva ruta

- **WHEN** un usuario del staff navega a `/staff`
- **THEN** ve el feed de publicaciones del día (contenido actual de la home)

#### Scenario: Roster de niños

- **WHEN** un usuario del staff navega a `/staff/kids`
- **THEN** ve el listado de niños con filtro por salón y búsqueda

#### Scenario: Perfil de niño

- **WHEN** un usuario del staff navega a `/staff/kids/<slug>`
- **THEN** ve el perfil del niño con sus padres vinculados e invitaciones pendientes

#### Scenario: Ruta antigua sin alias

- **WHEN** un usuario autenticado navega a `/kids` (ruta anterior)
- **THEN** la ruta ya no resuelve el roster de niños (cambio de URL aceptado, sin redirect)

### Requirement: StaffSidebar

El `StaffSidebar` SHALL mostrar: botón "Nueva publicación", y los enlaces Feed (`/staff`), Niños (`/staff/kids`), Avisos (`/staff/avisos`) y Mi cuenta (`/staff/cuenta`). El botón de nueva publicación SHALL estar presente solo en el panel staff.

#### Scenario: Navegación del staff

- **WHEN** un usuario del staff está en cualquier página del área staff
- **THEN** el sidebar muestra los enlaces anteriores con Feed y Niños apuntando a las rutas bajo `/staff`

#### Scenario: Composición de publicaciones solo para staff

- **WHEN** se compara el sidebar staff con el sidebar familia
- **THEN** solo el sidebar staff incluye el botón "Nueva publicación"

### Requirement: Pantallas fuera de alcance del área staff

Los enlaces "Avisos" (`/staff/avisos`) y "Mi cuenta" (`/staff/cuenta`) SHALL existir en la navegación aunque sus pantallas se construyan en un cambio futuro.

#### Scenario: Enlaces declarados

- **WHEN** un usuario del staff revisa el sidebar
- **THEN** los enlaces Avisos y Mi cuenta apuntan a `/staff/avisos` y `/staff/cuenta` respectivamente
