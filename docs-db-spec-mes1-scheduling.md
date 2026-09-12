# Especificación técnica de base de datos — Mes 1 (`scheduling` + identidad `customer`)

> Responde al encargo de la Sección 8 de `docs-arquitectura-mes1-scheduling.md`.
> Fase de **especificación de entidades TypeORM**, no se generan migraciones SQL en esta entrega.
> Convenciones: columnas en `snake_case`, entidades/DTOs en `camelCase` (propiedades de TS respetan snake_case existente en el proyecto — ver nota en sección 6), `@Entity({ schema: '...' })` por contexto.

---

## 1. Estado actual real (inspección de código, no supuestos)

| Archivo | Hallazgo |
|---|---|
| `backend/src/common/database/database.module.ts` | `synchronize: true` **sin condicionar por `NODE_ENV`** (aplica siempre, también si se despliega así en prod). Riesgo — ver sección 5. |
| `backend/src/common/database/data-source.ts` | `migrations: ['migrations/*.ts']` — ruta relativa `migrations/` (no `src/migrations/`). **Inconsistencia con AGENTS.md**, que documenta `src/migrations/<Nombre>` como destino del comando `migration:generate`. Hay que confirmar/ajustar antes de generar la primera migración real (ver riesgo #1 en sección 5). |
| `backend/src/migrations/` | **No existe todavía ninguna migración** — este será el primer uso real de migraciones en el proyecto. |
| `iam.users` (`user.entity.ts`) | Columnas: `id (uuid PK)`, `email (varchar(100) unique)`, `password`, `name (varchar(100))`, `role (varchar(20) default 'buyer')`, `active (boolean default true)`, `created_at`, `updated_at`. **No existe `email_verified_at`.** No existe tabla `email_verifications`. |
| `scheduling.appointments` (`appointment.entity.ts`) | Columnas actuales: `id (uuid PK)`, `vehicle_id (uuid)`, `seller_id (uuid)`, `buyer_id (uuid)`, `date (date)`, `time_slot (varchar(10))`, `status (varchar(20) default 'pending')`, `notes (text nullable)`, `created_at`, `updated_at`. **Ninguna es `@ManyToOne`/FK real — todos son `uuid` sueltos, sin relación TypeORM.** No existen `rsvp_*`, `release_at`, `seller_result*`, `customer_result*`, `is_disputed`. |
| `vehicles.vehicles` (`vehicle.entity.ts`) | `seller_id` es `@Column({ type: 'uuid', nullable: true })` **sin `@ManyToOne`/FK explícito** — confirma lo que señala el arquitecto en el punto 8 del encargo. El resto de catálogos (`brand_id`, `category_id`, etc.) sí tienen `@ManyToOne` + `@JoinColumn`. |
| `vehicles.status` (`status.entity.ts`) | `id (PK autoincrement int)`, `name (varchar 60)`, `str_code (varchar 50)`, `active (boolean default false)`, `created_at`, `updated_at`. Seed actual (`seed.service.ts`): `Disponible/available`, `Reservado/reserved`, `Vendido/sold`, todos con `active: true` guardado explícitamente (el default de la columna es `false`, pero el seed siempre pasa `true` — es decir, `active` en este catálogo significa "visible/seleccionable", no "es el estado activo del vehículo"). |
| `sellers.sellers` (`seller.entity.ts`) | `id (uuid PK)`, `user_id (uuid)` **sin FK explícito tampoco** (mismo patrón laxo que el resto del proyecto), `business_name`, `tax_id`, `phone`, `verified`, `rating`, `total_sales`, timestamps. |
| Seed | Patrón idempotente confirmado: `if (await repo.count()) return;` antes de `save([...])`. Se reutilizará igual para `scheduling.settings` y para el nuevo valor de `vehicles.status`. |
| `init-schemas.sql` | Los 5 schemas ya existen (`iam`, `vehicles`, `sellers`, `scheduling`, `files`). No requiere cambios. |

---

## 2. Diagrama textual de entidades (estado final propuesto)

```
iam.users (modificada)
 ├─ id (PK)
 ├─ email_verified_at  [NUEVO]
 └─ 1───N  iam.email_verifications  [NUEVA TABLA]
              ├─ id (PK)
              ├─ user_id (FK → iam.users.id)
              ├─ token, expires_at, consumed_at, created_at

sellers.sellers
 └─ id (PK)  ←── referenciado por scheduling.appointments.seller_id (FK, nuevo)
     (user_id → iam.users.id: FK explícito recomendado, no bloqueante Mes 1)

vehicles.vehicles
 ├─ status_id (FK → vehicles.status.id, ya existe)
 └─ seller_id  ←── FK explícito recomendado (hoy uuid suelto) → sellers.sellers.id

vehicles.status (catálogo, modificada solo en seed)
 └─ + fila nueva: str_code = 'active_appointment' (naming provisional)

scheduling.appointments (modificada)
 ├─ id (PK)
 ├─ vehicle_id (FK → vehicles.vehicles.id)      [FK nuevo, antes suelto]
 ├─ seller_id  (FK → sellers.sellers.id)        [FK nuevo, antes suelto]
 ├─ buyer_id   (FK → iam.users.id)               [FK nuevo, antes suelto]
 ├─ scheduled_at   [reemplaza date + time_slot]
 ├─ status
 ├─ rsvp_confirmed_at        [NUEVO]
 ├─ release_at               [NUEVO]
 ├─ seller_result             [NUEVO]
 ├─ seller_result_at          [NUEVO]
 ├─ customer_result           [NUEVO]
 ├─ customer_result_at        [NUEVO]
 ├─ customer_result_token           [NUEVO]
 ├─ customer_result_token_expires_at [NUEVO]
 ├─ is_disputed (default false)     [NUEVO]
 ├─ notes, created_at, updated_at
 └─ 1───N  scheduling.appointment_ratings  [NUEVA TABLA]
              ├─ id (PK)
              ├─ appointment_id (FK → appointments.id)
              ├─ rater_role, stars, label, created_at
              └─ UNIQUE (appointment_id, rater_role)

scheduling.settings  [NUEVA TABLA, key-value]
 └─ key (PK), value, description, updated_at

scheduling.business_events  [NUEVA TABLA, append-only]
 └─ id (PK), event_type, entity_type, entity_id, payload (jsonb), created_at
 └─ INDEX (event_type, created_at)
```

---

## 3. Definición detallada de columnas + entidades TypeORM

### 3.1 `iam.users` — modificación

Columna nueva:

| Columna | Tipo | Nullable | Default | Notas |
|---|---|---|---|---|
| `email_verified_at` | `timestamptz` | sí | `NULL` | Se consulta en `IamService.isEmailVerified` |

```ts
// user.entity.ts — agregar
@Column({ type: 'timestamptz', nullable: true })
email_verified_at!: Date | null;
```

**¿synchronize o migración?** Columna nueva, nullable, sin default obligatorio, sin pérdida de datos posible → **segura para `synchronize: true` en dev**. Para prod (cuando se desactive `synchronize`), requiere migración explícita simple (`ADD COLUMN`).

---

### 3.2 `iam.email_verifications` — tabla nueva

| Columna | Tipo | Nullable | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` PK | no | `gen_random_uuid()` | |
| `user_id` | `uuid` | no | — | FK → `iam.users.id`, `ON DELETE CASCADE` (si se borra el usuario, no tiene sentido conservar tokens) |
| `token` | `varchar(255)` | no | — | **hash** del token (nunca plano), indexado para lookup rápido en confirm |
| `expires_at` | `timestamptz` | no | — | |
| `consumed_at` | `timestamptz` | sí | `NULL` | |
| `created_at` | `timestamp` | no | `CURRENT_TIMESTAMP` | |

```ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { User } from './user.entity';

@Entity({ schema: 'iam', name: 'email_verifications' })
export class EmailVerification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  user_id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Index()
  @Column({ length: 255 })
  token!: string;

  @Column({ type: 'timestamptz' })
  expires_at!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  consumed_at!: Date | null;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;
}
```

**¿synchronize o migración?** Tabla nueva, sin datos previos → **segura para `synchronize: true`**. Registrar en `IamModule` (`TypeOrmModule.forFeature([User, EmailVerification])`).

---

### 3.3 `scheduling.appointments` — modificación (con cuidado por renombres)

**Cambios que requieren atención especial** (no dejar a `synchronize` sin más, ver detalle):

| Cambio | Acción | Riesgo si hay filas existentes |
|---|---|---|
| `date` + `time_slot` → `scheduled_at` | Eliminar 2 columnas, agregar 1 nueva | `synchronize: true` **dropea `date`/`time_slot` silenciosamente y crea `scheduled_at` vacía** — pérdida de datos si ya hay citas creadas en dev/staging con datos de prueba que importen conservar. |
| Resto de columnas nuevas (`rsvp_confirmed_at`, `release_at`, `seller_result`, etc.) | Solo `ADD COLUMN nullable` | Sin riesgo, aditivo. |
| `is_disputed` | `ADD COLUMN boolean NOT NULL DEFAULT false` | Sin riesgo, tiene default. |
| FKs nuevos en `vehicle_id`, `seller_id`, `buyer_id` | Agregar constraint sobre columnas ya existentes | Riesgo si hay filas con valores huérfanos (uuid que no existe en la tabla referenciada) → la migración fallaría al crear el FK. Debe validarse antes. |

**Recomendación:** aunque en dev con `synchronize: true` esto podría "funcionar" recreando la tabla, **este cambio debe ir por migración explícita generada con**:
```
npm run migration:generate -- src/common/database/data-source.ts src/migrations/AlterAppointmentsScheduling
```
porque:
1. Involucra un rename semántico (`date`+`time_slot` → `scheduled_at`) que TypeORM/`synchronize` no interpreta como "rename", sino como drop+create, perdiendo datos existentes.
2. Es el primer cambio de esquema real del proyecto sobre una tabla que ya tiene filas potenciales (aunque sea scaffold, cualquier ambiente con datos de prueba se rompe silenciosamente).
3. Agrega constraints FK que pueden fallar si hay datos inconsistentes — mejor detectarlo en migración controlada (que se puede revisar/editar antes de correr) que en un `synchronize` que se ejecuta automáticamente al bootear la app.

Si la tabla está vacía en todos los ambientes (a confirmar con @developer/@po antes de mergear), se puede simplificar la migración a un simple `DROP COLUMN` + `ADD COLUMN` en vez de una migración de "backfill" de datos.

Definición completa de columnas:

| Columna | Tipo | Nullable | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` PK | no | `gen_random_uuid()` | sin cambios |
| `vehicle_id` | `uuid` | no | — | FK → `vehicles.vehicles.id` (nuevo) |
| `seller_id` | `uuid` | no | — | FK → `sellers.sellers.id` (nuevo, confirmado en 3.6) |
| `buyer_id` | `uuid` | no | — | FK → `iam.users.id` (nuevo) |
| `scheduled_at` | `timestamptz` | no | — | reemplaza `date`+`time_slot` |
| `status` | `varchar(30)` | no | `'agendada'` | enum de aplicación (no enum de Postgres, para evitar migración en cada nuevo estado) |
| `rsvp_confirmed_at` | `timestamptz` | sí | `NULL` | |
| `release_at` | `timestamptz` | no | — | calculado al insertar, en servicio |
| `seller_result` | `varchar(20)` | sí | `NULL` | |
| `seller_result_at` | `timestamptz` | sí | `NULL` | |
| `customer_result` | `varchar(20)` | sí | `NULL` | |
| `customer_result_at` | `timestamptz` | sí | `NULL` | |
| `customer_result_token` | `varchar(255)` | sí | `NULL` | hash, indexado |
| `customer_result_token_expires_at` | `timestamptz` | sí | `NULL` | |
| `is_disputed` | `boolean` | no | `false` | |
| `notes` | `text` | sí | `NULL` | sin cambios |
| `created_at` / `updated_at` | `timestamp` | no | `CURRENT_TIMESTAMP` | sin cambios |

