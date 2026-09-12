# Arquitectura: Roles internos (back-office) + Deuda técnica + Tareas de backend

> Autor: @architect. Complementa `mvp-usuarios-internos.md` (negocio, @po),
> `docs-arquitectura-mes1-scheduling.md`, `docs-db-spec-mes1-scheduling.md`,
> `docs-arquitectura-ajustes-infra.md` y `docs-plan-integracion-main-client.md`.
> Alcance: **diseño + especificación**, no implementación. Basado en inventario técnico real
> del código a fecha de hoy (11 sept 2026), no en supuestos.

---

## A. Diseño técnico de roles internos

### A.1 Modelo de datos: tabla separada, NO extensión de `User.role`

**Decisión: nueva tabla `iam.internal_staff`, con su propio enum de rol (`admin`|`asesor`|`operador`),
colgada de `iam.users` vía `user_id` — mismo patrón que `sellers.sellers.user_id`.**

`User.role` (`'buyer'|'seller'`) **no se toca, no se le agregan valores nuevos**.

Justificación:

1. **Alinea 100% con la recomendación de negocio del PO** (sección 4 de `mvp-usuarios-internos.md`):
   roles excluyentes, sin superposición conceptual. Meter `admin`/`asesor`/`operador` en el mismo
   enum que `buyer`/`seller` mezclaría dos ejes ortogonales: "rol de negocio del marketplace" vs.
   "rol de acceso operativo interno". Son preguntas distintas (`¿qué hace este usuario en el
   dominio de negocio?` vs. `¿qué puede ver/hacer en el back-office?`) y deben poder responderse
   independientemente sin ambigüedad de un solo campo.
2. **Ya existe el patrón exacto en el código**: `Seller.user_id` referencia a `iam.users.id` para
   modelar "perfil de dominio colgado de la identidad". `internal_staff` es el mismo patrón para
   "perfil de acceso interno colgado de la identidad". Cero invención de patrón nuevo.
3. **Evita el riesgo señalado explícitamente por el PO**: con roles separados, es estructuralmente
   imposible que un `asesor` "actúe como" `buyer`/`seller` por accidente de que ambos compartan el
   mismo campo — el guard de rol interno y el guard de rol de negocio son independientes.
4. **Es robusto a las 4 preguntas abiertas del founder** (sección 6 de `mvp-usuarios-internos.md`):
   - Si la respuesta es "1 solo admin desde el día 1": la tabla igual funciona, solo se siembra 1 fila.
   - Si la respuesta es "3 roles desde el día 1": la tabla ya soporta el enum completo sin cambios.
   - No hay branch de diseño distinto según la respuesta — el modelo es el mismo en ambos casos.
5. Alternativa descartada: **campo `internal_role` nullable en `User`**. Se descarta porque:
   - Ensucia `iam.users` (tabla de identidad pura) con un concepto de autorización de back-office.
   - Un `User` con `internal_role` no-nulo seguiría teniendo `role='buyer'` por default — sigue
     mezclando dos ejes en una sola fila, aunque en columnas distintas, lo cual complica el guard
     (¿se valida `role` o `internal_role` según el endpoint? más superficie de error que una tabla
     separada con existencia = pertenencia).
   - Con tabla separada, "¿es staff interno?" es una simple consulta de existencia (`EXISTS`), más
     limpio de razonar y de auditar.

### Especificación de la tabla (para @db)

```
iam.internal_staff
  id            uuid PK
  user_id       uuid NOT NULL, FK → iam.users.id, UNIQUE (1:1 con User)
  role          varchar(10) NOT NULL   -- 'admin' | 'asesor' | 'operador'
  active        boolean NOT NULL DEFAULT true
  created_by    uuid NULL, FK → iam.users.id (quién creó esta cuenta interna; NULL para el seed inicial)
  created_at    timestamptz NOT NULL DEFAULT now()
  updated_at    timestamptz NOT NULL DEFAULT now()
```

- `UNIQUE (user_id)`: un `User` no puede tener más de un perfil de staff interno (evita ambigüedad
  de rol si alguien intentara asignar dos roles internos a la misma persona).
- No se reutiliza `iam.users.role` para nada de esto; un `User` que es staff interno normalmente
  **no necesita ni debería tener** `role='seller'`/`'buyer'` real de negocio — pero el modelo no lo
  impide activamente a nivel de constraint (ver nota de "impersonar" en A.1 punto 1: eso es un caso
  de soporte técnico, no de negocio, fuera de este diseño).
- **`created_by` nullable** para el seed manual inicial (el primer admin no fue creado por nadie).

