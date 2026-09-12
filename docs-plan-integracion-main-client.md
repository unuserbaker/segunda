# Plan de integración `main_client` ↔ `backend/` nuevo

> Complementa `mvp-refinamiento-mvp1.md`, `docs-arquitectura-mes1-scheduling.md`,
> `docs-db-spec-mes1-scheduling.md` y `docs-arquitectura-ajustes-infra.md`.
> Alcance: **solo planeación**, sin código en esta entrega. Ejecutado por @developer en Mes 2
> (11 oct – 11 nov), en paralelo a la parte de Mes 1 de `scheduling` que aún esté en curso.
> Referencia de contrato de API real hoy: ver `AGENTS.md` sección "API endpoints (new backend)".

---

## 0. Resumen de decisiones (una tabla, para @po/@architect antes de leer el detalle)

| Pregunta | Decisión |
|---|---|
| ¿Gateway sigue vivo en dev? | **No para lo migrado.** Se apaga como intermediario de `backend/` (mismo puerto 3000, conflicto real). Se mantiene *apagado por defecto* en dev; solo se levanta puntualmente si algún flujo legacy no migrado aún lo necesita (hoy: ninguno, todo lo del catálogo público y auth se cubre con `backend/`). |
| ¿`VITE_BASE_URL` cambia? | Sí: de `localhost:3000` (sin protocolo, bug) a `http://localhost:3000`. |
| ¿Dónde se guarda el JWT? | **localStorage**, recomendación explícita con trade-off (ver sección 2). |
| ¿Existe pantalla de Register? | **No existe hoy.** Es necesaria (bloquea HU-02 del refinamiento) — se crea en Mes 2. |
| ¿Se puede avanzar scheduling en frontend ya? | Sí, solo estructura/UI de componentes de fecha-hora sin contrato de API real (ver sección 4). El contrato de `/appointments/*` **no está definido todavía** — depende de que @architect/@db cierren el diseño de endpoints REST concretos (hoy solo hay diseño de entidades/casos de uso, no rutas HTTP). |
| ¿Prioridad #1 de Mes 2? | Puerto/URL base + Auth + catálogo público — es lo que ya está 100% implementado en `backend/` hoy y no depende de nada de Mes 1 restante. |

---

## 1. Puerto, URL base y destino del gateway

### 1.1 Problema confirmado
- `backend/` corre en el puerto 3000 (`AGENTS.md`: "Dev (local): backend... port 3000").
- `gateway_service` también corre en el puerto 3000 (`npm run dev` con nodemon, según `AGENTS.md`).
- Ambos no pueden correr simultáneamente en dev sin cambiar uno de los dos puertos.
- `main_client/src/core/config/index.js` lee `VITE_BASE_URL` desde `.env` de Vite, hoy configurado como `localhost:3000` **sin protocolo** — axios (`baseURL: Config.baseUrl`) con un valor sin protocolo puede fallar o resolver de forma inconsistente según el entorno del navegador. Es un bug a corregir independientemente de todo lo demás.

### 1.2 Decisión: apagar el gateway como default de dev, no convivir en paralelo indefinidamente

Razones:
- El gateway solo enruta `/vehicles` → legacy `vehicles_service:3005` (`AGENTS.md`). Todo lo que el frontend necesita conectar en Mes 2 (auth, catálogo de vehículos, referencia) **ya existe en `backend/` nuevo** — no hay ningún flujo real que siga dependiendo del legacy una vez migrado `main_client`.
- Mantener el gateway "vivo en otro puerto por si acaso" sin un consumidor real es complejidad muerta durante el sprint de migración — mejor apagarlo y solo revivirlo puntualmente (`npm run dev` manual en `gateway_service`) si aparece una regresión que obligue a comparar contra el comportamiento legacy.
- `AGENTS.md` ya advierte: "No toques `gateway_service`... salvo que se pida explícitamente". Esta tarea (Mes 2, sección 5 del cronograma: "retirando el gateway para lo migrado") es justamente el pedido explícito de retirarlo para lo migrado — no se requiere tocar código del gateway, solo dejar de levantarlo en el flujo de dev diario.

### 1.3 Cambios concretos

1. **`main_client/.env` (o `.env.development`)**: cambiar
   ```
   VITE_BASE_URL=localhost:3000
   ```
   a
   ```
   VITE_BASE_URL=http://localhost:3000
   ```
