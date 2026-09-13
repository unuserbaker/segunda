# ADR — Registro self-service de sellers y exposición del estado `verified`

> Responde a reglas de negocio cerradas por @po (registro self-service de seller + banner
> "cuenta en revisión" + bloqueo de publicación mientras no esté verificado). Este documento
> decide el **cómo** técnico: dónde vive la orquestación, atomicidad, forma del DTO, cómo se
> expone `verified` al frontend, y dónde se bloquea `POST /vehicles`.

Contexto de código verificado:
- `AuthService.register()` (`iam`) hoy solo crea `User`, sin transacción (un único `save`).
- `SellerService` (`sellers`) no tiene `create()`; solo `findAll`, `verify`, `findByUserId`.
- `VehiclesModule` **ya importa `SellersModule`** (`vehicles.module.ts:16,23`) — precedente de
  import cruzado entre estos contextos, pero en sentido `vehicles → sellers`, no `iam → sellers`.
- El precedente transaccional cross-schema del proyecto (`createAppointment`,
  `VehicleSaleService.markAsSold`) **no** llama a servicios de otros contextos dentro de la
  transacción: abre `queryRunner.createQueryRunner()` sobre el `DataSource` compartido y usa
  `queryRunner.manager.getRepository(Entity)` importando la **clase de entidad** directamente
  (`Vehicle`, `Appointment`, `Status`), sin necesitar que el módulo orquestador importe el
  `Module` dueño de esa entidad. La entidad ya está registrada en el `DataSource` global vía el
  `TypeOrmModule.forFeature` de su propio contexto — el `queryRunner` la ve igual.
- `internalRole` (rol interno del staff) se resuelve **en `JwtStrategy.validate()` en cada
  request**, no como claim del JWT ni en la respuesta de login — decisión ya documentada en
  `docs-arquitectura-roles-internos-y-tareas-backend.md` sección A.2 punto 4, justificada
  exactamente por el mismo problema que tenemos aquí: el valor cambia con el tiempo
  (`InternalStaff.active` / `Seller.verified`) y no queremos re-emitir el token para reflejarlo.
  Ese mismo módulo (`IamModule`) ya registra `TypeOrmModule.forFeature([..., InternalStaff, ...])`
  para que `JwtStrategy` pueda inyectar ese repo sin depender de otro `Module`.

---

## 1. Dónde vive la orquestación "registrar seller + crear su perfil Seller"

**Decisión: en `AuthService.register()`, sin extraer a otro punto ni a otro contexto.**

`register()` ya es el único dueño de "crear la identidad de un usuario nuevo"; agregar la
creación condicional del perfil `Seller` es una extensión natural de esa misma responsabilidad,
no una orquestación cross-domain nueva que amerite un módulo intermedio (a diferencia del caso
`vehicle-sales`, donde dos contextos con reglas de negocio propias — `vehicles` y `scheduling` —
debían coordinarse). Aquí `sellers` no aporta lógica de negocio a la transacción, solo una fila
más que insertar atómicamente junto con `User`.

**No hace falta que `IamModule` importe `SellersModule` (ni al revés).** Siguiendo el precedente
de `vehicle-sale.service.ts`, `AuthService` no necesita `SellerService` para este flujo — necesita
el repo de `Seller` dentro de la misma transacción física, y eso se resuelve con
`queryRunner.manager.getRepository(Seller)`, importando únicamente la clase de entidad `Seller`
(`import { Seller } from '../sellers/entities/seller.entity'`). Esto evita cualquier discusión de
ciclo de módulos: `IamModule` sigue sin conocer `SellersModule` a nivel de `Module`, exactamente
como `VehicleSaleModule` no hizo que `VehiclesModule` conociera `SchedulingModule` para escribir en
su tabla dentro de la transacción.

`SellerService.create()` **no se implementa** — no hay otro llamador que lo necesite hoy, y
crearlo solo para no importar una entidad sería indirección sin beneficio (mismo criterio que ya
aplicó el proyecto al preferir `queryRunner.manager.getRepository(Vehicle)` en vez de pasar por
`VehicleService` dentro de la transacción de venta).

## 2. Transacción atómica

