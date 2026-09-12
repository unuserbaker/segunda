# Segunda — Refinamiento MVP 1 (Lanzamiento comercial: enero)

> Complementa a `mvp.md` (idea original de negocio). Este documento es la versión consolidada
> del refinamiento hecho con @po entre el 11 de septiembre y hoy. Es la fuente de verdad de
> alcance de negocio para el MVP que se lanza comercialmente en enero.

## 1. Alcance MVP (enero) — IN / OUT

### IN
- Landing pública: catálogo completo de vehículos, filtros (marca, precio, tipo), ubicación del seller.
- Vehículo **siempre visible** en catálogo, incluso con cita activa (nunca desaparece).
- Registro obligatorio del customer para agendar (cuenta persistente, no formulario anónimo).
- Verificación de email del customer: no bloquea registro/exploración, **sí bloquea la acción de agendar**.
- Agendamiento de visita con bloqueo: 1 cita activa a la vez por vehículo (bloquea la ACCIÓN de agendar, no la visibilidad).
- Badge de estado visual en el vehículo cuando tiene cita activa (ej. "Próxima visita agendada").
- Regla "1 sola cita activa por customer" a la vez (evita reservas especulativas múltiples).
- Notificación por email al confirmar cita (customer + seller).
- Recordatorios pre-cita por email (24h y 2h antes).
- RSVP de confirmación previa: si el customer no confirma asistencia, el slot se libera automáticamente **4 horas antes de la cita** (default configurable desde base de datos, no hardcodeado).
- Cancelación automática de la cita si el seller marca el vehículo como vendido antes de la cita + notificación al customer con vehículos alternativos del mismo seller (mismo `seller_id`, mismo tipo/categoría si hay match, si no los N más recientes).
- Cierre de ciclo de la cita — máquina de estados con fuente de verdad clara:
  - El **seller es autoritativo y obligatorio**: marca "Atendido" / "No se presentó" en su dashboard.
  - El customer recibe (post-cita, ~2h después) un email con links de un solo clic ("Sí asistí" / "No pude ir"), sin login, opcional, ventana de respuesta de 72h.
  - Si hay discrepancia entre seller y customer, prevalece el seller; se etiqueta `disputada` internamente (solo registro, no resolución automática — Fase 2).
- Calificación mutua mínima (1-5 estrellas, solo numérica, sin comentario de texto en fase 1): customer califica al seller y seller califica al customer al cerrar el ciclo de la cita. Se asocia la numeración a un texto corto (ej. 1=Muy mala, 5=Excelente). Se almacena el dato desde el día 1, pero **no se calcula ni se muestra score agregado** todavía.
- Dashboard seller: CRUD de inventario (ya existe), gestión de agendas, marcar resultado de cita.
- Reporte simple de agendamientos por seller (conteo por estado).
- Reactivación automática del vehículo si la cita se resuelve como "no asistió"/"no se presentó"; archivado si se marca "vendido".
- Tracking de eventos: `vehicle_published`, `visit_scheduled`, `visit_result_recorded`, `vehicle_reactivated`/`vehicle_archived`, `rating_submitted`.
- Solo Bogotá.

### OUT (Fase 2 / explícitamente fuera de enero)
- Validación de identidad documental (customer/seller).
- Gestión de usuarios internos/roles por seller (un solo login por concesionaria en MVP).
- Canal de PQR para clientes.
- Reportes empresariales multi-módulo (BI).
- Feedback post-venta vía llamada telefónica — proceso manual del equipo, sin UI dedicada.
- Cálculo y visualización de score de reputación agregado (seller/customer) — solo se captura el dato crudo en MVP.
- Resolución formal de disputas de asistencia (flujo, soporte) — en MVP solo se etiqueta `disputada`.
- Comentarios de texto libre en calificaciones (solo número + texto asociado en fase 1).
- Sistema de recomendación de vehículos por especificaciones/preferencias del usuario (matching/ML) — depende de volumen de datos que no existirá hasta después del piloto.
- Gamificación/incentivos económicos anti no-show (evaluar con datos reales del piloto).
- Recordatorio/confirmación por WhatsApp o SMS — arranca solo por email; WhatsApp queda diseñado para poder "encenderse" después evaluando costos de proveedor (Twilio/WhatsApp Business API), pero no se construye en el MVP.
- Cobro/facturación automatizada dentro del sistema (el cobro real es manual/fuera de sistema).
- Expansión a otras ciudades.
- Campaña publicitaria / growth (fuera del alcance de ingeniería).

## 2. Historias de usuario clave (resumen)

Ver detalle completo de criterios de aceptación en las sesiones de refinamiento con @po. Resumen:

