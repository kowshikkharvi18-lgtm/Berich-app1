# BeRich 💎 — Nishmitha's Grow 🌱

A full-stack personal budget tracker built with React + Node.js + SQLite.

---

## 🚀 Deploy to GitHub + Render (Step by Step)

### Step 1 — Push to GitHub

1. Go to [github.com](https://github.com) → **New repository**
2. Name it `berich-app` → **Create repository**
3. Open a terminal in this folder and run:

```bash
cd budget-app
git init
git add .
git commit -m "Initial commit — BeRich app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/berich-app.git
git push -u origin main
```

> Replace `YOUR_USERNAME` with your GitHub username.

---

### Step 2 — Deploy on Render (Free)

1. Go to [render.com](https://render.com) → Sign up / Log in
2. Click **New +** → **Web Service**
3. Connect your GitHub account → Select `berich-app` repo
4. Fill in these settings:

| Setting | Value |
|---|---|
| **Name** | berich-app |
| **Root Directory** | `budget-app` |
| **Runtime** | Node |
| **Build Command** | `npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | Free |

5. Under **Environment Variables**, add:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | *(click Generate)* |
| `AUTO_BACKUP` | `true` |

6. Under **Disks** → **Add Disk**:

| Setting | Value |
|---|---|
| **Name** | berich-db |
| **Mount Path** | `/opt/render/project/src/server/db` |
| **Size** | 1 GB |

7. Click **Create Web Service** — Render will build and deploy automatically.

8. Your app will be live at: `https://berich-app.onrender.com`

---

### Step 3 — After Deploy

- First visit may take ~30 seconds (free tier spins down after inactivity)
- Register your account — all data is saved to the persistent disk
- The DB auto-backs up daily to `/server/db/backups/`

---

## 💻 Run Locally

```bash
# Install all dependencies
cd budget-app
npm run install:all

# Copy env file
cp server/.env.example server/.env
# Edit server/.env and set your JWT_SECRET

# Start both servers
start.bat          # Windows
# or
npm run dev        # Mac/Linux
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

---

## 📁 Project Structure

```
budget-app/
├── client/          # React + Vite frontend
│   └── src/
│       ├── pages/   # Home, Expenses, Savings, Tools, Profile
│       ├── components/
│       └── lib/
├── server/          # Express API
│   ├── routes/      # auth, expenses, income, savings, emis, splits, dashboard
│   ├── db/          # SQLite database + backup
│   └── middleware/  # JWT auth
├── render.yaml      # One-click Render deploy config
└── README.md
```

---

## 🔒 Security Notes

- Never commit `server/.env` — it's in `.gitignore`
- Change `JWT_SECRET` to a long random string in production
- Generate one: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
