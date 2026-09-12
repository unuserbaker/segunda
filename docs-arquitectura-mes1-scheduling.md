# Diseño técnico — Mes 1 (Fundamentos): `scheduling` + identidad mínima de `customer`

> Basado en `mvp-refinamiento-mvp1.md` (secciones 1, 3, 5-Mes1, 6) y `AGENTS.md`.
> Alcance: solo diseño. Implementación y migraciones SQL las ejecutan @developer y @db.

---

## 0. Resumen de decisiones

| Pregunta | Decisión |
|---|---|
| ¿Dónde vive `customer`? | **Se extiende `iam`**, no se crea context `customers` nuevo. |
| ¿Dónde vive `scheduling`? | Context `scheduling` (ya scaffold), dueño de la máquina de estados y de la transacción de bloqueo. |
| ¿Cómo se comunica con `vehicles`? | In-process, vía un servicio exportado `VehiclesService` (método `blockForAppointment` / `releaseFromAppointment`), **no acceso directo a la entidad `Vehicle` desde `scheduling`**. |
| ¿Notificaciones? | Context nuevo **`notifications`**, con interfaz `NotificationChannel` agnóstica. Implementación inicial: `EmailChannel`. |
| ¿Jobs por tiempo? | `@nestjs/schedule` (cron in-process). Sin colas (Bull/Redis) — no se justifica para 4 meses / volumen MVP. |
| ¿Config de negocio? | Tabla `scheduling.settings` (key-value tipado) + fallback a `.env` para el valor inicial de seed. Ajustable sin release. |
| ¿Eventos de tracking? | Tabla genérica `scheduling.business_events` (append-only), poblada por los mismos casos de uso que ya escriben el estado — no un sistema de eventos separado. |

---

## 1. Identidad mínima de `customer`: extender `iam`

### Justificación
- `AGENTS.md` ya documenta `iam` como el context de auth (JWT, register/login), y `User.role` ya existe con **default `'buyer'`** (ver `backend/src/contexts/iam/entities/user.entity.ts`). El campo de rol ya está pensado para distinguir tipos de usuario.
- `sellers` ya sigue el patrón "context de dominio + `user_id` que referencia a `iam.users`" (`Seller.user_id`). El mismo patrón aplica para `customer`: no necesitamos otro context de identidad, sino una entidad de **perfil de dominio** que cuelga de `iam.users`.
- Crear un context `customers` separado duplicaría lo que `iam` ya resuelve (registro, password, JWT, guards) sin aportar aislamiento real: la verificación de email es un concepto de **identidad**, no de dominio de negocio de "cliente comprador". Vive en `iam`.
- Mantiene consistente la regla de AGENTS.md: "Auth uses `@nestjs/passport` + `@nestjs/jwt`. Guard: `JwtAuthGuard`" — un solo punto de verdad de autenticación para ambos roles (`seller`, `buyer`).

### Cambios en `iam`

1. **`User.role`**: ya soporta `'buyer'` | `'seller'` (evaluar agregar `'admin'` a futuro, fuera de alcance Mes 1).
2. **Nuevos campos en `User`** (o tabla satélite `iam.email_verifications` — recomendado tabla satélite para no ensuciar `users` con estado transitorio):
   - `User.email_verified_at: timestamp | null` (columna en `users`, se consulta en cada intento de agendar).
   - Tabla `iam.email_verifications`: `id`, `user_id`, `token` (hash, no el valor plano), `expires_at`, `consumed_at`, `created_at`. Permite reenvío de verificación sin invalidar historial.
3. **Nuevos endpoints en `AuthController`**:
   - `POST /auth/verify-email/request` — reenvía email de verificación (idempotente, rate-limit simple a nivel de servicio).
   - `POST /auth/verify-email/confirm` — body `{ token }`, marca `email_verified_at`.
