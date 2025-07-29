import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Play, Square, Clock, User, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

interface ActiveSession {
  id: string;
  user_id: string;
  start_time: string;
  status: string;
  user: {
    name: string;
    email: string;
  };
  user_subscription: {
    hours_remaining: number;
    subscription_plan: {
      name: string;
    };
  } | null;
}

interface User {
  id: string;
  name: string;
  email: string;
}

const SessionManagement: React.FC = () => {
  const { user } = useAuth();
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingSession, setStartingSession] = useState<string | null>(null);
  const [endingSession, setEndingSession] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchActiveSessions();
    fetchUsers();
  }, []);

  const fetchActiveSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select(`
          id,
          user_id,
          start_time,
          status,
          user:user_id (
            name,
            email
          ),
          user_subscription:user_subscription_id (
            hours_remaining,
            subscription_plan:subscription_plan_id (
              name
            )
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

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
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
          start_time,
          user:user_id (
            name,
            email,
            whatsapp
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
      const hoursDeducted = Math.ceil(durationMinutes / 60); // Round up to nearest hour

      // Update session
      const { error: updateError } = await supabase
        .from('user_sessions')
        .update({
          end_time: endTime.toISOString(),
          duration_minutes: durationMinutes,
          hours_deducted: hoursDeducted,
          status: 'completed',
          ended_by: user?.id
        })
        .eq('id', sessionId);

      if (updateError) throw updateError;

      // Update subscription hours
      if (session.user_subscription_id) {
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
            customerData: {
              name: session.user.name,
              email: session.user.email,
              whatsapp: session.user.whatsapp
            },
            sessionDetails: {
              start_time: session.start_time,
              end_time: endTime.toISOString(),
              duration_minutes: durationMinutes,
              hours_deducted: hoursDeducted,
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

      toast.success(`Session ended. Duration: ${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m. Hours deducted: ${hoursDeducted}`);
      fetchActiveSessions();
    } catch (error) {
      console.error('Error ending session:', error);
      toast.error('Failed to end session');
    } finally {
      setEndingSession(null);
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
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
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

      {/* Active Sessions */}
      <div>
        <h4 className="text-md font-semibold text-gray-900 mb-4">Active Sessions ({activeSessions.length})</h4>
        {activeSessions.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No active sessions</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeSessions.map((session) => (
              <div key={session.id} className="bg-white border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-sm font-medium text-green-700">ACTIVE</span>
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
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p>Started: {new Date(session.start_time).toLocaleTimeString()}</p>
                    <p>Duration: {getSessionDuration(session.start_time)}</p>
                    {session.user_subscription && (
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
        <h4 className="text-md font-semibold text-gray-900 mb-4">Start New Session</h4>
        
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
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
            <p className="text-gray-500">No users found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionManagement;