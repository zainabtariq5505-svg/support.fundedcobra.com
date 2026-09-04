-- ============================================================
-- STEP 1: Run this FIRST to clean everything up
-- Then run complete_setup.sql
-- ============================================================

-- Drop all tables with CASCADE (handles ownership issues)
DROP TABLE IF EXISTS ticket_status_history    CASCADE;
DROP TABLE IF EXISTS customer_ratings         CASCADE;
DROP TABLE IF EXISTS ticket_tag_assignments   CASCADE;
DROP TABLE IF EXISTS ticket_tags              CASCADE;
DROP TABLE IF EXISTS ticket_attachments       CASCADE;
DROP TABLE IF EXISTS internal_notes           CASCADE;
DROP TABLE IF EXISTS ticket_messages          CASCADE;
DROP TABLE IF EXISTS notifications            CASCADE;
DROP TABLE IF EXISTS saved_replies            CASCADE;
DROP TABLE IF EXISTS tickets                  CASCADE;
DROP TABLE IF EXISTS profiles                 CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS is_staff()              CASCADE;
DROP FUNCTION IF EXISTS is_admin()              CASCADE;
DROP FUNCTION IF EXISTS set_updated_at()        CASCADE;
DROP FUNCTION IF EXISTS handle_new_user()       CASCADE;
DROP FUNCTION IF EXISTS generate_ticket_number() CASCADE;

-- Drop triggers on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop sequence
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'ticket_number_seq' AND relkind = 'S') THEN
    EXECUTE 'DROP SEQUENCE ticket_number_seq CASCADE';
  END IF;
END $$;

SELECT 'Reset complete — now run complete_setup.sql' AS status;
