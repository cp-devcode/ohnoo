import React, { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { findAvailableDesk } from '../utils/bookingHelpers';

interface BookingContextType {
  confirmBooking: (bookingId: string, confirmationCode: string) => Promise<void>;
  createAdminBooking: (bookingData: any) => Promise<void>;
  cancelBooking: (bookingId: string) => Promise<void>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const confirmBooking = async (bookingId: string, confirmationCode: string) => {
    try {
      const { data: currentBooking, error: fetchError } = await supabase
        .from('bookings')
        .select()
        .eq('id', bookingId)
        .single();

      if (fetchError) throw fetchError;
      if (!currentBooking) throw new Error('Booking not found');

      if (currentBooking.status !== 'code_sent') {
        throw new Error(`Booking status is ${currentBooking.status}. Code must be sent by admin first.`);
      }

      if (currentBooking.confirmation_code !== confirmationCode) {
        throw new Error('Invalid confirmation code');
      }

      const { data, error } = await supabase
        .from('bookings')
        .update({
          confirmation_code: confirmationCode,
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;

      try {
        await fetch('https://aibackend.cp-devcode.com/webhook/1ef572d1-3263-4784-bc19-c38b3fbc09d0', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'booking_confirmed_by_customer',
            bookingId,
            confirmationCode,
            customerData: {
              name: currentBooking.customer_name,
              whatsapp: currentBooking.customer_whatsapp,
              email: currentBooking.customer_email
            },
            bookingDetails: {
              workspace_type: currentBooking.workspace_type,
              date: currentBooking.date,
              time_slot: currentBooking.time_slot,
              duration: currentBooking.duration,
              total_price: currentBooking.total_price
            },
            timestamp: new Date().toISOString()
          })
        });
      } catch (webhookError) {
        console.error('Webhook failed:', webhookError);
      }

      console.log('Booking confirmed successfully:', data);
      return data;

    } catch (error) {
      console.error('Booking confirmation failed:', error);
      throw error;
    }
  };

  const createAdminBooking = async (bookingData: any) => {
    try {
      const { data: settingsData, error: settingsError } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['hourly_slots', 'total_desks']);

      if (settingsError) throw settingsError;

      const settings = settingsData?.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, string>) || {};

      const totalDesks = parseInt(settings['total_desks'] || '6');
      const hourlySlots = (settings['hourly_slots'] || '')
        .split(',')
        .map(slot => slot.trim())
        .filter(Boolean);

      const { data: existingBookings, error: fetchError } = await supabase
        .from('bookings')
        .select('time_slot, duration, desk_number')
        .eq('workspace_type', bookingData.workspaceType)
        .eq('date', bookingData.date)
        .in('status', ['pending', 'confirmed', 'code_sent']);

      if (fetchError) throw fetchError;

      const assignedDeskNumber = findAvailableDesk(
        bookingData.timeSlot,
        bookingData.duration,
        bookingData.date,
        existingBookings || [],
        hourlySlots,
        totalDesks
      );

      if (!assignedDeskNumber) {
        throw new Error('No available desk found for the selected time slot and duration.');
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
          status: 'confirmed',
          user_id: user?.id || null,
          desk_number: assignedDeskNumber
        })
        .select()
        .single();

      if (error) throw error;

      try {
        await fetch('https://aibackend.cp-devcode.com/webhook/1ef572d1-3263-4784-bc19-c38b3fbc09d0', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'admin_booking_created',
            bookingId: data.id,
            adminUser: user?.name || 'Admin',
            customerData: {
              name: bookingData.customerName,
              whatsapp: bookingData.customerWhatsapp,
              email: bookingData.customerEmail,
              phone: bookingData.customerPhone
            },
            bookingDetails: {
              workspace_type: bookingData.workspaceType,
              date: bookingData.date,
              time_slot: bookingData.timeSlot,
              duration: bookingData.duration,
              total_price: bookingData.totalPrice,
              desk_number: assignedDeskNumber
            },
            timestamp: new Date().toISOString()
          })
        });
      } catch (webhookError) {
        console.error('Webhook failed:', webhookError);
      }

      console.log('Admin booking created successfully:', data);
      return data;

    } catch (error) {
      console.error('Admin booking creation failed:', error);
      throw error;
    }
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      const { data: currentBooking, error: fetchError } = await supabase
        .from('bookings')
        .select()
        .eq('id', bookingId)
        .single();

      if (fetchError) throw fetchError;
      if (!currentBooking) throw new Error('Booking not found');

      if (currentBooking.status !== 'pending') {
        throw new Error(`Cannot cancel booking with status: ${currentBooking.status}`);
      }

      if (user && currentBooking.user_id !== user.id) {
        throw new Error('You can only cancel your own bookings');
      }

      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;

      try {
        await fetch('https://aibackend.cp-devcode.com/webhook/1ef572d1-3263-4784-bc19-c38b3fbc09d0', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'booking_cancelled_by_user',
            bookingId,
            customerData: {
              name: currentBooking.customer_name,
              whatsapp: currentBooking.customer_whatsapp,
              email: currentBooking.customer_email
            },
            bookingDetails: {
              workspace_type: currentBooking.workspace_type,
              date: currentBooking.date,
              time_slot: currentBooking.time_slot,
              duration: currentBooking.duration,
              total_price: currentBooking.total_price
            },
            timestamp: new Date().toISOString()
          })
        });
      } catch (webhookError) {
        console.error('Webhook failed:', webhookError);
      }

      console.log('Booking cancelled successfully');
    } catch (error) {
      console.error('Booking cancellation failed:', error);
      throw error;
    }
  };

  return (
    <BookingContext.Provider value={{ confirmBooking, createAdminBooking, cancelBooking }}>
      {children}
    </BookingContext.Provider>
  );
};
