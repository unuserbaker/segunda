# Ajustes de arquitectura de infraestructura/tecnología

> Complementa `mvp-refinamiento-mvp1.md`, `docs-arquitectura-mes1-scheduling.md` y
> `docs-db-spec-mes1-scheduling.md`. Responde a 4 pedidos del founder: bucket de archivos,
> Keycloak, logging, y confirmación de Next.js+TS para `main_client`.
> Principio rector: **no poner en riesgo el lanzamiento comercial de enero** salvo decisión
> explícita del founder de asumir el riesgo.

---

## 1. Resumen ejecutivo (timing)

| # | Tema | ¿Entra en los 4 meses (antes de enero)? | Por qué |
|---|---|---|---|
| 1 | Bucket de archivos (`files`) | **Sí, entra — pero versión mínima (proveedor cloud gestionado, no MinIO)** | Ya es un bloqueador funcional: fotos de vehículos son parte del catálogo público (landing, SEO, conversión). No es una mejora opcional, es requisito de negocio del MVP (`vehicles` ya necesita imágenes desde Mes 1-2). Usar un proveedor cloud (Cloudflare R2 recomendado) evita meter un contenedor stateful más a operar en plena rampa de lanzamiento. |
| 2 | Keycloak (reemplazo/complemento de `iam`) | **No — Fase 2, post-enero.** Mantener `iam` propio, tal como está diseñado en Mes 1. | El diseño de Mes 1 (`docs-arquitectura-mes1-scheduling.md`) ya construye verificación de email dentro de `iam` con alcance acotado (2 endpoints, 1 tabla). Introducir Keycloak ahora significa: nuevo contenedor, nueva superficie de configuración (realms, clients, roles), reescribir guards/estrategia JWT, y migrar el modelo de `User` — todo esto en un cronograma de 4 meses ya comprometido con hitos mensuales encadenados. El riesgo de retrasar Mes 1 (que bloquea Mes 2, 3 y 4) es alto y el beneficio (SSO, gestión de usuarios) no es un requisito del MVP de enero (`mvp-refinamiento-mvp1.md` sección OUT: "gestión de usuarios internos/roles por seller" está explícitamente fuera de alcance). |
| 3 | Logging estructurado | **Sí, entra — versión mínima (Pino a stdout/archivo, sin Loki/Grafana).** Stack completo de observabilidad es Fase 2. | Logging estructurado mínimo (JSON, con contexto de request/usuario) es bajo esfuerzo (una librería, ~1 día de trabajo) y indispensable para operar el piloto/lanzamiento (diagnosticar incidentes en producción sin logs es operar a ciegas). El stack de visualización/alertas (Loki+Grafana) es una comodidad operativa que puede esperar sin riesgo funcional. |
| 4 | Next.js + TypeScript (`main_client`) | **No — Fase 2, post-enero.** Mantener React+Vite (JS) para el MVP, migrar frontend nuevo apuntando al backend en Mes 2 tal como ya está planeado, **sin cambiar de stack simultáneamente.** | El cronograma ya tiene una migración crítica en Mes 2 (`main_client` legacy→backend nuevo). Sumarle *en el mismo esfuerzo* un cambio de framework (Vite→Next) y de lenguaje (JS→TS) duplica el riesgo de una tarea que ya es la más grande de todo el cronograma y que **desbloquea todo lo demás** (landing, dashboard, notificaciones dependen de que el frontend hable con el backend nuevo). Un solo cambio a la vez. Next.js sí es la elección correcta a mediano plazo (SEO vía SSR/SSG es relevante para un marketplace que vive de tráfico orgánico), pero se ejecuta como iniciativa separada después del lanzamiento, sin bloquear enero. |

**Resumen en una frase:** de los 4 temas, **solo el bucket de archivos y el logging mínimo entran a los 4 meses**; Keycloak y Next.js quedan documentados como decisión confirmada de arquitectura a futuro, ejecutados en Fase 2 para no arriesgar el hito de enero.

---

## 2. Bucket de archivos (context `files/`)

### 2.1 Alternativas evaluadas

