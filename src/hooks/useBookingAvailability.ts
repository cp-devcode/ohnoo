import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useContent } from './useContent';
import { getUnavailableTimeSlots } from '../utils/bookingHelpers';

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

export const useBookingAvailability = () => {
  const { getSetting } = useContent();
  const [workspaceTypes, setWorkspaceTypes] = useState<WorkspaceType[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Get dynamic settings
  const totalDesks = parseInt(getSetting('total_desks', '6'));
  const hourlySlots = getSetting('hourly_slots', '9:00 AM,10:00 AM,11:00 AM,12:00 PM,1:00 PM,2:00 PM,3:00 PM,4:00 PM,5:00 PM')
    .split(',')
    .map(slot => slot.trim())
    .filter(slot => slot.length > 0);

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
      setLoading(false);
    }
  };

  const checkAvailability = async (workspaceType: string, date: string, duration: string) => {
    if (!workspaceType || !date || !duration) {
      setBookedSlots([]);
      return;
    }

    setCheckingAvailability(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('time_slot, duration, desk_number')
        .eq('workspace_type', workspaceType)
        .eq('date', date)
        .in('status', ['pending', 'confirmed', 'code_sent']);

      if (error) throw error;

      const existingBookings = data || [];
      
      // Simple logic: if any booking exists for a time slot, mark it as unavailable
      // This is much faster than the complex desk assignment logic
      const bookedTimeSlots = new Set<string>();
      
      existingBookings.forEach(booking => {
        bookedTimeSlots.add(booking.time_slot);
      });

      setBookedSlots(Array.from(bookedTimeSlots));
    } catch (error) {
      console.error('Error checking availability:', error);
      setBookedSlots([]);
    } finally {
      setCheckingAvailability(false);
    }
  };

  return {
    workspaceTypes,
    hourlySlots,
    totalDesks,
    bookedSlots,
    loading,
    checkingAvailability,
    checkAvailability
  };
};