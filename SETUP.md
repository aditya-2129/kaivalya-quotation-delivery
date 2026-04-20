# Setup Guide — Machine Shop Quotation System

This guide covers setting up the full system on a fresh Windows PC using Docker only. No Node.js required.

---

## Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Docker Desktop | Latest | https://www.docker.com/products/docker-desktop |
| Git | Any | https://git-scm.com |

> After installing Docker Desktop, make sure it is **running** before continuing.

---

## Step 1 — Clone the Repository

```bash
git clone <repository-url>
cd Kaivalya
```

---

## Step 2 — Configure Frontend Environment

In the `frontend/` folder, create a `.env` file:

```env
NEXT_PUBLIC_APPWRITE_PROJECT_ID=machine-shop-quotation
NEXT_PUBLIC_APPWRITE_PROJECT_NAME=Machine Shop Quotation
NEXT_PUBLIC_APPWRITE_ENDPOINT=http://localhost/v1
APPWRITE_API_KEY=<fill this in after Step 4>
```

> You'll come back to fill in the API key after Appwrite is running.

---

## Step 3 — Start Everything

From the **root** of the project:

```bash
docker compose up -d
```

This starts both:
- **Appwrite** (backend, database, auth, storage) → http://localhost
- **Frontend** (Next.js app) → http://localhost:3000

First run takes several minutes to pull images. Wait until `docker compose ps` shows all containers as `running`.

---

## Step 4 — Create Appwrite Account & Project

1. Open http://localhost
2. Click **Sign Up** and create your console account *(this is the Appwrite admin, not an app user)*
3. Create a new project:
   - **Project ID:** `machine-shop-quotation` *(must match exactly)*
   - **Project Name:** Machine Shop Quotation

Then generate an API key:

1. Inside the project → **Settings** → **API Keys** → **Create API Key**
2. Name it anything (e.g. `setup-key`), grant **all scopes**
3. Copy the key and paste it into `frontend/.env` as `APPWRITE_API_KEY`

After editing `.env`, restart the frontend container to pick up the new value:

```bash
docker compose restart quotation-maker
```

---

## Step 5 — Push Database Schema

The database collections and storage buckets are defined in `frontend/appwrite.config.json`.

**Option A — Using the Appwrite CLI** *(recommended, one-time only — requires Node.js)*

```bash
cd frontend
npx appwrite-cli login --endpoint http://localhost/v1
npx appwrite-cli push --all
```

**Option B — Manually via Appwrite Console** *(no Node.js needed)*

Go to http://localhost → your project → **Databases** and create the following manually:

- Database ID: `machine-shop-database`
- Collections: `quotation_history`, `labor_rates`, `bop_library`, `customers`, `materials_library`, `users`, `purchase_orders`

Refer to `frontend/appwrite.config.json` for all attribute definitions per collection.

Also create a Storage bucket:
- Bucket ID: `inquiry_files`, Name: `Inquiry Files`, Max file size: 30 MB

---

## Step 6 — Create the First Admin User

The app requires at least one admin user to log in.

1. Go to http://localhost → your project → **Auth** → **Users** → **Create User**
2. Fill in email and a password
3. Note the **User ID** shown after creation

Then go to **Databases** → `Machine Shop Database` → **Users** collection → **Create Document**:

```json
{
  "name": "Your Name",
  "email": "your@email.com",
  "mobile": "9999999999",
  "role": "admin",
  "auth_id": "<User ID from above>"
}
```

---

## Done

Open http://localhost:3000 and log in with the credentials from Step 6.

---

## Stopping & Restarting

```bash
# Stop everything (from project root)
docker compose down

# Start again
docker compose up -d
```

Data is persisted in Docker volumes — stopping does not delete anything.

---

## Folder Structure

```
Kaivalya/
├── appwrite/                    # Appwrite Docker configuration
│   ├── docker-compose.yml
│   └── .env
├── frontend/                    # Next.js application
│   ├── src/
│   ├── appwrite.config.json     # Database schema definition
│   ├── .env                     # Your local environment (not committed)
│   └── Dockerfile
└── docker-compose.yml           # Root compose (starts Appwrite + frontend)
```

---

## Production Setup — Internet Access via Cloudflare Tunnel

This section covers exposing the app to the internet from the owner's Windows PC without port forwarding, using Cloudflare Tunnel.

### Prerequisites

- Domain managed on **Cloudflare DNS** (not GoDaddy DNS directly)
- `cloudflared` installed: `winget install --id Cloudflare.cloudflared`

### Step 1 — Authenticate cloudflared

```bash
cloudflared tunnel login
```

Opens a browser — log in and select your domain.

### Step 2 — Create the Tunnel

```bash
cloudflared tunnel create kaivalya-tunnel
```

Note the tunnel ID from the output.

### Step 3 — Create DNS Routes

```bash
cloudflared tunnel route dns kaivalya-tunnel app.vrivalsarena.com
cloudflared tunnel route dns kaivalya-tunnel appwrite.vrivalsarena.com
```

This creates CNAME records in Cloudflare automatically.

### Step 4 — Create Tunnel Config

Create `C:\Users\<username>\.cloudflared\config.yml`:

```yaml
tunnel: <your-tunnel-id>
credentials-file: C:\Users\<username>\.cloudflared\<your-tunnel-id>.json

ingress:
  - hostname: app.vrivalsarena.com
    service: http://localhost:3000
  - hostname: appwrite.vrivalsarena.com
    service: http://localhost:80
  - service: http_status:404
```

### Step 5 — Update Appwrite Environment

In `appwrite/.env`, set:

```env
_APP_DOMAIN=appwrite.vrivalsarena.com
_APP_DOMAIN_TARGET=appwrite.vrivalsarena.com
_APP_DOMAIN_FUNCTIONS=functions.vrivalsarena.com
_APP_OPTIONS_ROUTER_PROTECTION=disabled
```

### Step 6 — Update Frontend Environment

In `frontend/.env`, update:

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://appwrite.vrivalsarena.com/v1
```

Then rebuild the frontend image:

```bash
docker compose up -d --build quotation-maker
```

### Step 7 — Install cloudflared as a Windows Service (Auto-start)

Run as **Administrator**:

```bash
cloudflared service install
```

This registers the tunnel as a Windows service that starts automatically on boot.

### Step 8 — Auto-start Docker Compose on Boot

1. Press `Win + R` → type `shell:startup` → Enter
2. Create `start-kaivalya.bat` in that folder:

```batch
@echo off
:waitfordocker
docker info >nul 2>&1
if errorlevel 1 (
    timeout /t 5 /nobreak >nul
    goto waitfordocker
)
cd /d "C:\path\to\Kaivalya"
docker compose up -d
```

3. In Docker Desktop → Settings → General → enable **"Start Docker Desktop when you sign in"**

After this, the owner just turns on the PC — everything starts automatically within a minute.

### Accessing the App

| URL | Purpose |
|-----|---------|
| `https://app.vrivalsarena.com` | Employee-facing frontend |
| `https://appwrite.vrivalsarena.com/console` | Appwrite admin console |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `localhost` not loading | Make sure Docker Desktop is running and containers are up (`docker compose ps`) |
| `localhost:3000` not loading | Check frontend container logs: `docker compose logs quotation-maker` |
| Login fails | User must exist in both **Auth → Users** AND the **Users** collection with matching `auth_id` |
| API errors in browser | Verify `frontend/.env` values are correct and restart: `docker compose restart quotation-maker` |
| `push --all` fails | Ensure API key has all scopes and Project ID matches `machine-shop-quotation` exactly |
| Port 80 already in use | Stop any local web server (IIS, XAMPP, nginx) using port 80 before starting Docker |
| `app.vrivalsarena.com` not loading | Check tunnel status: `sc query cloudflared` — should show `RUNNING` |
| Appwrite shows "Router protection" error | Ensure `_APP_OPTIONS_ROUTER_PROTECTION=disabled` in `appwrite/.env` and restart containers |
| Frontend can't reach Appwrite | Verify `NEXT_PUBLIC_APPWRITE_ENDPOINT` points to `https://appwrite.vrivalsarena.com/v1` and rebuild image |
| Containers don't start on boot | Check `start-kaivalya.bat` is in the Windows startup folder (`shell:startup`) |
