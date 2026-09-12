# Segunda — Pipeline comercial de prospección de Sellers (delta sobre `mvp-usuarios-internos.md`)

> Este documento responde a input directo del founder que **expande** el alcance de "gestión de
> sellers" del asesor (definido de forma simplificada en `mvp-usuarios-internos.md` HU-INT-03/04)
> y **resuelve un malentendido** sobre qué significa "verificar" un seller. Complementa, no
> reemplaza, `mvp.md`, `mvp-refinamiento-mvp1.md` y `mvp-usuarios-internos.md`.
>
> **Confirmado con el founder (input textual, ver contexto de la tarea):** el flujo real de
> alta de un seller NO es self-service. Es un proceso comercial manual: el asesor tiene una base
> de datos de concesionarias candidatas, las contacta (llamada/outreach), ofrece el servicio, y
> solo si aceptan se inicia el proceso de contrato/accesos. Esto es distinto de lo que el diseño
> técnico había asumido implícitamente (`GET /sellers` + `PATCH /sellers/:id/verify` sobre un
> seller que ya existe en el sistema).

---

## 0. Resumen ejecutivo (para @architect/@db)

1. Existe una entidad nueva, **previa** al `Seller` actual: el **Prospecto** (lead comercial). No
   tiene `user_id`, no puede loguearse, no publica vehículos. Es simplemente un registro de
   seguimiento comercial gestionado por el asesor.
2. Un prospecto **se convierte** en `Seller` real (con `user_id`, acceso al dashboard) solo cuando
   acepta el proceso comercial y se completa el contrato/accesos. Ahí, y solo ahí, entra al mundo
   ya diseñado en `mvp-refinamiento-mvp1.md`/`mvp-usuarios-internos.md`.
3. **"Verificado" y "modo de participación" son DOS EJES DISTINTOS** que no deben confundirse (ver
   sección 3). Se confirma con el founder que el segundo (`inventory_only` vs `full_marketplace`)
   es una idea válida y real, pero se recomienda **Fase 2**, no MVP enero (ver justificación).
4. **Recomendación de PO sobre el pipeline de prospección:** dado el cronograma de 4 meses ya
   ajustado y que hay **1 solo asesor**, el pipeline de prospectos **NO debe construirse como
   feature de software para enero**. Se recomienda una hoja de cálculo compartida (Google Sheets)
   para el piloto, con un camino claro de migración a software en Fase 2 si el volumen lo
   justifica. Ver sección 6 para el detalle de esta decisión y sus condiciones de revisión.

---

## 1. Pipeline comercial de prospección: estados y flujo

### 1.1 Entidad `Prospecto` (lead comercial, fuera de `iam`/`sellers` en el MVP)

No es una entidad de software en el MVP (ver sección 6), pero se formaliza su estructura de datos
para que la hoja de cálculo tenga un formato consistente y la migración futura a software sea
directa:

**Datos capturados en la etapa de prospección (antes de cualquier contacto):**
- Razón social
- Nombre de contacto
- Email
- Teléfono
- Dirección
- Fuente del lead (ej. "búsqueda propia", "referido", "llegó por landing/campaña" — relevante para
  medir de dónde salen los mejores prospectos, aunque el análisis de esto es Fase 2)

**Datos que se agregan durante la gestión (a medida que el asesor avanza el pipeline):**
- Fecha de primer contacto
- Resultado del contacto (interesado / no interesado / no contactable)
- Si "no interesado": razón (texto libre) + preferencia de seguimiento (ver 1.3)
- Si "interesado": fecha estimada de inicio de proceso de contrato
- Notas de seguimiento (texto libre, histórico simple)

### 1.2 Estados del pipeline

```
prospecto
   │  (asesor registra el lead, aún sin contactar)
   ▼
contactado
   │  (asesor llamó/escribió, se identificó y ofreció el servicio)
   ├──► interesado ──► en_proceso_contrato ──► activo (= Seller real en el sistema)
   │
   └──► no_interesado ──► (preferencia, ver 1.3)
                            ├──► recontactar_despues (con fecha sugerida)
                            └──► nunca_contactar (se descarta, no se vuelve a gestionar)
```

