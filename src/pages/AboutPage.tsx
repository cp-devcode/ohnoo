import React from 'react';
import { useContent } from '../hooks/useContent';
import AnimatedSection from '../components/AnimatedSection';
import LoadingSpinner from '../components/LoadingSpinner';
import { Users, Award, Target, Heart } from 'lucide-react';

const AboutPage: React.FC = () => {
  const { getContent, teamMembers, statistics, loading: contentLoading } = useContent();

  // Show loading spinner while content is being fetched
  if (contentLoading) {
    return <LoadingSpinner size="lg" text="Loading content..." />;
  }

  const values = [
    {
      icon: Users,
      title: getContent('value_community_title', 'Community'),
      description: getContent('value_community_desc', 'Building meaningful connections and fostering collaboration among our members')
    },
    {
      icon: Award,
      title: getContent('value_excellence_title', 'Excellence'),
      description: getContent('value_excellence_desc', 'Providing premium facilities and services that exceed expectations')
    },
    {
      icon: Target,
      title: getContent('value_innovation_title', 'Innovation'),
      description: getContent('value_innovation_desc', 'Embracing new ideas and technologies to enhance the workspace experience')
    },
    {
      icon: Heart,
      title: getContent('value_support_title', 'Support'),
      description: getContent('value_support_desc', 'Dedicated to helping our members achieve their professional goals')
    }
  ];

  // Get the story image URL from content
  const storyImageUrl = getContent('about_story_image_url', 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800');

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <AnimatedSection animation="fadeIn" duration={800}>
        <section className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <AnimatedSection animation="slideUp" delay={200} duration={800}>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  {getContent('about_title', 'About Desk4U')}
                </h1>
              </AnimatedSection>
              <AnimatedSection animation="slideUp" delay={400} duration={800}>
                <p className="text-xl md:text-2xl max-w-3xl mx-auto">
                  {getContent('about_subtitle', 'Empowering professionals with inspiring workspaces and meaningful connections')}
                </p>
              </AnimatedSection>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Story Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <AnimatedSection animation="slideRight" duration={800}>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-black mb-6">
                  {getContent('about_story_title', 'Our Story')}
                </h2>
                <div className="space-y-6 text-lg text-gray-600">
                  {getContent('about_story_content', 'Founded in 2020, Desk4U was born from a simple idea: create workspaces that inspire creativity, foster collaboration, and support the evolving needs of modern professionals. What started as a single coworking space has grown into a thriving community of entrepreneurs, freelancers, and remote workers who believe in the power of shared spaces and collective growth.')
                    .split('\n')
                    .map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                </div>
              </div>
            </AnimatedSection>
            <AnimatedSection animation="slideLeft" delay={200} duration={800}>
              <div className="h-96 rounded-lg transform hover:scale-105 transition-transform duration-300 overflow-hidden">
                <img 
                  src={storyImageUrl} 
                  alt="Our Story" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to gradient if image fails to load
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.style.background = 'linear-gradient(to bottom right, #fbbf24, #f59e0b)';
                  }}
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="slideUp" duration={800}>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
                {getContent('about_values_title', 'Our Values')}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {getContent('about_values_subtitle', 'The principles that guide everything we do')}
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <AnimatedSection 
                key={index}
                animation="slideUp" 
                delay={index * 100} 
                duration={600}
              >
                <div className="text-center p-6 hover:bg-white rounded-lg transition-all duration-300 transform hover:-translate-y-2 group">
                  <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <value.icon className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="slideUp" duration={800}>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
                {getContent('about_team_title', 'Meet Our Team')}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {getContent('about_team_subtitle', 'The passionate people behind Desk4U')}
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <AnimatedSection 
                key={index}
                animation="slideUp" 
                delay={index * 150} 
                duration={600}
              >
                <div className="text-center group">
                  <div className="w-32 h-32 rounded-full mx-auto mb-4 transform group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                    {member.image_url ? (
                      <img 
                        src={member.image_url} 
                        alt={member.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to gradient if image fails to load
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.style.background = 'linear-gradient(to bottom right, #fbbf24, #f59e0b)';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center">
                        <span className="text-black font-bold text-2xl">{member.name.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{member.name}</h3>
                  <p className="text-gray-600 mb-2">{member.role}</p>
                  <p className="text-sm text-gray-500">{member.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <AnimatedSection animation="slideUp" duration={800}>
        <section className="py-20 bg-black text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              {statistics.map((stat, index) => (
                <AnimatedSection 
                  key={index}
                  animation="scaleIn" 
                  delay={index * 100} 
                  duration={600}
                >
                  <div className="transform hover:scale-110 transition-transform duration-300">
                    <div className="text-4xl font-bold text-yellow-500 mb-2">{stat.value}</div>
                    <p className="text-white">{stat.label}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>
    </div>
  );
};

export default AboutPage;