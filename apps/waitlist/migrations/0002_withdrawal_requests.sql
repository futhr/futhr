-- No email copy: requests refer to the subscription that existed at receipt.
-- Keep the reference after deletion so an old request cannot erase a new join.
CREATE TABLE withdrawal_requests (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL,
  subscription_id TEXT NOT NULL,
  requested_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'dismissed')),
  closed_at TEXT,
  closed_by TEXT,
  decision TEXT,
  case_reference TEXT
) STRICT;
CREATE UNIQUE INDEX withdrawal_pending_subscription
  ON withdrawal_requests (brand_id, subscription_id) WHERE status = 'pending';
CREATE INDEX withdrawal_inbox ON withdrawal_requests (brand_id, status, requested_at, id);
