# AGENTS.md — Segunda

## Architecture

Modular monolith (NestJS) in `backend/` — single process, PostgreSQL, schemas per bounded context.

Production (Docker): backend:3000 + postgres:5432 + main_client:5173.
Dev (local): backend reads `.env` (DB on localhost:5433, port 3000).

## Project structure

```
backend/        ← Modular monolith (NestJS, intended architecture). Migration of vehicles
                   is complete; sellers/scheduling/files are scaffolds in progress inside
                   the monolith itself (backend/src/contexts/<name>/), no standalone
                   services exist anymore.
vehicles_service/ ← Legacy Express/Sequelize (still the production API)
gateway_service/ ← Express proxy (only routes /vehicles → legacy:3005)
main_client/     ← React + Vite + MUI
common/          ← JS utils (httpResponses.js, pagination.js, used by legacy)
```

**Frontend calls gateway:3000 → gateway proxies /vehicles → legacy:3005.**
New `backend/` is not yet connected to the frontend. When ready: update main_client `.env` `VITE_BASE_URL` and remove gateway.

## Database

Single PostgreSQL, 5 schemas created by `backend/init-schemas.sql`:
`iam`, `vehicles`, `sellers`, `scheduling`, `files`.

Each TypeORM entity has `@Entity({ schema: '...' })`.

Legacy `vehicles_service` uses its own schema config (`config.schemaOne`, default `public`).

### Working with migrations while `synchronize: true` is active in dev

In local dev, `DatabaseModule` runs with `synchronize: process.env.NODE_ENV !== 'production'`, so
TypeORM auto-creates/alters tables from entities every time the app boots. This is convenient for
day-to-day dev but it means the DB schema in your local Postgres can silently drift **ahead** of
what the migrations in `src/migrations/` describe (e.g. `synchronize` creates `files.vehicle_photos`
before anyone writes the matching migration). When that migration is later added and you try
`npm run migration:run`, it fails with `relation "..." already exists` — TypeORM's migration
runner has no idea `synchronize` already built that object.

**Rule of thumb: migrations are the source of truth, `synchronize` is just a dev convenience.**
Whenever you add a new migration, verify it can run cleanly against a schema that reflects only
previously-run migrations (not whatever `synchronize` happens to have built locally).

If `npm run migration:run` fails with "already exists" in your local dev DB:

1. **Preferred (no data loss risk beyond your own local disposable dev data):** reset the 5
   context schemas and re-run migrations from zero, then let the app reseed on next boot
   (seeding is idempotent — see "Key conventions"). Only do this against your **local dev**
   Postgres (`localhost:5433` container), never against a shared/staging DB, and only if you
   don't have local data you care about (check row counts first: `iam.users`, `vehicles.vehicles`,
   `sellers.sellers`, `scheduling.appointments`, `files.vehicle_photos`).

   ```sql
   -- run against your local dev DB only
   DROP SCHEMA IF EXISTS iam CASCADE;
   DROP SCHEMA IF EXISTS vehicles CASCADE;
   DROP SCHEMA IF EXISTS sellers CASCADE;
   DROP SCHEMA IF EXISTS scheduling CASCADE;
   DROP SCHEMA IF EXISTS files CASCADE;
   DROP TABLE IF EXISTS migrations; -- TypeORM's migration bookkeeping table, lives in public
   ```

   Then recreate the schemas (`backend/init-schemas.sql` or `CREATE SCHEMA iam; ...` for each) and
   run `npm run migration:run`. Start the app afterwards so seed data repopulates.

2. **Alternative (no reset, keep existing data):** if the objects `synchronize` already created are
   byte-for-byte equivalent to what the migration would create (no new/renamed columns, same
   constraint semantics), you can mark the migration as already applied without re-running its SQL
   by inserting a row directly into the `migrations` table:

   ```sql
   INSERT INTO migrations (timestamp, name) VALUES (1789200000000, 'CreateVehiclePhotos1789200000000');
   ```

   Use this only as a last resort and only when you've manually confirmed the existing DB objects
   match the migration exactly — otherwise you risk a schema that diverges from what migrations
   describe (e.g. a migration that adds a `UNIQUE` constraint under one name silently no-ops while
   `synchronize` already added an equivalent constraint under TypeORM's auto-generated name,
   leaving two differently-named constraints on future clean installs vs. your machine).

Before opening a PR with a new migration, it's good practice to sanity-check it against a clean
schema (option 1) rather than assuming your local `synchronize`-built DB matches what a fresh
`npm run migration:run` would produce on staging/prod (where `synchronize` is always `false`).

## Commands

```bash
# Backend (modular monolith)
cd backend
npm run start:dev      # watch mode, port 3000
npm run build           # → dist/
npm test                # Jest
npm run migration:generate -- src/common/database/data-source.ts src/migrations/MigrationName
npm run migration:run

# Legacy vehicle service (Express)
cd vehicles_service
npm run dev             # nodemon, port 3005

# Gateway
cd gateway_service
npm run dev             # nodemon, port 3000

# Frontend
cd main_client
npm run dev             # Vite, port 5173
npm run build           # → dist/
```