**Reglas de transición:**
- Solo `asesor` y `admin` pueden mover un prospecto de estado. `operador` puede **ver** el pipeline
  (consistente con su rol de solo consulta ya definido en `mvp-usuarios-internos.md`), no
  modificarlo.
- Un prospecto puede volver de `recontactar_despues` a `contactado` cuando llega la fecha sugerida
  y el asesor hace un nuevo intento (no es un estado terminal, es un "snooze").
- `nunca_contactar` **sí es terminal** — no se debe volver a contactar salvo que el propio
  concesionario se acerque espontáneamente (en cuyo caso se trata como un prospecto nuevo, no se
  reabre el registro descartado, para evitar arrastrar fricción histórica).
- El paso `interesado` → `en_proceso_contrato` no tiene automatización en el MVP: es
  responsabilidad manual del asesor (envío de términos y condiciones, negociación, gestión de
  accesos) — coherente con que la validación de identidad documental y el onboarding formal ya
  están fuera de alcance de software en el refinamiento general.

### 1.3 "No interesado": qué se registra

Cuando un prospecto dice que no le interesa, el asesor **debe** registrar:
1. **Razón** (texto libre/categorizable a futuro): ej. "no ve el valor", "ya usa otro sistema",
   "no tiene tiempo ahora", "precio", "solo le interesa el inventario" (ver sección 3 — esto último
   es una señal importante, no un simple "no").
2. **Preferencia de recontacto**, una de:
   - `recontactar_despues` + fecha sugerida (el asesor la estima según lo que diga el prospecto,
     ej. "llámenme en 3 meses").
   - `nunca_contactar` (terminal, ver 1.2).

Esto asegura que ningún prospecto se "pierda" sin registro y que el asesor tenga una lista clara
de a quién volver a contactar y cuándo — aunque sea en una hoja de cálculo, con una columna de
fecha de recontacto que se pueda ordenar/filtrar.

### 1.4 Conversión de Prospecto → Seller activo: qué datos migran

Cuando un prospecto llega a `activo`, se crea el `Seller` real en el sistema (entidad ya diseñada
en `sellers` schema). Migran directamente sin necesidad de recaptura:
- Razón social → `Seller.business_name` (o campo equivalente ya definido por @architect/@db)
- Email, teléfono, dirección → campos correspondientes de `Seller`
- Nombre de contacto → dato de referencia (no necesariamente un campo formal si `Seller` ya
  captura esto vía el usuario que se crea en `iam`)

**Dato nuevo que se crea en este momento (no existe en la etapa de prospecto):**
- `user_id` (cuenta de acceso al dashboard, se crea como parte del proceso de contrato/accesos)
- Estado `verificado` (ver sección 3 — por defecto un seller recién convertido queda
  `pendiente` de verificación, el asesor lo verifica en un paso posterior o simultáneo)
- (Si se decide meter en MVP, lo cual **no se recomienda**, ver sección 3.3) `participation_mode`

**Nota de negocio:** el registro histórico del prospecto (notas de seguimiento, fecha de primer
contacto, quién lo gestionó) **no necesita migrar** al sistema — puede quedarse en la hoja de
cálculo como historial comercial, dado que no tiene valor operativo una vez que el seller ya está
activo. Si en Fase 2 se decide construir el pipeline como feature de software, ahí sí valdría la
pena mantener esa trazabilidad de forma permanente.

---

## 2. Estrategia mínima viable para "generar interés" (prospecto que dijo que no)

El founder pidió explícitamente definir una estrategia para estos casos. Como PO, propongo un
mecanismo **simple y ya soportado por decisiones de negocio existentes** (no se inventan
herramientas de marketing nuevas):