4. **Regla de bloqueo**: la verificación de email **no se valida en un guard genérico** (no bloquea `/auth/*` ni exploración). Se valida puntualmente dentro del caso de uso `ScheduleAppointmentUseCase` de `scheduling`, consultando `IamService.isEmailVerified(userId)` (método exportado, no acceso a la entidad `User` desde `scheduling`).
5. Nada cambia para `seller` — sigue el mismo `User` + `Seller.user_id`.

### Contrato exportado de `iam` hacia otros contexts
```ts
// iam/iam.service.ts (nuevo, delgado, para consumo cross-context)
export class IamService {
  getUserRole(userId: string): Promise<'buyer' | 'seller' | null>;
  isEmailVerified(userId: string): Promise<boolean>;
}
```
`scheduling` y `notifications` solo consumen esto — nunca inyectan el `Repository<User>` directamente (evita acoplar schemas).

---

## 2. Context `scheduling`

### 2.1 Entidades

**`Appointment`** (ya existe como scaffold — se **modifica**, no se recrea desde cero). Campos mínimos a añadir/ajustar respecto al scaffold actual:

| Campo | Tipo | Nota |
|---|---|---|
| `id` | uuid PK | ya existe |
| `vehicle_id` | uuid | ya existe |
| `seller_id` | uuid | ya existe (referencia a `sellers.sellers.id`, **no** a `iam.users.id` directamente — ver nota abajo) |
| `buyer_id` | uuid | ya existe, renombrar conceptualmente a "customer" pero **mantener el nombre de columna `buyer_id`** por consistencia con `User.role = 'buyer'` |
| `scheduled_at` | timestamptz | reemplaza `date` + `time_slot` (un solo timestamp simplifica cálculo de ventanas 4h/72h; time_slot como texto libre es frágil para aritmética de fechas) |
| `status` | varchar(30) | enum de aplicación: `agendada`, `liberada`, `cancelada_por_venta`, `atendido`, `no_se_presento`, `disputada` |
| `rsvp_confirmed_at` | timestamptz nullable | cuándo el customer confirmó asistencia previa a la cita |
| `release_at` | timestamptz | calculado al crear = `scheduled_at - settings.rsvp_release_window` (4h default); usado por el job de liberación |
| `seller_result` | varchar(20) nullable | `atendido` \| `no_se_presento` (fuente autoritativa) |
| `seller_result_at` | timestamptz nullable | |
| `customer_result` | varchar(20) nullable | `asisti` \| `no_pude_ir` (opcional, vía link) |
| `customer_result_at` | timestamptz nullable | |
| `customer_result_token` | varchar(255) nullable | token de un clic (hash, no plano) |
| `customer_result_token_expires_at` | timestamptz nullable | ventana 72h |
| `notes` | text nullable | ya existe |
| `created_at`, `updated_at` | timestamp | ya existen |

**`AppointmentRating`** (nueva entidad):
| Campo | Tipo | Nota |
|---|---|---|
| `id` | uuid PK | |
| `appointment_id` | uuid | FK a `appointments` |
| `rater_role` | varchar(10) | `seller` \| `buyer` (quién califica) |
| `stars` | smallint | 1–5 |
| `label` | varchar(50) | texto asociado al nivel (ej. "Excelente"), denormalizado al momento de guardar para no depender de un catálogo mutable |
| `created_at` | timestamp | |

Restricción: único por `(appointment_id, rater_role)` — cada lado califica una sola vez por cita.

**`SchedulingSetting`** (nueva entidad — ver sección 5).

**`BusinessEvent`** (nueva entidad — ver sección 6).

### 2.2 Servicios / casos de uso principales

Organizados como métodos de un `AppointmentService` (o casos de uso separados si el equipo prefiere CQRS-lite; para MVP de 4 meses, un service cohesivo es suficiente — no sobre-diseñar):

