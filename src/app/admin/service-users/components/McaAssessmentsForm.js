'use client';

import { useEffect, useState } from 'react';

export default function McaAssessmentsForm({ serviceSeekerId, serviceUserName, onNotification }) {
  const [assessments, setAssessments] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState(null);
  const [staffList, setStaffList] = useState([]);
  
  const [formData, setFormData] = useState({
    risk: '',
    lastAssessed: '',
    triggeredBy: '',
    hasImpairment: '',
    clinicalDiagnosis: '',
    decisionToMake: '',
    isImpairment: '',
    fluctuatingCapacity: '',
    fluctuatingCapacityReason: '',
    generalUnderstanding: '',
    generalUnderstandingDetails: '',
    canRetainInformation: '',
    canRetainInformationDetails: '',
    canUseWeighInformation: '',
    canUseWeighInformationDetails: '',
    canCommunicate: '',
    healthWelfareLpa: '',
    advancedDecision: '',
    deputyAppointed: '',
    imcaRequired: '',
    imcaName: '',
    imcaTelephone: '',
    option1: '',
    option2: '',
    option3: '',
    pastPresentWishes: '',
    pastPresentWishesDetails: '',
    consultedInterestedParties: '',
    consultedInterestedPartiesDetails: '',
    consultedProfessionals: '',
    consultedProfessionalsDetails: '',
    bestInterestDecision: '',
    decisionMade: '',
    leastRestrictivePrinciple: '',
    disagreement: '',
    disagreementDetails: '',
    everyOptionExplored: '',
    patientRecordsUpdated: '',
    useOfRestraint: '',
    misinformation: '',
    anyoneObjected: '',
    restraintForTreatment: '',
    relativesRequestedDischarge: '',
    restrictedAccessToFamily: '',
    leastRestrictiveOptions: '',
    restrictedAccessToCommunity: '',
    continuousSupervision: '',
    riskLevel: '',
    totalScore: '',
    staffTeam: '',
    office: '',
    sendSignoffs: '',
    conductedBy: '',
  });

  const riskOptions = ['Capacity - Generic'];
  const yesNoOptions = ['Yes', 'No'];
  const pleaseSelectOptions = ['Please Select'];

  useEffect(() => {
    fetchAssessments();
    fetchStaffList();
  }, [serviceSeekerId]);

  const fetchStaffList = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStaffList(data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAssessments = async () => {
    if (!serviceSeekerId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/mca-assessments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAssessments(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr || '-';
    }
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAdd = () => {
    setFormData({
      risk: '',
      lastAssessed: '',
      triggeredBy: '',
      hasImpairment: '',
      clinicalDiagnosis: '',
      decisionToMake: '',
      isImpairment: '',
      fluctuatingCapacity: '',
      fluctuatingCapacityReason: '',
      generalUnderstanding: '',
      generalUnderstandingDetails: '',
      canRetainInformation: '',
      canRetainInformationDetails: '',
      canUseWeighInformation: '',
      canUseWeighInformationDetails: '',
      canCommunicate: '',
      healthWelfareLpa: '',
      advancedDecision: '',
      deputyAppointed: '',
      imcaRequired: '',
      imcaName: '',
      imcaTelephone: '',
      option1: '',
      option2: '',
      option3: '',
      pastPresentWishes: '',
      pastPresentWishesDetails: '',
      consultedInterestedParties: '',
      consultedInterestedPartiesDetails: '',
      consultedProfessionals: '',
      consultedProfessionalsDetails: '',
      bestInterestDecision: '',
      decisionMade: '',
      leastRestrictivePrinciple: '',
      disagreement: '',
      disagreementDetails: '',
      everyOptionExplored: '',
      patientRecordsUpdated: '',
      useOfRestraint: '',
      misinformation: '',
      anyoneObjected: '',
      restraintForTreatment: '',
      relativesRequestedDischarge: '',
      restrictedAccessToFamily: '',
      leastRestrictiveOptions: '',
      restrictedAccessToCommunity: '',
      continuousSupervision: '',
      riskLevel: '',
      totalScore: '',
      staffTeam: '',
      office: '',
      sendSignoffs: '',
      conductedBy: '',
    });
    setEditingId(null);
    setShowAddModal(true);
  };

  const handleEdit = (item) => {
    setFormData({
      risk: item.risk || '',
      lastAssessed: item.lastAssessed ? new Date(item.lastAssessed).toISOString().substring(0, 10) : '',
      triggeredBy: item.triggeredBy || '',
      hasImpairment: item.hasImpairment || '',
      clinicalDiagnosis: item.clinicalDiagnosis || '',
      decisionToMake: item.decisionToMake || '',
      isImpairment: item.isImpairment || '',
      fluctuatingCapacity: item.fluctuatingCapacity || '',
      fluctuatingCapacityReason: item.fluctuatingCapacityReason || '',
      generalUnderstanding: item.generalUnderstanding || '',
      generalUnderstandingDetails: item.generalUnderstandingDetails || '',
      canRetainInformation: item.canRetainInformation || '',
      canRetainInformationDetails: item.canRetainInformationDetails || '',
      canUseWeighInformation: item.canUseWeighInformation || '',
      canUseWeighInformationDetails: item.canUseWeighInformationDetails || '',
      canCommunicate: item.canCommunicate || '',
      healthWelfareLpa: item.healthWelfareLpa || '',
      advancedDecision: item.advancedDecision || '',
      deputyAppointed: item.deputyAppointed || '',
      imcaRequired: item.imcaRequired || '',
      imcaName: item.imcaName || '',
      imcaTelephone: item.imcaTelephone || '',
      option1: item.option1 || '',
      option2: item.option2 || '',
      option3: item.option3 || '',
      pastPresentWishes: item.pastPresentWishes || '',
      pastPresentWishesDetails: item.pastPresentWishesDetails || '',
      consultedInterestedParties: item.consultedInterestedParties || '',
      consultedInterestedPartiesDetails: item.consultedInterestedPartiesDetails || '',
      consultedProfessionals: item.consultedProfessionals || '',
      consultedProfessionalsDetails: item.consultedProfessionalsDetails || '',
      bestInterestDecision: item.bestInterestDecision || '',
      decisionMade: item.decisionMade || '',
      leastRestrictivePrinciple: item.leastRestrictivePrinciple || '',
      disagreement: item.disagreement || '',
      disagreementDetails: item.disagreementDetails || '',
      everyOptionExplored: item.everyOptionExplored || '',
      patientRecordsUpdated: item.patientRecordsUpdated || '',
      useOfRestraint: item.useOfRestraint || '',
      misinformation: item.misinformation || '',
      anyoneObjected: item.anyoneObjected || '',
      restraintForTreatment: item.restraintForTreatment || '',
      relativesRequestedDischarge: item.relativesRequestedDischarge || '',
      restrictedAccessToFamily: item.restrictedAccessToFamily || '',
      leastRestrictiveOptions: item.leastRestrictiveOptions || '',
      restrictedAccessToCommunity: item.restrictedAccessToCommunity || '',
      continuousSupervision: item.continuousSupervision || '',
      riskLevel: item.riskLevel || '',
      totalScore: item.totalScore || '',
      staffTeam: item.staffTeam || '',
      office: item.office || '',
      sendSignoffs: item.sendSignoffs || '',
      conductedBy: item.conductedBy || '',
    });
    setEditingId(item.id);
    setShowAddModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const isEdit = editingId !== null;
      const url = `/api/service-seekers/${serviceSeekerId}/mca-assessments`;
      const method = isEdit ? 'PUT' : 'POST';
      
      const payload = {
        ...formData,
        lastAssessed: formData.lastAssessed || null,
        ...(isEdit ? { id: editingId } : {}),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchAssessments();
        setShowAddModal(false);
        if (onNotification) {
          onNotification({ show: true, message: isEdit ? 'Assessment updated successfully.' : 'Assessment added successfully.', type: 'success' });
        }
      } else {
        const error = await res.json();
        if (onNotification) {
          onNotification({ show: true, message: error.error || 'Failed to save assessment.', type: 'error' });
        }
      }
    } catch (e) {
      console.error(e);
      if (onNotification) {
        onNotification({ show: true, message: 'Failed to save assessment.', type: 'error' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!assessmentToDelete) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/service-seekers/${serviceSeekerId}/mca-assessments?id=${assessmentToDelete}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchAssessments();
        setShowDeleteConfirm(false);
        setAssessmentToDelete(null);
        if (onNotification) {
          onNotification({ show: true, message: 'Assessment deleted successfully.', type: 'success' });
        }
      } else {
        const error = await res.json();
        if (onNotification) {
          onNotification({ show: true, message: error.error || 'Failed to delete assessment.', type: 'error' });
        }
      }
    } catch (e) {
      console.error(e);
      if (onNotification) {
        onNotification({ show: true, message: 'Failed to delete assessment.', type: 'error' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setShowAddModal(false);
    setEditingId(null);
  };

  const handleReview = (item) => {
    handleEdit(item);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8 border-t-4 border-[#224fa6]">
      {/* Blue Header */}
      <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
        <h2 className="text-xl font-semibold">MCA Assessments</h2>
      </div>
      
      <div className="p-6">

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : assessments.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">No assessments found</p>
          <p className="text-sm text-gray-400">Click the Add button to add an assessment.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Last Assessed</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Risk</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Score</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Risk Level</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Conducted By</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Modified</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((item, idx) => (
                <tr key={item.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`}>
                  <td className="py-3 px-4 text-sm text-gray-900">{formatDate(item.lastAssessed)}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{item.risk || '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{item.totalScore || '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{item.riskLevel || '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{item.conductedBy || '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{formatDate(item.createdAt)}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{formatDate(item.updatedAt)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() => handleReview(item)}
                        className="text-[#224fa6] hover:text-[#224fa6]/80 text-sm"
                      >
                        Review
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAssessmentToDelete(item.id);
                          setShowDeleteConfirm(true);
                        }}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Select items to delete or review</span>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-lg hover:from-[#1a3d85] hover:to-[#2859c7] transition-all shadow-md hover:shadow-lg font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Blue Header */}
            <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">{editingId ? 'Edit Assessment' : 'Add Assessment'}</h3>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="text-white/80 hover:text-white text-2xl leading-none transition-colors"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Assessment Section */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Assessment</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Service User</label>
                    <input
                      type="text"
                      value={serviceUserName || ''}
                      disabled
                      className="w-full border rounded-lg px-3 py-2 text-gray-500 bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Risk</label>
                    <select
                      value={formData.risk}
                      onChange={e => handleFieldChange('risk', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                    >
                      <option value="">Please Select</option>
                      {riskOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Last Assessed</label>
                    <input
                      type="date"
                      value={formData.lastAssessed}
                      onChange={e => handleFieldChange('lastAssessed', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">What triggered the Capacity Assessment?</label>
                    <input
                      type="text"
                      value={formData.triggeredBy}
                      onChange={e => handleFieldChange('triggeredBy', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                      placeholder="Diagnostic Test"
                    />
                  </div>
                </div>
              </div>

              {/* Diagnostic Test Section */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Diagnostic Test</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Does the person have an impairment of, or disturbance in the functioning of, the mind or brain?</label>
                    <select
                      value={formData.hasImpairment}
                      onChange={e => handleFieldChange('hasImpairment', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                    >
                      <option value="">Please Select</option>
                      {yesNoOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Clinical Diagnosis: Where there is an impairment, or disturbance arising out of a specific diagnosis, please set out the diagnosis or diagnoses here.</label>
                    <textarea
                      value={formData.clinicalDiagnosis}
                      onChange={e => handleFieldChange('clinicalDiagnosis', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                      rows={3}
                      placeholder="Enter clinical diagnosis"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">What is the decision that needs to be made?</label>
                    <textarea
                      value={formData.decisionToMake}
                      onChange={e => handleFieldChange('decisionToMake', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                      rows={2}
                      placeholder="Enter decision"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Is this impairment?</label>
                    <select
                      value={formData.isImpairment}
                      onChange={e => handleFieldChange('isImpairment', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                    >
                      <option value="">Please Select</option>
                      {yesNoOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">If the person has fluctuating capacity - does the decision need to be made immediately?</label>
                    <select
                      value={formData.fluctuatingCapacity}
                      onChange={e => handleFieldChange('fluctuatingCapacity', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                    >
                      <option value="">Please Select</option>
                      {yesNoOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Please explain why</label>
                    <textarea
                      value={formData.fluctuatingCapacityReason}
                      onChange={e => handleFieldChange('fluctuatingCapacityReason', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                      rows={2}
                      placeholder="Enter explanation"
                    />
                  </div>
                </div>
              </div>

              {/* Functional test Section */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Functional test</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Does the person have a general understanding of the decision they need to make, why they need to make it and the likely consequences of making the decision? (including the consequences of making no decision at all?)</label>
                    <select
                      value={formData.generalUnderstanding}
                      onChange={e => handleFieldChange('generalUnderstanding', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                    >
                      <option value="">Please Select</option>
                      {yesNoOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Please give details</label>
                    <textarea
                      value={formData.generalUnderstandingDetails}
                      onChange={e => handleFieldChange('generalUnderstandingDetails', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                      rows={2}
                      placeholder="Enter details"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Is the client able retain information relevant to the decision long enough to take it?</label>
                    <select
                      value={formData.canRetainInformation}
                      onChange={e => handleFieldChange('canRetainInformation', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                    >
                      <option value="">Please Select</option>
                      {yesNoOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Please give details</label>
                    <textarea
                      value={formData.canRetainInformationDetails}
                      onChange={e => handleFieldChange('canRetainInformationDetails', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                      rows={2}
                      placeholder="Enter details"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Is the person able to use or weigh information relevant to the decision, as part of the process of making the decision.</label>
                    <select
                      value={formData.canUseWeighInformation}
                      onChange={e => handleFieldChange('canUseWeighInformation', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                    >
                      <option value="">Please Select</option>
                      {yesNoOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Please give details</label>
                    <textarea
                      value={formData.canUseWeighInformationDetails}
                      onChange={e => handleFieldChange('canUseWeighInformationDetails', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                      rows={2}
                      placeholder="Enter details"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Is the person able to communicate their decision? (by talking, using sign language, or any means at all)</label>
                    <select
                      value={formData.canCommunicate}
                      onChange={e => handleFieldChange('canCommunicate', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                    >
                      <option value="">Please Select</option>
                      {yesNoOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Advanced Decision Section */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Advanced Decision</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Has the person made a Health and welfare Lasting Power of Attorney which has been registered and gives the attorney(s) the authority to make the decision in question?</label>
                    <select
                      value={formData.healthWelfareLpa}
                      onChange={e => handleFieldChange('healthWelfareLpa', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                    >
                      <option value="">Please Select</option>
                      {yesNoOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Has the person made a valid, applicable advanced decision to refuse treatment that the decision is about?</label>
                    <select
                      value={formData.advancedDecision}
                      onChange={e => handleFieldChange('advancedDecision', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                    >
                      <option value="">Please Select</option>
                      {yesNoOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Has a Deputy been appointed by the Court with the power to make the decision in question?</label>
                    <select
                      value={formData.deputyAppointed}
                      onChange={e => handleFieldChange('deputyAppointed', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                    >
                      <option value="">Please Select</option>
                      {yesNoOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Best Interest Decision Section */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Best Interest Decision</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Is an IMCA referral required? If there is no one to consult (other than paid staff) to support or represent the person or be consulted as part of the best interest decision process.</label>
                    <select
                      value={formData.imcaRequired}
                      onChange={e => handleFieldChange('imcaRequired', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                    >
                      <option value="">Please Select</option>
                      {yesNoOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Name of IMCA</label>
                    <input
                      type="text"
                      value={formData.imcaName}
                      onChange={e => handleFieldChange('imcaName', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                      placeholder="Enter IMCA name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">IMCA Telephone number</label>
                    <input
                      type="text"
                      value={formData.imcaTelephone}
                      onChange={e => handleFieldChange('imcaTelephone', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                      placeholder="Enter telephone number"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">What are the options available as they relate to the decision in question? Please consider the positives and negative aspects of each option and note which is the least restrictive in terms of the persons rights and freedom of actions.</label>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Option 1</label>
                    <textarea
                      value={formData.option1}
                      onChange={e => handleFieldChange('option1', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                      rows={3}
                      placeholder="Enter option 1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Option 2</label>
                    <textarea
                      value={formData.option2}
                      onChange={e => handleFieldChange('option2', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                      rows={3}
                      placeholder="Enter option 2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Option 3</label>
                    <textarea
                      value={formData.option3}
                      onChange={e => handleFieldChange('option3', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                      rows={3}
                      placeholder="Enter option 3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Have you identified and considered the person&apos;s past and present wishes and preferences, beliefs and values (including their treatment preferences) whether written or verbal?</label>
                    <select
                      value={formData.pastPresentWishes}
                      onChange={e => handleFieldChange('pastPresentWishes', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                    >
                      <option value="">Please Select</option>
                      {yesNoOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">What were these views?</label>
                    <textarea
                      value={formData.pastPresentWishesDetails}
                      onChange={e => handleFieldChange('pastPresentWishesDetails', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                      rows={3}
                      placeholder="Enter views"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Have you consulted and taken into account the views of interested parties (family carers, friends, advocate, deputy or attorney)</label>
                    <select
                      value={formData.consultedInterestedParties}
                      onChange={e => handleFieldChange('consultedInterestedParties', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                    >
                      <option value="">Please Select</option>
                      {yesNoOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">If yes who was consulted and what was their view?</label>
                    <textarea
                      value={formData.consultedInterestedPartiesDetails}
                      onChange={e => handleFieldChange('consultedInterestedPartiesDetails', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                      rows={3}
                      placeholder="Enter details"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Have the views of professionals involved in the person&apos;s care been consulted ?</label>
                    <select
                      value={formData.consultedProfessionals}
                      onChange={e => handleFieldChange('consultedProfessionals', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                    >
                      <option value="">Please Select</option>
                      {yesNoOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Please give details</label>
                    <textarea
                      value={formData.consultedProfessionalsDetails}
                      onChange={e => handleFieldChange('consultedProfessionalsDetails', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                      rows={3}
                      placeholder="Enter details"
                    />
                  </div>
                </div>
              </div>

              {/* Decision Section */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Decision</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Which option have you decided is in the person&apos;s best interests and why?</label>
                    <textarea
                      value={formData.bestInterestDecision}
                      onChange={e => handleFieldChange('bestInterestDecision', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                      rows={3}
                      placeholder="Enter decision"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Please record clearly the decision made</label>
                    <textarea
                      value={formData.decisionMade}
                      onChange={e => handleFieldChange('decisionMade', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                      rows={3}
                      placeholder="Enter decision"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Please describe how your decision reflects the least restrictive principle</label>
                    <textarea
                      value={formData.leastRestrictivePrinciple}
                      onChange={e => handleFieldChange('leastRestrictivePrinciple', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                      rows={3}
                      placeholder="Enter description"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Was there any disagreement in reaching this decision?</label>
                    <select
                      value={formData.disagreement}
                      onChange={e => handleFieldChange('disagreement', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                    >
                      <option value="">Please Select</option>
                      {yesNoOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">If yes please give details and describe what actions are being taken to seek resolution</label>
                    <textarea
                      value={formData.disagreementDetails}
                      onChange={e => handleFieldChange('disagreementDetails', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                      rows={3}
                      placeholder="Enter details"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Has every option been explored to communicate the decision to the person?</label>
                    <select
                      value={formData.everyOptionExplored}
                      onChange={e => handleFieldChange('everyOptionExplored', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                    >
                      <option value="">Please Select</option>
                      {yesNoOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Patient records updated in home?</label>
                    <select
                      value={formData.patientRecordsUpdated}
                      onChange={e => handleFieldChange('patientRecordsUpdated', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                    >
                      <option value="">Please Select</option>
                      {yesNoOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Deprivation of Liberty Checklist Section */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Deprivation of Liberty Checklist</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Will the Best Interest Decision result in any of the following? Use of restraint on admission because the person is resisting or objecting to admission ot the home?</label>
                    <select
                      value={formData.useOfRestraint}
                      onChange={e => handleFieldChange('useOfRestraint', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                    >
                      <option value="">Please Select</option>
                      {yesNoOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Misinformation to the person to admit them?</label>
                    <select
                      value={formData.misinformation}
                      onChange={e => handleFieldChange('misinformation', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                    >
                      <option value="">Please Select</option>
                      {yesNoOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Did anyone object to admitting the person as part of the Best Interest Decision process?</label>
                    <select
                      value={formData.anyoneObjected}
                      onChange={e => handleFieldChange('anyoneObjected', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                    >
                      <option value="">Please Select</option>
                      {yesNoOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Is restraint likely to be used, has been used, because of resistance or refusal to treatment other than in an emergency?</label>
                    <select
                      value={formData.restraintForTreatment}
                      onChange={e => handleFieldChange('restraintForTreatment', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                    >
                      <option value="">Please Select</option>
                      {yesNoOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Have relatives/Carers requested the person&apos;s discharge into their care, and has this been refused?</label>
                    <select
                      value={formData.relativesRequestedDischarge}
                      onChange={e => handleFieldChange('relativesRequestedDischarge', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                    >
                      <option value="">Please Select</option>
                      {yesNoOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Has, or will, the person have restricted access to family or friends?</label>
                    <select
                      value={formData.restrictedAccessToFamily}
                      onChange={e => handleFieldChange('restrictedAccessToFamily', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                    >
                      <option value="">Please Select</option>
                      {yesNoOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Does the Care Plan use the least restrictive options available in the person&apos;s best interests?</label>
                    <select
                      value={formData.leastRestrictiveOptions}
                      onChange={e => handleFieldChange('leastRestrictiveOptions', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                    >
                      <option value="">Please Select</option>
                      {yesNoOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Has or will the person&apos;s access to the community been restricted due to safety concerns?</label>
                    <select
                      value={formData.restrictedAccessToCommunity}
                      onChange={e => handleFieldChange('restrictedAccessToCommunity', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                    >
                      <option value="">Please Select</option>
                      {yesNoOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Has or will the person be under continuous supervision and control (is the person free to leave?</label>
                    <select
                      value={formData.continuousSupervision}
                      onChange={e => handleFieldChange('continuousSupervision', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                    >
                      <option value="">Please Select</option>
                      {yesNoOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Summary Section */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Risk Level</label>
                    <select
                      value={formData.riskLevel}
                      onChange={e => handleFieldChange('riskLevel', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                    >
                      <option value="">Please Select</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Total Score</label>
                    <input
                      type="text"
                      value={formData.totalScore}
                      onChange={e => handleFieldChange('totalScore', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                      placeholder="Enter total score"
                    />
                  </div>
                </div>
              </div>

              {/* Signatures Section */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Signatures</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Staff/Team</label>
                    <select
                      value={formData.staffTeam}
                      onChange={e => handleFieldChange('staffTeam', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                    >
                      <option value="">Please Select</option>
                      {staffList.map(staff => (
                        <option key={staff.id} value={`${staff.firstName} ${staff.lastName}`}>
                          {staff.firstName} {staff.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Office</label>
                    <input
                      type="text"
                      value={formData.office}
                      onChange={e => handleFieldChange('office', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                      placeholder="Enter office"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Send Signoffs?</label>
                    <select
                      value={formData.sendSignoffs}
                      onChange={e => handleFieldChange('sendSignoffs', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                    >
                      <option value="">Please Select</option>
                      {yesNoOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Conducted By</label>
                    <select
                      value={formData.conductedBy}
                      onChange={e => handleFieldChange('conductedBy', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-gray-900"
                    >
                      <option value="">Please Select</option>
                      {staffList.map(staff => (
                        <option key={staff.id} value={`${staff.firstName} ${staff.lastName}`}>
                          {staff.firstName} {staff.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-70 disabled:cursor-not-allowed transition-all font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white font-medium hover:from-[#1a3d85] hover:to-[#2859c7] disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            {/* Blue Header */}
            <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
              <h3 className="text-xl font-semibold">Confirm Delete</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <p className="text-gray-700 mb-4">Are you sure you want to delete this assessment? This action cannot be undone.</p>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setAssessmentToDelete(null);
                  }}
                  className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                >
                  {saving ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