Esto responde también, indirectamente, a la pregunta abierta #1 del founder (¿un admin o varios
desde el día 1?): el modelo soporta ambas respuestas sin cambios, así que no bloquea el diseño.

### Contrato exportado de `iam` (para consumo cross-context / guards)

```ts
// iam/iam.service.ts — se agrega, no reemplaza lo ya definido en Mes 1
export class IamService {
  getUserRole(userId: string): Promise<'buyer' | 'seller' | null>;
  isEmailVerified(userId: string): Promise<boolean>;
  getInternalStaffRole(userId: string): Promise<'admin' | 'asesor' | 'operador' | null>; // NUEVO
}
```

---

### A.2 Mecanismo de autorización: `JwtAuthGuard` + nuevo `RolesGuard` + `@Roles()`

**Hallazgo urgente, independiente de roles internos**: hoy `JwtAuthGuard` existe y funciona (está
implementado y probado en `login`), pero **no está aplicado a ningún controller**. Esto significa
que `POST /vehicles`, `PUT /vehicles/:id`, y en el futuro cualquier endpoint de back-office, son
**públicos de escritura hoy mismo**, con o sin roles internos. Este punto se trata también en la
sección B como deuda crítica — aquí se diseña la solución que resuelve ambos problemas a la vez.

#### Diseño

1. **`RolesGuard`** (nuevo, `backend/src/common/guards/roles.guard.ts`): lee metadata `roles`
   seteada por un decorador `@Roles(...)`, compara contra el rol del usuario autenticado
   (`request.user`, poblado por `JwtAuthGuard`/`JwtStrategy`). Si no hay metadata `@Roles()`, el
   guard deja pasar (el control de "requiere estar logueado" ya lo hace `JwtAuthGuard` por
   separado) — `RolesGuard` solo añade una capa adicional de "requiere rol X".

2. **Dos tipos de rol a validar, con dos decoradores separados** (consistente con el modelo de
   datos separado de A.1):
   - `@Roles('buyer' | 'seller')` — valida contra `User.role` (rol de negocio).
   - `@InternalRoles('admin' | 'asesor' | 'operador')` — valida contra `iam.internal_staff.role`
     (rol de acceso interno). Requiere que el guard resuelva el staff role vía `IamService`
     (o, para no golpear DB en cada request, incluir el rol interno directamente en el **claim del
     JWT** al momento de login — recomendado, ver punto 4).

3. **`JwtStrategy` debe adjuntar el rol interno al `req.user` en el momento de validar el token**,
   no en cada request por separado:
   ```ts
   // jwt.strategy.ts — validate()
   async validate(payload: JwtPayload) {
     const user = await this.usersRepo.findOneBy({ id: payload.sub });
     const staff = await this.internalStaffRepo.findOneBy({ user_id: payload.sub, active: true });
     return {
       userId: user.id,
       role: user.role,                       // 'buyer' | 'seller'
       internalRole: staff?.role ?? null,      // 'admin' | 'asesor' | 'operador' | null
     };
   }
   ```
   Esto evita una consulta extra por endpoint protegido — el costo ya está pagado al validar el JWT.

4. **Alternativa evaluada y descartada para MVP**: incluir `internalRole` directamente como claim
   dentro del JWT (payload firmado), para no consultar `internal_staff` en cada request. Se
   descarta por ahora porque:
   - Complica revocación inmediata: si un admin desactiva a un `asesor`, el JWT ya emitido seguiría
     teniendo el claim viejo hasta que expire (dato stale). Con consulta a `internal_staff` en cada
     validación de token (como en el punto 3), la desactivación (`active=false`) es efectiva de
     inmediato en el siguiente request.
   - El costo de una consulta extra (JOIN simple por `user_id` indexado) es marginal a la escala del
     MVP (piloto de pocos usuarios internos). No se justifica la complejidad de invalidación de
     claims por una optimización prematura.
   - **Recomendación: resolver `internalRole` en `JwtStrategy.validate()` desde DB en cada request**
     (como en el punto 3), no meterlo en el JWT firmado.

5. **Aplicación global vs. por endpoint**: `JwtAuthGuard` se aplica **por controller/endpoint**
   (`@UseGuards(JwtAuthGuard)`), no global — hay endpoints intencionalmente públicos (`GET
   /vehicles`, `GET /brands`, etc., catálogo público; y a futuro el link de un clic de scheduling).
   Aplicar el guard globalmente y luego usar `@Public()` como excepción es una alternativa válida
   (patrón común en NestJS) — **recomendado para evitar el error humano de "olvidar poner el guard"
   en un endpoint nuevo que sí debería estar protegido** (el error por omisión es más peligroso que
   el error por comisión). Diseño final:
   - `JwtAuthGuard` se registra **globalmente** (`APP_GUARD`), con un decorador `@Public()` que los
     endpoints de catálogo/auth deben usar explícitamente para quedar exceptuados.
   - Esto invierte la deuda actual: hoy "todo es público por default, nada está protegido"; el
     nuevo default es "todo requiere JWT salvo que se marque `@Public()` explícitamente" — más
     seguro por diseño.