1. **`createAppointment(buyerId, vehicleId, scheduledAt)`**
   - Valida: `IamService.isEmailVerified(buyerId)` → si no, error de dominio explícito (`EmailNotVerifiedException`).
   - Valida regla "1 cita activa por customer": `existsActiveAppointmentForBuyer(buyerId)`.
   - Valida regla "1 cita activa por vehículo": consulta `VehiclesService.isBlockedForScheduling(vehicleId)`.
   - Transacción: crea `Appointment` (`status = agendada`, calcula `release_at`) **y** llama a `VehiclesService.blockForAppointment(vehicleId, appointmentId)` para marcar el vehículo bloqueado.
   - Emite evento `visit_scheduled` (tabla `business_events`).
   - Dispara notificación de confirmación (a través de `NotificationsService`, no acoplado a implementación de email).

2. **`confirmRsvp(appointmentId, buyerId)`**
   - Solo válido si `status = agendada` y `now < release_at`.
   - Setea `rsvp_confirmed_at`.

3. **`releaseExpiredSlot(appointmentId)`** (invocado por el cron job, no por el usuario)
   - Solo si `status = agendada` y `rsvp_confirmed_at IS NULL` y `now >= release_at`.
   - `status → liberada`. Llama `VehiclesService.releaseFromAppointment(vehicleId)` (reactiva disponibilidad para agendar).
   - Emite evento `vehicle_reactivated`.

4. **`cancelBySale(vehicleId)`** (invocado por `vehicles` cuando el seller marca vendido — ver 2.3)
   - Busca cita activa (`agendada`) para ese `vehicle_id`.
   - `status → cancelada_por_venta`.
   - Emite evento `vehicle_archived` (del lado de `vehicles`) — `scheduling` solo emite lo referente a la cita.
   - Dispara notificación al buyer con alternativas: pide a `VehiclesService.suggestAlternatives(sellerId, vehicleId, n=settings.n_alternatives)`.

5. **`recordSellerResult(appointmentId, sellerId, result: 'atendido' | 'no_se_presento')`**
   - Autoritativo y obligatorio. Solo válido si `scheduled_at` ya pasó y `status = agendada`.
   - Setea `seller_result`, `seller_result_at`.
   - Resuelve `status` final combinando con `customer_result` si ya existe (ver 2.4 resolución), o queda pendiente de resolución si el customer aún no respondió (dentro de la ventana 72h).
   - Si `no_se_presento` → `VehiclesService.releaseFromAppointment(vehicleId)`; si a futuro se agrega "vendido" en este mismo flujo, es responsabilidad de `vehicles`, no de `scheduling`.
   - Genera `customer_result_token` + envía notificación con link de un clic (ventana 72h).
   - Emite evento `visit_result_recorded`.

6. **`recordCustomerResult(token, result: 'asisti' | 'no_pude_ir')`** (sin login, público, valida token+expiración)
   - Solo válido dentro de ventana 72h y si el token no fue consumido.
   - Setea `customer_result`, `customer_result_at`.
   - Resuelve estado final (ver 2.4).

7. **`expireCustomerResultWindow(appointmentId)`** (cron) — marca el token como no utilizable pasado 72h; no cambia el `status` (el `seller_result` ya es autoritativo y probablemente ya cerró el ciclo).

8. **`submitRating(appointmentId, raterRole, stars, label)`** — al cierre del ciclo (una vez hay `seller_result`), disponible tanto para seller como para buyer.

### 2.3 Relación con `vehicles` (bajo acoplamiento)

`scheduling` **nunca** importa `Repository<Vehicle>` ni la entidad `Vehicle`. Se define un servicio exportado desde `vehicles`:

```ts
// vehicles/vehicle.service.ts (se agregan estos métodos al servicio existente)
export class VehicleService {
  // ... CRUD existente
  isBlockedForScheduling(vehicleId: string): Promise<boolean>;
  blockForAppointment(vehicleId: string, appointmentId: string): Promise<void>; // set status_id -> "con cita activa" + guarda appointment_id de referencia
  releaseFromAppointment(vehicleId: string): Promise<void>; // vuelve a "disponible"
  archiveBySale(vehicleId: string): Promise<void>; // seller marca vendido → status_id "vendido"
  suggestAlternatives(sellerId: string, excludeVehicleId: string, n: number): Promise<Vehicle[]>;
}
```

