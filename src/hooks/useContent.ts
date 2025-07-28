import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface ContentItem {
  id: string;
  key: string;
  title: string;
  content: string;
  content_type: string;
  page: string;
  section: string | null;
  metadata: any;
  is_published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface SiteSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  setting_type: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  description: string;
  image_url?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Statistic {
  id: string;
  key: string;
  label: string;
  value: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  monthly_price?: string;
  description: string;
  features: string[];
  not_included: string[];
  is_popular: boolean;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PricingFAQ {
  id: string;
  question: string;
  answer: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useContent = () => {
  const [content, setContent] = useState<Record<string, string>>({});
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSetting[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [statistics, setStatistics] = useState<Statistic[]>([]);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [pricingFAQs, setPricingFAQs] = useState<PricingFAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching content from database...');
      
      // Fetch all data in parallel
      const [
        contentResult, 
        settingsResult, 
        teamResult, 
        statsResult, 
        plansResult, 
        faqsResult
      ] = await Promise.all([
        supabase
          .from('content_items')
          .select('*')
          .eq('is_published', true)
          .order('display_order', { ascending: true }),
        supabase
          .from('site_settings')
          .select('*')
          .order('key', { ascending: true }),
        supabase
          .from('team_members')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
        supabase
          .from('statistics')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
        supabase
          .from('pricing_plans')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
        supabase
          .from('pricing_faqs')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true })
      ]);

      if (contentResult.error) {
        console.error('Content fetch error:', contentResult.error);
        throw contentResult.error;
      }

      if (settingsResult.error) {
        console.error('Settings fetch error:', settingsResult.error);
        throw settingsResult.error;
      }

      if (teamResult.error) {
        console.error('Team fetch error:', teamResult.error);
        throw teamResult.error;
      }

      if (statsResult.error) {
        console.error('Stats fetch error:', statsResult.error);
        throw statsResult.error;
      }

      if (plansResult.error) {
        console.error('Plans fetch error:', plansResult.error);
        throw plansResult.error;
      }

      if (faqsResult.error) {
        console.error('FAQs fetch error:', faqsResult.error);
        throw faqsResult.error;
      }

      console.log('Fetched content items:', contentResult.data);
      console.log('Fetched site settings:', settingsResult.data);
      console.log('Fetched team members:', teamResult.data);
      console.log('Fetched statistics:', statsResult.data);
      console.log('Fetched pricing plans:', plansResult.data);
      console.log('Fetched pricing FAQs:', faqsResult.data);

      // Convert content array to object with key as the property name
      const contentMap = (contentResult.data || []).reduce((acc, item) => {
        acc[item.key] = item.content;
        return acc;
      }, {} as Record<string, string>);

      // Convert settings array to object with key as the property name
      const settingsMap = (settingsResult.data || []).reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, string>);

      console.log('Content map:', contentMap);
      console.log('Settings map:', settingsMap);

      setContent(contentMap);
      setSettings(settingsMap);
      setContentItems(contentResult.data || []);
      setSiteSettings(settingsResult.data || []);
      setTeamMembers(teamResult.data || []);
      setStatistics(statsResult.data || []);
      setPricingPlans(plansResult.data || []);
      setPricingFAQs(faqsResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load content');
      // Don't show toast error for initial load failures
      console.warn('Using fallback content due to database error');
    } finally {
      setLoading(false);
    }
  };

  const getContent = (key: string, fallback: string = '') => {
    const value = content[key];
    if (!value && fallback) {
      console.warn(`Content key "${key}" not found, using fallback:`, fallback);
    }
    return value || fallback;
  };

  const getSetting = (key: string, fallback: string = '') => {
    const value = settings[key];
    if (!value && fallback) {
      console.warn(`Setting key "${key}" not found, using fallback:`, fallback);
    }
    return value || fallback;
  };

  const updateContent = async (key: string, newContent: string) => {
    try {
      const { error } = await supabase
        .from('content_items')
        .update({ 
          content: newContent,
          updated_at: new Date().toISOString()
        })
        .eq('key', key);

      if (error) throw error;

      // Update local state
      setContent(prev => ({
        ...prev,
        [key]: newContent
      }));

      // Update contentItems array
      setContentItems(prev => 
        prev.map(item => 
          item.key === key 
            ? { ...item, content: newContent, updated_at: new Date().toISOString() }
            : item
        )
      );

      toast.success('Content updated successfully!');
      return true;
    } catch (error) {
      console.error('Error updating content:', error);
      toast.error('Failed to update content');
      return false;
    }
  };

  const updateSetting = async (key: string, newValue: string) => {
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({ 
          value: newValue,
          updated_at: new Date().toISOString()
        })
        .eq('key', key);

      if (error) throw error;

      // Update local state
      setSettings(prev => ({
        ...prev,
        [key]: newValue
      }));

      // Update siteSettings array
      setSiteSettings(prev => 
        prev.map(setting => 
          setting.key === key 
            ? { ...setting, value: newValue, updated_at: new Date().toISOString() }
            : setting
        )
      );

      toast.success('Setting updated successfully!');
      return true;
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error('Failed to update setting');
      return false;
    }
  };

  const createContent = async (contentData: Partial<ContentItem>) => {
    try {
      const { data, error } = await supabase
        .from('content_items')
        .insert([contentData])
        .select()
        .single();

      if (error) throw error;

      await fetchAllData(); // Refresh all data
      toast.success('Content created successfully!');
      return data;
    } catch (error) {
      console.error('Error creating content:', error);
      toast.error('Failed to create content');
      return null;
    }
  };

  const deleteContent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('content_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchAllData(); // Refresh all data
      toast.success('Content deleted successfully!');
      return true;
    } catch (error) {
      console.error('Error deleting content:', error);
      toast.error('Failed to delete content');
      return false;
    }
  };

  // Team member management
  const updateTeamMember = async (id: string, data: Partial<TeamMember>) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      await fetchAllData();
      toast.success('Team member updated successfully!');
      return true;
    } catch (error) {
      console.error('Error updating team member:', error);
      toast.error('Failed to update team member');
      return false;
    }
  };

  const createTeamMember = async (data: Partial<TeamMember>) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .insert([data]);

      if (error) throw error;

      await fetchAllData();
      toast.success('Team member created successfully!');
      return true;
    } catch (error) {
      console.error('Error creating team member:', error);
      toast.error('Failed to create team member');
      return false;
    }
  };

  const deleteTeamMember = async (id: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      await fetchAllData();
      toast.success('Team member removed successfully!');
      return true;
    } catch (error) {
      console.error('Error removing team member:', error);
      toast.error('Failed to remove team member');
      return false;
    }
  };

  // Statistics management
  const updateStatistic = async (id: string, data: Partial<Statistic>) => {
    try {
      const { error } = await supabase
        .from('statistics')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      await fetchAllData();
      toast.success('Statistic updated successfully!');
      return true;
    } catch (error) {
      console.error('Error updating statistic:', error);
      toast.error('Failed to update statistic');
      return false;
    }
  };

  // Pricing plan management
  const updatePricingPlan = async (id: string, data: Partial<PricingPlan>) => {
    try {
      const { error } = await supabase
        .from('pricing_plans')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      await fetchAllData();
      toast.success('Pricing plan updated successfully!');
      return true;
    } catch (error) {
      console.error('Error updating pricing plan:', error);
      toast.error('Failed to update pricing plan');
      return false;
    }
  };

  // Pricing FAQ management
  const updatePricingFAQ = async (id: string, data: Partial<PricingFAQ>) => {
    try {
      const { error } = await supabase
        .from('pricing_faqs')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      await fetchAllData();
      toast.success('FAQ updated successfully!');
      return true;
    } catch (error) {
      console.error('Error updating FAQ:', error);
      toast.error('Failed to update FAQ');
      return false;
    }
  };

  return { 
    content, 
    settings,
    contentItems,
    siteSettings,
    teamMembers,
    statistics,
    pricingPlans,
    pricingFAQs,
    getContent, 
    getSetting,
    loading, 
    error,
    refetch: fetchAllData,
    updateContent,
    updateSetting,
    createContent,
    deleteContent,
    updateTeamMember,
    createTeamMember,
    deleteTeamMember,
    updateStatistic,
    updatePricingPlan,
    updatePricingFAQ
  };
};