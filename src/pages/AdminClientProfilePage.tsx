import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Navigate, Link, useParams } from 'react-router-dom';
import AnimatedSection from '../components/AnimatedSection';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Edit, 
  Trash2, 
  Save, 
  X,
  MessageCircle,
  Clock,
  DollarSign,
  ArrowLeft,
  Plus,
  CreditCard,
  Play
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ClientUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff' | 'customer';
  created_at: string;
  updated_at: string;
}

interface Booking {
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
  status: 'pending' | 'code_sent' | 'confirmed' | 'rejected' | 'cancelled';
  created_at: string;
  updated_at: string;
}

interface AdminNote {
  id: string;
  note_content: string;
  created_at: string;
  admin: {
    name: string;
    email: string;
  };
}

interface ActivityLog {
  id: string;
  action: string;
  details: any;
  created_at: string;
}

interface UserSubscription {
  id: string;
  hours_remaining: number;
  start_date: string;
  end_date: string;
  status: string;
  subscription_plan: {
    name: string;
    hours_included: number;
    price: number;
  };
  created_at: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  hours_included: number;
  price: number;
  duration_days: number;
  is_active: boolean;
}

interface UserSession {
  id: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  hours_deducted: number;
  minutes_deducted: number;
  status: string;
  session_type: string;
  created_at: string;
  booking?: {
    workspace_type: string;
    date: string;
    time_slot: string;
  };
}

const AdminClientProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { userId } = useParams<{ userId: string }>();
  const [client, setClient] = useState<ClientUser | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [adminNotes, setAdminNotes] = useState<AdminNote[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [userSessions, setUserSessions] = useState<UserSession[]>([]);
  const [assigningSubscription, setAssigningSubscription] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [startingSession, setStartingSession] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState(false);
  const [newRole, setNewRole] = useState<string>('');
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [editingBooking, setEditingBooking] = useState<string | null>(null);
  const [editBookingData, setEditBookingData] = useState<Partial<Booking>>({});

  if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    if (userId) {
      fetchClientData();
    }
  }, [userId]);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      
      // Fetch client details
      const { data: clientData, error: clientError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (clientError) throw clientError;
      setClient(clientData);
      setNewRole(clientData.role);

      // Fetch client bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;
      setBookings(bookingsData || []);

      // Fetch admin notes
      const { data: notesData, error: notesError } = await supabase
        .from('admin_notes')
        .select(`
          id,
          note_content,
          created_at,
          admin:admin_id (
            name,
            email
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;
      setAdminNotes(notesData || []);

      // Fetch activity log
      const { data: activityData, error: activityError } = await supabase
        .from('user_activity_log')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (activityError) throw activityError;
      setActivityLog(activityData || []);

      // Fetch user subscription
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select(`
          id,
          hours_remaining,
          start_date,
          end_date,
          status,
          created_at,
          subscription_plan:subscription_plan_id (
            name,
            hours_included,
            price
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString().split('T')[0])
        .single();

      if (subscriptionError && subscriptionError.code !== 'PGRST116') {
        throw subscriptionError;
      }
      setUserSubscription(subscriptionData);

      // Fetch subscription plans
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (plansError) throw plansError;
      setSubscriptionPlans(plansData || []);

      // Fetch user sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('user_sessions')
        .select(`
          id,
          start_time,
          end_time,
          duration_minutes,
          hours_deducted,
          minutes_deducted,
          status,
          session_type,
          created_at,
          booking:booking_id (
            workspace_type,
            date,
            time_slot
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (sessionsError) throw sessionsError;
      setUserSessions(sessionsData || []);

    } catch (error) {
      console.error('Error fetching client data:', error);
      toast.error('Failed to load client data');
    } finally {
      setLoading(false);
    }
  };

  const updateClientRole = async () => {
    // Only admins can update roles
    if (user.role !== 'admin') {
      alert('Only administrators can change user roles.');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      // Log the activity
      await supabase
        .from('user_activity_log')
        .insert({
          user_id: userId,
          action: 'role_updated_by_admin',
          details: { old_role: client?.role, new_role: newRole, admin_name: user.name }
        });

      setClient(prev => prev ? { ...prev, role: newRole as any } : null);
      setEditingRole(false);
      toast.success('Role updated successfully');
      fetchClientData(); // Refresh to get updated activity log
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  const addAdminNote = async () => {
    if (!newNote.trim()) return;

    try {
      setAddingNote(true);
      const { error } = await supabase
        .from('admin_notes')
        .insert({
          user_id: userId,
          admin_id: user.id,
          note_content: newNote
        });

      if (error) throw error;

      // Log the activity
      await supabase
        .from('user_activity_log')
        .insert({
          user_id: userId,
          action: 'admin_note_added',
          details: { admin_name: user.name, note_preview: newNote.substring(0, 50) }
        });

      setNewNote('');
      toast.success('Note added successfully');
      fetchClientData(); // Refresh to get new note and activity log
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      // Log the activity
      await supabase
        .from('user_activity_log')
        .insert({
          user_id: userId,
          action: 'booking_status_updated_by_admin',
          details: { booking_id: bookingId, new_status: newStatus, admin_name: user.name }
        });

      toast.success(`Booking ${newStatus} successfully`);
      fetchClientData(); // Refresh data
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('Failed to update booking status');
    }
  };

  const updateBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update(editBookingData)
        .eq('id', bookingId);

      if (error) throw error;

      // Log the activity
      await supabase
        .from('user_activity_log')
        .insert({
          user_id: userId,
          action: 'booking_updated_by_admin',
          details: { booking_id: bookingId, changes: editBookingData, admin_name: user.name }
        });

      setEditingBooking(null);
      setEditBookingData({});
      toast.success('Booking updated successfully');
      fetchClientData(); // Refresh data
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking');
    }
  };

  const assignSubscription = async () => {
    if (!selectedPlanId) {
      toast.error('Please select a subscription plan');
      return;
    }

    try {
      setAssigningSubscription(true);
      
      const selectedPlan = subscriptionPlans.find(p => p.id === selectedPlanId);
      if (!selectedPlan) {
        throw new Error('Selected plan not found');
      }

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + selectedPlan.duration_days);

      // Cancel existing active subscription
      if (userSubscription) {
        await supabase
          .from('user_subscriptions')
          .update({ status: 'cancelled' })
          .eq('id', userSubscription.id);
      }

      // Create new subscription
      const { error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          subscription_plan_id: selectedPlanId,
          hours_remaining: selectedPlan.hours_included,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          status: 'active'
        });

      if (error) throw error;

      // Log the activity
      await supabase
        .from('user_activity_log')
        .insert({
          user_id: userId,
          action: 'subscription_assigned_by_admin',
          details: { 
            plan_name: selectedPlan.name, 
            hours_included: selectedPlan.hours_included,
            admin_name: user.name 
          }
        });

      toast.success('Subscription assigned successfully');
      setSelectedPlanId('');
      fetchClientData(); // Refresh data
    } catch (error) {
      console.error('Error assigning subscription:', error);
      toast.error('Failed to assign subscription');
    } finally {
      setAssigningSubscription(false);
    }
  };

  const startUserSession = async () => {
    if (!userSubscription) {
      toast.error('User does not have an active subscription');
      return;
    }

    if (userSubscription.hours_remaining <= 0) {
      toast.error('User has no remaining hours in their subscription');
      return;
    }

    try {
      setStartingSession(true);

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

      const { error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: userId,
          user_subscription_id: userSubscription.id,
          session_type: 'subscription',
          started_by: user?.id,
          status: 'active'
        });

      if (error) throw error;

      toast.success('Session started successfully');
      fetchClientData(); // Refresh to show new session
    } catch (error) {
      console.error('Error starting session:', error);
      toast.error('Failed to start session');
    } finally {
      setStartingSession(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'code_sent':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'staff':
        return 'bg-blue-100 text-blue-800';
      case 'customer':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading client profile..." />;
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Client not found</h2>
          <Link to="/admin/clients" className="bg-yellow-500 text-black px-6 py-3 rounded-md font-semibold hover:bg-yellow-600 transition-colors">
            Back to Clients
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                to="/admin/clients"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {client.name || 'Unnamed User'}
                </h1>
                <p className="text-gray-600">{client.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Client Details */}
          <div className="lg:col-span-1 space-y-6">
            {/* Client Info */}
            <AnimatedSection animation="slideUp" duration={600}>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Details</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-black font-bold text-lg">
                        {(client.name || client.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{client.name || 'No name set'}</p>
                      <p className="text-sm text-gray-500">{client.email}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Role:</span>
                      {editingRole ? (
                        <div className="flex items-center space-x-2">
                          <select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            disabled={user.role !== 'admin'}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="customer">Customer</option>
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                          </select>
                          {user.role === 'admin' && (
                            <button
                              onClick={updateClientRole}
                              className="text-green-600 hover:text-green-800"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingRole(false);
                              setNewRole(client.role);
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(client.role)}`}>
                            {client.role}
                          </span>
                          {user.role === 'admin' && (
                            <button
                              onClick={() => setEditingRole(true)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="text-sm text-gray-600">
                      <p>Joined: {new Date(client.created_at).toLocaleDateString()}</p>
                      <p>Last updated: {new Date(client.updated_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            {/* Subscription Info */}
            <AnimatedSection animation="slideUp" delay={150} duration={600}>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription</h3>
                
                {userSubscription ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Plan:</span>
                      <span className="font-semibold">{userSubscription.subscription_plan.name}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Hours Remaining:</span>
                      <span className={`font-semibold ${
                        userSubscription.hours_remaining <= 5 ? 'text-red-600' : 
                        userSubscription.hours_remaining <= 20 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {userSubscription.hours_remaining}h
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Valid Until:</span>
                      <span className="font-semibold">
                        {new Date(userSubscription.end_date).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="pt-3 border-t">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            userSubscription.hours_remaining <= 5 ? 'bg-red-500' : 
                            userSubscription.hours_remaining <= 20 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ 
                            width: `${Math.max(5, (userSubscription.hours_remaining / userSubscription.subscription_plan.hours_included) * 100)}%` 
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {userSubscription.hours_remaining} of {userSubscription.subscription_plan.hours_included} hours remaining
                      </p>
                    </div>
                    
                    {userSubscription.status === 'active' && (
                      <div className="mt-4 pt-4 border-t">
                        <button
                          onClick={startUserSession}
                          disabled={startingSession}
                          className="w-full bg-green-500 text-white py-2 px-4 rounded-md text-sm font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          {startingSession ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Starting Session...
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Start Session
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm mb-4">No active subscription</p>
                  </div>
                )}

                {/* Assign Subscription */}
                {user.role === 'admin' && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Assign New Subscription</h4>
                    <div className="flex space-x-2">
                      <select
                        value={selectedPlanId}
                        onChange={(e) => setSelectedPlanId(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                      >
                        <option value="">Select a plan...</option>
                        {subscriptionPlans.map(plan => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name} - {plan.hours_included}h - E£{plan.price}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={assignSubscription}
                        disabled={!selectedPlanId || assigningSubscription}
                        className="bg-yellow-500 text-black px-4 py-2 rounded-md text-sm font-semibold hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {assigningSubscription ? 'Assigning...' : 'Assign'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </AnimatedSection>

            {/* Admin Notes */}
            <AnimatedSection animation="slideUp" delay={200} duration={600}>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Notes</h3>
                
                {/* Add Note Form */}
                <div className="mb-4">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note about this client..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    rows={3}
                  />
                  <button
                    onClick={addAdminNote}
                    disabled={!newNote.trim() || addingNote}
                    className="mt-2 bg-yellow-500 text-black px-4 py-2 rounded-md text-sm font-semibold hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {addingNote ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Note
                      </>
                    )}
                  </button>
                </div>

                {/* Notes List */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {adminNotes.length === 0 ? (
                    <p className="text-gray-500 text-sm">No notes yet.</p>
                  ) : (
                    adminNotes.map((note) => (
                      <div key={note.id} className="border border-gray-200 rounded-lg p-3">
                        <p className="text-sm text-gray-900 mb-2">{note.note_content}</p>
                        <div className="text-xs text-gray-500">
                          <p>By: {note.admin.name || note.admin.email}</p>
                          <p>{new Date(note.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </AnimatedSection>

            {/* Activity Timeline */}
            <AnimatedSection animation="slideUp" delay={250} duration={600}>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {activityLog.length === 0 ? (
                    <p className="text-gray-500 text-sm">No activity recorded.</p>
                  ) : (
                    activityLog.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{activity.action.replace(/_/g, ' ')}</p>
                          {activity.details && (
                            <p className="text-xs text-gray-500">{JSON.stringify(activity.details)}</p>
                          )}
                          <p className="text-xs text-gray-400">{new Date(activity.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </AnimatedSection>
          </div>

          {/* Right Column - Bookings */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Recent Sessions */}
              <AnimatedSection animation="slideUp" duration={600}>
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Sessions ({userSessions.length})</h3>
                  
                  {userSessions.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No sessions found for this client.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {userSessions.map((session) => (
                        <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                session.session_type === 'booking' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                              }`}>
                                {session.session_type?.toUpperCase() || 'SUBSCRIPTION'}
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                session.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {session.status.toUpperCase()}
                              </span>
                              {session.status === 'active' && (
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              )}
                            </div>
                            {session.session_type === 'subscription' && session.hours_deducted > 0 && (
                              <span className="text-sm font-medium text-red-600">
                                -{session.hours_deducted.toFixed(2)}h
                              </span>
                            )}
                            {session.session_type === 'booking' && session.duration_minutes > 0 && (
                              <span className="text-sm font-medium text-blue-600">
                                {Math.floor(session.duration_minutes / 60)}h {session.duration_minutes % 60}m
                              </span>
                            )}
                          </div>
                          
                          <div className="space-y-1 text-sm text-gray-600">
                            {session.session_type === 'booking' && session.booking && (
                              <div className="mb-2 p-2 bg-blue-50 rounded">
                                <p><span className="font-medium">Booking:</span> {session.booking.workspace_type}</p>
                                <p><span className="font-medium">Date:</span> {new Date(session.booking.date).toLocaleDateString()}</p>
                                <p><span className="font-medium">Time:</span> {session.booking.time_slot}</p>
                              </div>
                            )}
                            
                            <div>
                              <p><span className="font-medium">Started:</span> {new Date(session.start_time).toLocaleString()}</p>
                              {session.end_time && (
                                <p><span className="font-medium">Ended:</span> {new Date(session.end_time).toLocaleString()}</p>
                              )}
                              {session.duration_minutes && (
                                <p><span className="font-medium">Duration:</span> {Math.floor(session.duration_minutes / 60)}h {session.duration_minutes % 60}m</p>
                              )}
                              {session.session_type === 'subscription' && session.hours_deducted && (
                                <p><span className="font-medium">Hours Deducted:</span> {session.hours_deducted.toFixed(2)}h</p>
                              )}
                              {session.status === 'active' && (
                                <p><span className="font-medium">Current:</span> {(() => {
                                  const now = new Date();
                                  const start = new Date(session.start_time);
                                  const diffMinutes = Math.floor((now.getTime() - start.getTime()) / (1000 * 60));
                                  return `${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m`;
                                })()}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </AnimatedSection>

              {/* Booking History */}
              <AnimatedSection animation="slideUp" delay={100} duration={600}>
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Booking History</h3>
                
                  {bookings.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No bookings found for this client.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bookings.map((booking) => (
                        <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <h4 className="font-medium text-gray-900">{booking.workspace_type}</h4>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                                {booking.status.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                          
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => setExpandedBooking(expandedBooking === booking.id ? null : booking.id)}
                                className="text-gray-500 hover:text-gray-700 text-sm"
                              >
                                {expandedBooking === booking.id ? 'Hide' : 'Details'}
                              </button>
                            
                              {booking.status !== 'cancelled' && (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingBooking(booking.id);
                                      setEditBookingData(booking);
                                    }}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                
                                  <button
                                    onClick={() => {
                                      if (confirm('Are you sure you want to cancel this booking?')) {
                                        updateBookingStatus(booking.id, 'cancelled');
                                      }
                                    }}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2" />
                              {new Date(booking.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2" />
                              {booking.time_slot}
                            </div>
                            <div className="flex items-center">
                              <DollarSign className="w-4 h-4 mr-2" />
                              E£{booking.total_price}
                            </div>
                            <div className="text-xs text-gray-500">
                              {booking.duration}
                            </div>
                          </div>

                          {/* Expanded Details */}
                          {expandedBooking === booking.id && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              {editingBooking === booking.id ? (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                      <input
                                        type="date"
                                        value={editBookingData.date || ''}
                                        onChange={(e) => setEditBookingData(prev => ({ ...prev, date: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot</label>
                                      <input
                                        type="text"
                                        value={editBookingData.time_slot || ''}
                                        onChange={(e) => setEditBookingData(prev => ({ ...prev, time_slot: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                                      <input
                                        type="text"
                                        value={editBookingData.customer_name || ''}
                                        onChange={(e) => setEditBookingData(prev => ({ ...prev, customer_name: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Price</label>
                                      <input
                                        type="number"
                                        value={editBookingData.total_price || ''}
                                        onChange={(e) => setEditBookingData(prev => ({ ...prev, total_price: parseFloat(e.target.value) }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                      />
                                    </div>
                                  </div>
                                
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => updateBooking(booking.id)}
                                      className="bg-green-500 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-green-600 transition-colors"
                                    >
                                      Save Changes
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingBooking(null);
                                        setEditBookingData({});
                                      }}
                                      className="bg-gray-500 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-600 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p><span className="font-medium">Customer:</span> {booking.customer_name}</p>
                                    <p><span className="font-medium">Email:</span> {booking.customer_email}</p>
                                    <p><span className="font-medium">Phone:</span> {booking.customer_phone}</p>
                                    <p><span className="font-medium">WhatsApp:</span> {booking.customer_whatsapp}</p>
                                  </div>
                                  <div>
                                    <p><span className="font-medium">Duration:</span> {booking.duration}</p>
                                    <p><span className="font-medium">Created:</span> {new Date(booking.created_at).toLocaleString()}</p>
                                    <p><span className="font-medium">Updated:</span> {new Date(booking.updated_at).toLocaleString()}</p>
                                  
                                    {booking.status === 'pending' && (
                                      <div className="mt-2 space-x-2">
                                        <button
                                          onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                                          className="bg-green-500 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-green-600 transition-colors"
                                        >
                                          Confirm
                                        </button>
                                        <button
                                          onClick={() => updateBookingStatus(booking.id, 'rejected')}
                                          className="bg-red-500 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-red-600 transition-colors"
                                        >
                                          Reject
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminClientProfilePage;