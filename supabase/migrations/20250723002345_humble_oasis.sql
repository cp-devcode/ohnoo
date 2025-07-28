/*
  # Create user_activity_log table

  1. New Tables
    - `user_activity_log`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users.id)
      - `action` (text)
      - `details` (jsonb, nullable)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `user_activity_log` table
    - Add policy for users to view their own activity
    - Add policy for admins to view all activity
    - Add policy for authenticated users to insert their own actions
*/

CREATE TABLE IF NOT EXISTS user_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action text NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activity"
  ON user_activity_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can insert their own activity"
  ON user_activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR is_admin());

CREATE POLICY "Admins can manage all activity"
  ON user_activity_log
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());