- **HU-01** Publicar vehículo (seller).
- **HU-02** Registro obligatorio + agendar visita (customer), con verificación de email bloqueando solo la acción de agendar.
- **HU-03** Bloqueo de la acción de agendar (no de visibilidad) + badge de estado del vehículo.
- **HU-04** Notificación de agendamiento (confirmación a customer + seller).
- **HU-05** Registrar resultado de la cita (seller, autoritativo) + reporte opcional de asistencia del customer (link de un clic).
- **HU-06** Reporte de agendamientos por seller.
- **HU-07** Cancelación de cita por venta del vehículo + notificación con vehículos alternativos del mismo seller.
- **HU-08** Calificación mutua 1-5 estrellas al cierre del ciclo de la cita (captura de dato, sin score visible).

## 3. Reglas de negocio clave

### 3.1 Definición de "agendamiento exitoso"
Se mide en dos eventos separados y no se mezclan:
- **Visita concretada (asistida):** cita cuyo estado final es "Atendido" según el seller (fuente de verdad).
- **Venta concretada:** vehículo marcado como "vendido" por el seller.

### 3.2 Máquina de estados de la cita
`agendada` → (RSVP no confirmado 4h antes) → `liberada` (vehículo vuelve a disponible)
`agendada` → (seller marca vehículo vendido) → `cancelada_por_venta` (notif. + alternativas del mismo seller)
`agendada` → (pasa la fecha) → seller marca `atendido` | `no_se_presento` (autoritativo)
                              → customer opcionalmente marca "sí asistí" | "no pude ir" (72h de ventana)
                              → si hay discrepancia seller/customer: prevalece seller, se etiqueta `disputada` (solo registro)

### 3.3 Visibilidad vs. bloqueo
El vehículo **siempre es visible** en catálogo. El bloqueo aplica únicamente sobre la **acción de agendar** una nueva visita mientras exista una cita activa. Se comunica con un badge visual (ej. "Próxima visita agendada").

### 3.4 Diferenciación "sin inventario" vs. "con inventario" (concesionarias)
No hay diferencia funcional en el MVP — mismo flujo de "publicar vehículo" para ambas. Es solo mensaje de marketing/onboarding.

### 3.5 Verificación de email del customer
No bloquea registro ni exploración del catálogo. Bloquea únicamente la confirmación de un agendamiento.

### 3.6 Ventana de liberación de slot sin RSVP
Default: **4 horas antes de la cita**, configurable desde base de datos (no hardcodeado en lógica de negocio).

### 3.7 Canal de confirmación de asistencia y recordatorios
Arranca **solo por email** en el MVP. Se deja diseñado (no implementado) para poder añadir WhatsApp/SMS más adelante evaluando costo de proveedor — debe poder "encenderse/apagarse" por canal sin rediseñar el flujo.

### 3.8 Calificación mutua
Solo numérica (1-5), asociada a un texto corto por nivel. Sin comentarios de texto libre en fase 1 (posible expansión futura). Sin cálculo de score ni visualización en el MVP — solo se captura y almacena el dato desde el día 1.

### 3.9 Monetización (modelo para el lanzamiento de enero)
- **Modelo:** cobro **por agenda asistida** (no por agenda creada, no por venta concretada). El negocio de Segunda es generar agendas de compradores potenciales calificados; la venta la cierra el seller.
- **Monto:** $1.000 COP por agenda asistida (definitivo para el lanzamiento; revisar en 2-3 meses con datos reales, rango de referencia $1.000–$5.000 COP).
- **Cobro:** manual/fuera de sistema en el MVP (el sistema solo trackea los eventos necesarios para facturar).
- **Periodo gratuito:** piloto corto de 2-3 concesionarias (3-4 semanas, diciembre), NO 6 meses generalizado. Adicionalmente, 1 mes gratis de bienvenida para cualquier concesionario nuevo que se sume durante el mes de lanzamiento comercial (enero).
- **Eventos a trackear:** `vehicle_published`, `visit_scheduled`, `visit_result_recorded` (con distinción asistió/no asistió y vendido/no vendido), `vehicle_reactivated`/`vehicle_archived`, `rating_submitted`.

## 4. Backlog priorizado (MoSCoW) — resumen

**Must Have (bloquean lanzamiento enero):**
- Context `scheduling`: modelo de cita + máquina de estados + bloqueo de la acción de agendar.
- Extensión de `iam` (o context nuevo) para identidad mínima de customer: registro + verificación de email.
- Badge de estado del vehículo (backend: estado derivado; frontend: catálogo/ficha).
- Reactivación/archivado automático de vehículo según resultado de cita.
- Cancelación automática de cita por venta + notificación con alternativas del mismo seller.
- Reporte de asistencia del seller (obligatorio, autoritativo) + link de un clic para el customer (opcional).
- Landing pública: listado, filtros, ubicación, ficha, formulario de agendamiento.
- Dashboard seller: gestión de agendas, marcar resultado de cita.
- Notificaciones por email: confirmación, recordatorios (24h/2h), cierre de ciclo con calificación.
- RSVP con liberación automática de slot (default 4h, configurable en BD).
- Regla "1 sola cita activa por customer".
- Reporte simple de agendamientos por seller.
- Conectar frontend real (`main_client`) al backend nuevo (hoy apunta a legacy vía gateway) — deuda técnica crítica, prerequisito de todo lo demás.
- Tracking de eventos de negocio (sección 3.9).
- Captura de calificación 1-5 estrellas (sin score ni visualización).

