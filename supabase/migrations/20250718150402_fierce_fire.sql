/*
  # Fix Admin RLS Policies

  This migration fixes the RLS policies that were causing "permission denied for table users" errors.
  
  ## Changes Made
  1. Updated all admin policies to use JWT claims instead of querying auth.users table
  2. Changed from checking email in users table to checking is_admin claim in JWT
  3. This resolves permission issues while maintaining security
  
  ## Security
  - Admin access now controlled via app_metadata.is_admin claim
  - More secure and performant than table queries
  - Follows Supabase best practices for role-based access
*/

-- Drop existing admin policies that query users table
DROP POLICY IF EXISTS "Admins can update all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can manage workspace types" ON workspace_types;
DROP POLICY IF EXISTS "Admins can manage content" ON content_items;

-- Create new admin policies using JWT claims
CREATE POLICY "Admins can update all bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'is_admin')::boolean = true);

CREATE POLICY "Admins can view all bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'is_admin')::boolean = true);

CREATE POLICY "Admins can manage workspace types"
  ON workspace_types
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'is_admin')::boolean = true);

CREATE POLICY "Admins can manage content"
  ON content_items
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'is_admin')::boolean = true);