### 2.1 Argumentos de venta ya disponibles (bajo riesgo para el seller)
- **1 mes gratis de bienvenida** (ya definido en `mvp-refinamiento-mvp1.md` sección 3.9): el
  asesor puede ofrecerlo como "prueba sin costo" para bajar la barrera de entrada de un prospecto
  indeciso, no solo como beneficio genérico de lanzamiento.
- **Cobro solo por agenda asistida, no por publicar ni por agenda creada** (misma sección 3.9): el
  argumento de venta es "no pagas por tener tu inventario visible, ni por que la gente agende;
  pagas $1.000 COP solo cuando alguien efectivamente asiste a ver el carro". Esto es un riesgo
  financiero mínimo para la concesionaria y debe ser el argumento central del asesor frente a la
  objeción "no le veo el valor" o "es otro gasto".
- **Sin necesidad de validación documental ni proceso burocrático pesado para arrancar** (la
  validación de identidad documental es explícitamente OUT del MVP): el onboarding es rápido.

### 2.2 Material de venta mínimo (acción concreta, no "campaña de marketing")
- Un **PDF/one-pager de 1 página** con: qué es Segunda, cómo funciona el flujo (publicar → agendar
  → notificar), el modelo de cobro (solo agenda asistida), y el beneficio de "1 mes gratis". Este
  material lo debe producir el equipo (founder/asesor), no es responsabilidad de ingeniería.
- Opcional, si hay tiempo: una **demo del catálogo con datos de ejemplo reales** (screenshots o
  acceso a un ambiente de staging con vehículos de muestra) para que el prospecto "vea" el
  potencial del catálogo público antes de comprometerse — esto es simplemente mostrar el MVP ya
  construido, no requiere desarrollo adicional.

### 2.3 Proceso de seguimiento
- Todo prospecto que diga "no" pero no sea `nunca_contactar` **debe** tener una fecha de recontacto
  registrada (ver 1.3). El asesor revisa periódicamente (ej. semanalmente) la hoja de cálculo
  filtrando por fecha de recontacto vencida.
- **No se propone automatización de este recordatorio en el MVP** (ej. no hay email automático al
  asesor) — con 1 asesor y un volumen bajo de prospectos en el piloto, una revisión manual semanal
  es suficiente y evita construir software para un problema que hoy es de bajo volumen.

---

## 3. "Verificado" vs. "Modo de participación": dos ejes distintos

Esta es la aclaración central pedida por el founder. Confirmo la interpretación y la formalizo:

### 3.1 Eje A — `verified` (¿confío en este seller?)
- Ya definido en `mvp-usuarios-internos.md` (HU-INT-04): el asesor revisa manualmente la
  información del seller (razón social, dirección, que sea un negocio real) y lo marca
  `verificado`. **No hay validación documental automatizada** (confirmado OUT en el refinamiento
  general).
- Es un eje de **confianza/legitimidad**, pensado para dar tranquilidad al equipo interno y,
  eventualmente, mostrar un badge de confianza al customer en el catálogo público (Fase 2 —
  hoy el catálogo no distingue seller verificado vs. no verificado, ver 3.4).

### 3.2 Eje B — `participation_mode` (¿en qué alcance funcional participa?)
- **Confirmo la interpretación de la tarea:** el founder señala una posibilidad real —un seller
  podría querer usar Segunda **solo como sistema de inventario interno** (su propio "ERP" de
  gestión de vehículos), **sin participar del canal público de agendamiento** con customers
  externos.
- Esto formaliza un valor `participation_mode` con dos opciones:
  - `full_marketplace` (default): el seller publica vehículos, estos aparecen en la landing
    pública, customers externos pueden agendar visitas — es el flujo completo ya diseñado.
  - `inventory_only`: el seller usa el dashboard para gestionar su inventario (CRUD de vehículos,
    marcar vendido, etc.) pero **sus vehículos NO aparecen en la landing pública** y **no se puede
    agendar visita a ellos** desde el canal de Segunda.

### 3.3 ¿Esto entra al MVP de enero o es Fase 2?

