import React from 'react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useContent } from '../hooks/useContent';
import AnimatedSection from '../components/AnimatedSection';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowRight, Users, Wifi, Coffee, Shield, Calendar, MapPin } from 'lucide-react';

interface WorkspaceType {
  id: string;
  name: string;
  description: string;
  price: number;
  price_unit: string;
  image_url?: string;
  features: string[];
  is_active: boolean;
}

const HomePage: React.FC = () => {
  const [workspaceTypes, setWorkspaceTypes] = useState<WorkspaceType[]>([]);
  const [workspacesLoading, setWorkspacesLoading] = useState(true);
  const { getContent, getSetting, loading: contentLoading } = useContent();

  useEffect(() => {
    fetchWorkspaceTypes();
  }, []);

  const fetchWorkspaceTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('workspace_types')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      setWorkspaceTypes(data || []);
    } catch (error) {
      console.error('Error fetching workspace types:', error);
    } finally {
      setWorkspacesLoading(false);
    }
  };

  // Show loading spinner while content is being fetched
  if (contentLoading) {
    return <LoadingSpinner size="lg" text="Loading content..." />;
  }

  const features = [
    {
      icon: Wifi,
      title: getContent('feature_internet_title', 'High-Speed Internet'),
      description: getContent('feature_internet_desc', 'Lightning-fast fiber internet with backup connections to keep you online')
    },
    {
      icon: Users,
      title: getContent('feature_community_title', 'Vibrant Community'),
      description: getContent('feature_community_desc', 'Connect with like-minded professionals and grow your network')
    },
    {
      icon: Coffee,
      title: getContent('feature_amenities_title', 'Premium Amenities'),
      description: getContent('feature_amenities_desc', 'Complimentary coffee, printing services, and modern facilities')
    },
    {
      icon: Shield,
      title: getContent('feature_security_title', 'Secure Access'),
      description: getContent('feature_security_desc', '24/7 secure access with keycard entry and security cameras')
    },
    {
      icon: Calendar,
      title: getContent('feature_booking_title', 'Flexible Booking'),
      description: getContent('feature_booking_desc', 'Book by the hour, day, or month with easy online reservations')
    },
    {
      icon: MapPin,
      title: getContent('feature_location_title', 'Prime Location'),
      description: getContent('feature_location_desc', 'Conveniently located in the heart of the business district')
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <AnimatedSection animation="fadeIn" duration={800}>
        <section className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black py-20 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <AnimatedSection animation="slideUp" delay={200} duration={800}>
                <h1 className="text-4xl md:text-6xl font-bold mb-6">
                  {getContent('hero_title', 'Your Workspace, Your Way')}
                </h1>
              </AnimatedSection>
              <AnimatedSection animation="slideUp" delay={400} duration={800}>
                <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
                  {getContent('hero_subtitle', 'Modern coworking spaces designed for productivity, collaboration, and growth in the heart of the city')}
                </p>
              </AnimatedSection>
              <AnimatedSection animation="slideUp" delay={600} duration={800}>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/booking"
                    className="bg-black text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 inline-flex items-center group"
                  >
                    {getContent('hero_cta_primary', 'Book Your Space')}
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/about"
                    className="bg-white text-black px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
                  >
                    {getContent('hero_cta_secondary', 'Learn More')}
                  </Link>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="slideUp" duration={800}>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
                {getContent('features_title', 'Why Choose Desk4U?')}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {getContent('features_subtitle', 'We provide everything you need to work efficiently and professionally')}
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <AnimatedSection 
                key={index}
                animation="slideUp" 
                delay={index * 100} 
                duration={600}
              >
                <div className="text-center p-6 rounded-lg hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2 group">
                  <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Workspace Types Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="slideUp" duration={800}>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
                {getContent('workspaces_title', 'Workspace Options')}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {getContent('workspaces_subtitle', 'Choose the perfect space for your needs')}
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {workspacesLoading ? (
              <div className="col-span-full">
                <LoadingSpinner text="Loading workspace options..." />
              </div>
            ) : workspaceTypes.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">No workspace types available.</p>
              </div>
            ) : (
              workspaceTypes.map((workspace, index) => (
                <AnimatedSection 
                  key={workspace.id}
                  animation="slideUp" 
                  delay={index * 150} 
                  duration={600}
                >
                  <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group">
{workspace.image_url ? (
  <img
    src={workspace.image_url}
    alt={workspace.name}
    className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
  />
) : (
  <div className="h-48 bg-gradient-to-br from-yellow-400 to-yellow-500 group-hover:from-yellow-500 group-hover:to-yellow-600 transition-all duration-300"></div>
)}

                    <div className="p-6">
                      <h3 className="text-xl font-semibold mb-2">{workspace.name}</h3>
                      <p className="text-gray-600 mb-4">{workspace.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-black">
                          E£{workspace.price}/{workspace.price_unit}
                        </span>
                        <Link
                          to="/booking"
                          className="bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-600 transition-all duration-300 transform hover:scale-105"
                        >
                          Book Now
                        </Link>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              ))
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <AnimatedSection animation="slideUp" duration={800}>
        <section className="py-20 bg-black text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <AnimatedSection animation="slideUp" delay={200} duration={600}>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {getContent('cta_title', 'Ready to Get Started?')}
              </h2>
            </AnimatedSection>
            <AnimatedSection animation="slideUp" delay={400} duration={600}>
              <p className="text-xl mb-8 max-w-2xl mx-auto">
                {getContent('cta_subtitle', 'Join hundreds of professionals who have made Desk4U their workspace of choice')}
              </p>
            </AnimatedSection>
            <AnimatedSection animation="slideUp" delay={600} duration={600}>
              <Link
                to="/booking"
                className="bg-yellow-500 text-black px-8 py-4 rounded-lg text-lg font-semibold hover:bg-yellow-600 transition-all duration-300 transform hover:scale-105 inline-flex items-center group"
              >
                {getContent('cta_button', 'Book Your First Day')}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </AnimatedSection>
          </div>
        </section>
      </AnimatedSection>
    </div>
  );
};

export default HomePage;