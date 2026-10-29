-- Public Embrilo core schema (separate from Embrilo OS; no shared tables).
-- Money: INTEGER minor units, explicit currency. IDR has no minor unit, so amount = rupiah.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS customers (
  id               TEXT PRIMARY KEY,                 -- internal stable id (cus_…)
  clerk_user_id    TEXT NOT NULL UNIQUE,             -- verified Clerk subject; email is NOT the key
  email            TEXT,
  email_verified   INTEGER NOT NULL DEFAULT 0 CHECK (email_verified IN (0, 1)),
  status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS quote_requests (
  id               TEXT PRIMARY KEY,
  public_ref       TEXT NOT NULL UNIQUE,             -- shown to customer; NOT authorization
  customer_id      TEXT NOT NULL REFERENCES customers(id),
  service_code     TEXT NOT NULL,
  offer_version    TEXT NOT NULL,
  offer_snapshot   TEXT NOT NULL,                    -- immutable JSON snapshot of scope/pricing mode
  brief            TEXT NOT NULL,                    -- validated JSON brief
  terms_version    TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'received'
                   CHECK (status IN ('received', 'in_review', 'quoted', 'accepted', 'declined', 'cancelled')),
  idempotency_key  TEXT NOT NULL,
  request_hash     TEXT NOT NULL,
  os_sync_status   TEXT NOT NULL DEFAULT 'not_configured'
                   CHECK (os_sync_status IN ('not_configured', 'pending', 'synced', 'failed')),
  os_public_ref    TEXT,
  os_customer_token TEXT,                            -- OS capability token; server-side only, never sent to browser
  os_attempts      INTEGER NOT NULL DEFAULT 0,
  os_last_attempt_at TEXT,
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL,
  UNIQUE (customer_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_quote_requests_customer ON quote_requests (customer_id, created_at);

CREATE TABLE IF NOT EXISTS orders (
  id               TEXT PRIMARY KEY,
  public_ref       TEXT NOT NULL UNIQUE,
  customer_id      TEXT NOT NULL REFERENCES customers(id),
  quote_request_id TEXT REFERENCES quote_requests(id),
  description      TEXT NOT NULL,
  amount           INTEGER NOT NULL CHECK (amount > 0),
  currency         TEXT NOT NULL DEFAULT 'IDR' CHECK (currency = 'IDR'),
  order_status     TEXT NOT NULL DEFAULT 'awaiting_payment'
                   CHECK (order_status IN ('awaiting_payment', 'paid', 'queued', 'in_production', 'quality_review',
                                           'revision_requested', 'ready_for_delivery', 'delivered', 'completed',
                                           'cancelled', 'refunded', 'failed_manual_review')),
  payment_status   TEXT NOT NULL DEFAULT 'not_started'
                   CHECK (payment_status IN ('not_started', 'pending', 'verified_paid', 'failed', 'expired',
                                             'refunded', 'manual_review')),
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders (customer_id, created_at);

CREATE TABLE IF NOT EXISTS payment_attempts (
  id                 TEXT PRIMARY KEY,
  order_id           TEXT NOT NULL REFERENCES orders(id),
  provider           TEXT NOT NULL CHECK (provider IN ('duitku')),
  environment        TEXT NOT NULL CHECK (environment IN ('sandbox', 'production')),
  merchant_order_id  TEXT NOT NULL UNIQUE,
  provider_reference TEXT,
  amount             INTEGER NOT NULL CHECK (amount > 0),
  currency           TEXT NOT NULL DEFAULT 'IDR',
  status             TEXT NOT NULL DEFAULT 'created'
                     CHECK (status IN ('created', 'pending', 'paid', 'failed', 'expired', 'manual_review')),
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_order ON payment_attempts (order_id);

CREATE TABLE IF NOT EXISTS payment_events (
  id                 TEXT PRIMARY KEY,
  provider           TEXT NOT NULL,
  event_key          TEXT NOT NULL,                  -- sha256 of provider reference + result + amount
  merchant_order_id  TEXT NOT NULL,
  result_code        TEXT,
  amount             INTEGER,
  signature_valid    INTEGER NOT NULL CHECK (signature_valid IN (0, 1)),
  outcome            TEXT NOT NULL,
  received_at        TEXT NOT NULL,
  UNIQUE (provider, event_key)
);

CREATE TABLE IF NOT EXISTS audit_events (
  id             TEXT PRIMARY KEY,
  actor          TEXT NOT NULL,
  action         TEXT NOT NULL,
  target         TEXT,
  outcome        TEXT NOT NULL,
  correlation_id TEXT,
  created_at     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rate_limits (
  bucket       TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count        INTEGER NOT NULL
);
