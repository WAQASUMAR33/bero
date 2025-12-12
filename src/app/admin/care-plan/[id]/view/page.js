'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import Notification from '../../../components/Notification';

function SummaryRow({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-gray-900 font-medium">{value ?? '-'}</p>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8 border-t-4 border-[#224fa6]">
      <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

export default function CarePlanViewPage() {
  const params = useParams();
  const router = useRouter();
  const [serviceSeekerId, setServiceSeekerId] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [seeker, setSeeker] = useState(null);
  const [admission, setAdmission] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  
  // All form data states
  const [otherIds, setOtherIds] = useState([]);
  const [otherTelephones, setOtherTelephones] = useState([]);
  const [otherAddresses, setOtherAddresses] = useState([]);
  const [healthTags, setHealthTags] = useState([]);
  const [mentalCapacity, setMentalCapacity] = useState(null);
  const [mcaAssessments, setMcaAssessments] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [confidentialNotes, setConfidentialNotes] = useState([]);
  const [funding, setFunding] = useState([]);
  const [calendarVisits, setCalendarVisits] = useState([]);
  const [calendarMeetings, setCalendarMeetings] = useState([]);
  const [outcomes, setOutcomes] = useState([]);
  const [riskAssessments, setRiskAssessments] = useState([]);
  const [medicineRiskAssessments, setMedicineRiskAssessments] = useState([]);
  const [safeguarding, setSafeguarding] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [waterlow, setWaterlow] = useState([]);
  const [marReviews, setMarReviews] = useState([]);
  const [personalProperty, setPersonalProperty] = useState([]);
  const [externalLogins, setExternalLogins] = useState([]);
  const [allowanceSettings, setAllowanceSettings] = useState(null);
  const [allowanceTransactions, setAllowanceTransactions] = useState([]);
  const [socialVisitInstructions, setSocialVisitInstructions] = useState([]);
  const [medicinePrnPlans, setMedicinePrnPlans] = useState([]);
  const [medicineAccessCodes, setMedicineAccessCodes] = useState([]);
  const [positioningHandling, setPositioningHandling] = useState(null);
  const [bathingSettings, setBathingSettings] = useState(null);
  const [foodDrinksSettings, setFoodDrinksSettings] = useState(null);
  const [houseKeepingSchedule, setHouseKeepingSchedule] = useState([]);
  const [medicineSchedule, setMedicineSchedule] = useState([]);
  const [oralCareSchedule, setOralCareSchedule] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    setServiceSeekerId(params?.id ? parseInt(params.id, 10) : null);
  }, [params?.id]);

  useEffect(() => {
    if (!user || !serviceSeekerId) return;
    const token = localStorage.getItem('token');
    
    (async () => {
      try {
        // Fetch all data in parallel
        const [
          seekerRes,
          admissionRes,
          otherIdsRes,
          otherTelephonesRes,
          otherAddressesRes,
          healthTagsRes,
          mentalCapacityRes,
          mcaAssessmentsRes,
          contactsRes,
          documentsRes,
          confidentialNotesRes,
          fundingRes,
          calendarVisitsRes,
          calendarMeetingsRes,
          outcomesRes,
          riskAssessmentsRes,
          medicineRiskAssessmentsRes,
          safeguardingRes,
          feedbackRes,
          waterlowRes,
          marReviewsRes,
          personalPropertyRes,
          externalLoginsRes,
          allowanceSettingsRes,
          allowanceTransactionsRes,
          socialVisitInstructionsRes,
          medicinePrnPlansRes,
          medicineAccessCodesRes,
          positioningHandlingRes,
          bathingSettingsRes,
          foodDrinksSettingsRes,
          houseKeepingScheduleRes,
          medicineScheduleRes,
          oralCareScheduleRes,
        ] = await Promise.all([
          fetch(`/api/service-seekers/${serviceSeekerId}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/service-seekers/${serviceSeekerId}/admission`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/service-seekers/${serviceSeekerId}/other-ids`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/service-seekers/${serviceSeekerId}/other-telephones`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/service-seekers/${serviceSeekerId}/other-addresses`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/service-seekers/${serviceSeekerId}/health-tags`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/service-seekers/${serviceSeekerId}/mental-capacity`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/service-seekers/${serviceSeekerId}/mca-assessments`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/service-seekers/${serviceSeekerId}/contacts`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/service-seekers/${serviceSeekerId}/documents`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/service-seekers/${serviceSeekerId}/confidential-notes`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/service-seekers/${serviceSeekerId}/funding`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/service-seekers/${serviceSeekerId}/calendar/visits`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/service-seekers/${serviceSeekerId}/calendar/resident-meetings`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/service-seekers/${serviceSeekerId}/outcomes`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/service-seekers/${serviceSeekerId}/risk-assessments`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/service-seekers/${serviceSeekerId}/medicine-risk-assessments`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/service-seekers/${serviceSeekerId}/safeguarding`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/service-seekers/${serviceSeekerId}/feedback`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/service-seekers/${serviceSeekerId}/waterlow`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/service-seekers/${serviceSeekerId}/mar-reviews`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/service-seekers/${serviceSeekerId}/personal-property`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/service-seekers/${serviceSeekerId}/external-logins`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/service-seekers/${serviceSeekerId}/allowance-settings`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/service-seekers/${serviceSeekerId}/allowance-transactions`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/service-seekers/${serviceSeekerId}/social-visit-instructions`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/service-seekers/${serviceSeekerId}/medicine-prn-plans`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/service-seekers/${serviceSeekerId}/medicine-access-codes`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/service-seekers/${serviceSeekerId}/positioning-handling`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/service-seekers/${serviceSeekerId}/bathing-default-times`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/service-seekers/${serviceSeekerId}/food-drinks-settings`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/service-seekers/${serviceSeekerId}/house-keeping-schedule-items`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/service-seekers/${serviceSeekerId}/medicine-schedule-items`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/service-seekers/${serviceSeekerId}/oral-care-schedule-items`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        // Parse all responses
        const seekerData = await seekerRes.json();
        const admissionData = admissionRes.ok ? await admissionRes.json() : null;
        setSeeker(seekerData);
        setAdmission(admissionData);
        
        if (otherIdsRes.ok) setOtherIds(await otherIdsRes.json() || []);
        if (otherTelephonesRes.ok) setOtherTelephones(await otherTelephonesRes.json() || []);
        if (otherAddressesRes.ok) setOtherAddresses(await otherAddressesRes.json() || []);
        if (healthTagsRes.ok) setHealthTags(await healthTagsRes.json() || []);
        if (mentalCapacityRes.ok) {
          const mcData = await mentalCapacityRes.json();
          setMentalCapacity(mcData || null);
        }
        if (mcaAssessmentsRes.ok) setMcaAssessments(await mcaAssessmentsRes.json() || []);
        if (contactsRes.ok) setContacts(await contactsRes.json() || []);
        if (documentsRes.ok) setDocuments(await documentsRes.json() || []);
        if (confidentialNotesRes.ok) setConfidentialNotes(await confidentialNotesRes.json() || []);
        if (fundingRes.ok) setFunding(await fundingRes.json() || []);
        if (calendarVisitsRes.ok) setCalendarVisits(await calendarVisitsRes.json() || []);
        if (calendarMeetingsRes.ok) setCalendarMeetings(await calendarMeetingsRes.json() || []);
        if (outcomesRes.ok) setOutcomes(await outcomesRes.json() || []);
        if (riskAssessmentsRes.ok) setRiskAssessments(await riskAssessmentsRes.json() || []);
        if (medicineRiskAssessmentsRes.ok) setMedicineRiskAssessments(await medicineRiskAssessmentsRes.json() || []);
        if (safeguardingRes.ok) setSafeguarding(await safeguardingRes.json() || []);
        if (feedbackRes.ok) setFeedback(await feedbackRes.json() || []);
        if (waterlowRes.ok) setWaterlow(await waterlowRes.json() || []);
        if (marReviewsRes.ok) setMarReviews(await marReviewsRes.json() || []);
        if (personalPropertyRes.ok) setPersonalProperty(await personalPropertyRes.json() || []);
        if (externalLoginsRes.ok) setExternalLogins(await externalLoginsRes.json() || []);
        if (allowanceSettingsRes.ok) {
          const allowData = await allowanceSettingsRes.json();
          setAllowanceSettings(allowData || null);
        }
        if (allowanceTransactionsRes.ok) setAllowanceTransactions(await allowanceTransactionsRes.json() || []);
        if (socialVisitInstructionsRes.ok) setSocialVisitInstructions(await socialVisitInstructionsRes.json() || []);
        if (medicinePrnPlansRes.ok) setMedicinePrnPlans(await medicinePrnPlansRes.json() || []);
        if (medicineAccessCodesRes.ok) setMedicineAccessCodes(await medicineAccessCodesRes.json() || []);
        if (positioningHandlingRes.ok) {
          const phData = await positioningHandlingRes.json();
          setPositioningHandling(phData || null);
        }
        if (bathingSettingsRes.ok) {
          const bathData = await bathingSettingsRes.json();
          setBathingSettings(bathData || null);
        }
        if (foodDrinksSettingsRes.ok) {
          const foodData = await foodDrinksSettingsRes.json();
          setFoodDrinksSettings(foodData || null);
        }
        if (houseKeepingScheduleRes.ok) setHouseKeepingSchedule(await houseKeepingScheduleRes.json() || []);
        if (medicineScheduleRes.ok) setMedicineSchedule(await medicineScheduleRes.json() || []);
        if (oralCareScheduleRes.ok) setOralCareSchedule(await oralCareScheduleRes.json() || []);
      } catch (e) {
        console.error('Error loading data:', e);
        setNotification({ show: true, message: 'Failed to load some care plan data.', type: 'error' });
      }
    })();
  }, [user, serviceSeekerId]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#224fa6]"></div>
      </div>
    );
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr || '-';
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleString('en-GB');
    } catch {
      return dateStr || '-';
    }
  };

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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Care Plan View</h1>
                <p className="text-gray-600">View care plan for {seeker ? `${seeker.firstName} ${seeker.lastName}` : 'Service User'}</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => router.push('/admin/care-plan')}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-all"
                >
                  Back to List
                </button>
                <button
                  onClick={() => router.push(`/admin/service-users/${serviceSeekerId}/admission`)}
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white font-medium hover:shadow-lg transition-all"
                >
                  Edit Care Plan
                </button>
              </div>
            </div>
          </div>

          {/* Summary */}
          {seeker && (
            <SectionCard title="Summary">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SummaryRow label="Name" value={`${seeker.firstName} ${seeker.lastName}`} />
                <SummaryRow label="Preferred" value={seeker?.preferredName ?? '-'} />
                <SummaryRow label="DOB" value={formatDate(seeker?.dateOfBirth)} />
                <SummaryRow label="Gender" value={seeker?.gender ?? '-'} />
                <SummaryRow label="Pronouns" value={seeker?.pronouns ?? '-'} />
                <SummaryRow label="Status" value={seeker?.status ?? '-'} />
                <div className="md:col-span-3">
                  <SummaryRow label="Address" value={seeker?.address ?? '-'} />
                </div>
              </div>
            </SectionCard>
          )}

          {/* Admission */}
          {admission && (
            <SectionCard title="Admission">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <SummaryRow 
                    label="Advanced Care Plan (URL)" 
                    value={admission?.advancedCarePlanUrl ? (
                      <a href={admission.advancedCarePlanUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                        {admission.advancedCarePlanUrl}
                      </a>
                    ) : '-'} 
                  />
                </div>
                <SummaryRow label="Start Date" value={formatDate(admission?.startDate)} />
                <SummaryRow label="Banding" value={admission?.banding ?? '-'} />
                <SummaryRow label="Authority/Category" value={admission?.authorityCategory ?? '-'} />
                <SummaryRow label="Funeral Arrangements" value={admission?.funeralArrangement ?? '-'} />
                <SummaryRow label="Funeral Director" value={admission?.funeralDirector ?? '-'} />
                <SummaryRow label="Team ID" value={admission?.teamId ?? '-'} />
                <SummaryRow label="Default Shift Run" value={admission?.defaultShiftRun?.name ?? '-'} />
              </div>
            </SectionCard>
          )}

          {/* Identification */}
          {admission && (
            <SectionCard title="Identification">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SummaryRow label="NHS/HSC No" value={admission?.nhsHscNo ?? '-'} />
                <SummaryRow label="CHI Number" value={admission?.chiNumber ?? '-'} />
                <SummaryRow label="NI Number" value={admission?.niNumber ?? '-'} />
                <SummaryRow label="Person ID" value={admission?.personId ?? '-'} />
              </div>
            </SectionCard>
          )}

          {/* Other IDs */}
          {otherIds.length > 0 && (
            <SectionCard title="Other IDs">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Number</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {otherIds.map((id) => (
                      <tr key={id.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{id.idName}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{id.idNumber}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}

          {/* Council */}
          {admission && (
            <SectionCard title="Council">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SummaryRow label="Council Service User ID" value={admission?.councilServiceUserId ?? '-'} />
                <SummaryRow label="Council Care Provider ID" value={admission?.councilCareProviderId ?? '-'} />
                <SummaryRow label="Service Type" value={admission?.serviceType ?? '-'} />
                <SummaryRow label="Service Level" value={admission?.serviceLevel ?? '-'} />
              </div>
            </SectionCard>
          )}

          {/* Background */}
          {admission && (
            <SectionCard title="Background">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SummaryRow label="Marital Status" value={admission?.maritalStatus ?? '-'} />
                <SummaryRow label="Religion" value={admission?.religion ?? '-'} />
                <SummaryRow label="Ethnicity" value={admission?.ethnicity ?? '-'} />
                <SummaryRow label="Communication Preference" value={admission?.communicationPreference ?? '-'} />
                <SummaryRow label="Emergency Rating" value={admission?.emergencyRating ?? '-'} />
                <SummaryRow label="Region" value={admission?.region ?? '-'} />
                <div className="md:col-span-2">
                  <SummaryRow label="Address Line 1" value={admission?.addressLine1 ?? '-'} />
                </div>
                <SummaryRow label="Address Line 2" value={admission?.addressLine2 ?? '-'} />
                <SummaryRow label="Address Line 3" value={admission?.addressLine3 ?? '-'} />
                <SummaryRow label="Address Line 4" value={admission?.addressLine4 ?? '-'} />
                <SummaryRow label="Address Line 5" value={admission?.addressLine5 ?? '-'} />
                <SummaryRow label="Postcode" value={admission?.postcode ?? '-'} />
                <SummaryRow label="Latitude" value={admission?.addressLatitude ?? '-'} />
                <SummaryRow label="Longitude" value={admission?.addressLongitude ?? '-'} />
                <SummaryRow label="Key Safe Code" value={admission?.keySafeCode ?? '-'} />
                <div className="md:col-span-2">
                  <SummaryRow label="Access Details" value={admission?.accessDetails ?? '-'} />
                </div>
                <SummaryRow label="Telephone" value={admission?.telephone ?? '-'} />
                <SummaryRow label="Mobile" value={admission?.mobile ?? '-'} />
                <SummaryRow label="Email" value={admission?.email ?? '-'} />
                <SummaryRow label="Preferred Contact Method" value={admission?.preferredContactMethod ?? '-'} />
              </div>
            </SectionCard>
          )}

          {/* Other Telephones */}
          {otherTelephones.length > 0 && (
            <SectionCard title="Other Telephone Numbers">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Number</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {otherTelephones.map((tel) => (
                      <tr key={tel.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{tel.type}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{tel.number}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}

          {/* Other Addresses */}
          {otherAddresses.length > 0 && (
            <SectionCard title="Other Addresses">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Postcode</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {otherAddresses.map((addr) => (
                      <tr key={addr.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{addr.address}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{addr.postcode}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}

          {/* Health */}
          {admission && (
            <SectionCard title="Health">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SummaryRow label="Height" value={admission?.height ? `${admission.height} cm` : '-'} />
                <SummaryRow label="Weight" value={admission?.weight ? `${admission.weight} kg` : '-'} />
                <SummaryRow label="BMI" value={admission?.bmi ?? '-'} />
                <div className="md:col-span-2">
                  <SummaryRow label="Medical History" value={admission?.medicalHistory ?? '-'} />
                </div>
                <div className="md:col-span-2">
                  <SummaryRow label="Medicine Allergies" value={admission?.medicineAllergies ?? '-'} />
                </div>
                <SummaryRow label="Oxygen" value={admission?.oxygen ?? '-'} />
                <SummaryRow label="On Catheter" value={admission?.onCatheter ?? '-'} />
                <div className="md:col-span-2">
                  <SummaryRow 
                    label="Team Involvement" 
                    value={admission?.teamInvolvement && Array.isArray(admission.teamInvolvement) 
                      ? admission.teamInvolvement.join(', ') 
                      : '-'} 
                  />
                </div>
              </div>
            </SectionCard>
          )}

          {/* Health Tags */}
          {healthTags.length > 0 && (
            <SectionCard title="Health Tags">
              <div className="flex flex-wrap gap-2">
                {healthTags.map((tag) => (
                  <span key={tag.id} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {tag.name}
                  </span>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Diet */}
          {admission && (
            <SectionCard title="Diet">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <SummaryRow label="Food Allergies" value={admission?.foodAllergies ?? '-'} />
                </div>
                <SummaryRow label="Nil By Mouth" value={admission?.nilByMouth ?? '-'} />
                <SummaryRow label="Main Diet" value={admission?.mainDiet ?? '-'} />
                <SummaryRow label="Special Diet" value={admission?.specialDiet ?? '-'} />
                <div className="md:col-span-2">
                  <SummaryRow label="Diet Instructions" value={admission?.dietInstructions ?? '-'} />
                </div>
              </div>
            </SectionCard>
          )}

          {/* Mental Capacity */}
          {mentalCapacity && (
            <SectionCard title="Mental Capacity">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SummaryRow label="Has Capacity" value={mentalCapacity?.hasCapacity ? 'Yes' : 'No'} />
                <SummaryRow label="Assessment Date" value={formatDate(mentalCapacity?.assessmentDate)} />
                <div className="md:col-span-2">
                  <SummaryRow label="Notes" value={mentalCapacity?.notes ?? '-'} />
                </div>
              </div>
            </SectionCard>
          )}

          {/* MCA Assessments */}
          {mcaAssessments.length > 0 && (
            <SectionCard title="MCA Assessments">
              <div className="space-y-4">
                {mcaAssessments.map((assessment) => (
                  <div key={assessment.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <SummaryRow label="Assessment Date" value={formatDate(assessment.assessmentDate)} />
                      <SummaryRow label="Assessor" value={assessment.assessorName ?? '-'} />
                      <div className="md:col-span-2">
                        <SummaryRow label="Notes" value={assessment.notes ?? '-'} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Contacts */}
          {contacts.length > 0 && (
            <SectionCard title="Contacts">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Emergency</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {contacts.map((contact) => (
                      <tr key={contact.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{contact.contactType}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{contact.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{contact.role || contact.otherRole || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{contact.mobile || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{contact.email || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{contact.emergencyContact ? 'Yes' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}

          {/* Documents */}
          {documents.length > 0 && (
            <SectionCard title="Documents">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Upload Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {documents.map((doc) => (
                      <tr key={doc.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{doc.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{doc.type || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{formatDate(doc.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}

          {/* Confidential Notes */}
          {confidentialNotes.length > 0 && (
            <SectionCard title="Confidential Notes">
              <div className="space-y-4">
                {confidentialNotes.map((note) => (
                  <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                      <SummaryRow label="Date" value={formatDate(note.date)} />
                      <SummaryRow label="Author" value={note.authorName ?? '-'} />
                    </div>
                    <SummaryRow label="Note" value={note.note ?? '-'} />
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Funding */}
          {funding.length > 0 && (
            <SectionCard title="Funding">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contract Number</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Type</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {funding.map((fund) => (
                      <tr key={fund.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{fund.fundingSource?.name || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{fund.percentageSplit ? `${fund.percentageSplit}%` : '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{fund.contractNumber || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{fund.paymentType || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}

          {/* Calendar Visits */}
          {calendarVisits.length > 0 && (
            <SectionCard title="Calendar Visits">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {calendarVisits.map((visit) => (
                      <tr key={visit.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{formatDate(visit.date)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{visit.time || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{visit.visitType || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{visit.name || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}

          {/* Calendar Meetings */}
          {calendarMeetings.length > 0 && (
            <SectionCard title="Calendar Resident Meetings">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {calendarMeetings.map((meeting) => (
                      <tr key={meeting.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{formatDate(meeting.date)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{meeting.time || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{meeting.title || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}

          {/* Outcomes */}
          {outcomes.length > 0 && (
            <SectionCard title="Outcomes">
              <div className="space-y-4">
                {outcomes.map((outcome) => (
                  <div key={outcome.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <SummaryRow label="Category" value={outcome.category ?? '-'} />
                      <SummaryRow label="Status" value={outcome.status ?? '-'} />
                      <div className="md:col-span-2">
                        <SummaryRow label="Description" value={outcome.description ?? '-'} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Risk Assessments */}
          {riskAssessments.length > 0 && (
            <SectionCard title="Risk Assessments">
              <div className="space-y-4">
                {riskAssessments.map((risk) => (
                  <div key={risk.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <SummaryRow label="Risk Type" value={risk.riskType ?? '-'} />
                      <SummaryRow label="Date" value={formatDate(risk.assessmentDate)} />
                      <div className="md:col-span-2">
                        <SummaryRow label="Description" value={risk.description ?? '-'} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Medicine Risk Assessments */}
          {medicineRiskAssessments.length > 0 && (
            <SectionCard title="Medicine Risk Assessments">
              <div className="space-y-4">
                {medicineRiskAssessments.map((risk) => (
                  <div key={risk.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <SummaryRow label="Assessment Date" value={formatDate(risk.assessmentDate)} />
                      <SummaryRow label="Assessor" value={risk.assessorName ?? '-'} />
                      <div className="md:col-span-2">
                        <SummaryRow label="Notes" value={risk.notes ?? '-'} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Safeguarding */}
          {safeguarding.length > 0 && (
            <SectionCard title="Safeguarding">
              <div className="space-y-4">
                {safeguarding.map((safeguard) => (
                  <div key={safeguard.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <SummaryRow label="Date" value={formatDate(safeguard.date)} />
                      <SummaryRow label="Type" value={safeguard.type ?? '-'} />
                      <div className="md:col-span-2">
                        <SummaryRow label="Description" value={safeguard.description ?? '-'} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Feedback */}
          {feedback.length > 0 && (
            <SectionCard title="Feedback">
              <div className="space-y-4">
                {feedback.map((fb) => (
                  <div key={fb.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <SummaryRow label="Date" value={formatDate(fb.date)} />
                      <SummaryRow label="Type" value={fb.type ?? '-'} />
                      <div className="md:col-span-2">
                        <SummaryRow label="Feedback" value={fb.feedback ?? '-'} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Waterlow */}
          {waterlow.length > 0 && (
            <SectionCard title="Waterlow Assessments">
              <div className="space-y-4">
                {waterlow.map((w) => (
                  <div key={w.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <SummaryRow label="Assessment Date" value={formatDate(w.assessmentDate)} />
                      <SummaryRow label="Score" value={w.score ?? '-'} />
                      <div className="md:col-span-2">
                        <SummaryRow label="Notes" value={w.notes ?? '-'} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* MAR Reviews */}
          {marReviews.length > 0 && (
            <SectionCard title="MAR Reviews">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Review Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reviewer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {marReviews.map((review) => (
                      <tr key={review.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{formatDate(review.reviewDate)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{review.reviewerName ?? '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{review.notes ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}

          {/* Personal Property */}
          {personalProperty.length > 0 && (
            <SectionCard title="Personal Property">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {personalProperty.map((prop) => (
                      <tr key={prop.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{prop.itemName || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{prop.description || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{prop.location || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}

          {/* External Logins */}
          {externalLogins.length > 0 && (
            <SectionCard title="External Logins">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profile ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Show Rota</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Show Care Plan</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {externalLogins.map((login) => (
                      <tr key={login.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{login.profileId || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{login.showRota ? 'Yes' : 'No'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{login.showCarePlan ? 'Yes' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}

          {/* Allowance Settings */}
          {allowanceSettings && (
            <SectionCard title="Allowance Settings">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SummaryRow label="Weekly Allowance" value={allowanceSettings?.weeklyAllowance ? `£${allowanceSettings.weeklyAllowance}` : '-'} />
                <SummaryRow label="Current Balance" value={allowanceSettings?.currentBalance ? `£${allowanceSettings.currentBalance}` : '-'} />
              </div>
            </SectionCard>
          )}

          {/* Allowance Transactions */}
          {allowanceTransactions.length > 0 && (
            <SectionCard title="Allowance Transactions">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allowanceTransactions.map((trans) => (
                      <tr key={trans.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{formatDate(trans.date)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{trans.type || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{trans.amount ? `£${trans.amount}` : '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{trans.description || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}

          {/* Social Visit Instructions */}
          {socialVisitInstructions.length > 0 && (
            <SectionCard title="Social Visit Instructions">
              <div className="space-y-4">
                {socialVisitInstructions.map((instruction) => (
                  <div key={instruction.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <SummaryRow label="Date" value={formatDate(instruction.date)} />
                      <SummaryRow label="Instructions" value={instruction.instructions ?? '-'} />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Medicine PRN Plans */}
          {medicinePrnPlans.length > 0 && (
            <SectionCard title="Medicine PRN Plans">
              <div className="space-y-4">
                {medicinePrnPlans.map((plan) => (
                  <div key={plan.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <SummaryRow label="Medicine Name" value={plan.medicineName ?? '-'} />
                      <SummaryRow label="Dosage" value={plan.dosage ?? '-'} />
                      <div className="md:col-span-2">
                        <SummaryRow label="Instructions" value={plan.instructions ?? '-'} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Medicine Access Codes */}
          {medicineAccessCodes.length > 0 && (
            <SectionCard title="Medicine Access Codes">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {medicineAccessCodes.map((code) => (
                      <tr key={code.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{code.code || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{code.description || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}

          {/* Positioning & Handling */}
          {positioningHandling && (
            <SectionCard title="Positioning & Handling">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <SummaryRow label="Instructions" value={positioningHandling?.instructions ?? '-'} />
                </div>
                <SummaryRow label="Repositioning Frequency" value={positioningHandling?.repositioningFrequency ?? '-'} />
                <SummaryRow label="Equipment Required" value={positioningHandling?.equipmentRequired ?? '-'} />
              </div>
            </SectionCard>
          )}

          {/* Bathing Settings */}
          {bathingSettings && (
            <SectionCard title="Bathing Settings">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SummaryRow label="Default Time" value={bathingSettings?.defaultTime ?? '-'} />
                <SummaryRow label="Frequency" value={bathingSettings?.frequency ?? '-'} />
                <div className="md:col-span-2">
                  <SummaryRow label="Special Instructions" value={bathingSettings?.specialInstructions ?? '-'} />
                </div>
              </div>
            </SectionCard>
          )}

          {/* Food & Drinks Settings */}
          {foodDrinksSettings && (
            <SectionCard title="Food & Drinks Settings">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SummaryRow label="Meal Times" value={foodDrinksSettings?.mealTimes ?? '-'} />
                <SummaryRow label="Fluid Requirements" value={foodDrinksSettings?.fluidRequirements ?? '-'} />
                <div className="md:col-span-2">
                  <SummaryRow label="Special Requirements" value={foodDrinksSettings?.specialRequirements ?? '-'} />
                </div>
              </div>
            </SectionCard>
          )}

          {/* House Keeping Schedule */}
          {houseKeepingSchedule.length > 0 && (
            <SectionCard title="House Keeping Schedule">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {houseKeepingSchedule.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{formatDate(item.date)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.time || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.task || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}

          {/* Medicine Schedule */}
          {medicineSchedule.length > 0 && (
            <SectionCard title="Medicine Schedule">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medicine</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dosage</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {medicineSchedule.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{formatDate(item.date)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.time || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.medicineName || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.dosage || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}

          {/* Oral Care Schedule */}
          {oralCareSchedule.length > 0 && (
            <SectionCard title="Oral Care Schedule">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {oralCareSchedule.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{formatDate(item.date)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.time || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.careType || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}

          {/* Audit Log */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200 mb-8">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900">Audit Log</h4>
            </div>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-green-500 mr-3"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Service User Created</p>
                  <p className="text-sm text-gray-600">
                    {seeker?.createdAt ? formatDateTime(seeker.createdAt) : '-'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    by <span className="font-medium text-gray-700">{seeker?.createdBy ? `${seeker.createdBy.firstName} ${seeker.createdBy.lastName}` : 'System'}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500 mr-3"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Service User Last Updated</p>
                  <p className="text-sm text-gray-600">
                    {seeker?.updatedAt ? formatDateTime(seeker.updatedAt) : '-'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    by <span className="font-medium text-gray-700">{seeker?.updatedBy ? `${seeker.updatedBy.firstName} ${seeker.updatedBy.lastName}` : 'System'}</span>
                  </p>
                </div>
              </div>
              {admission && (
                <>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-purple-500 mr-3"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Care Plan Created</p>
                      <p className="text-sm text-gray-600">
                        {admission.createdAt ? formatDateTime(admission.createdAt) : '-'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-orange-500 mr-3"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Care Plan Last Updated</p>
                      <p className="text-sm text-gray-600">
                        {admission.updatedAt ? formatDateTime(admission.updatedAt) : '-'}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <Notification
            show={notification.show}
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification({ ...notification, show: false })}
          />
        </main>
      </div>
    </div>
  );
}
