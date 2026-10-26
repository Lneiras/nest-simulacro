# Hotel Reservations API (NestJS performance-test simulation)

REST API for **Arenosa Hoteles S.A.S.** (a fictional hotel chain in Barranquilla).
It registers and queries room reservations, controls what each user can do
according to their role, and protects every endpoint with an API Key.

## Tech stack

- Node.js and NestJS 11 (project created with the Nest CLI), TypeScript
- TypeORM with PostgreSQL (running in Docker)
- `class-validator` / `class-transformer` for DTO validation
- `@nestjs/config` for environment variables (`.env`)
- `@nestjs/swagger` for the API documentation

## Requirements

- Node.js 20 or newer and npm
- Docker with Docker Compose (only used to run PostgreSQL)

## Installation and execution

```bash
# 1. Clone the repository and install the dependencies
git clone https://github.com/Lneiras/nest-simulacro.git
cd nest-simulacro
npm install

# 2. Create your own .env file from the example
cp .env.example .env

# 3. Start PostgreSQL in a Docker container
docker compose up -d

# 4. Start the API (the table is created automatically on startup)
npm run start:dev
```

- API: <http://localhost:3000>
- Swagger documentation: <http://localhost:3000/docs>

The database must be running **before** the API starts.

Useful commands:

```bash
docker compose down        # stop PostgreSQL (the data is kept in a Docker volume)
docker compose down -v     # stop PostgreSQL and delete all the data
npm run build              # compile the project
```

## Environment variables

Defined in `.env` (use `.env.example` as a template).

| Variable      | Description                                                                 |
| ------------- | --------------------------------------------------------------------------- |
| `PORT`        | Port where the API runs.                                                    |
| `DB_HOST`     | PostgreSQL host (`localhost` because Docker publishes the port).            |
| `DB_PORT`     | PostgreSQL port. Also used by `docker-compose.yml`.                         |
| `DB_USER`     | PostgreSQL user. Also used by `docker-compose.yml`.                         |
| `DB_PASSWORD` | PostgreSQL password. Also used by `docker-compose.yml`.                     |
| `DB_NAME`     | Database name. Also used by `docker-compose.yml`.                           |
| `API_KEYS`    | Valid API Keys separated by commas (for example, one per branch). Spaces around the commas are ignored. |

The keys in `.env.example` are fictitious. Valid keys are never written in the source code.

## Test users

Users live in memory (`src/usuarios/usuarios.service.ts`); there is no login.
The user is identified with the `x-user` header and the role always comes from the
user found by the API, never from the client. This mechanism is academic only and
is not a real authentication system.

| `x-user` | Role            |
| -------- | --------------- |
| `admin1` | `admin`         |
| `coord1` | `coordinador`   |
| `recep1` | `recepcionista` |
| `recep2` | `recepcionista` |

There are two receptionists to show that one cannot access the other one's reservations.

## Endpoints

Every endpoint requires both headers: `x-api-key` (a valid key from `API_KEYS`) and
`x-user` (one of the test users).

| Method  | Endpoint                | Description                                              |
| ------- | ----------------------- | -------------------------------------------------------- |
| `POST`  | `/reservas`             | Register a reservation.                                  |
| `GET`   | `/reservas`             | List the reservations the user may see (`?estado=` filter is optional). |
| `GET`   | `/reservas/:id`         | Get one reservation.                                     |
| `PATCH` | `/reservas/:id/estado`  | Change the status of a reservation.                      |

Successful responses use the format `{ "success": true, "data": ... }`.
Errors use `{ "success": false, "statusCode", "message", "path", "timestamp" }`.
The error messages are written in Spanish, like the rest of the code.

### Allowed status changes

| Current status | New status   | Who                                  |
| -------------- | ------------ | ------------------------------------ |
| `PENDIENTE`    | `CONFIRMADA` | admin, coordinador, owner recepcionista |
| `CONFIRMADA`   | `EN_CURSO`   | admin, coordinador, owner recepcionista |
| `EN_CURSO`     | `FINALIZADA` | admin, coordinador, owner recepcionista |
| `PENDIENTE`    | `CANCELADA`  | admin, coordinador                   |
| `CONFIRMADA`   | `CANCELADA`  | admin, coordinador                   |