| Opción | Pros | Contras |
|---|---|---|
| **MinIO (self-hosted, contenedor Docker)** | S3-compatible (mismo SDK que un proveedor cloud, migración futura trivial), sin costo de proveedor, control total, encaja con el patrón "todo dockerizado" de AGENTS.md. | Es infraestructura *stateful* adicional a operar: backups, volúmenes persistentes, parcheo, alta disponibilidad — carga operativa que una startup de 2-3 personas con lanzamiento en 4 meses no debería asumir todavía. Sin backups gestionados, el riesgo de pérdida de fotos de vehículos (activo importante para el negocio) recae 100% en el equipo. |
| **Proveedor cloud gestionado (Cloudflare R2, o alternativamente AWS S3)** | Cero mantenimiento operativo (backups, HA, parcheo los resuelve el proveedor). API S3-compatible en ambos casos (R2 es S3-compatible). Costo variable muy bajo a la escala de un MVP con piloto de 2-3 concesionarias (R2 no cobra egress, tier gratuito generoso; S3 tiene egress pero a este volumen es marginal). Se integra en minutos vía SDK estándar (`@aws-sdk/client-s3` sirve para ambos). | Depende de un tercero (aceptable — ya se depende de un proveedor SMTP para notificaciones, mismo tipo de riesgo). |
| **Base de datos (bytea) o filesystem local del contenedor backend** | Cero infraestructura nueva. | Descartada explícitamente por el founder ("debe ser un bucket"), y además es mala práctica: filesystem local no persiste si el contenedor se recrea (Docker), y BLOBs en Postgres degradan el rendimiento de la DB transaccional. |

### 2.2 Decisión

**Cloudflare R2** (o AWS S3 si el founder ya tiene cuenta AWS activa — la decisión de proveedor específico es intercambiable gracias a la abstracción del punto 2.3; ambos usan el mismo SDK S3). **No se agrega MinIO al `docker-compose`.**

Justificación de timing: es la opción de **menor esfuerzo de implementación** (no hay contenedor nuevo que mantener, no hay volúmenes que respaldar) y de **menor riesgo operativo** para una startup pequeña en plena rampa de lanzamiento. La abstracción (2.3) permite migrar a MinIO self-hosted en el futuro si el volumen de fotos crece y el costo del proveedor cloud deja de ser marginal — sin tocar el código de `vehicles` ni de `files`.

### 2.3 Contrato del context `files/`

`files/` expone un servicio agnóstico al proveedor, siguiendo el mismo patrón ya usado para `NotificationChannel` en el diseño de Mes 1 (interfaz + adaptador intercambiable):

```
// files/storage-provider.interface.ts
export interface StorageProvider {
  readonly name: 's3' | 'r2' | 'minio';
  upload(params: { key: string; buffer: Buffer; contentType: string }): Promise<{ key: string }>;
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
  delete(key: string): Promise<void>;
}
```

```
// files/files.service.ts
export class FilesService {
  constructor(private readonly provider: StorageProvider) {}
  uploadVehiclePhoto(vehicleId: string, file: { buffer: Buffer; contentType: string; originalName: string }): Promise<{ key: string; url: string }>;
  getPhotoUrl(key: string): Promise<string>;       // URL firmada, expira (ej. 1h) — no URLs públicas permanentes
  deletePhoto(key: string): Promise<void>;
}
```

- Implementación inicial: `R2StorageProvider implements StorageProvider` usando `@aws-sdk/client-s3` (R2 es compatible con el SDK de S3, solo cambia el `endpoint`).
- `vehicles` **nunca** importa el SDK de S3/R2 directamente — solo depende de `FilesService` (inyectado, exportado desde `FilesModule`), igual patrón de bajo acoplamiento que `scheduling` → `VehiclesService`.
- Metadato de la foto (`key`, `vehicle_id`, orden de galería) se guarda como fila en una tabla nueva `files.vehicle_photos` (o, si se prefiere no crear tabla nueva en Mes 1-2, como columna `jsonb` en `Vehicle` con array de keys — **recomendado: tabla dedicada**, para soportar borrado individual y orden de galería sin migraciones futuras).
- URLs **firmadas con expiración corta** (ej. 1 hora), no públicas permanentes — evita exponer URLs de bucket directamente en el frontend y permite rotar de proveedor sin romper links ya compartidos (WhatsApp, etc.).

