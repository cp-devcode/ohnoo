/*
  # Create admin_notes table

  1. New Tables
    - `admin_notes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users.id)
      - `admin_id` (uuid, foreign key to users.id)
      - `note_content` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `admin_notes` table
    - Add policy for admins to manage notes
*/

CREATE TABLE IF NOT EXISTS admin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note_content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all notes"
  ON admin_notes
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());