`FINALIZADA` and `CANCELADA` are final states. Skipping states is not allowed.

## Why these HTTP status codes

| Code | Used when | Why this code and not another |
| ---- | --------- | ----------------------------- |
| `400 Bad Request` | The DTO is invalid (missing, empty or wrongly typed fields, unknown fields such as `id` or `estado`), the dates are wrong, the `?estado=` filter is not a valid status, the `id` is not a number, or an admin/coordinador sends a `recepcionista` that does not exist or is not a receptionist. | The problem is in the data the client sent. The invalid `recepcionista` is a wrong value in the body, not a missing resource in the URL, so it is not a 404. |
| `401 Unauthorized` | `x-api-key` is missing or invalid, or `x-user` is missing or does not exist. | The caller could not be identified. The endpoint logic is never executed. |
| `403 Forbidden` | A receptionist reads or changes a reservation of another receptionist, or tries to cancel a reservation. | The caller is identified but is not allowed to do it. I chose 403 instead of 404 for other people's reservations so the message is explicit; the trade-off is that it reveals that the id exists. |
| `404 Not Found` | The reservation id does not exist (or is bigger than the maximum id the database can store). | The resource in the URL does not exist. |
| `409 Conflict` | The status change is not allowed (skipping a state, going back, changing a final state, cancelling an `EN_CURSO` reservation). | The request is well formed and the user is allowed to change the status, but it conflicts with the **current state** of the reservation. It is not a 400 because the body is valid by itself (any real status is a valid value), and it is not a 403 because it is not a permission problem. The message includes the current and the requested status. |
| `500 Internal Server Error` | Only for unexpected errors (for example, the database is down). | The real error is written to the server log and the client only receives a generic message. Validation, authorization, missing resources and business conflicts are never turned into 500. |

The order of the checks is: guards (API Key, user, role) → `ValidationPipe` (DTO) → service (business rules).

## Design decisions

- **Database:** PostgreSQL in Docker instead of SQLite (approved by the tutor). `synchronize: true` creates the table automatically; this is convenient for a simulation, but a real project would use migrations.
- **Dates:** `fechaIngreso` and `fechaSalida` only accept the `YYYY-MM-DD` form of ISO 8601 (for example `2027-02-13`) and impossible dates such as `2027-02-30` are rejected. "In the past" means before today, so today is allowed.
- **Receptionist restriction:** the filter by receptionist is part of the SQL query (`WHERE`), it is not applied after loading all the rows.
- **Ownership on single queries:** `GET /reservas/:id` and `PATCH /reservas/:id/estado` apply the same ownership rule, so knowing an id gives no access.
- **No extra features:** there is no JWT, user table, pagination, deletion or any other feature that the requirements did not ask for.

## Project structure

```text
src/
├── main.ts                      # ValidationPipe, interceptor, filter and Swagger setup
├── app.module.ts                # ConfigModule and TypeORM (PostgreSQL) connection
├── auth/
│   ├── decorators/              # @Roles() and @CurrentUser()
│   ├── guards/                  # ApiKeyGuard, UsuarioGuard and RolesGuard
│   └── interfaces/              # Request type that carries the validated user
├── common/
│   ├── filters/                 # Custom Exception Filter
│   └── interceptors/            # Interceptor that standardizes successful responses
├── usuarios/                    # In-memory users and roles
└── reservas/
    ├── dto/                     # Create, change status and filter DTOs
    ├── entities/                # Reserva entity (TypeORM)
    ├── enums/                   # TipoHabitacion and EstadoReserva
    ├── reservas.controller.ts   # Routes (delegates to the service)
    ├── reservas.service.ts      # Business rules and status transitions
    └── reservas.module.ts
```

## Test evidence (curl)

These are the commands used to test the main scenarios, in order, on an **empty**
database (reservations get ids 1, 2 and 3). Each comment shows the HTTP status that
the API returned. They can also be tried from Swagger at `/docs`.