**Decisión: `queryRunner.startTransaction()` compartido, mismo patrón que `createAppointment` /
`markAsSold`.**

```
queryRunner = dataSource.createQueryRunner()
connect() → startTransaction()
try:
  userRepo = queryRunner.manager.getRepository(User)
  sellerRepo = queryRunner.manager.getRepository(Seller)

  1. existing = userRepo.findOne({ email })  → si existe: throw ConflictException (igual que hoy)
  2. user = userRepo.save({ email, password: hash, name, role })
  3. si dto.role === 'seller':
       seller = sellerRepo.save({
         user_id: user.id,
         business_name: dto.business_name,
         tax_id: dto.tax_id,
         phone: dto.phone,
         verified: false,
       })
  4. commitTransaction()
catch (err):
  rollbackTransaction()
  # mapear violación de índice único (tax_id) a error de negocio legible:
  if err.code === '23505' (Postgres unique_violation) y detecta constraint de tax_id:
     throw ConflictException('Ya existe una concesionaria registrada con este NIT')
  re-throw / dejar que HttpExceptionFilter maneje el resto
finally:
  release()

# fuera de la transacción, después del commit:
token = jwtService.sign({ sub: user.id, email: user.email, role: user.role })
return { token, user: {...}, seller: seller ? {...} : undefined }
```

Si falla el `save` del `Seller` (ej. `tax_id` duplicado), el `rollbackTransaction()` revierte
también el `save` del `User` — no queda un usuario "huérfano" sin perfil de seller. Esto es
exactamente el requisito del punto 2 de @po.

