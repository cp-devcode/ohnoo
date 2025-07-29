/*
  # Subscription and Session Management System

  1. New Tables
    - `subscription_plans`
      - `id` (uuid, primary key)
      - `name` (text, plan name)
      - `description` (text, plan description)
      - `hours_included` (integer, hours included in plan)
      - `price` (numeric, plan price)
      - `duration_days` (integer, plan duration in days)
      - `is_active` (boolean, whether plan is active)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `user_subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `subscription_plan_id` (uuid, foreign key to subscription_plans)
      - `hours_remaining` (integer, remaining hours)
      - `start_date` (date, subscription start date)
      - `end_date` (date, subscription end date)
      - `status` (text, active/expired/cancelled)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `user_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `user_subscription_id` (uuid, foreign key to user_subscriptions)
      - `start_time` (timestamp, session start)
      - `end_time` (timestamp, session end, nullable)
      - `duration_minutes` (integer, calculated duration)
      - `hours_deducted` (numeric, hours deducted from subscription)
      - `status` (text, active/completed)
      - `started_by` (uuid, admin who started session)
      - `ended_by` (uuid, admin who ended session, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for admin/staff access
    - Add policies for user read access to their own data
</sql>

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  hours_included integer NOT NULL DEFAULT 0,
  price numeric NOT NULL DEFAULT 0,
  duration_days integer NOT NULL DEFAULT 30,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage subscription plans"
  ON subscription_plans
  FOR ALL
  TO authenticated
  USING (is_admin_safe())
  WITH CHECK (is_admin_safe());

CREATE POLICY "Anyone can view active subscription plans"
  ON subscription_plans
  FOR SELECT
  TO public
  USING (is_active = true);

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_plan_id uuid NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  hours_remaining numeric NOT NULL DEFAULT 0,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all subscriptions"
  ON user_subscriptions
  FOR ALL
  TO authenticated
  USING (is_admin_safe())
  WITH CHECK (is_admin_safe());

CREATE POLICY "Staff can view all subscriptions"
  ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (is_admin_safe() OR (EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = uid() AND u.role = ANY(ARRAY['admin'::text, 'staff'::text])
  )));

CREATE POLICY "Users can view their own subscriptions"
  ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (uid() = user_id);

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_subscription_id uuid REFERENCES user_subscriptions(id) ON DELETE SET NULL,
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz,
  duration_minutes integer,
  hours_deducted numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  started_by uuid NOT NULL REFERENCES users(id),
  ended_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

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
  USING (is_admin_safe() OR (EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = uid() AND u.role = ANY(ARRAY['admin'::text, 'staff'::text])
  )));

CREATE POLICY "Users can view their own sessions"
  ON user_sessions
  FOR SELECT
  TO authenticated
  USING (uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_sessions_updated_at
  BEFORE UPDATE ON user_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some default subscription plans
INSERT INTO subscription_plans (name, description, hours_included, price, duration_days) VALUES
('Basic Plan', '20 hours per month for light users', 20, 299, 30),
('Standard Plan', '50 hours per month for regular users', 50, 699, 30),
('Premium Plan', '100 hours per month for heavy users', 100, 1299, 30),
('Unlimited Plan', '200 hours per month for unlimited access', 200, 1999, 30)
ON CONFLICT DO NOTHING;