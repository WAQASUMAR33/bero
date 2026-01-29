'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PoliciesPage() {
    const router = useRouter();
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, SIGNED, PENDING
    const [selectedPolicy, setSelectedPolicy] = useState(null);
    const [showPolicyModal, setShowPolicyModal] = useState(false);
    const [isSigning, setIsSigning] = useState(false);
    const [signSuccess, setSignSuccess] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPolicies();
    }, []);

    const fetchPolicies = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/care-worker-login');
                return;
            }

            const response = await fetch('/api/policies', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setPolicies(data.data || []);
                }
            }
        } catch (err) {
            console.error('Error fetching policies', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (status) => {
        setFilterStatus(status);
    };

    const filteredPolicies = policies.filter(p => {
        if (filterStatus === 'ALL') return true;
        if (filterStatus === 'SIGNED') return p.isSigned;
        if (filterStatus === 'PENDING') return !p.isSigned;
        return true;
    });

    const openPolicyModal = (policy) => {
        setSelectedPolicy(policy);
        setShowPolicyModal(true);
        setSignSuccess(false);
        setError(null);
    };

    const handleSignPolicy = async () => {
        if (!selectedPolicy) return;

        setIsSigning(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError("Authentication failed");
                return;
            }

            const response = await fetch(`/api/policies/${selectedPolicy.id}/sign`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setSignSuccess(true);
                // Update the local state
                setPolicies(prev => prev.map(p =>
                    p.id === selectedPolicy.id ? { ...p, isSigned: true } : p
                ));
                setSelectedPolicy(prev => ({ ...prev, isSigned: true }));
            } else {
                setError(result.error || 'Failed to sign policy');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setIsSigning(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    const getFileIcon = (fileName) => {
        if (!fileName) return '📄';
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') return '📕';
        if (['doc', 'docx'].includes(ext)) return '📘';
        if (['xls', 'xlsx'].includes(ext)) return '📗';
        return '📄';
    };

    const signedCount = policies.filter(p => p.isSigned).length;
    const pendingCount = policies.filter(p => !p.isSigned).length;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Policies & Procedures</h1>
                    <p className="text-sm text-gray-500">View and sign company policies</p>
                </div>
            </div>

            {/* Stats / Filters */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { key: 'ALL', label: 'All Policies', count: policies.length },
                    { key: 'PENDING', label: 'Pending', count: pendingCount },
                    { key: 'SIGNED', label: 'Signed', count: signedCount }
                ].map((item) => (
                    <button
                        key={item.key}
                        onClick={() => handleFilterChange(item.key)}
                        className={`p-4 rounded-xl border transition-all text-left group ${filterStatus === item.key
                            ? 'bg-blue-50 border-[#224fa6] ring-1 ring-[#224fa6]'
                            : 'bg-white border-gray-100 hover:border-blue-100 hover:shadow-sm'
                            }`}
                    >
                        <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${filterStatus === item.key ? 'text-[#224fa6]' : 'text-gray-400 group-hover:text-[#224fa6]'
                            }`}>
                            {item.label}
                        </p>
                        <p className={`text-2xl font-bold ${filterStatus === item.key ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                            {item.count}
                        </p>
                    </button>
                ))}
            </div>

            {/* Pending Alert Banner */}
            {pendingCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-bold text-amber-800">Action Required</h3>
                        <p className="text-sm text-amber-700 mt-0.5">
                            You have <span className="font-bold">{pendingCount}</span> {pendingCount === 1 ? 'policy' : 'policies'} pending your signature. Please review and sign.
                        </p>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#224fa6]" />
                    </div>
                ) : filteredPolicies.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No policies found</h3>
                        <p className="text-gray-500 text-sm mt-1 mb-6">
                            {filterStatus === 'ALL'
                                ? 'No policies have been uploaded yet.'
                                : `No ${filterStatus.toLowerCase()} policies.`}
                        </p>
                        {filterStatus !== 'ALL' && (
                            <button onClick={() => setFilterStatus('ALL')} className="text-[#224fa6] font-semibold hover:underline">
                                View all policies
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {filteredPolicies.map((policy) => (
                            <div
                                key={policy.id}
                                onClick={() => openPolicyModal(policy)}
                                className="p-6 hover:bg-gray-50/50 transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl bg-blue-50 shadow-sm">
                                        {getFileIcon(policy.fileName)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <h3 className="font-bold text-gray-900">{policy.name}</h3>
                                            {policy.isSigned ? (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-green-100 text-green-700 border-green-200 flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Signed
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-amber-100 text-amber-700 border-amber-200">
                                                    Pending
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
                                            <span className="flex items-center gap-1">
                                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                                {policy.fileName || 'No file attached'}
                                            </span>
                                            {policy.reviewIn && (
                                                <span className="flex items-center gap-1 text-gray-500">
                                                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    Review in {policy.reviewIn} days
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right text-xs text-gray-400 flex flex-col items-end gap-1">
                                    <span>Updated {formatDate(policy.updatedAt)}</span>
                                    <span className="text-gray-500">
                                        {policy.signedCount} / {policy.totalStaffCount} signed
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Policy Detail Modal */}
            {showPolicyModal && selectedPolicy && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl scale-in-95 animate-in zoom-in-95 max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="flex justify-between items-start p-6 border-b border-gray-100">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl bg-blue-50 shadow-sm flex-shrink-0">
                                    {getFileIcon(selectedPolicy.fileName)}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 leading-tight">{selectedPolicy.name}</h2>
                                    <p className="text-sm text-gray-500 mt-1">{selectedPolicy.fileName || 'No file attached'}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowPolicyModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1">
                            {/* Status Badge */}
                            <div className="mb-6">
                                {selectedPolicy.isSigned ? (
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-green-800">You've signed this policy</h3>
                                            <p className="text-sm text-green-700">Thank you for acknowledging this policy.</p>
                                        </div>
                                    </div>
                                ) : signSuccess ? (
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                                            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-green-800">Policy Signed Successfully!</h3>
                                            <p className="text-sm text-green-700">Your signature has been recorded.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-amber-800">Signature Required</h3>
                                            <p className="text-sm text-amber-700">Please read and sign this policy.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 border border-red-100">
                                    {error}
                                </div>
                            )}

                            {/* Policy Details */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Created</p>
                                        <p className="text-sm font-semibold text-gray-900">{formatDate(selectedPolicy.createdAt)}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Last Updated</p>
                                        <p className="text-sm font-semibold text-gray-900">{formatDate(selectedPolicy.updatedAt)}</p>
                                    </div>
                                    {selectedPolicy.reviewIn && (
                                        <div className="bg-gray-50 rounded-xl p-4">
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Review Period</p>
                                            <p className="text-sm font-semibold text-gray-900">{selectedPolicy.reviewIn} days</p>
                                        </div>
                                    )}
                                    {selectedPolicy.lastReviewed && (
                                        <div className="bg-gray-50 rounded-xl p-4">
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Last Reviewed</p>
                                            <p className="text-sm font-semibold text-gray-900">{formatDate(selectedPolicy.lastReviewed)}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Signature Stats */}
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Signature Progress</p>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="bg-[#224fa6] h-full rounded-full transition-all duration-500"
                                                style={{ width: `${selectedPolicy.totalStaffCount > 0 ? (selectedPolicy.signedCount / selectedPolicy.totalStaffCount) * 100 : 0}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-bold text-gray-700">
                                            {selectedPolicy.signedCount}/{selectedPolicy.totalStaffCount}
                                        </span>
                                    </div>
                                </div>

                                {/* Created By */}
                                {selectedPolicy.createdBy && (
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Created By</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {selectedPolicy.createdBy.firstName} {selectedPolicy.createdBy.lastName}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-gray-100 bg-gray-50/50 space-y-3">
                            {/* View Document Button */}
                            {selectedPolicy.fileUrl ? (
                                <a
                                    href={selectedPolicy.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-3 rounded-xl border-2 border-[#224fa6] text-[#224fa6] font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                    View Document
                                </a>
                            ) : (
                                <div className="w-full py-3 rounded-xl border-2 border-gray-200 text-gray-400 font-bold text-center cursor-not-allowed">
                                    No Document Available
                                </div>
                            )}

                            {/* Sign Button */}
                            {!selectedPolicy.isSigned && !signSuccess && (
                                <button
                                    onClick={handleSignPolicy}
                                    disabled={isSigning}
                                    className="w-full py-3 rounded-xl bg-[#224fa6] text-white font-bold hover:bg-[#1e438f] shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {isSigning ? (
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                            I Acknowledge & Sign
                                        </>
                                    )}
                                </button>
                            )}

                            {/* Close Button */}
                            <button
                                onClick={() => setShowPolicyModal(false)}
                                className="w-full py-3 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
