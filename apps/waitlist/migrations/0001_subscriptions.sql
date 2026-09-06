-- Waitlist subscriptions. Addresses are AES-256-GCM ciphertext plus a keyed
-- HMAC digest for duplicate detection; see src/lib/server/crypto.ts.
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL,
  email_ciphertext TEXT NOT NULL,
  email_iv TEXT NOT NULL,
  email_digest TEXT NOT NULL,
  encryption_key_version TEXT NOT NULL,
  consent_version TEXT NOT NULL,
  joined_at TEXT NOT NULL,
  UNIQUE (brand_id, email_digest)
) STRICT;

CREATE INDEX subscriptions_brand_joined ON subscriptions (brand_id, joined_at, id);

-- Who read or deleted what through the admin API. The actor can be an admin
-- email; subscriber addresses are never stored here.
CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  at TEXT NOT NULL,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  brand_id TEXT NOT NULL,
  subject_id TEXT
) STRICT;