### 2.4 Impacto en cronograma

- Encaja en **Mes 1-2**: `vehicles` ya necesita fotos para que la landing pública (Mes 2) tenga catálogo real con imágenes. No es trabajo adicional fuera de lo ya planeado — es una pieza que faltaba especificar (`files/` era scaffold vacío).
- Bajo riesgo: es una integración de SDK estándar, sin lógica de negocio compleja.

---

## 3. Autenticación: Keycloak

### 3.1 Evaluación: ¿reemplaza o convive con `iam`?

Si se adoptara Keycloak, el approach correcto (para no duplicar fuentes de verdad) sería **reemplazo completo**: `iam` deja de emitir sus propios JWT y pasa a ser un **resource server** que valida tokens emitidos por Keycloak (vía JWKS). Un modelo "conviven" (Keycloak solo para SSO, guards propios en paralelo) generaría dos sistemas de identidad simultáneos — mayor complejidad, no menor.

### 3.2 Impacto en lo ya diseñado para Mes 1 (`iam` + verificación de email)

Es cierto que Keycloak resuelve out-of-the-box lo que el diseño de Mes 1 construye a mano: verificación de email, reseteo de contraseña, gestión de roles. **Pero el trabajo ya diseñado para Mes 1 es deliberadamente pequeño** (2 endpoints nuevos, 1 tabla `iam.email_verifications`, ~1 semana de esfuerzo estimado) — no hay "ahorro" neto de tiempo al traer Keycloak, porque el costo de introducirlo (nuevo contenedor, configuración de realms/clients, reescritura de `JwtAuthGuard` y de la estrategia `passport-jwt` para validar contra JWKS externo, migración de datos de `User` existentes hacia Keycloak, mapeo de roles `seller`/`buyer` a roles de Keycloak) es **mayor** que el ahorro de no construir 2 endpoints propios.

### 3.3 Recomendación

**No migrar ahora. Mantener `iam` propio tal como está diseñado en `docs-arquitectura-mes1-scheduling.md` para todo el ciclo de 4 meses.** Razones:
1. El cronograma es una cadena de hitos mensuales (Mes 1 bloquea Mes 2, que bloquea Mes 3...). Cualquier retraso en Mes 1 por una migración de infraestructura de auth no planeada se propaga a los 4 meses.
2. El refinamiento de negocio (`mvp-refinamiento-mvp1.md`, sección OUT) confirma que "gestión de usuarios internos/roles por seller" está **fuera de alcance de enero** — es decir, el caso de uso donde Keycloak brilla (multi-usuario por organización, roles finos) no es un requisito del MVP.
3. El sistema actual (`@nestjs/passport` + `@nestjs/jwt`, roles `buyer`/`seller` en `User.role`) ya cubre el 100% de lo que el MVP de enero necesita.
4. Es una migración de alto valor a **mediano plazo** (cuando haya gestión de usuarios internos por concesionaria, SSO, 2FA,等), pero no es urgente para el lanzamiento.

**Se documenta como decisión confirmada para Fase 2** (post-enero), con el approach técnico ya definido para cuando se ejecute:

### 3.4 Approach técnico para Fase 2 (documentado ahora, ejecutado después)