**Recomendación de PO: Fase 2, NO MVP de enero.** Razones:
1. El modelo de monetización del MVP (`mvp-refinamiento-mvp1.md` 3.9) es **cobro por agenda
   asistida**. Un seller en `inventory_only` nunca genera agendas, es decir, **nunca genera
   ingreso** bajo el modelo actual. No hay urgencia de negocio en soportarlo para el lanzamiento
   comercial — el objetivo de enero es validar el flujo completo publicar→agendar→bloquear→
   notificar con concesionarias reales generando agendas.
2. Meterlo ahora obliga a tocar: filtros de la landing pública (excluir `inventory_only`), lógica
   de agendamiento (bloquear la acción si el seller es `inventory_only`), y potencialmente el
   badge de estado del vehículo — trabajo adicional de diseño/desarrollo en un cronograma ya
   ajustado a 4 meses, sin que haya (todavía) un prospecto real pidiéndolo.
3. Es una idea válida a validar en el **piloto**: si durante las conversaciones de prospección
   (diciembre, piloto con 2-3 concesionarias) un prospecto real pide explícitamente esta opción,
   se debe **registrar como señal de demanda** en el pipeline de prospección (columna de notas) y
   escalarse a founder/PO para decidir si se prioriza antes de Fase 2 — pero no se construye
   especulativamente antes de tener esa señal real.

**Qué pasa mientras tanto (MVP enero) si un prospecto solo quiere el inventario:** el asesor puede
ofrecerlo igual con el entendimiento de que sus vehículos publicados sí aparecerán en el catálogo
público (comportamiento actual del sistema, sin diferenciación). Si el prospecto rechaza esto
específicamente, se registra como "no interesado" con razón "solo quiere inventario privado" y
preferencia `recontactar_despues`, para retomarlo cuando `participation_mode` esté disponible en
Fase 2.

### 3.4 Confirmación explícita para @architect/@db
- **Ambos ejes son campos/conceptos independientes.** No deben modelarse como el mismo estado ni
  depender uno del otro (un seller puede estar `verificado` y en `full_marketplace`, o
  `verificado` y en `inventory_only` en Fase 2, o `pendiente` de verificar y aun así en
  `full_marketplace` — el MVP de enero de hecho opera así: `verified` no bloquea ninguna acción
  funcional hoy, ver siguiente punto).
- **Confirmado: en el MVP de enero, `verified` es puramente informativo para el equipo interno.**
  No bloquea publicar vehículos, no bloquea aparecer en el catálogo, no bloquea recibir
  agendamientos. Esto resuelve la pregunta original que el arquitecto había dejado abierta en
  `mvp-usuarios-internos.md` (sección 6, pregunta 2): **no, verificar NO bloquea nada
  funcionalmente en el MVP; es solo un estado de seguimiento/confianza interno.**
- Si en el futuro (Fase 2) se decide que `verified` sí debe bloquear algo (ej. no aparecer en
  catálogo hasta ser verificado), eso es una **nueva decisión de negocio** a validar con el
  founder en su momento, no algo que se infiere de este documento.

---

## 4. Historias de usuario nuevas/actualizadas (asesor)

Se agregan a las ya existentes en `mvp-usuarios-internos.md` sección 2. Numeración continua
(`HU-INT-11` en adelante) para no romper referencias previas.

### P0 — indispensable para que el asesor trabaje desde el día 1
- **HU-INT-11** (asesor) Como asesor, quiero registrar un nuevo prospecto de concesionaria (razón
  social, contacto, email, teléfono, dirección, fuente), para tener un registro ordenado de a
  quién voy a contactar.
  - Given tengo datos de una concesionaria candidata, When la registro como prospecto, Then queda
    en estado `prospecto` con todos sus datos de contacto.
  - **Nota de implementación (ver sección 6): en el MVP esto se resuelve con una hoja de cálculo
    compartida, no con una pantalla de software.** La historia describe el comportamiento de
    negocio esperado, independiente de si el "sistema" es una hoja de cálculo o una feature.
