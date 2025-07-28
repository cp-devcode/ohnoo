// Helper function to convert duration to hours
export const convertDurationToHours = (duration: string, totalSlots: number): number => {
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
export const getHourlySlotsForBooking = (startSlot: string, durationHours: number, allSlots: string[]): string[] => {
  const startIndex = allSlots.indexOf(startSlot);
  if (startIndex === -1) return [];
  
  const slots = [];
  for (let i = 0; i < durationHours && (startIndex + i) < allSlots.length; i++) {
    slots.push(allSlots[startIndex + i]);
  }
  return slots;
};

// Helper function to find an available desk for a booking
export const findAvailableDesk = (
  startSlot: string,
  duration: string,
  date: string,
  existingBookings: any[],
  hourlySlots: string[],
  totalDesks: number
): number | null => {
  const requestedDurationHours = convertDurationToHours(duration, hourlySlots.length);
  const requiredSlots = getHourlySlotsForBooking(startSlot, requestedDurationHours, hourlySlots);
  
  // Build desk availability matrix
  const deskAvailabilityMatrix = new Map<string, boolean[]>();
  
  // Initialize all slots as available for all desks
  hourlySlots.forEach(slot => {
    deskAvailabilityMatrix.set(slot, new Array(totalDesks).fill(true));
  });
  
  // Mark desks as unavailable based on existing bookings
  existingBookings.forEach(booking => {
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
      return deskIndex + 1; // Desk numbers are 1-indexed
    }
  }
  
  return null; // No available desk found
};

// Helper function to get unavailable time slots for a given date and duration
export const getUnavailableTimeSlots = (
  workspaceType: string,
  date: string,
  duration: string,
  existingBookings: any[],
  hourlySlots: string[],
  totalDesks: number
): string[] => {
  const requestedDurationHours = convertDurationToHours(duration, hourlySlots.length);
  
  // Build desk availability matrix
  const deskAvailabilityMatrix = new Map<string, boolean[]>();
  
  // Initialize all slots as available for all desks
  hourlySlots.forEach(slot => {
    deskAvailabilityMatrix.set(slot, new Array(totalDesks).fill(true));
  });
  
  // Mark desks as unavailable based on existing bookings
  existingBookings.forEach(booking => {
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
  
  return unavailableSlots;
};