**Índice recomendado adicional** (no pedido explícitamente por el arquitecto pero necesario para el job `ReleaseExpiredSlotsJob` y para la regla de bloqueo "1 cita activa por vehículo/por buyer"):
- `@Index(['vehicle_id', 'status'])` — acelera `isBlockedForScheduling` / `existsActiveAppointmentForBuyer`.
- `@Index(['status', 'release_at'])` — acelera el polling del cron.

```ts
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
  CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { Seller } from '../../sellers/entities/seller.entity';
import { User } from '../../iam/entities/user.entity';

@Entity({ schema: 'scheduling', name: 'appointments' })
@Index(['vehicle_id', 'status'])
@Index(['status', 'release_at'])
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  vehicle_id!: string;

  @ManyToOne(() => Vehicle)
  @JoinColumn({ name: 'vehicle_id' })
  vehicle!: Vehicle;

  @Column({ type: 'uuid' })
  seller_id!: string;

  @ManyToOne(() => Seller)
  @JoinColumn({ name: 'seller_id' })
  seller!: Seller;

  @Column({ type: 'uuid' })
  buyer_id!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'buyer_id' })
  buyer!: User;

  @Column({ type: 'timestamptz' })
  scheduled_at!: Date;

  @Column({ length: 30, default: 'agendada' })
  status!: string;

  @Column({ type: 'timestamptz', nullable: true })
  rsvp_confirmed_at!: Date | null;

  @Column({ type: 'timestamptz' })
  release_at!: Date;

  @Column({ length: 20, nullable: true })
  seller_result!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  seller_result_at!: Date | null;

  @Column({ length: 20, nullable: true })
  customer_result!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  customer_result_at!: Date | null;

  @Column({ length: 255, nullable: true })
  customer_result_token!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  customer_result_token_expires_at!: Date | null;

  @Column({ default: false })
  is_disputed!: boolean;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at!: Date;
}
```