Flujo inverso (venta bloquea/cancela cita): cuando el seller marca el vehículo como vendido vía `PUT /vehicles/:id` (o un endpoint dedicado `POST /vehicles/:id/mark-sold`), **`vehicles` es quien orquesta**: llama a `SchedulingService.cancelBySale(vehicleId)` de forma síncrona in-process, dentro de la misma transacción HTTP (no hace falta cross-schema transaction distribuida — ver sección de trade-offs).

**Dueño de la transacción**: para "agendar" el dueño es `scheduling` (orquesta y llama a `vehicles`); para "marcar vendido" el dueño es `vehicles` (orquesta y llama a `scheduling`). Cada caso de uso tiene un solo owner claro, evitando llamadas circulares dentro de la misma petición.

**Badge de estado del vehículo**: se deriva de `Vehicle.status_id` (ya existe en el entity `vehicles`), no de una nueva columna. `blockForAppointment` cambia a un `status` catálogo nuevo (ej. `"con_cita_activa"`) — @db debe agregar este valor al catálogo `vehicles.status` existente (seed), no una columna booleana nueva. Esto es coherente con el diseño ya implementado (`Vehicle.status` es relación a catálogo `Status`).

### 2.4 Resolución de discrepancia (seller vs. customer)

Regla determinística, aplicada en un único método `resolveFinalState(appointment)`:
- Si `seller_result` existe y `customer_result` es null (o aún dentro de ventana sin responder) → estado final = `seller_result` tal cual (`atendido` / `no_se_presento`).
- Si ambos existen y coinciden (`atendido`+`asisti` o `no_se_presento`+`no_pude_ir`) → estado final = `seller_result`.
- Si ambos existen y **no coinciden** → estado final = `seller_result`, pero se agrega flag `disputada = true` (columna adicional o se usa el propio `status` con valor `disputada` — **recomendado: columna booleana `is_disputed`**, separada del `status` operativo, para no perder el valor real seller). Esto es "solo registro", no dispara ninguna acción adicional (confirmado OUT en refinamiento).

---

## 3. Abstracción de canal de notificación

### Dónde vive: context nuevo `notifications`
No dentro de `scheduling`, porque:
- Recordatorios, RSVP y cierre de ciclo son todos "notificaciones", pero el remitente puede ser `scheduling` hoy y potencialmente `vehicles` (ej. futuras alertas de precio) o `sellers` mañana. Aislarlo evita que `scheduling` crezca con lógica de templates/proveedores de envío.
- Es un scaffold pequeño y de bajo riesgo para el Mes 1 (solo interfaz + adaptador email); no es sobre-ingeniería, es exactamente lo que pide el refinamiento ("debe quedar diseñado para poder añadir WhatsApp/SMS después sin rediseñar el flujo").

### Diseño

```ts
// notifications/notification-channel.interface.ts
export interface NotificationChannel {
  readonly name: 'email' | 'whatsapp' | 'sms';
  send(payload: NotificationPayload): Promise<void>;
}

export interface NotificationPayload {
  to: string;               // email o teléfono, según canal
  templateKey: string;      // 'appointment_confirmed' | 'reminder_24h' | 'reminder_2h' | 'rsvp_request' | 'appointment_closed_link' | ...
  variables: Record<string, unknown>;
}
```

```ts
// notifications/notifications.service.ts
@Injectable()
export class NotificationsService {
  constructor(private readonly channels: NotificationChannel[]) {} // inyectados por token, ver módulo

  async notify(payload: NotificationPayload, preferredChannels: string[] = ['email']) {
    // MVP: itera y usa el primer canal habilitado (por config), ver sección 5.
  }
}
```

- `EmailChannel implements NotificationChannel` — única implementación real en Mes 1 (puede usar `nodemailer` o un proveedor SMTP simple; decisión de @developer, no bloqueante para el diseño).
- Templates: archivos simples (handlebars/mustache o strings con placeholders) versionados en código, **no en DB** — no hay requerimiento de que el negocio edite copy sin release en Mes 1.
- `scheduling` depende de `NotificationsService` (interfaz), nunca de `EmailChannel` directamente. Activar WhatsApp después = agregar `WhatsAppChannel` + flag en `scheduling.settings.notification_channels_enabled` — cero cambios en `scheduling`.

