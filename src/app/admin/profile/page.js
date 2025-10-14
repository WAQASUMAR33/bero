'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Notification from '../components/Notification';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNo: '',
    username: '',
    role: '',
    employeeNumber: '',
    startDate: '',
    leaveDate: '',
    region: '',
    postalCode: '',
    emergencyName: '',
    emergencyContact: '',
    contractedHours: '',
    status: '',
    niNumber: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
  };

  const hideNotification = () => {
    setNotification({ show: false, message: '', type: 'success' });
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setProfileData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phoneNo: userData.phoneNo || '',
        username: userData.username || '',
        role: userData.role || '',
        employeeNumber: userData.employeeNumber || '',
        startDate: userData.startDate ? new Date(userData.startDate).toISOString().split('T')[0] : '',
        leaveDate: userData.leaveDate ? new Date(userData.leaveDate).toISOString().split('T')[0] : '',
        region: userData.region?.title || '',
        postalCode: userData.postalCode || '',
        emergencyName: userData.emergencyName || '',
        emergencyContact: userData.emergencyContact || '',
        contractedHours: userData.contractedHours?.toString() || '',
        status: userData.status || '',
        niNumber: userData.niNumber || ''
      });
    } else {
      router.push('/login');
    }
    setIsLoading(false);
  }, [router]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local storage
      const updatedUser = { ...user, ...profileData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      setIsEditing(false);
      showNotification('Profile updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      showNotification('Error updating profile. Please try again.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showNotification('New passwords do not match', 'error');
      return;
    }
    
    setIsUpdating(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setIsChangingPassword(false);
      showNotification('Password changed successfully!', 'success');
    } catch (error) {
      console.error('Error changing password:', error);
      showNotification('Error changing password. Please try again.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: '👤' },
    { id: 'security', name: 'Security', icon: '🔒' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#224fa6]"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col lg:ml-64">
        <Header user={user} />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
                <p className="text-gray-600">Manage your personal information and account preferences</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Settings</h3>
                <nav className="space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white shadow-lg'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-[#224fa6]'
                      }`}
                    >
                      <span className="text-xl">{tab.icon}</span>
                      <span className="font-medium">{tab.name}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-lg border border-gray-100">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Personal Information</h2>
                        <p className="text-gray-600">Update your personal details and contact information</p>
                      </div>
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
                      </button>
                    </div>

                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                      {/* Profile Picture */}
                      <div className="flex items-center space-x-6">
                        <div className="w-24 h-24 bg-gradient-to-r from-[#224fa6] to-[#3270e9] rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-2xl">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{user.firstName} {user.lastName}</h3>
                          <p className="text-gray-600">{user?.role?.displayName || user?.role?.name || 'User'}</p>
                          {isEditing && (
                            <button type="button" className="mt-2 text-[#224fa6] hover:text-[#3270e9] text-sm font-medium">
                              Change Photo
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                          <input
                            type="text"
                            value={profileData.firstName}
                            disabled
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                          <input
                            type="text"
                            value={profileData.lastName}
                            disabled
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                          <input
                            type="email"
                            value={profileData.email}
                            disabled
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                          <input
                            type="tel"
                            value={profileData.phoneNo}
                            onChange={(e) => setProfileData({...profileData, phoneNo: e.target.value})}
                            disabled={!isEditing}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 placeholder-gray-500 transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                          <input
                            type="text"
                            value={profileData.username}
                            disabled
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                          <input
                            type="text"
                            value={profileData.role}
                            disabled
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                          />
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-6 mt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Employment Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Employee Number</label>
                            <input
                              type="text"
                              value={profileData.employeeNumber}
                              disabled
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                            <input
                              type="text"
                              value={profileData.status}
                              disabled
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                            <input
                              type="date"
                              value={profileData.startDate}
                              disabled
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Leave Date</label>
                            <input
                              type="date"
                              value={profileData.leaveDate}
                              disabled
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Contracted Hours</label>
                            <input
                              type="text"
                              value={profileData.contractedHours}
                              disabled
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Region</label>
                            <input
                              type="text"
                              value={profileData.region}
                              disabled
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">NI Number</label>
                            <input
                              type="text"
                              value={profileData.niNumber}
                              disabled
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-6 mt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Emergency Contact Name</label>
                            <input
                              type="text"
                              value={profileData.emergencyName}
                              onChange={(e) => setProfileData({...profileData, emergencyName: e.target.value})}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 placeholder-gray-500 transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Emergency Contact Number</label>
                            <input
                              type="tel"
                              value={profileData.emergencyContact}
                              onChange={(e) => setProfileData({...profileData, emergencyContact: e.target.value})}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 placeholder-gray-500 transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Postal Code</label>
                            <input
                              type="text"
                              value={profileData.postalCode}
                              onChange={(e) => setProfileData({...profileData, postalCode: e.target.value})}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 placeholder-gray-500 transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500"
                            />
                          </div>
                        </div>
                      </div>

                      {isEditing && (
                        <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
                          <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isUpdating}
                            className="px-8 py-3 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isUpdating ? 'Updating...' : 'Save Changes'}
                          </button>
                        </div>
                      )}
                    </form>
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <div className="p-8">
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Security Settings</h2>
                      <p className="text-gray-600">Manage your password and security preferences</p>
                    </div>

                    <div className="space-y-6">
                      {/* Change Password */}
                      <div className="border border-gray-200 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Password</h3>
                            <p className="text-sm text-gray-600">Update your password to keep your account secure</p>
                          </div>
                          <button
                            onClick={() => setIsChangingPassword(!isChangingPassword)}
                            className="text-[#224fa6] hover:text-[#3270e9] font-medium"
                          >
                            {isChangingPassword ? 'Cancel' : 'Change Password'}
                          </button>
                        </div>

                        {isChangingPassword && (
                          <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
                              <input
                                type="password"
                                required
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 placeholder-gray-500 transition-all duration-200"
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                                <input
                                  type="password"
                                  required
                                  value={passwordData.newPassword}
                                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 placeholder-gray-500 transition-all duration-200"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                                <input
                                  type="password"
                                  required
                                  value={passwordData.confirmPassword}
                                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-white text-gray-900 placeholder-gray-500 transition-all duration-200"
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-end space-x-4 pt-4">
                              <button
                                type="button"
                                onClick={() => setIsChangingPassword(false)}
                                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={isUpdating}
                                className="px-8 py-3 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isUpdating ? 'Updating...' : 'Update Password'}
                              </button>
                            </div>
                          </form>
                        )}
                      </div>

                      {/* Two-Factor Authentication */}
                      <div className="border border-gray-200 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h3>
                            <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#224fa6]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#224fa6]"></div>
                          </label>
                        </div>
                      </div>

                      {/* Login History */}
                      <div className="border border-gray-200 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Login Activity</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between py-2">
                            <div>
                              <p className="text-sm font-medium text-gray-900">Current Session</p>
                              <p className="text-xs text-gray-500">Now • London, UK</p>
                            </div>
                            <span className="text-green-600 text-xs font-medium">Active</span>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <div>
                              <p className="text-sm font-medium text-gray-900">Previous Session</p>
                              <p className="text-xs text-gray-500">Yesterday • London, UK</p>
                            </div>
                            <span className="text-gray-500 text-xs font-medium">Ended</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Notification Component */}
      <Notification
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={hideNotification}
      />
    </div>
  );
}