## Contexts architecture

Each context in `backend/src/contexts/<name>/` is a NestJS module with its own controllers, services, entities, and DTOs. Contexts communicate in-process via exported services.

| Context | Schema | Status |
|---------|--------|--------|
| `iam/` | `iam` | Auth (register, login, JWT) — implemented |
| `vehicles/` | `vehicles` | CRUD vehicles + reference data — implemented |
| `sellers/` | `sellers` | Implemented — `GET /sellers` (list), `PATCH /sellers/:id/verify` |
| `scheduling/` | `scheduling` | Implemented — appointments CRUD/RSVP/results/ratings/dispute notes, plus 5 cron jobs (`jobs/*.job.ts`: release expired slots, 24h/2h reminders, close-of-cycle link, expire customer-result window) |
| `files/` | — | Scaffold (empty module — no controllers/providers yet) |
| `notifications/` | — | Implemented — `NotificationsService` + `EmailChannel` + `templates.ts`. Not imported directly in `app.module.ts`; only registered as a dependency of `SchedulingModule` |

## API endpoints (new backend)

```
POST /auth/register          # register user
POST /auth/login             # login, returns JWT
GET  /vehicles               # paginated list
POST /vehicles               # create vehicle
PUT  /vehicles/:id           # update vehicle
GET  /brands                 # paginated
GET  /categories             # paginated
GET  /engine_types           # paginated
GET  /transmissions          # paginated
GET  /types                  # paginated
GET  /status                 # paginated

GET  /sellers                          # paginated, internal roles: admin/asesor/operador
PATCH /sellers/:id/verify              # internal roles: admin/asesor

POST /appointments                             # create appointment (buyer)
GET  /appointments                             # list; internal role sees all (filter by isDisputed), business user sees own (as buyer or seller)
GET  /appointments/:id                         # detail + disputeNotes; 403 if business user isn't buyer/seller
PATCH /appointments/:id/rsvp                   # buyer confirms RSVP
PATCH /appointments/:id/seller-result          # seller records result (requires seller profile)
GET  /appointments/customer-result/:token      # @Public() — one-click link, no auth
POST /appointments/customer-result/:token      # @Public() — customer records result via token
POST /appointments/:id/dispute-notes           # internal roles: admin/asesor
POST /appointments/:id/ratings                 # buyer or seller submits rating (raterRole in body)
```

Response format: `{ message, record }` / `{ message, records }` / `{ currentPage, limit, totalPages, totalItems, rows }`.
Errors: `{ errors: { message } }`.

Note: some `scheduling`/`sellers` endpoints above return raw service objects (not wrapped the same way as vehicles), since `ResponseInterceptor` wraps whatever the controller returns — check each controller method if exact shape matters.

## Key conventions

- `synchronize: process.env.NODE_ENV !== 'production'` (TypeORM auto-creates tables in dev). **Disabled in prod**, use migrations (`src/migrations/`).
- Seed data runs on startup (idempotent — skips if rows exist).
- Vehicle `plate` is unique (case-sensitive `^[A-Z0-9]{1,10}$` in legacy; no regex in new entity).
- DTOs use `class-validator` + `class-transformer`. `UpdateVehicleDto = Partial<CreateVehicleDto>` (imported as `type`).
- Auth uses `@nestjs/passport` + `@nestjs/jwt`. Guard: `JwtAuthGuard`, applied globally via `APP_GUARD`. Endpoints are protected by default; use `@Public()` (`src/common/decorators/public.decorator.ts`) to opt out (e.g. `/auth/register`, `/auth/login`, `GET /vehicles`, reference endpoints).
- `JWT_SECRET` is required (no hardcoded fallback) — the app throws at bootstrap if it's missing from the environment. See `backend/.env.example`.
- Backend uses `commonjs` module (tsconfig). `emitDecoratorMetadata` + `experimentalDecorators` on.

## Gotchas

1. `update-vehicle.dto.ts` is a `type` alias, must be imported with `import type` in decorated controllers.
2. ResponseInterceptor wraps all successful responses; HttpExceptionFilter wraps errors. Both are global (`APP_FILTER`, `APP_INTERCEPTOR`).
3. Legacy `vehicles_service` uses camelCase body fields (`categoryId`, `brandId`...). New backend DTOs use the same convention and map to `snake_case` DB columns.
4. The legacy service has JWT in deps and a `tk` header in frontend, but auth is not enforced anywhere (bypassed). New backend has real JWT auth.
5. Gateway has a typo `"expres"` in its `package.json` (extra dep, harmless).
6. `npm` is the package manager for all services (not pnpm, despite root having pnpm-lock.yaml). When adding deps, use `npm install`.