---

## 4. Jobs dependientes de tiempo

### Mecanismo: `@nestjs/schedule` (cron in-process)

Justificación de "no sobre-diseñar":
- Volumen esperado (piloto de 2-3 concesionarias en enero, luego crecimiento gradual) no justifica una cola dedicada (BullMQ/Redis) con su infraestructura operativa adicional (otro proceso, otro servicio a monitorear) para un monolito de 4 meses de desarrollo.
- `@nestjs/schedule` corre dentro del mismo proceso Nest, usa `@Cron()` decorators, no requiere infraestructura nueva (coherente con "monolito modular... single process" de AGENTS.md).
- Riesgo aceptado: si el proceso se reinicia justo en la ventana de un cron, el próximo tick (ej. cada 5 min) lo recoge — no hay pérdida de datos porque los jobs son *polling* sobre columnas (`release_at`, `customer_result_token_expires_at`, `scheduled_at`), no eventos efímeros en memoria.

### Jobs concretos (todos como `@Injectable()` con `@Cron()`, en un `scheduling/jobs/` folder)

| Job | Frecuencia sugerida | Query base |
|---|---|---|
| `ReleaseExpiredSlotsJob` | cada 5 min | `Appointment` con `status='agendada' AND rsvp_confirmed_at IS NULL AND release_at <= now()` → llama `releaseExpiredSlot` por cada uno |
| `SendReminder24hJob` | cada 15 min (ventana ±15min) | `Appointment` con `status='agendada' AND scheduled_at BETWEEN now()+24h-15min AND now()+24h` |
| `SendReminder2hJob` | cada 5 min | análogo, ventana 2h |
| `SendRsvpRequestJob` | cada 15 min | dispara el pedido de RSVP en un punto intermedio (a definir con @po si es al agendar o X horas antes; **por defecto: se envía junto al recordatorio 24h**, evita un job adicional) |
| `SendCloseOfCycleLinkJob` | cada 15 min | `Appointment` con `seller_result IS NOT NULL AND customer_result_token IS NULL` (~2h después de la cita, según refinamiento) → genera token, envía email |
| `ExpireCustomerResultWindowJob` | cada 1h | `Appointment` con `customer_result_token IS NOT NULL AND customer_result_token_expires_at <= now() AND customer_result IS NULL` → marca token vencido (no cambia `status`) |

Todos idempotentes (chequean condición antes de actuar; correr dos veces no duplica efectos porque cambian el `status`/campo que la propia query filtra).

---

## 5. Configuración de negocio (parámetros ajustables sin release)

### Decisión: tabla `scheduling.settings` (key-value tipado) + seed inicial desde `.env`

Justificación:
- El refinamiento (sección 6) pide explícitamente que sean "configurable desde base de datos, no hardcodeado" para ventanas de tiempo y monto — esto descarta usar solo `.env` (que sí requiere redeploy para cambiar).
- Una tabla simple evita la complejidad de un sistema de feature-flags completo (no se justifica para 4 parámetros).

### Esquema sugerido

```
scheduling.settings
  key            varchar PK   -- 'rsvp_release_window_hours', 'customer_link_window_hours', 'fee_per_attended_cop', 'n_alternative_vehicles', 'notification_channels_enabled'
  value          varchar      -- almacenado como texto, cast en el service según tipo esperado
  description    text
  updated_at     timestamp
```

- Servicio `SettingsService.get<T>(key: string, fallback: T): Promise<T>` cacheado en memoria con TTL corto (ej. 60s) para no golpear DB en cada validación.
- Seed inicial (idempotente, igual patrón que `vehicles/seed`) carga los defaults del refinamiento: `4` horas, `72` horas, `1000` COP, `3` alternativos, `email` habilitado.
- **No se expone endpoint de edición en Mes 1** (fuera de alcance) — el ajuste se hace directo en DB por @db/@developer hasta que exista un panel admin (Fase 2). Esto ya cumple el requisito de "ajustable sin release de código".

