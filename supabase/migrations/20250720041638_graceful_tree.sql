/*
  # Add desk_number column to bookings table

  1. Changes
    - Add `desk_number` column to `bookings` table to track which specific desk is booked
    - This enables support for multiple desks per workspace type
    - Column is nullable to maintain compatibility with existing bookings

  2. Notes
    - Existing bookings will have NULL desk_number
    - New bookings will be assigned specific desk numbers (1-6)
*/

-- Add desk_number column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN desk_number INTEGER;

-- Add a comment to document the column
COMMENT ON COLUMN public.bookings.desk_number IS 'Desk number (1-6) assigned for this booking. NULL for legacy bookings.';