> **Nota sobre `@ManyToOne` cross-schema y bajo acoplamiento**: el arquitecto especifica que `scheduling` **no debe importar `Repository<Vehicle>`** para lógica de negocio (usa `VehiclesService`). Esto es compatible con tener la relación `@ManyToOne` a nivel de **entidad** para que la FK exista en la base de datos (integridad referencial), sin que el **servicio** de `scheduling` inyecte `Repository<Vehicle>` para queries de negocio. Es decir: el FK a nivel de columna SQL sí debe existir (integridad de datos); el acoplamiento a evitar es a nivel de *código de servicio*, no de *constraint de base de datos*. Si el equipo prefiere evitar incluso el `@ManyToOne`/import de la entidad `Vehicle` dentro del módulo `scheduling` (aislamiento total de módulos Nest), se puede declarar el FK a nivel de migración SQL pura (`ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY`) sin el decorador `@ManyToOne` en la entidad — mantiene la columna `vehicle_id: uuid` simple en el entity. **Recomendación: usar la migración SQL para el FK y omitir `@ManyToOne`/import de `Vehicle` en `Appointment` si se quiere respetar al 100% el aislamiento de módulos**; documentarlo así para @developer.

**¿synchronize o migración?** → **Migración explícita obligatoria**, ver justificación arriba.

