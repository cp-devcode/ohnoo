import React, { useState } from 'react';
import { useEffect } from 'react';
import { Calendar, Clock, User, Phone, Mail, MessageCircle, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../contexts/BookingContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useContent } from '../hooks/useContent';
import AnimatedSection from '../components/AnimatedSection';
import LoadingSpinner from '../components/LoadingSpinner';
import AuthModal from '../components/AuthModal';

// Default fallback values for booking logic
const DEFAULT_HOURLY_SLOTS = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
];

const DEFAULT_TOTAL_DESKS = 6;

// Helper function to convert duration to hours
const convertDurationToHours = (duration: string, totalSlots: number): number => {
  switch (duration) {
    case '1-hour':
      return 1;
    case '2-hours':
      return 2;
    case '4-hours':
      return 4;
    case '1-day':
      return totalSlots; // Full day = all available hourly slots
    case '1-week':
      return totalSlots * 7; // Not applicable for hourly slots, but kept for consistency
    case '1-month':
      return totalSlots * 30; // Not applicable for hourly slots, but kept for consistency
    default:
      return 1;
  }
};

// Helper function to get hourly slots covered by a booking
const getHourlySlotsForBooking = (startSlot: string, durationHours: number, allSlots: string[]): string[] => {
  const startIndex = allSlots.indexOf(startSlot);
  if (startIndex === -1) return [];
  
  const slots = [];
  for (let i = 0; i < durationHours && (startIndex + i) < allSlots.length; i++) {
    slots.push(allSlots[startIndex + i]);
  }
  return slots;
};

interface WorkspaceType {
  id: string;
  name: string;
  description: string;
  price: number;
  price_unit: string;
  features: string[];
  is_active: boolean;
}

