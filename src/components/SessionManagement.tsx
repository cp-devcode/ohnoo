import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Play, Square, Clock, User, Calendar, Search, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface ActiveSession {
  id: string;
  user_id: string;
  booking_id: string | null;
  session_type: string;
  start_time: string;
  status: string;
  confirmation_required: boolean;
  user: {
    name: string;
    email: string;
    whatsapp?: string;
    phone?: string;
  };
  user_subscription: {
    hours_remaining: number;
    subscription_plan: {
      name: string;
    };
  } | null;
  booking?: {
    workspace_type: string;
    date: string;
    time_slot: string;
    duration: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  whatsapp?: string;
  phone?: string;
}

interface EndedBookingSession {
  id: string;
  user_id: string;
  booking_id: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  confirmation_required: boolean;
  user: {
    name: string;
    email: string;
    whatsapp?: string;
  };
  booking: {
    workspace_type: string;
    date: string;
    time_slot: string;
    duration: string;
  };
}

const SessionManagement: React.FC = () => {
  const { user } = useAuth();
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [endedBookingSessions, setEndedBookingSessions] = useState<EndedBookingSession[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingSession, setStartingSession] = useState<string | null>(null);
  const [endingSession, setEndingSession] = useState<string | null>(null);
  const [confirmingSession, setConfirmingSession] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSessionSearch, setActiveSessionSearch] = useState('');

  useEffect(() => {
    fetchActiveSessions();
    fetchEndedBookingSessions();
    fetchUsers();
  }, []);

  const fetchActiveSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select(`
          id,
          user_id,
          booking_id,
          session_type,
          start_time,
          status,
          confirmation_required,
          user:user_id (
            name,
            email,
            whatsapp,
            phone
          ),
          user_subscription:user_subscription_id (
            hours_remaining,
            subscription_plan:subscription_plan_id (
              name
            )
          ),
          booking:booking_id (
            workspace_type,
            date,
            time_slot,
            duration
          )
        `)
        .eq('status', 'active')
        .order('start_time', { ascending: false });

      if (error) throw error;
      setActiveSessions(data || []);
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      toast.error('Failed to load active sessions');
    }
  };

  const fetchEndedBookingSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select(`
          id,
          user_id,
          booking_id,
          start_time,
          end_time,
          duration_minutes,
          confirmation_required,
          user:user_id (
            name,
            email,
            whatsapp
          ),
          booking:booking_id (
            workspace_type,
            date,
            time_slot,
            duration
          )
        `)
        .eq('status', 'completed')
        .eq('session_type', 'booking')
        .eq('confirmation_required', true)
        .is('confirmed_by', null)
        .order('end_time', { ascending: false });

      if (error) throw error;
      setEndedBookingSessions(data || []);
    } catch (error) {
      console.error('Error fetching ended booking sessions:', error);
      toast.error('Failed to load ended booking sessions');
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, whatsapp, phone')
        .eq('role', 'customer')
        .order('name', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const startSession = async (userId: string) => {
    setStartingSession(userId);
    
    try {
      // Check if user already has an active session
      const { data: existingSession, error: checkError } = await supabase
        .from('user_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingSession) {
        toast.error('User already has an active session');
        return;
      }

      // Get user's active subscription
      const { data: subscription, error: subError } = await supabase
        .from('user_subscriptions')
        .select('id, hours_remaining')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString().split('T')[0])
        .single();

      if (subError && subError.code !== 'PGRST116') {
        throw subError;
      }

      if (!subscription) {
        toast.error('User does not have an active subscription');
        return;
      }

      if (subscription.hours_remaining <= 0) {
        toast.error('User has no remaining hours in their subscription');
        return;
      }

      // Start the session
      const { error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: userId,
          user_subscription_id: subscription.id,
          session_type: 'subscription',
          started_by: user?.id,
          status: 'active'
        });

      if (error) throw error;

      toast.success('Session started successfully');
      fetchActiveSessions();
    } catch (error) {
      console.error('Error starting session:', error);
      toast.error('Failed to start session');
    } finally {
      setStartingSession(null);
    }
  };

  const endSession = async (sessionId: string) => {
    setEndingSession(sessionId);
    
    try {
      // Get session details
      const { data: session, error: sessionError } = await supabase
        .from('user_sessions')
        .select(`
          id,
          user_id,
          user_subscription_id,
          session_type,
          start_time,
          user:user_id (
            name,
            email,
            whatsapp,
            phone
          ),
          user_subscription:user_subscription_id (
            hours_remaining,
            subscription_plan:subscription_plan_id (
              name
            )
          )
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      const endTime = new Date();
      const startTime = new Date(session.start_time);
      const durationMinutes = Math.ceil((endTime.getTime() - startTime.getTime()) / (1000 * 60));
      
      // For subscription sessions, deduct actual minutes from hours
      let hoursDeducted = 0;
      let minutesDeducted = 0;
      
      if (session.session_type === 'subscription') {
        // Convert minutes to decimal hours for subscription deduction
        hoursDeducted = durationMinutes / 60;
        minutesDeducted = durationMinutes;
      }

      // Update session
      const { error: updateError } = await supabase
        .from('user_sessions')
        .update({
          end_time: endTime.toISOString(),
          duration_minutes: durationMinutes,
          hours_deducted: hoursDeducted,
          minutes_deducted: minutesDeducted,
          status: 'completed',
          ended_by: user?.id
        })
        .eq('id', sessionId);

      if (updateError) throw updateError;

      // Update subscription hours for subscription sessions
      if (session.session_type === 'subscription' && session.user_subscription_id) {
        const newHoursRemaining = Math.max(0, session.user_subscription.hours_remaining - hoursDeducted);
        
        const { error: subUpdateError } = await supabase
          .from('user_subscriptions')
          .update({
            hours_remaining: newHoursRemaining
          })
          .eq('id', session.user_subscription_id);

        if (subUpdateError) throw subUpdateError;
      }

      // Send webhook notification
      try {
        await fetch('https://aibackend.cp-devcode.com/webhook/1ef572d1-3263-4784-bc19-c38b3fbc09d0', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'session_ended',
            sessionId: sessionId,
            userId: session.user_id,
            sessionType: session.session_type,
            customerData: {
              name: session.user.name,
              email: session.user.email,
              whatsapp: session.user.whatsapp,
              phone: session.user.phone
            },
            sessionDetails: {
              start_time: session.start_time,
              end_time: endTime.toISOString(),
              duration_minutes: durationMinutes,
              hours_deducted: hoursDeducted,
              minutes_deducted: minutesDeducted,
              subscription_plan: session.user_subscription?.subscription_plan?.name,
              hours_remaining: session.user_subscription ? Math.max(0, session.user_subscription.hours_remaining - hoursDeducted) : 0
            },
            endedBy: user?.name,
            timestamp: new Date().toISOString()
          })
        });
      } catch (webhookError) {
        console.error('Webhook failed:', webhookError);
      }

      toast.success(`Session ended. Duration: ${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`);
      fetchActiveSessions();
      fetchEndedBookingSessions();
    } catch (error) {
      console.error('Error ending session:', error);
      toast.error('Failed to end session');
    } finally {
      setEndingSession(null);
    }
  };

  const confirmBookingSessionExit = async (sessionId: string) => {
    setConfirmingSession(sessionId);
    
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({
          confirmed_by: user?.id,
          confirmation_required: false
        })
        .eq('id', sessionId);

      if (error) throw error;

      toast.success('User exit confirmed');
      fetchEndedBookingSessions();
    } catch (error) {
      console.error('Error confirming session exit:', error);
      toast.error('Failed to confirm exit');
    } finally {
      setConfirmingSession(null);
    }
  };

  const getSessionDuration = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - start.getTime()) / (1000 * 60));
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.whatsapp && u.whatsapp.includes(searchTerm)) ||
    (u.phone && u.phone.includes(searchTerm))
  );

  const filteredActiveSessions = activeSessions.filter(session =>
    session.user.name.toLowerCase().includes(activeSessionSearch.toLowerCase()) ||
    session.user.email.toLowerCase().includes(activeSessionSearch.toLowerCase()) ||
    (session.user.whatsapp && session.user.whatsapp.includes(activeSessionSearch)) ||
    (session.user.phone && session.user.phone.includes(activeSessionSearch))
  );

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Session Management</h3>

      {/* Ended Booking Sessions Requiring Confirmation */}
      {endedBookingSessions.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 text-orange-500 mr-2" />
            Ended Booking Sessions - Confirm Exit ({endedBookingSessions.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {endedBookingSessions.map((session) => (
              <div key={session.id} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium text-orange-700">AWAITING CONFIRMATION</span>
                  </div>
                  <button
                    onClick={() => confirmBookingSessionExit(session.id)}
                    disabled={confirmingSession === session.id}
                    className="bg-green-500 text-white px-3 py-1 rounded text-sm font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center"
                  >
                    {confirmingSession === session.id ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                        Confirming...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Confirm Exit
                      </>
                    )}
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <p className="font-medium text-gray-900">{session.user.name}</p>
                    <p className="text-sm text-gray-600">{session.user.email}</p>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p>Booking: {session.booking.workspace_type}</p>
                    <p>Date: {new Date(session.booking.date).toLocaleDateString()}</p>
                    <p>Time: {session.booking.time_slot}</p>
                    <p>Duration: {Math.floor(session.duration_minutes / 60)}h {session.duration_minutes % 60}m</p>
                    <p>Ended: {new Date(session.end_time).toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Sessions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-semibold text-gray-900">Active Sessions ({filteredActiveSessions.length})</h4>
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search active sessions..."
              value={activeSessionSearch}
              onChange={(e) => setActiveSessionSearch(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
            />
          </div>
        </div>
        
        {filteredActiveSessions.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">
              {activeSessionSearch ? 'No active sessions match your search' : 'No active sessions'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredActiveSessions.map((session) => (
              <div key={session.id} className="bg-white border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-sm font-medium text-green-700">
                      {session.session_type === 'booking' ? 'BOOKING SESSION' : 'SUBSCRIPTION SESSION'}
                    </span>
                  </div>
                  <button
                    onClick={() => endSession(session.id)}
                    disabled={endingSession === session.id}
                    className="bg-red-500 text-white px-3 py-1 rounded text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center"
                  >
                    {endingSession === session.id ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                        Ending...
                      </>
                    ) : (
                      <>
                        <Square className="w-3 h-3 mr-1" />
                        End
                      </>
                    )}
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <p className="font-medium text-gray-900">{session.user.name}</p>
                    <p className="text-sm text-gray-600">{session.user.email}</p>
                    {session.user.whatsapp && (
                      <p className="text-sm text-gray-600">WhatsApp: {session.user.whatsapp}</p>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p>Started: {new Date(session.start_time).toLocaleTimeString()}</p>
                    <p>Duration: {getSessionDuration(session.start_time)}</p>
                    
                    {session.session_type === 'booking' && session.booking && (
                      <>
                        <p>Booking: {session.booking.workspace_type}</p>
                        <p>Date: {new Date(session.booking.date).toLocaleDateString()}</p>
                        <p>Time: {session.booking.time_slot}</p>
                      </>
                    )}
                    
                    {session.session_type === 'subscription' && session.user_subscription && (
                      <>
                        <p>Plan: {session.user_subscription.subscription_plan.name}</p>
                        <p>Hours left: {session.user_subscription.hours_remaining}h</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Start New Session */}
      <div>
        <h4 className="text-md font-semibold text-gray-900 mb-4">Start New Subscription Session</h4>
        
        <div className="mb-4">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search users by name, email, WhatsApp, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
          {filteredUsers.map((u) => {
            const hasActiveSession = activeSessions.some(session => session.user_id === u.id);
            
            return (
              <div key={u.id} className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{u.name}</p>
                    <p className="text-sm text-gray-600">{u.email}</p>
                    {u.whatsapp && (
                      <p className="text-xs text-gray-500">WhatsApp: {u.whatsapp}</p>
                    )}
                    {u.phone && (
                      <p className="text-xs text-gray-500">Phone: {u.phone}</p>
                    )}
                  </div>
                  
                  <button
                    onClick={() => startSession(u.id)}
                    disabled={startingSession === u.id || hasActiveSession}
                    className={`px-3 py-1 rounded text-sm font-semibold transition-colors flex items-center ${
                      hasActiveSession
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-500 text-white hover:bg-green-600 disabled:opacity-50'
                    }`}
                  >
                    {startingSession === u.id ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                        Starting...
                      </>
                    ) : hasActiveSession ? (
                      'Active'
                    ) : (
                      <>
                        <Play className="w-3 h-3 mr-1" />
                        Start
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">
              {searchTerm ? 'No users found matching your search' : 'No users found'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionManagement;