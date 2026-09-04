-- ============================================================
-- Migration: Add ticket_status_history table
-- Run this in your Supabase SQL Editor AFTER the main schema
-- ============================================================

CREATE TABLE IF NOT EXISTS ticket_status_history (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id       UUID        NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status      TEXT        NOT NULL,
  changed_by      UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_status_history_ticket   ON ticket_status_history(ticket_id);
CREATE INDEX IF NOT EXISTS idx_status_history_created  ON ticket_status_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_status_history_changed  ON ticket_status_history(changed_by);

-- RLS
ALTER TABLE ticket_status_history ENABLE ROW LEVEL SECURITY;

-- Customers can read history for their own tickets
CREATE POLICY "status_history: customer read"
  ON ticket_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_status_history.ticket_id
        AND tickets.customer_id = auth.uid()
    )
    OR is_staff()
  );

-- Only staff can insert history entries
CREATE POLICY "status_history: staff insert"
  ON ticket_status_history FOR INSERT
  WITH CHECK (is_staff());

-- Enable Realtime for live status updates
ALTER PUBLICATION supabase_realtime ADD TABLE ticket_status_history;

-- ── Back-fill: seed an "opened" entry for every existing ticket ──
INSERT INTO ticket_status_history (ticket_id, previous_status, new_status, changed_by, created_at)
SELECT id, NULL, status, assigned_to, created_at
FROM   tickets
ON CONFLICT DO NOTHING;

-- ── Fix the Resolved Today bug in dashboard ──
-- (No schema change needed — just document the correct field to use is resolved_at)
-- SELECT COUNT(*) FROM tickets WHERE resolved_at::date = CURRENT_DATE;