2. **Documentar en README de `main_client`** (o en el propio AGENTS.md si @po lo aprueba) el nuevo flujo de dev:
   ```bash
   cd backend && npm run start:dev   # puerto 3000, NO levantar gateway_service en paralelo
   cd main_client && npm run dev     # puerto 5173, apunta a http://localhost:3000
   ```
3. **`gateway_service`**: no se borra ni se modifica código. Se documenta como "apagado por defecto en el flujo de dev de Mes 2 en adelante; se puede levantar manualmente en otro puerto (ej. `PORT=3005` propio o el que ya tenga configurado) solo para comparar comportamiento legacy durante la migración, nunca en paralelo al backend nuevo en el puerto 3000".
4. **Nada que hacer en `vehicles_service` ni legacy** — sigue funcionando de forma independiente para quien lo necesite probar por separado.

### 1.4 Riesgo / qué falta validar
- Confirmar que ningún otro consumidor (script, Postman collection compartida, etc.) depende hoy del gateway en el puerto 3000 — bajo riesgo, pero @qa debe validarlo antes de asumir que el gateway puede apagarse sin aviso al equipo.

---

## 2. Auth real: conectar `Login`/`Register` a `backend/`

### 2.1 Estado actual confirmado (explorado en código)
- `main_client/src/core/axios/index.js`: usa header custom `tk` (esquema legacy, leído de `localStorage.getItem(LOCALSTORAGE_KEYS['token'])`) y un header `Authorization` que hoy viene de `Config.authorization` (una env var estática, no un JWT dinámico).
- `useLogin.js`: el `handleSubmit` real (que llama a un servicio `login(dataSend)`, decodifica el JWT y navega según `lay`) está **comentado**. Hoy solo navega directo a `/admin/dashboard` sin llamar a ningún backend.
- No existe pantalla de `Register` en `main_client/src/pages/`.

### 2.2 Cambios en el wrapper de axios

**Dejar de usar el header `tk`** para autenticación y pasar a `Authorization: Bearer <token>` (estándar JWT, compatible con `JwtAuthGuard` de `@nestjs/passport`+`@nestjs/jwt` del backend nuevo).

Plan de cambios en `src/core/axios/index.js`:
1. `getheadersConf()` deja de setear `tk` y en su lugar lee el JWT guardado y arma `Authorization: Bearer ${token}` cuando existe token; si no hay token, no se envía el header (rutas públicas del catálogo no lo necesitan).
2. `Config.authorization` (env var estática, hoy usada como `Authorization` fijo) se retira del flujo de auth real — puede quedar como header legacy solo si algún endpoint viejo lo sigue exigiendo (a confirmar, bajo riesgo de que ya no se use en ningún lado tras la migración).
3. Mantener la forma general del wrapper (`request`, `axiosService`) — no reescribir el patrón, solo el contenido de los headers, para minimizar el diff y el riesgo de romper el CRUD de vehículos que ya usa este mismo wrapper.
4. Agregar un interceptor de respuesta simple: si el backend responde `401` (token vencido/该inválido), limpiar el token de `localStorage` y redirigir a `/login` — comportamiento estándar esperado, hoy no existe ningún manejo de expiración.

### 2.3 Dónde guardar el JWT: localStorage vs. cookie httpOnly

**Recomendación: localStorage**, con trade-off explícito para que @po/@founder lo apruebe con los ojos abiertos:

| Opción | Seguridad | Esfuerzo |
|---|---|---|
| **localStorage** (recomendado) | Vulnerable a robo de token vía XSS (si un script malicioso se inyecta, puede leer `localStorage` y exfiltrar el JWT). Mitigable con buenas prácticas de sanitización de inputs/CSP, que de todas formas se deben aplicar. | **Bajo** — es el patrón que el código legacy ya usa (`tk` en localStorage), cero infraestructura nueva, compatible con SPA pura sin backend-for-frontend. Coherente con `main_client` como Vite SPA client-side (no hay servidor Node propio del frontend que pueda setear cookies httpOnly de forma nativa — se necesitaría un BFF, fuera de alcance de 4 meses). |
| **Cookie httpOnly** | Más segura contra XSS (JS no puede leer la cookie), pero requiere protección CSRF adicional (`SameSite`, tokens anti-CSRF) y que el backend setee la cookie (`Set-Cookie` en `/auth/login`), lo cual cambia el contrato de respuesta actual (`{ message, record }` con el JWT en el body) y requiere CORS con `credentials: true` coordinado entre `main_client` (5173) y `backend` (3000) — dominios/puertos distintos en dev. | **Alto** — no es un cambio trivial en NestJS (requiere `cookie-parser`, ajustar `CorsOptions`, csrf middleware) y rompe el patrón actual sin beneficio claro dado que Next.js/BFF (que resolvería esto mejor) está explícitamente en Fase 2 (`docs-arquitectura-ajustes-infra.md` sección 5). |

