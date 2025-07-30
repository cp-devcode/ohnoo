/*
  # Enhance Session System

  1. Schema Updates
    - Add booking_id to user_sessions table to link sessions with bookings
    - Add session_type to distinguish between subscription sessions and booking sessions
    - Add indexes for better performance

  2. New Features
    - Support for booking-based sessions
    - Minute-based time tracking instead of hour-based
    - Enhanced search capabilities
*/

-- Add new columns to user_sessions table
DO $$
BEGIN
  -- Add booking_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_sessions' AND column_name = 'booking_id'
  ) THEN
    ALTER TABLE user_sessions ADD COLUMN booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE;
  END IF;

  -- Add session_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_sessions' AND column_name = 'session_type'
  ) THEN
    ALTER TABLE user_sessions ADD COLUMN session_type text DEFAULT 'subscription' CHECK (session_type IN ('subscription', 'booking'));
  END IF;

  -- Add minutes_deducted column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_sessions' AND column_name = 'minutes_deducted'
  ) THEN
    ALTER TABLE user_sessions ADD COLUMN minutes_deducted numeric DEFAULT 0;
  END IF;

  -- Add confirmation_required column for booking sessions
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_sessions' AND column_name = 'confirmation_required'
  ) THEN
    ALTER TABLE user_sessions ADD COLUMN confirmation_required boolean DEFAULT false;
  END IF;

  -- Add confirmed_by column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_sessions' AND column_name = 'confirmed_by'
  ) THEN
    ALTER TABLE user_sessions ADD COLUMN confirmed_by uuid REFERENCES users(id);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS user_sessions_booking_id_idx ON user_sessions(booking_id);
CREATE INDEX IF NOT EXISTS user_sessions_session_type_idx ON user_sessions(session_type);
CREATE INDEX IF NOT EXISTS user_sessions_status_idx ON user_sessions(status);
CREATE INDEX IF NOT EXISTS user_sessions_user_id_status_idx ON user_sessions(user_id, status);

-- Update RLS policies for new columns
DROP POLICY IF EXISTS "Admins can manage all sessions" ON user_sessions;
DROP POLICY IF EXISTS "Staff can manage all sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON user_sessions;

CREATE POLICY "Admins can manage all sessions"
  ON user_sessions
  FOR ALL
  TO authenticated
  USING (is_admin_safe())
  WITH CHECK (is_admin_safe());

CREATE POLICY "Staff can manage all sessions"
  ON user_sessions
  FOR ALL
  TO authenticated
  USING (
    is_admin_safe() OR 
    (EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = uid() AND u.role = ANY(ARRAY['admin'::text, 'staff'::text])
    ))
  );

CREATE POLICY "Users can view their own sessions"
  ON user_sessions
  FOR SELECT
  TO authenticated
  USING (uid() = user_id);