---

### 3.4 `scheduling.appointment_ratings` — tabla nueva

| Columna | Tipo | Nullable | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` PK | no | `gen_random_uuid()` | |
| `appointment_id` | `uuid` | no | — | FK → `appointments.id`, `ON DELETE CASCADE` |
| `rater_role` | `varchar(10)` | no | — | `'seller'` \| `'buyer'` |
| `stars` | `smallint` | no | — | CHECK `stars BETWEEN 1 AND 5` |
| `label` | `varchar(50)` | no | — | denormalizado, no FK a catálogo |
| `created_at` | `timestamp` | no | `CURRENT_TIMESTAMP` | |

Constraint: `UNIQUE (appointment_id, rater_role)`.

```ts
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
  CreateDateColumn, Unique, Check,
} from 'typeorm';
import { Appointment } from './appointment.entity';

@Entity({ schema: 'scheduling', name: 'appointment_ratings' })
@Unique(['appointment_id', 'rater_role'])
@Check(`"stars" BETWEEN 1 AND 5`)
export class AppointmentRating {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  appointment_id!: string;

  @ManyToOne(() => Appointment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appointment_id' })
  appointment!: Appointment;

  @Column({ length: 10 })
  rater_role!: 'seller' | 'buyer';

  @Column({ type: 'smallint' })
  stars!: number;

  @Column({ length: 50 })
  label!: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;
}
```

**¿synchronize o migración?** Tabla nueva → **segura para `synchronize: true`** en dev. El `@Check` de Postgres a veces no se sincroniza igual vía TypeORM `synchronize` entre versiones — validar en dev que efectivamente crea el `CHECK CONSTRAINT`; si no, agregarlo manual en la migración de prod.

---

### 3.5 `scheduling.settings` — tabla nueva (key-value)

| Columna | Tipo | Nullable | Default | Notas |
|---|---|---|---|---|
| `key` | `varchar(100)` PK | no | — | |
| `value` | `varchar(255)` | no | — | almacenado como texto, cast en `SettingsService` |
| `description` | `text` | sí | `NULL` | |
| `updated_at` | `timestamp` | no | `CURRENT_TIMESTAMP` | |

```ts
import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity({ schema: 'scheduling', name: 'settings' })
export class SchedulingSetting {
  @PrimaryColumn({ length: 100 })
  key!: string;