- **HU-INT-12** (asesor) Como asesor, quiero mover un prospecto por los estados del pipeline
  (`contactado`, `interesado`/`no_interesado`, `en_proceso_contrato`), para reflejar en qué punto
  de la negociación está cada concesionaria.
  - Given un prospecto en estado `prospecto`, When lo contacto y registro el resultado, Then su
    estado cambia a `contactado` y luego a `interesado` o `no_interesado` según corresponda.
- **HU-INT-13** (asesor) Como asesor, quiero registrar la razón y preferencia de seguimiento
  cuando un prospecto dice que no le interesa, para no perder la oportunidad de recontactarlo más
  adelante si aplica.
  - Given un prospecto pasa a `no_interesado`, When registro la razón, Then debo elegir entre
    `recontactar_despues` (con fecha sugerida) o `nunca_contactar`.
- **HU-INT-14** (asesor) Como asesor, quiero convertir un prospecto en `en_proceso_contrato` a un
  Seller activo del sistema (con acceso al dashboard), para que pueda empezar a publicar
  vehículos.
  - Given un prospecto está en `en_proceso_contrato` y completé el proceso de contrato/accesos,
    When lo marco como convertido, Then se crea el `Seller` real (datos migrados según sección
    1.4) con estado `verificado = pendiente` por defecto.

### P1 — deseable, no bloqueante del día 1
- **HU-INT-15** (asesor) Como asesor, quiero ver una lista de prospectos con `recontactar_despues`
  cuya fecha ya venció, para priorizar mi seguimiento semanal.
  - En el MVP (hoja de cálculo), esto se resuelve con un filtro/orden manual, no con una
    notificación automática (ver sección 2.3).

### P2 — Fase 2, explícitamente no MVP
- **HU-INT-16** (asesor) Como asesor, quiero configurar el `participation_mode` de un seller
  (`inventory_only` / `full_marketplace`) al momento de convertirlo o después, para adaptarme a
  concesionarias que solo quieren usar el sistema como inventario privado.
  - Ver sección 3.3: no se prioriza para enero, se recolecta como señal de demanda durante el
    piloto.
- Reportes de conversión del pipeline (tasa de prospecto→activo, tiempo promedio por etapa, etc.)
  — depende de tener volumen de datos que no existirá hasta después del piloto.

---

## 5. Backlog MoSCoW actualizado

Este bloque se agrega a los ya existentes en `mvp-refinamiento-mvp1.md` (sección 4) y
`mvp-usuarios-internos.md` (sección 5), sin modificarlos.

**Must Have (bloquean el trabajo del asesor desde el día 1, pero NO como software):**
- Plantilla de hoja de cálculo compartida (Google Sheets) con las columnas definidas en sección
  1.1/1.3, para gestionar el pipeline de prospección manualmente. **Esto es responsabilidad del
  PO/asesor, no de ingeniería** — no consume tiempo de desarrollo.
- Material de venta mínimo (one-pager, sección 2.2) — responsabilidad de founder/marketing, no de
  ingeniería.
- Proceso claro y ya confirmado de que "verificado" **no bloquea nada funcionalmente** en el MVP
  (aclaración de negocio, cero esfuerzo de desarrollo adicional al ya planeado para
  `PATCH /sellers/:id/verify`).

**Should Have (Fase 2 temprana, evaluar según señales del piloto):**
- Migrar el pipeline de prospección de hoja de cálculo a una feature simple dentro del panel
  interno (CRUD de prospectos + cambio de estado), **si y solo si** el volumen de prospectos
  gestionados durante el piloto/primeros meses hace que la hoja de cálculo se vuelva
  inmanejable (ver criterio de revisión en sección 6.3).
- `participation_mode` (`inventory_only` / `full_marketplace`) — **si y solo si** durante el
  piloto un prospecto real lo pide explícitamente (ver sección 3.3).

**Won't Have (fuera de enero, confirmado):**
- Automatización de recordatorios de recontacto (email/notificación al asesor).
- Reportes de conversión del pipeline comercial (tasas, tiempos por etapa).
- Cualquier forma de scoring/priorización automática de prospectos.
- Badge de "verificado" visible al customer en el catálogo público (el eje de verificación sigue
  siendo interno en el MVP).

