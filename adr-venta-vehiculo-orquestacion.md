# ADR — Orquestación técnica: marcar vehículo como vendido

> Responde a `mvp-venta-vehiculo.md` (@po). La regla de negocio está cerrada; este documento
> decide el **cómo** técnico: endpoint, dueño de la orquestación, atomicidad cross-schema, y qué
> hacer con la puerta trasera de `PATCH /vehicles/:id`.

Contexto de código verificado:
- `VehicleService.update()` hoy muta `status_id` libremente vía DTO, sin disparar nada.
- `AppointmentService` (scheduling) **ya depende** de `VehicleService` (`getSchedulingSummary`,
  `releaseFromAppointment`, `suggestAlternatives`, `blockForAppointment`). `SchedulingModule`
  importa `VehiclesModule`. **`VehiclesModule` no importa `SchedulingModule`.**
- `createAppointment` ya usa el patrón `queryRunner` de un único `DataSource` para escribir
  `Appointment` + `Vehicle.status_id` en la misma transacción física (aunque ambas tablas viven en
  schemas distintos, es la misma base Postgres → mismo `DataSource`/conexión → transacción real
  válida).
- `cancelBySale` existe pero: (a) no es transaccional con el update del vehículo, (b) hoy nadie lo
  invoca.

---

## 1. Endpoint

**Decisión: nuevo `PATCH /vehicles/:id/sell`, sin body (o `{}` opcional para futuro).**

Rechazo mantener la venta dentro de `PATCH /vehicles/:id` genérico con detección de "¿el nuevo
`statusId` es `sold`?" — es exactamente el patrón que causó el bug (una transición con efectos de
negocio disfrazada de mutación de campo genérica). Un endpoint explícito:
- Hace visible en el contrato de API que "vender" es una operación de dominio, no un patch de
  atributo.
- Permite responder con información útil (`{ message, record, cancelledAppointment: boolean }`)
  sin sobrecargar la respuesta genérica de `update`.
- Es coherente con la recomendación que ya dejó @po en su documento (sección 3).

Trade-off aceptado: un endpoint más en el controller. Costo bajo, beneficio alto (elimina la
ambigüedad de raíz).

## 2. Dónde vive la orquestación

**Decisión: nuevo módulo delgado `backend/src/contexts/vehicle-sales/` (fuera de `vehicles/` y
`scheduling/`), con un único `VehicleSaleService` + `VehicleSaleController`.**

Por qué no en `VehicleService` directamente: haría que `vehicles` dependa de `scheduling`
(`AppointmentService`/`Appointment` entity), pero `scheduling` ya depende de `vehicles`. Eso es
una dependencia circular real a nivel de `Module` (`VehiclesModule` ↔ `SchedulingModule`), no solo
de imports de TS. Es resoluble con `forwardRef()`, pero es un parche que documenta deuda, no una
inversión de dependencia — y el propio `docs-arquitectura-mes1-scheduling.md` ya estableció que
`vehicles` debe ser el contexto "aguas abajo" (no conoce `scheduling`), contrato que hay que
preservar.

Por qué no en `AppointmentService`: mismo problema invertido, y además el endpoint HTTP debe vivir
bajo `/vehicles/:id/sell` — no tiene sentido que el controlador de scheduling exponga rutas de
vehicles.

**Solución: un tercer módulo orquestador que importa a ambos (`VehiclesModule` y
`SchedulingModule`), sin que ninguno de los dos se entere del otro más de lo que ya se conocen
hoy.** Ninguno de los dos módulos existentes cambia su grafo de imports. `VehicleSaleService` solo
consume las APIs públicas ya exportadas: `VehicleService` (de `vehicles`) y `AppointmentService` (de
`scheduling`).

```
backend/src/contexts/vehicle-sales/
  vehicle-sales.module.ts     # imports: VehiclesModule, SchedulingModule
  vehicle-sale.service.ts     # orquestación transaccional
  vehicle-sale.controller.ts  # @Controller('vehicles')  PATCH :id/sell
```

Registrar `VehicleSalesModule` en `app.module.ts` junto a los demás.

## 3. Atomicidad cross-schema

**Decisión: transacción real con `queryRunner` compartido, mismo patrón que `createAppointment`.**
Justificación: mismo Postgres, mismo `DataSource`, el costo de una transacción real es cero extra
(no hay dos conexiones/servicios remotos) y la regla de negocio (HU-VTA-02) es explícita: "todo o
nada". Un patrón de compensación manual (outbox, saga) es sobre-ingeniería para un monolito de un
solo proceso/una sola base — se reserva para cuando `scheduling` o `vehicles` sean servicios
separados de verdad.

**Qué entra en la transacción (solo escritura de datos, sin I/O externo):**
1. `SELECT` vehículo (lock implícito vía `UPDATE` posterior) y su status actual.
2. Si ya está `sold` → `ConflictException` (idempotencia: evita doble-venta).
3. `SELECT` cita con `status = 'agendada'` para ese `vehicle_id` (repo de `Appointment` vía
   `queryRunner.manager`, igual que hace `createAppointment` con `Vehicle`/`Status`).
4. Si existe: `UPDATE appointment SET status = 'cancelada_por_venta'`.
5. `UPDATE vehicle SET status_id = <id de 'sold'>`.
6. `commitTransaction()`.

