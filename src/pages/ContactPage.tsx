import React, { useState } from 'react';
import { useContent } from '../hooks/useContent';
import AnimatedSection from '../components/AnimatedSection';
import LoadingSpinner from '../components/LoadingSpinner';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';

const ContactPage: React.FC = () => {
  const { getContent, loading: contentLoading } = useContent();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
    alert('Thank you for your message! We will get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Show loading spinner while content is being fetched
  if (contentLoading) {
    return <LoadingSpinner size="lg" text="Loading content..." />;
  }

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Our Location',
      content: getContent('contact_address', '123 Business Street\nDowntown District\nCity, State 12345').split('\n')
    },
    {
      icon: Phone,
      title: 'Phone',
      content: [
        getContent('contact_phone')
      ]
    },
    {
      icon: Mail,
      title: 'Email',
      content: [
        getContent('contact_email', 'info@desk4u.com'),
        'support@desk4u.com'
      ]
    },
    {
      icon: Clock,
      title: 'Hours',
      content: getContent('contact_hours', 'Monday - Friday: 6:00 AM - 10:00 PM\nSaturday - Sunday: 8:00 AM - 8:00 PM').split('\n')
    }
  ];

  const faqs = [
    {
      question: "What's included in the membership?",
      answer: "All memberships include high-speed internet, printing services, complimentary coffee, and access to common areas. Private office memberships also include phone booths and storage."
    },
    {
      question: "Can I book meeting rooms?",
      answer: "Yes! All members can book meeting rooms through our online platform. Hot desk members get 2 free hours per month, while private office members get 5 hours."
    },
    {
      question: "Is there parking available?",
      answer: "We have a dedicated parking garage with spaces for members. Parking is included for private office members and available for E£15/day for hot desk members."
    },
    {
      question: "Do you offer virtual office services?",
      answer: "Yes! Our virtual office packages include a business address, mail handling, and phone answering services. Perfect for remote businesses."
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
                  {getContent('contact_title', 'Get In Touch')}
                </h1>
              </AnimatedSection>
              <AnimatedSection animation="slideUp" delay={400} duration={800}>
                <p className="text-xl md:text-2xl max-w-3xl mx-auto">
                  {getContent('contact_subtitle', 'Have questions? We\'re here to help you find the perfect workspace solution')}
                </p>
              </AnimatedSection>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Contact Form & Info */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <AnimatedSection animation="slideRight" duration={800}>
              <div>
                <h2 className="text-3xl font-bold text-black mb-6">
                  {getContent('contact_form_title', 'Send us a message')}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <AnimatedSection animation="slideUp" delay={100} duration={500}>
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all duration-300"
                      />
                    </div>
                  </AnimatedSection>

                  <AnimatedSection animation="slideUp" delay={200} duration={500}>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all duration-300"
                      />
                    </div>
                  </AnimatedSection>

                  <AnimatedSection animation="slideUp" delay={300} duration={500}>
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                        Subject
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all duration-300"
                      />
                    </div>
                  </AnimatedSection>

                  <AnimatedSection animation="slideUp" delay={400} duration={500}>
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                        Message
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all duration-300"
                      />
                    </div>
                  </AnimatedSection>

                  <AnimatedSection animation="slideUp" delay={500} duration={500}>
                    <button
                      type="submit"
                      className="w-full bg-yellow-500 text-black py-3 px-6 rounded-md font-semibold hover:bg-yellow-600 transition-all duration-300 transform hover:scale-105 flex items-center justify-center group"
                    >
                      <Send className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
                      Send Message
                    </button>
                  </AnimatedSection>
                </form>
              </div>
            </AnimatedSection>

            {/* Contact Information */}
            <AnimatedSection animation="slideLeft" duration={800}>
              <div>
                <h2 className="text-3xl font-bold text-black mb-6">
                  {getContent('contact_info_title', 'Contact Information')}
                </h2>
                
                <div className="space-y-8">
                  {contactInfo.map((info, index) => (
                    <AnimatedSection 
                      key={index}
                      animation="slideUp" 
                      delay={index * 100} 
                      duration={600}
                    >
                      <div className="flex items-start space-x-4 group">
                        <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                          <info.icon className="w-6 h-6 text-black" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-black mb-2">{info.title}</h3>
                          {info.content.map((line, lineIndex) => (
                            <p key={lineIndex} className="text-gray-600">{line}</p>
                          ))}
                        </div>
                      </div>
                    </AnimatedSection>
                  ))}
                </div>

                {/* Map placeholder */}
                <AnimatedSection animation="scaleIn" delay={600} duration={800}>
                  <div className="mt-8 h-64 bg-gray-200 rounded-lg flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
                    <p className="text-gray-500">Interactive Map Coming Soon</p>
                  </div>
                </AnimatedSection>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="slideUp" duration={800}>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
                {getContent('contact_faq_title', 'Frequently Asked Questions')}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {getContent('contact_faq_subtitle', 'Quick answers to common questions about our coworking spaces')}
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {faqs.map((faq, index) => (
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
    </div>
  );
};

export default ContactPage;