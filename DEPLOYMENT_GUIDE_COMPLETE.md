# DermaSoul AI - Complete Deployment Guide

## Table of Contents
1. [System Requirements](#system-requirements)
2. [Prerequisites Installation](#prerequisites-installation)
3. [Project Setup](#project-setup)
4. [Database Setup](#database-setup)
5. [Backend Configuration](#backend-configuration)
6. [Frontend Configuration](#frontend-configuration)
7. [ML Models Setup](#ml-models-setup)
8. [Initial Data Seeding](#initial-data-seeding)
9. [Running the Application](#running-the-application)
10. [Production Deployment](#production-deployment)
11. [Troubleshooting](#troubleshooting)
12. [Monitoring & Maintenance](#monitoring--maintenance)

---

## System Requirements

### Minimum Hardware Requirements
- **CPU**: Quad-core processor (2.0 GHz or higher)
- **RAM**: 16 GB minimum (32 GB recommended for ML inference)
- **Storage**: 100 GB (50 GB for models, 20 GB for uploads, 30 GB buffer)
- **GPU**: NVIDIA GPU with CUDA 11.8+ (optional but recommended for ML inference)

### Supported Operating Systems
- **Windows 10/11** (64-bit)
- **Ubuntu 20.04 LTS or later**
- **macOS 11+ (Intel/Apple Silicon)**

### Network Requirements
- Port 8010 available (Backend API)
- Port 5173 available (Frontend dev server)
- Port 5432 available (PostgreSQL - if local)
- Internet access for initial setup and model downloads

---

## Prerequisites Installation

### Step 1: Install Python 3.10+

**Windows:**
```bash
# Download from https://www.python.org/downloads/
# Run installer, check "Add Python to PATH"
# Verify installation
python --version
python -m pip --version
```

**macOS:**
```bash
# Using Homebrew
brew install python@3.11
python3.11 --version
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install python3.11 python3.11-venv python3.11-dev
python3.11 --version
```

### Step 2: Install PostgreSQL 13+

**Windows:**
```bash
# Option 1: Download from https://www.postgresql.org/download/
# Run installer, remember the password for 'postgres' user
# Verify installation
psql --version

# Option 2: Using Chocolatey
choco install postgresql
```

**macOS:**
```bash
# Using Homebrew
brew install postgresql@15
brew services start postgresql@15
psql --version
```

**Ubuntu/Debian:**
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
psql --version
```

### Step 3: Install Node.js 18+

**Windows:**
```bash
# Download from https://nodejs.org/
# Run installer
node --version
npm --version
```

**macOS:**
```bash
brew install node@18
node --version
npm --version
```

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs
node --version
npm --version
```

### Step 4: Install Git

**Windows:**
```bash
# Download from https://git-scm.com/download/win
# Run installer
git --version
```

**macOS:**
```bash
brew install git
git --version
```

**Ubuntu/Debian:**
```bash
sudo apt install git
git --version
```

### Step 5: Install Redis (Optional but Recommended)

**Windows (Using WSL2):**
```bash
# Inside WSL2 Ubuntu terminal
sudo apt install redis-server
redis-server --version
```

**macOS:**
```bash
brew install redis
redis-server --version
```

**Ubuntu/Debian:**
```bash
sudo apt install redis-server
redis-server --version
```

### Step 6: Verify All Prerequisites

```bash
# Check all versions
python --version          # Should be 3.10+
pip --version            # Should match Python version
psql --version           # Should be 13+
node --version           # Should be 18+
npm --version            # Should be 9+
git --version            # Should be 2.35+
redis-server --version   # Optional, should be 6.0+
```

---

## Project Setup

### Step 1: Clone the Repository

```bash
# Navigate to desired location
cd /path/to/projects

# Clone repository
git clone https://github.com/yourusername/DermaSoul-AI.git
cd DermaSoul-AI

# List project structure to verify
dir  # Windows
ls -la  # macOS/Linux
```

### Step 2: Verify Project Structure

You should see:
```
DermaSoul-AI/
├── backend/
│   ├── app/
│   ├── requirements.txt
│   ├── .env.example
│   └── venv/
├── frontend/
│   ├── src/
│   ├── package.json
│   └── node_modules/
├── README.md
└── ...
```

### Step 3: Create Directory Aliases (Optional)

**Windows (PowerShell):**
```powershell
$backend = "e:\DermaSoul-AI\backend"
$frontend = "e:\DermaSoul-AI\frontend"
```

**macOS/Linux (Bash):**
```bash
export DERMASOUL_ROOT="/path/to/DermaSoul-AI"
export DERMASOUL_BACKEND="$DERMASOUL_ROOT/backend"
export DERMASOUL_FRONTEND="$DERMASOUL_ROOT/frontend"
```

---

## Database Setup

### Step 1: Create PostgreSQL Database and User

**Windows (Command Prompt):**
```bash
# Connect to PostgreSQL
psql -U postgres

# Inside psql prompt (psql>)
CREATE DATABASE dermasoul_ai;
CREATE USER dermasoul_user WITH PASSWORD 'strong_password_here_123!';
ALTER ROLE dermasoul_user SET client_encoding TO 'utf8';
ALTER ROLE dermasoul_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE dermasoul_user SET default_transaction_deferrable TO on;
ALTER ROLE dermasoul_user SET default_transaction_read_committed TO on;
ALTER ROLE dermasoul_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE dermasoul_ai TO dermasoul_user;
\q
```

**macOS/Linux:**
```bash
# Connect to PostgreSQL (might need sudo)
sudo -u postgres psql

# Inside psql prompt (psql>)
CREATE DATABASE dermasoul_ai;
CREATE USER dermasoul_user WITH PASSWORD 'strong_password_here_123!';
ALTER ROLE dermasoul_user SET client_encoding TO 'utf8';
ALTER ROLE dermasoul_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE dermasoul_user SET default_transaction_deferrable TO on;
ALTER ROLE dermasoul_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE dermasoul_ai TO dermasoul_user;
\q
```

### Step 2: Verify Database Connection

```bash
# Test connection
psql -U dermasoul_user -d dermasoul_ai -h localhost -W

# You'll be prompted for password, enter: strong_password_here_123!
# If successful, you'll see: dermasoul_ai=>
# Type \q to exit

\q
```

### Step 3: Create Tables (Auto-created by SQLAlchemy)

Tables will be automatically created when the backend starts for the first time:
- `user` - User accounts
- `profile` - User profiles
- `consultation` - Consultation records
- `consultation_message` - Chat messages (if applicable)
- `product` - OTC products
- `education_article` - Disease/condition articles
- `dermatologist` - Dermatologist directory
- `rag_document` - RAG knowledge base documents

---

## Backend Configuration

### Step 1: Navigate to Backend Directory

```bash
# Windows
cd e:\DermaSoul-AI\backend

# macOS/Linux
cd /path/to/DermaSoul-AI/backend
```

### Step 2: Create Python Virtual Environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3.11 -m venv venv
source venv/bin/activate

# Verify activation (you should see (venv) in terminal)
```

### Step 3: Upgrade pip and Install Dependencies

```bash
# Upgrade pip
python -m pip install --upgrade pip

# Install all requirements (this may take 5-10 minutes)
pip install -r requirements.txt

# Verify installation
pip list | grep -E "fastapi|torch|sqlalchemy"  # macOS/Linux
pip list | findstr "fastapi torch sqlalchemy"   # Windows
```

**Installation Time Guide:**
- Small packages: 1-2 minutes
- PyTorch/TorchVision: 3-5 minutes (downloads ~2 GB)
- Transformers: 2-3 minutes (downloads ~1 GB)
- All dependencies: 8-12 minutes total

### Step 4: Create .env File

```bash
# Copy example file
# Windows
copy .env.example .env

# macOS/Linux
cp .env.example .env
```

### Step 5: Configure .env File

Open `backend/.env` and edit:

```env
# Application Settings
APP_NAME=DermaSoul AI
APP_VERSION=1.0.0
ENVIRONMENT=development

# Database Configuration
DATABASE_URL=postgresql://dermasoul_user:strong_password_here_123!@localhost:5432/dermasoul_ai

# JWT Configuration (CRITICAL: Change these for production)
JWT_SECRET_KEY=your-super-secret-key-minimum-32-characters-long-change-this
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# CORS Configuration (Frontend URL)
BACKEND_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174

# File Upload Configuration
UPLOAD_DIR=app/uploads
MAX_IMAGE_SIZE_MB=10
MAX_REPORT_SIZE_MB=15

# Backend URL (used by frontend to communicate)
PUBLIC_BASE_URL=http://127.0.0.1:8010

# ML Model Paths (auto-configured, no changes needed usually)
DIAGNOSIS_MODEL_PATH=app/ml/ml_models/diagnosis_model_optimized.pth
SKIN_TYPE_MODEL_PATH=app/ml/ml_models/skin_type_model.pth

# NLP Configuration
NLP_ENTITY_MODEL=app/ml/hf_models/biomedical-ner-all
NLP_ENTITY_MAX_LENGTH=256
HF_CACHE_DIR=.hf-cache
NLP_HF_HUB_OFFLINE=false
NLP_ENTITY_WARMUP_ON_START=false

# RAG Configuration
RAG_EMBEDDING_MODEL=app/ml/hf_models/bge-base-en-v1.5
RAG_RERANKER_MODEL=app/ml/hf_models/bge-reranker-base
REDIS_URL=redis://localhost:6379/0

# SMTP Configuration (Optional - for email alerts)
SMTP_ENABLED=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_USE_TLS=true
SMTP_FROM_EMAIL=noreply@dermasoul.ai
```

### Step 6: Verify Backend Configuration

```bash
# Test Python imports
python -c "import fastapi, torch, sqlalchemy; print('All imports successful!')"

# Test database connection
python -c "from app.database import engine; engine.connect(); print('Database connection successful!')"
```

---

## Frontend Configuration

### Step 1: Navigate to Frontend Directory

```bash
# Windows
cd e:\DermaSoul-AI\frontend

# macOS/Linux
cd /path/to/DermaSoul-AI/frontend
```

### Step 2: Install Node Dependencies

```bash
# Install all npm packages (this may take 2-3 minutes)
npm install

# Verify installation
npm list react react-router-dom axios

# Check versions installed
npm list --depth=0
```

### Step 3: Create .env File (if needed)

```bash
# Windows
# Create frontend/.env file (usually not needed for dev, but for production:)
# Content:
# VITE_API_URL=http://localhost:8010
# VITE_DEV_API_URL=http://127.0.0.1:8010

# macOS/Linux
# touch .env.local
# Then add:
# VITE_API_URL=http://localhost:8010
# VITE_DEV_API_URL=http://127.0.0.1:8010
```

### Step 4: Verify Frontend Configuration

```bash
# Check Vite config
npm run build -- --dry-run

# Test TypeScript
npm run build
```

---

## ML Models Setup

### Step 1: Create ML Models Directory

```bash
# Windows
cd backend\app\ml
mkdir ml_models
mkdir hf_models

# macOS/Linux
cd backend/app/ml
mkdir -p ml_models
mkdir -p hf_models
```

### Step 2: Download Pre-trained Models

**Vision Models (Required):**

```bash
# Windows (using PowerShell)
cd backend/app/ml/ml_models

# Download diagnosis model (~180 MB)
Invoke-WebRequest -Uri "https://download-link-to-diagnosis-model.pth" -OutFile "diagnosis_model_optimized.pth"

# Download skin type model (~90 MB)
Invoke-WebRequest -Uri "https://download-link-to-skin-type-model.pth" -OutFile "skin_type_model.pth"

# macOS/Linux
cd backend/app/ml/ml_models

# Using wget
wget https://download-link-to-diagnosis-model.pth -O diagnosis_model_optimized.pth
wget https://download-link-to-skin-type-model.pth -O skin_type_model.pth

# OR using curl
curl -L https://download-link-to-diagnosis-model.pth -o diagnosis_model_optimized.pth
curl -L https://download-link-to-skin-type-model.pth -o skin_type_model.pth
```

**HuggingFace Models (Auto-downloaded on first use, but can pre-cache):**

```bash
# These will download on first request (2-3 GB total)
# Models auto-downloaded to: backend/.hf-cache/

# To pre-cache them (optional but recommended):
# Navigate to backend directory with activated venv

cd ..  # Go back to backend root
python -c "
from transformers import AutoTokenizer, AutoModel
import torch

# Download biomedical NER
AutoTokenizer.from_pretrained('app/ml/hf_models/biomedical-ner-all')
AutoModel.from_pretrained('app/ml/hf_models/biomedical-ner-all')

# Download RAG embedding model
AutoModel.from_pretrained('app/ml/hf_models/bge-base-en-v1.5')

# Download reranker
AutoModel.from_pretrained('app/ml/hf_models/bge-reranker-base')

print('All models cached successfully!')
"
```

### Step 3: Verify Model Files

```bash
# Windows
dir backend\app\ml\ml_models
dir backend\.hf-cache

# macOS/Linux
ls -lh backend/app/ml/ml_models
ls -lh backend/.hf-cache
```

Expected structure:
```
backend/
├── app/
│   ├── ml/
│   │   ├── ml_models/
│   │   │   ├── diagnosis_model_optimized.pth (~180 MB)
│   │   │   └── skin_type_model.pth (~90 MB)
│   │   └── hf_models/
│   │       ├── biomedical-ner-all/
│   │       ├── bge-base-en-v1.5/
│   │       └── bge-reranker-base/
│   └── ...
├── .hf-cache/
│   └── hub/
│       └── models--*/  # Auto-cached models
└── ...
```

---

## Initial Data Seeding

### Step 1: Activate Backend Virtual Environment

```bash
# Windows
cd backend
venv\Scripts\activate

# macOS/Linux
cd backend
source venv/bin/activate
```

### Step 2: Create Admin User

```bash
# Interactive mode (will prompt for password)
python -m app.scripts.create_admin --email admin@dermasoul.ai

# Non-interactive mode
python -m app.scripts.create_admin --email admin@dermasoul.ai --password AdminPassword123!

# Promote existing user to admin
python -m app.scripts.create_admin --email user@example.com --reset-password
```

### Step 3: Seed Education Articles

```bash
# Load disease/condition articles from RAG knowledge base
python -m app.scripts.seed_education_articles

# Expected output:
# Seeding education articles...
# Added: Acne
# Added: Psoriasis
# Added: Eczema
# ...
# Successfully seeded 25 articles!
```

### Step 4: Seed OTC Products

```bash
# Load safe OTC products from knowledge base
python -m app.scripts.seed_products_from_rag

# Expected output:
# Seeding OTC products...
# Added: CeraVe Moisturizer
# Added: Neutrogena SPF 50
# ...
# Successfully seeded 50 products!
```

### Step 5: Verify Data in Database

```bash
# Connect to database
psql -U dermasoul_user -d dermasoul_ai -h localhost

# Check admin user created
SELECT id, email, role, is_active FROM "user" WHERE role = 'admin';

# Check education articles
SELECT COUNT(*) FROM education_article;

# Check products
SELECT COUNT(*) FROM product;

# Exit
\q
```

---

## Running the Application

### Step 1: Start PostgreSQL (if not already running)

**Windows:**
```bash
# PostgreSQL should start automatically as Windows service
# Verify it's running:
pg_isready -h localhost -p 5432
```

**macOS:**
```bash
brew services start postgresql@15
```

**Ubuntu/Linux:**
```bash
sudo systemctl start postgresql
sudo systemctl status postgresql
```

### Step 2: Start Redis (Optional but Recommended)

**Windows (WSL2):**
```bash
# Inside WSL2 terminal
redis-server --daemonize yes

# Check status
redis-cli ping  # Should return: PONG
```

**macOS:**
```bash
redis-server --daemonize yes
redis-cli ping
```

**Ubuntu/Linux:**
```bash
sudo systemctl start redis-server
redis-cli ping
```

### Step 3: Terminal 1 - Start Backend API Server

```bash
# Navigate to backend directory
cd e:\DermaSoul-AI\backend  # Windows
cd /path/to/DermaSoul-AI/backend  # macOS/Linux

# Activate virtual environment
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# Start backend server
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8010

# Expected output:
# INFO:     Uvicorn running on http://127.0.0.1:8010
# INFO:     Application startup complete
# Press CTRL+C to stop
```

**Startup Time:** 15-30 seconds (longer on first run due to model loading)

### Step 4: Terminal 2 - Start Frontend Dev Server

```bash
# Navigate to frontend directory
cd e:\DermaSoul-AI\frontend  # Windows
cd /path/to/DermaSoul-AI/frontend  # macOS/Linux

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev

# Expected output:
# 
#   ➜  Local:   http://localhost:5173/
#   ➜  press h + enter to show help
```

**Startup Time:** 3-5 seconds

### Step 5: Access the Application

1. **Open Browser:**
   - Frontend: http://localhost:5173
   - Backend API: http://127.0.0.1:8010
   - API Docs (Swagger): http://127.0.0.1:8010/docs
   - API Docs (ReDoc): http://127.0.0.1:8010/redoc

2. **Test Login:**
   - Email: `admin@dermasoul.ai`
   - Password: `AdminPassword123!` (or what you set during creation)

3. **Verify API Connection:**
   ```bash
   # Test health endpoint
   curl http://127.0.0.1:8010/health
   
   # Expected response:
   # {"status":"healthy"}
   ```

### Step 6: Verify All Systems

Open API Docs at `http://127.0.0.1:8010/docs` and test endpoints:

1. **Authentication:**
   - POST `/auth/register` - Create new account
   - POST `/auth/login` - Login
   - GET `/auth/me` - Get current user

2. **Diagnosis:**
   - POST `/diagnosis/analyze` - Upload image and analyze

3. **Profile:**
   - GET `/profile` - Get user profile
   - PUT `/profile` - Update profile

4. **Admin:**
   - GET `/admin/stats` - Admin dashboard stats
   - GET `/admin/users` - User management

---

## Production Deployment

### Step 1: Pre-Production Checklist

```bash
# 1. Update environment variables
# Edit backend/.env:
ENVIRONMENT=production
JWT_SECRET_KEY=generate-a-truly-random-key-here  # Use: python -c "import secrets; print(secrets.token_hex(32))"
NLP_HF_HUB_OFFLINE=true  # Cache should be warmed

# 2. Build frontend for production
cd frontend
npm run build  # Creates dist/ folder

# 3. Collect static files
# Frontend: dist/ folder is production build
# Backend: Serve static files via nginx/reverse proxy

# 4. Run database migrations
cd backend
python -m app.scripts.migrate_ai_platform_upgrade
```

### Step 2: Generate Secure JWT Secret

```bash
# Python one-liner
python -c "import secrets; print('JWT_SECRET_KEY=' + secrets.token_hex(32))"

# Output example:
# JWT_SECRET_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6

# Copy this to .env file
```

### Step 3: Production Environment Variables

Create `backend/.env.production`:

```env
# Application
APP_NAME=DermaSoul AI
APP_VERSION=1.0.0
ENVIRONMENT=production

# Database (Use cloud-hosted PostgreSQL for production)
DATABASE_URL=postgresql://user:password@db-hostname:5432/dermasoul_ai

# Security
JWT_SECRET_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# CORS (Update to production domain)
BACKEND_CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://api.yourdomain.com

# File uploads (Use cloud storage like AWS S3 in production)
UPLOAD_DIR=/var/www/dermasoul/uploads
MAX_IMAGE_SIZE_MB=10
MAX_REPORT_SIZE_MB=15

# Public URL
PUBLIC_BASE_URL=https://api.yourdomain.com

# Models
DIAGNOSIS_MODEL_PATH=/opt/dermasoul/models/diagnosis_model_optimized.pth
SKIN_TYPE_MODEL_PATH=/opt/dermasoul/models/skin_type_model.pth

# NLP
NLP_ENTITY_MODEL=/opt/dermasoul/models/hf_models/biomedical-ner-all
HF_CACHE_DIR=/var/cache/huggingface
NLP_HF_HUB_OFFLINE=true
NLP_ENTITY_WARMUP_ON_START=true

# RAG
RAG_EMBEDDING_MODEL=/opt/dermasoul/models/hf_models/bge-base-en-v1.5
RAG_RERANKER_MODEL=/opt/dermasoul/models/hf_models/bge-reranker-base
REDIS_URL=redis://redis-server:6379/0

# SMTP (For production alerts)
SMTP_ENABLED=true
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_USE_TLS=true
SMTP_FROM_EMAIL=noreply@dermasoul.ai
```

### Step 4: Deploy Backend Using Gunicorn

```bash
# Install production WSGI server
pip install gunicorn

# Run backend with Gunicorn
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8010 \
  --timeout 120 \
  --access-logfile - \
  --error-logfile -

# For systemd service (create /etc/systemd/system/dermasoul-backend.service):
[Unit]
Description=DermaSoul Backend API
After=network.target postgresql.service

[Service]
Type=notify
User=dermasoul
WorkingDirectory=/opt/dermasoul/backend
Environment="PATH=/opt/dermasoul/backend/venv/bin"
ExecStart=/opt/dermasoul/backend/venv/bin/gunicorn \
  app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 127.0.0.1:8010
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Step 5: Deploy Frontend Using Nginx

Create `/etc/nginx/sites-available/dermasoul`:

```nginx
# Frontend configuration
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend static files
    root /var/www/dermasoul/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;

    # Static file caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # React Router: Route all requests to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend proxy
    location /api {
        proxy_pass http://127.0.0.1:8010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Deny access to sensitive files
    location ~ /\. {
        deny all;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/dermasoul /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 6: Install SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Step 7: Database Backup Strategy

```bash
# Daily backup script (backup.sh)
#!/bin/bash
BACKUP_DIR="/backups/dermasoul"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

mkdir -p $BACKUP_DIR

pg_dump -U dermasoul_user dermasoul_ai | gzip > $BACKUP_DIR/dermasoul_$TIMESTAMP.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "dermasoul_*.sql.gz" -mtime +30 -delete

# Add to crontab (crontab -e):
# 0 2 * * * /opt/dermasoul/backup.sh

# Restore from backup
gunzip < dermasoul_20260513_020000.sql.gz | psql -U dermasoul_user dermasoul_ai
```

---

## Docker Deployment (Optional)

### Step 1: Create Backend Dockerfile

Create `backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create upload directory
RUN mkdir -p app/uploads

# Expose port
EXPOSE 8010

# Start application
CMD ["gunicorn", "app.main:app", \
     "--workers", "4", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8010"]
```

### Step 2: Create Frontend Dockerfile

Create `frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Step 3: Create Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: dermasoul_ai
      POSTGRES_USER: dermasoul_user
      POSTGRES_PASSWORD: strong_password_here_123!
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dermasoul_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    ports:
      - "8010:8010"
    environment:
      DATABASE_URL: postgresql://dermasoul_user:strong_password_here_123!@postgres:5432/dermasoul_ai
      JWT_SECRET_KEY: your-super-secret-key-here
      REDIS_URL: redis://redis:6379/0
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./backend/app/uploads:/app/app/uploads
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8010/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    environment:
      VITE_API_URL: http://localhost:8010

volumes:
  postgres_data:
```

### Step 4: Deploy with Docker Compose

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down

# Destroy volumes (WARNING: deletes data)
docker-compose down -v
```

---

## Troubleshooting

### Issue 1: Database Connection Failed

**Error:** `psycopg2.OperationalError: could not connect to server`

**Solution:**
```bash
# 1. Check PostgreSQL is running
pg_isready -h localhost -p 5432

# 2. Verify credentials in .env
DATABASE_URL=postgresql://dermasoul_user:password@localhost:5432/dermasoul_ai

# 3. Test connection manually
psql -U dermasoul_user -h localhost -d dermasoul_ai -W

# 4. Restart PostgreSQL
sudo systemctl restart postgresql  # Linux
brew services restart postgresql@15  # macOS

# 5. Check PostgreSQL logs
sudo tail -50 /var/log/postgresql/postgresql-15-main.log  # Linux
```

### Issue 2: Port Already in Use

**Error:** `Address already in use`

**Solution:**
```bash
# Windows - Find process using port
netstat -ano | findstr :8010
taskkill /PID <PID> /F

# macOS/Linux - Find process using port
lsof -i :8010
kill -9 <PID>

# Use different ports
python -m uvicorn app.main:app --port 8011  # Backend
npm run dev -- --port 5174  # Frontend
```

### Issue 3: Models Not Loading

**Error:** `FileNotFoundError: diagnosis_model_optimized.pth`

**Solution:**
```bash
# 1. Verify models exist
ls -la backend/app/ml/ml_models/

# 2. Verify paths in .env
# DIAGNOSIS_MODEL_PATH=app/ml/ml_models/diagnosis_model_optimized.pth

# 3. Download models if missing
cd backend/app/ml/ml_models
wget https://model-download-url/diagnosis_model_optimized.pth

# 4. Check absolute path configuration
cd backend
python -c "from app.config import settings; print(settings.DIAGNOSIS_MODEL_PATH)"
```

### Issue 4: GPU Not Detected

**Error:** `CUDA not available`

**Solution:**
```bash
# 1. Check GPU availability
python -c "import torch; print(torch.cuda.is_available())"

# 2. If false, models will run on CPU (slower but functional)

# 3. To enable GPU:
# - Install NVIDIA drivers
# - Install CUDA 11.8+
# - Install cuDNN
# - Reinstall torch with CUDA support
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

### Issue 5: CORS Errors in Frontend

**Error:** `Access to XMLHttpRequest blocked by CORS policy`

**Solution:**
```env
# 1. Update .env CORS origins
BACKEND_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://your-domain.com

# 2. Ensure frontend is using correct backend URL
# frontend/.env:
VITE_API_URL=http://localhost:8010

# 3. Check network tab in browser dev tools
# Verify actual request is being made to correct URL
```

### Issue 6: Out of Memory Error

**Error:** `torch.cuda.OutOfMemoryError` or `MemoryError`

**Solution:**
```bash
# 1. Increase available RAM
# - Close unnecessary applications
# - Increase virtual memory/swap

# 2. Reduce batch size in inference
# 3. Use CPU instead of GPU
# 4. Reduce image resolution before processing
```

### Issue 7: Frontend Build Fails

**Error:** `npm ERR! code ERESOLVE`

**Solution:**
```bash
# 1. Clear npm cache
npm cache clean --force

# 2. Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# 3. Reinstall with legacy peer deps
npm install --legacy-peer-deps

# 4. Try build
npm run build
```

### Issue 8: Secret Key Already Hashed Error

**Error:** `ValueError: salt should be bytes`

**Solution:**
```bash
# 1. Ensure JWT_SECRET_KEY is a plain string (not hashed)
# BAD:  JWT_SECRET_KEY=$2b$12$hashed_value
# GOOD: JWT_SECRET_KEY=plain_random_string_32_chars

# 2. Regenerate key
python -c "import secrets; print(secrets.token_hex(32))"

# 3. Update .env with new key
```

---

## Monitoring & Maintenance

### Step 1: System Health Checks

**Daily:**
```bash
# Check disk space
df -h

# Check memory usage
free -m  # Linux
vm_stat  # macOS

# Check database size
psql -U dermasoul_user -d dermasoul_ai -c "SELECT pg_size_pretty(pg_database_size('dermasoul_ai'));"

# Check active connections
psql -U dermasoul_user -d dermasoul_ai -c "SELECT count(*) FROM pg_stat_activity;"

# Check backend health
curl http://127.0.0.1:8010/health
```

### Step 2: Log Rotation

Create `/etc/logrotate.d/dermasoul`:

```
/var/log/dermasoul/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 dermasoul dermasoul
    sharedscripts
    postrotate
        systemctl reload dermasoul-backend > /dev/null 2>&1 || true
    endscript
}
```

### Step 3: Automated Backups

```bash
# Create backup script
cat > /usr/local/bin/dermasoul-backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/dermasoul"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p $BACKUP_DIR

# Database backup
pg_dump -U dermasoul_user dermasoul_ai | gzip > $BACKUP_DIR/db_$TIMESTAMP.sql.gz

# Uploads backup
tar -czf $BACKUP_DIR/uploads_$TIMESTAMP.tar.gz /var/www/dermasoul/uploads

# Keep only 30 days
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completed: $TIMESTAMP"
EOF

chmod +x /usr/local/bin/dermasoul-backup.sh

# Add to crontab (crontab -e)
0 2 * * * /usr/local/bin/dermasoul-backup.sh
```

### Step 4: Monitoring Dashboard (Optional)

```bash
# Install Prometheus + Grafana for production
docker run -d -p 9090:9090 prom/prometheus
docker run -d -p 3000:3000 grafana/grafana

# Configure prometheus.yml to scrape backend metrics
```

### Step 5: Update Procedures

```bash
# Backup first
/usr/local/bin/dermasoul-backup.sh

# Backend update
cd /opt/dermasoul/backend
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
systemctl restart dermasoul-backend

# Frontend update
cd /opt/dermasoul/frontend
git pull origin main
npm install
npm run build
cp -r dist/* /var/www/dermasoul/frontend/dist/
systemctl restart nginx

# Database migrations (if needed)
python -m app.scripts.migrate_ai_platform_upgrade
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] All dependencies installed
- [ ] Environment variables configured
- [ ] Database created and seeded
- [ ] ML models downloaded
- [ ] Admin user created
- [ ] SSL certificate obtained (for HTTPS)
- [ ] Backups configured
- [ ] Firewall rules configured

### During Deployment
- [ ] Backend started and responding
- [ ] Frontend built and served
- [ ] Database accessible
- [ ] All API endpoints working
- [ ] Frontend can communicate with backend
- [ ] Admin dashboard accessible
- [ ] User registration working
- [ ] Image upload working

### Post-Deployment
- [ ] Monitor system resources
- [ ] Check application logs
- [ ] Test all critical user flows
- [ ] Verify backups running
- [ ] Set up monitoring alerts
- [ ] Document any custom configurations
- [ ] Test disaster recovery procedure

---

## Additional Resources

### Useful Commands Reference

```bash
# Backend
python -m uvicorn app.main:app --reload  # Start dev server
python -m pytest tests/                   # Run tests
python -m black app/                      # Format code
python -m flake8 app/                     # Lint code

# Frontend
npm run dev                               # Start dev server
npm run build                             # Production build
npm run preview                           # Preview production build
npm test                                  # Run tests

# Database
psql -U dermasoul_user -d dermasoul_ai   # Connect to DB
\dt                                       # List tables
\l                                        # List databases
\q                                        # Exit psql

# Docker
docker-compose up -d                      # Start all services
docker-compose logs -f                    # View logs
docker-compose down                       # Stop all services

# System
systemctl status dermasoul-backend        # Check service status
journalctl -u dermasoul-backend -f        # View service logs
htop                                      # Monitor system resources
```

### Documentation Links
- FastAPI: https://fastapi.tiangolo.com
- React: https://react.dev
- PostgreSQL: https://www.postgresql.org/docs/
- Docker: https://docs.docker.com
- Nginx: https://nginx.org/en/docs/

---

## Support & Troubleshooting

For additional help:
1. Check application logs
2. Review error messages in browser console
3. Consult FastAPI/React documentation
4. Check database connection
5. Verify all environment variables
6. Test endpoints with Postman or curl

---

**Last Updated:** May 2026  
**Deployment Guide Version:** 1.0
