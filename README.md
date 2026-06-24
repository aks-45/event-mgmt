# IIA Event ID Card & QR Management System

Production-ready **PERN** application (PostgreSQL, Express, React, Node.js) for the **Indian Industries Association (IIA)**.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 18, Vite, Tailwind CSS, Axios |
| Backend | Node.js, Express, **pg** (node-postgres) |
| Database | **Local PostgreSQL** |
| Auth | JWT, bcrypt |

## Local PostgreSQL setup

### 1. Install PostgreSQL

Download and install from [postgresql.org](https://www.postgresql.org/download/windows/) (or use your OS package manager).

During setup, note your **postgres user password**.

### 2. Create the database

Open **psql** or **pgAdmin** and run:

```sql
CREATE DATABASE iia_event;
```

### 3. Configure `server/.env`

```env
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your_actual_password
PGDATABASE=iia_event
```

### 4. Install dependencies, create tables, seed

```powershell
cd server
npm install
npm run db:init
npm run seed
npm run dev
```

### 5. Frontend

```powershell
cd client
npm install
npm run dev
```

Open **http://localhost:5173**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@iia.org | Admin@123 |
| Operator | operator@iia.org | Operator@123 |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run db:init` | Create tables from `server/sql/schema.sql` |
| `npm run seed` | Insert default users & event settings |
| `npm run dev` | Start API with hot reload |

## Project structure

```
server/
├── sql/schema.sql       # Table definitions
├── config/pool.js       # pg connection pool
├── repositories/        # SQL queries
└── controllers/         # API logic
```

## Environment variables

Use either `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` **or** a single `DATABASE_URL`:

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/iia_event
```

See `server/.env.example` for all options.

## License

Proprietary — Indian Industries Association (IIA).
