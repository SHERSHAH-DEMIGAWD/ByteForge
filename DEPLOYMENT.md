# ByteForge — Deployment Guide

ByteForge has two parts that must **both** run:

| Part | Folder | Tech | Default port |
|------|--------|------|--------------|
| Backend API | repo root | FastAPI (Python) | 8000 |
| Frontend | `frontend/` | Next.js (React) | 3000 |

The frontend calls the backend over HTTP. It reads the backend URL from
`NEXT_PUBLIC_API_URL` and falls back to `http://localhost:8000` if unset.

---

## 1. Run locally (development)

You need **two terminals** open at the same time — one per service. If you close
the backend terminal, the frontend will show **"TypeError: Failed to fetch"** because
it has nothing to call.

### Terminal 1 — Backend
```powershell
cd "C:\Users\Shreyas\OneDrive\Desktop\DAA LAB EL\byteforge"
pip install -r requirements-api.txt
python -m uvicorn api:app --port 8000
```
Verify: open http://localhost:8000/health → should show `{"status":"ok"}`.
API docs (Swagger): http://localhost:8000/docs

### Terminal 2 — Frontend
```powershell
cd "C:\Users\Shreyas\OneDrive\Desktop\DAA LAB EL\byteforge\frontend"
npm install
npm run dev
```
Open http://localhost:3000.

> Keep both terminals running while you use or demo the app.

---

## 2. Deploy to the cloud (recommended for college submission)

**Architecture:** Frontend on **Vercel** (free, native Next.js) + Backend on
**Render** (free Python hosting). You get a public URL like
`https://byteforge.vercel.app` to put in your report.

### Prerequisites
- Push this repo to **GitHub** (see Section 4 if it isn't there yet).
- Free accounts on [vercel.com](https://vercel.com) and [render.com](https://render.com).

### Step A — Deploy the backend on Render
1. Render dashboard → **New +** → **Web Service** → connect your GitHub repo.
2. Render auto-detects `render.yaml`. If filling manually:
   - **Root Directory:** *(leave blank — repo root)*
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements-api.txt`
   - **Start Command:** `uvicorn api:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path:** `/health`
3. Deploy. You'll get a URL like `https://byteforge-api.onrender.com`.
4. Test it: open `https://byteforge-api.onrender.com/health`.

> Leave `ALLOWED_ORIGINS` unset for now — you'll set it in Step C once you know
> the Vercel URL.

### Step B — Deploy the frontend on Vercel
1. Vercel dashboard → **Add New** → **Project** → import your GitHub repo.
2. **Root Directory:** `frontend`  *(important — not the repo root)*
3. **Environment Variables:** add
   - `NEXT_PUBLIC_API_URL` = `https://byteforge-api.onrender.com` *(your Render URL from Step A)*
4. Deploy. You'll get `https://byteforge-<something>.vercel.app`.

### Step C — Connect the two (CORS)
1. Back in **Render** → your service → **Environment** → add:
   - `ALLOWED_ORIGINS` = `https://byteforge-<something>.vercel.app` *(your exact Vercel URL, no trailing slash)*
2. Save — Render redeploys automatically.
3. Open your Vercel URL and run a compression — it should work end to end.

> **Why this step matters:** the browser blocks cross-origin requests unless the
> backend explicitly allows the frontend's origin. `api.py` reads the allowed
> origin(s) from `ALLOWED_ORIGINS` (comma-separated for multiple).

---

## 3. Important notes & gotchas

- **Render free tier sleeps after ~15 min idle.** The first request after that takes
  ~30–50s to wake. **Before a live viva/demo, open the `/health` URL once** to wake it,
  or upgrade to the $7/mo instance for the evaluation period.
- **Two lockfiles in `frontend/`** (`package-lock.json` and `pnpm-lock.yaml`) cause a
  Next.js workspace-root warning. Delete one (keep `package-lock.json` if you use npm).
- **`requirements.txt` vs `requirements-api.txt`:** the original `requirements.txt`
  holds the *Streamlit* app's dependencies (`app.py`). The FastAPI backend that the
  Next.js frontend uses needs only `requirements-api.txt`. Deploy with the API file.
- **Input limits:** the API caps recursion depth, graph size, string/matrix dimensions
  so public traffic can't overload the free tier.

---

## 4. Push to GitHub (if not already)

```powershell
cd "C:\Users\Shreyas\OneDrive\Desktop\DAA LAB EL\byteforge"
git add .
git commit -m "Add deployment config and new algorithm visualizers"
# create an empty repo on github.com first, then:
git remote add origin https://github.com/<your-username>/byteforge.git
git branch -M main
git push -u origin main
```
The included `.gitignore` keeps `node_modules/`, `.next/` and `__pycache__/` out of the repo.

---

## 5. Alternative: single-machine Docker (optional)

If you'd rather run both services with one command on any machine, ask and I'll add a
`Dockerfile` + `docker-compose.yml`. Good talking point for a project report
("containerized deployment"), but not required for the Vercel + Render path above.

---

## Quick reference

| What | URL / command |
|------|---------------|
| Local backend health | http://localhost:8000/health |
| Local API docs | http://localhost:8000/docs |
| Local frontend | http://localhost:3000 |
| Backend start | `uvicorn api:app --host 0.0.0.0 --port $PORT` |
| Backend deps | `pip install -r requirements-api.txt` |
| Frontend → backend var | `NEXT_PUBLIC_API_URL` |
| Backend → frontend var | `ALLOWED_ORIGINS` |
