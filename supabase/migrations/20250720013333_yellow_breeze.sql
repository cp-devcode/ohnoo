/*
  # Fix RLS Policy for Anonymous Booking Creation

  1. Policy Updates
    - Update the INSERT policy to allow anonymous users to create bookings
    - Ensure both authenticated and anonymous users can create bookings
    - Anonymous bookings will have user_id as NULL
    - Authenticated users can create bookings with their user_id

  2. Security
    - Maintains security by ensuring users can only create bookings for themselves
    - Allows anonymous bookings for better user experience
*/

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
DROP POLICY IF EXISTS "Allow anonymous booking creation" ON bookings;

-- Create a new policy that allows both authenticated and anonymous users to create bookings
CREATE POLICY "Allow booking creation for all users"
  ON bookings
  FOR INSERT
  TO public
  WITH CHECK (
    -- Allow if user is anonymous (user_id is NULL)
    (user_id IS NULL) 
    OR 
    -- Allow if user is authenticated and user_id matches their auth.uid()
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    -- Allow if user is admin
    is_admin()
  );

-- Ensure the SELECT policy also works for anonymous users to view their bookings
-- (though they won't be able to see them without being logged in)
CREATE POLICY "Allow viewing bookings"
  ON bookings
  FOR SELECT
  TO public
  USING (
    -- Admins can see all bookings
    is_admin()
    OR
    -- Authenticated users can see their own bookings
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  );