**Para un MVP de 4 meses con foco en cronograma de lanzamiento**: localStorage es la elección de menor riesgo de cronograma. El riesgo de seguridad (XSS) se mitiga con las prácticas estándar de React (evitar `dangerouslySetInnerHTML`, sanitizar cualquier input renderizado) que de todas formas deben aplicarse. Revisar cookie httpOnly como mejora en Fase 2, idealmente junto con la migración a Next.js (que sí tiene un servidor natural para setear cookies).

### 2.4 Cambios en `useLogin.js`

1. Descomentar y reescribir el flujo real:
   - Llamar a `POST /auth/login` con `{ email, password }` (confirmar el shape exacto del DTO de `iam` con @developer que implementó `AuthController` — no asumir, revisar `backend/src/contexts/iam/dto/` antes de codear).
   - Respuesta esperada (formato `{ message, record }` estándar del proyecto): extraer el JWT de `record` (confirmar el nombre exacto del campo — hoy el código comentado asume `record.tkn`, validar contra la implementación real de `iam` antes de dar esto por hecho).
   - Guardar el JWT en `localStorage` bajo la key ya usada por `LOCALSTORAGE_KEYS['token']` (reutilizar la constante existente, no inventar una nueva).
   - Decodificar el JWT (`jwt-decode`, ya es dependencia del proyecto) para extraer `role` (`buyer`/`seller`) y navegar condicionalmente: `seller` → `/admin/dashboard`, `buyer` → landing/catálogo (a definir con @po el destino post-login de un comprador — hoy todo el `Admin/*` asume rol seller).
   - Manejar error con el mismo patrón ya usado (`handlePopUpToast`).
2. Quitar el código muerto comentado una vez migrado (no dejar bloques comentados en el commit final).
3. **Ojo con `decryptValue`**: el código legacy comentado desencripta el JWT antes de decodificarlo (`decryptValue(tkn)` luego `jwtDecode`) — esto sugiere que el legacy encriptaba el JWT antes de mandarlo. **Confirmar con @developer si el backend nuevo hace lo mismo** (no debería ser necesario, un JWT ya está firmado/no es legible en texto plano relevante, pero si el patrón se mantiene por alguna razón de diseño hay que replicarlo). Mi recomendación: **no replicar esta capa extra de encriptación** contra el backend nuevo — es complejidad heredada del legacy sin beneficio claro sobre un JWT estándar ya firmado; solo `jwtDecode(token)` directo.

### 2.5 Pantalla de `Register` (nueva, no existe hoy)

Necesaria porque el refinamiento de negocio (HU-02, sección 1 IN) exige **registro obligatorio del customer para agendar**. Plan:

1. Nueva carpeta `main_client/src/pages/Register/` siguiendo el mismo patrón de `Login/` (componente + hook `useRegister.js` + validación Yup).
2. Formulario mínimo: `name`, `email`, `password` (+ confirmación de password en frontend, no en el DTO del backend).
3. Llama a `POST /auth/register` (confirmar DTO exacto con @developer/@architect de `iam` — según AGENTS.md el endpoint ya existe).
4. Tras registro exitoso: **no hace auto-login automático a ciegas** — mostrar mensaje de éxito y, si el flujo de verificación de email (Mes 1 de `docs-arquitectura-mes1-scheduling.md`, sección 1) ya está implementado para cuando se ejecute esta tarea, indicar al usuario que revise su correo para verificar la cuenta (aunque la verificación no bloquea exploración, si bloquea agendar — comunicarlo aquí evita fricción después).
5. Rol por defecto: `buyer` (customer) — el registro de `seller` (concesionaria) es un flujo distinto, ya cubierto hoy por el `role` default de `User` (`'buyer'`, según `docs-arquitectura-mes1-scheduling.md` sección 0). **Confirmar con @po/@architect si en Mes 2 ya se necesita un formulario de registro de seller distinto o si eso sigue siendo alta manual/admin** (fuera de exploración de este documento — anotar como pregunta abierta).