---

## 6. Recomendación de PO: ¿pipeline en software o en hoja de cálculo?

### 6.1 Análisis
- Hay **1 solo asesor** confirmado para enero (`mvp-usuarios-internos.md`, contexto de roles
  internos 1x1x1). El volumen de prospectos que una sola persona puede gestionar manualmente en
  los primeros meses es bajo (decenas, no cientos).
- El cronograma de 4 meses ya está ajustado y con hitos mensuales apretados (ver
  `mvp-refinamiento-mvp1.md` sección 5). Meter un CRUD de pipeline de prospectos con máquina de
  estados propia compite directamente por tiempo de desarrollo con el flujo núcleo del MVP
  (publicar→agendar→bloquear→notificar), que es la prioridad innegociable.
- Una hoja de cálculo compartida resuelve el 100% del valor de negocio descrito en este documento
  (registro ordenado, estados, fechas de recontacto, notas) sin ninguna línea de código.

### 6.2 Recomendación
**El pipeline de prospección de sellers se gestiona en una hoja de cálculo (Google Sheets) durante
el MVP de enero y el piloto**, no como feature de software. Este documento define la estructura de
datos y estados (secciones 1 y 4) precisamente para que:
(a) el asesor tenga una plantilla clara desde ya, y
(b) si más adelante se decide migrar esto a software, el modelo de datos y las historias de
usuario ya estén pre-definidas y listas para pasar a @architect/@db sin repetir este ejercicio.

### 6.3 Criterio de revisión (cuándo pasar a software)
Se recomienda revisar esta decisión (no comprometerla a ciegas) si ocurre cualquiera de:
- El asesor reporta que la hoja de cálculo es difícil de mantener (ej. más de ~50-100 prospectos
  activos simultáneos, o necesidad real de que más de una persona la edite a la vez con
  concurrencia).
- Se contrata un segundo asesor y se requiere reparto/visibilidad compartida de prospectos que una
  hoja de cálculo ya no resuelve bien.
- El founder decide priorizar `participation_mode` (sección 3.3) antes de Fase 2 por señal fuerte
  de demanda real detectada en el piloto — en ese caso probablemente valga la pena construir
  también el pipeline como feature en el mismo esfuerzo.

---

## 7. Preguntas abiertas para el founder

1. **Validar la recomendación de hoja de cálculo (sección 6):** ¿el founder está de acuerdo en que
   el pipeline de prospección NO se construya como software para enero, o hay una razón de negocio
   que yo no esté viendo para requerirlo desde el día 1 (ej. ya hay más de un asesor previsto para
   los próximos meses, o el founder ya tiene mucho volumen de prospectos identificado)?
2. **Material de venta (sección 2.2):** ¿quién produce el one-pager/PDF de venta — founder,
   asesor, o se necesita apoyo de diseño externo? Esto no es responsabilidad de @po/@architect,
   pero queda como acción pendiente fuera del alcance de ingeniería.
3. **`participation_mode` (sección 3.3):** confirmar que el founder está de acuerdo en dejarlo para
   Fase 2 y solo revisarlo si aparece una señal real de demanda durante el piloto, en lugar de
   construirlo especulativamente ahora.
4. **Umbral de "nunca_contactar":** ¿debe existir alguna excepción (ej. cambio de dueño/gerencia
   de la concesionaria) donde sí tenga sentido reabrir un prospecto marcado `nunca_contactar`, o
   se mantiene estrictamente terminal como se propone en 1.2?
5. **Fuente del lead:** ¿el founder ya tiene una lista/base de datos existente de concesionarias
   candidatas (ej. de una investigación previa), o el asesor debe construirla desde cero
   (búsqueda propia, directorios, etc.)? Esto no cambia el diseño del pipeline, pero sí el tiempo
   real que tomará poblarlo al inicio.