---

## 6. Tracking de eventos de negocio

### Decisión: tabla genérica `scheduling.business_events` (append-only)

Justificación (vs. derivar solo de timestamps de las tablas existentes):
- Los eventos requeridos (`vehicle_published`, `visit_scheduled`, `visit_result_recorded`, `vehicle_reactivated`/`vehicle_archived`, `rating_submitted`) **cruzan schemas** (`vehicles`, `scheduling`). Derivarlos con `updated_at` de cada tabla obligaría a JOINs cross-schema frágiles y no captura el detalle necesario para facturación (ej. distinguir "asistió/no asistió" y "vendido/no vendido" en el mismo evento, según sección 3.9 del refinamiento).
- Es la tabla que **soporta directamente la monetización** ("cobro por agenda asistida"): un query simple `SELECT count(*) FROM business_events WHERE event_type='visit_result_recorded' AND payload->>'result'='atendido'` da el número a facturar sin re-derivar lógica de negocio en el reporte.
- Sigue siendo MVP-simple: **no es un event bus, ni event sourcing** — es una tabla de auditoría/analítica poblada de forma síncrona por los mismos casos de uso (no hay reconstrucción de estado a partir de eventos, el estado real vive en `Appointment`/`Vehicle`).

### Esquema sugerido

```
scheduling.business_events
  id           uuid PK
  event_type   varchar(50)   -- 'vehicle_published' | 'visit_scheduled' | 'visit_result_recorded' | 'vehicle_reactivated' | 'vehicle_archived' | 'rating_submitted'
  entity_type  varchar(20)   -- 'vehicle' | 'appointment'
  entity_id    uuid
  payload      jsonb         -- detalle libre (ej. { result: 'atendido', sellerId, vehicleId })
  created_at   timestamp
```

Nota: aunque vive en el schema `scheduling` por simplicidad (es donde ocurre la mayoría de los eventos y donde se calcula facturación), `vehicles` también escribe en ella para `vehicle_published`/`vehicle_archived` vía un `BusinessEventsService` exportado desde `scheduling` (o, alternativamente, se ubica en un context transversal si el equipo prefiere; para Mes 1 se recomienda mantenerlo en `scheduling` para no crear un context nuevo solo para esto).

---

## 7. Trade-offs evaluados y recomendación

| Decisión | Opciones consideradas | Recomendación y por qué |
|---|---|---|
| Comunicación `scheduling` ↔ `vehicles` | (a) eventos async (EventEmitter/outbox) (b) llamada directa a servicio exportado in-process | **(b)**. Es un monolito de un solo proceso; una transacción de negocio (agendar bloquea vehículo) debe ser atómica y consistente de inmediato — usar eventos async introduciría estados intermedios inconsistentes (vehículo visible como disponible por milisegundos/segundos tras "agendar") sin beneficio real, ya que no hay necesidad de desacoplar despliegues (mismo proceso). AGENTS.md ya establece "communicate in-process via exported services". |
| Transacciones cross-schema (bloqueo de vehículo + creación de cita) | (a) transacción DB única cross-schema (b) dos escrituras separadas con compensación manual si falla la segunda | **(a)** siempre que sea técnicamente viable: mismo `DataSource`/conexión Postgres, TypeORM soporta transacciones que tocan múltiples schemas dentro de la misma DB (es una sola base de datos con schemas, no bases separadas). Usar `queryRunner.startTransaction()` en el caso de uso `createAppointment`, escribiendo tanto `Appointment` como el update de `Vehicle.status_id` en la misma transacción. Si la escritura de `vehicles` falla, se hace rollback de la cita — evita el vehículo "atrapado" bloqueado sin cita, o cita creada sin bloqueo. |
| Autenticación de endpoints de `scheduling` | (a) `JwtAuthGuard` en todo (b) mixto: guard para creación/gestión, endpoints públicos sin guard para el link de un clic | **(b)**. `POST /appointments` y endpoints de dashboard seller requieren `JwtAuthGuard` (coherente con AGENTS.md). El endpoint `GET/POST /appointments/customer-result/:token` es intencionalmente público (sin login, por diseño de negocio) — protegido solo por el token firmado/hasheado + expiración, no por JWT. |
| Jobs: cron vs. colas | (a) `@nestjs/schedule` (b) BullMQ+Redis | **(a)** — ver sección 4. Revisar en Fase 2 si el volumen de notificaciones crece y se necesita reintentos robustos/backoff, ahí sí se justificaría una cola. |
| Config de negocio: DB vs. `.env` | (a) solo `.env` (b) solo tabla DB (c) tabla DB con seed desde `.env` | **(c)** — cumple el requisito explícito del refinamiento sin construir un panel de administración completo (fuera de alcance Mes 1). |
| Discrepancia seller/customer | (a) columna `status='disputada'` reemplaza el resultado (b) columna separada `is_disputed` + `status` conserva el resultado real del seller | **(b)** — preserva la fuente de verdad (seller) intacta para reportes/facturación, y añade la señal de disputa como metadato, tal como pide el refinamiento ("solo registro, sin resolución automática"). |