const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  const { setBookingData } = useBooking();
  const { user } = useAuth();
  const { getContent, getSetting, loading: contentLoading } = useContent();
  
  const [workspaceTypes, setWorkspaceTypes] = useState<WorkspaceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const [formData, setFormData] = useState({
    workspaceType: '',
    date: '',
    timeSlot: '',
    duration: '',
    customerName: user?.name || '',
    customerEmail: user?.email || '',
    customerPhone: '',
    customerWhatsapp: user?.whatsapp || ''
  });

  // Get dynamic settings
  const totalDesks = parseInt(getSetting('total_desks', DEFAULT_TOTAL_DESKS.toString()));
  const hourlySlots = getSetting('hourly_slots', DEFAULT_HOURLY_SLOTS.join(','))
    .split(',')
    .map(slot => slot.trim())
    .filter(slot => slot.length > 0);

  useEffect(() => {
    fetchWorkspaceTypes();
  }, []);

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        customerName: user.name || '',
        customerEmail: user.email || '',
        customerWhatsapp: user.whatsapp || ''
      }));
    }
  }, [user]);

  // Fetch booked slots when workspace type or date changes
  useEffect(() => {
    if (formData.workspaceType && formData.date && formData.duration) {
      fetchBookedSlots();
    } else {
      setBookedSlots([]);
    }
  }, [formData.workspaceType, formData.date, formData.duration]);

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
      setLoading(false);
    }
  };

  const fetchBookedSlots = async () => {
    setCheckingAvailability(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('time_slot, duration, desk_number')
        .eq('workspace_type', formData.workspaceType)
        .eq('date', formData.date)
        .in('status', ['pending', 'confirmed', 'code_sent']);

      if (error) throw error;

      const bookings = data || [];
      const requestedDurationHours = convertDurationToHours(formData.duration, hourlySlots.length);
      
      // Build desk availability matrix
      const deskAvailabilityMatrix = new Map<string, boolean[]>();
      
      // Initialize all slots as available for all desks
      hourlySlots.forEach(slot => {
        deskAvailabilityMatrix.set(slot, new Array(totalDesks).fill(true));
      });
      
      // Mark desks as unavailable based on existing bookings
      bookings.forEach(booking => {
        const bookingDurationHours = convertDurationToHours(booking.duration, hourlySlots.length);
        const occupiedSlots = getHourlySlotsForBooking(booking.time_slot, bookingDurationHours, hourlySlots);
        
        occupiedSlots.forEach(slot => {
          const availability = deskAvailabilityMatrix.get(slot);
          if (availability) {
            if (booking.desk_number !== null && booking.desk_number >= 1 && booking.desk_number <= totalDesks) {
              // Mark specific desk as unavailable
              availability[booking.desk_number - 1] = false;
            } else {
              // Legacy booking without desk assignment - mark all desks as unavailable
              availability.fill(false);
            }
          }
        });
      });
      
      // Find unavailable starting slots for the requested duration
      const unavailableSlots: string[] = [];
      
      hourlySlots.forEach(startSlot => {
        const requiredSlots = getHourlySlotsForBooking(startSlot, requestedDurationHours, hourlySlots);
        
        // Check if we have enough consecutive slots
        if (requiredSlots.length < requestedDurationHours) {
          unavailableSlots.push(startSlot);
          return;
        }
        
        // Check if at least one desk is available for all required slots
        let hasAvailableDesk = false;
        
        for (let deskIndex = 0; deskIndex < totalDesks; deskIndex++) {
          let deskAvailableForAllSlots = true;
          
          for (const slot of requiredSlots) {
            const availability = deskAvailabilityMatrix.get(slot);
            if (!availability || !availability[deskIndex]) {
              deskAvailableForAllSlots = false;
              break;
            }
          }
          
          if (deskAvailableForAllSlots) {
            hasAvailableDesk = true;
            break;
          }
        }
        
        if (!hasAvailableDesk) {
          unavailableSlots.push(startSlot);
        }
      });
      
      setBookedSlots(unavailableSlots);
    } catch (error) {
      console.error('Error fetching booked slots:', error);
      setBookedSlots([]);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const durations = [
    { value: '1-hour', label: '1 Hour', multiplier: 1 },
    { value: '2-hours', label: '2 Hours', multiplier: 2 },
    { value: '3-hours', label: '3 Hours', multiplier: 3 },
    { value: '4-hours', label: '4 Hours', multiplier: 4 },
    { value: '5-hours', label: '5 Hours', multiplier: 5 },
    { value: '6-hours', label: '6 Hours', multiplier: 6 }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Reset time slot if workspace type or date changes
    if ((name === 'workspaceType' || name === 'date') && formData.timeSlot) {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        timeSlot: '' // Reset time slot when workspace or date changes
      }));
    } else if (name === 'duration' && formData.timeSlot) {
      // Reset time slot if duration changes
      setFormData(prev => ({
        ...prev,
        [name]: value,
        timeSlot: '' // Reset time slot when duration changes
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

   const saveBookingToDatabase = async (bookingData: any) => {
    try {
      // Find an available desk for the booking
      const { data: existingBookings, error: fetchError } = await supabase
        .from('bookings')
        .select('time_slot, duration, desk_number')
        .eq('workspace_type', bookingData.workspaceType)
        .eq('date', bookingData.date)
        .in('status', ['pending', 'confirmed', 'code_sent']);

      if (fetchError) throw fetchError;

      const bookings = existingBookings || [];
      const requestedDurationHours = convertDurationToHours(bookingData.duration, hourlySlots.length);
      const requiredSlots = getHourlySlotsForBooking(bookingData.timeSlot, requestedDurationHours, hourlySlots);
      
      // Build desk availability matrix
      const deskAvailabilityMatrix = new Map<string, boolean[]>();
      
      // Initialize all slots as available for all desks
      hourlySlots.forEach(slot => {
        deskAvailabilityMatrix.set(slot, new Array(totalDesks).fill(true));
      });
      
      // Mark desks as unavailable based on existing bookings
      bookings.forEach(booking => {
        const bookingDurationHours = convertDurationToHours(booking.duration, hourlySlots.length);
        const occupiedSlots = getHourlySlotsForBooking(booking.time_slot, bookingDurationHours, hourlySlots);
        
        occupiedSlots.forEach(slot => {
          const availability = deskAvailabilityMatrix.get(slot);
          if (availability) {
            if (booking.desk_number !== null && booking.desk_number >= 1 && booking.desk_number <= totalDesks) {
              // Mark specific desk as unavailable
              availability[booking.desk_number - 1] = false;
            } else {
              // Legacy booking without desk assignment - mark all desks as unavailable
              availability.fill(false);
            }
          }
        });
      });
      
      // Find an available desk for the entire duration
      let assignedDeskNumber = null;
      
      for (let deskIndex = 0; deskIndex < totalDesks; deskIndex++) {
        let deskAvailableForAllSlots = true;
        
        for (const slot of requiredSlots) {
          const availability = deskAvailabilityMatrix.get(slot);
          if (!availability || !availability[deskIndex]) {
            deskAvailableForAllSlots = false;
            break;
          }
        }
        
        if (deskAvailableForAllSlots) {
          assignedDeskNumber = deskIndex + 1; // Desk numbers are 1-indexed
          break;
        }
      }
      
      if (!assignedDeskNumber) {
        throw new Error('No available desk found for the selected time slot and duration. Please choose a different time or date.');
      }

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          workspace_type: bookingData.workspaceType,
          date: bookingData.date,
          time_slot: bookingData.timeSlot,
          duration: bookingData.duration,
          customer_name: bookingData.customerName,
          customer_email: bookingData.customerEmail,
          customer_phone: bookingData.customerPhone,
          customer_whatsapp: bookingData.customerWhatsapp,
          total_price: bookingData.totalPrice,
          status: 'pending',
          user_id: user?.id || null,
          desk_number: assignedDeskNumber
        })
        .select()
        .single();

      if (error) throw error;

      // Navigate to confirmation page
      navigate('/confirmation', { state: { bookingId: data.id } });
      
    } catch (error) {
      console.error('Error saving booking:', error);
      alert('Failed to save booking. Please try again.');
    }
  };
  
  const calculatePrice = () => {
    const workspace = workspaceTypes.find(w => w.name === formData.workspaceType);
    const duration = durations.find(d => d.value === formData.duration);
    
    if (!workspace || !duration) return 0;
    
    return workspace.price * duration.multiplier;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is logged in
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    const totalPrice = calculatePrice();
    
    const bookingData = {
      ...formData,
      totalPrice
    };
    
    // Save booking to database immediately
    saveBookingToDatabase(bookingData);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    // After successful authentication, automatically submit the form
    const totalPrice = calculatePrice();
    
    const bookingData = {
      ...formData,
      totalPrice
    };
    
    saveBookingToDatabase(bookingData);
  };

  // Show loading spinner while content is being fetched
  if (contentLoading) {
    return <LoadingSpinner size="lg" text="Loading content..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <AnimatedSection animation="fadeIn" duration={800}>
        <section className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <AnimatedSection animation="slideUp" delay={200} duration={800}>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  {getContent('booking_hero_title', 'Book Your Workspace')}
                </h1>
              </AnimatedSection>
              <AnimatedSection animation="slideUp" delay={400} duration={800}>
                <p className="text-xl md:text-2xl max-w-3xl mx-auto">
                  {getContent('booking_hero_subtitle', 'Reserve your ideal workspace in just a few simple steps')}
                </p>
              </AnimatedSection>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Booking Form */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="slideUp" duration={800}>
            <div className="bg-white rounded-lg shadow-lg p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Workspace Selection */}
                <AnimatedSection animation="slideUp" delay={200} duration={600}>
                  <div>
                    <h3 className="text-xl font-semibold text-black mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      {getContent('booking_workspace_title', 'Select Workspace Type')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {loading ? (
                        <div className="col-span-full flex justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                        </div>
                      ) : workspaceTypes.length === 0 ? (
                        <div className="col-span-full text-center py-8">
                          <p className="text-gray-500">No workspace types available.</p>
                        </div>
                      ) : (
                        workspaceTypes.map((workspace, index) => (
                          <AnimatedSection 
                            key={workspace.name}
                            animation="slideUp" 
                            delay={index * 100} 
                            duration={500}
                          >
                            <label
                              className={`border-2 rounded-lg p-6 cursor-pointer transition-all duration-300 transform hover:scale-105 block ${
                                formData.workspaceType === workspace.name
                                  ? 'border-yellow-500 bg-yellow-50'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              <input
                                type="radio"
                                name="workspaceType"
                                value={workspace.name}
                                checked={formData.workspaceType === workspace.name}
                                onChange={handleChange}
                                className="sr-only"
                              />
                              <div className="text-center space-y-3">
                                <h4 className="font-semibold text-black text-lg">{workspace.name}</h4>
                                <p className="text-gray-600 text-sm">{workspace.description}</p>
                                <div className="text-yellow-600 font-bold text-xl">E£{workspace.price}/{workspace.price_unit}</div>
                                {workspace.features && workspace.features.length > 0 && (
                                  <ul className="text-xs text-gray-500 space-y-1">
                                    {workspace.features.slice(0, 3).map((feature, idx) => (
                                      <li key={idx}>• {feature}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </label>
                          </AnimatedSection>
                        ))
                      )}
                    </div>
                  </div>
                </AnimatedSection>

                {/* Date & Time Selection */}
                <AnimatedSection animation="slideUp" delay={400} duration={600}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        Select Date
                      </label>
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        required
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all duration-300"
                      />
                    </div>
                  </div>
                </AnimatedSection>

                {/* Duration Selection */}
                <AnimatedSection animation="slideUp" delay={600} duration={600}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration
                    </label>
                    <select
                      name="duration"
                      value={formData.duration}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all duration-300"
                    >
                      <option value="">Select duration</option>
                      {durations.map((duration) => (
                        <option key={duration.value} value={duration.value}>
                          {duration.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </AnimatedSection>

                {/* Time Selection - moved after duration */}
                <AnimatedSection animation="slideUp" delay={700} duration={600}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-2" />
                      Select Time Slot {checkingAvailability && <span className="text-yellow-500">(Checking availability...)</span>}
                    </label>
                    <select
                      name="timeSlot"
                      value={formData.timeSlot}
                      onChange={handleChange}
                      required
                      disabled={!formData.workspaceType || !formData.date || !formData.duration || checkingAvailability}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all duration-300"
                    >
                      <option value="">
                        {!formData.workspaceType || !formData.date || !formData.duration
                          ? 'Select workspace, date, and duration first' 
                          : checkingAvailability 
                          ? 'Checking availability...' 
                          : 'Choose available time slot'
                        }
                      </option>
                      {hourlySlots
                        .filter(slot => !bookedSlots.includes(slot))
                        .map((slot) => (
                          <option key={slot} value={slot}>{slot}</option>
                        ))}
                    </select>
                    {formData.workspaceType && formData.date && formData.duration && bookedSlots.length > 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        Unavailable slots for {formData.duration}: {bookedSlots.join(', ')}
                      </p>
                    )}
                    {formData.workspaceType && formData.date && formData.duration && bookedSlots.length === hourlySlots.length && (
                      <p className="text-sm text-red-500 mt-1">
                        No available slots for this date and duration. Please choose a different date or shorter duration.
                      </p>
                    )}
                  </div>
                </AnimatedSection>

                {/* Customer Information */}
                <AnimatedSection animation="slideUp" delay={900} duration={600}>
                  <div>
                    <h3 className="text-xl font-semibold text-black mb-4">
                      {getContent('booking_contact_title', 'Contact Information')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <User className="w-4 h-4 inline mr-2" />
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="customerName"
                          value={formData.customerName}
                          onChange={handleChange}
                          required
                          disabled={!!user}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all duration-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Mail className="w-4 h-4 inline mr-2" />
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="customerEmail"
                          value={formData.customerEmail}
                          onChange={handleChange}
                          required
                          disabled={!!user}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all duration-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Phone className="w-4 h-4 inline mr-2" />
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="customerPhone"
                          value={formData.customerPhone}
                          onChange={handleChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all duration-300"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <MessageCircle className="w-4 h-4 inline mr-2" />
                          WhatsApp Number
                        </label>
                        <input
                          type="tel"
                          name="customerWhatsapp"
                          value={formData.customerWhatsapp}
                          onChange={handleChange}
                          required
                          disabled={!!user}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all duration-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                </AnimatedSection>

                {/* Price Summary */}
                {formData.workspaceType && formData.duration && (
                  <AnimatedSection animation="slideUp" delay={1100} duration={600}>
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-black mb-2">Price Summary</h3>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Cost:</span>
                        <span className="text-2xl font-bold text-yellow-600">E£{calculatePrice()}</span>
                      </div>
                      {formData.timeSlot && (
                        <div className="mt-2 text-sm text-gray-600">
                          <p>Workspace: {formData.workspaceType}</p>
                          <p>Duration: {durations.find(d => d.value === formData.duration)?.label}</p>
                          <p>Time: {formData.timeSlot}</p>
                        </div>
                      )}
                    </div>
                  </AnimatedSection>
                )}

                {/* Submit Button */}
                <AnimatedSection animation="slideUp" delay={1300} duration={600}>
                  <div className="text-center">
                    {!user ? (
                      <div className="space-y-4">
                        <button
                          type="submit"
                          className="bg-yellow-500 text-black px-8 py-4 rounded-lg text-lg font-semibold hover:bg-yellow-600 transition-all duration-300 transform hover:scale-105 flex items-center justify-center mx-auto"
                        >
                          <Lock className="w-5 h-5 mr-2" />
                          Sign In to Complete Booking
                        </button>
                        <p className="text-sm text-gray-600">
                          You need to be signed in to make a booking. Don't worry, your form data will be saved!
                        </p>
                      </div>
                    ) : (
                      <button
                        type="submit"
                        className="bg-yellow-500 text-black px-8 py-4 rounded-lg text-lg font-semibold hover:bg-yellow-600 transition-all duration-300 transform hover:scale-105"
                      >
                        Proceed to Confirmation
                      </button>
                    )}
                  </div>
                </AnimatedSection>
              </form>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default BookingPage;