/*
  # Complete Content Management System

  1. New Tables
    - `content_items` - All website content with proper structure
    - `site_settings` - Global site settings and configuration
    - `media_files` - File management for images and documents

  2. Security
    - Enable RLS on all tables
    - Admin policies for full management
    - Public read access for published content

  3. Initial Data
    - Populate with all current website content
    - Set up proper content keys for easy management
*/

-- Drop existing content_items table if it exists
DROP TABLE IF EXISTS content_items CASCADE;
DROP TABLE IF EXISTS site_settings CASCADE;
DROP TABLE IF EXISTS media_files CASCADE;

-- Create content_items table with proper structure
CREATE TABLE content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  content_type text DEFAULT 'text' CHECK (content_type IN ('text', 'html', 'markdown', 'json')),
  page text NOT NULL,
  section text,
  metadata jsonb DEFAULT '{}',
  is_published boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create site_settings table for global configuration
CREATE TABLE site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  description text,
  setting_type text DEFAULT 'text' CHECK (setting_type IN ('text', 'number', 'boolean', 'json', 'color', 'url')),
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create media_files table for file management
CREATE TABLE media_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  original_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer NOT NULL,
  mime_type text NOT NULL,
  alt_text text,
  description text,
  is_public boolean DEFAULT true,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

-- Content Items Policies
CREATE POLICY "Anyone can view published content"
  ON content_items
  FOR SELECT
  TO public
  USING (is_published = true);

CREATE POLICY "Admins can manage all content"
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

-- Site Settings Policies
CREATE POLICY "Anyone can view public settings"
  ON site_settings
  FOR SELECT
  TO public
  USING (is_public = true);

CREATE POLICY "Admins can manage all settings"
  ON site_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@desk4u.com'
    )
  );

-- Media Files Policies
CREATE POLICY "Anyone can view public media"
  ON media_files
  FOR SELECT
  TO public
  USING (is_public = true);

CREATE POLICY "Admins can manage all media"
  ON media_files
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

-- Add triggers for updated_at
CREATE TRIGGER update_content_items_updated_at
  BEFORE UPDATE ON content_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert comprehensive content data
INSERT INTO content_items (key, title, content, page, section, display_order) VALUES
-- Homepage Content
('hero_title', 'Hero Title', 'Your Workspace, Your Way', 'home', 'hero', 1),
('hero_subtitle', 'Hero Subtitle', 'Modern coworking spaces designed for productivity, collaboration, and growth in the heart of the city', 'home', 'hero', 2),
('hero_cta_primary', 'Primary CTA', 'Book Your Space', 'home', 'hero', 3),
('hero_cta_secondary', 'Secondary CTA', 'Learn More', 'home', 'hero', 4),

('features_title', 'Features Section Title', 'Why Choose Desk4U?', 'home', 'features', 5),
('features_subtitle', 'Features Section Subtitle', 'We provide everything you need to work efficiently and professionally', 'home', 'features', 6),

('feature_internet_title', 'Internet Feature Title', 'High-Speed Internet', 'home', 'features', 7),
('feature_internet_desc', 'Internet Feature Description', 'Lightning-fast fiber internet with backup connections to keep you online', 'home', 'features', 8),

('feature_community_title', 'Community Feature Title', 'Vibrant Community', 'home', 'features', 9),
('feature_community_desc', 'Community Feature Description', 'Connect with like-minded professionals and grow your network', 'home', 'features', 10),

('feature_amenities_title', 'Amenities Feature Title', 'Premium Amenities', 'home', 'features', 11),
('feature_amenities_desc', 'Amenities Feature Description', 'Complimentary coffee, printing services, and modern facilities', 'home', 'features', 12),

('feature_security_title', 'Security Feature Title', 'Secure Access', 'home', 'features', 13),
('feature_security_desc', 'Security Feature Description', '24/7 secure access with keycard entry and security cameras', 'home', 'features', 14),

('feature_booking_title', 'Booking Feature Title', 'Flexible Booking', 'home', 'features', 15),
('feature_booking_desc', 'Booking Feature Description', 'Book by the hour, day, or month with easy online reservations', 'home', 'features', 16),

('feature_location_title', 'Location Feature Title', 'Prime Location', 'home', 'features', 17),
('feature_location_desc', 'Location Feature Description', 'Conveniently located in the heart of the business district', 'home', 'features', 18),

('workspaces_title', 'Workspaces Section Title', 'Workspace Options', 'home', 'workspaces', 19),
('workspaces_subtitle', 'Workspaces Section Subtitle', 'Choose the perfect space for your needs', 'home', 'workspaces', 20),

('cta_title', 'CTA Section Title', 'Ready to Get Started?', 'home', 'cta', 21),
('cta_subtitle', 'CTA Section Subtitle', 'Join hundreds of professionals who have made Desk4U their workspace of choice', 'home', 'cta', 22),
('cta_button', 'CTA Button Text', 'Book Your First Day', 'home', 'cta', 23),

-- About Page Content
('about_title', 'About Page Title', 'About Desk4U', 'about', 'hero', 1),
('about_subtitle', 'About Page Subtitle', 'Empowering professionals with inspiring workspaces and meaningful connections', 'about', 'hero', 2),

