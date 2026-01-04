'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import Notification from '../../../components/Notification';
import IdentificationForm from '../../components/IdentificationForm';
import OtherIdsForm from '../../components/OtherIdsForm';
import CouncilForm from '../../components/CouncilForm';
import BackgroundForm from '../../components/BackgroundForm';
import OtherTelephoneNumbersForm from '../../components/OtherTelephoneNumbersForm';
import OtherAddressesForm from '../../components/OtherAddressesForm';
import HealthForm from '../../components/HealthForm';
import HealthTagsForm from '../../components/HealthTagsForm';
import DietForm from '../../components/DietForm';
import MentalCapacityForm from '../../components/MentalCapacityForm';
import McaAssessmentsForm from '../../components/McaAssessmentsForm';
import ContactsForm from '../../components/ContactsForm';
import DocumentsForm from '../../components/DocumentsForm';
import ConfidentialNotesForm from '../../components/ConfidentialNotesForm';
import FundingForm from '../../components/FundingForm';
import CalendarForm from '../../components/CalendarForm';
import OutcomesForm from '../../components/OutcomesForm';
import RiskAssessmentsForm from '../../components/RiskAssessmentsForm';
import MedicineRiskAssessmentsForm from '../../components/MedicineRiskAssessmentsForm';
import SafeguardingForm from '../../components/SafeguardingForm';
import FeedbackForms from '../../components/FeedbackForms';
import WaterlowAssessmentsForm from '../../components/WaterlowAssessmentsForm';
import MarReviewsForm from '../../components/MarReviewsForm';
import PersonalPropertyForm from '../../components/PersonalPropertyForm';
import ExternalLoginsForm from '../../components/ExternalLoginsForm';
import AllowanceForm from '../../components/AllowanceForm';
import SocialVisitInstructionsForm from '../../components/SocialVisitInstructionsForm';
import MedicineForm from '../../components/MedicineForm';
import MedicineAccessCodesForm from '../../components/MedicineAccessCodesForm';
import PositioningHandlingForm from '../../components/PositioningHandlingForm';
import BathingForm from '../../components/BathingForm';
import FoodDrinksForm from '../../components/FoodDrinksForm';
import HouseKeepingForm from '../../components/HouseKeepingForm';
import MedicineScheduleForm from '../../components/MedicineScheduleForm';
import OralCareScheduleForm from '../../components/OralCareScheduleForm';
import EncouragementForm from '../../components/EncouragementForm';
import StoolCheckForm from '../../components/StoolCheckForm';
import WeightForm from '../../components/WeightForm';

function SummaryRow({ label, value }){
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-gray-900 font-medium">{value ?? '-'}</p>
    </div>
  );
}