**Pregunta abierta para @po**: ¿el registro de seller (concesionaria) es self-service en el frontend o se mantiene como alta manual/admin en Mes 2? No estaba explícito en el refinamiento revisado. Si es self-service, se necesita un segundo formulario o un selector de rol en el mismo `Register`.

---

## 3. Catálogo de vehículos conectado a datos reales

### 3.1 Estado actual confirmado
- `main_client/src/core/api/vehicles_api.js`: todas las rutas llevan prefijo `vehicles/` (ej. `vehicles/vehicles`, `/vehicles/brands`) — heredado del gateway legacy, que solo enrutaba bajo `/vehicles`.
- Backend nuevo: `GET /vehicles` (paginado), y el `ReferenceController` expone `/brands`, `/categories`, `/engine_types`, `/transmissions`, `/types`, `/status` **sin prefijo `/vehicles/`** (confirmado en AGENTS.md: "ReferenceController sin prefijo").
- `Home/index.jsx`: landing 100% estática, sin fetch real.

### 3.2 Ajuste de `vehicles_api.js`

Quitar el prefijo `vehicles/` de todas las rutas de referencia (quedan en la raíz) y mantener `/vehicles` solo para el propio recurso vehículo:

```js
const API_VEHICLES = {
  VEHICLES: {
    GET_VEHICLES: 'vehicles',
    POST_VEHICLES_CREATE: 'vehicles',
    PUT_VEHICLES_UPDATE: (idVehicle) => `vehicles/${idVehicle}`,
  },
  TYPES: { GET_TYPES: 'types' },
  TRANSMISSIONS: { GET_TRANSMISSIONS: 'transmissions' },
  CATEGORIES: { GET_CATEGORIES: 'categories' },
  BRANDS: { GET_BRANDS: 'brands' },
  ENGINE_TYPES: { GET_ENGINE_TYPES: 'engine_types' },
  STATUS: { GET_SATUS: 'status' },
};
```

(Esto es de bajo riesgo y se puede dejar listo para implementación inmediata — no requiere diseño adicional, solo confirmar el nombre exacto de cada ruta contra `backend/src/contexts/vehicles/*.controller.ts` antes de aplicar el cambio, por si algún nombre difiere levemente del legacy, ej. `engine_types` vs. `engine-types`.)

### 3.3 Catálogo público real (`Home/index.jsx` → landing con datos reales)

Plan de reemplazo del mock:
1. Nuevo hook `useVehiclesCatalog.js` (o extender el existente si `Admin/Vehicles/useVehicles.js` ya tiene lógica reutilizable de paginación — evaluar extraer un hook compartido `useVehiclesList` parametrizable por "modo admin" vs. "modo público", ya que ambos consumen el mismo `GET /vehicles`).
2. Fetch de `GET /vehicles` con query params de paginación (`page`, `limit` — confirmar nombres exactos de query params contra el controller real de `backend/`, no asumir).
3. Fetch en paralelo de `GET /brands`, `/categories`, `/types` para poblar los filtros de la landing (marca, precio, tipo — según sección 1 IN del refinamiento: "filtros (marca, precio, tipo)"). El filtro de **precio** es un rango numérico, no viene de un catálogo — es un filtro client-side o un query param `minPrice`/`maxPrice` a confirmar si el backend ya lo soporta en `GET /vehicles` (a validar con @developer del context `vehicles`, hoy no confirmado en la exploración).
4. Reemplazar el array hardcodeado de `Home/index.jsx` por el resultado del fetch, manteniendo el mismo layout/componentes visuales ya existentes (no rediseñar UI en esta tarea, solo conectar datos).
5. **Badge de estado del vehículo** ("Próxima visita agendada", sección 1 IN): **depende de que `vehicles.status` tenga el valor `active_appointment` sembrado y de que `GET /vehicles` devuelva ese `status` en cada fila** — esto es trabajo de Mes 1 de scheduling (`docs-db-spec-mes1-scheduling.md` sección 3.7), todavía no confirmado como implementado. El frontend puede dejar el badge **condicionado a un campo `status.str_code === 'active_appointment'`** ya en esta tarea de Mes 2, mostrando el badge en cuanto el backend empiece a devolver ese valor — no bloquea, pero el badge no se verá "activo" hasta que Mes 1 de scheduling termine ese punto.

### 3.4 Ficha de detalle de vehículo (nueva página, no existe hoy)

1. Nueva ruta `main_client/src/pages/VehicleDetail/` (o `main_client/src/pages/Vehicle/` según convención del proyecto — revisar `src/routes` o el router principal para el patrón de nombres de carpeta ya usado).
2. Fetch de un solo vehículo — **hoy no existe un endpoint `GET /vehicles/:id` individual confirmado** en la exploración (AGENTS.md solo lista `GET /vehicles` paginado, `POST /vehicles`, `PUT /vehicles/:id`). **Falta confirmar con @developer de `vehicles`** si ya existe `GET /vehicles/:id` o si hay que agregarlo — es un endpoint de bajo riesgo y estándar (`findOne` de TypeORM + mismo formato `{ message, record }`), candidato natural para agregar en el mismo sprint de Mes 2 si no existe.
3. Contenido de la ficha: datos del vehículo, galería de fotos (depende del context `files/` — ver `docs-arquitectura-ajustes-infra.md` sección 2, tabla `files.vehicle_photos`, **tampoco implementado todavía**, es scaffold), datos de ubicación del seller (sección 1 IN: "ubicación del seller" — requiere que `Seller` o `Vehicle` expongan esa info, a confirmar el shape exacto), y el CTA de "Agendar visita" (que depende del contrato de `scheduling`, ver sección 4 de este documento — **no se puede conectar todavía**, solo dejar el botón con un placeholder/modal deshabilitado o "próximamente").
4. **Esta página tiene una dependencia dura**: sin fotos reales (context `files`) la ficha se ve incompleta. Evaluar con @po si se lanza en Mes 2 con un placeholder de imagen genérica mientras `files/` se implementa en paralelo, o si se pospone la ficha completa hasta que `files/` tenga al menos `POST /vehicles/:id/photos` funcionando.

### 3.5 Filtros: qué se puede hacer YA vs. qué falta confirmar

| Filtro | ¿Backend lo soporta hoy? | Acción |
|---|---|---|
| Marca (`brand_id`) | Sí, vía `GET /brands` + filtro en `GET /vehicles` — **confirmar si `GET /vehicles` acepta query param `brandId`** (no confirmado en exploración, revisar controller). | Bajo riesgo, aplicar si existe; si no, pedir a @developer agregarlo (cambio pequeño). |
| Categoría/Tipo | Igual que marca. | Igual. |
| Precio (rango) | No confirmado. | Confirmar con @developer si `GET /vehicles` soporta `minPrice`/`maxPrice`; si no, agregar. |
| Ubicación del seller | No confirmado si `Vehicle`/`Seller` expone ciudad/zona filtrable (MVP es "solo Bogotá", sección 1 IN — puede no requerir filtro real, solo mostrar el dato). | Confirmar alcance real con @po: ¿se necesita filtrar por zona de Bogotá o solo mostrar la ubicación en la ficha? |

---

## 4. Scheduling (agendamiento): qué adelantar en frontend vs. qué esperar

### 4.1 Lo que NO se puede conectar todavía (bloqueado, no inventar)

El context `scheduling` del backend **hoy es solo entidades scaffold** (`AGENTS.md`: "Scaffold (entity only)"). El diseño técnico (`docs-arquitectura-mes1-scheduling.md` + `docs-db-spec-mes1-scheduling.md`) define:
- Casos de uso (`createAppointment`, `confirmRsvp`, `recordSellerResult`, `recordCustomerResult`, `submitRating`, etc.).
- Entidades TypeORM completas.

**Pero NO define todavía**:
- Las rutas HTTP concretas (`POST /appointments`, `POST /appointments/:id/rsvp`, etc. — nombres, verbos, y DTOs de request/response no están en ninguno de los documentos revisados).
- El formato exacto de respuesta de cada endpoint (aunque debería seguir el estándar `{ message, record }` del proyecto, falta que @architect/@developer lo confirmen al implementar el `SchedulingController`).
- El contrato del endpoint público sin login para el link de un clic (`GET/POST /appointments/customer-result/:token`, mencionado en `docs-arquitectura-mes1-scheduling.md` sección 7 como ejemplo, pero no formalizado como spec de API).

