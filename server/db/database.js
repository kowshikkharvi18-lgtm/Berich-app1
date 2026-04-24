const knex = require('knex');
const path = require('path');
const fs   = require('fs');

// ── Ensure db directory exists ────────────────────────────────────────────────
const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'app.db');

const db = knex({
  client: 'sqlite3',
  connection: { filename: DB_PATH },
  useNullAsDefault: true,
  pool: {
    min: 1,
    max: 1,
    afterCreate: (conn, cb) => {
      // Run all PRAGMAs in sequence for reliability & performance
      conn.run('PRAGMA foreign_keys    = ON',         e => { if (e) return cb(e);
      conn.run('PRAGMA journal_mode    = WAL',         e => { if (e) return cb(e);
      conn.run('PRAGMA synchronous     = NORMAL',      e => { if (e) return cb(e);
      conn.run('PRAGMA cache_size      = -32000',      e => { if (e) return cb(e); // 32 MB cache
      conn.run('PRAGMA temp_store      = MEMORY',      e => { if (e) return cb(e);
      conn.run('PRAGMA mmap_size       = 268435456',   e => { if (e) return cb(e); // 256 MB mmap
      conn.run('PRAGMA page_size       = 4096',        e => { if (e) return cb(e);
      conn.run('PRAGMA auto_vacuum     = INCREMENTAL', e => { if (e) return cb(e);
      conn.run('PRAGMA wal_autocheckpoint = 1000',     cb);
      }); }); }); }); }); }); }); });
    },
  },
});

// ── Migration: add column if missing ─────────────────────────────────────────
async function addColumnIfMissing(table, column, addFn) {
  const exists = await db.schema.hasColumn(table, column);
  if (!exists) {
    await db.schema.alterTable(table, addFn);
    console.log(`  ↳ migrated: ${table}.${column} added`);
  }
}

// ── Schema init & migrations ──────────────────────────────────────────────────
async function initDB() {
  console.log('🔧 BeRich DB initialising...');

  // ── users ──────────────────────────────────────────────────────────────────
  if (!await db.schema.hasTable('users')) {
    await db.schema.createTable('users', t => {
      t.increments('id').primary();
      t.string('name', 150).notNullable();
      t.string('email', 200).notNullable().unique();
      t.string('password', 255).notNullable();
      t.decimal('monthly_salary', 14, 2).defaultTo(0);   // up to 99 trillion
      t.integer('salary_date').defaultTo(1).checkBetween([1, 31]);
      t.string('language', 5).defaultTo('en');
      t.integer('savings_pct').defaultTo(20).checkBetween([0, 100]);
      t.boolean('setup_done').defaultTo(false);
      t.string('company', 200).nullable();
      t.string('city', 150).nullable();
      t.string('currency', 5).defaultTo('INR');
      t.string('timezone', 50).defaultTo('Asia/Kolkata');
      t.boolean('is_active').defaultTo(true);
      t.timestamp('last_login_at').nullable();
      t.timestamp('created_at').defaultTo(db.fn.now());
      t.string('updated_at', 30).defaultTo('2024-01-01 00:00:00');
    });
  }
  // Migrations for existing users table
  await addColumnIfMissing('users', 'currency',      t => t.string('currency', 5).defaultTo('INR'));
  await addColumnIfMissing('users', 'timezone',      t => t.string('timezone', 50).defaultTo('Asia/Kolkata'));
  await addColumnIfMissing('users', 'is_active',     t => t.boolean('is_active').defaultTo(true));
  await addColumnIfMissing('users', 'last_login_at', t => t.timestamp('last_login_at').nullable());
  await addColumnIfMissing('users', 'updated_at',    t => t.string('updated_at', 30).defaultTo('2024-01-01 00:00:00'));

  // ── categories ─────────────────────────────────────────────────────────────
  if (!await db.schema.hasTable('categories')) {
    await db.schema.createTable('categories', t => {
      t.increments('id').primary();
      t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      t.string('name_en', 150).notNullable();
      t.string('name_kn', 150).notNullable();
      t.enu('type', ['need', 'want', 'saving', 'income']).notNullable();
      t.string('icon', 100).notNullable().defaultTo('circle');
      t.string('color', 20).notNullable().defaultTo('#FF9933');
      t.decimal('monthly_budget', 14, 2).defaultTo(0);
      t.boolean('is_default').defaultTo(false);
      t.boolean('is_archived').defaultTo(false);
      t.timestamp('created_at').defaultTo(db.fn.now());
      t.string('updated_at', 30).defaultTo('2024-01-01 00:00:00');
    });
  }
  await addColumnIfMissing('categories', 'is_archived', t => t.boolean('is_archived').defaultTo(false));
  await addColumnIfMissing('categories', 'updated_at',  t => t.string('updated_at', 30).defaultTo('2024-01-01 00:00:00'));

  // ── expenses ───────────────────────────────────────────────────────────────
  if (!await db.schema.hasTable('expenses')) {
    await db.schema.createTable('expenses', t => {
      t.increments('id').primary();
      t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      t.integer('category_id').notNullable().references('id').inTable('categories').onDelete('RESTRICT');
      t.decimal('amount', 14, 2).notNullable();
      t.string('date', 10).notNullable();       // YYYY-MM-DD
      t.string('month', 7).notNullable();       // YYYY-MM
      t.string('year', 4).notNullable();        // YYYY  — for yearly reports
      t.enu('payment_method', ['upi','cash','card','netbanking','wallet','emi','other']).defaultTo('upi');
      t.text('notes').nullable();
      t.boolean('is_split').defaultTo(false);
      t.boolean('recurring').defaultTo(false);
      t.string('recurring_interval', 20).nullable(); // daily|weekly|monthly|yearly
      t.boolean('is_deleted').defaultTo(false);      // soft delete
      t.timestamp('deleted_at').nullable();
      t.timestamp('created_at').defaultTo(db.fn.now());
      t.string('updated_at', 30).defaultTo('2024-01-01 00:00:00');
    });
  }
  await addColumnIfMissing('expenses', 'year',               t => t.string('year', 4).defaultTo(''));
  await addColumnIfMissing('expenses', 'recurring_interval', t => t.string('recurring_interval', 20).nullable());
  await addColumnIfMissing('expenses', 'is_deleted',         t => t.boolean('is_deleted').defaultTo(false));
  await addColumnIfMissing('expenses', 'deleted_at',         t => t.timestamp('deleted_at').nullable());
  await addColumnIfMissing('expenses', 'updated_at',         t => t.string('updated_at', 30).defaultTo('2024-01-01 00:00:00'));

  // Backfill year column for existing rows
  await db.raw(`UPDATE expenses SET year = substr(date, 1, 4) WHERE year = '' OR year IS NULL`);

  // ── income ─────────────────────────────────────────────────────────────────
  if (!await db.schema.hasTable('income')) {
    await db.schema.createTable('income', t => {
      t.increments('id').primary();
      t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      t.decimal('amount', 14, 2).notNullable();
      t.string('source', 150).notNullable().defaultTo('Salary');
      t.string('date', 10).notNullable();
      t.string('month', 7).notNullable();
      t.string('year', 4).notNullable();
      t.text('notes').nullable();
      t.boolean('is_deleted').defaultTo(false);
      t.timestamp('deleted_at').nullable();
      t.timestamp('created_at').defaultTo(db.fn.now());
      t.string('updated_at', 30).defaultTo('2024-01-01 00:00:00');
    });
  }
  await addColumnIfMissing('income', 'year',       t => t.string('year', 4).defaultTo(''));
  await addColumnIfMissing('income', 'is_deleted', t => t.boolean('is_deleted').defaultTo(false));
  await addColumnIfMissing('income', 'deleted_at', t => t.timestamp('deleted_at').nullable());
  await addColumnIfMissing('income', 'updated_at', t => t.string('updated_at', 30).defaultTo('2024-01-01 00:00:00'));
  await db.raw(`UPDATE income SET year = substr(date, 1, 4) WHERE year = '' OR year IS NULL`);

  // ── emis ───────────────────────────────────────────────────────────────────
  if (!await db.schema.hasTable('emis')) {
    await db.schema.createTable('emis', t => {
      t.increments('id').primary();
      t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      t.string('name', 150).notNullable();
      t.decimal('total_amount', 14, 2).notNullable().defaultTo(0);
      t.decimal('monthly_emi', 14, 2).notNullable();
      t.integer('total_months').notNullable();
      t.integer('paid_months').defaultTo(0);
      t.integer('due_date').notNullable().defaultTo(5);
      t.string('bank', 150).nullable();
      t.string('color', 20).defaultTo('#6366f1');
      t.boolean('is_active').defaultTo(true);
      t.string('start_date', 10).nullable();
      t.decimal('interest_rate', 5, 2).defaultTo(0);  // % per annum
      t.timestamp('created_at').defaultTo(db.fn.now());
      t.string('updated_at', 30).defaultTo('2024-01-01 00:00:00');
    });
  }
  await addColumnIfMissing('emis', 'start_date',    t => t.string('start_date', 10).nullable());
  await addColumnIfMissing('emis', 'interest_rate', t => t.decimal('interest_rate', 5, 2).defaultTo(0));
  await addColumnIfMissing('emis', 'updated_at',    t => t.string('updated_at', 30).defaultTo('2024-01-01 00:00:00'));

  // ── bill_splits ────────────────────────────────────────────────────────────
  if (!await db.schema.hasTable('bill_splits')) {
    await db.schema.createTable('bill_splits', t => {
      t.increments('id').primary();
      t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      t.string('title', 200).notNullable();
      t.decimal('total_amount', 14, 2).notNullable();
      t.decimal('your_share', 14, 2).notNullable();
      t.text('split_with').notNullable().defaultTo('[]');
      t.enu('status', ['pending', 'settled', 'cancelled']).defaultTo('pending');
      t.string('date', 10).notNullable();
      t.text('notes').nullable();
      t.string('settled_date', 10).nullable();
      t.timestamp('created_at').defaultTo(db.fn.now());
      t.string('updated_at', 30).defaultTo('2024-01-01 00:00:00');
    });
  }
  await addColumnIfMissing('bill_splits', 'settled_date', t => t.string('settled_date', 10).nullable());
  await addColumnIfMissing('bill_splits', 'updated_at',   t => t.string('updated_at', 30).defaultTo('2024-01-01 00:00:00'));

  // ── savings_goals ──────────────────────────────────────────────────────────
  if (!await db.schema.hasTable('savings_goals')) {
    await db.schema.createTable('savings_goals', t => {
      t.increments('id').primary();
      t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      t.string('name', 150).notNullable();
      t.enu('type', ['sip', 'gold', 'emergency', 'fd', 'ppf', 'other']).defaultTo('other');
      t.decimal('target_amount', 14, 2).notNullable();
      t.decimal('saved_amount', 14, 2).defaultTo(0);
      t.string('deadline', 10).nullable();
      t.string('color', 20).defaultTo('#10b981');
      t.string('icon', 100).defaultTo('piggy-bank');
      t.boolean('is_completed').defaultTo(false);
      t.string('completed_date', 10).nullable();
      t.text('notes').nullable();
      t.timestamp('created_at').defaultTo(db.fn.now());
      t.string('updated_at', 30).defaultTo('2024-01-01 00:00:00');
    });
  }
  await addColumnIfMissing('savings_goals', 'is_completed',   t => t.boolean('is_completed').defaultTo(false));
  await addColumnIfMissing('savings_goals', 'completed_date', t => t.string('completed_date', 10).nullable());
  await addColumnIfMissing('savings_goals', 'notes',          t => t.text('notes').nullable());
  await addColumnIfMissing('savings_goals', 'updated_at',     t => t.string('updated_at', 30).defaultTo('2024-01-01 00:00:00'));

  // ── festival_savings ───────────────────────────────────────────────────────
  if (!await db.schema.hasTable('festival_savings')) {
    await db.schema.createTable('festival_savings', t => {
      t.increments('id').primary();
      t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      t.string('festival_name', 150).notNullable();
      t.string('festival_name_kn', 150).nullable();
      t.decimal('target_amount', 14, 2).notNullable();
      t.decimal('saved_amount', 14, 2).defaultTo(0);
      t.string('festival_date', 10).notNullable();
      t.string('color', 20).defaultTo('#FF9933');
      t.boolean('is_recurring').defaultTo(true);  // auto-repeat next year
      t.timestamp('created_at').defaultTo(db.fn.now());
      t.string('updated_at', 30).defaultTo('2024-01-01 00:00:00');
    });
  }
  await addColumnIfMissing('festival_savings', 'is_recurring', t => t.boolean('is_recurring').defaultTo(true));
  await addColumnIfMissing('festival_savings', 'updated_at',   t => t.string('updated_at', 30).defaultTo('2024-01-01 00:00:00'));

  // ── audit_log — every important action is recorded ────────────────────────
  if (!await db.schema.hasTable('audit_log')) {
    await db.schema.createTable('audit_log', t => {
      t.increments('id').primary();
      t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      t.string('action', 50).notNullable();   // CREATE|UPDATE|DELETE
      t.string('entity', 50).notNullable();   // expense|income|goal|emi…
      t.integer('entity_id').nullable();
      t.text('snapshot').nullable();           // JSON of the row before change
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
  }

  // ── Indexes (all query patterns covered) ──────────────────────────────────
  const idx = [
    ['idx_exp_user_month',    'expenses(user_id, month)'],
    ['idx_exp_user_year',     'expenses(user_id, year)'],
    ['idx_exp_user_date',     'expenses(user_id, date)'],
    ['idx_exp_cat',           'expenses(category_id)'],
    ['idx_exp_soft_del',      'expenses(user_id, is_deleted)'],
    ['idx_inc_user_month',    'income(user_id, month)'],
    ['idx_inc_user_year',     'income(user_id, year)'],
    ['idx_cat_user',          'categories(user_id, type)'],
    ['idx_cat_user_archived', 'categories(user_id, is_archived)'],
    ['idx_emis_user_active',  'emis(user_id, is_active)'],
    ['idx_splits_user_status','bill_splits(user_id, status)'],
    ['idx_savings_user',      'savings_goals(user_id, is_completed)'],
    ['idx_festival_user',     'festival_savings(user_id, festival_date)'],
    ['idx_audit_user',        'audit_log(user_id, entity, created_at)'],
  ];
  for (const [name, def] of idx) {
    await db.raw(`CREATE INDEX IF NOT EXISTS ${name} ON ${def}`);
  }

  // ── Integrity check ────────────────────────────────────────────────────────
  const [{ integrity_check }] = await db.raw('PRAGMA integrity_check').then(r => r);
  if (integrity_check !== 'ok') {
    console.error('❌ DB integrity check FAILED:', integrity_check);
  } else {
    console.log('✅ BeRich DB ready — integrity OK');
  }
}

initDB().catch(e => { console.error('❌ DB init error:', e.message); process.exit(1); });

module.exports = db;
