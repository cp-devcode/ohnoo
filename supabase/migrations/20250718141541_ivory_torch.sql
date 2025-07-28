/*
  # Initial Schema for Desk4U Coworking Space

  1. New Tables
    - `bookings`
      - `id` (uuid, primary key)
      - `workspace_type` (text)
      - `date` (date)
      - `time_slot` (text)
      - `duration` (text)
      - `customer_name` (text)
      - `customer_email` (text)
      - `customer_phone` (text)
      - `customer_whatsapp` (text)
      - `total_price` (numeric)
      - `status` (text with check constraint)
      - `confirmation_code` (text, nullable)
      - `user_id` (uuid, nullable, foreign key to auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `workspace_types`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `price` (numeric)
      - `price_unit` (text)
      - `image_url` (text, nullable)
      - `features` (text array)
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `content_items`
      - `id` (uuid, primary key)
      - `title` (text)
      - `type` (text)
      - `content` (text)
      - `metadata` (jsonb, nullable)
      - `is_published` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users and admin access
    - Public read access for workspace_types and published content_items
*/

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_type text NOT NULL,
  date date NOT NULL,
  time_slot text NOT NULL,
  duration text NOT NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  customer_whatsapp text NOT NULL,
  total_price numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled')),
  confirmation_code text,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create workspace_types table
CREATE TABLE IF NOT EXISTS workspace_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  price_unit text NOT NULL DEFAULT 'day',
  image_url text,
  features text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create content_items table
CREATE TABLE IF NOT EXISTS content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL,
  content text NOT NULL,
  metadata jsonb,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;

-- Create policies for bookings
CREATE POLICY "Users can view their own bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'admin@desk4u.com'
    )
  );

CREATE POLICY "Admins can update all bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'admin@desk4u.com'
    )
  );

CREATE POLICY "Allow anonymous booking creation"
  ON bookings
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create policies for workspace_types
CREATE POLICY "Anyone can view active workspace types"
  ON workspace_types
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage workspace types"
  ON workspace_types
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'admin@desk4u.com'
    )
  );

-- Create policies for content_items
CREATE POLICY "Anyone can view published content"
  ON content_items
  FOR SELECT
  TO public
  USING (is_published = true);

CREATE POLICY "Admins can manage content"
  ON content_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'admin@desk4u.com'
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspace_types_updated_at
  BEFORE UPDATE ON workspace_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_items_updated_at
  BEFORE UPDATE ON content_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default workspace types
INSERT INTO workspace_types (name, description, price, price_unit, features) VALUES
  ('Hot Desk', 'Flexible desk space in our open work area. Perfect for freelancers and remote workers.', 25, 'day', ARRAY['Flexible seating', 'High-speed internet', 'Printing services', 'Complimentary coffee', 'Common area access']),
  ('Private Office', 'Dedicated private office space for teams and businesses requiring privacy.', 150, 'day', ARRAY['Private lockable office', 'Dedicated desk space', 'High-speed internet', 'Storage solutions', 'Reception services']),
  ('Meeting Room', 'Professional meeting spaces equipped with AV equipment and whiteboards.', 50, 'hour', ARRAY['AV equipment included', 'Whiteboard and flip charts', 'High-speed internet', 'Complimentary refreshments']);

-- Insert default content items
INSERT INTO content_items (title, type, content) VALUES
  ('Homepage Hero Title', 'hero', 'Your Perfect Workspace Awaits'),
  ('Homepage Hero Subtitle', 'hero', 'Premium coworking spaces designed for productivity, collaboration, and growth. Join our community of innovators and entrepreneurs.'),
  ('About Us Description', 'text', 'Founded in 2020, Desk4U was born from a simple idea: create workspaces that inspire creativity, foster collaboration, and support the evolving needs of modern professionals.'),
  ('Contact Address', 'contact', '123 Business Street, Downtown District, City, State 12345'),
  ('Contact Phone', 'contact', '+1 (555) 123-4567'),
  ('Contact Email', 'contact', 'info@desk4u.com');