6. **Endpoints internos usan ambos guards apilados**:
   ```ts
   @UseGuards(JwtAuthGuard, RolesGuard)
   @InternalRoles('admin', 'asesor')
   @Patch('sellers/:id/verify')
   verifySeller(...) { ... }
   ```

#### Esqueleto de archivos a crear (guía, no implementación completa)

```
backend/src/common/decorators/roles.decorator.ts        // @Roles(...)
backend/src/common/decorators/internal-roles.decorator.ts // @InternalRoles(...)
backend/src/common/decorators/public.decorator.ts        // @Public()
backend/src/common/guards/roles.guard.ts                 // valida User.role
backend/src/common/guards/internal-roles.guard.ts        // valida internalRole
backend/src/contexts/iam/entities/internal-staff.entity.ts
backend/src/contexts/iam/iam.service.ts (extender)
```

---

### A.3 Endpoints mínimos del panel back-office

Todos bajo `JwtAuthGuard` + `InternalRolesGuard`. Formato de respuesta estándar del proyecto
(`{ message, record }` / `{ message, records }` / paginación estándar).

| Endpoint | Verbo | Roles permitidos | Contexto/Controller | Nota |
|---|---|---|---|---|
| `POST /internal/staff` | POST | `admin` | `iam` — `InternalStaffController` (nuevo) | Crea cuenta interna (`{ email, password, name, role }`), alta de `User` + `internal_staff` en una transacción. |
| `GET /internal/staff` | GET | `admin` | `iam` | Lista de usuarios internos (paginada), para gestión. |
| `PATCH /internal/staff/:id` | PATCH | `admin` | `iam` | Cambiar rol / activar-desactivar (`{ role?, active? }`). |
| `POST /internal/auth/login` | POST | público (login) | `iam` — reutiliza `AuthController.login` existente | **No es un endpoint nuevo**: el login es el mismo `POST /auth/login` ya implementado. El JWT resultante ya trae `internalRole` resuelto por `JwtStrategy` en cada request posterior — no se necesita un login "separado" para staff. |
| `GET /sellers` | GET | `admin`, `asesor`, `operador` | `sellers` — `SellerController` (nuevo, hoy vacío) | Lista paginada de sellers con `verified`, `created_at`. |
| `PATCH /sellers/:id/verify` | PATCH | `admin`, `asesor` | `sellers` | Marca `verified=true`, guarda `verified_by` (user_id) + `verified_at`. **Requiere estas 2 columnas nuevas** en `sellers.sellers` (ver encargo a @db). |
| `GET /appointments?isDisputed=true` | GET | `admin`, `asesor`, `operador` | `scheduling` — `AppointmentController` (a implementar, ver sección D) | Lista de citas filtrable por `is_disputed`. Filtro por query param, reutiliza el mismo endpoint de listado general de citas (no un endpoint separado solo para disputas). |
| `GET /appointments/:id` | GET | `admin`, `asesor`, `operador` | `scheduling` | Detalle de una cita (para ver vehículo, seller, customer, resultados discrepantes). |
| `POST /appointments/:id/dispute-notes` | POST | `admin`, `asesor` | `scheduling` | `{ note }` — agrega nota de resolución (texto + timestamp + autor), **no cambia `status`/`is_disputed`**. `operador` NO puede llamar este endpoint (guard rechaza con 403). |
| `GET /reports/appointments-by-seller` | GET | `admin`, `asesor`, `operador` | `scheduling` (o context `reports` si se prefiere aislar, ver nota abajo) | Reutiliza el reporte ya definido como MUST HAVE general (`mvp-refinamiento-mvp1.md` HU-06). El panel interno **no crea un reporte nuevo**, solo lo consume. |

**Nota de diseño sobre `dispute_notes`**: se modela como tabla separada `scheduling.dispute_notes`
(no una columna de texto libre en `Appointment`), porque un caso puede requerir más de una nota de
seguimiento a lo largo del tiempo (ej. "contacté al seller", luego "contacté al customer", luego
"decisión final"). Especificación para @db:

```
scheduling.dispute_notes
  id              uuid PK
  appointment_id  uuid NOT NULL, FK → scheduling.appointments.id
  author_id       uuid NOT NULL, FK → iam.users.id
  note            text NOT NULL
  created_at      timestamptz NOT NULL DEFAULT now()
```

