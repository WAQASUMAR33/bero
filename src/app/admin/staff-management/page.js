'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Notification from '../components/Notification';
import FileUpload from '../components/FileUpload';
import PermissionMatrix from '../components/PermissionMatrix';
import { hasPermission } from '@/lib/permissions';

export default function StaffManagementPage() {
  const [user, setUser] = useState(null);
  const [staff, setStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [currentStep, setCurrentStep] = useState(1);
  const [activeTableView, setActiveTableView] = useState('overview'); // 'overview' | 'driving' | 'compliance'
  const [editActiveTab, setEditActiveTab] = useState('personal'); // 'personal' | 'employment' | 'compliance' | 'driving' | 'health' | 'permissions'
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [staffToArchive, setStaffToArchive] = useState(null);
  const [showArchivedView, setShowArchivedView] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // Compliance Status Helpers
  const getDbsStatus = (dateStr) => {
    if (!dateStr) return { status: 'none', label: 'Not Set', color: 'gray', badge: 'bg-gray-100 text-gray-600 border-gray-200' };
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return { status: 'none', label: 'Invalid Date', color: 'gray', badge: 'bg-gray-100 text-gray-600 border-gray-200' };
    
    // DBS checks expire 3 years from check date
    const expiry = new Date(date);
    expiry.setFullYear(expiry.getFullYear() + 3);
    
    // 6 months before expiry
    const warningDate = new Date(expiry);
    warningDate.setMonth(warningDate.getMonth() - 6);
    
    const now = new Date();
    
    if (now >= expiry) {
      return { 
        status: 'expired', 
        label: 'Expired (3+ Yrs)', 
        color: 'red', 
        badge: 'bg-red-50 text-red-700 border-red-200 ring-1 ring-red-200 font-semibold',
        expiryDate: expiry.toLocaleDateString()
      };
    }
    if (now >= warningDate) {
      return { 
        status: 'expiring', 
        label: 'Expires in < 6 Mos', 
        color: 'amber', 
        badge: 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-200 font-semibold',
        expiryDate: expiry.toLocaleDateString()
      };
    }
    return { 
      status: 'valid', 
      label: 'In Date', 
      color: 'green', 
      badge: 'bg-green-50 text-green-700 border-green-200 ring-1 ring-green-200 font-semibold',
      expiryDate: expiry.toLocaleDateString()
    };
  };

  const getVisaStatus = (dateStr, sponsorship) => {
    if (!dateStr) {
      if (['British Citizen', 'Irish Citizen', 'Settled Status (ILR)'].includes(sponsorship)) {
        return { status: 'na', label: 'Not Required', color: 'gray', badge: 'bg-gray-100 text-gray-500 border-gray-200' };
      }
      return { status: 'none', label: 'Not Set', color: 'gray', badge: 'bg-gray-100 text-gray-500 border-gray-200' };
    }
    const expiry = new Date(dateStr);
    if (isNaN(expiry.getTime())) return { status: 'none', label: 'Invalid Date', color: 'gray', badge: 'bg-gray-100 text-gray-500 border-gray-200' };
    
    // 3 months before expiry
    const warningDate = new Date(expiry);
    warningDate.setMonth(warningDate.getMonth() - 3);
    
    const now = new Date();
    
    if (now >= expiry) {
      return { 
        status: 'expired', 
        label: 'Expired', 
        color: 'red', 
        badge: 'bg-red-50 text-red-700 border-red-200 ring-1 ring-red-200 font-semibold',
        expiryDate: expiry.toLocaleDateString()
      };
    }
    if (now >= warningDate) {
      return { 
        status: 'expiring', 
        label: 'Expires in < 3 Mos', 
        color: 'amber', 
        badge: 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-200 font-semibold',
        expiryDate: expiry.toLocaleDateString()
      };
    }
    return { 
      status: 'valid', 
      label: 'In Date', 
      color: 'green', 
      badge: 'bg-green-50 text-green-700 border-green-200 ring-1 ring-green-200 font-semibold',
      expiryDate: expiry.toLocaleDateString()
    };
  };

  const initialFormData = {
    // Step 1: Personal & Contact Info
    email: '',
    username: '',
    firstName: '',
    lastName: '',
    password: '',
    phoneNo: '',
    secondaryPhone: '',
    consentToEmail: false,
    dob: '',
    address: '',
    postalCode: '',
    niNumber: '',
    profilePic: '',

    // Step 2: Employment & Compensation
    employeeNumber: '',
    roleId: '',
    regionId: '',
    status: 'CURRENT',
    startDate: '',
    leaveDate: '',
    reasonForLeaving: '',
    contractedHours: '',
    rateOfPay: '',
    salary: '',
    sleepingNights: false,
    costForSleepingNights: '',

    // Step 3: Compliance & Right to Work
    dbsDate: '',
    dbsUpdateCode: '',
    sponsorshipStatus: '',
    shareCode: '',
    visaExpiryDate: '',

    // Step 4: Driving Details
    drivingLicenceValid: false,
    ownCar: false,
    carMake: '',
    carModel: '',
    carColour: '',
    carRegistration: '',
    carInsuranceVerified: false,
    businessInsurance: false,

    // Step 5: Next of Kin, Health & Access
    emergencyName: '',
    nokRelationship: '',
    emergencyContact: '',
    gpDetails: '',
    allergyStatus: 'None',
    allergies: '',
    vaccinationStatus: '',
    paysForPrescriptions: false,
    permissions: []
  };

  const [formData, setFormData] = useState(initialFormData);

  const DEFAULT_ROLES = [
    { id: 1, name: 'ADMIN', displayName: 'Administrator' },
    { id: 2, name: 'CAREWORKER', displayName: 'Care Worker' },
    { id: 3, name: 'DIRECTOR', displayName: 'Director' },
    { id: 4, name: 'HR', displayName: 'HR' },
    { id: 5, name: 'REGISTER_MANAGER', displayName: 'Register Manager' },
    { id: 6, name: 'SUPPORT_WORKER', displayName: 'Support Worker' },
    { id: 9, name: 'BUSINESS_DEVELOPMENT_MANAGER', displayName: 'BDM' },
    { id: 10, name: 'DEPUTY_MANAGER', displayName: 'Deputy' },
    { id: 11, name: 'SERVICE_LEAD', displayName: 'Service Lead' },
    { id: 12, name: 'CARE_TAKER', displayName: 'Care Taker' }
  ];

  const [regions, setRegions] = useState([]);
  const [roles, setRoles] = useState(DEFAULT_ROLES);

  const allPermissions = [
    'dashboard.view',
    'users.manage',
    'staff.manage',
    'service-users.manage',
    'shifts.manage',
    'daily-tasks.manage',
    'documents.manage',
    'regions.manage',
    'finance.manage',
    'reports.view',
    'settings.manage',
    'roles.manage',
    'audit.view',
    'calendar.manage',
    'clock-in-out.manage',
    'cqc-inspection.manage',
    'quality-assurance.manage',
    'holidays.manage',
    'handovers.manage',
    'maintenance.manage',
    'agenda.manage',
    'setup.manage',
    'incidents.manage',
    'handovers.manage',
    'handovers.view',
    'rota.manage',
    'rota.view',
    'care-plan.manage',
    'policy-procedures.manage',
    'profile.view'
  ];


  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
  };

  const hideNotification = () => {
    setNotification({ show: false, message: '', type: 'success' });
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      fetchStaff();
      fetchRegions();
      fetchRoles();
    } else {
      router.push('/login');
    }
  }, [router]);

  const fetchRegions = async () => {
    try {
      const response = await fetch('/api/regions');
      const result = await response.json();
      if (result.success) {
        setRegions(result.data);
      }
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  };

  const fetchRoles = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/roles', { headers });

      if (response.ok) {
        const data = await response.json();
        const roleList = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
        if (roleList.length > 0) {
          setRoles(roleList);
          // Set default role if available and not already set
          setFormData(prev => {
            if (!prev.roleId) {
              return { ...prev, roleId: roleList[0].id };
            }
            return prev;
          });
          return;
        }
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users?status=all', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Show all users
        setStaff(data);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      showNotification('Error fetching staff. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          contractedHours: formData.contractedHours ? parseInt(formData.contractedHours) : null
        })
      });

      if (response.ok) {
        setShowAddModal(false);
        resetForm();
        setCurrentStep(1);
        fetchStaff();
        showNotification('User added successfully!', 'success');
      } else {
        showNotification('Error adding user. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error adding staff:', error);
      showNotification('Error adding staff member. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditStaff = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${selectedStaff.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          contractedHours: formData.contractedHours ? parseInt(formData.contractedHours) : null
        })
      });

      if (response.ok) {
        setShowEditModal(false);
        resetForm();
        fetchStaff();
        showNotification('User updated successfully!', 'success');
      } else {
        showNotification('Error updating user. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error updating staff:', error);
      showNotification('Error updating staff member. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (staffMember) => {
    setStaffToDelete(staffMember);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!staffToDelete) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${staffToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json().catch(() => null);

      if (response.ok) {
        fetchStaff();
        showNotification('User deleted successfully!', 'success');
      } else {
        showNotification(data?.error || 'Error deleting user. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
      showNotification('Error deleting staff member. Please try again.', 'error');
    } finally {
      setShowDeleteConfirm(false);
      setStaffToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setStaffToDelete(null);
  };

  const handleArchiveClick = (staffMember) => {
    setStaffToArchive(staffMember);
    setShowArchiveConfirm(true);
  };

  const handleArchiveConfirm = async () => {
    if (!staffToArchive) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${staffToArchive.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'ARCHIVED' })
      });

      const data = await response.json().catch(() => null);
      if (response.ok) {
        fetchStaff();
        showNotification(`"${staffToArchive.firstName} ${staffToArchive.lastName}" archived successfully!`, 'success');
      } else {
        showNotification(data?.error || 'Error archiving user.', 'error');
      }
    } catch (error) {
      console.error('Error archiving staff:', error);
      showNotification('Error archiving staff member. Please try again.', 'error');
    } finally {
      setShowArchiveConfirm(false);
      setStaffToArchive(null);
    }
  };

  const handleRestoreStaff = async (staffMember) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${staffMember.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'CURRENT' })
      });

      const data = await response.json().catch(() => null);
      if (response.ok) {
        fetchStaff();
        showNotification(`"${staffMember.firstName} ${staffMember.lastName}" restored to active staff!`, 'success');
      } else {
        showNotification(data?.error || 'Error restoring user.', 'error');
      }
    } catch (error) {
      console.error('Error restoring staff:', error);
      showNotification('Error restoring user. Please try again.', 'error');
    }
  };

  const formatDateForInput = (d) => {
    if (!d) return '';
    try {
      const parsed = new Date(d);
      if (isNaN(parsed.getTime())) return '';
      return parsed.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const resetForm = () => {
    setFormData({
      ...initialFormData,
      roleId: roles.length > 0 ? roles[0].id : ''
    });
    setSelectedStaff(null);
    setCurrentStep(1);
    setEditActiveTab('personal');
  };

  const openEditModal = (staffMember) => {
    fetchRoles();
    fetchRegions();
    setSelectedStaff(staffMember);
    setFormData({
      // Step 1: Personal & Contact
      email: staffMember.email || '',
      username: staffMember.username || '',
      firstName: staffMember.firstName || '',
      lastName: staffMember.lastName || '',
      password: '',
      phoneNo: staffMember.phoneNo || '',
      secondaryPhone: staffMember.secondaryPhone || '',
      consentToEmail: Boolean(staffMember.consentToEmail),
      dob: formatDateForInput(staffMember.dob),
      address: staffMember.address || '',
      postalCode: staffMember.postalCode || '',
      niNumber: staffMember.niNumber || '',
      profilePic: staffMember.profilePic || '',

      // Step 2: Employment & Compensation
      roleId: staffMember.roleId || (roles.length > 0 ? roles[0].id : ''),
      employeeNumber: staffMember.employeeNumber || '',
      regionId: staffMember.regionId || '',
      status: staffMember.status || 'CURRENT',
      startDate: formatDateForInput(staffMember.startDate),
      leaveDate: formatDateForInput(staffMember.leaveDate),
      reasonForLeaving: staffMember.reasonForLeaving || '',
      contractedHours: staffMember.contractedHours?.toString() || '',
      rateOfPay: staffMember.rateOfPay?.toString() || '',
      salary: staffMember.salary?.toString() || '',
      sleepingNights: Boolean(staffMember.sleepingNights),
      costForSleepingNights: staffMember.costForSleepingNights?.toString() || '',

      // Step 3: Compliance & Right to Work
      dbsDate: formatDateForInput(staffMember.dbsDate),
      dbsUpdateCode: staffMember.dbsUpdateCode || '',
      sponsorshipStatus: staffMember.sponsorshipStatus || '',
      shareCode: staffMember.shareCode || '',
      visaExpiryDate: formatDateForInput(staffMember.visaExpiryDate),

      // Step 4: Driving Details
      drivingLicenceValid: Boolean(staffMember.drivingLicenceValid),
      ownCar: Boolean(staffMember.ownCar),
      carMake: staffMember.carMake || '',
      carModel: staffMember.carModel || '',
      carColour: staffMember.carColour || '',
      carRegistration: staffMember.carRegistration || '',
      carInsuranceVerified: Boolean(staffMember.carInsuranceVerified),
      businessInsurance: Boolean(staffMember.businessInsurance),

      // Step 5: Next of Kin, Health & Access
      emergencyName: staffMember.emergencyName || '',
      nokRelationship: staffMember.nokRelationship || '',
      emergencyContact: staffMember.emergencyContact || '',
      gpDetails: staffMember.gpDetails || '',
      allergyStatus: staffMember.allergyStatus || 'None',
      allergies: staffMember.allergies || '',
      vaccinationStatus: staffMember.vaccinationStatus || '',
      paysForPrescriptions: Boolean(staffMember.paysForPrescriptions),
      permissions: staffMember.permissions?.map(p => p.key) || []
    });
    setEditActiveTab('personal');
    setShowEditModal(true);
  };

  const activeStaffList = staff.filter(s => s.status !== 'ARCHIVED');
  const archivedStaffList = staff.filter(s => s.status === 'ARCHIVED');

  const displayedStaff = showArchivedView ? archivedStaffList : activeStaffList;

  const filteredStaff = displayedStaff.filter(member => {
    const matchesSearch = member.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || member.roleId === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'CAREWORKER': return 'bg-blue-100 text-blue-800';
      case 'SUPPORT_WORKER': return 'bg-green-100 text-green-800';
      case 'REGISTER_MANAGER': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'CURRENT': return 'bg-green-100 text-green-800';
      case 'ARCHIVED': return 'bg-amber-100 text-amber-800';
      case 'FORMER': return 'bg-gray-100 text-gray-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col lg:ml-64">
        <Header user={user} />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#224fa6] mx-auto mb-4"></div>
                <p className="text-gray-600">Loading staff...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-3">
                      <h1 className="text-3xl font-bold text-gray-900">
                        {showArchivedView ? 'Archived Staff' : 'Staff Management'}
                      </h1>
                      {showArchivedView && (
                        <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-300">
                          Archived Records
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mt-1">
                      {showArchivedView 
                        ? 'Archived users are inactive and excluded from shifts, rotas, and daily tasks across the system.'
                        : 'Manage all users, roles, and permissions'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    {/* Archived Staff Toggle Button */}
                    <button
                      onClick={() => setShowArchivedView(!showArchivedView)}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 border shadow-sm ${
                        showArchivedView
                          ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                      title={showArchivedView ? "Switch back to active staff list" : "View archived staff members"}
                    >
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                      <span>{showArchivedView ? 'Active Staff' : 'Archived Staff'}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        showArchivedView ? 'bg-amber-200 text-amber-900' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {archivedStaffList.length}
                      </span>
                    </button>

                    {hasPermission(user, 'users.create') && !showArchivedView && (
                      <button
                        onClick={() => {
                          fetchRoles();
                          fetchRegions();
                          resetForm();
                          setShowAddModal(true);
                        }}
                        className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-5 py-2.5 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2 text-sm font-medium"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Add User</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900">{staff.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center">
                    <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Active Staff</p>
                      <p className="text-2xl font-bold text-gray-900">{activeStaffList.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center">
                    <div className="p-3 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Archived Staff</p>
                      <p className="text-2xl font-bold text-gray-900">{archivedStaffList.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center">
                    <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Active Admins</p>
                      <p className="text-2xl font-bold text-gray-900">{activeStaffList.filter(s => ['ADMIN', 'DIRECTOR', 'HR'].includes(s.role?.name || s.role)).length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search staff..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-3 w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
                      />
                    </div>
                  </div>
                  <div>
                    <select
                      value={filterRole}
                      onChange={(e) => setFilterRole(e.target.value)}
                      className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
                    >
                      <option value="all">All Roles</option>
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>{role.displayName || role.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* View Switcher Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex items-center space-x-2 bg-gray-100 p-1.5 rounded-xl border border-gray-200">
                  <button
                    onClick={() => setActiveTableView('overview')}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                      activeTableView === 'overview'
                        ? 'bg-[#224fa6] text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                    }`}
                  >
                    <span>📋 Overview</span>
                  </button>
                  <button
                    onClick={() => setActiveTableView('driving')}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                      activeTableView === 'driving'
                        ? 'bg-[#224fa6] text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                    }`}
                  >
                    <span>🚗 Driving Details</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${activeTableView === 'driving' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'}`}>
                      {displayedStaff.filter(s => s.drivingLicenceValid || s.ownCar).length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTableView('compliance')}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                      activeTableView === 'compliance'
                        ? 'bg-[#224fa6] text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                    }`}
                  >
                    <span>🛡️ Compliance & Visas</span>
                    {displayedStaff.filter(s => {
                      const dbs = getDbsStatus(s.dbsDate);
                      const visa = getVisaStatus(s.visaExpiryDate, s.sponsorshipStatus);
                      return dbs.status === 'expired' || dbs.status === 'expiring' || visa.status === 'expired' || visa.status === 'expiring';
                    }).length > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold animate-pulse">
                        {displayedStaff.filter(s => {
                          const dbs = getDbsStatus(s.dbsDate);
                          const visa = getVisaStatus(s.visaExpiryDate, s.sponsorshipStatus);
                          return dbs.status === 'expired' || dbs.status === 'expiring' || visa.status === 'expired' || visa.status === 'expiring';
                        }).length} Alert
                      </span>
                    )}
                  </button>
                </div>
                <div className="text-xs text-gray-500 flex items-center space-x-3">
                  <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block mr-1"></span> In Date</span>
                  <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block mr-1"></span> Expiring Soon</span>
                  <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block mr-1"></span> Expired</span>
                </div>
              </div>

              {/* Staff Table */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Staff Member</th>
                        {activeTableView === 'overview' && (
                          <>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role & Region</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">DBS Status</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Right to Work / Visa</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Driver?</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                          </>
                        )}
                        {activeTableView === 'driving' && (
                          <>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Valid Licence</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Owns Car</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Vehicle Details</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Registration</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Car Insurance</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Business Cover</th>
                          </>
                        )}
                        {activeTableView === 'compliance' && (
                          <>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">DBS Check & Expiry</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">DBS Update Code</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Sponsorship Status</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Share Code</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Visa Expiry Status</th>
                          </>
                        )}
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filteredStaff.length === 0 ? (
                        <tr>
                          <td colSpan={activeTableView === 'overview' ? 7 : activeTableView === 'driving' ? 8 : 7} className="px-6 py-12 text-center text-gray-500">
                            <div className="flex flex-col items-center justify-center">
                              <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.146-1.283-.423-1.848M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.146-1.283.423-1.848m0 0A9.002 9.002 0 0112 9m6.003 9c-.52-.746-1.229-1.38-2.06-1.896m2.06 1.896a3 3 0 00-5.356-1.857M12 12a3 3 0 100-6 3 3 0 000 6z" />
                              </svg>
                              <p className="text-base font-medium text-gray-900">
                                {showArchivedView ? 'No archived staff members found' : 'No staff members found'}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                {showArchivedView 
                                  ? 'Active staff can be archived using the archive button in the staff list.'
                                  : 'Try adjusting your search or filter options.'}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredStaff.map((member) => {
                          const dbs = getDbsStatus(member.dbsDate);
                          const visa = getVisaStatus(member.visaExpiryDate, member.sponsorshipStatus);

                          return (
                            <tr key={member.id} className="hover:bg-gray-50 transition-colors duration-200">
                              {/* Common Staff Column */}
                              <td className="px-6 py-5 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-12 w-12">
                                    {member.profilePic ? (
                                      <img src={member.profilePic} alt="" className="h-12 w-12 rounded-full object-cover shadow-sm border border-gray-200" />
                                    ) : (
                                      <div className="h-12 w-12 rounded-full bg-gradient-to-r from-[#224fa6] to-[#3270e9] flex items-center justify-center shadow-md">
                                        <span className="text-white font-semibold text-sm">
                                          {member.firstName?.[0]}{member.lastName?.[0]}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-semibold text-gray-900">
                                      {member.firstName} {member.lastName}
                                    </div>
                                    <div className="text-xs text-gray-500">{member.email}</div>
                                    {member.phoneNo && <div className="text-xs text-gray-400">{member.phoneNo}</div>}
                                  </div>
                                </div>
                              </td>

                              {/* OVERVIEW VIEW */}
                              {activeTableView === 'overview' && (
                                <>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col space-y-1">
                                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full w-max ${getRoleBadgeColor(member.role?.name)}`}>
                                        {member.role?.displayName || 'N/A'}
                                      </span>
                                      {member.region?.title && (
                                        <span className="text-xs text-gray-500 font-medium">📍 {member.region.title}</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col">
                                      <span className={`inline-flex items-center px-2.5 py-1 text-xs rounded-lg border w-max ${dbs.badge}`}>
                                        <span className={`w-2 h-2 rounded-full mr-1.5 ${
                                          dbs.color === 'green' ? 'bg-green-500' : dbs.color === 'amber' ? 'bg-amber-500' : dbs.color === 'red' ? 'bg-red-500' : 'bg-gray-400'
                                        }`}></span>
                                        {dbs.label}
                                      </span>
                                      {member.dbsDate && (
                                        <span className="text-[11px] text-gray-400 mt-0.5">Checked: {new Date(member.dbsDate).toLocaleDateString()}</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col">
                                      <span className={`inline-flex items-center px-2.5 py-1 text-xs rounded-lg border w-max ${visa.badge}`}>
                                        <span className={`w-2 h-2 rounded-full mr-1.5 ${
                                          visa.color === 'green' ? 'bg-green-500' : visa.color === 'amber' ? 'bg-amber-500' : visa.color === 'red' ? 'bg-red-500' : 'bg-gray-400'
                                        }`}></span>
                                        {visa.label}
                                      </span>
                                      {member.sponsorshipStatus && (
                                        <span className="text-[11px] text-gray-500 mt-0.5">{member.sponsorshipStatus}</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {member.drivingLicenceValid || member.ownCar ? (
                                      <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                                        🚗 {member.ownCar ? 'Has Car' : 'Licence Only'}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-gray-400 font-medium">Non-driver</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(member.status)}`}>
                                      {member.status}
                                    </span>
                                  </td>
                                </>
                              )}

                              {/* DRIVING VIEW */}
                              {activeTableView === 'driving' && (
                                <>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg border ${
                                      member.drivingLicenceValid 
                                        ? 'bg-green-50 text-green-700 border-green-200' 
                                        : 'bg-gray-100 text-gray-600 border-gray-200'
                                    }`}>
                                      {member.drivingLicenceValid ? '✓ Valid' : '✗ None'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg border ${
                                      member.ownCar 
                                        ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                        : 'bg-gray-100 text-gray-600 border-gray-200'
                                    }`}>
                                      {member.ownCar ? '✓ Yes' : '✗ No'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {member.carMake || member.carModel ? (
                                      <div>
                                        <div className="font-medium text-gray-900">{member.carMake} {member.carModel}</div>
                                        {member.carColour && <div className="text-xs text-gray-500">Colour: {member.carColour}</div>}
                                      </div>
                                    ) : (
                                      <span className="text-xs text-gray-400">—</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {member.carRegistration ? (
                                      <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold font-mono tracking-wider rounded border border-amber-300 bg-amber-100 text-gray-900 shadow-sm">
                                        {member.carRegistration}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-gray-400">—</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg border ${
                                      member.carInsuranceVerified 
                                        ? 'bg-green-50 text-green-700 border-green-200' 
                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}>
                                      {member.carInsuranceVerified ? '✓ Verified' : '⚠ Pending'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg border ${
                                      member.businessInsurance 
                                        ? 'bg-green-50 text-green-700 border-green-200' 
                                        : 'bg-gray-100 text-gray-600 border-gray-200'
                                    }`}>
                                      {member.businessInsurance ? '✓ Business Class' : '✗ Standard'}
                                    </span>
                                  </td>
                                </>
                              )}

                              {/* COMPLIANCE VIEW */}
                              {activeTableView === 'compliance' && (
                                <>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col">
                                      <span className={`inline-flex items-center px-2.5 py-1 text-xs rounded-lg border w-max ${dbs.badge}`}>
                                        <span className={`w-2 h-2 rounded-full mr-1.5 ${
                                          dbs.color === 'green' ? 'bg-green-500' : dbs.color === 'amber' ? 'bg-amber-500' : dbs.color === 'red' ? 'bg-red-500' : 'bg-gray-400'
                                        }`}></span>
                                        {dbs.label}
                                      </span>
                                      {member.dbsDate && (
                                        <span className="text-[11px] text-gray-500 mt-1">
                                          Date: {new Date(member.dbsDate).toLocaleDateString()}
                                        </span>
                                      )}
                                      {dbs.expiryDate && (
                                        <span className="text-[11px] text-gray-400">
                                          Due: {dbs.expiryDate}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {member.dbsUpdateCode ? (
                                      <span className="font-mono text-xs bg-gray-100 px-2.5 py-1 rounded border border-gray-200 text-gray-800">
                                        {member.dbsUpdateCode}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-gray-400">—</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                    {member.sponsorshipStatus || <span className="text-xs text-gray-400">—</span>}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {member.shareCode ? (
                                      <span className="font-mono text-xs bg-blue-50 px-2.5 py-1 rounded border border-blue-200 text-blue-900 font-semibold">
                                        {member.shareCode}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-gray-400">—</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col">
                                      <span className={`inline-flex items-center px-2.5 py-1 text-xs rounded-lg border w-max ${visa.badge}`}>
                                        <span className={`w-2 h-2 rounded-full mr-1.5 ${
                                          visa.color === 'green' ? 'bg-green-500' : visa.color === 'amber' ? 'bg-amber-500' : visa.color === 'red' ? 'bg-red-500' : 'bg-gray-400'
                                        }`}></span>
                                        {visa.label}
                                      </span>
                                      {member.visaExpiryDate && (
                                        <span className="text-[11px] text-gray-500 mt-1">
                                          Expires: {new Date(member.visaExpiryDate).toLocaleDateString()}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                </>
                              )}

                              {/* Common Actions Column */}
                              <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-2">
                                  {showArchivedView ? (
                                    <>
                                      {hasPermission(user, 'users.update') && (
                                        <button
                                          onClick={() => handleRestoreStaff(member)}
                                          className="p-2 text-green-600 hover:text-white hover:bg-green-600 rounded-lg transition-all duration-200 hover:shadow-md"
                                          title="Restore to Active Staff"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                          </svg>
                                        </button>
                                      )}
                                      {hasPermission(user, 'users.update') && (
                                        <button
                                          onClick={() => openEditModal(member)}
                                          className="p-2 text-[#224fa6] hover:text-white hover:bg-[#224fa6] rounded-lg transition-all duration-200 hover:shadow-md"
                                          title="Edit User"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                          </svg>
                                        </button>
                                      )}
                                      {hasPermission(user, 'users.delete') && (
                                        <button
                                          onClick={() => handleDeleteClick(member)}
                                          className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 hover:shadow-md"
                                          title="Delete User Permanently"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                        </button>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      {hasPermission(user, 'users.update') && (
                                        <button
                                          onClick={() => openEditModal(member)}
                                          className="p-2 text-[#224fa6] hover:text-white hover:bg-[#224fa6] rounded-lg transition-all duration-200 hover:shadow-md"
                                          title="Edit User"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                          </svg>
                                        </button>
                                      )}
                                      {hasPermission(user, 'users.update') && (
                                        <button
                                          onClick={() => handleArchiveClick(member)}
                                          className="p-2 text-amber-600 hover:text-white hover:bg-amber-600 rounded-lg transition-all duration-200 hover:shadow-md"
                                          title="Archive Staff"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                          </svg>
                                        </button>
                                      )}
                                      {hasPermission(user, 'users.delete') && (
                                        <button
                                          onClick={() => handleDeleteClick(member)}
                                          className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 hover:shadow-md"
                                          title="Delete User"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Add Staff Modal */}
          {showAddModal && (
            <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
              <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 max-w-5xl w-full max-h-[95vh] overflow-y-auto animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Add New Staff Member</h3>
                      <p className="text-sm text-gray-600 mt-1">Complete employment, compliance, and driving information</p>
                    </div>
                    <button
                      onClick={() => { setShowAddModal(false); resetForm(); }}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-110"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Progress Stepper */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between">
                      {[
                        { num: 1, label: 'Personal & Contact' },
                        { num: 2, label: 'Employment & Pay' },
                        { num: 3, label: 'Compliance & DBS' },
                        { num: 4, label: 'Driving & Vehicle' },
                        { num: 5, label: 'Health & Access' }
                      ].map((step, idx) => (
                        <div key={step.num} className="flex items-center flex-1 last:flex-none">
                          <div className="flex flex-col items-center">
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                              currentStep >= step.num
                                ? 'border-[#224fa6] bg-[#224fa6] text-white shadow-md'
                                : 'border-gray-300 bg-white text-gray-400'
                            }`}>
                              {currentStep > step.num ? (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <span className="font-semibold text-sm">{step.num}</span>
                              )}
                            </div>
                            <span className={`text-[11px] font-medium mt-1 text-center hidden sm:block ${
                              currentStep >= step.num ? 'text-[#224fa6] font-semibold' : 'text-gray-400'
                            }`}>
                              {step.label}
                            </span>
                          </div>
                          {idx < 4 && (
                            <div className={`flex-1 h-0.5 mx-2 -mt-4 transition-all duration-300 ${
                              currentStep > step.num ? 'bg-[#224fa6]' : 'bg-gray-200'
                            }`}></div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (currentStep < 5) {
                      nextStep();
                    } else {
                      handleAddStaff(e);
                    }
                  }} className="space-y-6">

                    {/* STEP 1: Personal & Contact Info */}
                    {currentStep === 1 && (
                      <div className="space-y-4">
                        {/* Profile Photo */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-5 border border-blue-200">
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                              {formData.profilePic ? (
                                <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-white shadow-md">
                                  <img src={formData.profilePic} alt="Profile" className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, profilePic: '' })}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ) : (
                                <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-[#224fa6] to-[#3270e9] flex items-center justify-center border-2 border-white shadow-md">
                                  <svg className="w-12 h-12 text-white opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <label className="block text-sm font-semibold text-gray-900 mb-1">Profile Photo</label>
                              <FileUpload
                                accept="image/*"
                                label="Upload Photo"
                                onUploadComplete={(fileUrl) => {
                                  setFormData({ ...formData, profilePic: fileUrl });
                                  showNotification('Photo uploaded successfully!', 'success');
                                }}
                                onError={(error) => showNotification(`Photo upload failed: ${error}`, 'error')}
                                className="mb-2"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Names & DOB */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">First Name *</label>
                            <input
                              type="text"
                              required
                              value={formData.firstName}
                              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                              placeholder="John"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name *</label>
                            <input
                              type="text"
                              required
                              value={formData.lastName}
                              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                              placeholder="Smith"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth (DOB)</label>
                            <input
                              type="date"
                              value={formData.dob}
                              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                            />
                          </div>
                        </div>

                        {/* Email & Username & Password */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address *</label>
                            <input
                              type="email"
                              required
                              value={formData.email}
                              onChange={(e) => {
                                const email = e.target.value;
                                const username = email.split('@')[0];
                                setFormData({ ...formData, email, username });
                              }}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                              placeholder="staff@example.com"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Username (System)</label>
                            <input
                              type="text"
                              value={formData.username}
                              readOnly
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Password *</label>
                            <div className="relative">
                              <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                                placeholder="••••••••"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                {showPassword ? (
                                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                ) : (
                                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Phone 1, Phone 2, NI Number */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number 1 *</label>
                            <input
                              type="tel"
                              required
                              value={formData.phoneNo}
                              onChange={(e) => setFormData({ ...formData, phoneNo: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                              placeholder="+44 7123 456789"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number 2 (Secondary)</label>
                            <input
                              type="tel"
                              value={formData.secondaryPhone}
                              onChange={(e) => setFormData({ ...formData, secondaryPhone: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                              placeholder="+44 7987 654321"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">NI Number</label>
                            <input
                              type="text"
                              value={formData.niNumber}
                              onChange={(e) => setFormData({ ...formData, niNumber: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                              placeholder="QQ 12 34 56 A"
                            />
                          </div>
                        </div>

                        {/* Address & Postal Code */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Full Street Address</label>
                            <input
                              type="text"
                              value={formData.address}
                              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                              placeholder="123 High Street, Flat 4B"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Postal Code</label>
                            <input
                              type="text"
                              value={formData.postalCode}
                              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                              placeholder="SW1A 1AA"
                            />
                          </div>
                        </div>

                        {/* Consent to Email */}
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="consentToEmail"
                            checked={formData.consentToEmail}
                            onChange={(e) => setFormData({ ...formData, consentToEmail: e.target.checked })}
                            className="w-4 h-4 text-[#224fa6] rounded focus:ring-[#224fa6]"
                          />
                          <label htmlFor="consentToEmail" className="text-sm font-medium text-gray-700 cursor-pointer">
                            Consent to receive emails and electronic notifications
                          </label>
                        </div>
                      </div>
                    )}

                    {/* STEP 2: Employment & Pay */}
                    {currentStep === 2 && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Role *</label>
                            <select
                              value={formData.roleId}
                              onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                              required
                            >
                              <option value="">Select Role</option>
                              {roles.map(role => (
                                <option key={role.id} value={role.id}>{role.displayName || role.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Region</label>
                            <select
                              value={formData.regionId}
                              onChange={(e) => setFormData({ ...formData, regionId: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                            >
                              <option value="">Select Region</option>
                              {regions.map(region => (
                                <option key={region.id} value={region.id}>{region.title}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Employee Number</label>
                            <input
                              type="text"
                              value={formData.employeeNumber}
                              onChange={(e) => setFormData({ ...formData, employeeNumber: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                              placeholder="EMP-001"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date</label>
                            <input
                              type="date"
                              value={formData.startDate}
                              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">End Date (Leave Date)</label>
                            <input
                              type="date"
                              value={formData.leaveDate}
                              onChange={(e) => setFormData({ ...formData, leaveDate: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Status *</label>
                            <select
                              value={formData.status}
                              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                            >
                              <option value="CURRENT">Current</option>
                              <option value="ARCHIVED">Archived</option>
                            </select>
                          </div>
                        </div>

                        {formData.leaveDate && (
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Reason for Leaving</label>
                            <textarea
                              rows={2}
                              value={formData.reasonForLeaving}
                              onChange={(e) => setFormData({ ...formData, reasonForLeaving: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                              placeholder="Details regarding resignation, end of contract, etc."
                            />
                          </div>
                        )}

                        {/* Pay & Hours */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Contracted Hours PW</label>
                            <input
                              type="number"
                              value={formData.contractedHours}
                              onChange={(e) => setFormData({ ...formData, contractedHours: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                              placeholder="37.5"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Rate of Pay (£ / hr)</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">£</span>
                              <input
                                type="number"
                                step="0.01"
                                value={formData.rateOfPay}
                                onChange={(e) => setFormData({ ...formData, rateOfPay: e.target.value })}
                                className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                                placeholder="12.50"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Annual Salary (£)</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">£</span>
                              <input
                                type="number"
                                step="0.01"
                                value={formData.salary}
                                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                                className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                                placeholder="26000"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Sleeping Nights */}
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id="sleepingNights"
                              checked={formData.sleepingNights}
                              onChange={(e) => setFormData({ ...formData, sleepingNights: e.target.checked })}
                              className="w-4 h-4 text-[#224fa6] rounded focus:ring-[#224fa6]"
                            />
                            <label htmlFor="sleepingNights" className="text-sm font-semibold text-gray-900 cursor-pointer">
                              Available / Eligible for Sleeping Night Shifts (SN)
                            </label>
                          </div>
                          {formData.sleepingNights && (
                            <div className="max-w-xs pt-1">
                              <label className="block text-xs font-semibold text-gray-700 mb-1">Cost for Sleeping Night (£ / shift)</label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">£</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={formData.costForSleepingNights}
                                  onChange={(e) => setFormData({ ...formData, costForSleepingNights: e.target.value })}
                                  className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                                  placeholder="80.00"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* STEP 3: Compliance & Right to Work */}
                    {currentStep === 3 && (
                      <div className="space-y-6">
                        {/* DBS Section */}
                        <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm space-y-4">
                          <div className="flex items-center justify-between border-b pb-3">
                            <h4 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                              <span>🛡️ DBS (Disclosure & Barring Service)</span>
                            </h4>
                            <span className="text-xs text-gray-500">Valid for 3 years</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">DBS Check Date</label>
                              <input
                                type="date"
                                value={formData.dbsDate}
                                onChange={(e) => setFormData({ ...formData, dbsDate: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">DBS Update Service Code</label>
                              <input
                                type="text"
                                value={formData.dbsUpdateCode}
                                onChange={(e) => setFormData({ ...formData, dbsUpdateCode: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900 font-mono"
                                placeholder="C123456789"
                              />
                            </div>
                          </div>

                          {/* Live DBS Status Indicator */}
                          {(() => {
                            const dbs = getDbsStatus(formData.dbsDate);
                            return (
                              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                                dbs.color === 'green' ? 'bg-green-50 text-green-800 border-green-200' :
                                dbs.color === 'amber' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                dbs.color === 'red' ? 'bg-red-50 text-red-800 border-red-200' :
                                'bg-gray-50 text-gray-600 border-gray-200'
                              }`}>
                                <div className="flex items-center space-x-2">
                                  <span className={`w-2.5 h-2.5 rounded-full ${
                                    dbs.color === 'green' ? 'bg-green-500' :
                                    dbs.color === 'amber' ? 'bg-amber-500' :
                                    dbs.color === 'red' ? 'bg-red-500' : 'bg-gray-400'
                                  }`}></span>
                                  <span className="font-bold">DBS Status: {dbs.label}</span>
                                </div>
                                <div>
                                  {dbs.expiryDate ? (
                                    <span>Renewal Due: <strong className="font-semibold">{dbs.expiryDate}</strong></span>
                                  ) : (
                                    <span>Set DBS Date to calculate expiry status</span>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Right to Work & Visa Section */}
                        <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm space-y-4">
                          <div className="flex items-center justify-between border-b pb-3">
                            <h4 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                              <span>🛂 Right to Work & Visa Status</span>
                            </h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">Sponsorship Status</label>
                              <select
                                value={formData.sponsorshipStatus}
                                onChange={(e) => setFormData({ ...formData, sponsorshipStatus: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                              >
                                <option value="">Select Status</option>
                                <option value="British Citizen">British Citizen</option>
                                <option value="Irish Citizen">Irish Citizen</option>
                                <option value="Settled Status (ILR)">Settled Status (ILR)</option>
                                <option value="Pre-Settled Status">Pre-Settled Status</option>
                                <option value="Skilled Worker Visa">Skilled Worker Visa</option>
                                <option value="Health & Care Worker Visa">Health & Care Worker Visa</option>
                                <option value="Student Visa">Student Visa</option>
                                <option value="Graduate Visa">Graduate Visa</option>
                                <option value="Family / Spouse Visa">Family / Spouse Visa</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">Right to Work Share Code</label>
                              <input
                                type="text"
                                value={formData.shareCode}
                                onChange={(e) => setFormData({ ...formData, shareCode: e.target.value.toUpperCase() })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900 font-mono font-semibold"
                                placeholder="W12 345 67X"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">Visa Expiry Date</label>
                              <input
                                type="date"
                                value={formData.visaExpiryDate}
                                onChange={(e) => setFormData({ ...formData, visaExpiryDate: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                              />
                            </div>
                          </div>

                          {/* Live Visa Status Indicator */}
                          {(() => {
                            const visa = getVisaStatus(formData.visaExpiryDate, formData.sponsorshipStatus);
                            return (
                              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                                visa.color === 'green' ? 'bg-green-50 text-green-800 border-green-200' :
                                visa.color === 'amber' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                visa.color === 'red' ? 'bg-red-50 text-red-800 border-red-200' :
                                'bg-gray-50 text-gray-600 border-gray-200'
                              }`}>
                                <div className="flex items-center space-x-2">
                                  <span className={`w-2.5 h-2.5 rounded-full ${
                                    visa.color === 'green' ? 'bg-green-500' :
                                    visa.color === 'amber' ? 'bg-amber-500' :
                                    visa.color === 'red' ? 'bg-red-500' : 'bg-gray-400'
                                  }`}></span>
                                  <span className="font-bold">Visa Status: {visa.label}</span>
                                </div>
                                <div>
                                  {formData.visaExpiryDate ? (
                                    <span>Expiry: <strong className="font-semibold">{new Date(formData.visaExpiryDate).toLocaleDateString()}</strong></span>
                                  ) : (
                                    <span>Alerts trigger 3 months prior to expiry</span>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* STEP 4: Driving & Vehicle Details (Sheet 2) */}
                    {currentStep === 4 && (
                      <div className="space-y-6">
                        <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm space-y-4">
                          <div className="border-b pb-3">
                            <h4 className="text-base font-bold text-gray-900">🚗 Driving Eligibility & Vehicle Information</h4>
                            <p className="text-xs text-gray-500 mt-0.5">Capture driver licence status and vehicle details for community care runs</p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-sm text-gray-900">Valid Driving Licence</p>
                                <p className="text-xs text-gray-500">Staff holds a valid UK/EU licence</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.drivingLicenceValid}
                                  onChange={(e) => setFormData({ ...formData, drivingLicenceValid: e.target.checked })}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#224fa6]"></div>
                              </label>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-sm text-gray-900">Own A Car</p>
                                <p className="text-xs text-gray-500">Staff has access to their own vehicle</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.ownCar}
                                  onChange={(e) => setFormData({ ...formData, ownCar: e.target.checked })}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#224fa6]"></div>
                              </label>
                            </div>
                          </div>

                          {/* Vehicle Details */}
                          {formData.ownCar && (
                            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-4 animate-in fade-in">
                              <h5 className="text-xs font-bold text-[#224fa6] uppercase tracking-wider">Vehicle Specifications</h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-1">Make of Car</label>
                                  <input
                                    type="text"
                                    value={formData.carMake}
                                    onChange={(e) => setFormData({ ...formData, carMake: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900 text-sm"
                                    placeholder="e.g. Ford"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-1">Model of Car</label>
                                  <input
                                    type="text"
                                    value={formData.carModel}
                                    onChange={(e) => setFormData({ ...formData, carModel: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900 text-sm"
                                    placeholder="e.g. Fiesta"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-1">Colour of Car</label>
                                  <input
                                    type="text"
                                    value={formData.carColour}
                                    onChange={(e) => setFormData({ ...formData, carColour: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900 text-sm"
                                    placeholder="e.g. Silver"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-1">Car Registration</label>
                                  <input
                                    type="text"
                                    value={formData.carRegistration}
                                    onChange={(e) => setFormData({ ...formData, carRegistration: e.target.value.toUpperCase() })}
                                    className="w-full px-3 py-2 border border-amber-300 bg-amber-50 rounded-lg focus:ring-2 focus:ring-[#224fa6] text-gray-900 font-mono font-bold text-sm tracking-wider"
                                    placeholder="AB12 CDE"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Insurance Toggles */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-sm text-gray-900">Car Insurance Verified</p>
                                <p className="text-xs text-gray-500">Valid MOT and insurance document inspected</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.carInsuranceVerified}
                                  onChange={(e) => setFormData({ ...formData, carInsuranceVerified: e.target.checked })}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#224fa6]"></div>
                              </label>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-sm text-gray-900">Business Insurance Cover</p>
                                <p className="text-xs text-gray-500">Includes Class 1 Business use for care duties</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.businessInsurance}
                                  onChange={(e) => setFormData({ ...formData, businessInsurance: e.target.checked })}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#224fa6]"></div>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* STEP 5: Emergency, Health & Permissions */}
                    {currentStep === 5 && (
                      <div className="space-y-6">
                        {/* Next of Kin / Emergency Contact */}
                        <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm space-y-4">
                          <h4 className="text-base font-bold text-gray-900 border-b pb-2">Emergency Contact (Next of Kin)</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">NOK Name</label>
                              <input
                                type="text"
                                value={formData.emergencyName}
                                onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                                placeholder="Jane Doe"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">NOK Relationship</label>
                              <input
                                type="text"
                                value={formData.nokRelationship}
                                onChange={(e) => setFormData({ ...formData, nokRelationship: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                                placeholder="Spouse / Parent / Partner"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">NOK Phone Number</label>
                              <input
                                type="tel"
                                value={formData.emergencyContact}
                                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                                placeholder="+44 7123 456789"
                              />
                            </div>
                          </div>
                        </div>

                        {/* GP & Health Info */}
                        <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm space-y-4">
                          <h4 className="text-base font-bold text-gray-900 border-b pb-2">Health, GP & Prescriptions</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">GP Details (Surgery & Doctor)</label>
                              <textarea
                                rows={2}
                                value={formData.gpDetails}
                                onChange={(e) => setFormData({ ...formData, gpDetails: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900 text-sm"
                                placeholder="Practice name, address, contact phone"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">Vaccination Status</label>
                              <input
                                type="text"
                                value={formData.vaccinationStatus}
                                onChange={(e) => setFormData({ ...formData, vaccinationStatus: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900 text-sm"
                                placeholder="e.g. Fully Vaccinated, Covid & Flu up to date"
                              />
                              <div className="mt-3 flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="paysForPrescriptions"
                                  checked={formData.paysForPrescriptions}
                                  onChange={(e) => setFormData({ ...formData, paysForPrescriptions: e.target.checked })}
                                  className="w-4 h-4 text-[#224fa6] rounded focus:ring-[#224fa6]"
                                />
                                <label htmlFor="paysForPrescriptions" className="text-xs font-semibold text-gray-700 cursor-pointer">
                                  Pays for Prescriptions (Px's)
                                </label>
                              </div>
                            </div>
                          </div>

                          {/* Allergies */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">Allergy Status</label>
                              <select
                                value={formData.allergyStatus}
                                onChange={(e) => setFormData({ ...formData, allergyStatus: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                              >
                                <option value="None">None Known</option>
                                <option value="Has Known Allergies">Has Known Allergies</option>
                              </select>
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-semibold text-gray-700 mb-1">Allergies Description</label>
                              <input
                                type="text"
                                value={formData.allergies}
                                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900 text-sm"
                                placeholder="e.g. Penicillin, Peanuts, Latex"
                              />
                            </div>
                          </div>
                        </div>

                        {/* System Permissions */}
                        {!['CAREWORKER', 'SUPPORT_WORKER'].includes(roles.find(r => r.id == formData.roleId)?.name) && (
                          <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm space-y-3">
                            <h4 className="text-base font-bold text-gray-900 border-b pb-2">System Permissions</h4>
                            <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-xl bg-white shadow-inner">
                              <PermissionMatrix
                                selectedPermissions={formData.permissions}
                                onChange={(newPermissions) => setFormData({ ...formData, permissions: newPermissions })}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step Navigation Buttons */}
                    <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => { setShowAddModal(false); resetForm(); }}
                        className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                      >
                        Cancel
                      </button>
                      <div className="flex space-x-3">
                        {currentStep > 1 && (
                          <button
                            type="button"
                            onClick={previousStep}
                            className="px-6 py-3 text-[#224fa6] bg-blue-50 rounded-xl hover:bg-blue-100 transition-all duration-200 font-medium"
                          >
                            Previous
                          </button>
                        )}
                        <button
                          type="submit"
                          disabled={isSubmitting && currentStep === 5}
                          className="px-8 py-3 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {currentStep === 5 ? (isSubmitting ? 'Creating Staff Member...' : 'Create Staff Member') : 'Next'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Edit Staff Modal */}
          {showEditModal && (
            <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
              <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 max-w-5xl w-full max-h-[95vh] overflow-y-auto animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Edit Staff Member</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Editing: <span className="font-semibold text-gray-900">{selectedStaff?.firstName} {selectedStaff?.lastName}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-110"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Edit Section Tabs */}
                  <div className="flex flex-wrap gap-2 border-b border-gray-200 mb-6 pb-2">
                    {[
                      { id: 'personal', label: '👤 Personal & Contact' },
                      { id: 'employment', label: '💼 Employment & Pay' },
                      { id: 'compliance', label: '🛡️ Compliance & DBS' },
                      { id: 'driving', label: '🚗 Driving Details' },
                      { id: 'health', label: '🏥 Health & Emergency' },
                      { id: 'permissions', label: '🔑 Permissions' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setEditActiveTab(tab.id)}
                        className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 ${
                          editActiveTab === tab.id
                            ? 'bg-[#224fa6] text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleEditStaff} className="space-y-6">

                    {/* EDIT TAB 1: Personal & Contact */}
                    {editActiveTab === 'personal' && (
                      <div className="space-y-4">
                        {/* Profile Photo */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            {formData.profilePic ? (
                              <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-white shadow-md">
                                <img src={formData.profilePic} alt="Profile" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => setFormData({ ...formData, profilePic: '' })}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ) : (
                              <div className="w-20 h-20 rounded-xl bg-[#224fa6] flex items-center justify-center text-white font-bold text-lg">
                                {formData.firstName?.[0]}{formData.lastName?.[0]}
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <label className="block text-sm font-semibold text-gray-900 mb-1">Update Profile Photo</label>
                            <FileUpload
                              accept="image/*"
                              label="Upload New Photo"
                              onUploadComplete={(fileUrl) => {
                                setFormData({ ...formData, profilePic: fileUrl });
                                showNotification('Photo updated successfully!', 'success');
                              }}
                              onError={(error) => showNotification(`Photo upload failed: ${error}`, 'error')}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">First Name *</label>
                            <input
                              type="text"
                              required
                              value={formData.firstName}
                              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name *</label>
                            <input
                              type="text"
                              required
                              value={formData.lastName}
                              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth (DOB)</label>
                            <input
                              type="date"
                              value={formData.dob}
                              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
                            <input
                              type="email"
                              required
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Username *</label>
                            <input
                              type="text"
                              required
                              value={formData.username}
                              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">New Password (leave blank to keep)</label>
                            <input
                              type="password"
                              value={formData.password}
                              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                              placeholder="••••••••"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number 1 *</label>
                            <input
                              type="tel"
                              required
                              value={formData.phoneNo}
                              onChange={(e) => setFormData({ ...formData, phoneNo: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number 2</label>
                            <input
                              type="tel"
                              value={formData.secondaryPhone}
                              onChange={(e) => setFormData({ ...formData, secondaryPhone: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">NI Number</label>
                            <input
                              type="text"
                              value={formData.niNumber}
                              onChange={(e) => setFormData({ ...formData, niNumber: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                            <input
                              type="text"
                              value={formData.address}
                              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Postal Code</label>
                            <input
                              type="text"
                              value={formData.postalCode}
                              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                            />
                          </div>
                        </div>

                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="editConsentToEmail"
                            checked={formData.consentToEmail}
                            onChange={(e) => setFormData({ ...formData, consentToEmail: e.target.checked })}
                            className="w-4 h-4 text-[#224fa6] rounded focus:ring-[#224fa6]"
                          />
                          <label htmlFor="editConsentToEmail" className="text-sm font-medium text-gray-700 cursor-pointer">
                            Consent to receive emails and electronic notifications
                          </label>
                        </div>
                      </div>
                    )}

                    {/* EDIT TAB 2: Employment & Pay */}
                    {editActiveTab === 'employment' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Role</label>
                            <select
                              value={formData.roleId}
                              onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                              required
                            >
                              {roles.map(role => (
                                <option key={role.id} value={role.id}>{role.displayName || role.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Region</label>
                            <select
                              value={formData.regionId}
                              onChange={(e) => setFormData({ ...formData, regionId: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                            >
                              <option value="">Select Region</option>
                              {regions.map(region => (
                                <option key={region.id} value={region.id}>{region.title}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                            <select
                              value={formData.status}
                              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                            >
                              <option value="CURRENT">Current</option>
                              <option value="ARCHIVED">Archived</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Employee Number</label>
                            <input
                              type="text"
                              value={formData.employeeNumber}
                              onChange={(e) => setFormData({ ...formData, employeeNumber: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date</label>
                            <input
                              type="date"
                              value={formData.startDate}
                              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">End Date (Leave Date)</label>
                            <input
                              type="date"
                              value={formData.leaveDate}
                              onChange={(e) => setFormData({ ...formData, leaveDate: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Reason for Leaving</label>
                          <textarea
                            rows={2}
                            value={formData.reasonForLeaving}
                            onChange={(e) => setFormData({ ...formData, reasonForLeaving: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                            placeholder="Reason for leaving if applicable"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Contracted Hours PW</label>
                            <input
                              type="number"
                              value={formData.contractedHours}
                              onChange={(e) => setFormData({ ...formData, contractedHours: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Rate of Pay (£ / hr)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.rateOfPay}
                              onChange={(e) => setFormData({ ...formData, rateOfPay: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Annual Salary (£)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.salary}
                              onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                            />
                          </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id="editSleepingNights"
                              checked={formData.sleepingNights}
                              onChange={(e) => setFormData({ ...formData, sleepingNights: e.target.checked })}
                              className="w-4 h-4 text-[#224fa6] rounded focus:ring-[#224fa6]"
                            />
                            <label htmlFor="editSleepingNights" className="text-sm font-semibold text-gray-900 cursor-pointer">
                              Eligible for Sleeping Night Shifts (SN)
                            </label>
                          </div>
                          {formData.sleepingNights && (
                            <div className="max-w-xs">
                              <label className="block text-xs font-semibold text-gray-700 mb-1">Cost for SN (£ / shift)</label>
                              <input
                                type="number"
                                step="0.01"
                                value={formData.costForSleepingNights}
                                onChange={(e) => setFormData({ ...formData, costForSleepingNights: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* EDIT TAB 3: Compliance & DBS */}
                    {editActiveTab === 'compliance' && (
                      <div className="space-y-4">
                        <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm space-y-4">
                          <h4 className="text-base font-bold text-gray-900 border-b pb-2">🛡️ DBS Information</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">DBS Check Date</label>
                              <input
                                type="date"
                                value={formData.dbsDate}
                                onChange={(e) => setFormData({ ...formData, dbsDate: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">DBS Update Code</label>
                              <input
                                type="text"
                                value={formData.dbsUpdateCode}
                                onChange={(e) => setFormData({ ...formData, dbsUpdateCode: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900 font-mono"
                              />
                            </div>
                          </div>

                          {/* Live DBS Indicator */}
                          {(() => {
                            const dbs = getDbsStatus(formData.dbsDate);
                            return (
                              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                                dbs.color === 'green' ? 'bg-green-50 text-green-800 border-green-200' :
                                dbs.color === 'amber' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                dbs.color === 'red' ? 'bg-red-50 text-red-800 border-red-200' :
                                'bg-gray-50 text-gray-600 border-gray-200'
                              }`}>
                                <span className="font-bold">Status: {dbs.label}</span>
                                {dbs.expiryDate && <span>3-Year Expiry Date: {dbs.expiryDate}</span>}
                              </div>
                            );
                          })()}
                        </div>

                        <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm space-y-4">
                          <h4 className="text-base font-bold text-gray-900 border-b pb-2">🛂 Right to Work & Visas</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">Sponsorship Status</label>
                              <select
                                value={formData.sponsorshipStatus}
                                onChange={(e) => setFormData({ ...formData, sponsorshipStatus: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                              >
                                <option value="">Select Status</option>
                                <option value="British Citizen">British Citizen</option>
                                <option value="Irish Citizen">Irish Citizen</option>
                                <option value="Settled Status (ILR)">Settled Status (ILR)</option>
                                <option value="Pre-Settled Status">Pre-Settled Status</option>
                                <option value="Skilled Worker Visa">Skilled Worker Visa</option>
                                <option value="Health & Care Worker Visa">Health & Care Worker Visa</option>
                                <option value="Student Visa">Student Visa</option>
                                <option value="Graduate Visa">Graduate Visa</option>
                                <option value="Family / Spouse Visa">Family / Spouse Visa</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">Share Code</label>
                              <input
                                type="text"
                                value={formData.shareCode}
                                onChange={(e) => setFormData({ ...formData, shareCode: e.target.value.toUpperCase() })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900 font-mono font-semibold"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">Visa Expiry Date</label>
                              <input
                                type="date"
                                value={formData.visaExpiryDate}
                                onChange={(e) => setFormData({ ...formData, visaExpiryDate: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] bg-white text-gray-900"
                              />
                            </div>
                          </div>

                          {/* Live Visa Indicator */}
                          {(() => {
                            const visa = getVisaStatus(formData.visaExpiryDate, formData.sponsorshipStatus);
                            return (
                              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                                visa.color === 'green' ? 'bg-green-50 text-green-800 border-green-200' :
                                visa.color === 'amber' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                visa.color === 'red' ? 'bg-red-50 text-red-800 border-red-200' :
                                'bg-gray-50 text-gray-600 border-gray-200'
                              }`}>
                                <span className="font-bold">Status: {visa.label}</span>
                                {formData.visaExpiryDate && <span>Expiry Date: {new Date(formData.visaExpiryDate).toLocaleDateString()}</span>}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* EDIT TAB 4: Driving Details */}
                    {editActiveTab === 'driving' && (
                      <div className="space-y-4">
                        <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm space-y-4">
                          <h4 className="text-base font-bold text-gray-900 border-b pb-2">🚗 Driving & Vehicle Information</h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-sm text-gray-900">Valid Driving Licence</p>
                                <p className="text-xs text-gray-500">Holds a valid UK/EU licence</p>
                              </div>
                              <input
                                type="checkbox"
                                checked={formData.drivingLicenceValid}
                                onChange={(e) => setFormData({ ...formData, drivingLicenceValid: e.target.checked })}
                                className="w-5 h-5 text-[#224fa6] rounded focus:ring-[#224fa6]"
                              />
                            </div>

                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-sm text-gray-900">Own A Car</p>
                                <p className="text-xs text-gray-500">Access to own vehicle</p>
                              </div>
                              <input
                                type="checkbox"
                                checked={formData.ownCar}
                                onChange={(e) => setFormData({ ...formData, ownCar: e.target.checked })}
                                className="w-5 h-5 text-[#224fa6] rounded focus:ring-[#224fa6]"
                              />
                            </div>
                          </div>

                          {formData.ownCar && (
                            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
                              <h5 className="text-xs font-bold text-[#224fa6] uppercase tracking-wider">Vehicle Details</h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-1">Make</label>
                                  <input
                                    type="text"
                                    value={formData.carMake}
                                    onChange={(e) => setFormData({ ...formData, carMake: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-1">Model</label>
                                  <input
                                    type="text"
                                    value={formData.carModel}
                                    onChange={(e) => setFormData({ ...formData, carModel: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-1">Colour</label>
                                  <input
                                    type="text"
                                    value={formData.carColour}
                                    onChange={(e) => setFormData({ ...formData, carColour: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-1">Registration</label>
                                  <input
                                    type="text"
                                    value={formData.carRegistration}
                                    onChange={(e) => setFormData({ ...formData, carRegistration: e.target.value.toUpperCase() })}
                                    className="w-full px-3 py-2 border border-amber-300 bg-amber-50 rounded-lg text-sm font-mono font-bold"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-sm text-gray-900">Car Insurance Verified</p>
                                <p className="text-xs text-gray-500">Insurance certificate verified</p>
                              </div>
                              <input
                                type="checkbox"
                                checked={formData.carInsuranceVerified}
                                onChange={(e) => setFormData({ ...formData, carInsuranceVerified: e.target.checked })}
                                className="w-5 h-5 text-[#224fa6] rounded focus:ring-[#224fa6]"
                              />
                            </div>

                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-sm text-gray-900">Business Insurance Cover</p>
                                <p className="text-xs text-gray-500">Business class use covered</p>
                              </div>
                              <input
                                type="checkbox"
                                checked={formData.businessInsurance}
                                onChange={(e) => setFormData({ ...formData, businessInsurance: e.target.checked })}
                                className="w-5 h-5 text-[#224fa6] rounded focus:ring-[#224fa6]"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* EDIT TAB 5: Health & Emergency */}
                    {editActiveTab === 'health' && (
                      <div className="space-y-4">
                        <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm space-y-4">
                          <h4 className="text-base font-bold text-gray-900 border-b pb-2">Next of Kin / Emergency Contact</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">NOK Name</label>
                              <input
                                type="text"
                                value={formData.emergencyName}
                                onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">NOK Relationship</label>
                              <input
                                type="text"
                                value={formData.nokRelationship}
                                onChange={(e) => setFormData({ ...formData, nokRelationship: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">NOK Phone Number</label>
                              <input
                                type="tel"
                                value={formData.emergencyContact}
                                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm space-y-4">
                          <h4 className="text-base font-bold text-gray-900 border-b pb-2">GP Details & Medical</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">GP Practice & Doctor</label>
                              <textarea
                                rows={2}
                                value={formData.gpDetails}
                                onChange={(e) => setFormData({ ...formData, gpDetails: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">Vaccination Status</label>
                              <input
                                type="text"
                                value={formData.vaccinationStatus}
                                onChange={(e) => setFormData({ ...formData, vaccinationStatus: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm"
                              />
                              <div className="mt-3 flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="editPaysForPrescriptions"
                                  checked={formData.paysForPrescriptions}
                                  onChange={(e) => setFormData({ ...formData, paysForPrescriptions: e.target.checked })}
                                  className="w-4 h-4 text-[#224fa6] rounded"
                                />
                                <label htmlFor="editPaysForPrescriptions" className="text-xs font-semibold text-gray-700 cursor-pointer">
                                  Pays for Prescriptions (Px's)
                                </label>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">Allergy Status</label>
                              <select
                                value={formData.allergyStatus}
                                onChange={(e) => setFormData({ ...formData, allergyStatus: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white"
                              >
                                <option value="None">None Known</option>
                                <option value="Has Known Allergies">Has Known Allergies</option>
                              </select>
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-semibold text-gray-700 mb-1">Allergies Description</label>
                              <input
                                type="text"
                                value={formData.allergies}
                                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* EDIT TAB 6: Permissions */}
                    {editActiveTab === 'permissions' && (
                      <div className="space-y-4">
                        {!['CAREWORKER', 'SUPPORT_WORKER'].includes(roles.find(r => r.id == formData.roleId)?.name) ? (
                          <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                            <h4 className="text-sm font-bold text-gray-900 mb-3">Adjust Assigned Permissions</h4>
                            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-xl bg-white shadow-inner">
                              <PermissionMatrix
                                selectedPermissions={formData.permissions}
                                onChange={(newPermissions) => setFormData({ ...formData, permissions: newPermissions })}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
                            Care Workers and Support Workers are assigned all standard frontline permissions by default.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Submit Actions */}
                    <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => setShowEditModal(false)}
                        className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-8 py-3 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Updating...' : 'Update Staff Member'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Archive Confirmation Modal */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-amber-100 rounded-full">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Archive Staff Member
              </h3>

              <p className="text-sm text-gray-600 text-center mb-6">
                Are you sure you want to archive <span className="font-medium text-gray-900">&quot;{staffToArchive?.firstName} {staffToArchive?.lastName}&quot;</span>?
                They will be moved to the Archived list and removed from shift scheduling, rotas, and daily tasks across the system. You can restore them anytime.
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => { setShowArchiveConfirm(false); setStaffToArchive(null); }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleArchiveConfirm}
                  className="flex-1 px-4 py-2 text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors duration-200 font-medium"
                >
                  Archive
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Delete User
              </h3>

              <p className="text-sm text-gray-600 text-center mb-6">
                Are you sure you want to delete <span className="font-medium text-gray-900">&quot;{staffToDelete?.firstName} {staffToDelete?.lastName}&quot;</span>?
                This action cannot be undone and will remove all associated data.
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

