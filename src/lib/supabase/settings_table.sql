-- Run this in Supabase SQL Editor to add the settings table
-- https://supabase.com/dashboard/project/oqeqfacdwupqiutbshjb/sql/new

CREATE TABLE IF NOT EXISTS portal_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE portal_settings ENABLE ROW LEVEL SECURITY;

-- Only staff can read settings
CREATE POLICY "settings: staff read"
  ON portal_settings FOR SELECT
  USING (is_staff());

-- Only admin can write settings
CREATE POLICY "settings: admin write"
  ON portal_settings FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Insert default empty values
INSERT INTO portal_settings (key, value) VALUES
  ('discord_webhook_url', ''),
  ('discord_client_id',   ''),
  ('discord_client_secret', ''),
  ('notif_new_ticket',    'true'),
  ('notif_urgent_ticket', 'true'),
  ('notif_customer_reply','true'),
  ('notif_assignment',    'false'),
  ('notif_status_change', 'true'),
  ('notif_staff_reply',   'true')
ON CONFLICT (key) DO NOTHING;