**Yo (developer) no voy a inventar este contrato.** Falta que **@architect** (o quien implemente el `SchedulingController` en Mes 1) defina y documente las rutas REST exactas, y **@db** confirme que el shape de entidades ya especificado se mantiene sin cambios al momento de escribir los DTOs. Hasta que exista ese contrato (aunque sea un borrador de rutas + DTOs, no hace falta que esté implementado en código, pero sí especificado), el frontend no puede escribir las llamadas HTTP reales de scheduling.

### 4.2 Lo que SÍ se puede adelantar en frontend ya, sin bloquear

Trabajo de bajo riesgo que no depende del contrato de API, ejecutable en paralelo a que Mes 1 termine `scheduling`:

1. **Estructura de carpetas/páginas** (scaffolding puro, sin lógica de red):
   - `main_client/src/pages/Scheduling/` (o el nombre que defina convención del proyecto) con subcarpetas para: selección de fecha/hora, confirmación de cita, "mis citas" (dashboard customer), dashboard seller de agendas.
2. **Componentes de UI de selección de fecha/hora** (calendario/selector de slot):
   - Componente presentacional puro (recibe `slots disponibles` como prop, emite `onSelect(slot)`), sin fetch real — se puede maquetar y probar visualmente con datos mock hoy mismo.
   - Evaluar librería (ej. `react-datepicker` o similar ya usada en el proyecto — revisar dependencias de `main_client/package.json` antes de agregar una nueva) para el selector de fecha; la lista de horarios disponibles es un componente propio simple (lista de chips/botones).
3. **Estado de la app para el flujo de agendamiento** (sin red):
   - Definir el shape del estado local (ej. `selectedVehicle`, `selectedSlot`, `step` del wizard de agendamiento) usando el mismo patrón de manejo de estado que ya usa el proyecto (revisar si usan Context API, Redux, o solo hooks locales en `Admin/Vehicles` antes de decidir — no introducir una librería nueva de estado sin necesidad).
4. **Badge de estado del vehículo en el catálogo** (sección 3.3 de este documento) — ya se puede dejar el campo condicional listo, aunque el backend no emita el valor `active_appointment` todavía; el componente simplemente no se activa hasta que el dato llegue.
5. **Wireframes/mock de la pantalla "Mis citas" (customer) y "Agendas" (seller dashboard)** con datos hardcodeados — permite validar UX con @po sin esperar el backend, y acelera la conexión real una vez el contrato exista (solo cambiar el mock por el fetch real).

### 4.3 Explícitamente pendiente antes de conectar

| Falta definir | Quién |
|---|---|
| Rutas REST exactas de `scheduling` (`POST /appointments`, etc.), DTOs de request/response | @architect + @developer al implementar `SchedulingController` en Mes 1 |
| Formato de respuesta del endpoint público del link de un clic (¿requiere JSON, redirect a una página de agradecimiento, o ambos?) | @architect + @po (es UX, no solo técnico — el link se abre desde un email) |
| Naming final del badge de estado (`"con_cita_activa"` es provisional, pendiente UX según `docs-db-spec-mes1-scheduling.md` sección 3.7 y `mvp-refinamiento-mvp1.md` sección 7) | @po/UX |
| Si `GET /vehicles` va a incluir el estado derivado de cita en el mismo payload o si el frontend debe hacer un fetch aparte por vehículo | @architect (impacta cómo se implementa el badge en el catálogo paginado) |

---

## 5. Migración del Admin/CRUD de vehículos al backend nuevo

### 5.1 Estado actual confirmado
- `main_client/src/pages/Admin/Vehicles/` (`useVehicles.js`, `useCreateVehicle.jsx`) — CRUD funcional, pero apuntando a las rutas legacy vía gateway (`vehicles/vehicles`, etc., mismo problema de prefijo de la sección 3.2).
- El formato de respuesta del backend nuevo (`{ message, record }` / paginación `{ currentPage, limit, totalPages, totalItems, rows }`) es, según lo explorado, **compatible en estructura** con lo que el hook legacy probablemente ya espera (a confirmar leyendo `useVehicles.js` línea por línea antes de tocarlo — no asumir 100%, revisar cómo desestructura la respuesta hoy).

### 5.2 Plan de migración

