/*
  # Add payment settings

  1. New Settings
    - Add payment phone number setting
    - Add other missing settings for better app functionality

  2. Security
    - Settings are public so they can be accessed by the frontend
*/

-- Add payment phone setting
INSERT INTO site_settings (key, value, description, setting_type, is_public) 
VALUES 
  ('payment_phone', '+20 123 456 7890', 'Phone number for payment transfers', 'text', true),
  ('site_name', 'Desk4U', 'Site name displayed in header and footer', 'text', true),
  ('site_description', 'Premium coworking spaces designed for productivity, collaboration, and growth.', 'Site description for SEO and footer', 'text', true),
  ('contact_phone', '+20 123 456 7890', 'Main contact phone number', 'text', true),
  ('contact_email', 'info@desk4u.com', 'Main contact email address', 'text', true),
  ('contact_address', '123 Business Street\nDowntown District\nCairo, Egypt', 'Business address', 'text', true),
  ('business_hours', 'Mon-Fri: 6am-10pm\nSat-Sun: 8am-8pm', 'Business operating hours', 'text', true),
  ('social_facebook', 'https://facebook.com/desk4u', 'Facebook page URL', 'url', true),
  ('social_twitter', 'https://twitter.com/desk4u', 'Twitter profile URL', 'url', true),
  ('social_linkedin', 'https://linkedin.com/company/desk4u', 'LinkedIn company page URL', 'url', true),
  ('social_instagram', 'https://instagram.com/desk4u', 'Instagram profile URL', 'url', true),
  ('footer_text', '© 2024 Desk4U. All rights reserved.', 'Footer copyright text', 'text', true)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();