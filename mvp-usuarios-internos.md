# Segunda — Usuarios Internos / Back-office (complemento a `mvp-refinamiento-mvp1.md`)

> Este documento define el alcance de negocio de un requerimiento NUEVO pedido por el founder:
> usuarios **internos del equipo de Segunda** (no sellers, no customers) con roles `admin`,
> `asesor` y `operador`. Complementa, no reemplaza, `mvp-refinamiento-mvp1.md`.
>
> **Aclaración crítica de alcance:** esto NO es lo mismo que el ítem marcado "OUT" en el
> refinamiento original ("gestión de usuarios internos/roles por seller"). Aquel ítem se refiere
> a que **cada concesionaria** tenga múltiples usuarios propios (sigue fuera de alcance, sin
> cambios). Este documento habla del **equipo interno de la startup Segunda**, que necesita
> acceso a un panel propio para operar el negocio (soporte, verificación de sellers, disputas).

---

## 1. Roles internos: qué hace cada uno

### 1.1 `admin`
Acceso total al back-office interno. Es el rol de mayor privilegio.

- Gestión de usuarios internos: crear/desactivar cuentas de `asesor` y `operador`, asignar/cambiar
  rol.
- Configuración de parámetros de negocio ya diseñados en `scheduling.settings`: ventana de RSVP
  (default 4h), ventana de respuesta del customer (default 72h), monto de cobro por agenda
  asistida (default $1.000 COP), N de vehículos alternativos (default 3), canales de notificación
  habilitados.
- Visibilidad total de reportes (agendamientos por seller, y cualquier reporte que se agregue).
- Puede hacer todo lo que hace un `asesor` (alta/verificación de sellers, resolución de disputas)
  — el admin no está limitado por lo que sí puede hacer un rol menor.
- Es, en la práctica, el rol que probablemente use el founder/equipo fundador en enero (equipo
  chico, sin necesidad todavía de separación estricta de funciones).

### 1.2 `asesor`
Rol comercial/operativo intermedio, encargado de la relación con concesionarias y de resolver
lo que hoy el diseño técnico deja "solo registrado, no resuelto".

- **Gestión comercial de sellers:** alta manual de una concesionaria nueva (o soporte al proceso
  de registro si el seller se auto-registra), marcar un seller como "verificado" (sin validación
  documental automatizada — es una revisión manual del asesor, coherente con que la validación de
  identidad documental está OUT en el MVP), dar seguimiento a la facturación manual de agenda
  asistida (el cobro es manual/fuera de sistema según sección 3.9 del refinamiento; el asesor es
  quien consulta el reporte y gestiona el cobro real, ej. por fuera del sistema con la
  concesionaria).
