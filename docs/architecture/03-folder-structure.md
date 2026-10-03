# 3. Folder Structure

```text
whatsapp-saas-platform/
├─ backend/
│  ├─ src/
│  │  ├─ app/
│  │  │  ├─ auth/
│  │  │  ├─ tenants/
│  │  │  ├─ users/
│  │  │  ├─ contacts/
│  │  │  ├─ groups/
│  │  │  ├─ whatsapp/
│  │  │  ├─ messaging/
│  │  │  ├─ campaigns/
│  │  │  ├─ media/
│  │  │  ├─ reports/
│  │  │  ├─ logs/
│  │  │  ├─ settings/
│  │  │  ├─ webhooks/
│  │  │  ├─ health/
│  │  │  └─ common/
│  │  ├─ config/
│  │  ├─ main.ts
│  │  └─ app.module.ts
│  ├─ test/
│  ├─ package.json
│  └─ tsconfig.json
├─ frontend/
│  ├─ src/
│  │  ├─ app/
│  │  │  ├─ core/
│  │  │  │  ├─ auth/
│  │  │  │  ├─ guards/
│  │  │  │  ├─ interceptors/
│  │  │  │  ├─ models/
│  │  │  │  ├─ services/
│  │  │  │  └─ config/
│  │  │  ├─ layout/
│  │  │  │  ├─ sidebar/
│  │  │  │  ├─ header/
│  │  │  │  └─ footer/
│  │  │  ├─ shared/
│  │  │  │  ├─ components/
│  │  │  │  ├─ directives/
│  │  │  │  ├─ pipes/
│  │  │  │  └─ validators/
│  │  │  ├─ features/
│  │  │  │  ├─ dashboard/
│  │  │  │  ├─ contacts/
│  │  │  │  ├─ groups/
│  │  │  │  ├─ messaging/
│  │  │  │  ├─ campaigns/
│  │  │  │  ├─ media/
│  │  │  │  ├─ reports/
│  │  │  │  ├─ logs/
│  │  │  │  ├─ whatsapp/
│  │  │  │  └─ settings/
│  │  │  ├─ app.routes.ts
│  │  │  ├─ app.config.ts
│  │  │  └─ app.component.ts
│  │  ├─ assets/
│  │  ├─ environments/
│  │  └─ styles/
│  ├─ package.json
│  └─ tsconfig.json
├─ database/
│  ├─ migrations/
│  ├─ seeds/
│  └─ schema/
├─ docker/
│  ├─ backend.Dockerfile
│  ├─ frontend.Dockerfile
│  ├─ worker.Dockerfile
│  ├─ nginx/
│  └─ compose/
├─ docs/
│  └─ architecture/
├─ scripts/
├─ .env.example
├─ docker-compose.yml
├─ package.json
├─ README.md
└─ .gitignore
```

## Folder responsibility

- `backend/` is the application runtime and service layer.
- `frontend/` is the UI runtime and interactive business layer.
- `database/` keeps schema evolution and seed data.
- `docker/` contains container definitions and reverse proxy configuration.
- `docs/architecture/` stores the architecture and design blueprint.