```bash
API=http://localhost:3000
KEY=clave-ficticia-sede-norte
KEY2=clave-ficticia-sede-malecon
JSON='Content-Type: application/json'

# Shows the response body followed by the HTTP status code
call() { curl -s -w "\nHTTP %{http_code}\n" "$@"; }

# 1. Missing API key -> 401
call $API/reservas -H "x-user: admin1"

# 2. Invalid API key -> 401
call $API/reservas -H "x-api-key: clave-mala" -H "x-user: admin1"

# 3. Second API key is also valid -> 200
call $API/reservas -H "x-api-key: $KEY2" -H "x-user: admin1"

# 4. Unknown x-user -> 401
call $API/reservas -H "x-api-key: $KEY" -H "x-user: fantasma"

# 5. Invalid DTO (empty name, non-numeric document, invalid room type) -> 400
call -X POST $API/reservas -H "x-api-key: $KEY" -H "x-user: recep1" -H "$JSON" -d '{"huesped":"","documentoHuesped":"abc","tipoHabitacion":"VIP","fechaIngreso":"2027-12-10","fechaSalida":"2027-12-12"}'

# 6. Check-out date equal to check-in date -> 400
call -X POST $API/reservas -H "x-api-key: $KEY" -H "x-user: recep1" -H "$JSON" -d '{"huesped":"Ana Perez","documentoHuesped":"1045678901","tipoHabitacion":"DOBLE","fechaIngreso":"2027-12-10","fechaSalida":"2027-12-10"}'

# 7. Check-in date in the past -> 400
call -X POST $API/reservas -H "x-api-key: $KEY" -H "x-user: recep1" -H "$JSON" -d '{"huesped":"Ana Perez","documentoHuesped":"1045678901","tipoHabitacion":"DOBLE","fechaIngreso":"2020-01-10","fechaSalida":"2020-01-12"}'

# 8. Protected field "estado" in the body -> 400
call -X POST $API/reservas -H "x-api-key: $KEY" -H "x-user: recep1" -H "$JSON" -d '{"huesped":"Ana Perez","documentoHuesped":"1045678901","tipoHabitacion":"DOBLE","fechaIngreso":"2027-12-10","fechaSalida":"2027-12-12","estado":"CONFIRMADA"}'

# 9. recep1 registers a reservation (the "recepcionista" in the body is ignored) -> 201
call -X POST $API/reservas -H "x-api-key: $KEY" -H "x-user: recep1" -H "$JSON" -d '{"huesped":"Ana Perez","documentoHuesped":"1045678901","tipoHabitacion":"DOBLE","fechaIngreso":"2027-12-10","fechaSalida":"2027-12-12","recepcionista":"recep2"}'

# 10. recep2 registers a reservation (using the second API key) -> 201
call -X POST $API/reservas -H "x-api-key: $KEY2" -H "x-user: recep2" -H "$JSON" -d '{"huesped":"Luis Gomez","documentoHuesped":"987654321","tipoHabitacion":"SUITE","fechaIngreso":"2027-12-20","fechaSalida":"2027-12-23"}'

# 11. admin registers without "recepcionista" -> 400
call -X POST $API/reservas -H "x-api-key: $KEY" -H "x-user: admin1" -H "$JSON" -d '{"huesped":"Marta Rios","documentoHuesped":"555666777","tipoHabitacion":"SENCILLA","fechaIngreso":"2027-12-15","fechaSalida":"2027-12-16"}'

# 12. admin registers with a user that is not a receptionist -> 400
call -X POST $API/reservas -H "x-api-key: $KEY" -H "x-user: admin1" -H "$JSON" -d '{"huesped":"Marta Rios","documentoHuesped":"555666777","tipoHabitacion":"SENCILLA","fechaIngreso":"2027-12-15","fechaSalida":"2027-12-16","recepcionista":"coord1"}'

# 13. admin registers with a valid receptionist -> 201
call -X POST $API/reservas -H "x-api-key: $KEY" -H "x-user: admin1" -H "$JSON" -d '{"huesped":"Marta Rios","documentoHuesped":"555666777","tipoHabitacion":"SENCILLA","fechaIngreso":"2027-12-15","fechaSalida":"2027-12-16","recepcionista":"recep2"}'

# 14. recep1 lists reservations (only their own) -> 200
call $API/reservas -H "x-api-key: $KEY" -H "x-user: recep1"

# 15. admin lists reservations (all of them) -> 200
call $API/reservas -H "x-api-key: $KEY" -H "x-user: admin1"

# 16. recep1 reads recep2's reservation -> 403
call $API/reservas/2 -H "x-api-key: $KEY" -H "x-user: recep1"

# 17. recep1 reads their own reservation -> 200
call $API/reservas/1 -H "x-api-key: $KEY" -H "x-user: recep1"

# 18. Reservation that does not exist -> 404
call $API/reservas/999 -H "x-api-key: $KEY" -H "x-user: admin1"

# 19. Invalid ?estado= filter -> 400
call "$API/reservas?estado=XYZ" -H "x-api-key: $KEY" -H "x-user: admin1"

# 20. recep2 filters by PENDIENTE (the filter is combined with the role restriction) -> 200
call "$API/reservas?estado=PENDIENTE" -H "x-api-key: $KEY" -H "x-user: recep2"

# 21. recep1 changes the status of recep2's reservation -> 403
call -X PATCH $API/reservas/2/estado -H "x-api-key: $KEY" -H "x-user: recep1" -H "$JSON" -d '{"estado":"CONFIRMADA"}'

# 22. recep1 tries to cancel their own reservation -> 403
call -X PATCH $API/reservas/1/estado -H "x-api-key: $KEY" -H "x-user: recep1" -H "$JSON" -d '{"estado":"CANCELADA"}'

# 23. Invalid change: PENDIENTE -> EN_CURSO (skips a state) -> 409
call -X PATCH $API/reservas/1/estado -H "x-api-key: $KEY" -H "x-user: recep1" -H "$JSON" -d '{"estado":"EN_CURSO"}'

# 24. recep1 changes their own reservation: PENDIENTE -> CONFIRMADA -> 200
call -X PATCH $API/reservas/1/estado -H "x-api-key: $KEY" -H "x-user: recep1" -H "$JSON" -d '{"estado":"CONFIRMADA"}'

# 25. recep1 filters by CONFIRMADA -> 200
call "$API/reservas?estado=CONFIRMADA" -H "x-api-key: $KEY" -H "x-user: recep1"

# 26. recep2 filters by CONFIRMADA (does not see recep1's reservation) -> 200
call "$API/reservas?estado=CONFIRMADA" -H "x-api-key: $KEY" -H "x-user: recep2"

# 27. coordinador cancels another receptionist's PENDIENTE reservation -> 200
call -X PATCH $API/reservas/3/estado -H "x-api-key: $KEY" -H "x-user: coord1" -H "$JSON" -d '{"estado":"CANCELADA"}'

# 28. Change a CANCELADA reservation (final state) -> 409
call -X PATCH $API/reservas/3/estado -H "x-api-key: $KEY" -H "x-user: admin1" -H "$JSON" -d '{"estado":"CONFIRMADA"}'
```

### Example responses

Successful response (`POST /reservas` as `recep1`, status `201`). The `recepcionista`
sent in the body (`recep2`) was ignored and the status is always `PENDIENTE`:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "huesped": "Ana Perez",
    "documentoHuesped": "1045678901",
    "tipoHabitacion": "DOBLE",
    "fechaIngreso": "2027-12-10",
    "fechaSalida": "2027-12-12",
    "recepcionista": "recep1",
    "estado": "PENDIENTE",
    "creadaEn": "2026-10-26T02:45:52.287Z",
    "actualizadaEn": "2026-10-26T02:45:52.287Z"
  }
}
```

Error response (invalid status change, status `409`):

```json
{
  "success": false,
  "statusCode": 409,
  "message": "No se puede cambiar el estado de PENDIENTE a EN_CURSO",
  "path": "/reservas/1/estado",
  "timestamp": "2026-10-26T02:45:52.486Z"
}
```