1. Aplicar el mismo ajuste de rutas de la sección 3.2 (`vehicles_api.js` sin prefijo duplicado) — este archivo es compartido entre el catálogo público y el admin, un solo cambio beneficia a ambos.
2. Revisar `useVehicles.js` (fetch de listado paginado): confirmar que ya desestructura `{ currentPage, limit, totalPages, totalItems, rows }` o si asume un shape distinto del legacy (`common/httpResponses.js`/`pagination.js` sugiere que el legacy ya usa una paginación parecida — **validar si son 100% compatibles o requieren ajuste de nombres de campo** antes de dar por hecho que "no hay que tocar nada").
3. Revisar `useCreateVehicle.jsx` (creación/edición): confirmar que el DTO enviado en camelCase (`categoryId`, `brandId`, etc.) ya coincide con lo que espera `CreateVehicleDto`/`UpdateVehicleDto` del backend nuevo (`AGENTS.md` confirma que ambos usan camelCase, así que el riesgo es bajo, pero falta comparar campo por campo si hay alguno adicional/faltante entre legacy y nuevo, ej. campos de `files`/fotos que el nuevo esquema podría no tener listos aún).
4. Aplicar el cambio de auth de la sección 2.2 (header `Authorization: Bearer`) — el CRUD de vehículos hoy corre sin guard real en el legacy (gotcha #4 de AGENTS.md); en el backend nuevo, confirmar si `POST /vehicles`/`PUT /vehicles/:id` están detrás de `JwtAuthGuard` (deberían estarlo, es un endpoint de seller autenticado) — si es así, el Admin **no funcionará sin que el login real ya esté conectado** (dependencia directa de la sección 2 de este documento, debe ir después, no antes).
5. Smoke test manual: crear, listar, editar un vehículo de prueba contra `backend/` real, confirmar que los catálogos de referencia (marca, categoría, etc.) usados en los formularios (`Forms/`) también apuntan a las rutas corregidas.

### 5.3 Dependencia dura
La migración del Admin **depende de que la sección 2 (auth real) esté conectada primero**, porque el CRUD de vehículos en el backend nuevo probablemente requiere un JWT válido de un usuario `seller` — a diferencia del legacy donde el JWT existe pero no se enforce (gotcha #4). Esto invierte el orden "natural" de migrar el admin antes que el login; **el login va primero**.

---

## 6. Plan de sprints dentro de Mes 2 (11 oct – 11 nov)

Contexto del cronograma (`mvp-refinamiento-mvp1.md` sección 5, Mes 2): "Migrar `main_client` para apuntar al backend nuevo, retirando el gateway... Landing pública... y dashboard seller... Badge de estado del vehículo... Máquina de estados de cierre de cita". El hito de cierre de Mes 2 es "congelamiento de alcance MVP".

### Quincena 1 de Mes 2 (11–24 oct) — **puede arrancar YA, sin esperar nada de Mes 1 restante**

Todo lo de esta quincena depende únicamente de lo que **ya está implementado hoy** en `backend/` (`iam` + `vehicles` + referencia). No bloquea ni es bloqueado por el trabajo de `scheduling` de Mes 1.

1. Puerto/URL base (sección 1) — 0.5 día, trivial.
2. Wrapper de axios: header `Bearer` + interceptor 401 (sección 2.2) — 1 día.
3. `vehicles_api.js`: corregir rutas sin prefijo duplicado (sección 3.2) — 0.5 día.
4. `Login` real conectado a `POST /auth/login` (sección 2.4) — 1-2 días, incluye confirmar shape exacto de DTO/respuesta con quien implementó `iam`.
5. `Register` nueva pantalla (sección 2.5) — 1-2 días.
6. Migrar `Admin/Vehicles` (sección 5) — 2-3 días, **después** de que Login esté funcionando (dependencia dura, sección 5.3).
7. En paralelo (otra persona del equipo o mismo dev en tiempo muerto): scaffolding de carpetas/componentes de scheduling sin red (sección 4.2) — no bloquea nada, se puede intercalar.

**Entregable de checkpoint (día ~10-12 de Mes 2)**: login real funcionando, Admin de vehículos migrado y operando 100% contra `backend/` nuevo, gateway apagado en el flujo de dev diario.

### Quincena 2 de Mes 2 (25 oct – 11 nov) — **depende parcialmente de qué tan avanzado esté Mes 1**

1. Catálogo público (`Home` → landing real, sección 3.3) — depende solo de `vehicles`/`referencia`, **no bloqueado por scheduling**. 3-4 días.
2. Ficha de detalle de vehículo (sección 3.4) — depende de confirmar/crear `GET /vehicles/:id` (bajo riesgo, coordinar con @developer de `vehicles`) y de si `files/` ya tiene algo funcionando (si no, placeholder de imagen). 3-4 días.
3. Badge de estado del vehículo — **el frontend deja el campo listo desde la quincena 1**, pero **se activa realmente solo si Mes 1 ya sembró `active_appointment` y `GET /vehicles` lo devuelve**. Si Mes 1 se retrasa, este ítem se corre a Mes 3 sin bloquear el resto.
4. Conexión real de scheduling (agendar desde la ficha, "mis citas", dashboard seller de agendas) — **bloqueado por el contrato de API de `scheduling`** (sección 4.3). Si el contrato está listo a mitad de Mes 2, se conecta aquí; si no, se corre a inicio de Mes 3, y el hito de "congelamiento de alcance MVP" de fin de Mes 2 se ajusta solo en esta pieza puntual (a comunicar a @po si ocurre).

### Qué NO depende de Mes 1 y por tanto no tiene excusa para retrasarse
- Puerto/URL base, auth (login/register), Admin de vehículos migrado, catálogo público, ficha básica de vehículo (sin badge de cita activa). Todo esto usa endpoints **ya implementados hoy**.

### Qué sí depende de que Mes 1 (`scheduling`) entregue su contrato de API
- Botón "Agendar visita" funcional en la ficha, badge de estado "con cita activa" con dato real, dashboard de agendas del seller, pantalla "mis citas" del customer.

---

## 7. Resumen de archivos a tocar (para cuando se ejecute, no en esta entrega)

| Archivo | Cambio |
|---|---|
| `main_client/.env` | `VITE_BASE_URL=http://localhost:3000` |
| `main_client/src/core/axios/index.js` | Header `tk` → `Authorization: Bearer`, interceptor 401 |
| `main_client/src/core/api/vehicles_api.js` | Quitar prefijo `vehicles/` duplicado en rutas de referencia |
| `main_client/src/pages/Login/useLogin.js` | Descomentar/reescribir `handleSubmit` contra `POST /auth/login` real |
| `main_client/src/pages/Register/` (nueva carpeta) | Pantalla + hook `useRegister.js` contra `POST /auth/register` |
| `main_client/src/pages/Home/index.jsx` | Reemplazar mock por fetch real de `GET /vehicles` + filtros |
| `main_client/src/pages/VehicleDetail/` (nueva carpeta) | Ficha de detalle, depende de confirmar `GET /vehicles/:id` |
| `main_client/src/pages/Admin/Vehicles/useVehicles.js`, `useCreateVehicle.jsx` | Validar/ajustar shape de respuesta y DTO contra backend nuevo |
| `main_client/src/pages/Scheduling/` (nueva carpeta, solo estructura/UI) | Scaffolding sin red, no bloqueante |
| `backend/src/contexts/vehicles/` (a coordinar con @developer de ese context, no en esta tarea de frontend) | Posible endpoint nuevo `GET /vehicles/:id` si no existe |

## 8. Qué falta probar (para @qa, una vez implementado)

1. Login real: token guardado correctamente, expiración manejada (401 → logout), roles `buyer`/`seller` navegan a destinos correctos.
2. Register: validaciones de formulario, mensaje de verificación de email si ya está implementado en Mes 1.
3. Admin CRUD de vehículos: crear/editar/listar contra backend nuevo con JWT real, catálogos de referencia (marca, categoría, etc.) poblados correctamente en los formularios.
4. Catálogo público: paginación, filtros (marca/categoría/tipo funcionando; precio y ubicación según lo que finalmente soporte el backend), estado vacío (sin vehículos).
5. Ficha de detalle: datos completos, comportamiento con/sin fotos (placeholder si `files/` no está listo).
6. Confirmar que el gateway apagado no rompe ningún flujo E2E existente (smoke test general de toda la app tras el cambio de puerto/URL).
7. (Cuando el contrato de scheduling exista) Flujo completo de agendar → badge se activa → dashboard seller ve la cita.