- Keycloak como contenedor Docker aparte (`keycloak` + su propia base de datos, o reutilizando el Postgres existente en un schema/DB separado — **recomendado: DB propia de Keycloak**, para no acoplar el ciclo de vida de un componente de infraestructura con el schema de negocio).
- `backend` se convierte en **resource server**: valida JWT firmados por Keycloak usando su endpoint JWKS (librería `passport-jwt` con `jwks-rsa`, o `nestjs-keycloak-connect` si se prefiere la integración empaquetada). El `JwtAuthGuard` actual se adapta para verificar contra JWKS en vez de un secreto compartido (`JWT_SECRET` actual desaparece del flujo de auth).
- **Roles**: se definen roles de *realm* en Keycloak (`seller`, `buyer`, y a futuro `admin`), mapeados en el token (`claim` de roles) — el guard/decorador de roles de Nest lee ese claim en vez de `User.role`.
- **Entidades de dominio existentes** (`Seller.user_id`, futuro `buyer_id` en `Appointment`): dejan de referenciar `iam.users.id` (tabla propia) y pasan a almacenar el `sub` (subject) del token de Keycloak como identificador — es decir, `Seller.user_id` (o su renombre `keycloak_sub`) guarda el UUID/string que Keycloak asigna a cada usuario. La tabla `iam.users` propia **se elimina o se reduce a una tabla de perfil/caché** (ej. para joins rápidos sin llamar a la API de Keycloak en cada request), sincronizada vía webhook de Keycloak o creada on-demand en el primer login.
- Migración de datos: los usuarios existentes (`iam.users`) deben re-crearse en Keycloak (vía API admin) preservando el mismo `id` como `sub` si es posible, para no romper las FKs ya creadas (`Seller.user_id`, `Appointment.buyer_id`).
- Esta migración se hace **fuera de temporada alta** (no en piloto ni en el mes de lanzamiento) — candidata natural para el primer sprint de Fase 2 (post-enero), cuando ya no hay riesgo de romper el flujo comercial en producción.

---

## 4. Logging

### 4.1 Alternativas evaluadas

| Opción | Nivel de esfuerzo | Adecuación |
|---|---|---|
| **Pino (logger) a stdout, formato JSON** | Muy bajo (~1 día): reemplaza el logger default de Nest por `nestjs-pino`, agrega contexto de request (`requestId`, `userId` si autenticado) vía middleware/interceptor. | **Recomendado para Mes 1-4.** Docker ya captura stdout de cualquier contenedor (`docker logs backend`); no requiere infraestructura nueva. Es el mínimo indispensable para operar el piloto/lanzamiento: poder buscar "qué pasó con la cita X" en logs estructurados. |
| **Pino + Grafana Loki + Grafana (dashboards/alertas)** | Medio-alto: agrega 2 contenedores más (Loki, Grafana), configuración de datasources, dashboards, políticas de retención. | **Fase 2.** Es la evolución natural una vez que Pino ya emite JSON estructurado (Loki puede empezar a ingerir esos logs sin cambiar el código de la app) — el trabajo de Mes 1-4 no se pierde, solo se le agrega un backend de visualización después. |
| **ELK/OpenSearch stack** | Alto: Elasticsearch/OpenSearch es pesado en recursos (RAM) para la escala de un MVP con 2-3 concesionarias piloto; sobre-dimensionado. | Descartado — demasiado costoso operativamente para el tamaño actual del proyecto. |

### 4.2 Decisión y mínimo viable para enero

**Mes 1**: introducir `nestjs-pino` (o `pino` + interceptor manual) en `backend/`, con:
- Logs en formato JSON a stdout (Docker los captura automáticamente).
- Contexto obligatorio en cada log: `requestId` (generado por middleware), `userId`/`role` si hay sesión JWT válida, `context` (nombre del módulo/servicio que loguea).
- Nivel configurable por `.env` (`LOG_LEVEL`, default `info` en prod, `debug` en dev).
- Uso obligatorio en los flujos críticos ya diseñados: creación de cita, bloqueo de vehículo, jobs de cron (Mes 1 de scheduling), envío de notificaciones (Mes 3) — son los puntos donde un bug en producción durante el piloto necesita diagnóstico rápido.

**Fase 2 (post-enero)**: agregar Loki + Grafana como contenedores adicionales en `docker-compose`, apuntando al mismo stdout de `backend` (via un driver de logging de Docker o un sidecar `promtail`) — no requiere tocar código de aplicación otra vez, solo infraestructura.

### 4.3 Impacto en cronograma

Bajo esfuerzo, se integra en Mes 1 sin desplazar nada del plan ya definido (puede hacerlo @developer en paralelo a la implementación de `scheduling`, no es un bloqueador de ningún hito).

---

## 5. Frontend: Next.js + TypeScript

### 5.1 Estado actual confirmado

`main_client` es React 18 + Vite, **JavaScript puro** (no hay `tsconfig.json` en el proyecto), apuntando al legacy vía `gateway_service` (confirmado en AGENTS.md y en el cronograma Mes 2: "migrar `main_client` para apuntar al backend nuevo").

