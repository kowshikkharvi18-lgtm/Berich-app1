require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const compression = require('compression');
const path        = require('path');

// ── Auto-backup on startup ────────────────────────────────────────────────────
if (process.env.AUTO_BACKUP === 'true') {
  try {
    require('./db/backup');
    setInterval(() => {
      try { require('./db/backup'); } catch (e) { console.error('Backup error:', e.message); }
    }, 24 * 60 * 60 * 1000);
  } catch (e) { console.error('Initial backup error:', e.message); }
}

const app = express();
const isProd = process.env.NODE_ENV === 'production';

app.use(compression());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
    if (/^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(origin)) return callback(null, true);
    // Allow Render domains and any custom domain set via env
    const allowed = process.env.ALLOWED_ORIGIN;
    if (allowed && origin === allowed) return callback(null, true);
    if (/\.onrender\.com$/.test(origin)) return callback(null, true);
    callback(null, true);
  },
  credentials: true,
}));
app.use(express.json());

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/expenses',   require('./routes/expenses'));
app.use('/api/income',     require('./routes/income'));
app.use('/api/emis',       require('./routes/emis'));
app.use('/api/splits',     require('./routes/splits'));
app.use('/api/savings',    require('./routes/savings'));
app.use('/api/dashboard',  require('./routes/dashboard'));

app.get('/api/health', (_, res) => res.json({ status: 'ok', app: 'BeRich', env: process.env.NODE_ENV }));

// ── Serve React build in production ──────────────────────────────────────────
if (isProd) {
  const clientDist = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDist));
  // All non-API routes → React app (client-side routing)
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 BeRich API → http://localhost:${PORT}`);
  if (!isProd) console.log(`📱 Mobile → http://<your-local-IP>:${PORT}`);
});
