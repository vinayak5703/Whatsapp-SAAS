# 🚀 MsgFlow SaaS — 1,000 Concurrent Users Deployment & Scaling Architecture

हा दस्तऐवज (Guide) **MsgFlow WhatsApp SaaS Platform** ला **1,000+ सक्रिय युझर्स / बिझनेस टेनंट्स** साठी क्लाउड किंवा VPS वर सुरक्षित, जलद आणि अखंड (Zero-Downtime) चालवण्यासाठी सविस्तर मार्गदर्शक आहे.

---

## 🖥️ 1. Server Hardware & Infrastructure Sizing (1000 Users)

| Component | Minimum Spec (1000 Users) | Recommended (High Availability) |
| :--- | :--- | :--- |
| **Server / VPS** | 4 vCPU, 8 GB RAM | 8 vCPU, 16 GB RAM |
| **Database** | PostgreSQL 16 (4 GB RAM allocated) | Managed PostgreSQL (RDS / DigitalOcean DB) |
| **Caching / Queue** | Redis 7 (2 GB RAM) | Managed Redis (Upstash / Redis Cloud) |
| **Storage (Media)** | 50 GB NVMe SSD | S3 / Cloudflare R2 / MinIO |
| **OS** | Ubuntu 22.04 / 24.04 LTS | Ubuntu LTS / Debian |

---

## ⚡ 2. 1000 Users Concurrency Optimizations Implemented in Code

1. **Atomic File Locking & Multi-Tenant Storage (`storage.util.ts`)**:
   - `atomicWriteJson()` आणि `safeReadJson()` मुळे एकाच क्षणी शेकडो युझर्सनी कॅम्पेन, रिपोर्ट्स किंवा सेटिंग्स अपडेट केले तरी फाइल्स करप्ट किंवा लॉक होत नाहीत.
2. **RAM & OOM (Out-of-Memory) Protection**:
   - मेसेज हिस्टरी RAM मध्ये 1,000 ते 5,000 रेकॉर्ड्सपर्यंत मर्यादित ठेवली असून जुने रेकॉर्ड्स आपोआप डिस्क/डेटाबेसवर आर्काइव्ह होतात.
3. **Multi-Core PM2 Cluster Mode (`ecosystem.config.js`)**:
   - `instances: 'max'` मुळे सर्व CPU Cores वर बॅकएंडचे मल्टिपल थ्रेड्स चालतात.
4. **PostgreSQL Connection Pooling (`database.service.ts`)**:
   - एकाच वेळी 1000 युझर्सच्या विनंत्या हाताळण्यासाठी Connection Pool `DATABASE_POOL_MAX=50-100` वर सेट केले आहे.
5. **Universal Host & CORS Binding (`main.ts`)**:
   - 0.0.0.0 होस्ट बाइंडिंग आणि डायनॅमिक CORS सपोर्ट.

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
कोणतीही समस्या किंवा सर्वर सेटअप सहाय्यासाठी:
- **Lead Architect**: Vinayak Bhoskar
- **Direct Phone**: +91 7499415916
- **Email**: vinayakbhoskar@gmail.com