- **Soporte de primer nivel:** atención de incidentes reportados por customers o sellers (ej. "no
  me llegó el email de confirmación", "el seller nunca marcó resultado de la cita"). En el MVP no
  existe un canal de PQR formal (confirmado OUT), así que este soporte es informal (WhatsApp/email
  directo del equipo), pero el asesor necesita **ver el estado real de las citas/vehículos** en el
  panel interno para poder responder.
- **Resolución manual de disputas (`is_disputed`):** cuando el `status` de una cita quedó marcado
  `is_disputed = true` (seller y customer no coinciden en si hubo asistencia), el asesor puede
  **revisar el caso y dejar una nota interna de resolución** (ej. contactó a ambas partes,
  decisión final). Importante: esto **no reabre ni cambia el `status` operativo autoritativo**
  del seller (la regla de negocio "el seller es autoritativo" del refinamiento no se toca) — la
  resolución del asesor es a nivel de anotación/seguimiento y potencialmente para decidir si esa
  agenda se factura o no en casos límite, no para alterar la máquina de estados.
- No tiene acceso a configuración de parámetros de negocio (`scheduling.settings`) ni a gestión de
  otros usuarios internos — eso es exclusivo de `admin`.

### 1.3 `operador`
Rol de menor privilegio, operativo/consultivo puro. Pensado para alguien del equipo que apoya en
tareas puntuales sin necesitar decidir nada sensible.

- **Solo consulta:** ver lista de sellers, ver lista de vehículos, ver lista de citas y su estado,
  ver el reporte de agendamientos por seller. Sin capacidad de editar nada de eso.
- **Tareas puntuales de soporte de primer contacto:** puede ver el detalle de una cita/incidente
  para responder preguntas básicas de un customer o seller (ej. "¿mi cita quedó confirmada?"),
  pero **no puede marcar disputas como resueltas ni verificar sellers** — eso escala a `asesor`.
- No tiene acceso a facturación, configuración, ni gestión de usuarios.
- Justificación de negocio: en un equipo pequeño de lanzamiento (enero), es razonable que el
  `operador` sea, por ejemplo, alguien de soporte/atención al cliente que no toma decisiones
  comerciales ni resuelve disputas, solo consulta y escala.

**Resumen de privilegios (de mayor a menor):** `admin` > `asesor` > `operador`.
`admin` puede todo. `asesor` puede todo excepto configuración de negocio y gestión de
usuarios/roles internos. `operador` solo puede consultar.

---

## 2. Casos de uso (historias breves) — MVP enero

Priorizadas como **P0/P1/P2** dentro de este bloque nuevo (no reemplaza la priorización general
del refinamiento, la complementa).

### P0 — indispensable para operar el lanzamiento con sellers piloto
- **HU-INT-01** (admin) Como admin, quiero crear cuentas de `asesor`/`operador` con un rol
  asignado, para que el equipo interno pueda operar el back-office desde el día 1 del piloto.
  - Given soy admin autenticado, When creo un usuario interno con rol `asesor`, Then ese usuario
    puede loguearse y ver únicamente lo permitido por su rol.
- **HU-INT-02** (admin/asesor/operador) Como usuario interno, quiero loguearme al panel de
  back-office con mis credenciales, para acceder solo a las funciones de mi rol.
  - Given tengo una cuenta interna activa, When inicio sesión, Then obtengo acceso limitado según
    mi rol (no veo opciones de admin si soy operador, etc.).
- **HU-INT-03** (asesor/operador/admin) Como usuario interno, quiero ver la lista de sellers
  (concesionarias) registrados y su estado (verificado/pendiente), para dar soporte y seguimiento.
  - Given existen sellers en el sistema, When entro a la sección "Sellers" del panel, Then veo
    listado con nombre, estado y fecha de registro.
- **HU-INT-04** (asesor/admin) Como asesor, quiero marcar un seller como "verificado" tras revisar
  manualmente su información, para habilitar su operación comercial completa.
  - Given un seller está en estado "pendiente", When lo marco "verificado", Then su estado cambia
    y queda registrado quién y cuándo lo verificó.
- **HU-INT-05** (asesor/admin) Como asesor, quiero ver las citas marcadas como `is_disputed`, para
  identificar casos que requieren seguimiento manual.
  - Given existen citas con `is_disputed = true`, When entro a la sección "Disputas", Then veo
    listado con vehículo, seller, customer y los resultados discrepantes (seller vs. customer).
- **HU-INT-06** (asesor/admin) Como asesor, quiero dejar una nota de resolución sobre una disputa,
  para dejar registro de que fue atendida (sin alterar el resultado autoritativo del seller).
  - Given estoy viendo el detalle de una cita disputada, When agrego una nota y la marco "atendida
    internamente", Then queda visible el historial de seguimiento, sin cambiar el `status`
    operativo de la cita.
- **HU-INT-07** (admin/asesor/operador según visibilidad) Como usuario interno, quiero ver el
  reporte de agendamientos por seller (ya definido como MVP en el refinamiento general), para dar
  soporte comercial y de facturación manual.
  - Given hay citas registradas, When entro al reporte, Then veo conteo por seller y por estado
    (agendada, atendido, no_se_presento, liberada, cancelada_por_venta).

### P1 — deseable para el lanzamiento, no bloqueante del día 1
- **HU-INT-08** (admin) Como admin, quiero editar los valores de `scheduling.settings` (ventana
  RSVP, monto de cobro, N alternativos) desde el panel, para ajustar reglas de negocio sin pedirle
  a @developer que lo haga a mano en la base de datos.
  - *Nota:* el diseño técnico actual (`docs-arquitectura-mes1-scheduling.md`, sección 5) dice
    explícitamente que en Mes 1 **no se expone endpoint de edición** — el ajuste es directo en BD.
    Por eso este ítem queda P1/Fase 2, no P0: el panel de configuración es un "nice to have" hasta
    que el volumen de cambios lo justifique.
- **HU-INT-09** (admin) Como admin, quiero desactivar la cuenta de un usuario interno que deja el
  equipo, para revocar su acceso.
- **HU-INT-10** (asesor/operador) Como usuario interno, quiero buscar una cita por email/teléfono
  del customer o nombre del seller, para atender un caso de soporte puntual más rápido.

### P2 — fase 2, explícitamente no MVP
- Sistema de permisos granular por módulo/acción (hoy son 3 roles fijos, no permisos
  configurables).
- Historial de auditoría completo de acciones de usuarios internos (quién cambió qué y cuándo,
  más allá de lo mínimo de HU-INT-04/06).
- Dashboard de métricas operativas del equipo interno (ej. tiempo de resolución de disputas,
  carga de trabajo por asesor).
- Flujo formal de resolución de disputas con notificación a las partes (hoy es solo nota interna,
  sin acción automática hacia customer/seller — coherente con que la resolución formal de
  disputas ya está marcada OUT en el refinamiento general).

---

## 3. Priorización MUST HAVE (enero) vs. Fase 2

Dado el cronograma ajustado de 4 meses (ver sección 5 de `mvp-refinamiento-mvp1.md`), el alcance
de "usuarios internos" para enero debe ser **mínimo y funcional**, no un sistema de permisos
completo.

### MUST HAVE (enero)
- Login interno (reutilizando el mecanismo de auth ya existente en `iam`, ver sección 4).
- 3 roles fijos (`admin`, `asesor`, `operador`) con permisos hardcodeados por rol (no
  configurables por pantalla) — alcanza con lógica de guards en backend + ocultar/mostrar
  secciones en frontend.
- Panel con: (a) lista de sellers + acción "marcar verificado", (b) lista de citas con filtro por
  `is_disputed`, (c) reporte de agendamientos por seller (el mismo que ya es MUST HAVE en el
  refinamiento general — el panel interno solo lo reutiliza).
- Nota simple de resolución en una disputa (texto libre + timestamp + quién la dejó).
- Un admin inicial (seed manual, no autoregistro) para poder crear al resto del equipo.

### SHOULD HAVE (si alcanza el tiempo, no bloqueante)
- Alta/baja de usuarios internos vía UI (si no alcanza, se puede hacer por seed/script manual en
  enero y pasar a UI en Fase 2).
- Búsqueda/filtro básico en las listas (sellers, citas).

### FASE 2 (won't have en enero, confirmado)
- Edición de `scheduling.settings` vía UI (queda en BD directa, ya definido así en el diseño
  técnico de Mes 1).
- Permisos granulares/configurables por rol.
- Auditoría completa de acciones.
- Métricas operativas del equipo interno.
- Flujo formal de resolución de disputas con notificación automática a las partes.

---

## 4. Relación con roles existentes (`iam` / `User.role`)

**Pregunta técnica dirigida a @architect, con mi opinión de negocio:**

Mi recomendación de negocio es que los roles internos sean **100% separados y excluyentes** de
`buyer`/`seller`, por estas razones:

1. **Nunca hay superposición de persona física con doble rol de negocio.** Un asesor de Segunda no
   es ni comprador ni vendedor de vehículos dentro del sistema — es personal de la plataforma. No
   existe un caso de uso donde un `admin`/`asesor`/`operador` necesite "actuar como" seller (crear
   un vehículo a nombre de una concesionaria) o "actuar como" buyer (agendar una visita). Si en
   algún momento el equipo interno necesita crear un vehículo de prueba o simular una cita para
   soporte/QA, eso es un caso de **soporte técnico** (ej. impersonar temporalmente, o tener un
   seller/buyer de pruebas dedicado), no un caso de negocio real que deba modelarse como "rol
   dual".
2. **Separar los roles reduce riesgo de negocio:** si el mismo `User.role` mezclara valores de
   negocio (`buyer`, `seller`) con valores de acceso interno (`admin`, `asesor`, `operador`), se
   corre el riesgo de que un mismo usuario interno también tenga un perfil de comprador/vendedor
   sin que quede claro cuál aplica en cada contexto (ej. ¿un `asesor` puede agendar una cita como
   si fuera cliente? No debería, y mezclar el campo lo permitiría por accidente si no hay guards
   estrictos).
3. **El dominio de negocio ya trata `seller` como entidad con perfil propio** (`Seller.user_id`
   referenciando a `iam.users`, según el diseño técnico ya implementado). Es coherente que el
   personal interno también sea un **perfil de identidad separado** que cuelga de `iam.users`
   (mismo patrón), pero sin mezclar su naturaleza con `buyer`/`seller` en el mismo campo de rol de
   negocio.

**Mi opinión (no vinculante técnicamente, mensaje explícito para @architect):** prefiero que el
campo `User.role` en `iam` **no** absorba `admin`/`asesor`/`operador` como valores adicionales del
mismo enum que ya distingue `buyer`/`seller`, porque son conceptualmente dos cosas distintas
(rol de negocio del marketplace vs. rol de acceso interno al back-office). Sugiero evaluar un
campo/tabla separado (ej. `iam.internal_staff` con su propio `role: 'admin'|'asesor'|'operador'`,
o un segundo campo `internal_role` nullable en `User`) — pero la decisión final de modelo de datos
es de @architect/@db, esto es solo mi criterio de negocio de que **deben ser roles excluyentes**.

---

## 5. Actualización del backlog MoSCoW general (nuevo bloque)

Este bloque se agrega al backlog de `mvp-refinamiento-mvp1.md` sección 4, sin modificar lo ya
priorizado ahí.

**Must Have (bloquean lanzamiento enero):**
- Login interno para usuarios `admin`/`asesor`/`operador` (reutilizando mecanismo de auth de
  `iam`, con separación de rol de negocio vs. rol interno — ver sección 4).
- 3 roles fijos con permisos hardcodeados por backend (guards) y ocultamiento por frontend.
- Panel interno: lista de sellers + acción "marcar verificado".
- Panel interno: lista de citas filtrable por `is_disputed` + detalle.
- Nota de resolución de disputa (texto + timestamp + autor), sin alterar `status` operativo.
- Reutilización del reporte de agendamientos por seller (ya MUST HAVE general) dentro del panel
  interno.
- Un admin inicial vía seed manual (no autoregistro público).

**Should Have:**
- Alta/baja de usuarios internos vía UI (si no alcanza, seed/script manual es aceptable para
  enero).
- Búsqueda/filtro básico en listas de sellers y citas.

**Could Have:**
- Exportar CSV desde el panel interno de la lista de disputas o sellers.

**Won't Have (fuera de enero, confirmado):**
- Edición de `scheduling.settings` vía UI (queda en BD directa según diseño técnico ya definido).
- Sistema de permisos granular/configurable por módulo o acción.
- Auditoría completa de acciones de usuarios internos.
- Dashboard de métricas operativas del equipo interno.
- Flujo formal de resolución de disputas con notificación automática a las partes.
- (Sigue OUT, sin cambios) Gestión de usuarios internos/roles **por seller** — cada concesionaria
  sigue con un solo login en el MVP; esto no se toca con este nuevo requerimiento.

---

## 6. Preguntas abiertas para el founder

1. ¿El `admin` inicial (seed manual) lo define el founder directamente, o hay más de una persona
   con rol admin desde el día 1 del piloto?
2. ¿"Marcar seller como verificado" bloquea alguna funcionalidad del seller mientras está
   "pendiente" (ej. no puede publicar vehículos hasta ser verificado), o es solo informativo para
   el equipo interno? El refinamiento original no define un estado de verificación de seller —
   esto es una regla de negocio nueva que debe confirmarse antes de pasar a diseño técnico.
3. ¿El `asesor` necesita ver datos de contacto completos del customer (teléfono/email) para dar
   soporte, o solo lo mínimo para identificar el caso? Puede tener implicación de privacidad/datos
   personales.
4. ¿Cuántas personas del equipo de Segunda estarán operando el back-office en enero? Si es 1-2
   personas, quizás ni siquiera se necesitan los 3 roles distintos desde el día 1 (todos como
   `admin`) y la separación de `asesor`/`operador` podría moverse a Fase 2 sin impacto real —
   pido confirmación antes de comprometer este alcance completo para el lanzamiento.
