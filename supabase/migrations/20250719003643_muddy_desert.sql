/*
  # Complete Content Management System

  1. New Tables
    - `content_items` - Stores all website content with proper structure
    - Includes comprehensive content types for all pages
    
  2. Security
    - Enable RLS on content_items table
    - Add policies for admin management and public viewing
    
  3. Initial Content
    - Populate with all website content that can be managed through CMS
    - Covers hero sections, features, about content, contact info, etc.
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS content_items CASCADE;

-- Create content_items table with proper structure
CREATE TABLE IF NOT EXISTS content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  content_type text NOT NULL DEFAULT 'text',
  page text NOT NULL DEFAULT 'global',
  section text DEFAULT NULL,
  metadata jsonb DEFAULT '{}',
  is_published boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Insert comprehensive content for all pages
INSERT INTO content_items (key, title, content, content_type, page, section, display_order) VALUES
-- Homepage Hero
('hero_title', 'Hero Title', 'Your Premium Workspace Awaits', 'text', 'home', 'hero', 1),
('hero_subtitle', 'Hero Subtitle', 'Modern coworking spaces designed for productivity, collaboration, and growth in the heart of the city', 'text', 'home', 'hero', 2),
('hero_cta_primary', 'Primary CTA', 'Book Your Space', 'text', 'home', 'hero', 3),
('hero_cta_secondary', 'Secondary CTA', 'Learn More', 'text', 'home', 'hero', 4),

-- Homepage Features
('features_title', 'Features Title', 'Why Choose Desk4U?', 'text', 'home', 'features', 1),
('features_subtitle', 'Features Subtitle', 'We provide everything you need to work efficiently and professionally', 'text', 'home', 'features', 2),

-- Homepage Workspaces
('workspaces_title', 'Workspaces Title', 'Workspace Options', 'text', 'home', 'workspaces', 1),
('workspaces_subtitle', 'Workspaces Subtitle', 'Choose the perfect space for your needs', 'text', 'home', 'workspaces', 2),

-- Homepage CTA
('cta_title', 'CTA Title', 'Ready to Get Started?', 'text', 'home', 'cta', 1),
('cta_subtitle', 'CTA Subtitle', 'Join hundreds of professionals who have made Desk4U their workspace of choice', 'text', 'home', 'cta', 2),
('cta_button', 'CTA Button', 'Book Your First Day', 'text', 'home', 'cta', 3),

-- About Page
('about_title', 'About Title', 'About Desk4U', 'text', 'about', 'hero', 1),
('about_subtitle', 'About Subtitle', 'Empowering professionals with inspiring workspaces and meaningful connections', 'text', 'about', 'hero', 2),
('about_story_title', 'Story Title', 'Our Story', 'text', 'about', 'story', 1),
('about_story_content', 'Story Content', 'Founded in 2020, Desk4U was born from a simple idea: create workspaces that inspire creativity, foster collaboration, and support the evolving needs of modern professionals. What started as a single coworking space has grown into a thriving community of entrepreneurs, freelancers, and remote workers who believe in the power of shared spaces and collective growth.', 'textarea', 'about', 'story', 2),
('about_values_title', 'Values Title', 'Our Values', 'text', 'about', 'values', 1),
('about_values_subtitle', 'Values Subtitle', 'The principles that guide everything we do', 'text', 'about', 'values', 2),
('about_team_title', 'Team Title', 'Meet Our Team', 'text', 'about', 'team', 1),
('about_team_subtitle', 'Team Subtitle', 'The passionate people behind Desk4U', 'text', 'about', 'team', 2),

-- Contact Page
('contact_title', 'Contact Title', 'Get In Touch', 'text', 'contact', 'hero', 1),
('contact_subtitle', 'Contact Subtitle', 'Have questions? We''re here to help you find the perfect workspace solution', 'text', 'contact', 'hero', 2),
('contact_form_title', 'Contact Form Title', 'Send us a message', 'text', 'contact', 'form', 1),
('contact_info_title', 'Contact Info Title', 'Contact Information', 'text', 'contact', 'info', 1),
('contact_address', 'Address', '123 Business Street\nDowntown District\nCity, State 12345', 'textarea', 'contact', 'info', 2),
('contact_phone_primary', 'Primary Phone', '+1 (555) 123-4567', 'text', 'contact', 'info', 3),
('contact_phone_secondary', 'Secondary Phone', '+1 (555) 987-6543', 'text', 'contact', 'info', 4),
('contact_email_primary', 'Primary Email', 'info@desk4u.com', 'text', 'contact', 'info', 5),
('contact_email_secondary', 'Secondary Email', 'support@desk4u.com', 'text', 'contact', 'info', 6),
('contact_hours', 'Business Hours', 'Monday - Friday: 6:00 AM - 10:00 PM\nSaturday - Sunday: 8:00 AM - 8:00 PM', 'textarea', 'contact', 'info', 7),
('contact_faq_title', 'FAQ Title', 'Frequently Asked Questions', 'text', 'contact', 'faq', 1),
('contact_faq_subtitle', 'FAQ Subtitle', 'Quick answers to common questions about our coworking spaces', 'text', 'contact', 'faq', 2),

-- Pricing Page
('pricing_title', 'Pricing Title', 'Simple, Transparent Pricing', 'text', 'pricing', 'hero', 1),
('pricing_subtitle', 'Pricing Subtitle', 'Choose the perfect plan for your work style and business needs', 'text', 'pricing', 'hero', 2),
('pricing_addons_title', 'Add-ons Title', 'Add-On Services', 'text', 'pricing', 'addons', 1),
('pricing_addons_subtitle', 'Add-ons Subtitle', 'Enhance your workspace experience with our additional services', 'text', 'pricing', 'addons', 2),
('pricing_faq_title', 'Pricing FAQ Title', 'Pricing FAQ', 'text', 'pricing', 'faq', 1),
('pricing_faq_subtitle', 'Pricing FAQ Subtitle', 'Common questions about our pricing and membership options', 'text', 'pricing', 'faq', 2),
('pricing_cta_title', 'Pricing CTA Title', 'Ready to get started?', 'text', 'pricing', 'cta', 1),
('pricing_cta_subtitle', 'Pricing CTA Subtitle', 'Join our community of professionals and take your productivity to the next level', 'text', 'pricing', 'cta', 2),

-- Booking Page
('booking_title', 'Booking Title', 'Book Your Workspace', 'text', 'booking', 'hero', 1),
('booking_subtitle', 'Booking Subtitle', 'Reserve your ideal workspace in just a few simple steps', 'text', 'booking', 'hero', 2),

-- Global/Footer Content
('footer_description', 'Footer Description', 'Premium coworking spaces designed for productivity, collaboration, and growth.', 'text', 'global', 'footer', 1),
('footer_copyright', 'Footer Copyright', '© 2024 Desk4U. All rights reserved. | Privacy Policy | Terms of Service', 'text', 'global', 'footer', 2),

-- Company Info
('company_name', 'Company Name', 'Desk4U', 'text', 'global', 'company', 1),
('company_tagline', 'Company Tagline', 'Your Premium Workspace Partner', 'text', 'global', 'company', 2);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_content_items_updated_at
    BEFORE UPDATE ON content_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();