---

## 8. Encargo para @db (entidades y relaciones a crear/modificar)

1. **Modificar `iam.users`**: agregar columna `email_verified_at timestamptz nullable`.
2. **Nueva tabla `iam.email_verifications`**: `id uuid PK`, `user_id uuid FK→iam.users.id`, `token varchar(255)` (hash), `expires_at timestamptz`, `consumed_at timestamptz nullable`, `created_at timestamptz`.
3. **Modificar `scheduling.appointments`** (entidad `Appointment` ya existe, ajustar):
   - Reemplazar `date` + `time_slot` por `scheduled_at timestamptz`.
   - Agregar: `rsvp_confirmed_at timestamptz nullable`, `release_at timestamptz`, `seller_result varchar(20) nullable`, `seller_result_at timestamptz nullable`, `customer_result varchar(20) nullable`, `customer_result_at timestamptz nullable`, `customer_result_token varchar(255) nullable`, `customer_result_token_expires_at timestamptz nullable`, `is_disputed boolean default false`.
   - FK: `vehicle_id → vehicles.vehicles.id`, `seller_id → sellers.sellers.id`, `buyer_id → iam.users.id`.
4. **Nueva tabla `scheduling.appointment_ratings`**: `id uuid PK`, `appointment_id uuid FK→appointments.id`, `rater_role varchar(10)`, `stars smallint` (check 1-5), `label varchar(50)`, `created_at timestamptz`. Unique `(appointment_id, rater_role)`.
5. **Nueva tabla `scheduling.settings`**: `key varchar PK`, `value varchar`, `description text nullable`, `updated_at timestamptz`. Seed con los 5 defaults de la sección 5.
6. **Nueva tabla `scheduling.business_events`**: `id uuid PK`, `event_type varchar(50)`, `entity_type varchar(20)`, `entity_id uuid`, `payload jsonb`, `created_at timestamptz`. Índice en `(event_type, created_at)` para reportes.
7. **Modificar catálogo `vehicles.status`** (tabla `Status` existente): agregar valor de seed `"con_cita_activa"` (o el naming final que defina UX, ver sección 7 del refinamiento — pendiente de UX, no bloquea el modelo).
8. Confirmar que `sellers.sellers.id` es el FK correcto para `Appointment.seller_id` (no `iam.users.id` directamente) — mantiene la relación ya usada en el resto del sistema (`Vehicle.seller_id` también podría revisarse si apunta a `sellers.sellers.id` o a `iam.users.id`; @db debe validar consistencia, hoy `Vehicle.seller_id` es `uuid nullable` sin FK explícita en el entity).

No incluir en esta entrega: context `notifications` (solo requiere una tabla de log opcional `notifications.notification_log` para trazabilidad de envíos — evaluable en Mes 3, no bloquea Mes 1).
