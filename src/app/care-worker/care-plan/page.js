'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function SummaryRow({ label, value }) {
    return (
        <div className="mb-2 last:mb-0">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
            <p className="text-slate-900 font-medium text-sm break-words">{value ?? '-'}</p>
        </div>
    );
}

function SectionCard({ title, children, icon }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
            <div className="bg-slate-50/50 px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                <span className="text-lg">{icon}</span>
                <h2 className="text-base font-bold text-slate-800">{title}</h2>
            </div>
            <div className="p-5">
                {children}
            </div>
        </div>
    );
}

export default function CareWorkerCarePlanPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [serviceSeekerId, setServiceSeekerId] = useState(null);

    // Data States
    const [seeker, setSeeker] = useState(null);
    const [admission, setAdmission] = useState(null);
    const [healthTags, setHealthTags] = useState([]);
    const [medicalHistory, setMedicalHistory] = useState(null);
    const [contacts, setContacts] = useState([]);
    const [riskAssessments, setRiskAssessments] = useState([]);
    const [medicineSchedule, setMedicineSchedule] = useState([]);
    const [documents, setDocuments] = useState([]);

    useEffect(() => {
        findActiveShiftAndFetchData();
    }, []);

    const findActiveShiftAndFetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/care-worker-login');
                return;
            }

            // 1. Find Active Shift (Robust Check)
            const activeStatusRes = await fetch('/api/clock-in-out/active', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!activeStatusRes.ok) throw new Error("Failed to verify status");

            const activeData = await activeStatusRes.json();
            const activeClockIn = activeData.data;

            if (!activeClockIn) {
                console.log("No active clock-in returned from API");
                const debugId = activeData.searchedUserId ? ` (User ID: ${activeData.searchedUserId})` : '';
                setError(`You are not currently clocked in${debugId}. Access to care plans is restricted to active shifts. Check the API logs for more details.`);
                setLoading(false);
                return;
            }

            const seekerId = activeClockIn.serviceSeekerId;
            console.log("Active ClockIn Data:", activeClockIn);

            if (!seekerId) {
                console.error("Active shift found but no Service User ID linked", activeClockIn);
                setError(`Active shift (ID: ${activeClockIn.id}) is not associated with a specific Service User. Please contact support.`);
                setLoading(false);
                return;
            }

            setServiceSeekerId(seekerId);

            // 2. Fetch Care Plan Data
            // We fetch the most critical components for a care worker to see
            await fetchCarePlanData(seekerId, token);

        } catch (err) {
            console.error(err);
            setError("Failed to load care plan data.");
            setLoading(false);
        }
    };

    const fetchCarePlanData = async (seekerId, token) => {
        try {
            const headers = { 'Authorization': `Bearer ${token}` };

            // Optimized: Fetch all care plan data in a single request to reduce connection overhead
            const response = await fetch(`/api/service-seekers/${seekerId}/care-plan-summary`, { headers });

            if (response.ok) {
                const json = await response.json();
                if (json.success && json.data) {
                    const { seeker, admission, healthTags, contacts, riskAssessments, medicineSchedule, documents } = json.data;

                    setSeeker(seeker);
                    setAdmission(admission);
                    setHealthTags(healthTags || []);
                    setContacts(contacts || []);
                    setRiskAssessments(riskAssessments || []);
                    setMedicineSchedule(medicineSchedule || []);
                    setDocuments(documents || []);
                } else {
                    setError("Failed to load care plan details.");
                }
            } else {
                setError("Failed to fetch care plan data.");
            }

        } catch (e) {
            console.error("Error fetching specific care plan details", e);
            setError("Network error while loading care plan.");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch {
            return dateStr || '-';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600 mb-4"></div>
                <p className="text-slate-500 font-medium">Loading Care Plan...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Access Restricted</h2>
                <p className="text-slate-600 mb-8 max-w-xs">{error}</p>
                <Link href="/care-worker" className="bg-[#224fa6] text-white font-bold py-3.5 px-8 rounded-xl shadow-lg hover:bg-[#1e438f] transition-all">
                    Return to Dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-white px-6 py-4 shadow-sm flex items-center gap-4 sticky top-0 z-10">
                <Link href="/care-worker" className="p-2 -ml-2 text-slate-400 hover:text-slate-600 transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-slate-800 leading-none">Care Plan</h1>
                    <p className="text-xs text-slate-500 mt-1 font-medium">{seeker ? `${seeker.firstName} ${seeker.lastName}` : 'Service User'}</p>
                </div>
            </div>

            <main className="p-4 max-w-3xl mx-auto space-y-6">

                {/* Health Tags - Prominent Alert Style */}
                {healthTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                        {healthTags.map((tag) => (
                            <span key={tag.id} className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-100 rounded-lg text-sm font-bold flex items-center gap-1.5 shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                {tag.name}
                            </span>
                        ))}
                    </div>
                )}

                {/* Profile Summary */}
                {seeker && (
                    <SectionCard title="Client Profile" icon="👤">
                        <div className="grid grid-cols-2 gap-4">
                            <SummaryRow label="Full Name" value={`${seeker.firstName} ${seeker.lastName}`} />
                            <SummaryRow label="Preferred Name" value={seeker.preferredName} />
                            <SummaryRow label="Date of Birth" value={formatDate(seeker.dateOfBirth)} />
                            <SummaryRow label="Gender" value={seeker.gender} />
                            <div className="col-span-2 mt-2 pt-3 border-t border-slate-50">
                                <SummaryRow label="Address" value={seeker.address} />
                                {seeker.postalCode && <p className="text-slate-500 text-xs">{seeker.postalCode}</p>}
                            </div>
                        </div>
                    </SectionCard>
                )}

                {/* Emergency & Medical - Critical */}
                {admission && (
                    <SectionCard title="Medical & Emergency" icon="🏥">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <SummaryRow label="DNAR / Resuscitation" value={admission.dnarStatus || 'Check File'} /> {/* Assuming field exists or we add dummy if critical */}
                                <SummaryRow label="Emergency Rating" value={admission.emergencyRating} />
                            </div>

                            <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                                <SummaryRow label="Allergies" value={admission.medicineAllergies || admission.foodAllergies ? `Meds: ${admission.medicineAllergies || 'None'}, Food: ${admission.foodAllergies || 'None'}` : 'None Recorded'} />
                            </div>

                            <SummaryRow label="Medical History" value={admission.medicalHistory} />

                            <div className="grid grid-cols-2 gap-4">
                                <SummaryRow label="Oxygen Required" value={admission.oxygen} />
                                <SummaryRow label="Catheter" value={admission.onCatheter} />
                            </div>
                        </div>
                    </SectionCard>
                )}

                {/* Diet & Hydration */}
                {admission && (
                    <SectionCard title="Dietary Needs" icon="🍽️">
                        <div className="grid grid-cols-2 gap-4">
                            <SummaryRow label="Main Diet" value={admission.mainDiet} />
                            <SummaryRow label="Fluid Consistency" value={admission.fluidConsistency || 'Normal'} />
                        </div>
                        <div className="mt-3">
                            <SummaryRow label="Special Instructions" value={admission.dietInstructions} />
                        </div>
                    </SectionCard>
                )}

                {/* Risk Assessments */}
                {riskAssessments.length > 0 && (
                    <SectionCard title="Active Risks" icon="⚠️">
                        <div className="space-y-3">
                            {riskAssessments.map(risk => (
                                <div key={risk.id} className="bg-amber-50 p-3 rounded-lg border border-amber-100/50">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-amber-900 text-sm">{risk.riskType}</span>
                                        <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">{formatDate(risk.lastAssessed)}</span>
                                    </div>
                                    <p className="text-sm text-amber-800 leading-relaxed">{risk.summary || risk.whatIsRisk}</p>
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                )}

                {/* Contacts */}
                {contacts.length > 0 && (
                    <SectionCard title="Key Contacts" icon="📞">
                        <div className="space-y-3">
                            {contacts.map(contact => (
                                <div key={contact.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">{contact.name}</p>
                                        <p className="text-xs text-slate-500">{contact.role || contact.contactType} {contact.emergencyContact && '• Emergency Contact'}</p>
                                    </div>
                                    <a href={`tel:${contact.mobile}`} className="bg-slate-100 p-2 rounded-full text-slate-600 hover:bg-slate-200">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                    </a>
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                )}

                {/* Documents - Simplified */}
                {documents.length > 0 && (
                    <div className="px-2">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Documents on File</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {documents.map(doc => (
                                <div key={doc.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 011.414.586l4 4a1 1 0 01.586 1.414V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-700 truncate">{doc.name}</p>
                                        <p className="text-[10px] text-slate-400">{formatDate(doc.createdAt)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}