**Should Have:**
- Export CSV del reporte de agendamientos.
- Alertas visuales de citas "pendientes de resolución".
- Bloque de vehículos alternativos en notificación de cancelación por venta.
- Etiquetado de `disputada` cuando seller y customer no coinciden.
- Copy de onboarding diferenciado "sin inventario / con inventario" (solo marketing).

**Could Have:**
- Recordatorio/confirmación por WhatsApp o SMS (evaluar costo de proveedor).
- Registro manual simple de feedback post-venta dentro del dashboard.

**Won't Have (fuera de enero, confirmado):**
- Validación de identidad documental.
- Gestión de usuarios internos/roles por seller.
- Canal de PQR.
- Reportes empresariales multi-módulo.
- Cálculo/visualización de score de reputación.
- Resolución formal de disputas.
- Comentarios de texto en calificaciones.
- Sistema de recomendación de vehículos (matching/ML).
- Gamificación anti no-show.
- Cobro/facturación automatizada en sistema.
- Expansión a otras ciudades.
- Campaña publicitaria.

## 5. Cronograma de 4 meses (11 sept → enero)

**Punto de partida real:** `iam` y `vehicles` implementados en `backend/`; `sellers`/`scheduling`/`files` son solo scaffolds; `main_client` sigue apuntando al legacy `vehicles_service` vía `gateway_service`.

### Mes 1 (11 sept – 11 oct): Fundamentos
- Modelo de datos completo de `scheduling` (cita, máquina de estados, bloqueo) y `sellers`.
- Extensión de `iam` para identidad de customer (registro, verificación de email).
- Implementar context `scheduling` (crear cita, bloqueo de acción de agendar, resultado de cita, reactivación/archivado).
- **Hito:** flujo backend completo publicar→agendar→bloquear→resultado→reactivar probado sin frontend.

### Mes 2 (11 oct – 11 nov): Frontend real + landing + cierre de ciclo
- Migrar `main_client` para apuntar al backend nuevo, retirando el gateway para lo migrado.
- Landing pública (listado, filtros, ubicación, ficha, agendamiento) y dashboard seller (agendas).
- Badge de estado del vehículo (backend + frontend).
- Máquina de estados de cierre de cita: reporte obligatorio del seller + link de un clic del customer + estado `disputada`.
- **Hito:** congelamiento de alcance MVP — desde aquí solo se pule lo definido en la sección 1 (IN).

### Mes 3 (11 nov – 11 dic): Notificaciones, monetización, reportes, hardening
- Notificaciones por email: confirmación, recordatorios (24h/2h), RSVP con liberación automática (4h default), cierre de ciclo.
- Bloque de vehículos alternativos en cancelación por venta.
- Captura de calificación 1-5 estrellas.
- Tracking de eventos de negocio (sección 3.9).
- Reporte de agendamientos por seller.
- QA end-to-end, hardening, preparación de entorno de producción.
- **Hito:** sistema funcional end-to-end en staging, sin bugs críticos, checklist de QA incluye las 6 combinaciones de la máquina de estados de asistencia.

### Mes 4 (11 dic – 11 ene): Piloto y lanzamiento
- Semana 1-2 (11-24 dic): piloto cerrado con 2-3 concesionarias reales en Bogotá (gratis), acompañamiento manual.
- Semana 3 (25-31 dic): buffer de ajustes post-piloto (menor disponibilidad por fin de año).
- Semana 4 (1-11 ene): lanzamiento comercial. Onboarding de concesionarias nuevas con 1 mes gratis de bienvenida; cobro por agenda asistida ($1.000 COP) desde el lanzamiento.

## 6. Parámetros de negocio configurables (no hardcodear)

- Ventana de liberación de slot sin RSVP: default 4 horas.
- Ventana de respuesta del customer al link de asistencia: default 72 horas.
- Monto de cobro por agenda asistida: default $1.000 COP.
- N vehículos alternativos sugeridos en notificación de cancelación por venta: default 3.
- Canales de notificación activos (email habilitado; WhatsApp/SMS diseñado para poder activarse después).

## 7. Preguntas abiertas restantes

Ninguna crítica pendiente de bloqueo de negocio. Quedan como decisiones de detalle a resolver durante diseño técnico (@architect/@db):
- Naming final del badge de estado del vehículo (aprobado en concepto, texto exacto pendiente de UX).
- Estructura técnica exacta de la verificación de email (token, expiración) — detalle de implementación.
- Estructura técnica del "link de un clic" (firma de token, expiración 72h) — detalle de implementación.
