# 🚀 MsgFlow SaaS — 1,000 Concurrent Users Deployment & Scaling Architecture

This document (Guide) provides a detailed guide for running the **MsgFlow WhatsApp SaaS Platform** securely, efficiently, and with zero downtime on a cloud or VPS environment for **1,000+ active users/business tenants**.

---

## 🖥️ 1. Server Hardware & Infrastructure Sizing (1000 Users)

| Component           | Minimum Spec (1000 Users)          | Recommended (High Availability)            |
| :------------------ | :--------------------------------- | :----------------------------------------- |
| **Server / VPS**    | 4 vCPU, 8 GB RAM                   | 8 vCPU, 16 GB RAM                          |
| **Database**        | PostgreSQL 16 (4 GB RAM allocated) | Managed PostgreSQL (RDS / DigitalOcean DB) |
| **Caching / Queue** | Redis 7 (2 GB RAM)                 | Managed Redis (Upstash / Redis Cloud)      |
| **Storage (Media)** | 50 GB NVMe SSD                     | S3 / Cloudflare R2 / MinIO                 |
| **OS**              | Ubuntu 22.04 / 24.04 LTS           | Ubuntu LTS / Debian                        |

---

## ⚡ 2. 1000 Users Concurrency Optimizations Implemented in Code

1. **Atomic File Locking & Multi-Tenant Storage (`storage.util.ts`):**

   * `atomicWriteJson()` and `safeReadJson()` ensure that files do not become corrupted or locked even when hundreds of users simultaneously update campaigns, reports, or settings.

2. **RAM & OOM (Out-of-Memory) Protection:**

   * Message history is limited to approximately 1,000–5,000 records in RAM, while older records are automatically archived to disk/database storage.

3. **Multi-Core PM2 Cluster Mode (`ecosystem.config.js`):**

   * `instances: 'max'` allows multiple backend processes to run across all available CPU cores.

4. **PostgreSQL Connection Pooling (`database.service.ts`):**

   * The connection pool is configured with `DATABASE_POOL_MAX=50-100` to handle requests from up to 1,000 concurrent users.

5. **Universal Host & CORS Binding (`main.ts`):**

   * Uses `0.0.0.0` host binding with dynamic CORS support.

---

## 🐳 3. Quick Deployment via Docker Compose

```bash
# 1. Clone & enter repository
cd whatsapp-saas-platform

# 2. Setup production environment file
cp .env.example .env

# 3. Build & launch all containers (Postgres, Redis, MinIO, Backend, Frontend, Nginx)
docker-compose up -d --build

# 4. Check status
docker-compose ps
```

---

## ⚙️ 4. Deployment via PM2 on Ubuntu/VPS (Direct Node.js)

```bash
# 1. Install Node.js 20 & PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

sudo apt install -y nodejs

sudo npm install -g pm2

# 2. Build Backend & Frontend
cd backend && npm install && npm run build

cd ../frontend && npm install && npm run build

# 3. Start Backend with PM2 Multi-Core Cluster
cd ..

pm2 start ecosystem.config.js

pm2 save

pm2 startup
```

---

## 🌐 5. Production Nginx Reverse Proxy Config (`/etc/nginx/sites-available/msgflow`)

```nginx
server {
    listen 80;

    server_name app.msgflow.com;

    # Frontend Static Files
    location / {
        root /var/www/msgflow/frontend/dist/whatsapp-saas-frontend/browser;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API & Swagger
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50M;
    }
}
```

---

## 🛡️ 6. Support & Contact

For any issues or server setup assistance:

* **Lead Architect:** Vinayak Bhoskar
* **Direct Phone:** +91 7499415916
* **Email:** [vinayak725bhoskar@gmail.com](mailto:vinayak725bhoskar@gmail.com)