La emisión del JWT queda **fuera** de la transacción (no es I/O de base de datos, no debe
bloquear el commit ni revertirse si falla — mismo criterio que "side effects best-effort después
del commit" del ADR de venta de vehículo, aunque aquí no hay notificación async que disparar).

## 3. Extensión de `RegisterDto`

**Decisión: `@ValidateIf(o => o.role === 'seller')` sobre los tres campos nuevos.** Es el patrón
estándar de `class-validator` para validación condicional y no requiere DTOs separados por rol
(evita duplicar `email`/`password`/`name` en un `RegisterSellerDto` aparte).

```typescript
import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsIn, ValidateIf } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsIn(['buyer', 'seller'])
  role?: string;

  @ValidateIf((o) => o.role === 'seller')
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  business_name?: string;

  @ValidateIf((o) => o.role === 'seller')
  @IsString()
  @MaxLength(50)
  tax_id?: string;

  @ValidateIf((o) => o.role === 'seller')
  @IsString()
  @MaxLength(20)
  phone?: string;
}
```

Nota: cambio `role?: IsString()` → `@IsIn(['buyer', 'seller'])`. Hoy el DTO acepta cualquier
string como `role` (`AuthService.register` hace `dto.role || 'buyer'` sin whitelist) — con
self-service de seller conviene cerrar el valor a los dos roles públicos permitidos (los roles
internos como `admin`/`asesor`/`operador` **no** se asignan por este endpoint, viven en
`InternalStaff`, tabla separada — confirmar que esto ya es así hoy, no se toca ese flujo).

## 4. Endpoint para exponer `verified` al frontend

**Decisión: las dos cosas, no una sola — resuelven necesidades distintas:**

**(a) Resolver `sellerVerified` en `JwtStrategy.validate()`, mismo patrón que `internalRole`.**
Igual que `InternalStaff`, `IamModule` agrega `Seller` a su propio
`TypeOrmModule.forFeature([...])` (no requiere importar `SellersModule`, misma entidad, dos
registros de `forFeature` en módulos distintos apuntando al mismo `DataSource` es válido y ya es
el patrón usado para reusar entidades entre contextos vía `queryRunner`/repos directos):

```typescript
async validate(payload: { sub: string; email: string; role: string }) {
  const staff = await this.internalStaffRepo.findOneBy({ user_id: payload.sub, active: true });
  const seller = payload.role === 'seller'
    ? await this.sellerRepo.findOneBy({ user_id: payload.sub })
    : null;

  return {
    id: payload.sub,
    userId: payload.sub,
    email: payload.email,
    role: payload.role,
    internalRole: staff?.role ?? null,
    sellerVerified: seller?.verified ?? null,   // null = no aplica (no es seller)
  };
}
```

Esto pone `sellerVerified` disponible en **cada request** vía `req.user`, sin re-emitir el token
cuando cambia (se resuelve fresco en cada llamada, igual que `internalRole`) — es el criterio
explícito de la sección A.2 punto 4 citada arriba: *"el JWT no debería llevar información que
cambia con el tiempo y requeriría reemitir el token para reflejarla"*. Por el mismo argumento,
**se descarta** incluir `sellerVerified` como claim firmado del JWT y **se descarta** incluirlo
solo en la respuesta de `POST /auth/login` (quedaría stale si el seller es verificado mientras la
sesión sigue activa — el banner no se actualizaría hasta el próximo login).

**(b) Nuevo `GET /sellers/me`**, para cuando el frontend necesita el perfil completo (no solo el
booleano) — `business_name`, `tax_id`, `phone`, `rating`, `total_sales`, fechas de verificación:

```
GET /sellers/me
Auth: JwtAuthGuard, requiere role === 'seller' (o 403 si no aplica)

200 OK
{
  "message": "Perfil de seller",
  "record": {
    "id": "...",
    "business_name": "...",
    "tax_id": "...",
    "phone": "...",
    "verified": false,
    "verified_at": null,
    "rating": 0,
    "total_sales": 0
  }
}

404 Not Found → el usuario tiene role='seller' pero no tiene perfil Seller (no debería pasar si
                el registro está bien implementado, pero cubre datos legacy/inconsistentes)
```

Implementación: nuevo método en `SellerController` que usa `req.user.userId` +
`sellerService.findByUserId()` (ya existe, sin cambios en `SellerService`).

**Resumen del trade-off:** `sellerVerified` en `req.user` resuelve el caso de uso más frecuente
(banner + deshabilitar botón, chequeo barato, sin round-trip HTTP adicional) sin la staleness del
JWT; `GET /sellers/me` resuelve la carga inicial del dashboard/formulario de perfil, que de todas
formas necesita más campos que un booleano.

## 5. Guard/validación que bloquea `POST /vehicles` si el seller no está verificado

**Decisión: guard nuevo y reusable, `SellerVerifiedGuard`, no una validación dentro de
`VehicleService.create()`.**

Razones:
- Es una regla de **autorización** ("¿este actor puede ejecutar esta acción?"), no una regla de
  **negocio de dominio** de vehículo (no depende de los datos del vehículo que se está creando).
  Mezclarla en `VehicleService.create()` acopla una decisión de identidad/estado de cuenta con la
  lógica de persistencia de vehículos.
- Es reusable: el mismo chequeo aplicará previsiblemente a futuras acciones de "publicar" (ej. si
  mañana se agrega `POST /vehicles/:id/photos` con la misma restricción, o cualquier otro endpoint
  de "alta" que el `po` decida bloquear para no verificados). Un guard declarativo
  (`@UseGuards(SellerVerifiedGuard)`) se aplica en una línea; una validación embebida en el
  service se duplicaría o requeriría extraer un helper de todos modos.
- Es consistente con el patrón ya establecido en el proyecto para autorización transversal
  (`InternalRolesGuard` + `@InternalRoles()`, `JwtAuthGuard` global).
- Es barato de implementar: el dato (`sellerVerified`) ya viene resuelto en `req.user` por el
  punto 4(a) — el guard no hace una query extra a DB, solo lee el request.

```typescript
// backend/src/common/guards/seller-verified.guard.ts
@Injectable()
export class SellerVerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // No aplica a roles internos ni a buyers publicando en nombre de otro flujo — solo bloquea
    // cuando el actor es explícitamente un seller sin verificar.
    if (user?.role !== 'seller') return true;
    if (user?.sellerVerified !== true) {
      throw new ForbiddenException(
        'Tu cuenta de concesionaria está en revisión. No puedes publicar vehículos todavía.',
      );
    }
    return true;
  }
}
```

Aplicación en `VehicleController`:

```typescript
@Post()
@UseGuards(SellerVerifiedGuard)
create(@Body() dto: CreateVehicleDto, @Req() req) { ... }
```

**Fuera de alcance de este bloqueo** (regla 5 de @po es explícita): login, `GET /vehicles`, y
cualquier lectura siguen sin restricción — el guard solo se agrega al endpoint `POST /vehicles`.

## 6. Impacto en schemas (para @db)

1. **`sellers.tax_id`**: hoy es `nullable`, sin constraint de unicidad. Con registro self-service,
   `tax_id` pasa a ser conditionally-required (ver DTO, sección 3) y debe ser único por regla de
   negocio implícita (un NIT no puede pertenecer a dos concesionarias). Se requiere:
   - `UNIQUE` constraint en `sellers.tax_id` — recomendar **partial unique index**
     (`WHERE tax_id IS NOT NULL`) para no romper filas legacy que pudieran tener `tax_id = NULL`
     (si `sellers` no tiene filas legacy todavía, un `UNIQUE` simple basta; @db confirma según
     estado real de la tabla).
   - Antes de aplicar la constraint, verificar/deduplicar filas existentes si las hay.
2. **`sellers.user_id`**: debe garantizar **como máximo un `Seller` por `User`** — `findByUserId`
   ya asume esa invariante (usa `findOneBy`, no `find`). Verificar si existe `UNIQUE(user_id)`; si
   no, agregarla. Sin esta constraint, un bug de aplicación podría crear dos `Seller` para el mismo
   `user_id` y `findByUserId` devolvería uno arbitrario silenciosamente.
3. Sin tablas nuevas. `role` de `User` ya acepta `'seller'` como valor libre (columna sin `enum`
   de DB, solo string) — no requiere migración, pero si `iam.users.role` tiene un `CHECK` constraint
   o `enum` en DB, confirmar que `'seller'` ya esté incluido.

---

## Resumen ejecutivo para @developer

1. **`AuthService.register()`** se extiende con `queryRunner.startTransaction()` (mismo patrón que
   `appointment.service.ts` / `vehicle-sale.service.ts`): dentro de la tx, crea `User` y, si
   `dto.role === 'seller'`, crea también `Seller` (`user_id`, `business_name`, `tax_id`, `phone`,
   `verified: false`) usando `queryRunner.manager.getRepository(Seller)` — importa solo la clase
   `Seller` (entity), **no** toques `iam.module.ts` para agregar `SellersModule` como import de
   `Module` (no hace falta, y evita acoplar los dos contextos a nivel de módulo). Rollback total si
   falla cualquiera de los dos `save` (ej. `tax_id` duplicado → mapear a `ConflictException`
   legible). JWT se firma después del commit.
2. **`RegisterDto`**: agrega `business_name`, `tax_id`, `phone` con `@ValidateIf(o => o.role === 'seller')`;
   cambia `role` de `@IsString()` libre a `@IsIn(['buyer', 'seller'])`.
3. **`JwtStrategy.validate()`**: agrega `Seller` a `TypeOrmModule.forFeature([...])` de
   `iam.module.ts` (mismo patrón que `InternalStaff`), inyecta el repo, y resuelve
   `sellerVerified: seller?.verified ?? null` en el objeto devuelto — mismo criterio que
   `internalRole` (no va en el claim firmado del JWT, se resuelve fresco en cada request).
4. **Nuevo `GET /sellers/me`** en `SellerController` (usa `req.user.userId` +
   `sellerService.findByUserId`, ya existe) — devuelve `{ message, record }` con el perfil
   completo del seller autenticado; 404 si `role === 'seller'` pero no tiene perfil `Seller`.
5. **Nuevo `SellerVerifiedGuard`** (`common/guards/seller-verified.guard.ts`): si
   `req.user.role === 'seller'` y `req.user.sellerVerified !== true`, lanza `403 ForbiddenException`.
   Aplícalo con `@UseGuards(SellerVerifiedGuard)` solo en `POST /vehicles` (`VehicleController.create`).
   No toca login, lecturas, ni otros endpoints.
6. **Para @db**: agregar `UNIQUE` (idealmente partial, `WHERE tax_id IS NOT NULL`) en
   `sellers.tax_id`, y verificar/agregar `UNIQUE(user_id)` en `sellers` — ambas invariantes hoy no
   están garantizadas a nivel de constraint y el código nuevo las asume.
