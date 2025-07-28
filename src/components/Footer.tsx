import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { useContent } from '../hooks/useContent';

const Footer: React.FC = () => {
  const { getSetting, getContent } = useContent();

  return (
    <footer className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-2xl font-bold mb-4">
              {getSetting('site_name', 'Desk4U').split('4').map((part, index) => (
                <span key={index}>
                  {part}
                  {index === 0 && <span className="text-yellow-500">4</span>}
                </span>
              ))}
            </h3>
            <p className="text-gray-300 mb-4">
              {getSetting('site_description', 'Premium coworking spaces designed for productivity, collaboration, and growth.')}
            </p>
            <div className="flex space-x-4">
              {getSetting('social_facebook') && (
                <a href={getSetting('social_facebook')} target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center hover:bg-yellow-600 transition-colors">
                  <span className="text-black font-bold text-sm">f</span>
                </a>
              )}
              {getSetting('social_twitter') && (
                <a href={getSetting('social_twitter')} target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center hover:bg-yellow-600 transition-colors">
                  <span className="text-black font-bold text-sm">t</span>
                </a>
              )}
              {getSetting('social_linkedin') && (
                <a href={getSetting('social_linkedin')} target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center hover:bg-yellow-600 transition-colors">
                  <span className="text-black font-bold text-xs">in</span>
                </a>
              )}
              {getSetting('social_instagram') && (
                <a href={getSetting('social_instagram')} target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center hover:bg-yellow-600 transition-colors">
                  <span className="text-black font-bold text-sm">ig</span>
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">{getContent('footer_links_title', 'Quick Links')}</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-yellow-500 transition-colors">
                  {getContent('nav_home', 'Home')}
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-yellow-500 transition-colors">
                  {getContent('nav_about', 'About Us')}
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-gray-300 hover:text-yellow-500 transition-colors">
                  {getContent('nav_pricing', 'Pricing')}
                </Link>
              </li>
              <li>
                <Link to="/booking" className="text-gray-300 hover:text-yellow-500 transition-colors">
                  {getContent('nav_book_now', 'Book Now')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-4">{getContent('footer_services_title', 'Services')}</h4>
            <ul className="space-y-2 text-gray-300">
              <li>{getContent('service_hot_desks', 'Hot Desks')}</li>
              <li>{getContent('service_private_offices', 'Private Offices')}</li>
              <li>{getContent('service_meeting_rooms', 'Meeting Rooms')}</li>
              <li>{getContent('service_virtual_offices', 'Virtual Offices')}</li>
              <li>{getContent('service_event_spaces', 'Event Spaces')}</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">{getContent('footer_contact_title', 'Contact Info')}</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <MapPin className="w-5 h-5 text-yellow-500 mt-0.5" />
                <span className="text-gray-300">
                  {getSetting('contact_address', '123 Business Street\nCity, State 12345').split('\n').map((line, index) => (
                    <span key={index}>
                      {line}
                      {index === 0 && <br />}
                    </span>
                  ))}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-5 h-5 text-yellow-500" />
                <span className="text-gray-300">{getSetting('contact_phone', '+1 (555) 123-4567')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-yellow-500" />
                <span className="text-gray-300">{getSetting('contact_email', 'info@desk4u.com')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <Clock className="w-5 h-5 text-yellow-500 mt-0.5" />
                <span className="text-gray-300">
                  {getSetting('business_hours', 'Mon-Fri: 6am-10pm\nSat-Sun: 8am-8pm').split('\n').map((line, index) => (
                    <span key={index}>
                      {line}
                      {index === 0 && <br />}
                    </span>
                  ))}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-300">
            {getSetting('footer_text', '© 2024 Desk4U. All rights reserved.')} | 
            <a href="#" className="hover:text-yellow-500 transition-colors ml-1">Privacy Policy</a> | 
            <a href="#" className="hover:text-yellow-500 transition-colors ml-1">Terms of Service</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;