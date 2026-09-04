-- ============================================================
-- RLS Fix: Allow staff to read ALL profiles
-- Run this in Supabase SQL Editor if staff ticket page shows "Ticket not found"
-- ============================================================

-- Drop the existing restrictive read policy
DROP POLICY IF EXISTS "profiles: own read" ON profiles;

-- Re-create with staff bypass
CREATE POLICY "profiles: read"
  ON profiles FOR SELECT
  USING (
    id = auth.uid()   -- users can always read their own profile
    OR EXISTS (       -- staff can read any profile
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('support_agent','finance','partnership_manager','admin')
    )
  );

-- Also allow staff to read ALL tickets (not just their own)
DROP POLICY IF EXISTS "tickets: staff update" ON tickets;
CREATE POLICY "tickets: staff update"
  ON tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('support_agent','finance','partnership_manager','admin')
    )
  );

-- Allow staff to read messages on any ticket
DROP POLICY IF EXISTS "messages: read" ON ticket_messages;
CREATE POLICY "messages: read"
  ON ticket_messages FOR SELECT
  USING (
    -- Staff can read all messages
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('support_agent','finance','partnership_manager','admin')
    )
    OR
    -- Customers can only read non-internal messages on their own tickets
    (
      is_internal = FALSE
      AND EXISTS (
        SELECT 1 FROM tickets
        WHERE tickets.id = ticket_messages.ticket_id
          AND tickets.customer_id = auth.uid()
      )
    )
  );
