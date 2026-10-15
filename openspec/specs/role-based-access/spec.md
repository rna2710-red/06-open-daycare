# role-based-access Specification

## Purpose

Enruta a cada usuario autenticado al panel que le corresponde según su rol guardado en la base de datos, y evita que un usuario acceda al panel de otro rol. El rol se determina siempre desde `public.users`, nunca desde metadatos del cliente.

## Requirements

### Requirement: Dispatcher de entrada en `/`

El sistema SHALL resolver el panel de destino al visitar `/`: staff y admin se redirigen a `/staff`, parent se redirige a `/family`, según el rol en `public.users`.

#### Scenario: Staff visita `/`

- **WHEN** un usuario autenticado con rol `staff` navega a `/`
- **THEN** es redirigido a `/staff`

#### Scenario: Admin visita `/`

- **WHEN** un usuario autenticado con rol `admin` navega a `/`
- **THEN** es redirigido a `/staff`

#### Scenario: Parent visita `/`

- **WHEN** un usuario autenticado con rol `parent` navega a `/`
- **THEN** es redirigido a `/family`

#### Scenario: Usuario sin perfil en la base de datos

- **WHEN** un usuario autenticado navega a `/` pero no existe fila en `public.users` para su `auth.uid()`
- **THEN** se cierra su sesión y se lo redirige a `/login`

### Requirement: Guard del área staff

El sistema SHALL prohibir que un usuario con rol `parent` acceda a cualquier ruta bajo `/staff`: el layout del área lo redirige a `/family`.

#### Scenario: Parent visita el home staff

- **WHEN** un usuario autenticado con rol `parent` navega a `/staff`
- **THEN** es redirigido a `/family`

#### Scenario: Parent navega a una ruta profunda del staff

- **WHEN** un usuario autenticado con rol `parent` navega a `/staff/kids/<slug>`
- **THEN** es redirigido a `/family`

#### Scenario: Staff accede a su área

- **WHEN** un usuario autenticado con rol `staff` navega a `/staff/kids`
- **THEN** accede al contenido del área staff sin redirección

### Requirement: Guard del área familia

El sistema SHALL prohibir que usuarios con rol `staff` o `admin` accedan a cualquier ruta bajo `/family`: el layout del área los redirige a `/staff`.

#### Scenario: Staff visita el área familia

- **WHEN** un usuario autenticado con rol `staff` navega a `/family`
- **THEN** es redirigido a `/staff`

#### Scenario: Admin navega a una ruta profunda de la familia

- **WHEN** un usuario autenticado con rol `admin` navega a `/family/resumen`
- **THEN** es redirigido a `/staff`

#### Scenario: Parent accede a su área

- **WHEN** un usuario autenticado con rol `parent` navega a `/family`
- **THEN** accede al área familia sin redirección

### Requirement: Rol autoritativo desde la base de datos

El sistema SHALL determinar el rol del usuario consultando `public.users` por `auth.uid()`. Los metadatos del cliente (`raw_user_meta_data`) no SHALL usarse para autorizar el acceso a paneles.

#### Scenario: Metadatos contradictorios

- **WHEN** el `raw_user_meta_data` del cliente indica `staff` pero la fila de `public.users` indica `parent`
- **THEN** el sistema trata al usuario como `parent`

### Requirement: Post-login sin lógica de rol

Tras un inicio de sesión exitoso, el sistema SHALL navegar a `/` sin decidir el panel en el formulario de login; el destino lo resuelve el dispatcher según la base de datos.

#### Scenario: Login de un padre

- **WHEN** un padre inicia sesión correctamente
- **THEN** la app navega a `/` y el dispatcher lo deriva a `/family`

#### Scenario: Login de un miembro del staff

- **WHEN** un miembro del staff inicia sesión correctamente
- **THEN** la app navega a `/` y el dispatcher lo deriva a `/staff`

### Requirement: Activación de cuenta entra al dispatcher

Tras activar una invitación (cuenta creada con rol `parent`), el sistema SHALL navegar a `/` para que el dispatcher derive al panel familiar.

#### Scenario: Padre activa su invitación

- **WHEN** un usuario completa la activación de su invitación e inicia sesión automáticamente
- **THEN** la app navega a `/` y el dispatcher lo deriva a `/family`