export default function AdmissionPage(){
  const params = useParams();
  const [serviceSeekerId, setServiceSeekerId] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeker, setSeeker] = useState(null);
  const [admission, setAdmission] = useState({
    advancedCarePlanUrl: '',
    startDate: '',
    banding: '',
    authorityCategory: '',
    funeralArrangement: 'UNKNOWN',
    funeralDirector: '',
    teamId: '',
    defaultShiftRunId: '',
  });
  const [shiftRuns, setShiftRuns] = useState([]);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [identification, setIdentification] = useState({
    nhsHscNo: '',
    chiNumber: '',
    niNumber: '',
    personId: '',
  });
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [savingIdentification, setSavingIdentification] = useState(false);
  const [council, setCouncil] = useState({
    councilServiceUserId: '',
    councilCareProviderId: '',
    serviceType: '',
    serviceLevel: '',
  });
  const [savingCouncil, setSavingCouncil] = useState(false);
  const [background, setBackground] = useState({
    maritalStatus: '',
    religion: '',
    ethnicity: '',
    communicationPreference: '',
    emergencyRating: '',
    addressLine1: '',
    addressLine2: '',
    addressLine3: '',
    addressLine4: '',
    addressLine5: '',
    postcode: '',
    addressLatitude: '',
    addressLongitude: '',
    region: '',
    keySafeCode: '',
    accessDetails: '',
    telephone: '',
    mobile: '',
    email: '',
    preferredContactMethod: '',
  });
  const [savingBackground, setSavingBackground] = useState(false);
  const [health, setHealth] = useState({
    height: '',
    weight: '',
    bmi: '',
    medicalHistory: '',
    medicineAllergies: '',
    oxygen: '',
    onCatheter: '',
    teamInvolvement: [],
  });
  const [savingHealth, setSavingHealth] = useState(false);
  const [diet, setDiet] = useState({
    foodAllergies: '',
    nilByMouth: '',
    mainDiet: '',
    specialDiet: '',
    dietInstructions: '',
  });
  const [savingDiet, setSavingDiet] = useState(false);
  const [basicInfo, setBasicInfo] = useState({
    firstName: '',
    lastName: '',
    preferredName: '',
    title: '',
    dateOfBirth: '',
    gender: '',
    genderAtBirth: '',
    pronouns: '',
    sexuality: '',
    dnar: false,
    status: 'LIVE',
    address: '',
    postalCode: '',
  });
  const [savingBasicInfo, setSavingBasicInfo] = useState(false);

  const setBasicInfoField = (key, value) => {
    setBasicInfo(prev => ({ ...prev, [key]: value }));
  };

  const setAdmissionField = (key, value) => {
    setAdmission(prev => ({ ...prev, [key]: value }));
  };

  const setIdentificationField = (key, value) => {
    setIdentification(prev => ({ ...prev, [key]: value }));
  };

  const setCouncilField = (key, value) => {
    setCouncil(prev => ({ ...prev, [key]: value }));
  };

  const setBackgroundField = (key, value) => {
    setBackground(prev => ({ ...prev, [key]: value }));
  };

  const setHealthField = (key, value) => {
    setHealth(prev => ({ ...prev, [key]: value }));
  };

  const setDietField = (key, value) => {
    setDiet(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveIdentification = async () => {
    if(!serviceSeekerId) return;
    setSavingIdentification(true);
    try{
      const token = localStorage.getItem('token');
      const payload = {
        ...admission,
        teamId: admission.teamId === '' ? null : parseInt(admission.teamId,10),
        defaultShiftRunId: admission.defaultShiftRunId === '' ? null : parseInt(admission.defaultShiftRunId,10),
        startDate: admission.startDate || null,
        nhsHscNo: identification.nhsHscNo || null,
        chiNumber: identification.chiNumber || null,
        niNumber: identification.niNumber || null,
        personId: identification.personId || null,
      };
      let res = await fetch(`/api/service-seekers/${serviceSeekerId}/admission`,{
        method: 'PUT',
        headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok && res.status === 404) {
        res = await fetch(`/api/service-seekers/${serviceSeekerId}/admission`,{
          method: 'POST',
          headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
      });
    }
      if(res.ok){
        setNotification({ show: true, message: 'Identification saved successfully.', type: 'success' });
      } else {
        let message = 'Failed to save identification.';
        try {
          const err = await res.json();
          if (typeof err?.error === 'string' && err.error.trim()) message = err.error;
          if (typeof err?.message === 'string' && err.message.trim()) message = err.message;
        } catch (_) {}
        setNotification({ show: true, message, type: 'error' });
      }
    } catch(e){ console.error(e); setNotification({ show: true, message: 'Failed to save identification.', type: 'error' }); }
    finally {
      setSavingIdentification(false);
    }
  };

  const handleSaveCouncil = async () => {
    if(!serviceSeekerId) return;
    setSavingCouncil(true);
    try{
      const token = localStorage.getItem('token');
      const payload = {
        ...admission,
        teamId: admission.teamId === '' ? null : parseInt(admission.teamId,10),
        defaultShiftRunId: admission.defaultShiftRunId === '' ? null : parseInt(admission.defaultShiftRunId,10),
        startDate: admission.startDate || null,
        nhsHscNo: identification.nhsHscNo || null,
        chiNumber: identification.chiNumber || null,
        niNumber: identification.niNumber || null,
        personId: identification.personId || null,
        councilServiceUserId: council.councilServiceUserId || null,
        councilCareProviderId: council.councilCareProviderId || null,
        serviceType: council.serviceType || null,
        serviceLevel: council.serviceLevel || null,
      };
      let res = await fetch(`/api/service-seekers/${serviceSeekerId}/admission`,{
        method: 'PUT',
        headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok && res.status === 404) {
        res = await fetch(`/api/service-seekers/${serviceSeekerId}/admission`,{
          method: 'POST',
          headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
      }
      if(res.ok){
        setNotification({ show: true, message: 'Council information saved successfully.', type: 'success' });
      } else {
        let message = 'Failed to save council information.';
        try {
          const err = await res.json();
          if (typeof err?.error === 'string' && err.error.trim()) message = err.error;
          if (typeof err?.message === 'string' && err.message.trim()) message = err.message;
        } catch (_) {}
        setNotification({ show: true, message, type: 'error' });
      }
    } catch(e){ console.error(e); setNotification({ show: true, message: 'Failed to save council information.', type: 'error' }); }
    finally {
      setSavingCouncil(false);
    }
  };

  const handleSaveBackground = async () => {
    if(!serviceSeekerId) return;
    setSavingBackground(true);
    try{
      const token = localStorage.getItem('token');
      const payload = {
        ...admission,
        teamId: admission.teamId === '' ? null : parseInt(admission.teamId,10),
        defaultShiftRunId: admission.defaultShiftRunId === '' ? null : parseInt(admission.defaultShiftRunId,10),
        startDate: admission.startDate || null,
        nhsHscNo: identification.nhsHscNo || null,
        chiNumber: identification.chiNumber || null,
        niNumber: identification.niNumber || null,
        personId: identification.personId || null,
        councilServiceUserId: council.councilServiceUserId || null,
        councilCareProviderId: council.councilCareProviderId || null,
        serviceType: council.serviceType || null,
        serviceLevel: council.serviceLevel || null,
        maritalStatus: background.maritalStatus || null,
        religion: background.religion || null,
        ethnicity: background.ethnicity || null,
        communicationPreference: background.communicationPreference || null,
        emergencyRating: background.emergencyRating || null,
        addressLine1: background.addressLine1 || null,
        addressLine2: background.addressLine2 || null,
        addressLine3: background.addressLine3 || null,
        addressLine4: background.addressLine4 || null,
        addressLine5: background.addressLine5 || null,
        postcode: background.postcode || null,
        addressLatitude: background.addressLatitude || null,
        addressLongitude: background.addressLongitude || null,
        region: background.region || null,
        keySafeCode: background.keySafeCode || null,
        accessDetails: background.accessDetails || null,
        telephone: background.telephone || null,
        mobile: background.mobile || null,
        email: background.email || null,
        preferredContactMethod: background.preferredContactMethod || null,
      };
      let res = await fetch(`/api/service-seekers/${serviceSeekerId}/admission`,{
        method: 'PUT',
        headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok && res.status === 404) {
        res = await fetch(`/api/service-seekers/${serviceSeekerId}/admission`,{
          method: 'POST',
          headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
      }
      if(res.ok){
        setNotification({ show: true, message: 'Background information saved successfully.', type: 'success' });
      } else {
        let message = 'Failed to save background information.';
        try {
          const err = await res.json();
          if (typeof err?.error === 'string' && err.error.trim()) message = err.error;
          if (typeof err?.message === 'string' && err.message.trim()) message = err.message;
        } catch (_) {}
        setNotification({ show: true, message, type: 'error' });
      }
    } catch(e){ console.error(e); setNotification({ show: true, message: 'Failed to save background information.', type: 'error' }); }
    finally {
      setSavingBackground(false);
    }
  };

  const handleSaveHealth = async () => {
    if(!serviceSeekerId) return;
    setSavingHealth(true);
    try{
      const token = localStorage.getItem('token');
      const payload = {
        ...admission,
        teamId: admission.teamId === '' ? null : parseInt(admission.teamId,10),
        defaultShiftRunId: admission.defaultShiftRunId === '' ? null : parseInt(admission.defaultShiftRunId,10),
        startDate: admission.startDate || null,
        nhsHscNo: identification.nhsHscNo || null,
        chiNumber: identification.chiNumber || null,
        niNumber: identification.niNumber || null,
        personId: identification.personId || null,
        councilServiceUserId: council.councilServiceUserId || null,
        councilCareProviderId: council.councilCareProviderId || null,
        serviceType: council.serviceType || null,
        serviceLevel: council.serviceLevel || null,
        maritalStatus: background.maritalStatus || null,
        religion: background.religion || null,
        ethnicity: background.ethnicity || null,
        communicationPreference: background.communicationPreference || null,
        emergencyRating: background.emergencyRating || null,
        addressLine1: background.addressLine1 || null,
        addressLine2: background.addressLine2 || null,
        addressLine3: background.addressLine3 || null,
        addressLine4: background.addressLine4 || null,
        addressLine5: background.addressLine5 || null,
        postcode: background.postcode || null,
        addressLatitude: background.addressLatitude || null,
        addressLongitude: background.addressLongitude || null,
        region: background.region || null,
        keySafeCode: background.keySafeCode || null,
        accessDetails: background.accessDetails || null,
        telephone: background.telephone || null,
        mobile: background.mobile || null,
        email: background.email || null,
        preferredContactMethod: background.preferredContactMethod || null,
        height: health.height || null,
        weight: health.weight || null,
        bmi: health.bmi || null,
        medicalHistory: health.medicalHistory || null,
        medicineAllergies: health.medicineAllergies || null,
        oxygen: health.oxygen || null,
        onCatheter: health.onCatheter || null,
        teamInvolvement: health.teamInvolvement && Array.isArray(health.teamInvolvement) ? health.teamInvolvement : null,
      };
      let res = await fetch(`/api/service-seekers/${serviceSeekerId}/admission`,{
        method: 'PUT',
        headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok && res.status === 404) {
        res = await fetch(`/api/service-seekers/${serviceSeekerId}/admission`,{
          method: 'POST',
          headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
      }
      if(res.ok){
        setNotification({ show: true, message: 'Health information saved successfully.', type: 'success' });
      } else {
        let message = 'Failed to save health information.';
        try {
          const err = await res.json();
          if (typeof err?.error === 'string' && err.error.trim()) message = err.error;
          if (typeof err?.message === 'string' && err.message.trim()) message = err.message;
        } catch (_) {}
        setNotification({ show: true, message, type: 'error' });
      }
    } catch(e){ console.error(e); setNotification({ show: true, message: 'Failed to save health information.', type: 'error' }); }
    finally {
      setSavingHealth(false);
    }
  };

  const handleSaveDiet = async () => {
    if(!serviceSeekerId) return;
    setSavingDiet(true);
    try{
      const token = localStorage.getItem('token');
      const payload = {
        ...admission,
        teamId: admission.teamId === '' ? null : parseInt(admission.teamId,10),
        defaultShiftRunId: admission.defaultShiftRunId === '' ? null : parseInt(admission.defaultShiftRunId,10),
        startDate: admission.startDate || null,
        nhsHscNo: identification.nhsHscNo || null,
        chiNumber: identification.chiNumber || null,
        niNumber: identification.niNumber || null,
        personId: identification.personId || null,
        councilServiceUserId: council.councilServiceUserId || null,
        councilCareProviderId: council.councilCareProviderId || null,
        serviceType: council.serviceType || null,
        serviceLevel: council.serviceLevel || null,
        maritalStatus: background.maritalStatus || null,
        religion: background.religion || null,
        ethnicity: background.ethnicity || null,
        communicationPreference: background.communicationPreference || null,
        emergencyRating: background.emergencyRating || null,
        addressLine1: background.addressLine1 || null,
        addressLine2: background.addressLine2 || null,
        addressLine3: background.addressLine3 || null,
        addressLine4: background.addressLine4 || null,
        addressLine5: background.addressLine5 || null,
        postcode: background.postcode || null,
        addressLatitude: background.addressLatitude || null,
        addressLongitude: background.addressLongitude || null,
        region: background.region || null,
        keySafeCode: background.keySafeCode || null,
        accessDetails: background.accessDetails || null,
        telephone: background.telephone || null,
        mobile: background.mobile || null,
        email: background.email || null,
        preferredContactMethod: background.preferredContactMethod || null,
        height: health.height || null,
        weight: health.weight || null,
        bmi: health.bmi || null,
        medicalHistory: health.medicalHistory || null,
        medicineAllergies: health.medicineAllergies || null,
        oxygen: health.oxygen || null,
        onCatheter: health.onCatheter || null,
        teamInvolvement: health.teamInvolvement && Array.isArray(health.teamInvolvement) ? health.teamInvolvement : null,
        foodAllergies: diet.foodAllergies || null,
        nilByMouth: diet.nilByMouth || null,
        mainDiet: diet.mainDiet || null,
        specialDiet: diet.specialDiet || null,
        dietInstructions: diet.dietInstructions || null,
      };
      let res = await fetch(`/api/service-seekers/${serviceSeekerId}/admission`,{
        method: 'PUT',
        headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok && res.status === 404) {
        res = await fetch(`/api/service-seekers/${serviceSeekerId}/admission`,{
          method: 'POST',
          headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
      }
      if(res.ok){
        setNotification({ show: true, message: 'Diet information saved successfully.', type: 'success' });
      } else {
        let message = 'Failed to save diet information.';
        try {
          const err = await res.json();
          if (typeof err?.error === 'string' && err.error.trim()) message = err.error;
          if (typeof err?.message === 'string' && err.message.trim()) message = err.message;
        } catch (_) {}
        setNotification({ show: true, message, type: 'error' });
      }
    } catch(e){ console.error(e); setNotification({ show: true, message: 'Failed to save diet information.', type: 'error' }); }
    finally {
      setSavingDiet(false);
    }
  };

  const handleSaveBasicInfo = async () => {
    if(!serviceSeekerId) return;
    setSavingBasicInfo(true);
    try{
      const token = localStorage.getItem('token');
      const payload = {
        firstName: basicInfo.firstName,
        lastName: basicInfo.lastName,
        preferredName: basicInfo.preferredName || null,
        title: basicInfo.title || null,
        dateOfBirth: basicInfo.dateOfBirth || null,
        gender: basicInfo.gender || null,
        genderAtBirth: basicInfo.genderAtBirth || null,
        pronouns: basicInfo.pronouns || null,
        sexuality: basicInfo.sexuality || null,
        dnar: basicInfo.dnar,
        status: basicInfo.status,
        address: basicInfo.address || null,
        postalCode: basicInfo.postalCode || null,
      };
      const res = await fetch(`/api/service-seekers/${serviceSeekerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if(res.ok){
        const updated = await res.json();
        setSeeker(updated);
        setNotification({ show: true, message: 'Basic information saved successfully.', type: 'success' });
      } else {
        const err = await res.json().catch(() => ({}));
        setNotification({ show: true, message: err?.error || 'Failed to save basic information.', type: 'error' });
      }
    } catch(e){
      console.error(e);
      setNotification({ show: true, message: 'Failed to save basic information.', type: 'error' });
    } finally {
      setSavingBasicInfo(false);
    }
  };

  // Collapsible sections removed to simplify and avoid any focus/scroll side-effects

  useEffect(()=>{
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
    setIsLoading(false);
  },[]);

  useEffect(()=>{
    setServiceSeekerId(params?.id ? parseInt(params.id,10) : null);
  }, [params?.id]);

  useEffect(()=>{
    if(!user || !serviceSeekerId) return;
    const token = localStorage.getItem('token');
    (async ()=>{
      try{
        const res = await fetch(`/api/service-seekers/${serviceSeekerId}`,{ headers: { Authorization: `Bearer ${token}` }});
        const data = await res.json();
        setSeeker(data);
        // Populate basic info form
        if (data) {
          setBasicInfo({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            preferredName: data.preferredName || '',
            title: data.title || '',
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().substring(0, 10) : '',
            gender: data.gender || '',
            genderAtBirth: data.genderAtBirth || '',
            pronouns: data.pronouns || '',
            sexuality: data.sexuality || '',
            dnar: !!data.dnar,
            status: data.status || 'LIVE',
            address: data.address || '',
            postalCode: data.postalCode || '',
          });
        }
      }catch(e){ console.error(e); }
      try{
        const res = await fetch(`/api/service-seekers/${serviceSeekerId}/admission`,{ headers: { Authorization: `Bearer ${token}` }});
        const data = await res.json();
        if (data){
          setAdmission({
            advancedCarePlanUrl: data.advancedCarePlanUrl || '',
            startDate: data.startDate ? new Date(data.startDate).toISOString().substring(0,10) : '',
            banding: data.banding || '',
            authorityCategory: data.authorityCategory || '',
            funeralArrangement: data.funeralArrangement || 'UNKNOWN',
            funeralDirector: data.funeralDirector || '',
            teamId: data.teamId?.toString() || '',
            defaultShiftRunId: data.defaultShiftRunId?.toString() || '',
          });
          setIdentification({
            nhsHscNo: data.nhsHscNo || '',
            chiNumber: data.chiNumber || '',
            niNumber: data.niNumber || '',
            personId: data.personId || '',
          });
          setCouncil({
            councilServiceUserId: data.councilServiceUserId || '',
            councilCareProviderId: data.councilCareProviderId || '',
            serviceType: data.serviceType || '',
            serviceLevel: data.serviceLevel || '',
          });
          setBackground({
            maritalStatus: data.maritalStatus || '',
            religion: data.religion || '',
            ethnicity: data.ethnicity || '',
            communicationPreference: data.communicationPreference || '',
            emergencyRating: data.emergencyRating || '',
            addressLine1: data.addressLine1 || '',
            addressLine2: data.addressLine2 || '',
            addressLine3: data.addressLine3 || '',
            addressLine4: data.addressLine4 || '',
            addressLine5: data.addressLine5 || '',
            postcode: data.postcode || '',
            addressLatitude: data.addressLatitude || '',
            addressLongitude: data.addressLongitude || '',
            region: data.region || '',
            keySafeCode: data.keySafeCode || '',
            accessDetails: data.accessDetails || '',
            telephone: data.telephone || '',
            mobile: data.mobile || '',
            email: data.email || '',
            preferredContactMethod: data.preferredContactMethod || '',
          });
          setHealth({
            height: data.height?.toString() || '',
            weight: data.weight?.toString() || '',
            bmi: data.bmi?.toString() || '',
            medicalHistory: data.medicalHistory || '',
            medicineAllergies: data.medicineAllergies || '',
            oxygen: data.oxygen || '',
            onCatheter: data.onCatheter || '',
            teamInvolvement: data.teamInvolvement ? (Array.isArray(data.teamInvolvement) ? data.teamInvolvement : typeof data.teamInvolvement === 'string' ? JSON.parse(data.teamInvolvement) : []) : [],
          });
          setDiet({
            foodAllergies: data.foodAllergies || '',
            nilByMouth: data.nilByMouth || '',
            mainDiet: data.mainDiet || '',
            specialDiet: data.specialDiet || '',
            dietInstructions: data.dietInstructions || '',
          });
        }
      }catch(e){ console.error(e); }
      try{
        const res = await fetch(`/api/shift-runs`,{ headers: { Authorization: `Bearer ${token}` }});
        const data = await res.json();
        if(Array.isArray(data)) setShiftRuns(data);
      }catch(e){ console.error(e); }
    })();
  },[user, serviceSeekerId]);

  if (isLoading || !user){
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#224fa6]"></div>
      </div>
    );
  }

  const handleSave = async () => {
    if(!serviceSeekerId) return;
    setSaving(true);
    try{
      const token = localStorage.getItem('token');
      const payload = {
        ...admission,
        teamId: admission.teamId === '' ? null : parseInt(admission.teamId,10),
        defaultShiftRunId: admission.defaultShiftRunId === '' ? null : parseInt(admission.defaultShiftRunId,10),
        startDate: admission.startDate || null,
        // identification fields
        nhsHscNo: identification.nhsHscNo || null,
        chiNumber: identification.chiNumber || null,
        niNumber: identification.niNumber || null,
        personId: identification.personId || null,
      };
      let res = await fetch(`/api/service-seekers/${serviceSeekerId}/admission`,{
        method: 'PUT',
        headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok && res.status === 404) {
        res = await fetch(`/api/service-seekers/${serviceSeekerId}/admission`,{
          method: 'POST',
          headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
      }
      if(res.ok){
        setNotification({ show: true, message: 'Admission saved successfully.', type: 'success' });
      } else {
        let message = 'Failed to save admission.';
        try {
          const err = await res.json();
          if (typeof err?.error === 'string' && err.error.trim()) message = err.error;
          if (typeof err?.message === 'string' && err.message.trim()) message = err.message;
        } catch (_) {}
        setNotification({ show: true, message, type: 'error' });
      }
    }catch(e){ console.error(e); }
    finally{ setSaving(false); }
  };

  // Shift run creation removed

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col lg:ml-64">
        <Header user={user} />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Service User Admission</h1>
                <p className="text-gray-600">Complete additional details for onboarding</p>
              </div>
            </div>
          </div>

          {/* Basic Information Form */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8 border-t-4 border-[#224fa6]">
            <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
              <h2 className="text-xl font-semibold">Basic Information</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                  <input 
                    value={basicInfo.firstName} 
                    onChange={e => setBasicInfoField('firstName', e.target.value)} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                  <input 
                    value={basicInfo.lastName} 
                    onChange={e => setBasicInfoField('lastName', e.target.value)} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Name</label>
                  <input 
                    value={basicInfo.preferredName} 
                    onChange={e => setBasicInfoField('preferredName', e.target.value)} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input 
                    value={basicInfo.title} 
                    onChange={e => setBasicInfoField('title', e.target.value)} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                  <input 
                    type="date" 
                    value={basicInfo.dateOfBirth} 
                    onChange={e => setBasicInfoField('dateOfBirth', e.target.value)} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                  <select 
                    value={basicInfo.gender} 
                    onChange={e => setBasicInfoField('gender', e.target.value)} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all"
                  >
                    <option value="">Select gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="TRANSGENDER">Transgender</option>
                    <option value="OTHER">Other</option>
                    <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender at Birth</label>
                  <select 
                    value={basicInfo.genderAtBirth} 
                    onChange={e => setBasicInfoField('genderAtBirth', e.target.value)} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all"
                  >
                    <option value="">Select gender at birth</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="TRANSGENDER">Transgender</option>
                    <option value="OTHER">Other</option>
                    <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pronouns</label>
                  <select 
                    value={basicInfo.pronouns} 
                    onChange={e => setBasicInfoField('pronouns', e.target.value)} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all"
                  >
                    <option value="">Select pronouns</option>
                    <option value="they">They</option>
                    <option value="he">He</option>
                    <option value="she">She</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sexuality</label>
                  <select 
                    value={basicInfo.sexuality} 
                    onChange={e => setBasicInfoField('sexuality', e.target.value)} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all"
                  >
                    <option value="">Select sexuality</option>
                    <option value="HETEROSEXUAL">Heterosexual</option>
                    <option value="GAY">Gay</option>
                    <option value="LESBIAN">Lesbian</option>
                    <option value="BISEXUAL">Bisexual</option>
                    <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">DNAR</label>
                  <select 
                    value={basicInfo.dnar ? 'DO_NOT_RESUSCITATE' : 'RESUSCITATE'} 
                    onChange={e => setBasicInfoField('dnar', e.target.value === 'DO_NOT_RESUSCITATE')} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all"
                  >
                    <option value="RESUSCITATE">Resuscitate</option>
                    <option value="DO_NOT_RESUSCITATE">Do Not Resuscitate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select 
                    value={basicInfo.status} 
                    onChange={e => setBasicInfoField('status', e.target.value)} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all"
                  >
                    <option value="LIVE">LIVE</option>
                    <option value="PRE_ADMISSION">PRE_ADMISSION</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                    <option value="ARCHIVED_PRE_ADMISSION">ARCHIVED_PRE_ADMISSION</option>
                    <option value="ON_HOLD_HOSPITAL">ON_HOLD_HOSPITAL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input 
                    value={basicInfo.address} 
                    onChange={e => setBasicInfoField('address', e.target.value)} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                  <input 
                    value={basicInfo.postalCode} 
                    onChange={e => setBasicInfoField('postalCode', e.target.value.toUpperCase())} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent transition-all" 
                    placeholder="e.g. SW1A 1AA"
                    maxLength={8}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveBasicInfo}
                  disabled={savingBasicInfo}
                  className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white font-medium hover:from-[#1a3d85] hover:to-[#2859c7] disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                >
                  {savingBasicInfo ? 'Saving...' : 'Save Basic Information'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8 border-t-4 border-[#224fa6]">
            {/* Blue Header */}
            <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
              <h2 className="text-xl font-semibold">Summary</h2>
            </div>
            <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Name</p>
                <p className="text-gray-900 font-medium">{seeker ? `${seeker.firstName} ${seeker.lastName}` : '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Preferred</p>
                <p className="text-gray-900 font-medium">{seeker?.preferredName ?? '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">DOB</p>
                <p className="text-gray-900 font-medium">{seeker?.dateOfBirth ? new Date(seeker.dateOfBirth).toLocaleDateString() : '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Gender</p>
                <p className="text-gray-900 font-medium">{seeker?.gender ?? '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Pronouns</p>
                <p className="text-gray-900 font-medium">{seeker?.pronouns ?? '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Status</p>
                <p className="text-gray-900 font-medium">{seeker?.status ?? '-'}</p>
              </div>
              <div className="md:col-span-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Address</p>
                <p className="text-gray-900 font-medium">{seeker?.address ?? '-'}</p>
              </div>
            </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8 border-t-4 border-[#224fa6]">
            {/* Blue Header */}
            <div className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-4">
              <h2 className="text-xl font-semibold">Admission</h2>
            </div>
            <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Advanced Care Plan (URL or uploaded link)</label>
                <input value={admission.advancedCarePlanUrl} onChange={e=>setAdmissionField('advancedCarePlanUrl', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-gray-900" placeholder="https://..." />
                <p className="text-xs text-gray-500 mt-1">Upload support coming soon. Paste a link for now.</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                <input type="date" value={admission.startDate} onChange={e=>setAdmissionField('startDate', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Banding</label>
                <input value={admission.banding} onChange={e=>setAdmissionField('banding', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Authority/Category</label>
                <input value={admission.authorityCategory} onChange={e=>setAdmissionField('authorityCategory', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Funeral Arrangements</label>
                <select value={admission.funeralArrangement} onChange={e=>setAdmissionField('funeralArrangement', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-gray-900">
                  <option value="UNKNOWN">Unknown</option>
                  <option value="BURIAL">Burial</option>
                  <option value="CREMATION">Cremation</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Funeral Director</label>
                <input value={admission.funeralDirector} onChange={e=>setAdmissionField('funeralDirector', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-gray-900" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Team</label>
                <input value={admission.teamId} onChange={e=>setAdmissionField('teamId', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-gray-900" placeholder="Team ID (coming soon)" />
                <p className="text-xs text-gray-500 mt-1">Team assignment will be enhanced later.</p>
              </div>
              <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">Default Shift Run</label>
                <select value={admission.defaultShiftRunId} onChange={e=>setAdmissionField('defaultShiftRunId', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-gray-900">
                  <option value="">Select a shift run</option>
                  {shiftRuns.map(sr => (<option key={sr.id} value={sr.id}>{sr.name}</option>))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button type="button" onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white font-medium hover:from-[#1a3d85] hover:to-[#2859c7] disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg">{saving? 'Saving...' : 'Save Admission'}</button>
            </div>
            </div>
          </div>

          <IdentificationForm
            identification={identification}
            setField={setIdentificationField}
            serviceSeekerId={serviceSeekerId}
            onSave={handleSaveIdentification}
            saving={savingIdentification}
          />

          <OtherIdsForm
            serviceSeekerId={serviceSeekerId}
            onNotification={setNotification}
          />

          <CouncilForm
            council={council}
            setField={setCouncilField}
            onSave={handleSaveCouncil}
            saving={savingCouncil}
          />

          <BackgroundForm
            background={background}
            setField={setBackgroundField}
            onSave={handleSaveBackground}
            saving={savingBackground}
          />

          <OtherTelephoneNumbersForm
            serviceSeekerId={serviceSeekerId}
            onNotification={setNotification}
          />

          <OtherAddressesForm
            serviceSeekerId={serviceSeekerId}
            onNotification={setNotification}
          />

          <HealthForm
            health={health}
            setField={setHealthField}
            onSave={handleSaveHealth}
            saving={savingHealth}
          />

          <HealthTagsForm
            serviceSeekerId={serviceSeekerId}
            onNotification={setNotification}
          />

          <DietForm
            diet={diet}
            setField={setDietField}
            onSave={handleSaveDiet}
            saving={savingDiet}
          />

          <MentalCapacityForm
            serviceSeekerId={serviceSeekerId}
            onNotification={setNotification}
          />

          <McaAssessmentsForm
            serviceSeekerId={serviceSeekerId}
            serviceUserName={seeker ? `${seeker.firstName} ${seeker.lastName}` : ''}
            onNotification={setNotification}
          />

          <ContactsForm
            serviceSeekerId={serviceSeekerId}
            onNotification={setNotification}
          />

          <DocumentsForm
            serviceSeekerId={serviceSeekerId}
            onNotification={setNotification}
          />

          <ConfidentialNotesForm
            serviceSeekerId={serviceSeekerId}
            onNotification={setNotification}
          />

          <FundingForm
            serviceSeekerId={serviceSeekerId}
            onNotification={setNotification}
          />

          <CalendarForm
            serviceSeekerId={serviceSeekerId}
            serviceUserName={seeker ? `${seeker.firstName} ${seeker.lastName}` : ''}
            onNotification={setNotification}
          />

          <OutcomesForm
            serviceSeekerId={serviceSeekerId}
            onNotification={setNotification}
          />

          <RiskAssessmentsForm
            serviceSeekerId={serviceSeekerId}
            serviceUserName={seeker ? `${seeker.firstName} ${seeker.lastName}` : ''}
            onNotification={setNotification}
          />

          <MedicineRiskAssessmentsForm
            serviceSeekerId={serviceSeekerId}
            serviceUserName={seeker ? `${seeker.firstName} ${seeker.lastName}` : ''}
            onNotification={setNotification}
          />

          <SafeguardingForm
            serviceSeekerId={serviceSeekerId}
            serviceUserName={seeker ? `${seeker.firstName} ${seeker.lastName}` : ''}
            onNotification={setNotification}
          />

          <FeedbackForms
            serviceSeekerId={serviceSeekerId}
            serviceUserName={seeker ? `${seeker.firstName} ${seeker.lastName}` : ''}
            onNotification={setNotification}
          />

          <WaterlowAssessmentsForm
            serviceSeekerId={serviceSeekerId}
            serviceUserName={seeker ? `${seeker.firstName} ${seeker.lastName}` : ''}
            onNotification={setNotification}
          />

          <MarReviewsForm
            serviceSeekerId={serviceSeekerId}
            serviceUserName={seeker ? `${seeker.firstName} ${seeker.lastName}` : ''}
            onNotification={setNotification}
          />

          <PersonalPropertyForm
            serviceSeekerId={serviceSeekerId}
            serviceUserName={seeker ? `${seeker.firstName} ${seeker.lastName}` : ''}
            onNotification={setNotification}
          />

          <ExternalLoginsForm
            serviceSeekerId={serviceSeekerId}
            onNotification={setNotification}
          />

          <AllowanceForm
            serviceSeekerId={serviceSeekerId}
            onNotification={setNotification}
          />

          <SocialVisitInstructionsForm
            serviceSeekerId={serviceSeekerId}
            onNotification={setNotification}
          />

          <MedicineForm
            serviceSeekerId={serviceSeekerId}
            onNotification={setNotification}
          />

          <MedicineAccessCodesForm
            serviceSeekerId={serviceSeekerId}
            onNotification={setNotification}
          />

          <PositioningHandlingForm
            serviceSeekerId={serviceSeekerId}
            onNotification={setNotification}
          />

          <BathingForm
            serviceSeekerId={serviceSeekerId}
            onNotification={setNotification}
          />

          <FoodDrinksForm
            serviceSeekerId={serviceSeekerId}
            onNotification={setNotification}
          />

          <HouseKeepingForm
            serviceSeekerId={serviceSeekerId}
            onNotification={setNotification}
          />

          <MedicineScheduleForm
            serviceSeekerId={serviceSeekerId}
            onNotification={setNotification}
          />

          <OralCareScheduleForm
            serviceSeekerId={serviceSeekerId}
            onNotification={setNotification}
          />

          <EncouragementForm
            serviceSeekerId={serviceSeekerId}
            onNotification={setNotification}
          />

          <StoolCheckForm
            serviceSeekerId={serviceSeekerId}
            onNotification={setNotification}
          />

          <WeightForm
            serviceSeekerId={serviceSeekerId}
            onNotification={setNotification}
          />

          {/* Shift run creation modal removed for simplicity */}
        </main>
        <Notification
          show={notification.show}
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ ...notification, show: false })}
        />
      </div>
    </div>
  );
}


