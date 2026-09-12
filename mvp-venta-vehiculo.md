# Segunda — Regla de negocio: marcar vehículo como "vendido" (delta sobre `mvp-refinamiento-mvp1.md`)

> Responde a un hallazgo técnico de @qa sobre `AppointmentService.cancelBySale(vehicleId)`:
> el método cancela la cita activa y notifica alternativas, pero **no cambia el `status_id` del
> vehículo** (no llama a `VehicleService.archiveBySale` ni `releaseFromAppointment`). Verificado en
> código: `VehicleService.update()` (detrás de `PATCH /vehicles/:id`) permite cambiar `statusId`
> directamente vía DTO **sin disparar ninguna orquestación** — ni `cancelBySale` si hay cita activa,
> ni ningún otro efecto secundario. Esto puede dejar un vehículo "fantasma": bloqueado como
> `active_appointment` para siempre si la venta se registra sin pasar por el flujo correcto.
>
> Esta regla ya estaba **parcialmente decidida** en `mvp-refinamiento-mvp1.md` (3.2: "agendada →
> seller marca vehículo vendido → cancelada_por_venta"; y sección IN: "archivado si se marca
> 'vendido'"), pero faltaba la precisión operativa de **quién orquesta qué y en qué orden**. Este
> documento cierra ese vacío.

---

## 1. Decisión de negocio (respuestas directas a @qa)

### 1.1 ¿Cuál es el flujo real esperado cuando un seller marca un vehículo como "vendido"?
Es una acción explícita del seller en su dashboard de inventario: cambia el estado del vehículo a
`vendido` (hoy expuesto genéricamente como `PATCH /vehicles/:id` con `statusId`). **Ese es el único
punto de entrada al flujo de venta** — no existe hoy, ni se propone crear, un endpoint distinto
"marcar como vendido". Confirmado: **sí**, cambiar el status a `vendido`/`sold` es el evento que
debe disparar, en una sola operación atómica (misma transacción o al menos mismo request
lógico/orquestado):
1. Verificar si el vehículo tiene una cita `agendada` activa.
2. Si la tiene: cancelarla (`cancelada_por_venta`) + notificar al customer con alternativas.
3. Cambiar el `status_id` del vehículo a `vendido`/archivado.

### 1.2 ¿Quién es responsable de invocar `cancelBySale`?
**`VehicleService` es el orquestador**, no `AppointmentService`. La regla de dependencia debe ser:
- `VehicleService`, cuando detecta que un `update()` cambia el status a `vendido` (o expone un
  método explícito `markAsSold(vehicleId)` en vez de aceptar `statusId` genérico — ver nota a
  @architect en sección 3), es quien:
  1. Pregunta/usa a `AppointmentService` si hay una cita activa sobre ese vehículo.
  2. Si existe, invoca `AppointmentService.cancelBySale(vehicleId)` (cancela cita + notifica).
  3. Y **solo entonces** (o en paralelo, pero garantizado en la misma operación) aplica
     `archiveBySale(vehicleId)` sobre sí mismo para dejar el vehículo en estado `vendido`.
- Esto es consistente con el comentario ya existente en el código
  (`appointment.service.ts:217`: *"Invocado por `vehicles` cuando el seller marca el vehículo
  vendido"*) — la intención original del diseño ya apuntaba a que `vehicles` orquesta. Lo que falta
  es que `VehicleService` **realmente llame** a `cancelBySale` y a `archiveBySale` en el mismo flujo,
  cosa que hoy no ocurre.
- **Confirmado explícitamente:** NO debe ser al revés (no debe existir un endpoint en `scheduling`
  que el seller golpee para "vender el vehículo"). El seller solo interactúa con `vehicles`
  (inventario); `scheduling` es un efecto secundario invisible para el seller en ese momento.

### 1.3 ¿Qué estado final debe quedar el vehículo tras una venta con cita activa cancelada?
**Confirmado: `vendido`/archivado**, no `disponible`. Razones de negocio:
- Es el mismo comportamiento ya documentado en `mvp-refinamiento-mvp1.md` sección IN
  ("archivado si se marca 'vendido'") y en la máquina de estados 3.2 — no es una regla nueva, es
  cerrar la implementación de una regla ya aprobada.
- Un vehículo `vendido` no debe reaparecer como agendable ni visible en catálogo (ver 3.3 de
  `mvp-refinamiento-mvp1.md`: la visibilidad en catálogo aplica a vehículos activos; `vendido` es
  un estado terminal de salida del catálogo, distinto de `active_appointment`/`available`).
- **Caso "el customer se retracta y el seller quiere reactivarlo":** esto NO es un flujo del MVP.
  Si el seller marcó el vehículo como vendido y luego la venta no se concreta (se cae el negocio),
  el flujo correcto es que el seller **publique el vehículo de nuevo** (o lo edite manualmente de
  vuelta a `disponible` desde su dashboard, acción explícita y consciente), no que el sistema
  "adivine" una reactivación automática por una cita cancelada. La reactivación automática **sí
  existe** en el sistema, pero está reservada para el caso ya definido: cita con resultado
  `no_se_presento` (sección 3.2 de `mvp-refinamiento-mvp1.md`), un escenario distinto y no
  relacionado con venta.

### 1.4 ¿Aplica esta misma regla si NO hay cita activa (venta directa sin agendamiento previo)?
**Confirmado: sí, es el mismo `PATCH /vehicles/:id` (o el método explícito recomendado, ver 3),
sin importar si hay o no cita activa.** La diferencia es únicamente si internamente se dispara o no
el paso de cancelación:
- Con cita activa: pasos 1-2-3 de la sección 1.1 completos.
- Sin cita activa: se omite el paso de cancelar/notificar (no hay nada que cancelar), pero el
  vehículo **igual debe terminar en estado `vendido`**. `VehicleService` debe verificar la
  existencia de cita activa (`isBlocked`/`active_appointment`) como una condición, no asumir que
  siempre hay una.

---

## 2. Historias de usuario y criterios de aceptación

### HU-VTA-01 (P0) — Marcar vehículo vendido sin cita activa
Como seller, quiero marcar un vehículo como vendido cuando no tiene ninguna cita agendada, para que
desaparezca del catálogo público y de mi inventario disponible.

- **Given** un vehículo en estado `disponible` (sin cita activa),
  **When** el seller lo marca como `vendido`,
  **Then** el vehículo queda con `status = vendido`, deja de aparecer en el catálogo público y no
  puede recibir nuevos agendamientos.
- **Given** el vehículo se marcó como `vendido`,
  **Then** se registra el evento de negocio `vehicle_archived` (ya definido en
  `mvp-refinamiento-mvp1.md` sección 3.9/6).

### HU-VTA-02 (P0) — Marcar vehículo vendido con cita activa (cancelación en cascada)
Como seller, quiero marcar un vehículo como vendido aunque tenga una cita agendada pendiente, para
que el sistema cancele automáticamente esa cita, notifique al customer con alternativas, y el
vehículo quede correctamente archivado — sin quedar en un estado inconsistente.

- **Given** un vehículo en estado `active_appointment` (con una cita `agendada`),
  **When** el seller lo marca como `vendido`,
  **Then**, en la misma operación:
  1. la cita pasa a estado `cancelada_por_venta`,
  2. se notifica al customer de esa cita con hasta N vehículos alternativos del mismo seller
     (regla ya definida, `n_alternative_vehicles` default 3),
  3. el vehículo queda con `status = vendido` (nunca en `active_appointment` ni en `disponible`
     de forma transitoria/indefinida).
- **Given** el paso 1 (cancelar cita) falla por cualquier razón,
  **Then** el cambio de estado del vehículo a `vendido` **no debe confirmarse tampoco** — no puede
  quedar una cita activa sobre un vehículo ya vendido. (Detalle transaccional a definir con
  @architect, pero la regla de negocio es: **todo o nada**, nunca un estado a medias.)
- **Given** el vehículo ya fue marcado como `vendido` exitosamente,
  **Then** no puede volver a agendarse ninguna cita sobre él bajo ninguna circunstancia, salvo que
  el seller lo reactive explícitamente como un vehículo "nuevo" (fuera de alcance de esta regla,
  ver 1.3).

### HU-VTA-03 (P1) — Prevenir vehículo "fantasma" (regresión/QA)
Como sistema, quiero garantizar que ningún vehículo quede en `active_appointment` sin una cita
`agendada` real asociada, para evitar bloqueos indefinidos que ni el seller ni el customer puedan
resolver.

- **Given** cualquier vehículo con `status = active_appointment`,
  **Then** debe existir siempre exactamente una cita en estado `agendada` apuntando a ese
  `vehicle_id` (invariante de integridad, útil como chequeo de QA/monitoreo, no necesariamente una
  constraint de BD — a definir con @architect/@db).
- Nota para @qa: este es el caso de prueba de regresión específico que originó este documento —
  validar explícitamente que marcar un vehículo vendido con cita activa deja el vehículo en
  `vendido` y no en `active_appointment`.

---

## 3. Nota para @architect (no es decisión de negocio, es una recomendación de diseño)

Como PO recomiendo que `VehicleService` **no** siga aceptando `statusId` arbitrario vía
`PATCH /vehicles/:id` para representar la transición a "vendido" (eso es lo que hoy permite que se
cambie el estado sin pasar por la orquestación). Sugiero un método/endpoint explícito tipo
`markAsSold(vehicleId)` o `PATCH /vehicles/:id/sell` que internamente contenga los 3 pasos de la
sección 1.1, y que el `statusId` genérico del DTO de update quede reservado para otras transiciones
que no tengan efectos secundarios de negocio (o se restrinja/valide explícitamente para bloquear el
paso a `vendido` por esa vía). Esto es una decisión técnica de ustedes, no la impongo — solo señalo
que la ambigüedad reportada por @qa nace de que el status se puede mutar por un camino genérico que
no conoce las reglas de negocio del dominio `scheduling`.

---

## 4. Preguntas abiertas (ninguna bloqueante, pero conviene resolver antes de implementar)

1. **Transaccionalidad cross-schema:** `vehicles` y `scheduling` son schemas distintos en la misma
   base de datos. ¿La cancelación de cita + archivado de vehículo debe ser una transacción de BD
   real (mismo `QueryRunner`), o alcanza con una orquestación a nivel de servicio con manejo de
   error/rollback manual? Es pregunta técnica para @architect, la regla de negocio (sección
   HU-VTA-02) es clara: no puede quedar un estado a medias.
2. **¿Debe el seller ver alguna confirmación/advertencia en el dashboard** ("este vehículo tiene una
   cita agendada para el [fecha] con [customer] — al marcarlo como vendido se cancelará
   automáticamente y se notificará al cliente") antes de confirmar la venta, o el archivado +
   cancelación debe ser silencioso desde la perspectiva del seller (solo ve el resultado final)?
   Esto es una decisión de UX que no estaba en el alcance original — la marco para que founder/UX
   la resuelva, no bloquea el backend.
</content>
