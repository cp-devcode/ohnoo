import React, { useState } from 'react';
import { useEffect } from 'react';
import { MessageCircle, CheckCircle, AlertCircle, Phone, CreditCard } from 'lucide-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useBooking } from '../contexts/BookingContext';
import { useAuth } from '../contexts/AuthContext';
import { useContent } from '../hooks/useContent';
import { supabase } from '../lib/supabase';

interface BookingDetails {
  id: string;
  workspace_type: string;
  date: string;
  time_slot: string;
  duration: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_whatsapp: string;
  total_price: number;
  status: string;
  confirmation_code: string | null;
}

const ConfirmationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { confirmBooking } = useBooking();
  const { user } = useAuth();
  const { getSetting, getContent } = useContent();
  const [confirmationCode, setConfirmationCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [loadingBookingDetails, setLoadingBookingDetails] = useState(true);

  // Get booking ID from navigation state
  const bookingId = location.state?.bookingId || searchParams.get('bookingId');

  useEffect(() => {
    if (!bookingId) {
      navigate('/booking');
      return;
    }

    fetchBookingDetails();
  }, []);

  // Set up real-time subscription for booking updates
  useEffect(() => {
    if (!bookingId) return;

    const bookingSubscription = supabase
      .channel(`booking_${bookingId}`)
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'bookings',
          filter: `id=eq.${bookingId}`
        }, 
        (payload) => {
          console.log('Booking updated:', payload.new);
          setBookingDetails(payload.new as BookingDetails);
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(bookingSubscription);
    };
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoadingBookingDetails(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Booking not found');

      // Verify that the booking belongs to the current user (security check)
      if (user && data.user_id !== user.id) {
        throw new Error('Unauthorized access to booking');
      }

      setBookingDetails(data);
    } catch (error) {
      console.error('Error fetching booking details:', error);
      setError('Failed to load booking details. Please check the booking ID and try again.');
      // Redirect back to booking page after a delay
      setTimeout(() => navigate('/booking'), 3000);
    } finally {
      setLoadingBookingDetails(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (!bookingId) {
        throw new Error('No booking ID available');
      }

      await confirmBooking(bookingId, confirmationCode);
      
      // Success - redirect to thank you page
      navigate('/', { 
        state: { message: 'Booking confirmed successfully! We will contact you shortly.' }
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to confirm booking. Please try again or contact support.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get payment phone number from settings
  const paymentPhone = getSetting('payment_phone', '+20 123 456 7890');

  if (loadingBookingDetails) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Complete Your Payment
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto">
              Transfer the amount and get your confirmation code
            </p>
          </div>
        </div>
      </section>

      {/* Confirmation Section */}
      <section className="py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Booking Confirmation Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <CheckCircle className="w-6 h-6 text-blue-500 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Booking Received!</h3>
                <p className="text-blue-700">
                  {getContent('booking_confirmation_message', 'Thank you for your booking! Please follow the instructions below to complete your reservation.')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Booking Summary */}
            {bookingDetails && (
              <div className="mb-8">
              <h3 className="text-xl font-semibold text-black mb-4">Booking Summary</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Workspace:</span>
                  <span className="font-medium">{bookingDetails.workspace_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{new Date(bookingDetails.date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium">{bookingDetails.time_slot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{bookingDetails.duration}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600">Total Cost:</span>
                  <span className="font-bold text-yellow-600">E£{bookingDetails.total_price}</span>
                </div>
              </div>
              </div>
            )}

            {/* Payment Instructions */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <CreditCard className="w-6 h-6 text-green-500 mr-2" />
                <h3 className="text-xl font-semibold text-black">Payment Instructions</h3>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-4">
                <div className="flex items-start">
                  <Phone className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-green-800 font-medium text-lg mb-2">
                      Transfer Payment To:
                    </p>
                    <p className="text-green-700 text-2xl font-bold mb-3">
                      {paymentPhone}
                    </p>
                    <p className="text-green-700 text-lg font-medium mb-2">
                      Amount: E£{bookingDetails?.total_price || 0}
                    </p>
                    <div className="text-green-600 text-sm space-y-1">
                      <p>• Transfer the exact amount via mobile money or bank transfer</p>
                      <p>• After payment, admin will send you a confirmation code on WhatsApp</p>
                      <p>• The confirmation code may take 2-5 minutes to arrive</p>
                      <p>• Enter the code below to complete your booking</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* WhatsApp Confirmation */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <MessageCircle className="w-6 h-6 text-green-500 mr-2" />
                <h3 className="text-xl font-semibold text-black">Enter Confirmation Code</h3>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    {bookingDetails?.status === 'pending' ? (
                      <>
                        <p className="text-blue-800 font-medium">
                          Waiting for admin to send confirmation code
                        </p>
                        <p className="text-blue-600 text-sm mt-1">
                          After you complete the payment, our admin will send a confirmation code to: {bookingDetails?.customer_whatsapp}
                        </p>
                        <p className="text-blue-600 text-sm mt-1">
                          Please wait for the admin to process your payment and send the code.
                        </p>
                      </>
                    ) : bookingDetails?.status === 'code_sent' ? (
                      <>
                        <p className="text-blue-800 font-medium">
                          Confirmation code sent!
                        </p>
                        <p className="text-blue-600 text-sm mt-1">
                          Check your WhatsApp: {bookingDetails?.customer_whatsapp}
                        </p>
                        <p className="text-blue-600 text-sm mt-1">
                          Enter the 6-digit code you received to confirm your booking.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-blue-800 font-medium">
                          Booking status: {bookingDetails?.status}
                        </p>
                        <p className="text-blue-600 text-sm mt-1">
                          Please contact support if you need assistance.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter Confirmation Code
                  </label>
                  <input
                    type="text"
                    value={confirmationCode}
                    onChange={(e) => setConfirmationCode(e.target.value)}
                    required
                    disabled={bookingDetails?.status !== 'code_sent'}
                    placeholder="Enter 6-digit code"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || bookingDetails?.status !== 'code_sent'}
                  className="w-full bg-yellow-500 text-black py-3 px-6 rounded-md font-semibold hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                      Confirming...
                    </>
                  ) : bookingDetails?.status !== 'code_sent' ? (
                    'Waiting for confirmation code...'
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Confirm Booking
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-black mb-2">Need Help?</h3>
              <p className="text-gray-600 mb-2">
                If you don't receive the confirmation code after payment, please contact us:
              </p>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Phone: {getSetting('contact_phone', '+20 123 456 7890')}</p>
                <p className="text-sm text-gray-600">Email: {getSetting('contact_email', 'support@desk4u.com')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ConfirmationPage;