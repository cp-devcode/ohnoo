import React from 'react';
import { Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useContent } from '../hooks/useContent';
import AnimatedSection from '../components/AnimatedSection';
import LoadingSpinner from '../components/LoadingSpinner';

const PricingPage: React.FC = () => {
  const { getContent, pricingPlans, pricingFAQs, loading: contentLoading } = useContent();

  // Show loading spinner while content is being fetched
  if (contentLoading) {
    return <LoadingSpinner size="lg" text="Loading content..." />;
  }

  const addOns = [
    {
      name: 'Parking',
      price: 'E£15/day',
      description: 'Secure parking in our dedicated garage'
    },
    {
      name: 'Storage Locker',
      price: 'E£25/month',
      description: 'Personal storage space for your belongings'
    },
    {
      name: 'Virtual Office',
      price: 'E£99/month',
      description: 'Business address and mail handling services'
    },
    {
      name: 'Phone Answering',
      price: 'E£149/month',
      description: 'Professional phone answering in your company name'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <AnimatedSection animation="fadeIn" duration={800}>
        <section className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <AnimatedSection animation="slideUp" delay={200} duration={800}>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  {getContent('pricing_hero_title', 'Simple, Transparent Pricing')}
                </h1>
              </AnimatedSection>
              <AnimatedSection animation="slideUp" delay={400} duration={800}>
                <p className="text-xl md:text-2xl max-w-3xl mx-auto">
                  {getContent('pricing_hero_subtitle', 'Choose the perfect plan for your work style and business needs')}
                </p>
              </AnimatedSection>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Pricing Cards */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <AnimatedSection 
                key={index}
                animation="slideUp" 
                delay={index * 150} 
                duration={600}
              >
                <div
                  className={`bg-white rounded-lg shadow-lg overflow-hidden relative transform hover:scale-105 transition-all duration-300 ${
                    plan.is_popular ? 'ring-2 ring-yellow-500' : ''
                  }`}
                >
                  {plan.is_popular && (
                    <div className="absolute top-0 left-0 right-0 bg-yellow-500 text-black text-center py-2 text-sm font-semibold">
                      Most Popular
                    </div>
                  )}
                  
                  <div className={`p-6 ${plan.is_popular ? 'pt-12' : ''}`}>
                    <h3 className="text-2xl font-bold text-black mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-4">{plan.description}</p>
                    
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-black">{plan.price}</span>
                      <span className="text-gray-600 ml-2">{plan.period}</span>
                      {plan.monthly_price && (
                        <div className="text-sm text-gray-500 mt-1">
                          Monthly: {plan.monthly_price}
                        </div>
                      )}
                    </div>

                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                      {plan.not_included && plan.not_included.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <X className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
                          <span className="text-gray-400">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      to="/booking"
                      className={`w-full py-3 px-6 rounded-md font-semibold transition-all duration-300 transform hover:scale-105 inline-block text-center ${
                        plan.is_popular
                          ? 'bg-yellow-500 text-black hover:bg-yellow-600'
                          : 'bg-black text-white hover:bg-gray-800'
                      }`}
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Add-ons Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="slideUp" duration={800}>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
                {getContent('pricing_addons_title', 'Add-On Services')}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {getContent('pricing_addons_subtitle', 'Enhance your workspace experience with our additional services')}
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {addOns.map((addon, index) => (
              <AnimatedSection 
                key={index}
                animation="slideUp" 
                delay={index * 100} 
                duration={600}
              >
                <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-2">
                  <h3 className="text-lg font-semibold text-black mb-2">{addon.name}</h3>
                  <p className="text-gray-600 mb-4">{addon.description}</p>
                  <div className="text-xl font-bold text-yellow-500">{addon.price}</div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="slideUp" duration={800}>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
                {getContent('pricing_faq_title', 'Pricing FAQ')}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {getContent('pricing_faq_subtitle', 'Common questions about our pricing and membership options')}
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {pricingFAQs.map((faq, index) => (
              <AnimatedSection 
                key={index}
                animation="slideUp" 
                delay={index * 100} 
                duration={600}
              >
                <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                  <h3 className="text-lg font-semibold text-black mb-2">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <AnimatedSection animation="slideUp" duration={800}>
        <section className="py-20 bg-black text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <AnimatedSection animation="slideUp" delay={200} duration={600}>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {getContent('pricing_cta_title', 'Ready to get started?')}
              </h2>
            </AnimatedSection>
            <AnimatedSection animation="slideUp" delay={400} duration={600}>
              <p className="text-xl mb-8 max-w-2xl mx-auto">
                {getContent('pricing_cta_subtitle', 'Join our community of professionals and take your productivity to the next level')}
              </p>
            </AnimatedSection>
            <AnimatedSection animation="slideUp" delay={600} duration={600}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/booking"
                  className="bg-yellow-500 text-black px-8 py-4 rounded-lg text-lg font-semibold hover:bg-yellow-600 transition-all duration-300 transform hover:scale-105"
                >
                  Book a Tour
                </Link>
                <Link
                  to="/contact"
                  className="bg-transparent border border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-black transition-all duration-300 transform hover:scale-105"
                >
                  Contact Sales
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </section>
      </AnimatedSection>
    </div>
  );
};

export default PricingPage;