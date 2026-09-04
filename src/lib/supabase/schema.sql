-- ============================================================
-- Funded Cobra Support Portal — Complete Database Schema
-- Run this entire script in the Supabase SQL Editor
-- ============================================================

-- ── Extensions ────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Clean slate (safe order respects FK deps) ─────────────────────
DROP TABLE IF EXISTS customer_ratings       CASCADE;
DROP TABLE IF EXISTS ticket_tag_assignments CASCADE;
DROP TABLE IF EXISTS ticket_tags            CASCADE;
DROP TABLE IF EXISTS ticket_attachments     CASCADE;
DROP TABLE IF EXISTS internal_notes         CASCADE;
DROP TABLE IF EXISTS ticket_messages        CASCADE;
DROP TABLE IF EXISTS notifications          CASCADE;
DROP TABLE IF EXISTS saved_replies          CASCADE;
DROP TABLE IF EXISTS tickets               CASCADE;
DROP TABLE IF EXISTS profiles              CASCADE;

-- ── profiles ──────────────────────────────────────────────────────
CREATE TABLE profiles (
  id                UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name         TEXT,
  email             TEXT,
  discord_id        TEXT        UNIQUE,
  discord_username  TEXT,
  discord_avatar    TEXT,
  role              TEXT        NOT NULL DEFAULT 'customer'
                                CHECK (role IN ('customer','support_agent','finance','partnership_manager','admin')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── tickets ───────────────────────────────────────────────────────
CREATE TABLE tickets (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number   TEXT        NOT NULL UNIQUE,
  customer_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject         TEXT        NOT NULL,
  description     TEXT,
  category        TEXT        NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'open'
                              CHECK (status IN ('open','in_progress','waiting_for_customer','waiting_for_staff','resolved','closed')),
  priority        TEXT        NOT NULL DEFAULT 'normal'
                              CHECK (priority IN ('low','normal','high','urgent')),
  assigned_to     UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  account_id      TEXT,
  order_id        TEXT,
  transaction_id  TEXT,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── ticket_messages ───────────────────────────────────────────────
CREATE TABLE ticket_messages (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id   UUID        NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  sender_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message     TEXT        NOT NULL,
  is_internal BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── internal_notes ────────────────────────────────────────────────
CREATE TABLE internal_notes (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id   UUID        NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  staff_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  note        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── ticket_attachments ────────────────────────────────────────────
CREATE TABLE ticket_attachments (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id    UUID        NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  message_id   UUID        REFERENCES ticket_messages(id) ON DELETE SET NULL,
  uploaded_by  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name    TEXT        NOT NULL,
  file_url     TEXT        NOT NULL,
  file_type    TEXT,
  file_size    BIGINT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── ticket_tags ───────────────────────────────────────────────────
CREATE TABLE ticket_tags (
  id      UUID  PRIMARY KEY DEFAULT uuid_generate_v4(),
  name    TEXT  NOT NULL UNIQUE,
  color   TEXT  DEFAULT '#6B7280'
);

INSERT INTO ticket_tags (name, color) VALUES
  ('VIP',       '#A855F7'),
  ('Payout',    '#4ADE80'),
  ('Payment',   '#FCD34D'),
  ('Priority',  '#F87171'),
  ('Affiliate', '#FB923C'),
  ('Technical', '#93C5FD')
ON CONFLICT (name) DO NOTHING;

-- ── ticket_tag_assignments ────────────────────────────────────────
CREATE TABLE ticket_tag_assignments (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  tag_id    UUID NOT NULL REFERENCES ticket_tags(id) ON DELETE CASCADE,
  UNIQUE (ticket_id, tag_id)
);

-- ── saved_replies ─────────────────────────────────────────────────
CREATE TABLE saved_replies (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title      TEXT        NOT NULL,
  content    TEXT        NOT NULL,
  category   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── notifications ─────────────────────────────────────────────────
CREATE TABLE notifications (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title      TEXT        NOT NULL,
  message    TEXT        NOT NULL,
  type       TEXT        NOT NULL
             CHECK (type IN ('new_ticket','ticket_reply','status_change','assigned','resolved','closed')),
  ticket_id  UUID        REFERENCES tickets(id) ON DELETE CASCADE,
  is_read    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── customer_ratings ──────────────────────────────────────────────
CREATE TABLE customer_ratings (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id   UUID        NOT NULL REFERENCES tickets(id) ON DELETE CASCADE UNIQUE,
  customer_id UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating      SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────
CREATE INDEX idx_tickets_customer       ON tickets(customer_id);
CREATE INDEX idx_tickets_assigned       ON tickets(assigned_to);
CREATE INDEX idx_tickets_status         ON tickets(status);
CREATE INDEX idx_tickets_priority       ON tickets(priority);
CREATE INDEX idx_tickets_category       ON tickets(category);
CREATE INDEX idx_tickets_updated        ON tickets(updated_at DESC);
CREATE INDEX idx_messages_ticket        ON ticket_messages(ticket_id);
CREATE INDEX idx_messages_sender        ON ticket_messages(sender_id);
CREATE INDEX idx_messages_internal      ON ticket_messages(is_internal);
CREATE INDEX idx_notes_ticket           ON internal_notes(ticket_id);
CREATE INDEX idx_notifications_user     ON notifications(user_id);
CREATE INDEX idx_notifications_read     ON notifications(is_read);
CREATE INDEX idx_notifications_ticket   ON notifications(ticket_id);
CREATE INDEX idx_attachments_ticket     ON ticket_attachments(ticket_id);

-- ── updated_at trigger ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_profiles_updated       BEFORE UPDATE ON profiles        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_tickets_updated        BEFORE UPDATE ON tickets         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_messages_updated       BEFORE UPDATE ON ticket_messages FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_notes_updated          BEFORE UPDATE ON internal_notes  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_saved_replies_updated  BEFORE UPDATE ON saved_replies   FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Auto-create profile on signup ─────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  )
  ON CONFLICT (id) DO UPDATE SET
    email      = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Ticket number generator ───────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 10001;

CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := 'FC-' || NEXTVAL('ticket_number_seq')::TEXT;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ticket_number
  BEFORE INSERT ON tickets
  FOR EACH ROW EXECUTE FUNCTION generate_ticket_number();

-- ── Notification helper ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION create_ticket_notification(
  p_user_id   UUID,
  p_title     TEXT,
  p_message   TEXT,
  p_type      TEXT,
  p_ticket_id UUID DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO notifications (user_id, title, message, type, ticket_id)
  VALUES (p_user_id, p_title, p_message, p_type, p_ticket_id);
END;
$$;

-- ── RLS: enable on all tables ─────────────────────────────────────
ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets               ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_notes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_attachments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_tags           ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_replies         ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_ratings      ENABLE ROW LEVEL SECURITY;

-- Helper: is current user staff?
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('support_agent','finance','partnership_manager','admin')
  );
$$;

-- Helper: is current user admin?
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- ── profiles policies ─────────────────────────────────────────────
CREATE POLICY "profiles: own read"   ON profiles FOR SELECT USING (id = auth.uid() OR is_staff());
CREATE POLICY "profiles: own update" ON profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles: insert"     ON profiles FOR INSERT WITH CHECK (id = auth.uid());

-- ── tickets policies ──────────────────────────────────────────────
CREATE POLICY "tickets: customer read own"  ON tickets FOR SELECT
  USING (customer_id = auth.uid() OR is_staff());
CREATE POLICY "tickets: customer insert"    ON tickets FOR INSERT
  WITH CHECK (customer_id = auth.uid());
CREATE POLICY "tickets: staff update"       ON tickets FOR UPDATE
  USING (is_staff());
CREATE POLICY "tickets: staff delete"       ON tickets FOR DELETE
  USING (is_admin());

-- ── ticket_messages policies ──────────────────────────────────────
-- Customers see only non-internal messages on their tickets
CREATE POLICY "messages: read"  ON ticket_messages FOR SELECT
  USING (
    is_internal = FALSE AND EXISTS (
      SELECT 1 FROM tickets WHERE tickets.id = ticket_id AND tickets.customer_id = auth.uid()
    )
    OR is_staff()
  );
CREATE POLICY "messages: insert" ON ticket_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      is_internal = FALSE
      OR is_staff()
    )
    AND EXISTS (
      SELECT 1 FROM tickets WHERE tickets.id = ticket_id
      AND (tickets.customer_id = auth.uid() OR is_staff())
    )
  );
CREATE POLICY "messages: update own" ON ticket_messages FOR UPDATE
  USING (sender_id = auth.uid() OR is_staff());
CREATE POLICY "messages: delete"     ON ticket_messages FOR DELETE
  USING (sender_id = auth.uid() OR is_staff());

-- ── internal_notes policies ───────────────────────────────────────
CREATE POLICY "notes: staff only read"   ON internal_notes FOR SELECT  USING (is_staff());
CREATE POLICY "notes: staff only insert" ON internal_notes FOR INSERT  WITH CHECK (is_staff() AND staff_id = auth.uid());
CREATE POLICY "notes: staff only update" ON internal_notes FOR UPDATE  USING (staff_id = auth.uid());
CREATE POLICY "notes: staff only delete" ON internal_notes FOR DELETE  USING (staff_id = auth.uid() OR is_admin());

-- ── ticket_attachments policies ───────────────────────────────────
CREATE POLICY "attachments: read" ON ticket_attachments FOR SELECT
  USING (
    uploaded_by = auth.uid()
    OR is_staff()
    OR EXISTS (
      SELECT 1 FROM tickets WHERE tickets.id = ticket_id AND tickets.customer_id = auth.uid()
    )
  );
CREATE POLICY "attachments: insert" ON ticket_attachments FOR INSERT
  WITH CHECK (uploaded_by = auth.uid());

-- ── ticket_tags policies ──────────────────────────────────────────
CREATE POLICY "tags: read all"     ON ticket_tags FOR SELECT USING (TRUE);
CREATE POLICY "tags: staff manage" ON ticket_tags FOR ALL   USING (is_staff());

-- ── ticket_tag_assignments policies ──────────────────────────────
CREATE POLICY "tag_assign: read"   ON ticket_tag_assignments FOR SELECT USING (is_staff());
CREATE POLICY "tag_assign: staff"  ON ticket_tag_assignments FOR ALL    USING (is_staff());

-- ── saved_replies policies ────────────────────────────────────────
CREATE POLICY "saved: staff read"   ON saved_replies FOR SELECT USING (is_staff());
CREATE POLICY "saved: staff insert" ON saved_replies FOR INSERT WITH CHECK (is_staff() AND staff_id = auth.uid());
CREATE POLICY "saved: staff update" ON saved_replies FOR UPDATE USING (staff_id = auth.uid() OR is_admin());
CREATE POLICY "saved: staff delete" ON saved_replies FOR DELETE USING (staff_id = auth.uid() OR is_admin());

-- ── notifications policies ────────────────────────────────────────
CREATE POLICY "notif: own read"   ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notif: own update" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "notif: system insert" ON notifications FOR INSERT WITH CHECK (TRUE); -- server-side only

-- ── customer_ratings policies ─────────────────────────────────────
CREATE POLICY "ratings: customer insert" ON customer_ratings FOR INSERT
  WITH CHECK (customer_id = auth.uid());
CREATE POLICY "ratings: read"            ON customer_ratings FOR SELECT
  USING (customer_id = auth.uid() OR is_staff());
CREATE POLICY "ratings: staff read all"  ON customer_ratings FOR SELECT
  USING (is_staff());

-- ── Realtime: enable for live chat ───────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE ticket_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