Sin `UNIQUE`, permite múltiples notas por cita. `GET /appointments/:id` devuelve el array de notas
junto al detalle de la cita.

**Nota sobre `verified_by`/`verified_at` en `sellers.sellers`** (encargo a @db):
```
sellers.sellers
  + verified_by  uuid NULL, FK → iam.users.id
  + verified_at  timestamptz NULL
```
(la columna `verified boolean` ya existe según el inventario — se completa con quién y cuándo).

---

### A.4 ¿Un solo frontend dev para landing + back-office, o proyectos separados?

**Respuesta a la pregunta abierta de `docs-plan-integracion-main-client.md`.**

**Recomendación: mismo repositorio/proyecto (`main_client`) en el corto plazo (enero), pero con
aislamiento estructural fuerte dentro del mismo proyecto — NO un dominio/deploy separado todavía.**
Reevaluar separación real de deploy en Fase 2 si el equipo/tráfico crecen.

Razones (trade-off explícito):

| Opción | Costo | Riesgo | Cuándo se justifica |
|---|---|---|---|
| **Mismo proyecto, mismas rutas `/admin/*`** (estado actual) | Más bajo — cero infraestructura nueva, un solo build/deploy. | **Alto hoy**: inventario confirma "cualquiera puede navegar a `/admin/vehicles` sin autenticarse" (cero guards de ruta en frontend). Si se agregan pantallas de sellers/disputas al mismo dashboard sin resolver esto, el riesgo crece (datos de negocio sensibles, no solo CRUD de vehículos). | Nunca, tal como está hoy — hay que agregar guards de ruta como mínimo. |
| **Mismo proyecto, con guard de ruta + rutas protegidas `/internal/*`** (recomendado para enero) | Bajo-medio: agregar un `PrivateRoute`/`ProtectedRoute` wrapper (lee JWT, valida `internalRole`, redirige a login si no aplica) — trabajo de 1-2 días, no arquitectura nueva. | Medio: sigue siendo el mismo bundle JS servido al público general (alguien podría, en teoría, descargar el JS del dashboard interno igual, aunque sin poder autenticarse ni ver datos reales sin backend). Aceptable para MVP: **el riesgo real de negocio está en el backend (datos), no en el bundle JS** — si el backend enforce JWT+rol correctamente (sección A.2), un visitante sin credenciales no puede ver ni un byte de dato real aunque cargue el HTML del panel. | MVP de enero: equipo chico (founder + 1-2 devs), tráfico bajo, no justifica mantener 2 despliegues. |
| **Proyecto/dominio separado (ej. `admin.segunda.com` como app aparte)** | Alto: doble build, doble deploy, doble configuración de env vars/CORS, posible duplicación de componentes compartidos (o extraer un paquete compartido, más complejidad). | Bajo — superficie de ataque reducida (el bundle del back-office nunca se sirve al público general), y permite políticas de seguridad más estrictas específicas del back-office (CSP más agresiva, IP allowlist, etc.) sin afectar la landing pública. | Cuando el equipo interno crezca (más de 3 roles, más volumen de datos sensibles), o cuando haya requisito de compliance/seguridad que lo exija explícitamente. Natural candidato para ejecutar **junto con la migración a Next.js de Fase 2** (`docs-arquitectura-ajustes-infra.md` sección 5) — mismo momento en que ya se está tocando la arquitectura de frontend, evita una tercera migración de frontend en el corto plazo. |

**Conclusión: mismo frontend dev, mismo proyecto, con las siguientes condiciones NO negociables
para MVP de enero** (van en sección D como tareas):
1. Backend enforcing real de `JwtAuthGuard` + `InternalRolesGuard` en todos los endpoints de
   back-office (sin esto, ninguna opción de frontend es segura — es la base).
2. Frontend: guard de ruta (`ProtectedRoute`) que redirige a login si no hay JWT válido o si el rol
   interno no alcanza para la sección, y oculta/muestra menú según `internalRole` (ya lo pide
   `mvp-usuarios-internos.md` HU-INT-02).
3. No se requiere separar dominio/deploy para el volumen y tamaño de equipo de enero — se
   documenta como decisión de Fase 2, condicionada a que crezca la superficie de riesgo real
   (más personal interno, más datos sensibles, o pedido explícito de compliance).

---

## B. Deuda técnica crítica — qué es bloqueante YA vs. qué espera

