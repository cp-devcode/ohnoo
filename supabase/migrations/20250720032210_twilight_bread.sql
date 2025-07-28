/*
  # Add 'code_sent' status to bookings table

  1. Changes
    - Update the status check constraint to include 'code_sent' status
    - This allows bookings to have a status of 'code_sent' when admin sends confirmation code

  2. Security
    - No changes to RLS policies needed
*/

-- Update the status check constraint to include 'code_sent'
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
  CHECK (status = ANY (ARRAY['pending'::text, 'code_sent'::text, 'confirmed'::text, 'rejected'::text, 'cancelled'::text]));