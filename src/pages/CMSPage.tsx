import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useContent } from '../hooks/useContent';
import { supabase } from '../lib/supabase';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AnimatedSection from '../components/AnimatedSection';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  FileText, 
  Image, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  Upload,
  X,
  Eye,
  EyeOff,
  Users,
  BarChart3,
  DollarSign,
  HelpCircle
} from 'lucide-react';

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

interface WorkspaceType {
  id: string;
  name: string;
  description: string;
  price: number;
  price_unit: string;
  image_url?: string;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const CMSPage: React.FC = () => {
  const { user } = useAuth();
  const { 
    contentItems, 
    siteSettings, 
    teamMembers, 
    statistics, 
    pricingPlans, 
    pricingFAQs,
    updateContent, 
    updateSetting, 
    createContent, 
    deleteContent, 
    updateTeamMember,
    createTeamMember,
    deleteTeamMember,
    updateStatistic,
    updatePricingPlan,
    updatePricingFAQ,
    refetch 
  } = useContent();
  const [activeTab, setActiveTab] = useState('content');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [workspaceTypes, setWorkspaceTypes] = useState<WorkspaceType[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newContentForm, setNewContentForm] = useState({
    key: '',
    title: '',
    content: '',
    page: 'home',
    section: '',
    display_order: 0
  });
  const [showNewContentForm, setShowNewContentForm] = useState(false);
  const [showNewWorkspaceForm, setShowNewWorkspaceForm] = useState(false);
  const [newWorkspaceForm, setNewWorkspaceForm] = useState({
    name: '',
    description: '',
    price: 0,
    price_unit: 'day',
    image_url: '',
    features: ''
  });
  const [showNewTeamMemberForm, setShowNewTeamMemberForm] = useState(false);
  const [newTeamMemberForm, setNewTeamMemberForm] = useState({
    name: '',
    role: '',
    description: '',
    image_url: '',
    display_order: 0
  });
  const [showAddWorkspace, setShowAddWorkspace] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({
    name: '',
    description: '',
    price: '',
    price_unit: 'day',
    features: [''],
    image_url: ''
  });

  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    fetchWorkspaceTypes();
  }, []);

  const fetchWorkspaceTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('workspace_types')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkspaceTypes(data || []);
    } catch (error) {
      console.error('Error fetching workspace types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContent = async (item: ContentItem) => {
    try {
      const success = await updateContent(item.key, item.content);
      if (success) {
        setEditingItem(null);
        await refetch(); // Refresh all data
      }
    } catch (error) {
      console.error('Error saving content:', error);
    }
  };

  const handleSaveSetting = async (setting: SiteSetting) => {
    try {
      const success = await updateSetting(setting.key, setting.value);
      if (success) {
        setEditingItem(null);
        await refetch(); // Refresh all data
      }
    } catch (error) {
      console.error('Error saving setting:', error);
    }
  };

  const handleDeleteContent = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      try {
        const success = await deleteContent(id);
        if (success) {
          await refetch(); // Refresh all data
        }
      } catch (error) {
        console.error('Error deleting content:', error);
      }
    }
  };

  const handleCreateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const success = await createContent({
        ...newContentForm,
        is_published: true
      });
      if (success) {
        setNewContentForm({
          key: '',
          title: '',
          content: '',
          page: 'home',
          section: '',
          display_order: 0
        });
        setShowNewContentForm(false);
        await refetch(); // Refresh all data
      }
    } catch (error) {
      console.error('Error creating content:', error);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const featuresArray = newWorkspaceForm.features
        .split(',')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const { error } = await supabase
        .from('workspace_types')
        .insert([{
          name: newWorkspaceForm.name,
          description: newWorkspaceForm.description,
          price: newWorkspaceForm.price,
          price_unit: newWorkspaceForm.price_unit,
          image_url: newWorkspaceForm.image_url || null,
          features: featuresArray,
          is_active: true
        }]);

      if (error) throw error;

      await fetchWorkspaceTypes();
      setNewWorkspaceForm({
        name: '',
        description: '',
        price: 0,
        price_unit: 'day',
        image_url: '',
        features: ''
      });
      setShowNewWorkspaceForm(false);
      toast.success('Workspace created successfully!');
    } catch (error) {
      console.error('Error creating workspace:', error);
      toast.error('Failed to create workspace. Please try again.');
    }
  };

  const handleCreateTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const success = await createTeamMember(newTeamMemberForm);
      if (success) {
        setNewTeamMemberForm({
          name: '',
          role: '',
          description: '',
          image_url: '',
          display_order: 0
        });
        setShowNewTeamMemberForm(false);
      }
    } catch (error) {
      console.error('Error creating team member:', error);
    }
  };

  const handleSaveWorkspace = async (workspace: any) => {
    try {
      // Convert features string back to array
      const featuresArray = typeof workspace.features === 'string' 
        ? workspace.features.split(',').map((f: string) => f.trim()).filter((f: string) => f.length > 0)
        : workspace.features;

      const { error } = await supabase
        .from('workspace_types')
        .update({
          name: workspace.name,
          description: workspace.description,
          price: workspace.price,
          price_unit: workspace.price_unit,
          image_url: workspace.image_url,
          features: featuresArray,
          updated_at: new Date().toISOString()
        })
        .eq('id', workspace.id);

      if (error) throw error;

      await fetchWorkspaceTypes();
      setEditingItem(null);
      toast.success('Workspace saved successfully!');
    } catch (error) {
      console.error('Error saving workspace:', error);
      toast.error('Failed to save workspace. Please try again.');
    }
  };

  const handleDeleteWorkspace = async (id: string) => {
    if (window.confirm('Are you sure you want to deactivate this workspace?')) {
      try {
        const { error } = await supabase
          .from('workspace_types')
          .update({ is_active: false })
          .eq('id', id);

        if (error) throw error;

        await fetchWorkspaceTypes();
        toast.success('Workspace deactivated successfully!');
      } catch (error) {
        console.error('Error deactivating workspace:', error);
        toast.error('Failed to deactivate workspace. Please try again.');
      }
    }
  };

  const handleAddWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('workspace_types')
        .insert({
          name: newWorkspace.name,
          description: newWorkspace.description,
          price: parseFloat(newWorkspace.price),
          price_unit: newWorkspace.price_unit,
          features: newWorkspace.features.filter(f => f.trim() !== ''),
          image_url: newWorkspace.image_url || null,
          is_active: true
        });

      if (error) throw error;

      toast.success('Workspace type added successfully!');
      setShowAddWorkspace(false);
      setNewWorkspace({
        name: '',
        description: '',
        price: '',
        price_unit: 'day',
        features: [''],
        image_url: ''
      });
      fetchWorkspaceTypes();
    } catch (error) {
      console.error('Error adding workspace:', error);
      toast.error('Failed to add workspace type');
    }
  };

  const addFeatureField = () => {
    setNewWorkspace(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setNewWorkspace(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? value : f)
    }));
  };

  const removeFeature = (index: number) => {
    setNewWorkspace(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const toggleContentVisibility = async (item: ContentItem) => {
    try {
      const { error } = await supabase
        .from('content_items')
        .update({ is_published: !item.is_published })
        .eq('id', item.id);

      if (error) throw error;

      await refetch();
      toast.success(`Content ${item.is_published ? 'hidden' : 'published'} successfully!`);
    } catch (error) {
      console.error('Error toggling content visibility:', error);
      toast.error('Failed to update content visibility');
    }
  };

  // Group content by page and section
  const groupedContent = contentItems.reduce((acc, item) => {
    const pageKey = item.page;
    const sectionKey = item.section || 'general';
    
    if (!acc[pageKey]) acc[pageKey] = {};
    if (!acc[pageKey][sectionKey]) acc[pageKey][sectionKey] = [];
    
    acc[pageKey][sectionKey].push(item);
    return acc;
  }, {} as Record<string, Record<string, ContentItem[]>>);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <AnimatedSection animation="slideDown" duration={600}>
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Content Management System</h1>
                <p className="text-gray-600">Manage your website content, settings, and workspaces</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">Welcome back, {user.name}</span>
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-black font-semibold text-sm">{user.name.charAt(0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <AnimatedSection animation="slideUp" delay={200} duration={600}>
          <div className="bg-white rounded-lg shadow-sm">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('content')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'content'
                      ? 'border-yellow-500 text-yellow-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <FileText className="w-4 h-4 inline mr-2" />
                  Content ({contentItems.length})
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'settings'
                      ? 'border-yellow-500 text-yellow-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Settings className="w-4 h-4 inline mr-2" />
                  Settings ({siteSettings.length})
                </button>
                <button
                  onClick={() => setActiveTab('workspaces')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'workspaces'
                      ? 'border-yellow-500 text-yellow-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Image className="w-4 h-4 inline mr-2" />
                  Workspaces ({workspaceTypes.length})
                </button>
                <button
                  onClick={() => setActiveTab('team')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'team'
                      ? 'border-yellow-500 text-yellow-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Users className="w-4 h-4 inline mr-2" />
                  Team ({teamMembers.length})
                </button>
                <button
                  onClick={() => setActiveTab('statistics')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'statistics'
                      ? 'border-yellow-500 text-yellow-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 inline mr-2" />
                  Statistics ({statistics.length})
                </button>
                <button
                  onClick={() => setActiveTab('pricing')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'pricing'
                      ? 'border-yellow-500 text-yellow-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <DollarSign className="w-4 h-4 inline mr-2" />
                  Pricing ({pricingPlans.length + pricingFAQs.length})
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'content' && (
                <AnimatedSection animation="fadeIn" duration={400}>
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-medium text-gray-900">Website Content</h3>
                      <button 
                        onClick={() => setShowNewContentForm(!showNewContentForm)}
                        className="bg-yellow-500 text-black px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors flex items-center"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Content
                      </button>
                    </div>

                    {/* New Content Form */}
                    {showNewContentForm && (
                      <AnimatedSection animation="slideDown" duration={400}>
                        <div className="bg-gray-50 rounded-lg p-6 mb-6">
                          <h4 className="text-lg font-semibold mb-4">Create New Content</h4>
                          <form onSubmit={handleCreateContent} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <input
                                type="text"
                                placeholder="Content Key (e.g., hero_title)"
                                value={newContentForm.key}
                                onChange={(e) => setNewContentForm({...newContentForm, key: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                required
                              />
                              <input
                                type="text"
                                placeholder="Title"
                                value={newContentForm.title}
                                onChange={(e) => setNewContentForm({...newContentForm, title: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                required
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <select
                                value={newContentForm.page}
                                onChange={(e) => setNewContentForm({...newContentForm, page: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                              >
                                <option value="home">Home</option>
                                <option value="about">About</option>
                                <option value="contact">Contact</option>
                                <option value="pricing">Pricing</option>
                                <option value="booking">Booking</option>
                              </select>
                              <input
                                type="text"
                                placeholder="Section (optional)"
                                value={newContentForm.section}
                                onChange={(e) => setNewContentForm({...newContentForm, section: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                              />
                              <input
                                type="number"
                                placeholder="Display Order"
                                value={newContentForm.display_order}
                                onChange={(e) => setNewContentForm({...newContentForm, display_order: parseInt(e.target.value)})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                              />
                            </div>
                            <textarea
                              placeholder="Content"
                              value={newContentForm.content}
                              onChange={(e) => setNewContentForm({...newContentForm, content: e.target.value})}
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                              required
                            />
                            <div className="flex space-x-2">
                              <button
                                type="submit"
                                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
                              >
                                Create Content
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowNewContentForm(false)}
                                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                      </AnimatedSection>
                    )}

                    {/* Content Items by Page */}
                    <div className="space-y-6">
                      {Object.entries(groupedContent).map(([page, sections]) => (
                        <AnimatedSection key={page} animation="slideUp" delay={100} duration={500}>
                          <div className="border border-gray-200 rounded-lg">
                            <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                              <h4 className="font-semibold text-gray-900 capitalize">{page} Page</h4>
                            </div>
                            <div className="p-4 space-y-4">
                              {Object.entries(sections).map(([section, items]) => (
                                <div key={section}>
                                  <h5 className="font-medium text-gray-700 mb-2 capitalize">{section} Section</h5>
                                  <div className="space-y-2">
                                    {items.map((item) => (
                                      <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                                        {editingItem?.id === item.id ? (
                                          <div className="space-y-4">
                                            <input
                                              type="text"
                                              value={editingItem.title}
                                              onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                            />
                                            <textarea
                                              value={editingItem.content}
                                              onChange={(e) => setEditingItem({...editingItem, content: e.target.value})}
                                              rows={4}
                                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                            />
                                            <div className="flex space-x-2">
                                              <button
                                                onClick={() => handleSaveContent(editingItem)}
                                                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors flex items-center"
                                              >
                                                <Save className="w-4 h-4 mr-2" />
                                                Save
                                              </button>
                                              <button
                                                onClick={() => setEditingItem(null)}
                                                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                                              >
                                                Cancel
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                              <div className="flex items-center space-x-2 mb-1">
                                                <h6 className="font-semibold text-gray-900">{item.title}</h6>
                                                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                                                  {item.key}
                                                </span>
                                                {!item.is_published && (
                                                  <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                                                    Hidden
                                                  </span>
                                                )}
                                              </div>
                                              <p className="text-gray-600 text-sm">{item.content}</p>
                                              <p className="text-xs text-gray-500 mt-2">
                                                Last modified: {new Date(item.updated_at).toLocaleDateString()}
                                              </p>
                                            </div>
                                            <div className="flex space-x-2 ml-4">
                                              <button
                                                onClick={() => toggleContentVisibility(item)}
                                                className={`${item.is_published ? 'text-green-600 hover:text-green-900' : 'text-gray-400 hover:text-gray-600'}`}
                                                title={item.is_published ? 'Hide content' : 'Publish content'}
                                              >
                                                {item.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                              </button>
                                              <button
                                                onClick={() => setEditingItem(item)}
                                                className="text-blue-600 hover:text-blue-900"
                                              >
                                                <Edit className="w-4 h-4" />
                                              </button>
                                              <button
                                                onClick={() => handleDeleteContent(item.id)}
                                                className="text-red-600 hover:text-red-900"
                                              >
                                                <Trash2 className="w-4 h-4" />
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </AnimatedSection>
                      ))}
                    </div>
                  </div>
                </AnimatedSection>
              )}

              {activeTab === 'settings' && (
                <AnimatedSection animation="fadeIn" duration={400}>
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-medium text-gray-900">Site Settings</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {siteSettings.map((setting) => (
                        <AnimatedSection key={setting.id} animation="slideUp" delay={50} duration={400}>
                          <div className="bg-gray-50 rounded-lg p-4">
                            {editingItem?.id === setting.id ? (
                              <div className="space-y-4">
                                <label className="block text-sm font-medium text-gray-700">
                                  {setting.description || setting.key}
                                </label>
                                <input
                                  type={setting.setting_type === 'number' ? 'number' : 
                                        setting.setting_type === 'url' ? 'url' :
                                        setting.setting_type === 'color' ? 'color' : 'text'}
                                  value={editingItem.value}
                                  onChange={(e) => setEditingItem({...editingItem, value: e.target.value})}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                />
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleSaveSetting(editingItem)}
                                    className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors flex items-center"
                                  >
                                    <Save className="w-4 h-4 mr-2" />
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingItem(null)}
                                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-semibold text-gray-900">{setting.description || setting.key}</h4>
                                  <p className="text-gray-600 mt-1">{setting.value}</p>
                                  <p className="text-xs text-gray-500 mt-2">
                                    Type: {setting.setting_type} | Key: {setting.key}
                                  </p>
                                </div>
                                <button
                                  onClick={() => setEditingItem(setting)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </AnimatedSection>
                      ))}
                    </div>
                  </div>
                </AnimatedSection>
              )}

              {activeTab === 'workspaces' && (
                <AnimatedSection animation="fadeIn" duration={400}>
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-medium text-gray-900">Workspace Types</h3>
                      <button
                        onClick={() => setShowAddWorkspace(true)}
                        className="bg-yellow-500 text-black px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors flex items-center"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Workspace
                      </button>
                    </div>

                    {/* Add Workspace Modal */}
                    {showAddWorkspace && (
                      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                          <h4 className="text-lg font-semibold mb-4">Add New Workspace Type</h4>
                          <form onSubmit={handleAddWorkspace} className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                              <input
                                type="text"
                                value={newWorkspace.name}
                                onChange={(e) => setNewWorkspace(prev => ({ ...prev, name: e.target.value }))}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                              <textarea
                                value={newWorkspace.description}
                                onChange={(e) => setNewWorkspace(prev => ({ ...prev, description: e.target.value }))}
                                required
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={newWorkspace.price}
                                  onChange={(e) => setNewWorkspace(prev => ({ ...prev, price: e.target.value }))}
                                  required
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Price Unit</label>
                                <select
                                  value={newWorkspace.price_unit}
                                  onChange={(e) => setNewWorkspace(prev => ({ ...prev, price_unit: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                >
                                  <option value="hour">per hour</option>
                                  <option value="day">per day</option>
                                  <option value="week">per week</option>
                                  <option value="month">per month</option>
                                </select>
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (optional)</label>
                              <input
                                type="url"
                                value={newWorkspace.image_url}
                                onChange={(e) => setNewWorkspace(prev => ({ ...prev, image_url: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Features</label>
                              {newWorkspace.features.map((feature, index) => (
                                <div key={index} className="flex gap-2 mb-2">
                                  <input
                                    type="text"
                                    value={feature}
                                    onChange={(e) => updateFeature(index, e.target.value)}
                                    placeholder="Enter feature"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                  />
                                  {newWorkspace.features.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeFeature(index)}
                                      className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={addFeatureField}
                                className="text-yellow-600 hover:text-yellow-700 text-sm"
                              >
                                + Add Feature
                              </button>
                            </div>
                            
                            <div className="flex gap-3 pt-4">
                              <button
                                type="submit"
                                className="flex-1 bg-yellow-500 text-black py-2 px-4 rounded-md hover:bg-yellow-600 transition-colors"
                              >
                                Add Workspace
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowAddWorkspace(false)}
                                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}

                    {/* New Workspace Form */}
                    {showNewWorkspaceForm && (
                      <AnimatedSection animation="slideDown" duration={400}>
                        <div className="bg-gray-50 rounded-lg p-6 mb-6">
                          <h4 className="text-lg font-semibold mb-4">Create New Workspace</h4>
                          <form onSubmit={handleCreateWorkspace} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <input
                                type="text"
                                placeholder="Workspace Name"
                                value={newWorkspaceForm.name}
                                onChange={(e) => setNewWorkspaceForm({...newWorkspaceForm, name: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                required
                              />
                              <input
                                type="number"
                                placeholder="Price"
                                value={newWorkspaceForm.price}
                                onChange={(e) => setNewWorkspaceForm({...newWorkspaceForm, price: parseFloat(e.target.value)})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                required
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <select
                                value={newWorkspaceForm.price_unit}
                                onChange={(e) => setNewWorkspaceForm({...newWorkspaceForm, price_unit: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                              >
                                <option value="hour">per hour</option>
                                <option value="day">per day</option>
                                <option value="week">per week</option>
                                <option value="month">per month</option>
                              </select>
                              <input
                                type="url"
                                placeholder="Image URL (optional)"
                                value={newWorkspaceForm.image_url}
                                onChange={(e) => setNewWorkspaceForm({...newWorkspaceForm, image_url: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                              />
                            </div>
                            <textarea
                              placeholder="Description"
                              value={newWorkspaceForm.description}
                              onChange={(e) => setNewWorkspaceForm({...newWorkspaceForm, description: e.target.value})}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                              required
                            />
                            <textarea
                              placeholder="Features (comma-separated)"
                              value={newWorkspaceForm.features}
                              onChange={(e) => setNewWorkspaceForm({...newWorkspaceForm, features: e.target.value})}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            />
                            <div className="flex space-x-2">
                              <button
                                type="submit"
                                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
                              >
                                Create Workspace
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowNewWorkspaceForm(false)}
                                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                      </AnimatedSection>
                    )}

                    {loading ? (
                      <LoadingSpinner text="Loading workspaces..." />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {workspaceTypes.map((workspace, index) => (
                          <AnimatedSection key={workspace.id} animation="slideUp" delay={index * 100} duration={500}>
                            <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                              {workspace.image_url ? (
                                <img 
                                  src={workspace.image_url} 
                                  alt={workspace.name}
                                  className="h-48 w-full object-cover"
                                />
                              ) : (
                                <div className="h-48 bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center">
                                  <span className="text-black font-semibold">No Image</span>
                                </div>
                              )}
                              <div className="p-4">
                                {editingItem?.id === workspace.id ? (
                                  <div className="space-y-4">
                                    <input
                                      type="text"
                                      value={editingItem.name}
                                      onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                                      placeholder="Workspace name"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    />
                                    <textarea
                                      value={editingItem.description}
                                      onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                                      placeholder="Description"
                                      rows={3}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                      <input
                                        type="number"
                                        value={editingItem.price}
                                        onChange={(e) => setEditingItem({...editingItem, price: parseFloat(e.target.value)})}
                                        placeholder="Price"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                      />
                                      <select
                                        value={editingItem.price_unit}
                                        onChange={(e) => setEditingItem({...editingItem, price_unit: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                      >
                                        <option value="hour">per hour</option>
                                        <option value="day">per day</option>
                                        <option value="week">per week</option>
                                        <option value="month">per month</option>
                                      </select>
                                    </div>
                                    <input
                                      type="url"
                                      value={editingItem.image_url || ''}
                                      onChange={(e) => setEditingItem({...editingItem, image_url: e.target.value})}
                                      placeholder="Image URL"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    />
                                    <textarea
                                      value={Array.isArray(editingItem.features) ? editingItem.features.join(', ') : editingItem.features}
                                      onChange={(e) => setEditingItem({...editingItem, features: e.target.value})}
                                      placeholder="Features (comma-separated)"
                                      rows={2}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    />
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={() => handleSaveWorkspace(editingItem)}
                                        className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors flex items-center"
                                      >
                                        <Save className="w-4 h-4 mr-2" />
                                        Save
                                      </button>
                                      <button
                                        onClick={() => setEditingItem(null)}
                                        className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <h4 className="font-semibold text-gray-900">{workspace.name}</h4>
                                    <p className="text-gray-600 text-sm mt-1">{workspace.description}</p>
                                    <p className="text-yellow-600 font-bold mt-2">E£{workspace.price}/{workspace.price_unit}</p>
                                    <div className="mt-3">
                                      <p className="text-sm text-gray-500 mb-1">Features:</p>
                                      <ul className="text-sm text-gray-600">
                                        {workspace.features.slice(0, 3).map((feature, index) => (
                                          <li key={index}>• {feature}</li>
                                        ))}
                                        {workspace.features.length > 3 && (
                                          <li className="text-gray-400">+ {workspace.features.length - 3} more</li>
                                        )}
                                      </ul>
                                    </div>
                                    <div className="flex justify-between items-center mt-4">
                                      <button
                                        onClick={() => setEditingItem({
                                          ...workspace,
                                          features: workspace.features.join(', ')
                                        })}
                                        className="text-blue-600 hover:text-blue-900 flex items-center"
                                      >
                                        <Edit className="w-4 h-4 mr-1" />
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteWorkspace(workspace.id)}
                                        className="text-red-600 hover:text-red-900 flex items-center"
                                      >
                                        <Trash2 className="w-4 h-4 mr-1" />
                                        Deactivate
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </AnimatedSection>
                        ))}
                      </div>
                    )}
                  </div>
                </AnimatedSection>
              )}

              {activeTab === 'team' && (
                <AnimatedSection animation="fadeIn" duration={400}>
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-medium text-gray-900">Team Members</h3>
                      <button 
                        onClick={() => setShowNewTeamMemberForm(!showNewTeamMemberForm)}
                        className="bg-yellow-500 text-black px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors flex items-center"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Team Member
                      </button>
                    </div>

                    {/* New Team Member Form */}
                    {showNewTeamMemberForm && (
                      <AnimatedSection animation="slideDown" duration={400}>
                        <div className="bg-gray-50 rounded-lg p-6 mb-6">
                          <h4 className="text-lg font-semibold mb-4">Add New Team Member</h4>
                          <form onSubmit={handleCreateTeamMember} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <input
                                type="text"
                                placeholder="Full Name"
                                value={newTeamMemberForm.name}
                                onChange={(e) => setNewTeamMemberForm({...newTeamMemberForm, name: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                required
                              />
                              <input
                                type="text"
                                placeholder="Role/Position"
                                value={newTeamMemberForm.role}
                                onChange={(e) => setNewTeamMemberForm({...newTeamMemberForm, role: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                required
                              />
                            </div>
                            <input
                              type="url"
                              placeholder="Image URL (optional)"
                              value={newTeamMemberForm.image_url}
                              onChange={(e) => setNewTeamMemberForm({...newTeamMemberForm, image_url: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            />
                            <textarea
                              placeholder="Description"
                              value={newTeamMemberForm.description}
                              onChange={(e) => setNewTeamMemberForm({...newTeamMemberForm, description: e.target.value})}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                              required
                            />
                            <input
                              type="number"
                              placeholder="Display Order"
                              value={newTeamMemberForm.display_order}
                              onChange={(e) => setNewTeamMemberForm({...newTeamMemberForm, display_order: parseInt(e.target.value)})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            />
                            <div className="flex space-x-2">
                              <button
                                type="submit"
                                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
                              >
                                Add Team Member
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowNewTeamMemberForm(false)}
                                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                      </AnimatedSection>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {teamMembers.map((member, index) => (
                        <AnimatedSection key={member.id} animation="slideUp" delay={index * 100} duration={500}>
                          <div className="bg-white rounded-lg shadow-sm p-6">
                            {editingItem?.id === member.id ? (
                              <div className="space-y-4">
                                <input
                                  type="text"
                                  value={editingItem.name}
                                  onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                                  placeholder="Name"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                />
                                <input
                                  type="text"
                                  value={editingItem.role}
                                  onChange={(e) => setEditingItem({...editingItem, role: e.target.value})}
                                  placeholder="Role"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                />
                                <input
                                  type="url"
                                  value={editingItem.image_url || ''}
                                  onChange={(e) => setEditingItem({...editingItem, image_url: e.target.value})}
                                  placeholder="Image URL"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                />
                                <textarea
                                  value={editingItem.description}
                                  onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                                  placeholder="Description"
                                  rows={3}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                />
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => updateTeamMember(editingItem.id, editingItem).then(() => setEditingItem(null))}
                                    className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors flex items-center"
                                  >
                                    <Save className="w-4 h-4 mr-2" />
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingItem(null)}
                                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="text-center mb-4">
                                  <div className="w-20 h-20 rounded-full mx-auto mb-3 overflow-hidden">
                                    {member.image_url ? (
                                      <img 
                                        src={member.image_url} 
                                        alt={member.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center">
                                        <span className="text-black font-bold text-lg">{member.name.charAt(0)}</span>
                                      </div>
                                    )}
                                  </div>
                                  <h4 className="font-semibold text-gray-900">{member.name}</h4>
                                  <p className="text-gray-600 text-sm">{member.role}</p>
                                </div>
                                <p className="text-gray-600 text-sm mb-4">{member.description}</p>
                                <div className="flex justify-between items-center">
                                  <button
                                    onClick={() => setEditingItem(member)}
                                    className="text-blue-600 hover:text-blue-900 flex items-center"
                                  >
                                    <Edit className="w-4 h-4 mr-1" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => deleteTeamMember(member.id)}
                                    className="text-red-600 hover:text-red-900 flex items-center"
                                  >
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Remove
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </AnimatedSection>
                      ))}
                    </div>
                  </div>
                </AnimatedSection>
              )}

              {activeTab === 'statistics' && (
                <AnimatedSection animation="fadeIn" duration={400}>
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-medium text-gray-900">Homepage Statistics</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {statistics.map((stat, index) => (
                        <AnimatedSection key={stat.id} animation="slideUp" delay={index * 100} duration={500}>
                          <div className="bg-white rounded-lg shadow-sm p-6">
                            {editingItem?.id === stat.id ? (
                              <div className="space-y-4">
                                <input
                                  type="text"
                                  value={editingItem.label}
                                  onChange={(e) => setEditingItem({...editingItem, label: e.target.value})}
                                  placeholder="Label"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                />
                                <input
                                  type="text"
                                  value={editingItem.value}
                                  onChange={(e) => setEditingItem({...editingItem, value: e.target.value})}
                                  placeholder="Value"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                />
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => updateStatistic(editingItem.id, editingItem).then(() => setEditingItem(null))}
                                    className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors flex items-center"
                                  >
                                    <Save className="w-4 h-4 mr-2" />
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingItem(null)}
                                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="text-center">
                                  <div className="text-3xl font-bold text-yellow-500 mb-2">{stat.value}</div>
                                  <p className="text-gray-600">{stat.label}</p>
                                </div>
                                <div className="flex justify-center mt-4">
                                  <button
                                    onClick={() => setEditingItem(stat)}
                                    className="text-blue-600 hover:text-blue-900 flex items-center"
                                  >
                                    <Edit className="w-4 h-4 mr-1" />
                                    Edit
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </AnimatedSection>
                      ))}
                    </div>
                  </div>
                </AnimatedSection>
              )}

              {activeTab === 'pricing' && (
                <AnimatedSection animation="fadeIn" duration={400}>
                  <div>
                    <div className="mb-8">
                      <h3 className="text-lg font-medium text-gray-900 mb-6">Pricing Plans</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pricingPlans.map((plan, index) => (
                          <AnimatedSection key={plan.id} animation="slideUp" delay={index * 100} duration={500}>
                            <div className="bg-white rounded-lg shadow-sm p-6">
                              {editingItem?.id === plan.id ? (
                                <div className="space-y-4">
                                  <input
                                    type="text"
                                    value={editingItem.name}
                                    onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                                    placeholder="Plan Name"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                  />
                                  <div className="grid grid-cols-2 gap-2">
                                    <input
                                      type="text"
                                      value={editingItem.price}
                                      onChange={(e) => setEditingItem({...editingItem, price: e.target.value})}
                                      placeholder="Price"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    />
                                    <input
                                      type="text"
                                      value={editingItem.period}
                                      onChange={(e) => setEditingItem({...editingItem, period: e.target.value})}
                                      placeholder="Period"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    />
                                  </div>
                                  <textarea
                                    value={editingItem.description}
                                    onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                                    placeholder="Description"
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                  />
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => updatePricingPlan(editingItem.id, editingItem).then(() => setEditingItem(null))}
                                      className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors flex items-center"
                                    >
                                      <Save className="w-4 h-4 mr-2" />
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingItem(null)}
                                      className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="mb-4">
                                    <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                                    <p className="text-2xl font-bold text-yellow-600">{plan.price} {plan.period}</p>
                                    <p className="text-gray-600 text-sm mt-1">{plan.description}</p>
                                    {plan.is_popular && (
                                      <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded mt-2">
                                        Most Popular
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex justify-center">
                                    <button
                                      onClick={() => setEditingItem(plan)}
                                      className="text-blue-600 hover:text-blue-900 flex items-center"
                                    >
                                      <Edit className="w-4 h-4 mr-1" />
                                      Edit
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </AnimatedSection>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-6">Pricing FAQs</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {pricingFAQs.map((faq, index) => (
                          <AnimatedSection key={faq.id} animation="slideUp" delay={index * 100} duration={500}>
                            <div className="bg-white rounded-lg shadow-sm p-6">
                              {editingItem?.id === faq.id ? (
                                <div className="space-y-4">
                                  <input
                                    type="text"
                                    value={editingItem.question}
                                    onChange={(e) => setEditingItem({...editingItem, question: e.target.value})}
                                    placeholder="Question"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                  />
                                  <textarea
                                    value={editingItem.answer}
                                    onChange={(e) => setEditingItem({...editingItem, answer: e.target.value})}
                                    placeholder="Answer"
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                  />
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => updatePricingFAQ(editingItem.id, editingItem).then(() => setEditingItem(null))}
                                      className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors flex items-center"
                                    >
                                      <Save className="w-4 h-4 mr-2" />
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingItem(null)}
                                      className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <h4 className="font-semibold text-gray-900 mb-2">{faq.question}</h4>
                                  <p className="text-gray-600 text-sm mb-4">{faq.answer}</p>
                                  <div className="flex justify-center">
                                    <button
                                      onClick={() => setEditingItem(faq)}
                                      className="text-blue-600 hover:text-blue-900 flex items-center"
                                    >
                                      <Edit className="w-4 h-4 mr-1" />
                                      Edit
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </AnimatedSection>
                        ))}
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              )}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
};

export default CMSPage;