# ByteForge — Complete Render Deployment Guide

This deploys **both** services on Render (no Vercel needed):

1. **Backend** — FastAPI, as a *Web Service* (Python)
2. **Frontend** — Next.js, as a *Static Site* (recommended) or *Web Service* (Node)

> **Deploy order matters.** Backend first (to get its URL) → Frontend second (needs
> the backend URL at build time) → then point the backend's CORS at the frontend URL.

---

## Step 0 — Push the repo to GitHub

Render deploys from a Git repo, so the code must be on GitHub first.

```powershell
cd "C:\Users\Shreyas\OneDrive\Desktop\DAA LAB EL\byteforge"
git add .
git commit -m "Deployment config + new algorithm visualizers"
```
Create an empty repo at https://github.com/new (name it `byteforge`, **don't** add a
README), then:
```powershell
git remote add origin https://github.com/<your-username>/byteforge.git
git branch -M main
git push -u origin main
```

Create a free account at https://render.com and click **Get Started** → **GitHub** to
authorize Render to read your repos.

---

## Step 1 — Deploy the BACKEND (FastAPI Web Service)

1. Render Dashboard → **New +** → **Web Service**.
2. Connect your **`byteforge`** GitHub repo → **Connect**.
3. Fill the form:

   | Field | Value |
   |-------|-------|
   | **Name** | `byteforge-api` |
   | **Region** | Singapore (closest to India) |
   | **Branch** | `main` |
   | **Root Directory** | *(leave blank — repo root)* |
   | **Runtime** | `Python 3` |
   | **Build Command** | `pip install -r requirements-api.txt` |
   | **Start Command** | `uvicorn api:app --host 0.0.0.0 --port $PORT` |
   | **Instance Type** | `Free` |

4. Expand **Advanced** → **Health Check Path** → enter `/health`.
5. Click **Create Web Service**. Wait ~2–3 min for the first build.
6. You'll get a URL like **`https://byteforge-api.onrender.com`**.
   Test it: open `https://byteforge-api.onrender.com/health` →
   should show `{"status":"ok","service":"byteforge-api"}`.

> **Copy this backend URL — you need it in Step 2.**
> Leave `ALLOWED_ORIGINS` unset for now (you'll add it in Step 3).

---

## Step 2 — Deploy the FRONTEND

Pick **one** option. Option A (Static Site) is recommended: it's free, fast (served
from a CDN), and **never sleeps**. Option B needs no code change but sleeps on free tier.

### Option A — Static Site (recommended)

**One-time code change** — enable static export in `frontend/next.config.mjs`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',            // <-- ADD THIS LINE
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
}
export default nextConfig
```
Commit and push:
```powershell
git add frontend/next.config.mjs
git commit -m "Enable Next.js static export for Render"
git push
```

Then in Render:
1. **New +** → **Static Site** → select the `byteforge` repo → **Connect**.
2. Fill the form:

   | Field | Value |
   |-------|-------|
   | **Name** | `byteforge-web` |
   | **Branch** | `main` |
   | **Root Directory** | `frontend` |
   | **Build Command** | `npm install && npm run build` |
   | **Publish Directory** | `out` |

3. Under **Environment Variables**, add:
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://byteforge-api.onrender.com` *(your backend URL from Step 1)*
4. **Create Static Site**. You'll get **`https://byteforge-web.onrender.com`**.

### Option B — Node Web Service (no code change)

1. **New +** → **Web Service** → select the `byteforge` repo.
2. Fill the form:

   | Field | Value |
   |-------|-------|
   | **Name** | `byteforge-web` |
   | **Root Directory** | `frontend` |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install && npm run build` |
   | **Start Command** | `npx next start -p $PORT` |
   | **Instance Type** | `Free` |

3. Add the same env var: `NEXT_PUBLIC_API_URL` = your backend URL.
4. **Create Web Service**.

> **Important:** `NEXT_PUBLIC_API_URL` is baked in at **build time**. If you ever change
> the backend URL, you must **redeploy the frontend** (Manual Deploy → Clear build cache
> & deploy) for it to take effect.

---

## Step 3 — Connect them (CORS)

The backend must explicitly allow the frontend's origin, or the browser blocks every
request ("Failed to fetch").

1. Render Dashboard → **`byteforge-api`** → **Environment** (left sidebar).
2. **Add Environment Variable**:
   - **Key:** `ALLOWED_ORIGINS`
   - **Value:** `https://byteforge-web.onrender.com` *(your exact frontend URL, no trailing slash)*
3. **Save Changes** — the backend redeploys automatically (~1 min).

---

## Step 4 — Verify end to end

1. Open your frontend URL: `https://byteforge-web.onrender.com`.
2. On the dashboard, pick a sample (e.g. "Lorem Ipsum") and run a compression.
3. It should return results with no "Failed to fetch" error.
4. Try `/sorting-lab`, `/nqueens`, `/bellman-ford` to confirm the new visualizers work.

> **First request is slow:** the free backend **sleeps after ~15 min idle** and takes
> ~30–50s to wake. Before a viva/demo, open `https://byteforge-api.onrender.com/health`
> once to wake it, then the app is snappy.

---

## Troubleshooting

| Symptom | Cause & Fix |
|---------|-------------|
| "Failed to fetch" on the deployed site | `ALLOWED_ORIGINS` missing/wrong on the backend, or `NEXT_PUBLIC_API_URL` wrong on the frontend. Check both match the exact URLs (https, no trailing slash). After fixing the frontend var, redeploy the frontend. |
| Backend build fails | Ensure **Build Command** is `pip install -r requirements-api.txt` (not `requirements.txt`, which is the Streamlit set). |
| Frontend build fails on "multiple lockfiles" | Delete one lockfile in `frontend/` (keep `package-lock.json`), commit, push. |
| Static export build error about a dynamic feature | Use **Option B** (Node Web Service) instead — no `output: 'export'` needed. |
| App very slow on first load | Free backend was asleep. Hit `/health` to wake it, or upgrade the backend to the $7/mo Starter instance during evaluation. |

---

## Cost summary

| Service | Plan | Cost | Notes |
|---------|------|------|-------|
| `byteforge-api` (Python) | Free Web Service | ₹0 | Sleeps after 15 min idle |
| `byteforge-web` (Static Site) | Free | ₹0 | Never sleeps, CDN-served |

Total: **free**. Optional: upgrade only the backend to **Starter ($7/mo ≈ ₹600)** for the
evaluation month to remove the cold-start delay.

---

## Quick reference

| What | Value |
|------|-------|
| Backend service name | `byteforge-api` |
| Backend build | `pip install -r requirements-api.txt` |
| Backend start | `uvicorn api:app --host 0.0.0.0 --port $PORT` |
| Backend health check | `/health` |
| Frontend root dir | `frontend` |
| Frontend build | `npm install && npm run build` |
| Frontend publish dir (static) | `out` |
| Frontend → backend var | `NEXT_PUBLIC_API_URL` = backend URL |
| Backend → frontend var | `ALLOWED_ORIGINS` = frontend URL |