**Qué queda fuera de la transacción (side effects, best-effort, después del commit):**
- Notificar al buyer con alternativas (`suggestAlternatives` + `notificationsService.notify`).
- `businessEvents.record('vehicle_archived', ...)` y, si aplicó,
  `businessEvents.record('appointment_cancelled_by_sale', ...)`.

Esto es consistente con `createAppointment`, que también notifica y registra el evento de negocio
**después** de cerrar la transacción — no se rompe ningún patrón nuevo.

**Refactor mínimo requerido en `AppointmentService` (para no duplicar lógica de negocio):**
Partir `cancelBySale` en dos piezas reusables:
- `findActiveAppointmentByVehicle(vehicleId)` → lectura simple, usable dentro o fuera de tx.
- `notifyCancelledBySale(appointment)` → arma alternativas + notifica + registra evento (se llama
  **después** del commit, recibiendo la cita ya releída).

`cancelBySale(vehicleId)` puede quedar como wrapper de conveniencia (no transaccional) para otros
llamadores futuros, pero **no debe ser el método que use `VehicleSaleService`** para el UPDATE en
sí — ese UPDATE debe ejecutarse con el repo del `queryRunner`, no con `this.appointmentRepo` del
`AppointmentService` (que abriría su propia conexión fuera de la transacción del orquestador).

## 4. Impacto en `PATCH /vehicles/:id` existente

**Decisión: sí, bloquear.** `VehicleService.update()` debe rechazar (`400 BadRequestException` o
`409 ConflictException` — recomiendo `400`, es un input inválido, no un conflicto de estado
concurrente) cualquier intento de setear `statusId` que resuelva al código `sold` vía esta ruta
genérica. Mensaje explícito: *"Use PATCH /vehicles/:id/sell para marcar un vehículo como vendido"*.

Esto cierra exactamente la puerta trasera que originó el bug reportado por @qa. El resto de
transiciones de `statusId` sin efectos de negocio (si las hay) siguen permitidas por esta vía.

Implementación: en `update()`, antes de armar `updateData`, si `dto.statusId !== undefined`,
resolver el `str_code` del status destino (`statusRepo.findOneBy({ id: dto.statusId })`) y
rechazar si es `'sold'`.

## 5. Contrato de API

```
PATCH /vehicles/:id/sell
Auth: JwtAuthGuard (seller dueño del vehículo, o rol interno admin — reusar lógica similar a
      assertCanManagePhotos)
Body: (vacío o { } — sin campos requeridos)

200 OK
{
  "message": "Vehículo marcado como vendido",
  "record": { ...vehicle con relations, status = 'sold' },
  "cancelledAppointment": true | false
}

409 Conflict  → vehículo ya estaba 'sold'
403 Forbidden → usuario no es el seller dueño ni admin
404 Not Found → vehículo no existe
```

## 6. Impacto en schemas (para @db)

Ninguno nuevo. No se agregan columnas ni tablas — se reutilizan `vehicles.vehicles.status_id`
(catálogo ya existente, código `sold`) y `scheduling.appointments.status`
(`'cancelada_por_venta'` ya es un valor de status contemplado en el diseño original, verificar que
el `enum`/`check constraint` de `appointments.status` en BD ya lo incluya — si no está, es el único
ajuste de schema necesario: agregar `'cancelada_por_venta'` al check constraint o enum de
`scheduling.appointments.status`).

---

## Resumen ejecutivo para @developer

1. Crear módulo nuevo `backend/src/contexts/vehicle-sales/` con `VehicleSaleService` +
   `VehicleSaleController` (`@Controller('vehicles')`, ruta `PATCH :id/sell`). Importa
   `VehiclesModule` y `SchedulingModule` (ambos ya exportan lo necesario) — **no** toques los
   imports de `vehicles.module.ts` ni `scheduling.module.ts`, así evitas dependencia circular.
2. `VehicleSaleService.markAsSold(vehicleId, userId, internalRole)` valida permisos (dueño/admin),
   abre `queryRunner.startTransaction()` sobre el `DataSource` compartido, y dentro de la
   transacción: valida que el vehículo no esté ya `sold`, busca cita `agendada` para ese
   `vehicle_id`, si existe la pasa a `cancelada_por_venta`, y setea `status_id = sold` en el
   vehículo. Todo con repos de `queryRunner.manager` (mismo patrón que `createAppointment` en
   `appointment.service.ts:89-162`). Commit o rollback total.
3. Después del commit (best-effort, no bloquea la respuesta): si había cita cancelada, llamar a
   notificación de alternativas + registrar evento `appointment_cancelled_by_sale`; siempre
   registrar `vehicle_archived`. Para esto, refactoriza `AppointmentService.cancelBySale` en dos
   métodos reutilizables (`findActiveAppointmentByVehicle` + `notifyCancelledBySale`) en vez de
   duplicar la lógica de notificación.
4. En `VehicleService.update()` (`vehicle.service.ts:126`), agrega validación: si `dto.statusId`
   resuelve al `str_code` `'sold'`, lanza `BadRequestException` indicando que se debe usar
   `PATCH /vehicles/:id/sell`. Esto cierra la puerta trasera que causó el bug.
5. Registrar `VehicleSalesModule` en `app.module.ts`.
6. Para @db: verificar que el check constraint/enum de `scheduling.appointments.status` ya incluya
   `'cancelada_por_venta'`; si no, es el único cambio de schema requerido (no hay columnas nuevas).