  @Column({ length: 255 })
  value!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at!: Date;
}
```

**Seed idempotente** (mismo patrón que `SeedService` de `vehicles`):

```ts
async seedSchedulingSettings() {
  if (await this.settingsRepo.count()) return;
  await this.settingsRepo.save([
    { key: 'rsvp_release_window_hours', value: '4', description: 'Horas antes de la cita en que se libera si no hay RSVP' },
    { key: 'customer_link_window_hours', value: '72', description: 'Ventana del link de un clic para el customer' },
    { key: 'fee_per_attended_cop', value: '1000', description: 'Tarifa cobrada por visita atendida (COP)' },
    { key: 'n_alternative_vehicles', value: '3', description: 'Cantidad de vehículos alternativos sugeridos al cancelar por venta' },
    { key: 'notification_channels_enabled', value: 'email', description: 'Canales de notificación habilitados, separados por coma' },
  ]);
}
```

> **Nota:** a diferencia del seed de `vehicles` (que usa `count()` global porque son catálogos "todo o nada"), aquí `count()` global es igual de válido porque el seed **siempre inserta las 5 filas juntas** en el mismo `save()`. Si en el futuro se agregan más *settings* individuales en releases posteriores, cambiar a un `upsert` por `key` (`ON CONFLICT (key) DO NOTHING`) para que un seed incremental no choque con `count() > 0` y se salte de largo sin insertar las filas nuevas. **Recomendación para @developer: usar desde ya `for (const s of defaults) { if (!(await repo.findOneBy({ key: s.key }))) await repo.save(s); }` en vez de `count()` global**, para que el seed sea extensible sin refactor futuro.

**¿synchronize o migración?** Tabla nueva → **segura para `synchronize: true`**.

---

### 3.6 `scheduling.business_events` — tabla nueva (append-only)

| Columna | Tipo | Nullable | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` PK | no | `gen_random_uuid()` | |
| `event_type` | `varchar(50)` | no | — | |
| `entity_type` | `varchar(20)` | no | — | `'vehicle'` \| `'appointment'` |
| `entity_id` | `uuid` | no | — | sin FK (puede referenciar entidades de distinto schema/tabla según `entity_type`, es polimórfico — no se modela como FK real) |
| `payload` | `jsonb` | sí | `NULL` | |
| `created_at` | `timestamp` | no | `CURRENT_TIMESTAMP` | |

Índice compuesto: `(event_type, created_at)`.

```ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity({ schema: 'scheduling', name: 'business_events' })
@Index(['event_type', 'created_at'])
export class BusinessEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 50 })
  event_type!: string;

  @Column({ length: 20 })
  entity_type!: string;

  @Column({ type: 'uuid' })
  entity_id!: string;

  @Column({ type: 'jsonb', nullable: true })
  payload!: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;
}
```

**¿synchronize o migración?** Tabla nueva → **segura para `synchronize: true`**. Es append-only, sin FKs, sin riesgo.

---

### 3.7 Catálogo `vehicles.status` — nuevo valor de seed

No requiere cambio de entidad (`Status` ya soporta cualquier fila nueva). Solo agregar al `SeedService.seedStatus`:

```ts
async seedStatus() {
  if (await this.statusRepo.count()) return;
  await this.statusRepo.save([
    { name: 'Disponible', str_code: 'available', active: true },
    { name: 'Reservado', str_code: 'reserved', active: true },
    { name: 'Vendido', str_code: 'sold', active: true },
    { name: 'Con cita activa', str_code: 'active_appointment', active: true }, // NUEVO — naming provisional, pendiente UX
  ]);
}
```

**Riesgo de seed**: como `seedStatus` usa `if (await this.statusRepo.count()) return;`, en cualquier ambiente donde `vehicles.status` **ya tenga las 3 filas actuales insertadas**, el seed se saltará por completo y **la fila nueva nunca se insertará**. Esto es un problema real para ambientes de dev/staging ya bootstrapeados.

**Recomendación de plan de seed para este caso puntual:** cambiar el criterio de "todo o nada" (`count() > 0`) a verificación por `str_code` individual, igual que se recomienda para `settings`:

```ts
async seedStatus() {
  const defaults = [
    { name: 'Disponible', str_code: 'available', active: true },
    { name: 'Reservado', str_code: 'reserved', active: true },
    { name: 'Vendido', str_code: 'sold', active: true },
    { name: 'Con cita activa', str_code: 'active_appointment', active: true },
  ];
  for (const s of defaults) {
    const exists = await this.statusRepo.findOneBy({ str_code: s.str_code });
    if (!exists) await this.statusRepo.save(s);
  }
}
```

Esto es **compatible hacia atrás** (no reinserta los 3 existentes) y agrega el nuevo valor sin duplicar filas al reiniciar. Recomiendo aplicar el mismo patrón a **todos** los seeds de catálogo del proyecto (`brands`, `categories`, etc.) en un refactor futuro, para evitar el mismo problema cuando se agregue cualquier valor nuevo — fuera de alcance de esta entrega, pero dejarlo anotado como deuda técnica.

**¿synchronize o migración?** No hay cambio de esquema, solo dato de seed → no aplica synchronize/migración, es lógica de aplicación (`SeedService`), corre en cada boot.

---

### 3.8 FKs faltantes en `Vehicle.seller_id` y `Seller.user_id`

El arquitecto pide validar el punto 8. Hallazgo confirmado: **ninguno de los dos tiene FK explícito hoy**.

Recomendación:

```ts
// vehicle.entity.ts — agregar
@ManyToOne(() => Seller, { nullable: true })
@JoinColumn({ name: 'seller_id' })
seller!: Seller | null;
```

```ts
// seller.entity.ts — agregar
@ManyToOne(() => User)
@JoinColumn({ name: 'user_id' })
user!: User;
```

**¿synchronize o migración?** Agregar un FK a una columna `uuid` **ya existente y con datos** (vehículos ya creados con `seller_id` posiblemente `NULL` o apuntando a sellers válidos/inválidos) es el mismo riesgo que el punto 3.3: si hay algún `seller_id` huérfano (no existe en `sellers.sellers`), la creación del constraint falla. **Requiere migración explícita** con un paso previo de verificación:
```sql
SELECT id, seller_id FROM vehicles.vehicles v
WHERE seller_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM sellers.sellers s WHERE s.id = v.seller_id);
```
Si esta query no devuelve filas, la migración de `ADD CONSTRAINT FOREIGN KEY` es segura. Si devuelve filas, hay que decidir con @developer/@po qué hacer con esos datos huérfanos antes de aplicar el constraint (limpiarlos o dejarlos `NULL`).

Esto **no estaba en el encargo explícito del punto 8 como obligatorio para esta entrega** (el arquitecto lo marca como "podría revisarse"), así que lo dejo como **recomendación, no bloqueante para Mes 1** — puede ir en una migración separada, posterior a la de `appointments`, para no mezclar dos cambios de riesgo distinto en el mismo commit de migración.

---

## 4. Confirmación FK `Appointment.seller_id` (punto 8 del encargo)

Confirmado: **`Appointment.seller_id` debe apuntar a `sellers.sellers.id`**, no a `iam.users.id`. Razones:
- Es coherente con el resto del sistema: `Vehicle` no tiene `seller_id` directo a `User`, sino que el concepto de "seller" en el dominio de negocio siempre pasa por la entidad `Seller` (perfil de concesionario), igual patrón que propone el arquitecto para `buyer`/`customer` en `iam` vs. dominio.
- Un `User` con `role='seller'` puede (en teoría, según diseño futuro) tener más de un `Seller` (ej. multi-concesionario por usuario) — aunque hoy es 1:1 implícito, modelarlo contra `Seller.id` es más correcto y ya es el patrón usado en `Vehicle` (`Vehicle.seller_id` también podría apuntar a `Seller.id`, ver 3.8).
- Evita tener que hacer un JOIN adicional `Appointment → User → Seller` cuando se necesite mostrar `business_name`, `phone`, `rating` del concesionario en el dashboard de citas — con FK directo a `Seller.id` es un solo JOIN.

---

## 5. Riesgos e inconsistencias detectadas (resumen)

| # | Riesgo/Inconsistencia | Recomendación |
|---|---|---|
| 1 | `data-source.ts` apunta `migrations: ['migrations/*.ts']` (relativo a `backend/`, sin `src/`), pero AGENTS.md documenta el comando generando en `src/migrations/<Nombre>`. Si no se ajusta, la primera migración generada podría no coincidir con la ruta que TypeORM realmente carga en runtime. | Antes de correr `migration:generate` por primera vez, @developer/@db deben confirmar y alinear `data-source.ts` (`migrations: ['src/migrations/*.ts']`) o mover la carpeta de salida, y probar `migration:run` en un ambiente limpio para validar que la ruta resuelve correctamente. |
| 2 | `synchronize: true` en `database.module.ts` **no está condicionado por `NODE_ENV`** — si el mismo `DatabaseModule` se usa en prod (ver Docker en AGENTS.md: backend:3000 + postgres:5432), corre `synchronize` en producción, lo cual es exactamente lo que AGENTS.md dice evitar ("Disable in prod, use migrations"). | Antes de que exista la primera migración real (esta entrega la introduce), condicionar `synchronize: process.env.NODE_ENV !== 'production'` en `database.module.ts`. Esto es una recomendación de @db hacia @developer, no algo que yo deba implementar en código de aplicación. |
| 3 | `Appointment`, `Vehicle`, `Seller` no tienen ningún FK real a nivel de entidad hoy — toda la integridad referencial actual del proyecto depende solo de la disciplina de la capa de aplicación. Esta entrega es la primera vez que se introducen FKs reales entre schemas. | Validar datos huérfanos antes de aplicar cada constraint (ver 3.3 y 3.8) — no asumir que el dataset de dev/staging está limpio. |
| 4 | El seed de catálogos (`Status`, y por extensión `Brand`, `Category`, etc.) usa `count() > 0` como guard "todo o nada", lo que impide agregar valores nuevos a un catálogo ya sembrado sin código adicional. | Cambiar el criterio a verificación por clave única individual (`str_code`/`key`) — aplicado en esta entrega para `Status` y `SchedulingSetting`; recomendar el mismo patrón para el resto de catálogos como deuda técnica separada. |
| 5 | `scheduling.appointments.status` sigue siendo `varchar` libre (no enum de Postgres) — consistente con la justificación del arquitecto de "enum de aplicación", pero implica que la validación de valores permitidos (`agendada`, `liberada`, `cancelada_por_venta`, `atendido`, `no_se_presento`, `disputada`) vive 100% en el código de `AppointmentService`/DTOs, no en la base de datos. | Aceptable para MVP; si se detectan valores corruptos en producción, considerar un `CHECK` constraint con la lista fija como defensa adicional (bajo costo, se puede agregar en migración posterior sin romper nada). |
| 6 | `Vehicle.seller_id` y `Seller.user_id` sin FK explícito (punto 8 arquitecto). | Ver sección 3.8 — recomendado pero no bloqueante para esta entrega; requiere migración separada con verificación previa de datos huérfanos. |
| 7 | `notifications.notification_log` (mencionada al final del documento del arquitecto) **está explícitamente fuera de alcance de esta entrega** — no se modela aquí. | Confirmado, no incluida. |

---

## 6. Plan de migraciones a generar (orden sugerido para @developer)

1. `AddEmailVerifiedAtToUsers` — columna nueva en `iam.users` (o incluirla en la migración #2 si se prefiere un solo commit para todo `iam`).
2. `CreateEmailVerifications` — tabla nueva en `iam`.
3. `AlterAppointmentsScheduling` — el cambio más delicado: drop `date`/`time_slot`, add `scheduled_at` + columnas de resultado + FKs. **Revisar manualmente el SQL generado antes de correr `migration:run`**, especialmente si hay filas existentes.
4. `CreateAppointmentRatings`.
5. `CreateSchedulingSettings` (+ el seed corre en código, no en la migración).
6. `CreateBusinessEvents`.
7. (Opcional, recomendado, no bloqueante) `AddSellerIdFkToVehiclesAndSellers` — FKs de la sección 3.8, con verificación previa de datos huérfanos.

Comando base para cada una:
```bash
npm run migration:generate -- src/common/database/data-source.ts src/migrations/<Nombre>
npm run migration:run
```

El nuevo valor de `vehicles.status` (punto 7 del encargo) **no requiere migración de esquema**, solo el ajuste de `SeedService.seedStatus` (código de aplicación, corre en cada boot).

---

## 7. Resumen de decisión `synchronize` vs. migración por cambio

| Cambio | ¿Seguro en `synchronize: true` (dev)? | ¿Requiere migración explícita? |
|---|---|---|
| `iam.users.email_verified_at` | Sí | Solo para prod cuando se desactive synchronize |
| `iam.email_verifications` (tabla nueva) | Sí | Solo para prod |
| `scheduling.appointments` (rename + FKs) | **No** — riesgo de pérdida de datos y fallo de constraint | **Sí, obligatoria**, revisar SQL generado a mano |
| `scheduling.appointment_ratings` (tabla nueva) | Sí | Solo para prod |
| `scheduling.settings` (tabla nueva) | Sí | Solo para prod |
| `scheduling.business_events` (tabla nueva) | Sí | Solo para prod |
| Seed `vehicles.status` nuevo valor | N/A (no es esquema) | No aplica |
| FKs `Vehicle.seller_id` / `Seller.user_id` | **No** — mismo riesgo de datos huérfanos | **Sí**, con verificación previa, separada de la migración de `appointments` |

---

## 8. Entregable para @developer

Este documento define el shape final de las entidades. @developer debe:
1. Aplicar los cambios de entidad TypeORM descritos en la sección 3.
2. Generar las migraciones en el orden de la sección 6, revisando manualmente el SQL de la migración #3 (appointments) antes de correr `migration:run`.
3. Ajustar `SeedService` (`vehicles`) y crear el seed de `scheduling.settings` según el patrón anti-`count()`-global descrito en 3.5/3.7.
4. Evaluar (no bloqueante) condicionar `synchronize` por `NODE_ENV` en `database.module.ts` y alinear la ruta de `migrations` en `data-source.ts` con `src/migrations/`.
</content>