### 5.2 Evaluación: ¿reescritura desde cero o migración incremental combinada con Mes 2?

El cronograma ya tiene en **Mes 2** la tarea más riesgosa y crítica de todo el proyecto después de scheduling: "migrar `main_client` para apuntar al backend nuevo, retirando el gateway". Esa migración por sí sola:
- Reescribe todas las llamadas HTTP (contrato de respuesta cambia: `{ message, record }` vs. lo que devuelve hoy el legacy).
- Reescribe auth (JWT real vs. `tk` header no enforced, según gotcha #4 de AGENTS.md).
- Es la que **desbloquea** el resto del cronograma (landing, dashboard, notificaciones dependen de que el frontend hable con el backend nuevo).

Sumarle en el mismo esfuerzo un cambio de framework (Vite→Next, con su propio modelo de ruteo, data-fetching, SSR/SSG) y de lenguaje (JS→TS, que obliga a tipar todo el código existente o convivir con `any` extendido) **duplica la superficie de riesgo de la tarea más crítica del cronograma**, justo en el mes que además introduce la landing pública nueva. Es la combinación de dos migraciones no relacionadas técnicamente (conectar a otro backend ≠ cambiar de framework de render) en una ventana de tiempo ya ajustada.

### 5.3 Ventajas de Next.js reconocidas (relevantes para Segunda)

- **SSR/SSG para SEO**: crítico para un marketplace que depende de tráfico orgánico — el catálogo de vehículos (landing pública) se beneficia directamente de páginas indexables por buscadores, algo que Vite (SPA client-side-only) no resuelve nativamente.
- **Rutas API** (`app/api/*`): útil si en el futuro se necesita un backend-for-frontend liviano (ej. agregación de datos para la landing sin exponer el backend completo), aunque no es un requisito del MVP.
- **TypeScript**: reduce bugs de contrato entre frontend/backend, especialmente relevante ahora que el backend nuevo tiene DTOs tipados con `class-validator` — hoy esa garantía se pierde en el frontend JS.

Estas ventajas son reales y justifican la decisión del founder — **el desacuerdo es solo de timing**, no de la elección tecnológica.

### 5.4 Recomendación de timing

**Fase por separado, no simultánea:**
1. **Mes 2 (dentro del MVP de enero)**: migrar `main_client` (React+Vite, se mantiene el stack actual) para apuntar al backend nuevo. Esto es lo que ya está comprometido y es indispensable para el lanzamiento.
2. **Fase 2 (post-enero, con datos reales del piloto ya validando el modelo de negocio)**: reescritura a Next.js + TypeScript, aprovechando que para ese momento los contratos de API con el backend nuevo ya están estables y probados en producción (menor riesgo de mover dos piezas a la vez). La landing pública ganará SEO en este momento, lo cual además es más valioso *después* del piloto (cuando ya hay inventario real de varias concesionarias que vale la pena indexar) que antes.

Si el founder considera el SEO tan crítico que no puede esperar a Fase 2, la alternativa de menor riesgo (no recomendada por defecto, solo si se asume el riesgo explícitamente) sería limitar Next.js **solo a la landing pública** como una app Next separada desde el día 1, dejando el dashboard seller en React+Vite tal como está — pero esto añade dos frontends a mantener en paralelo, complejidad no trivial para un equipo pequeño. **No se recomienda esta alternativa híbrida salvo pedido explícito del founder.**

---

## 6. Piezas de infraestructura Docker nuevas y su impacto operativo

| Pieza | ¿Se agrega en los 4 meses? | Costo | Mantenimiento |
|---|---|---|---|
| Bucket cloud (R2/S3) | **Sí** — no es un contenedor Docker, es un servicio externo gestionado. Cero configuración en `docker-compose`, solo variables de entorno (`endpoint`, `access_key`, `bucket_name`) en `backend`. | Muy bajo (R2 sin egress, tier gratuito cubre el piloto y probablemente los primeros meses de lanzamiento). | Ninguno — gestionado por el proveedor. |
| Contenedor MinIO | No se agrega (descartado a favor del punto anterior). | — | — |
| Contenedor Keycloak (+ su DB) | **No en estos 4 meses** — Fase 2. | Medio (cómputo + almacenamiento de un servicio adicional corriendo 24/7). | Medio-alto: requiere parcheo de seguridad periódico (Keycloak es superficie de ataque de auth), backups de su propia base de datos, curva de aprendizaje del equipo para administrar realms/clients. Justificable cuando el equipo crezca o se necesite gestión de usuarios internos por concesionaria. |
| Contenedor Loki + Grafana | **No en estos 4 meses** — Fase 2. Pino ya deja el terreno preparado (logs JSON a stdout). | Bajo-medio. | Bajo una vez configurado; requiere definir política de retención de logs para no crecer sin límite. |
| Next.js (no es infraestructura Docker nueva, mismo contenedor `main_client` se reconstruye con otro `Dockerfile`) | No en estos 4 meses — Fase 2. | Sin costo adicional de infraestructura (reemplaza al contenedor actual, no lo suma). | — |

**Conclusión operativa:** de las 4 iniciativas, solo el bucket cloud se suma a la infraestructura de estos 4 meses, y es la de menor carga operativa posible (no es ni siquiera un contenedor propio). Esto es intencional: minimizar piezas nuevas a operar mientras el equipo está enfocado en el piloto y lanzamiento comercial.

---

## 7. Reconciliación con documentos previos

- **`mvp-refinamiento-mvp1.md`**: sin cambios necesarios. Ninguno de los 4 ajustes modifica el alcance de negocio (IN/OUT) ni el cronograma Mes 1-4 definido en la sección 5 — salvo la incorporación explícita de "fotos de vehículos vía bucket" como parte del trabajo ya implícito de `vehicles`/landing en Mes 1-2 (no estaba detallado técnicamente, ahora sí).
- **`docs-arquitectura-mes1-scheduling.md`**: sin cambios. La decisión de mantener `iam` propio (sección 3 de este documento) **confirma y no reemplaza** el diseño ya hecho de extensión de `iam` para verificación de email — ese trabajo se ejecuta tal cual está especificado, sin esperar ni adelantar nada por Keycloak.
- **`docs-db-spec-mes1-scheduling.md`**: sin cambios en las entidades de `scheduling`/`iam` ya especificadas. Se añade como encargo nuevo para @db (ver sección 8 abajo) el modelo de `files.vehicle_photos`, independiente del trabajo de Mes 1 ya detallado.

---

## 8. Encargo para @db (nuevo, derivado de este documento)

1. **Nueva tabla `files.vehicle_photos`**: `id (uuid PK)`, `vehicle_id (uuid, FK → vehicles.vehicles.id)`, `storage_key (varchar(500))`, `position (smallint, default 0)` (orden de galería), `created_at`. Tabla nueva, sin datos previos → segura para `synchronize: true` en dev, migración simple para prod.
2. No se requiere ninguna tabla para Keycloak ni Next.js en esta entrega (ambos son Fase 2, sin impacto de esquema inmediato).
3. Logging (Pino) no requiere esquema de base de datos — es a stdout/archivo.

---

## 9. Recomendación final priorizada (si solo se pudieran meter 1-2 cambios en enero)

**Elegir: (1) Bucket de archivos + (3) Logging mínimo (Pino).** Ambos son:
- De bajo esfuerzo y bajo riesgo de implementación (días, no semanas).
- **Requisitos reales** para operar el MVP: sin fotos no hay catálogo vendible; sin logs no hay forma sana de operar un piloto en producción y diagnosticar incidentes con concesionarias reales pagando.

**Dejar fuera de enero, sin excepción salvo decisión explícita del founder: Keycloak y Next.js.** Ninguno de los dos es un requisito funcional del MVP (`mvp-refinamiento-mvp1.md` confirma que gestión de usuarios/roles avanzada está OUT, y el frontend actual —aunque no sea el stack ideal a largo plazo— es funcionalmente capaz de soportar todo el alcance IN de enero). Ambos son mejoras de plataforma/DX a mediano plazo cuyo costo de introducir ahora (nueva infraestructura a operar, dos migraciones simultáneas de frontend) supera ampliamente su beneficio dentro de la ventana de 4 meses ya comprometida.