| Ítem | ¿Bloqueante ya? | Opinión del arquitecto |
|---|---|---|
| `JwtAuthGuard` no aplicado a ningún endpoint (`/vehicles` público de escritura) | **SÍ, bloqueante inmediato, independiente de roles internos.** | Esto es un agujero de seguridad activo en el estado actual del código, no algo que "se puede posponer para cuando se necesiten roles". Cualquiera puede hoy crear/editar vehículos sin login contra `backend/` nuevo. Debe resolverse en el mismo sprint que se registre esta tarea, antes de sumar cualquier funcionalidad nueva de back-office (no tiene sentido proteger `/sellers`/`/appointments` con roles nuevos si `/vehicles` sigue abierto). Prioridad #1 de la lista de tareas (sección D). |
| JWT secret con fallback hardcodeado inseguro (`'segunda-jwt-secret-dev'`) | **SÍ, bloqueante para cualquier ambiente que no sea dev local.** | Un fallback hardcodeado significa que si `JWT_SECRET` no está seteado en `.env`/variables de entorno de un ambiente (staging, prod, o incluso CI), el secreto es público (está en el repo). Esto invalida cualquier garantía de seguridad de JWT en ese ambiente. Fix trivial (falla explícita al boot si no hay `JWT_SECRET`, sin fallback) — debe ir junto con la tarea de auth, mismo sprint. |
| `synchronize: true` sin condicionar por `NODE_ENV` | **Bloqueante antes de cualquier despliegue a un ambiente compartido/prod**, no bloqueante para seguir desarrollando en local hoy mismo. | Ya señalado por @db en `docs-db-spec-mes1-scheduling.md` (riesgo #2). Mientras se siga trabajando solo en dev local con datos descartables, no bloquea el avance de esta semana — pero **no debe llegar a Mes 4 (piloto)** sin resolverse, y como ya se están introduciendo las primeras migraciones reales (Mes 1 de scheduling), es el momento natural de resolverlo (mismo commit/PR que agrega la primera migración explícita). Lo incluyo en la lista de tareas con prioridad alta, no urgente-hoy-mismo. |
| Duplicación `vehicle_service/` vs. `backend/src/contexts/vehicles/`, y scaffolds vacíos `seller_service/`, `scheduling_service/`, `file_service/` | **No bloqueante funcionalmente, sí recomendado eliminar pronto — con aprobación del founder antes de borrar.** | Mi recomendación explícita: **eliminar los 4** (`vehicle_service/`, `seller_service/`, `scheduling_service/`, `file_service/`). Son código muerto que aumenta la superficie de confusión para cualquier persona nueva del equipo (¿cuál es la fuente de verdad, `vehicle_service` o `backend/src/contexts/vehicles`?) y no aportan valor — la migración real ya vive en `backend/`. Antes de borrar: **esto se propone al founder explícitamente, no se ejecuta unilateralmente** (instrucción del propio encargo de este documento). Ver tarea en sección D. |
| `docker-compose.yml` desalineado con producción real (no incluye gateway ni legacy) | **No bloqueante para el desarrollo de `backend/` nuevo — sí es un problema de higiene operativa que puede confundir a alguien que intente levantar "todo el sistema" con un solo comando.** | Mientras la producción real siga siendo gateway+legacy (hasta que `main_client` migre en Mes 2), el `docker-compose.yml` raíz debería, idealmente, reflejar ambos mundos (o documentar explícitamente en un README que hay dos flujos: "legacy real hoy" vs. "backend nuevo en construcción"). No lo marco bloqueante porque no impide ningún trabajo de desarrollo actual, pero sí genera fricción/confusión de onboarding. Prioridad media en la lista de tareas. |

**Resumen ejecutivo para @po/founder**: de los 5 puntos, **2 son bloqueantes de seguridad
inmediatos** (guard no aplicado + secret hardcodeado) y deben resolverse antes de continuar con
cualquier feature nueva de back-office — no tiene sentido diseñar roles internos sobre una base
donde ni el endpoint más básico (`/vehicles`) está protegido.

---

## C. Inventario de cron jobs — diseñado, no implementado

Confirmado por inventario: `@nestjs/schedule` **no está instalado**, cero `@Cron` en el código, cero
`node-cron`. Los 6 jobs siguientes están **diseñados en `docs-arquitectura-mes1-scheduling.md`
sección 4**, pendientes de implementación completa:

| Job | Frecuencia diseñada | Estado |
|---|---|---|
| `ReleaseExpiredSlotsJob` | cada 5 min | Diseñado, no implementado |
| `SendReminder24hJob` | cada 15 min | Diseñado, no implementado |
| `SendReminder2hJob` | cada 5 min | Diseñado, no implementado |
| `SendRsvpRequestJob` | cada 15 min (integrado al de 24h) | Diseñado, no implementado |
| `SendCloseOfCycleLinkJob` | cada 15 min | Diseñado, no implementado |
| `ExpireCustomerResultWindowJob` | cada 1h | Diseñado, no implementado |

Prerrequisito común a los 6: instalar `@nestjs/schedule`, registrar `ScheduleModule.forRoot()` en
`AppModule`, y tener las entidades de `scheduling` (Appointment con los campos nuevos, ver spec de
@db) ya migradas — no se puede implementar ningún job sin `release_at`, `customer_result_token_expires_at`,
etc. presentes en la tabla real.

---

## D. Tareas de backend priorizadas (para @developer)

Agrupadas por área. Cada tarea indica qué incluye y de qué depende.

### D.0 — Seguridad urgente (bloqueante, hacer primero, antes de cualquier feature nueva)

1. **Aplicar `JwtAuthGuard` globalmente + decorador `@Public()`**
   - Incluye: registrar `JwtAuthGuard` como `APP_GUARD` global; crear `@Public()` decorator;
     marcar como público: `POST /auth/login`, `POST /auth/register`, `GET /vehicles`, `GET
     /vehicles/:id` (cuando exista), todos los endpoints de `ReferenceController` (`/brands`,
     `/categories`, etc.).
   - Marcar como protegidos (requieren JWT válido, sin rol específico todavía): `POST /vehicles`,
     `PUT /vehicles/:id`.
   - Depende de: nada, es la base de todo lo demás.

2. **Eliminar fallback hardcodeado del JWT secret**
   - Incluye: `JwtModule.register`/`.registerAsync` debe lanzar error explícito al boot si
     `process.env.JWT_SECRET` no está seteado (sin fallback string literal en código).
   - Depende de: nada, en paralelo a la tarea 1.

3. **Condicionar `synchronize` por `NODE_ENV`**
   - Incluye: `synchronize: process.env.NODE_ENV !== 'production'` en `database.module.ts`.
     Aprovechar el mismo commit para alinear `data-source.ts` (`migrations: ['src/migrations/*.ts']`)
     según riesgo #1 de `docs-db-spec-mes1-scheduling.md`.
   - Depende de: nada, hacer antes de generar la primera migración real de scheduling.

### D.1 — Roles internos (modelo + endpoints de panel)

4. **Entidad `InternalStaff` + migración**
   - Incluye: crear `iam/entities/internal-staff.entity.ts` según spec de la sección A.1, generar
     migración (tabla nueva, sin datos previos → segura, pero usar migración explícita igual por
     consistencia con el resto de Mes 1).
   - Depende de: tarea 3 (buena práctica tener `synchronize` ya condicionado antes de la primera
     migración nueva de `iam`).

5. **`RolesGuard` + `InternalRolesGuard` + decoradores `@Roles()`/`@InternalRoles()`**
   - Incluye: los 2 guards + 2 decoradores de la sección A.2, y actualizar `JwtStrategy.validate()`
     para resolver `internalRole` desde `internal_staff` en cada validación de token.
   - Depende de: tarea 4 (necesita la entidad `InternalStaff`), tarea 1 (el guard base ya aplicado).

6. **`InternalStaffController`** (`POST /internal/staff`, `GET /internal/staff`, `PATCH
   /internal/staff/:id`)
   - Incluye: alta/listado/edición de cuentas internas, solo `admin`. Alta crea `User` +
     `InternalStaff` en una sola transacción (si falla la segunda escritura, rollback de la primera).
   - Depende de: tareas 4 y 5.

7. **Seed manual del primer admin**
   - Incluye: script/seed idempotente (mismo patrón `count()`/`findOneBy` que el resto del proyecto)
     que crea 1 `User` + 1 `InternalStaff(role='admin')` si no existe ya, usando credenciales desde
     `.env` (`INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD`), **no hardcodeadas en código**.
   - Depende de: tarea 4.

8. **Endpoints de sellers para el panel**: `GET /sellers`, `PATCH /sellers/:id/verify`
   - Incluye: implementar `SellerController` (hoy vacío) con estos 2 endpoints; agregar columnas
     `verified_by`/`verified_at` a `Seller` (ver encargo a @db, sección A.3).
   - Depende de: tarea 5 (guards de rol interno).

9. **Endpoint de nota de disputa**: `POST /appointments/:id/dispute-notes` + `scheduling.dispute_notes`
   - Incluye: entidad `DisputeNote`, migración, endpoint restringido a `admin`/`asesor` (no
     `operador`).
   - Depende de: tarea 5, y de que exista `Appointment`/`AppointmentController` (ver D.4).

### D.2 — `vehicles`: endpoints faltantes

10. **`GET /vehicles/:id`**
    - Incluye: `findOne` estándar + formato `{ message, record }`, marcado `@Public()`.
    - Depende de: tarea 1 (para decidir si va público o no — sí, público, catálogo es público).
    - Bloquea: ficha de detalle de vehículo en frontend (`docs-plan-integracion-main-client.md`
      sección 3.4).

11. **Filtros en `GET /vehicles`**: `brandId`, `categoryId`, `minPrice`, `maxPrice`
    - Incluye: query params opcionales en el controller, `WHERE` dinámico en el service/repository
      (usar QueryBuilder de TypeORM, no concatenar strings).
    - Depende de: nada nuevo, extiende el controller existente.
    - Bloquea: filtros de landing pública (sección 3.5 del plan de integración).

### D.3 — Infraestructura mínima

12. **Instalar y configurar `@nestjs/schedule`**
    - Incluye: `npm install @nestjs/schedule`, `ScheduleModule.forRoot()` en `AppModule`, carpeta
      `scheduling/jobs/`.
    - Depende de: que las entidades de `scheduling` con los campos nuevos ya existan (ver D.4,
      tarea 15) — no tiene sentido crear los jobs contra columnas que no existen todavía.

13. **Implementar los 6 cron jobs** (`ReleaseExpiredSlotsJob`, `SendReminder24hJob`,
    `SendReminder2hJob`, `SendRsvpRequestJob`, `SendCloseOfCycleLinkJob`,
    `ExpireCustomerResultWindowJob`)
    - Incluye: un `@Injectable()` por job en `scheduling/jobs/`, cada uno con `@Cron()` según
      frecuencia de la sección C, llamando a los métodos ya diseñados del `AppointmentService`
      (`releaseExpiredSlot`, etc.).
    - Depende de: tarea 12, y de `AppointmentService`/casos de uso de scheduling (D.4).

14. **Instalar y configurar `nestjs-pino`**
    - Incluye: `npm install nestjs-pino pino-http`, logger JSON a stdout, contexto `requestId` +
      `userId`/`internalRole` (si autenticado) + `context` en cada log, nivel configurable por
      `LOG_LEVEL`.
    - Depende de: nada, se puede hacer en paralelo a cualquier otra tarea. Priorizar antes de
      empezar a debuggear scheduling/jobs en un ambiente compartido.

15. **Bucket de archivos: `StorageProvider` + `R2StorageProvider` + `FilesService` + `vehicle_photos`**
    - Incluye: interfaz `StorageProvider` (sección 2.3 de `docs-arquitectura-ajustes-infra.md`),
      implementación `R2StorageProvider` con `@aws-sdk/client-s3`, `FilesModule` exportando
      `FilesService`, entidad `files.vehicle_photos` + migración, endpoints `POST
      /vehicles/:id/photos` (subida) y que `GET /vehicles/:id` incluya URLs firmadas de fotos.
    - Depende de: tarea 10 (`GET /vehicles/:id` debe existir para poder incluir fotos en la
      respuesta).
    - Bloquea: ficha de detalle real en frontend (galería de fotos).

### D.4 — Context `scheduling` completo (según diseño ya cerrado en Mes 1)

16. **Migrar entidades de `scheduling`**: `Appointment` (reemplazar `date`+`time_slot` por
    `scheduled_at` + campos nuevos), `AppointmentRating`, `SchedulingSetting`, `BusinessEvent`
    - Incluye: aplicar exactamente la spec de `docs-db-spec-mes1-scheduling.md` sección 3, generar
      las migraciones en el orden de su sección 6, revisar a mano el SQL de `AlterAppointmentsScheduling`
      antes de correr `migration:run` (riesgo de pérdida de datos si hay filas existentes).
    - Depende de: tarea 3 (synchronize condicionado, antes de tocar una tabla con posibles datos).

17. **`VehiclesService`: agregar métodos `isBlockedForScheduling`, `blockForAppointment`,
    `releaseFromAppointment`, `archiveBySale`, `suggestAlternatives`**
    - Incluye: exactamente el contrato de la sección 2.3 de `docs-arquitectura-mes1-scheduling.md`.
      Agregar el valor de catálogo `active_appointment` al seed de `Status` (patrón anti-`count()`
      global, ver `docs-db-spec-mes1-scheduling.md` sección 3.7).
    - Depende de: tarea 16 (necesita el catálogo de `Status` actualizado).

18. **`AppointmentService`: casos de uso completos** (`createAppointment`, `confirmRsvp`,
    `releaseExpiredSlot`, `cancelBySale`, `recordSellerResult`, `recordCustomerResult`,
    `expireCustomerResultWindow`, `submitRating`, `resolveFinalState`)
    - Incluye: implementar los 8 métodos de la sección 2.2/2.4 de `docs-arquitectura-mes1-scheduling.md`,
      usando `queryRunner.startTransaction()` para la transacción cross-schema de `createAppointment`
      (crea `Appointment` + bloquea `Vehicle` de forma atómica).
    - Depende de: tareas 16 y 17.

19. **`SchedulingController`**: definir y exponer las rutas REST reales (`POST /appointments`,
    `POST /appointments/:id/rsvp`, `PATCH /appointments/:id/seller-result`, `GET/POST
    /appointments/customer-result/:token`, etc.)
    - Incluye: **este es el contrato pendiente que bloquea el frontend** (`docs-plan-integracion-main-client.md`
      sección 4.3 lo señala explícitamente). Debe cerrarse formato de request/response (`{ message,
      record }` estándar) y confirmar si el endpoint del link de un clic responde JSON o hace
      redirect (decisión de UX, coordinar con @po antes de implementar).
    - Depende de: tarea 18.
    - **Nota**: el endpoint `GET/POST /appointments/customer-result/:token` es intencionalmente
      `@Public()` (sin JWT, protegido solo por token hasheado+expiración) — no aplicar
      `InternalRolesGuard` ni `JwtAuthGuard` ahí.

20. **`SettingsService` + seed de `scheduling.settings`**
    - Incluye: `get<T>(key, fallback)` cacheado en memoria (TTL 60s), seed idempotente con los 5
      defaults (sección 5 de `docs-arquitectura-mes1-scheduling.md`), usando el patrón
      `findOneBy`/insert individual, no `count()` global.
    - Depende de: tarea 16.

21. **`NotificationsService` + `EmailChannel`**
    - Incluye: `notifications` module nuevo, interfaz `NotificationChannel`, implementación
      `EmailChannel` (SMTP/nodemailer, decisión de @developer), templates versionados en código.
    - Depende de: tarea 18 (los casos de uso ya deben poder invocar `NotificationsService.notify(...)`).

22. **`BusinessEventsService` + tabla `business_events`**
    - Incluye: servicio simple de inserción de eventos, invocado desde los casos de uso de la tarea
      18 y desde `vehicles` (para `vehicle_published`/`vehicle_archived`).
    - Depende de: tarea 16.

### D.5 — Extensión de `iam`: verificación de email

23. **`iam.email_verifications` + columna `email_verified_at` + endpoints**
    - Incluye: entidad + migración según sección 3.1/3.2 de `docs-db-spec-mes1-scheduling.md`,
      `POST /auth/verify-email/request`, `POST /auth/verify-email/confirm`, método
      `IamService.isEmailVerified(userId)`.
    - Depende de: tarea 3 (synchronize condicionado).
    - Bloquea: `createAppointment` (tarea 18) valida `isEmailVerified` antes de agendar.

### D.6 — Limpieza de duplicados (requiere aprobación del founder antes de ejecutar)

24. **Proponer al founder eliminar `vehicle_service/`, `seller_service/`, `scheduling_service/`,
    `file_service/`**
    - Incluye: **no se ejecuta automáticamente** — se presenta la recomendación (sección B de este
      documento) al founder/@po, y solo tras aprobación explícita se borran del repo (o se archivan
      en una rama/tag si se prefiere no perder el historial).
    - Depende de: nada técnicamente, pero es un gate de decisión de negocio/equipo, no una tarea de
      desarrollo pura.

25. **Alinear `docker-compose.yml` raíz con el flujo real de producción (o documentar la
    divergencia)**
    - Incluye: agregar `gateway` + `legacy vehicles_service` al compose raíz (o, alternativa más
      simple, un `docker-compose.legacy.yml` separado + README explicando los 2 flujos: "legacy real
      hoy" vs. "backend nuevo en construcción").
    - Depende de: nada, prioridad media, no bloquea desarrollo.

---

## Resumen de orden de ejecución sugerido

```
Sprint 0 (seguridad, bloqueante):     D.0 (tareas 1-3)
Sprint 1 (roles internos base):       D.1 (tareas 4-9)
Sprint 1b (en paralelo, bajo riesgo): D.2 (tareas 10-11), D.3.14 (logging)
Sprint 2 (scheduling completo):       D.4 (tareas 16-22), D.5 (tarea 23)
Sprint 2b (en paralelo):              D.3.15 (bucket), D.3.12-13 (cron, depende de D.4.16)
Cuando el founder apruebe:            D.6 (tareas 24-25)
```