('about_story_title', 'Story Section Title', 'Our Story', 'about', 'story', 3),
('about_story_content', 'Story Content', 'Founded in 2020, Desk4U was born from a simple idea: create workspaces that inspire creativity, foster collaboration, and support the evolving needs of modern professionals. What started as a single coworking space has grown into a thriving community of entrepreneurs, freelancers, and remote workers who believe in the power of shared spaces and collective growth.', 'about', 'story', 4),

('about_values_title', 'Values Section Title', 'Our Values', 'about', 'values', 5),
('about_values_subtitle', 'Values Section Subtitle', 'The principles that guide everything we do', 'about', 'values', 6),

('value_community_title', 'Community Value Title', 'Community', 'about', 'values', 7),
('value_community_desc', 'Community Value Description', 'Building meaningful connections and fostering collaboration among our members', 'about', 'values', 8),

('value_excellence_title', 'Excellence Value Title', 'Excellence', 'about', 'values', 9),
('value_excellence_desc', 'Excellence Value Description', 'Providing premium facilities and services that exceed expectations', 'about', 'values', 10),

('value_innovation_title', 'Innovation Value Title', 'Innovation', 'about', 'values', 11),
('value_innovation_desc', 'Innovation Value Description', 'Embracing new ideas and technologies to enhance the workspace experience', 'about', 'values', 12),

('value_support_title', 'Support Value Title', 'Support', 'about', 'values', 13),
('value_support_desc', 'Support Value Description', 'Dedicated to helping our members achieve their professional goals', 'about', 'values', 14),

('about_team_title', 'Team Section Title', 'Meet Our Team', 'about', 'team', 15),
('about_team_subtitle', 'Team Section Subtitle', 'The passionate people behind Desk4U', 'about', 'team', 16),

-- Contact Page Content
('contact_title', 'Contact Page Title', 'Get In Touch', 'contact', 'hero', 1),
('contact_subtitle', 'Contact Page Subtitle', 'Have questions? We''re here to help you find the perfect workspace solution', 'contact', 'hero', 2),

('contact_form_title', 'Contact Form Title', 'Send us a message', 'contact', 'form', 3),
('contact_info_title', 'Contact Info Title', 'Contact Information', 'contact', 'info', 4),

('contact_address', 'Contact Address', '123 Business Street\nDowntown District\nCity, State 12345', 'contact', 'info', 5),
('contact_phone', 'Contact Phone', '+1 (555) 123-4567', 'contact', 'info', 6),
('contact_email', 'Contact Email', 'info@desk4u.com', 'contact', 'info', 7),
('contact_hours', 'Contact Hours', 'Monday - Friday: 6:00 AM - 10:00 PM\nSaturday - Sunday: 8:00 AM - 8:00 PM', 'contact', 'info', 8),

('contact_faq_title', 'FAQ Section Title', 'Frequently Asked Questions', 'contact', 'faq', 9),
('contact_faq_subtitle', 'FAQ Section Subtitle', 'Quick answers to common questions about our coworking spaces', 'contact', 'faq', 10),

-- Pricing Page Content
('pricing_title', 'Pricing Page Title', 'Simple, Transparent Pricing', 'pricing', 'hero', 1),
('pricing_subtitle', 'Pricing Page Subtitle', 'Choose the perfect plan for your work style and business needs', 'pricing', 'hero', 2),

('pricing_addons_title', 'Add-ons Section Title', 'Add-On Services', 'pricing', 'addons', 3),
('pricing_addons_subtitle', 'Add-ons Section Subtitle', 'Enhance your workspace experience with our additional services', 'pricing', 'addons', 4),

('pricing_faq_title', 'Pricing FAQ Title', 'Pricing FAQ', 'pricing', 'faq', 5),
('pricing_faq_subtitle', 'Pricing FAQ Subtitle', 'Common questions about our pricing and membership options', 'pricing', 'faq', 6),

-- Booking Page Content
('booking_title', 'Booking Page Title', 'Book Your Workspace', 'booking', 'hero', 1),
('booking_subtitle', 'Booking Page Subtitle', 'Reserve your ideal workspace in just a few simple steps', 'booking', 'hero', 2);

-- Insert site settings
INSERT INTO site_settings (key, value, description, setting_type) VALUES
('site_name', 'Desk4U', 'Website name', 'text'),
('site_tagline', 'Your Workspace, Your Way', 'Site tagline', 'text'),
('company_phone', '+1 (555) 123-4567', 'Main phone number', 'text'),
('company_email', 'info@desk4u.com', 'Main email address', 'text'),
('company_address', '123 Business Street, Downtown District, City, State 12345', 'Company address', 'text'),
('social_facebook', 'https://facebook.com/desk4u', 'Facebook URL', 'url'),
('social_twitter', 'https://twitter.com/desk4u', 'Twitter URL', 'url'),
('social_linkedin', 'https://linkedin.com/company/desk4u', 'LinkedIn URL', 'url'),
('primary_color', '#EAB308', 'Primary brand color', 'color'),
('secondary_color', '#000000', 'Secondary brand color', 'color'),
('accent_color', '#FFFFFF', 'Accent color', 'color'),
('enable_animations', 'true', 'Enable page animations', 'boolean'),
('booking_enabled', 'true', 'Enable booking system', 'boolean'),
('maintenance_mode', 'false', 'Maintenance mode', 'boolean');