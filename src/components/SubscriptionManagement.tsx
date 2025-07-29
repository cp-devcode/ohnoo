import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit, Trash2, Save, X, Clock, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  hours_included: number;
  price: number;
  duration_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const SubscriptionManagement: React.FC = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    hours_included: 0,
    price: 0,
    duration_days: 30
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingPlan) {
        const { error } = await supabase
          .from('subscription_plans')
          .update(formData)
          .eq('id', editingPlan);

        if (error) throw error;
        toast.success('Plan updated successfully');
        setEditingPlan(null);
      } else {
        const { error } = await supabase
          .from('subscription_plans')
          .insert([formData]);

        if (error) throw error;
        toast.success('Plan created successfully');
        setCreatingPlan(false);
      }

      setFormData({
        name: '',
        description: '',
        hours_included: 0,
        price: 0,
        duration_days: 30
      });
      
      fetchPlans();
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error('Failed to save plan');
    }
  };

  const togglePlanStatus = async (planId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ is_active: !currentStatus })
        .eq('id', planId);

      if (error) throw error;
      toast.success(`Plan ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchPlans();
    } catch (error) {
      console.error('Error updating plan status:', error);
      toast.error('Failed to update plan status');
    }
  };

  const deletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;
      toast.success('Plan deleted successfully');
      fetchPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('Failed to delete plan');
    }
  };

  const startEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan.id);
    setFormData({
      name: plan.name,
      description: plan.description,
      hours_included: plan.hours_included,
      price: plan.price,
      duration_days: plan.duration_days
    });
  };

  const cancelEdit = () => {
    setEditingPlan(null);
    setCreatingPlan(false);
    setFormData({
      name: '',
      description: '',
      hours_included: 0,
      price: 0,
      duration_days: 30
    });
  };

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Only administrators can manage subscription plans.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Subscription Plans</h3>
        <button
          onClick={() => setCreatingPlan(true)}
          className="bg-yellow-500 text-black px-4 py-2 rounded-md font-semibold hover:bg-yellow-600 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Plan
        </button>
      </div>

      {/* Create/Edit Form */}
      {(creatingPlan || editingPlan) && (
        <div className="bg-gray-50 p-6 rounded-lg border">
          <h4 className="text-md font-semibold mb-4">
            {editingPlan ? 'Edit Plan' : 'Create New Plan'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hours Included
                </label>
                <input
                  type="number"
                  value={formData.hours_included}
                  onChange={(e) => setFormData(prev => ({ ...prev, hours_included: parseInt(e.target.value) }))}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (E£)
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (Days)
                </label>
                <input
                  type="number"
                  value={formData.duration_days}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_days: parseInt(e.target.value) }))}
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-green-600 transition-colors flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingPlan ? 'Update Plan' : 'Create Plan'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="bg-gray-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-gray-600 transition-colors flex items-center"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Plans List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-lg shadow-sm border p-6 ${
              !plan.is_active ? 'opacity-60' : ''
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{plan.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => startEdit(plan)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deletePlan(plan.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-600">Hours</span>
                </div>
                <span className="font-semibold">{plan.hours_included}h</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-600">Price</span>
                </div>
                <span className="font-semibold">E£{plan.price}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Duration</span>
                <span className="font-semibold">{plan.duration_days} days</span>
              </div>

              <div className="pt-3 border-t">
                <button
                  onClick={() => togglePlanStatus(plan.id, plan.is_active)}
                  className={`w-full py-2 px-4 rounded-md font-semibold transition-colors ${
                    plan.is_active
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {plan.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No subscription plans found.</p>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagement;