import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useContent } from '../hooks/useContent';
import AnimatedSection from './AnimatedSection';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const { getSetting, getContent } = useContent();

  const toggleMenu = () => setIsOpen(!isOpen);

  const renderCompanyName = () => {
    const siteName = getSetting('site_name', 'Desk4U');

    if (siteName.includes('4')) {
      const parts = siteName.split('4');
      return (
        <>
          {parts[0]}
          <span className="text-yellow-500">4</span>
          {parts.slice(1).join('4')}
        </>
      );
    }

    return siteName;
  };

  return (
    <AnimatedSection animation="slideDown" duration={600}>
      <nav className="bg-white shadow-lg relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-black">
                {renderCompanyName()}
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link to="/" className="text-black hover:text-yellow-500 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  {getContent('nav_home', 'Home')}
                </Link>
                <Link to="/about" className="text-black hover:text-yellow-500 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  {getContent('nav_about', 'About')}
                </Link>
                <Link to="/pricing" className="text-black hover:text-yellow-500 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  {getContent('nav_pricing', 'Pricing')}
                </Link>
                <Link to="/contact" className="text-black hover:text-yellow-500 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  {getContent('nav_contact', 'Contact')}
                </Link>
                <Link to="/booking" className="bg-yellow-500 text-black px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-600 transition-colors">
                  {getContent('nav_book_now', 'Book Now')}
                </Link>
                {user && (
                  <Link to="/my-bookings" className="text-black hover:text-yellow-500 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    My Account
                  </Link>
                )}
                {user && (user.role === 'admin' || user.role === 'staff') && (
                  <Link to="/admin" className="text-yellow-500 hover:text-yellow-600 text-sm">
                    {user.role === 'admin' ? 'Admin' : 'Dashboard'}
                  </Link>
                )}
              </div>
            </div>

            {/* User Menu */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-black" />
                  <span className="text-sm text-black">{user.name}</span>
                  {user.role === 'admin' && (
                    <Link to="/admin" className="text-yellow-500 hover:text-yellow-600 text-sm">
                      Admin
                    </Link>
                  )}
                  {user.role === 'admin' && (
                    <Link to="/cms" className="text-yellow-500 hover:text-yellow-600 text-sm">
                      CMS
                    </Link>
                  )}
                  <button
                    onClick={logout}
                    className="text-black hover:text-yellow-500 p-1"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <Link to="/login" className="text-black hover:text-yellow-500 px-3 py-2 text-sm">
                    {getContent('nav_login', 'Login')}
                  </Link>
                  <Link to="/register" className="bg-black text-white px-3 py-2 rounded-md text-sm hover:bg-gray-800 transition-colors">
                    {getContent('nav_signup', 'Sign Up')}
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={toggleMenu}
                className="text-black hover:text-yellow-500 p-2"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link to="/" className="text-black hover:text-yellow-500 block px-3 py-2 rounded-md text-base font-medium">
                {getContent('nav_home', 'Home')}
              </Link>
              <Link to="/about" className="text-black hover:text-yellow-500 block px-3 py-2 rounded-md text-base font-medium">
                {getContent('nav_about', 'About')}
              </Link>
              <Link to="/pricing" className="text-black hover:text-yellow-500 block px-3 py-2 rounded-md text-base font-medium">
                {getContent('nav_pricing', 'Pricing')}
              </Link>
              <Link to="/contact" className="text-black hover:text-yellow-500 block px-3 py-2 rounded-md text-base font-medium">
                {getContent('nav_contact', 'Contact')}
              </Link>
              <Link to="/booking" className="bg-yellow-500 text-black block px-3 py-2 rounded-md text-base font-medium">
                {getContent('nav_book_now', 'Book Now')}
              </Link>

              {user && (
                <Link to="/my-bookings" className="text-black hover:text-yellow-500 block px-3 py-2 rounded-md text-base font-medium">
                  My Account
                </Link>
              )}

              {user ? (
                <div className="border-t pt-2">
                  <div className="flex items-center px-3 py-2">
                    <User className="w-5 h-5 text-black mr-2" />
                    <span className="text-black">{user.name}</span>
                  </div>
                  {user.role === 'admin' && (
                    <Link to="/admin" className="text-yellow-500 block px-3 py-2">
                      Admin Dashboard
                    </Link>
                  )}
                  {(user.role === 'admin' || user.role === 'staff') && (
                    <Link to="/admin" className="text-yellow-500 block px-3 py-2">
                      {user.role === 'admin' ? 'Admin Dashboard' : 'Dashboard'}
                    </Link>
                  )}
                  {user.role === 'admin' && (
                    <Link to="/cms" className="text-yellow-500 block px-3 py-2">
                      Content Management
                    </Link>
                  )}
                  <button
                    onClick={logout}
                    className="text-black hover:text-yellow-500 block w-full text-left px-3 py-2"
                  >
                    {getContent('nav_logout', 'Logout')}
                  </button>
                </div>
              ) : (
                <div className="border-t pt-2">
                  <Link to="/login" className="text-black hover:text-yellow-500 block px-3 py-2">
                    {getContent('nav_login', 'Login')}
                  </Link>
                  <Link to="/register" className="text-black hover:text-yellow-500 block px-3 py-2">
                    {getContent('nav_signup', 'Sign Up')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </AnimatedSection>
  );
};

export default Navbar;
