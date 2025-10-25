'use client';

import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Notification from '../components/Notification';
import BathingTaskForm from './components/BathingTaskForm';
import BehaviourTaskForm from './components/BehaviourTaskForm';
import BloodTestTaskForm from './components/BloodTestTaskForm';
import BloodPressureTaskForm from './components/BloodPressureTaskForm';
import ComfortCheckTaskForm from './components/ComfortCheckTaskForm';
import CommunicationNotesTaskForm from './components/CommunicationNotesTaskForm';
import FamilyPhotoMessageTaskForm from './components/FamilyPhotoMessageTaskForm';
import FoodDrinkTaskForm from './components/FoodDrinkTaskForm';
import GeneralSupportTaskForm from './components/GeneralSupportTaskForm';
import HouseKeepingTaskForm from './components/HouseKeepingTaskForm';
import IncidentFallTaskForm from './components/IncidentFallTaskForm';
import MedicinePrnTaskForm from './components/MedicinePrnTaskForm';
import MuacTaskForm from './components/MuacTaskForm';
import ObservationTaskForm from './components/ObservationTaskForm';
import OneToOneTaskForm from './components/OneToOneTaskForm';
import OralCareTaskForm from './components/OralCareTaskForm';
import OxygenTaskForm from './components/OxygenTaskForm';
import PersonCentredTaskForm from './components/PersonCentredTaskForm';
import PhysicalInterventionTaskForm from './components/PhysicalInterventionTaskForm';
import PulseTaskForm from './components/PulseTaskForm';
import RepositionTaskForm from './components/RepositionTaskForm';
import SpendingMoneyTaskForm from './components/SpendingMoneyTaskForm';
import StoolTaskForm from './components/StoolTaskForm';
import TemperatureTaskForm from './components/TemperatureTaskForm';
import VisitTaskForm from './components/VisitTaskForm';
import WeightTaskForm from './components/WeightTaskForm';
import EncouragementTaskForm from './components/EncouragementTaskForm';
import FollowUpTaskForm from './components/FollowUpTaskForm';
import BathingTaskView from './components/BathingTaskView';
import BehaviourTaskView from './components/BehaviourTaskView';
import BloodTestTaskView from './components/BloodTestTaskView';
import BloodPressureTaskView from './components/BloodPressureTaskView';
import ComfortCheckTaskView from './components/ComfortCheckTaskView';
import CommunicationNotesTaskView from './components/CommunicationNotesTaskView';
import FamilyPhotoMessageTaskView from './components/FamilyPhotoMessageTaskView';
import FoodDrinkTaskView from './components/FoodDrinkTaskView';
import GeneralSupportTaskView from './components/GeneralSupportTaskView';
import HouseKeepingTaskView from './components/HouseKeepingTaskView';
import IncidentFallTaskView from './components/IncidentFallTaskView';
import MedicinePrnTaskView from './components/MedicinePrnTaskView';
import MuacTaskView from './components/MuacTaskView';
import ObservationTaskView from './components/ObservationTaskView';
import OneToOneTaskView from './components/OneToOneTaskView';
import OralCareTaskView from './components/OralCareTaskView';
import OxygenTaskView from './components/OxygenTaskView';
import PersonCentredTaskView from './components/PersonCentredTaskView';
import PhysicalInterventionTaskView from './components/PhysicalInterventionTaskView';
import PulseTaskView from './components/PulseTaskView';
import RepositionTaskView from './components/RepositionTaskView';
import SpendingMoneyTaskView from './components/SpendingMoneyTaskView';
import StoolTaskView from './components/StoolTaskView';
import TemperatureTaskView from './components/TemperatureTaskView';
import VisitTaskView from './components/VisitTaskView';
import WeightTaskView from './components/WeightTaskView';
import EncouragementTaskView from './components/EncouragementTaskView';
import FollowUpTaskView from './components/FollowUpTaskView';

const TASK_TYPES = [
  { id: 'bathing', name: 'Bathing', icon: '🛁', color: 'blue' },
  { id: 'behaviour', name: 'Behaviour', icon: '👤', color: 'purple' },
  { id: 'bloodtest', name: 'Blood Test', icon: '💉', color: 'red' },
  { id: 'blood_pressure', name: 'Blood Pressure', icon: '🩺', color: 'red' },
  { id: 'comfort_check', name: 'Comfort Check', icon: '🛏️', color: 'green' },
  { id: 'communication_notes', name: 'Communication Notes', icon: '📝', color: 'blue' },
  { id: 'encouragement', name: 'Encouragement', icon: '💪', color: 'yellow' },
  { id: 'family_photo_message', name: 'Family Photo/Message', icon: '📷', color: 'pink' },
  { id: 'follow_up', name: 'Follow Up', icon: '🔄', color: 'indigo' },
  { id: 'food_drink', name: 'Food/Drink', icon: '🍽️', color: 'orange' },
  { id: 'general_support', name: 'General Support', icon: '🤝', color: 'teal' },
  { id: 'house_keeping', name: 'House Keeping', icon: '🧹', color: 'gray' },
  { id: 'incident_fall', name: 'Incident/Fall', icon: '⚠️', color: 'red' },
  { id: 'medicine_prn', name: 'Medicine PRN', icon: '💊', color: 'red' },
  { id: 'muac', name: 'MUAC', icon: '📏', color: 'blue' },
  { id: 'observation', name: 'Observation', icon: '👁️', color: 'purple' },
  { id: 'one_to_one', name: 'One to One', icon: '👥', color: 'green' },
  { id: 'oral_care', name: 'Oral Care', icon: '🦷', color: 'cyan' },
  { id: 'oxygen', name: 'Oxygen', icon: '💨', color: 'blue' },
  { id: 'person_centred_task', name: 'Person Centred Task', icon: '❤️', color: 'pink' },
  { id: 'physical_intervention', name: 'Physical Intervention', icon: '🚨', color: 'red' },
  { id: 'pulse', name: 'Pulse', icon: '❤️‍🩹', color: 'red' },
  { id: 're_position', name: 'Re-position', icon: '🔄', color: 'indigo' },
  { id: 'spending_money', name: 'Spending/Money', icon: '💰', color: 'green' },
  { id: 'stool', name: 'Stool', icon: '🚽', color: 'brown' },
  { id: 'temperature', name: 'Temperature', icon: '🌡️', color: 'orange' },
  { id: 'visit', name: 'Visit', icon: '👋', color: 'blue' },
  { id: 'weight', name: 'Weight', icon: '⚖️', color: 'purple' },
];

const COLOR_CLASSES = {
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  red: 'bg-red-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  pink: 'bg-pink-500',
  indigo: 'bg-indigo-500',
  orange: 'bg-orange-500',
  teal: 'bg-teal-500',
  gray: 'bg-gray-500',
  cyan: 'bg-cyan-500',
  brown: 'bg-amber-700',
};

const ENABLED_TASKS = ['bathing', 'behaviour', 'bloodtest', 'blood_pressure', 'comfort_check', 'communication_notes', 'encouragement', 'family_photo_message', 'food_drink', 'general_support', 'house_keeping', 'incident_fall', 'medicine_prn', 'muac', 'observation', 'one_to_one', 'oral_care', 'oxygen', 'person_centred_task', 'physical_intervention', 'pulse', 're_position', 'spending_money', 'stool', 'temperature', 'visit', 'weight', 'follow_up'];

export default function DailyTasksPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bathingTasks, setBathingTasks] = useState([]);
  const [behaviourTasks, setBehaviourTasks] = useState([]);
  const [bloodTestTasks, setBloodTestTasks] = useState([]);
  const [bloodPressureTasks, setBloodPressureTasks] = useState([]);
  const [comfortCheckTasks, setComfortCheckTasks] = useState([]);
  const [communicationNotesTasks, setCommunicationNotesTasks] = useState([]);
  const [familyPhotoMessageTasks, setFamilyPhotoMessageTasks] = useState([]);
  const [foodDrinkTasks, setFoodDrinkTasks] = useState([]);
  const [generalSupportTasks, setGeneralSupportTasks] = useState([]);
  const [houseKeepingTasks, setHouseKeepingTasks] = useState([]);
  const [incidentFallTasks, setIncidentFallTasks] = useState([]);
  const [medicinePrnTasks, setMedicinePrnTasks] = useState([]);
  const [muacTasks, setMuacTasks] = useState([]);
  const [observationTasks, setObservationTasks] = useState([]);
  const [oneToOneTasks, setOneToOneTasks] = useState([]);
  const [oralCareTasks, setOralCareTasks] = useState([]);
  const [oxygenTasks, setOxygenTasks] = useState([]);
  const [personCentredTasks, setPersonCentredTasks] = useState([]);
  const [physicalInterventionTasks, setPhysicalInterventionTasks] = useState([]);
  const [pulseTasks, setPulseTasks] = useState([]);
  const [repositionTasks, setRepositionTasks] = useState([]);
  const [spendingMoneyTasks, setSpendingMoneyTasks] = useState([]);
  const [stoolTasks, setStoolTasks] = useState([]);
  const [temperatureTasks, setTemperatureTasks] = useState([]);
  const [visitTasks, setVisitTasks] = useState([]);
  const [weightTasks, setWeightTasks] = useState([]);
  const [encouragementTasks, setEncouragementTasks] = useState([]);
  const [followUpTasks, setFollowUpTasks] = useState([]);
  const [behaviourTriggers, setBehaviourTriggers] = useState([]);
  const [supportLists, setSupportLists] = useState([]);
  const [personCentredTaskNames, setPersonCentredTaskNames] = useState([]);
  const [incidentTypes, setIncidentTypes] = useState([]);
  const [incidentLocations, setIncidentLocations] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [newTrigger, setNewTrigger] = useState({ name: '', define: '' });
  const [isAddingTrigger, setIsAddingTrigger] = useState(false);
  const [showSupportListModal, setShowSupportListModal] = useState(false);
  const [newSupportList, setNewSupportList] = useState('');
  const [isAddingSupportList, setIsAddingSupportList] = useState(false);
  const [deletingSupportListId, setDeletingSupportListId] = useState(null);
  const [showIncidentTypesModal, setShowIncidentTypesModal] = useState(false);
  const [newIncidentType, setNewIncidentType] = useState('');
  const [isAddingIncidentType, setIsAddingIncidentType] = useState(false);
  const [deletingIncidentTypeId, setDeletingIncidentTypeId] = useState(null);
  const [showIncidentLocationsModal, setShowIncidentLocationsModal] = useState(false);
  const [newIncidentLocation, setNewIncidentLocation] = useState('');
  const [isAddingIncidentLocation, setIsAddingIncidentLocation] = useState(false);
  const [deletingIncidentLocationId, setDeletingIncidentLocationId] = useState(null);
  const [showPersonCentredTaskNamesModal, setShowPersonCentredTaskNamesModal] = useState(false);
  const [newPersonCentredTaskName, setNewPersonCentredTaskName] = useState('');
  const [isAddingPersonCentredTaskName, setIsAddingPersonCentredTaskName] = useState(false);
  const [deletingPersonCentredTaskNameId, setDeletingPersonCentredTaskNameId] = useState(null);
  const [serviceUsers, setServiceUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedTaskType, setSelectedTaskType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTaskType, setFilterTaskType] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [showTaskTypeModal, setShowTaskTypeModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showManageTriggersModal, setShowManageTriggersModal] = useState(false);
  const [deletingTriggerId, setDeletingTriggerId] = useState(null);
  
  const [bathingForm, setBathingForm] = useState({
    serviceSeekerId: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    bathingType: 'BATH',
    compliance: 'COMPLETED',
    stoolPassed: false,
    urinePassed: false,
    bathNotes: '',
    catheterChecked: false,
    completed: 'YES',
    emotion: 'NEUTRAL',
  });

  const [behaviourForm, setBehaviourForm] = useState({
    serviceSeekerId: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    type: 'AGGRESSION_HITTING_BITING',
    triggerId: '',
    othersInvolved: false,
    othersInvolvedDetails: '',
    antecedents: '',
    behaviour: '',
    consequences: '',
    careIntervention: '',
    emotion: 'NEUTRAL',
  });

  const [bloodTestForm, setBloodTestForm] = useState({
    serviceSeekerId: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    when: 'BEFORE_BREAKFAST',
    bloodGlucose: '',
    insulinGiven: '',
    sideAdministered: '',
    note: '',
    completed: 'YES',
    emotion: 'NEUTRAL',
  });

  const [bloodPressureForm, setBloodPressureForm] = useState({
    serviceSeekerId: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    systolicPressure: '',
    diastolicPressure: '',
    notes: '',
    completed: 'YES',
    emotion: 'NEUTRAL',
  });

  const [comfortCheckForm, setComfortCheckForm] = useState({
    serviceSeekerId: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    allNeedsMet: false,
    catheterCheck: false,
    incontinencePadCheck: false,
    personalHygiene: false,
    repositioned: false,
    sleep: false,
    stomaCheck: false,
    toileted: false,
    stoolPassed: false,
    urinePassed: false,
    notes: '',
    completed: 'YES',
    emotion: 'NEUTRAL',
  });

  const [communicationNotesForm, setCommunicationNotesForm] = useState({
    serviceSeekerId: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    emotion: 'NEUTRAL',
  });

  const [familyPhotoMessageForm, setFamilyPhotoMessageForm] = useState({
    serviceSeekerId: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    description: '',
    messageFromResidence: '',
    photoUrl: '',
    emotion: 'NEUTRAL',
  });

  const [foodDrinkForm, setFoodDrinkForm] = useState({
    serviceSeekerId: '',
    date: new Date().toISOString().split('T')[0],
    time: 'BREAKFAST',
    foodDrinkOffer: '',
    main: 'NONE',
    fluidIntake: '0',
    comments: '',
    assistance: 'REQUIRED',
    foodDrinkOffered: 'YES',
    pictureUrl: '',
    completed: 'YES',
    emotion: 'NEUTRAL',
  });

  const [generalSupportForm, setGeneralSupportForm] = useState({
    serviceSeekerId: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    notes: '',
    supportListId: '',
    emotion: 'NEUTRAL',
  });

  const [houseKeepingForm, setHouseKeepingForm] = useState({
    serviceSeekerId: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    task: '',
    notes: '',
    photoUrl: '',
    completed: 'YES',
    emotion: 'NEUTRAL',
  });

  const [incidentFallForm, setIncidentFallForm] = useState({
    serviceSeekerId: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    incidentTypeId: '',
    incidentLasted: '',
    locationId: '',
    othersInvolved: false,
    othersInvolvedDetails: '',
    injuryDetail: '',
    serviceUserInjured: 'NO',
    witnessedBy: 'NOBODY',
    witnessedByStaffId: '',
    witnessDetail: '',
    photoConsent: 'NO',
    photoUrl: '',
    residentInfoProvided: 'YES',
    whatResidentDoing: '',
    howIncidentHappened: '',
    dateReportedToSeniorStaff: '',
    equipmentInvolved: 'NO',
    relativesInformed: 'NOT_YET',
    contactsCalled: 'NO_ONE',
    notes: '',
    emotion: 'NEUTRAL',
    signatureUrl: '',
  });

  const [followUpForm, setFollowUpForm] = useState({
    serviceSeekerId: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    followUpDate: new Date().toISOString().split('T')[0],
    followUpTime: new Date().toTimeString().slice(0, 5),
    name: '',
    description: '',
    status: 'ONGOING',
    emotion: 'NEUTRAL',
  });

  const [medicinePrnForm, setMedicinePrnForm] = useState({
    serviceSeekerId: '',
    applyDate: new Date().toISOString().split('T')[0],
    applyTime: new Date().toTimeString().slice(0, 5),
    prn: '',
    medicineName: '',
    medicineType: 'CREAM',
    administrated: 'YES',
    notes: '',
    requestSignoffBy: 'NOT_NEEDED',
    signoffByStaffId: '',
    completed: 'YES',
    emotion: 'NEUTRAL',
  });

  const [muacForm, setMuacForm] = useState({
    serviceSeekerId: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    muacInCm: '',
    notes: '',
    completed: 'YES',
    emotion: 'NEUTRAL',
  });

  const [observationForm, setObservationForm] = useState({
    serviceSeekerId: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    notes: '',
    emotion: 'NEUTRAL',
  });

  const [oneToOneForm, setOneToOneForm] = useState({
    serviceSeekerId: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    duration: '',
    notes: '',
    emotion: 'NEUTRAL',
  });

  const [oralCareForm, setOralCareForm] = useState({
    serviceSeekerId: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    oralCare: 'BRUSHED_TEETH',
    assisted: 'SELF_ASSISTED',
    notes: '',
    compliance: 'COMPLETED',
    completed: 'YES',
    emotion: 'NEUTRAL',
  });

  const [oxygenForm, setOxygenForm] = useState({
    serviceSeekerId: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    quantity: '',
    notes: '',
    completed: 'YES',
    emotion: 'NEUTRAL',
  });

  const [personCentredForm, setPersonCentredForm] = useState({
    serviceSeekerId: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    nameId: '',
    notes: '',
    photoUrl: '',
    completed: 'YES',
    emotion: 'NEUTRAL',
  });

  const [physicalInterventionForm, setPhysicalInterventionForm] = useState({
    serviceSeekerId: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    location: '',
    wereOtherStaffInvolved: 'NO',
    otherStaffNames: '',
    wereOtherResidenceInvolved: 'NO',
    otherResidenceNamesExplanation: '',
    wereAnyInjuriesSustained: 'NO',
    injuriesExplanation: '',
    didResidenceStaffRequireMedication: 'NO',
    medicationExplanation: '',
    hasAccidentBeenFilled: 'NO',
    accidentFilledExplanation: '',
    accidentBookDateTime: '',
    accidentBookNumber: '',
    detailOfPhysicalIntervention: '',
    techniquesUsed: '',
    positionOfStaffMembers: '',
    durationOfPhysicalIntervention: '',
    wereRestraintsUsed: 'NO',
    durationOfWholeIncident: '',
    wasReportedToManager: 'NO',
    reportedToManagerExplanation: '',
    managerReportTime: '',
    emotion: 'NEUTRAL',
    cqcNotified: 'NO',
    safeguardingNotified: 'NO',
    familyMemberNotified: 'NO',
    externalProfessional: 'NO',
    signatureUrl: '',
  });

  const [pulseForm, setPulseForm] = useState({
    serviceSeekerId: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    pulseRate: '',
    notes: '',
    completed: 'YES',
    emotion: 'NEUTRAL',
  });

  const [repositionForm, setRepositionForm] = useState({
    serviceSeekerId: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    position: '',
    intactOrEpuapGrade: '',
    notes: '',
    photoUrl: '',
    completed: 'YES',
    emotion: 'NEUTRAL',
  });

  const [spendingMoneyForm, setSpendingMoneyForm] = useState({
    serviceSeekerId: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    type: '',
    amount: '',
    paidUsing: 'CASH',
    receiptUrl: '',
    notes: '',
    emotion: 'NEUTRAL',
  });

  const [stoolForm, setStoolForm] = useState({
    serviceSeekerId: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    type: '',
    urinePassed: 'YES',
    notes: '',
    completed: 'YES',
    emotion: 'NEUTRAL',
  });

  const [temperatureForm, setTemperatureForm] = useState({
    serviceSeekerId: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    temperatureInC: '',
    notes: '',
    completed: 'YES',
    emotion: 'NEUTRAL',
  });

  const [visitForm, setVisitForm] = useState({
    serviceSeekerId: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    visitType: 'FAMILY',
    announced: 'YES',
    name: '',
    relationship: '',
    role: '',
    purpose: '',
    summary: '',
    completed: 'YES',
  });

  const [weightForm, setWeightForm] = useState({
    serviceSeekerId: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    weight: '',
    notes: '',
    completed: 'YES',
    emotion: 'NEUTRAL',
  });

  const [encouragementForm, setEncouragementForm] = useState({
    serviceSeekerId: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    encouragement: '',
    note: '',
    completed: 'YES',
    emotion: 'NEUTRAL',
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
    setIsLoading(false);
  }, []);

  const fetchBathingTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/bathing-tasks', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setBathingTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setBathingTasks([]);
    }
  };

  const fetchBehaviourTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/behaviour-tasks', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setBehaviourTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setBehaviourTasks([]);
    }
  };

  const fetchBehaviourTriggers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/behaviour-triggers', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      const triggers = Array.isArray(data) ? data : [];
      setBehaviourTriggers(triggers);
      
      if (triggers.length === 0) {
        await seedBehaviourTriggers();
      }
    } catch (e) {
      console.error(e);
      setBehaviourTriggers([]);
    }
  };

  const seedBehaviourTriggers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/behaviour-triggers/seed', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        const triggers = await fetch('/api/behaviour-triggers', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
        setBehaviourTriggers(Array.isArray(triggers) ? triggers : []);
      }
    } catch (e) {
      console.error('Failed to seed triggers:', e);
    }
  };

  const fetchBloodTestTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/blood-test-tasks', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setBloodTestTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setBloodTestTasks([]);
    }
  };

  const fetchBloodPressureTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/blood-pressure-tasks', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setBloodPressureTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setBloodPressureTasks([]);
    }
  };

  const fetchComfortCheckTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/comfort-check-tasks', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setComfortCheckTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setComfortCheckTasks([]);
    }
  };

  const fetchCommunicationNotesTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/communication-notes-tasks', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setCommunicationNotesTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setCommunicationNotesTasks([]);
    }
  };

  const fetchFamilyPhotoMessageTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/family-photo-message-tasks', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setFamilyPhotoMessageTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setFamilyPhotoMessageTasks([]);
    }
  };

  const fetchFoodDrinkTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/food-drink-tasks', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setFoodDrinkTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setFoodDrinkTasks([]);
    }
  };

  const fetchGeneralSupportTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/general-support-tasks', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setGeneralSupportTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setGeneralSupportTasks([]);
    }
  };

  const fetchHouseKeepingTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/house-keeping-tasks', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setHouseKeepingTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setHouseKeepingTasks([]);
    }
  };

  const fetchSupportLists = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/support-lists', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (Array.isArray(data) && data.length === 0) {
        // Auto-seed if empty
        await fetch('/api/support-lists/seed', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
        const res2 = await fetch('/api/support-lists', { headers: { Authorization: `Bearer ${token}` } });
        const data2 = await res2.json();
        setSupportLists(Array.isArray(data2) ? data2 : []);
      } else {
        setSupportLists(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
      setSupportLists([]);
    }
  };

  const fetchFollowUpTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/follow-up-tasks', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setFollowUpTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setFollowUpTasks([]);
    }
  };

  const fetchMedicinePrnTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/medicine-prn-tasks', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setMedicinePrnTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setMedicinePrnTasks([]);
    }
  };

  const fetchMuacTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/muac-tasks', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setMuacTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setMuacTasks([]);
    }
  };

  const fetchObservationTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/observation-tasks', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setObservationTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setObservationTasks([]);
    }
  };

  const fetchOneToOneTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/one-to-one-tasks', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setOneToOneTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setOneToOneTasks([]);
    }
  };

  const fetchOralCareTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/oral-care-tasks', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setOralCareTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setOralCareTasks([]);
    }
  };

  const fetchOxygenTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/oxygen-tasks', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setOxygenTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setOxygenTasks([]);
    }
  };

  const fetchPersonCentredTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/person-centred-tasks', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setPersonCentredTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setPersonCentredTasks([]);
    }
  };

  const fetchPersonCentredTaskNames = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/person-centred-task-names', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setPersonCentredTaskNames(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setPersonCentredTaskNames([]);
    }
  };

  const fetchPhysicalInterventionTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/physical-intervention-tasks', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setPhysicalInterventionTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setPhysicalInterventionTasks([]);
    }
  };

  const fetchPulseTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/pulse-tasks', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setPulseTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setPulseTasks([]);
    }
  };

  const fetchRepositionTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/reposition-tasks', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setRepositionTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setRepositionTasks([]);
    }
  };

  const fetchSpendingMoneyTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/spending-money-tasks', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setSpendingMoneyTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setSpendingMoneyTasks([]);
    }
  };

  const fetchStoolTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/stool-tasks', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setStoolTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setStoolTasks([]);
    }
  };

  const fetchTemperatureTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/temperature-tasks', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setTemperatureTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setTemperatureTasks([]);
    }
  };

  const fetchVisitTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/visit-tasks', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setVisitTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setVisitTasks([]);
    }
  };

  const fetchWeightTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/weight-tasks', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setWeightTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setWeightTasks([]);
    }
  };

  const fetchEncouragementTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/encouragement-tasks', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setEncouragementTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setEncouragementTasks([]);
    }
  };

  const fetchServiceUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/service-seekers', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setServiceUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setServiceUsers([]);
    }
  };

  const fetchStaffUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setStaffUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setStaffUsers([]);
    }
  };

  const fetchIncidentTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/incident-types', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (Array.isArray(data) && data.length === 0) {
        // Auto-seed if empty
        await fetch('/api/incident-types/seed', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
        const res2 = await fetch('/api/incident-types', { headers: { Authorization: `Bearer ${token}` } });
        const data2 = await res2.json();
        setIncidentTypes(Array.isArray(data2) ? data2 : []);
      } else {
        setIncidentTypes(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
      setIncidentTypes([]);
    }
  };

  const fetchIncidentLocations = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/incident-locations', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (Array.isArray(data) && data.length === 0) {
        // Auto-seed if empty
        await fetch('/api/incident-locations/seed', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
        const res2 = await fetch('/api/incident-locations', { headers: { Authorization: `Bearer ${token}` } });
        const data2 = await res2.json();
        setIncidentLocations(Array.isArray(data2) ? data2 : []);
      } else {
        setIncidentLocations(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
      setIncidentLocations([]);
    }
  };

  const fetchIncidentFallTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/incident-fall-tasks', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setIncidentFallTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setIncidentFallTasks([]);
    }
  };

  useEffect(() => { 
    if (user) {
      fetchBathingTasks();
      fetchBehaviourTasks();
      fetchBloodTestTasks();
      fetchBloodPressureTasks();
      fetchComfortCheckTasks();
      fetchCommunicationNotesTasks();
      fetchFamilyPhotoMessageTasks();
      fetchFoodDrinkTasks();
      fetchGeneralSupportTasks();
      fetchHouseKeepingTasks();
      fetchIncidentFallTasks();
      fetchFollowUpTasks();
      fetchMedicinePrnTasks();
      fetchMuacTasks();
      fetchObservationTasks();
      fetchOneToOneTasks();
      fetchOralCareTasks();
      fetchOxygenTasks();
      fetchPersonCentredTasks();
      fetchPhysicalInterventionTasks();
      fetchPulseTasks();
      fetchRepositionTasks();
      fetchSpendingMoneyTasks();
      fetchStoolTasks();
      fetchTemperatureTasks();
      fetchVisitTasks();
      fetchWeightTasks();
      fetchEncouragementTasks();
      fetchBehaviourTriggers();
      fetchSupportLists();
      fetchPersonCentredTaskNames();
      fetchIncidentTypes();
      fetchIncidentLocations();
      fetchServiceUsers();
      fetchStaffUsers();
    }
  }, [user]);

  const openAddTask = () => {
    setShowTaskTypeModal(true);
  };

  const selectTaskType = (taskTypeId) => {
    setSelectedTaskType(taskTypeId);
    setShowTaskTypeModal(false);
    setShowModal(true);
    setEditing(null);
    // Reset forms
    setBathingForm({
      serviceSeekerId: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      bathingType: 'BATH',
      compliance: 'COMPLETED',
      stoolPassed: false,
      urinePassed: false,
      bathNotes: '',
      catheterChecked: false,
      completed: 'YES',
      emotion: 'NEUTRAL',
    });
    setBehaviourForm({
      serviceSeekerId: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      type: 'AGGRESSION_HITTING_BITING',
      triggerId: '',
      othersInvolved: false,
      othersInvolvedDetails: '',
      antecedents: '',
      behaviour: '',
      consequences: '',
      careIntervention: '',
      emotion: 'NEUTRAL',
    });
  };

  const handleBathingSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/bathing-tasks/${editing.id}` : '/api/bathing-tasks';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(bathingForm),
      });

      if (response.ok) {
        setShowModal(false);
        await fetchBathingTasks();
        setNotification({ 
          show: true, 
          message: editing ? 'Bathing task updated successfully.' : 'Bathing task added successfully.', 
          type: 'success' 
        });
      } else {
        const err = await response.json().catch(() => ({ error: 'Failed' }));
        setNotification({ show: true, message: err?.error || 'Failed to save bathing task.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ show: true, message: 'Unexpected error while saving.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBehaviourSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/behaviour-tasks/${editing.id}` : '/api/behaviour-tasks';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(behaviourForm),
      });

      if (response.ok) {
        setShowModal(false);
        await fetchBehaviourTasks();
        setNotification({ 
          show: true, 
          message: editing ? 'Behaviour task updated successfully.' : 'Behaviour task added successfully.', 
          type: 'success' 
        });
      } else {
        const err = await response.json().catch(() => ({ error: 'Failed' }));
        setNotification({ show: true, message: err?.error || 'Failed to save behaviour task.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ show: true, message: 'Unexpected error while saving.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBloodTestSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/blood-test-tasks/${editing.id}` : '/api/blood-test-tasks';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(bloodTestForm),
      });

      if (response.ok) {
        setShowModal(false);
        await fetchBloodTestTasks();
        setNotification({ 
          show: true, 
          message: editing ? 'Blood test updated successfully.' : 'Blood test added successfully.', 
          type: 'success' 
        });
      } else {
        const err = await response.json().catch(() => ({ error: 'Failed' }));
        setNotification({ show: true, message: err?.error || 'Failed to save blood test.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ show: true, message: 'Unexpected error while saving.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBloodPressureSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/blood-pressure-tasks/${editing.id}` : '/api/blood-pressure-tasks';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(bloodPressureForm),
      });

      if (response.ok) {
        setShowModal(false);
        await fetchBloodPressureTasks();
        setNotification({ 
          show: true, 
          message: editing ? 'Blood pressure updated successfully.' : 'Blood pressure added successfully.', 
          type: 'success' 
        });
      } else {
        const err = await response.json().catch(() => ({ error: 'Failed' }));
        setNotification({ show: true, message: err?.error || 'Failed to save blood pressure.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ show: true, message: 'Unexpected error while saving.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComfortCheckSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/comfort-check-tasks/${editing.id}` : '/api/comfort-check-tasks';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(comfortCheckForm),
      });

      if (response.ok) {
        setShowModal(false);
        await fetchComfortCheckTasks();
        setNotification({ 
          show: true, 
          message: editing ? 'Comfort check updated successfully.' : 'Comfort check added successfully.', 
          type: 'success' 
        });
      } else {
        const err = await response.json().catch(() => ({ error: 'Failed' }));
        setNotification({ show: true, message: err?.error || 'Failed to save comfort check.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ show: true, message: 'Unexpected error while saving.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommunicationNotesSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/communication-notes-tasks/${editing.id}` : '/api/communication-notes-tasks';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(communicationNotesForm),
      });

      if (response.ok) {
        setShowModal(false);
        await fetchCommunicationNotesTasks();
        setNotification({ 
          show: true, 
          message: editing ? 'Communication notes updated successfully.' : 'Communication notes added successfully.', 
          type: 'success' 
        });
      } else {
        const err = await response.json().catch(() => ({ error: 'Failed' }));
        setNotification({ show: true, message: err?.error || 'Failed to save communication notes.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ show: true, message: 'Unexpected error while saving.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFamilyPhotoMessageSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/family-photo-message-tasks/${editing.id}` : '/api/family-photo-message-tasks';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(familyPhotoMessageForm),
      });

      if (response.ok) {
        setShowModal(false);
        await fetchFamilyPhotoMessageTasks();
        setNotification({ 
          show: true, 
          message: editing ? 'Family photo/message updated successfully.' : 'Family photo/message added successfully.', 
          type: 'success' 
        });
      } else {
        const err = await response.json().catch(() => ({ error: 'Failed' }));
        setNotification({ show: true, message: err?.error || 'Failed to save family photo/message.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ show: true, message: 'Unexpected error while saving.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFoodDrinkSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/food-drink-tasks/${editing.id}` : '/api/food-drink-tasks';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(foodDrinkForm),
      });

      if (response.ok) {
        setShowModal(false);
        await fetchFoodDrinkTasks();
        setNotification({ 
          show: true, 
          message: editing ? 'Food/drink task updated successfully.' : 'Food/drink task added successfully.', 
          type: 'success' 
        });
      } else {
        const err = await response.json().catch(() => ({ error: 'Failed' }));
        setNotification({ show: true, message: err?.error || 'Failed to save food/drink task.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ show: true, message: 'Unexpected error while saving.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGeneralSupportSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/general-support-tasks/${editing.id}` : '/api/general-support-tasks';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(generalSupportForm),
      });

      if (response.ok) {
        setShowModal(false);
        await fetchGeneralSupportTasks();
        setNotification({ 
          show: true, 
          message: editing ? 'General support task updated successfully.' : 'General support task added successfully.', 
          type: 'success' 
        });
      } else {
        const err = await response.json().catch(() => ({ error: 'Failed' }));
        setNotification({ show: true, message: err?.error || 'Failed to save general support task.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ show: true, message: 'Unexpected error while saving.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHouseKeepingSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/house-keeping-tasks/${editing.id}` : '/api/house-keeping-tasks';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(houseKeepingForm),
      });

      if (response.ok) {
        setShowModal(false);
        await fetchHouseKeepingTasks();
        setNotification({ 
          show: true, 
          message: editing ? 'House keeping task updated successfully.' : 'House keeping task added successfully.', 
          type: 'success' 
        });
      } else {
        const err = await response.json().catch(() => ({ error: 'Failed' }));
        setNotification({ show: true, message: err?.error || 'Failed to save house keeping task.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ show: true, message: 'Unexpected error while saving.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIncidentFallSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/incident-fall-tasks/${editing.id}` : '/api/incident-fall-tasks';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(incidentFallForm),
      });

      if (response.ok) {
        setShowModal(false);
        await fetchIncidentFallTasks();
        setNotification({ 
          show: true, 
          message: editing ? 'Incident/fall task updated successfully.' : 'Incident/fall task added successfully.', 
          type: 'success' 
        });
      } else {
        const err = await response.json().catch(() => ({ error: 'Failed' }));
        setNotification({ show: true, message: err?.error || 'Failed to save incident/fall task.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ show: true, message: 'Unexpected error while saving.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSupportList = async () => {
    if (!newSupportList.trim()) {
      setNotification({ show: true, message: 'Support type name is required.', type: 'error' });
      return;
    }
    setIsAddingSupportList(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/support-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newSupportList.trim() }),
      });

      if (res.ok) {
        setNewSupportList('');
        await fetchSupportLists();
        setNotification({ show: true, message: 'Support type added successfully.', type: 'success' });
      } else if (res.status === 409) {
        setNotification({ show: true, message: 'This support type already exists.', type: 'error' });
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed' }));
        setNotification({ show: true, message: err?.error || 'Failed to add support type.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ show: true, message: 'Unexpected error.', type: 'error' });
    } finally {
      setIsAddingSupportList(false);
    }
  };

  const handleDeleteSupportList = async (id) => {
    setDeletingSupportListId(id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/support-lists/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        await fetchSupportLists();
        setNotification({ show: true, message: 'Support type deleted successfully.', type: 'success' });
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed' }));
        setNotification({ show: true, message: err?.error || 'Failed to delete support type.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ show: true, message: 'Unexpected error.', type: 'error' });
    } finally {
      setDeletingSupportListId(null);
    }
  };

  const handleAddIncidentType = async () => {
    if (!newIncidentType.trim()) {
      setNotification({ show: true, message: 'Incident type is required.', type: 'error' });
      return;
    }
    setIsAddingIncidentType(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/incident-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: newIncidentType.trim(), canEdit: true }),
      });

      if (res.ok) {
        setNewIncidentType('');
        await fetchIncidentTypes();
        setNotification({ show: true, message: 'Incident type added successfully.', type: 'success' });
      } else if (res.status === 409) {
        setNotification({ show: true, message: 'This incident type already exists.', type: 'error' });
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed' }));
        setNotification({ show: true, message: err?.error || 'Failed to add incident type.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ show: true, message: 'Unexpected error.', type: 'error' });
    } finally {
      setIsAddingIncidentType(false);
    }
  };

  const handleDeleteIncidentType = async (id) => {
    setDeletingIncidentTypeId(id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/incident-types/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        await fetchIncidentTypes();
        setNotification({ show: true, message: 'Incident type deleted successfully.', type: 'success' });
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed' }));
        setNotification({ show: true, message: err?.error || 'Failed to delete incident type.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ show: true, message: 'Unexpected error.', type: 'error' });
    } finally {
      setDeletingIncidentTypeId(null);
    }
  };

  const handleAddIncidentLocation = async () => {
    if (!newIncidentLocation.trim()) {
      setNotification({ show: true, message: 'Location name is required.', type: 'error' });
      return;
    }
    setIsAddingIncidentLocation(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/incident-locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newIncidentLocation.trim() }),
      });

      if (res.ok) {
        setNewIncidentLocation('');
        await fetchIncidentLocations();
        setNotification({ show: true, message: 'Location added successfully.', type: 'success' });
      } else if (res.status === 409) {
        setNotification({ show: true, message: 'This location already exists.', type: 'error' });
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed' }));
        setNotification({ show: true, message: err?.error || 'Failed to add location.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ show: true, message: 'Unexpected error.', type: 'error' });
    } finally {
      setIsAddingIncidentLocation(false);
    }
  };

  const handleDeleteIncidentLocation = async (id) => {
    setDeletingIncidentLocationId(id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/incident-locations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        await fetchIncidentLocations();
        setNotification({ show: true, message: 'Location deleted successfully.', type: 'success' });
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed' }));
        setNotification({ show: true, message: err?.error || 'Failed to delete location.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ show: true, message: 'Unexpected error.', type: 'error' });
    } finally {
      setDeletingIncidentLocationId(null);
    }
  };

  const handleFollowUpSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/follow-up-tasks/${editing.id}` : '/api/follow-up-tasks';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(followUpForm),
      });

      if (response.ok) {
        setShowModal(false);
        await fetchFollowUpTasks();
        setNotification({ 
          show: true, 
          message: editing ? 'Follow up updated successfully.' : 'Follow up added successfully.', 
          type: 'success' 
        });
      } else {
        const err = await response.json().catch(() => ({ error: 'Failed' }));
        setNotification({ show: true, message: err?.error || 'Failed to save follow up.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ show: true, message: 'Unexpected error while saving.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMedicinePrnSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/medicine-prn-tasks/${editing.id}` : '/api/medicine-prn-tasks';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(medicinePrnForm),
      });

      if (response.ok) {
        setShowModal(false);
        await fetchMedicinePrnTasks();
        setNotification({ 
          show: true, 
          message: editing ? 'Medicine task updated successfully.' : 'Medicine task added successfully.', 
          type: 'success' 
        });
      } else {
        const err = await response.json().catch(() => ({ error: 'Failed' }));
        setNotification({ show: true, message: err?.error || 'Failed to save medicine task.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ show: true, message: 'Unexpected error while saving.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMuacSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/muac-tasks/${editing.id}` : '/api/muac-tasks';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(muacForm),
      });

      if (response.ok) {
        setShowModal(false);
        await fetchMuacTasks();
        setNotification({ 
          show: true, 
          message: editing ? 'MUAC task updated successfully.' : 'MUAC task added successfully.', 
          type: 'success' 
        });
      } else {
        const err = await response.json().catch(() => ({ error: 'Failed' }));
        setNotification({ show: true, message: err?.error || 'Failed to save MUAC task.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ show: true, message: 'Unexpected error while saving.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleObservationSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/observation-tasks/${editing.id}` : '/api/observation-tasks';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(observationForm),
      });

      if (response.ok) {
        setShowModal(false);
        await fetchObservationTasks();
        setNotification({ 
          show: true, 
          message: editing ? 'Observation task updated successfully.' : 'Observation task added successfully.', 
          type: 'success' 
        });
      } else {
        const err = await response.json().catch(() => ({ error: 'Failed' }));
        setNotification({ show: true, message: err?.error || 'Failed to save observation task.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ show: true, message: 'Unexpected error while saving.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOneToOneSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/one-to-one-tasks/${editing.id}` : '/api/one-to-one-tasks';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(oneToOneForm),
      });

      if (response.ok) {
        setShowModal(false);
        await fetchOneToOneTasks();
        setNotification({ 
          show: true, 
          message: editing ? 'One to One task updated successfully.' : 'One to One task added successfully.', 
          type: 'success' 
        });
      } else {
        const err = await response.json().catch(() => ({ error: 'Failed' }));
        setNotification({ show: true, message: err?.error || 'Failed to save one to one task.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ show: true, message: 'Unexpected error while saving.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOralCareSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/oral-care-tasks/${editing.id}` : '/api/oral-care-tasks';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(oralCareForm),
      });

      if (response.ok) {
        setShowModal(false);
        await fetchOralCareTasks();
        setNotification({ 
          show: true, 
          message: editing ? 'Oral Care task updated successfully.' : 'Oral Care task added successfully.', 
          type: 'success' 
        });
      } else {
        const err = await response.json().catch(() => ({ error: 'Failed' }));
        setNotification({ show: true, message: err?.error || 'Failed to save oral care task.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ show: true, message: 'Unexpected error while saving.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOxygenSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/oxygen-tasks/${editing.id}` : '/api/oxygen-tasks';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(oxygenForm),
      });

      if (response.ok) {
        setShowModal(false);
        await fetchOxygenTasks();
        setNotification({ 
          show: true, 
          message: editing ? 'Oxygen task updated successfully.' : 'Oxygen task added successfully.', 
          type: 'success' 
        });
      } else {
        const err = await response.json().catch(() => ({ error: 'Failed' }));
        setNotification({ show: true, message: err?.error || 'Failed to save oxygen task.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ show: true, message: 'Unexpected error while saving.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePersonCentredSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/person-centred-tasks/${editing.id}` : '/api/person-centred-tasks';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(personCentredForm),
      });

      if (response.ok) {
        setShowModal(false);
        await fetchPersonCentredTasks();
        setNotification({ 
          show: true, 
          message: editing ? 'Person Centred task updated successfully.' : 'Person Centred task added successfully.', 
          type: 'success' 
        });
      } else {
        const err = await response.json().catch(() => ({ error: 'Failed' }));
        setNotification({ show: true, message: err?.error || 'Failed to save person centred task.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ show: true, message: 'Unexpected error while saving.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPersonCentredTaskName = async (name) => {
    if (!name.trim()) {
      setNotification({ show: true, message: 'Task name is required.', type: 'error' });
      return;
    }
    setIsAddingPersonCentredTaskName(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/person-centred-task-names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name }),
      });
      if (response.ok) {
        await fetchPersonCentredTaskNames();
        setNotification({ show: true, message: 'Task name added successfully.', type: 'success' });
      } else {
        const err = await response.json().catch(() => ({ error: 'Failed' }));
        setNotification({ show: true, message: err?.error || 'Failed to add task name.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ show: true, message: 'Unexpected error while adding task name.', type: 'error' });
    } finally {
      setIsAddingPersonCentredTaskName(false);
    }
  };

  const handlePhysicalInterventionSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/physical-intervention-tasks/${editing.id}` : '/api/physical-intervention-tasks';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(physicalInterventionForm),
      });

      if (response.ok) {
        setShowModal(false);
        await fetchPhysicalInterventionTasks();
        setNotification({ 
          show: true, 
          message: editing ? 'Physical Intervention task updated successfully.' : 'Physical Intervention task added successfully.', 
          type: 'success' 
        });
      } else {
        const err = await response.json().catch(() => ({ error: 'Failed' }));
        setNotification({ show: true, message: err?.error || 'Failed to save physical intervention task.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ show: true, message: 'Unexpected error while saving.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePulseSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/pulse-tasks/${editing.id}` : '/api/pulse-tasks';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(pulseForm),
      });

      if (response.ok) {
        setShowModal(false);
        await fetchPulseTasks();
        setNotification({ 
          show: true, 
          message: editing ? 'Pulse task updated successfully.' : 'Pulse task added successfully.', 
          type: 'success' 
        });
      } else {
        const err = await response.json().catch(() => ({ error: 'Failed' }));
        setNotification({ show: true, message: err?.error || 'Failed to save pulse task.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ show: true, message: 'Unexpected error while saving.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRepositionSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/reposition-tasks/${editing.id}` : '/api/reposition-tasks';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(repositionForm),
      });

      if (response.ok) {
        setShowModal(false);
        await fetchRepositionTasks();
        setNotification({ 
          show: true, 
          message: editing ? 'Reposition task updated successfully.' : 'Reposition task added successfully.', 
          type: 'success' 
        });
      } else {
        const err = await response.json().catch(() => ({ error: 'Failed' }));
        setNotification({ show: true, message: err?.error || 'Failed to save reposition task.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ show: true, message: 'Unexpected error while saving.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSpendingMoneySubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/spending-money-tasks/${editing.id}` : '/api/spending-money-tasks';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(spendingMoneyForm),
      });

      if (response.ok) {
        setShowModal(false);
        await fetchSpendingMoneyTasks();
        setNotification({ 
          show: true, 
          message: editing ? 'Spending/Money task updated successfully.' : 'Spending/Money task added successfully.', 
          type: 'success' 
        });
      } else {
        const err = await response.json().catch(() => ({ error: 'Failed' }));
        setNotification({ show: true, message: err?.error || 'Failed to save spending/money task.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ show: true, message: 'Unexpected error while saving.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStoolSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/stool-tasks/${editing.id}` : '/api/stool-tasks';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(stoolForm),
      });

      if (response.ok) {
        setShowModal(false);
        await fetchStoolTasks();
        setNotification({ 
          show: true, 
          message: editing ? 'Stool task updated successfully.' : 'Stool task added successfully.', 
          type: 'success' 
        });
      } else {
        const err = await response.json().catch(() => ({ error: 'Failed' }));
        setNotification({ show: true, message: err?.error || 'Failed to save stool task.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ show: true, message: 'Unexpected error while saving.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTemperatureSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/temperature-tasks/${editing.id}` : '/api/temperature-tasks';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(temperatureForm),
      });

      if (response.ok) {
        setShowModal(false);
        await fetchTemperatureTasks();
        setNotification({ 
          show: true, 
          message: editing ? 'Temperature task updated successfully.' : 'Temperature task added successfully.', 
          type: 'success' 
        });
      } else {
        const err = await response.json().catch(() => ({ error: 'Failed' }));
        setNotification({ show: true, message: err?.error || 'Failed to save temperature task.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ show: true, message: 'Unexpected error while saving.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVisitSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/visit-tasks/${editing.id}` : '/api/visit-tasks';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(visitForm),
      });

      if (response.ok) {
        setShowModal(false);
        await fetchVisitTasks();
        setNotification({ 
          show: true, 
          message: editing ? 'Visit task updated successfully.' : 'Visit task added successfully.', 
          type: 'success' 
        });
      } else {
        const err = await response.json().catch(() => ({ error: 'Failed' }));
        setNotification({ show: true, message: err?.error || 'Failed to save visit task.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ show: true, message: 'Unexpected error while saving.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWeightSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/weight-tasks/${editing.id}` : '/api/weight-tasks';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(weightForm),
      });

      if (response.ok) {
        setShowModal(false);
        await fetchWeightTasks();
        setNotification({ 
          show: true, 
          message: editing ? 'Weight task updated successfully.' : 'Weight task added successfully.', 
          type: 'success' 
        });
      } else {
        const err = await response.json().catch(() => ({ error: 'Failed' }));
        setNotification({ show: true, message: err?.error || 'Failed to save weight task.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ show: true, message: 'Unexpected error while saving.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEncouragementSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/encouragement-tasks/${editing.id}` : '/api/encouragement-tasks';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(encouragementForm),
      });

      if (response.ok) {
        setShowModal(false);
        await fetchEncouragementTasks();
        setNotification({ 
          show: true, 
          message: editing ? 'Encouragement task updated successfully.' : 'Encouragement task added successfully.', 
          type: 'success' 
        });
      } else {
        const err = await response.json().catch(() => ({ error: 'Failed' }));
        setNotification({ show: true, message: err?.error || 'Failed to save encouragement task.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ show: true, message: 'Unexpected error while saving.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTrigger = async () => {
    if (!newTrigger.name.trim()) {
      setNotification({ show: true, message: 'Trigger name is required.', type: 'error' });
      return;
    }
    setIsAddingTrigger(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/behaviour-triggers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newTrigger),
      });
      if (response.ok) {
        const created = await response.json();
        await fetchBehaviourTriggers();
        setBehaviourForm({ ...behaviourForm, triggerId: created.id });
        setShowTriggerModal(false);
        setNewTrigger({ name: '', define: '' });
        setNotification({ show: true, message: 'Trigger added successfully.', type: 'success' });
      } else if (response.status === 409) {
        setNotification({ show: true, message: 'A trigger with this name already exists.', type: 'error' });
      } else {
        const err = await response.json().catch(() => ({ error: 'Failed' }));
        setNotification({ show: true, message: err?.error || 'Failed to add trigger.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ show: true, message: 'Unexpected error while adding trigger.', type: 'error' });
    } finally {
      setIsAddingTrigger(false);
    }
  };

  const handleView = async (task) => {
    try {
      const token = localStorage.getItem('token');
      const endpointMap = {
        'bathing': 'bathing-tasks',
        'behaviour': 'behaviour-tasks',
        'bloodtest': 'blood-test-tasks',
        'blood_pressure': 'blood-pressure-tasks',
        'comfort_check': 'comfort-check-tasks',
        'communication_notes': 'communication-notes-tasks',
        'encouragement': 'encouragement-tasks',
        'family_photo_message': 'family-photo-message-tasks',
        'food_drink': 'food-drink-tasks',
        'general_support': 'general-support-tasks',
        'house_keeping': 'house-keeping-tasks',
        'incident_fall': 'incident-fall-tasks',
        'medicine_prn': 'medicine-prn-tasks',
        'muac': 'muac-tasks',
        'observation': 'observation-tasks',
        'one_to_one': 'one-to-one-tasks',
        'oral_care': 'oral-care-tasks',
        'oxygen': 'oxygen-tasks',
        'person_centred_task': 'person-centred-tasks',
        'physical_intervention': 'physical-intervention-tasks',
        'pulse': 'pulse-tasks',
        're_position': 'reposition-tasks',
        'spending_money': 'spending-money-tasks',
        'stool': 'stool-tasks',
        'temperature': 'temperature-tasks',
        'visit': 'visit-tasks',
        'weight': 'weight-tasks',
        'follow_up': 'follow-up-tasks'
      };
      const endpoint = endpointMap[task.taskType];
      const res = await fetch(`/api/${endpoint}/${task.id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setViewData({ ...data, taskType: task.taskType });
      setShowViewModal(true);
    } catch (e) {
      console.error(e);
      setNotification({ show: true, message: 'Failed to load task details.', type: 'error' });
    }
  };

  const handleEdit = (task) => {
    setEditing(task);
    if (task.taskType === 'bathing') {
      setBathingForm({
        serviceSeekerId: task.serviceSeekerId || '',
        date: task.date ? new Date(task.date).toISOString().split('T')[0] : '',
        time: task.time || '',
        bathingType: task.bathingType,
        compliance: task.compliance,
        stoolPassed: task.stoolPassed,
        urinePassed: task.urinePassed,
        bathNotes: task.bathNotes || '',
        catheterChecked: task.catheterChecked,
        completed: task.completed,
        emotion: task.emotion,
      });
    } else if (task.taskType === 'behaviour') {
      setBehaviourForm({
        serviceSeekerId: task.serviceSeekerId,
        date: task.date ? new Date(task.date).toISOString().split('T')[0] : '',
        time: task.time || '',
        type: task.type,
        triggerId: task.triggerId,
        othersInvolved: task.othersInvolved,
        othersInvolvedDetails: task.othersInvolvedDetails || '',
        antecedents: task.antecedents || '',
        behaviour: task.behaviour || '',
        consequences: task.consequences || '',
        careIntervention: task.careIntervention || '',
        emotion: task.emotion,
      });
    } else if (task.taskType === 'bloodtest') {
      setBloodTestForm({
        serviceSeekerId: task.serviceSeekerId,
        date: task.date ? new Date(task.date).toISOString().split('T')[0] : '',
        time: task.time || '',
        testType: task.testType,
        notes: task.notes || '',
        completed: task.completed,
        emotion: task.emotion,
      });
    } else if (task.taskType === 'blood_pressure') {
      setBloodPressureForm({
        serviceSeekerId: task.serviceSeekerId,
        date: task.date ? new Date(task.date).toISOString().split('T')[0] : '',
        time: task.time || '',
        systolic: task.systolic,
        diastolic: task.diastolic,
        notes: task.notes || '',
        completed: task.completed,
        emotion: task.emotion,
      });
    } else if (task.taskType === 'comfort_check') {
      setComfortCheckForm({
        serviceSeekerId: task.serviceSeekerId,
        date: task.date ? new Date(task.date).toISOString().split('T')[0] : '',
        time: task.time || '',
        checkType: task.checkType,
        notes: task.notes || '',
        completed: task.completed,
        emotion: task.emotion,
      });
    } else if (task.taskType === 'communication_notes') {
      setCommunicationNotesForm({
        serviceSeekerId: task.serviceSeekerId,
        date: task.date ? new Date(task.date).toISOString().split('T')[0] : '',
        time: task.time || '',
        note: task.note || '',
        emotion: task.emotion,
      });
    } else if (task.taskType === 'encouragement') {
      setEncouragementForm({
        serviceSeekerId: task.serviceSeekerId,
        date: task.date ? new Date(task.date).toISOString().split('T')[0] : '',
        time: task.time || '',
        encouragement: task.encouragement || '',
        note: task.note || '',
        completed: task.completed,
        emotion: task.emotion,
      });
    } else if (task.taskType === 'family_photo_message') {
      setFamilyPhotoMessageForm({
        serviceSeekerId: task.serviceSeekerId,
        date: task.date ? new Date(task.date).toISOString().split('T')[0] : '',
        time: task.time || '',
        messageType: task.messageType,
        fromName: task.fromName || '',
        relationship: task.relationship || '',
        message: task.message || '',
        photoUrl: task.photoUrl || '',
        emotion: task.emotion,
      });
    } else if (task.taskType === 'food_drink') {
      setFoodDrinkForm({
        serviceSeekerId: task.serviceSeekerId,
        date: task.date ? new Date(task.date).toISOString().split('T')[0] : '',
        time: task.time || '',
        mealType: task.mealType,
        amountEaten: task.amountEaten,
        drinkIntake: task.drinkIntake,
        notes: task.notes || '',
        emotion: task.emotion,
      });
    } else if (task.taskType === 'general_support') {
      setGeneralSupportForm({
        serviceSeekerId: task.serviceSeekerId,
        date: task.date ? new Date(task.date).toISOString().split('T')[0] : '',
        time: task.time || '',
        supportListId: task.supportListId,
        notes: task.notes || '',
        completed: task.completed,
        emotion: task.emotion,
      });
    } else if (task.taskType === 'house_keeping') {
      setHouseKeepingForm({
        serviceSeekerId: task.serviceSeekerId,
        date: task.date ? new Date(task.date).toISOString().split('T')[0] : '',
        time: task.time || '',
        taskDescription: task.taskDescription || '',
        areasCleaned: task.areasCleaned || '',
        notes: task.notes || '',
        completed: task.completed,
      });
    } else if (task.taskType === 'incident_fall') {
      setIncidentFallForm({
        serviceSeekerId: task.serviceSeekerId,
        date: task.date ? new Date(task.date).toISOString().split('T')[0] : '',
        time: task.time || '',
        incidentTypeId: task.incidentTypeId,
        incidentLocationId: task.incidentLocationId,
        description: task.description || '',
        actionTaken: task.actionTaken || '',
        injurySustained: task.injurySustained,
        injuryDetails: task.injuryDetails || '',
        witnessedBy: task.witnessedBy || '',
        reportedToManager: task.reportedToManager,
        managerNotifiedAt: task.managerNotifiedAt ? new Date(task.managerNotifiedAt).toISOString().slice(0, 16) : '',
        emotion: task.emotion,
      });
    } else if (task.taskType === 'medicine_prn') {
      setMedicinePrnForm({
        serviceSeekerId: task.serviceSeekerId,
        date: task.date ? new Date(task.date).toISOString().split('T')[0] : '',
        time: task.time || '',
        medicineName: task.medicineName || '',
        dosage: task.dosage || '',
        reason: task.reason || '',
        administered: task.administered,
        notes: task.notes || '',
        emotion: task.emotion,
      });
    } else if (task.taskType === 'muac') {
      setMuacForm({
        serviceSeekerId: task.serviceSeekerId,
        date: task.date ? new Date(task.date).toISOString().split('T')[0] : '',
        time: task.time || '',
        measurement: task.measurement,
        notes: task.notes || '',
        completed: task.completed,
        emotion: task.emotion,
      });
    } else if (task.taskType === 'observation') {
      setObservationForm({
        serviceSeekerId: task.serviceSeekerId,
        date: task.date ? new Date(task.date).toISOString().split('T')[0] : '',
        time: task.time || '',
        observation: task.observation || '',
        emotion: task.emotion,
      });
    } else if (task.taskType === 'one_to_one') {
      setOneToOneForm({
        serviceSeekerId: task.serviceSeekerId,
        date: task.date ? new Date(task.date).toISOString().split('T')[0] : '',
        time: task.time || '',
        activity: task.activity || '',
        duration: task.duration,
        notes: task.notes || '',
        emotion: task.emotion,
      });
    } else if (task.taskType === 'oral_care') {
      setOralCareForm({
        serviceSeekerId: task.serviceSeekerId,
        date: task.date ? new Date(task.date).toISOString().split('T')[0] : '',
        time: task.time || '',
        teethBrushed: task.teethBrushed,
        denturesRemoved: task.denturesRemoved,
        mouthwashUsed: task.mouthwashUsed,
        notes: task.notes || '',
        completed: task.completed,
        emotion: task.emotion,
      });
    } else if (task.taskType === 'oxygen') {
      setOxygenForm({
        serviceSeekerId: task.serviceSeekerId,
        date: task.date ? new Date(task.date).toISOString().split('T')[0] : '',
        time: task.time || '',
        oxygenLevel: task.oxygenLevel,
        notes: task.notes || '',
        completed: task.completed,
        emotion: task.emotion,
      });
    } else if (task.taskType === 'person_centred_task') {
      setPersonCentredTaskForm({
        serviceSeekerId: task.serviceSeekerId,
        date: task.date ? new Date(task.date).toISOString().split('T')[0] : '',
        time: task.time || '',
        taskNameId: task.taskNameId,
        notes: task.notes || '',
        completed: task.completed,
        emotion: task.emotion,
      });
    } else if (task.taskType === 'physical_intervention') {
      setPhysicalInterventionForm({
        serviceSeekerId: task.serviceSeekerId,
        date: task.date ? new Date(task.date).toISOString().split('T')[0] : '',
        time: task.time || '',
        location: task.location || '',
        wereOtherStaffInvolved: task.wereOtherStaffInvolved,
        otherStaffNames: task.otherStaffNames || '',
        wereOtherResidenceInvolved: task.wereOtherResidenceInvolved,
        otherResidenceNamesExplanation: task.otherResidenceNamesExplanation || '',
        wereAnyInjuriesSustained: task.wereAnyInjuriesSustained,
        injuriesExplanation: task.injuriesExplanation || '',
        didResidenceStaffRequireMedication: task.didResidenceStaffRequireMedication,
        medicationExplanation: task.medicationExplanation || '',
        hasAccidentBeenFilled: task.hasAccidentBeenFilled,
        accidentFilledExplanation: task.accidentFilledExplanation || '',
        accidentBookDateTime: task.accidentBookDateTime ? new Date(task.accidentBookDateTime).toISOString().slice(0, 16) : '',
        accidentBookNumber: task.accidentBookNumber || '',
        detailOfPhysicalIntervention: task.detailOfPhysicalIntervention || '',
        techniquesUsed: task.techniquesUsed || '',
        positionOfStaffMembers: task.positionOfStaffMembers || '',
        durationOfPhysicalIntervention: task.durationOfPhysicalIntervention || '',
        wereRestraintsUsed: task.wereRestraintsUsed,
        durationOfWholeIncident: task.durationOfWholeIncident || '',
        wasReportedToManager: task.wasReportedToManager,
        reportedToManagerExplanation: task.reportedToManagerExplanation || '',
        managerReportTime: task.managerReportTime ? new Date(task.managerReportTime).toISOString().slice(0, 16) : '',
        emotion: task.emotion,
        cqcNotified: task.cqcNotified,
        safeguardingNotified: task.safeguardingNotified,
        familyMemberNotified: task.familyMemberNotified,
        externalProfessional: task.externalProfessional,
        signatureUrl: task.signatureUrl || '',
      });
    } else if (task.taskType === 'pulse') {
      setPulseForm({
        serviceSeekerId: task.serviceSeekerId,
        date: task.date ? new Date(task.date).toISOString().split('T')[0] : '',
        time: task.time || '',
        pulseRate: task.pulseRate,
        notes: task.notes || '',
        completed: task.completed,
        emotion: task.emotion,
      });
    } else if (task.taskType === 're_position') {
      setRepositionForm({
        serviceSeekerId: task.serviceSeekerId,
        date: task.date ? new Date(task.date).toISOString().split('T')[0] : '',
        time: task.time || '',
        position: task.position,
        intactOrEpuapGrade: task.intactOrEpuapGrade,
        notes: task.notes || '',
        photoUrl: task.photoUrl || '',
        completed: task.completed,
        emotion: task.emotion,
      });
    } else if (task.taskType === 'spending_money') {
      setSpendingMoneyForm({
        serviceSeekerId: task.serviceSeekerId,
        date: task.date ? new Date(task.date).toISOString().split('T')[0] : '',
        time: task.time || '',
        type: task.type,
        amount: task.amount,
        paidUsing: task.paidUsing,
        receiptUrl: task.receiptUrl || '',
        notes: task.notes || '',
        emotion: task.emotion,
      });
    } else if (task.taskType === 'stool') {
      setStoolForm({
        serviceSeekerId: task.serviceSeekerId,
        date: task.date ? new Date(task.date).toISOString().split('T')[0] : '',
        time: task.time || '',
        type: task.type,
        urinePassed: task.urinePassed,
        notes: task.notes || '',
        completed: task.completed,
        emotion: task.emotion,
      });
    } else if (task.taskType === 'temperature') {
      setTemperatureForm({
        serviceSeekerId: task.serviceSeekerId,
        date: task.date ? new Date(task.date).toISOString().split('T')[0] : '',
        time: task.time || '',
        temperatureInC: task.temperatureInC,
        notes: task.notes || '',
        completed: task.completed,
        emotion: task.emotion,
      });
    } else if (task.taskType === 'visit') {
      setVisitForm({
        serviceSeekerId: task.serviceSeekerId,
        date: task.date ? new Date(task.date).toISOString().split('T')[0] : '',
        time: task.time || '',
        visitType: task.visitType,
        announced: task.announced,
        name: task.name || '',
        relationship: task.relationship || '',
        role: task.role || '',
        purpose: task.purpose || '',
        summary: task.summary || '',
        completed: task.completed,
      });
    } else if (task.taskType === 'weight') {
      setWeightForm({
        serviceSeekerId: task.serviceSeekerId,
        date: task.date ? new Date(task.date).toISOString().split('T')[0] : '',
        time: task.time || '',
        weight: task.weight,
        notes: task.notes || '',
        completed: task.completed,
        emotion: task.emotion,
      });
    } else if (task.taskType === 'follow_up') {
      setFollowUpForm({
        serviceSeekerId: task.serviceSeekerId,
        date: task.date ? new Date(task.date).toISOString().split('T')[0] : '',
        time: task.time || '',
        followUpNote: task.followUpNote || '',
        completed: task.completed,
        emotion: task.emotion,
      });
    }
    setSelectedTaskType(task.taskType);
    setShowModal(true);
  };

  const handleDeleteClick = (task) => {
    setTaskToDelete(task);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const endpointMap = {
        'bathing': 'bathing-tasks',
        'behaviour': 'behaviour-tasks',
        'bloodtest': 'blood-test-tasks',
        'blood_pressure': 'blood-pressure-tasks',
        'comfort_check': 'comfort-check-tasks',
        'communication_notes': 'communication-notes-tasks',
        'encouragement': 'encouragement-tasks',
        'family_photo_message': 'family-photo-message-tasks',
        'food_drink': 'food-drink-tasks',
        'general_support': 'general-support-tasks',
        'house_keeping': 'house-keeping-tasks',
        'incident_fall': 'incident-fall-tasks',
        'medicine_prn': 'medicine-prn-tasks',
        'muac': 'muac-tasks',
        'observation': 'observation-tasks',
        'one_to_one': 'one-to-one-tasks',
        'oral_care': 'oral-care-tasks',
        'oxygen': 'oxygen-tasks',
        'person_centred_task': 'person-centred-tasks',
        'physical_intervention': 'physical-intervention-tasks',
        'pulse': 'pulse-tasks',
        're_position': 'reposition-tasks',
        'spending_money': 'spending-money-tasks',
        'stool': 'stool-tasks',
        'temperature': 'temperature-tasks',
        'visit': 'visit-tasks',
        'weight': 'weight-tasks',
        'follow_up': 'follow-up-tasks'
      };
      const endpoint = endpointMap[taskToDelete.taskType];
      const res = await fetch(`/api/${endpoint}/${taskToDelete.id}`, { 
        method: 'DELETE', 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (res.ok) {
        // Refresh the appropriate task list
        const refreshMap = {
          'bathing': fetchBathingTasks,
          'behaviour': fetchBehaviourTasks,
          'bloodtest': fetchBloodTestTasks,
          'blood_pressure': fetchBloodPressureTasks,
          'comfort_check': fetchComfortCheckTasks,
          'communication_notes': fetchCommunicationNotesTasks,
          'encouragement': fetchEncouragementTasks,
          'family_photo_message': fetchFamilyPhotoMessageTasks,
          'food_drink': fetchFoodDrinkTasks,
          'general_support': fetchGeneralSupportTasks,
          'house_keeping': fetchHouseKeepingTasks,
          'incident_fall': fetchIncidentFallTasks,
          'medicine_prn': fetchMedicinePrnTasks,
          'muac': fetchMuacTasks,
          'observation': fetchObservationTasks,
          'one_to_one': fetchOneToOneTasks,
          'oral_care': fetchOralCareTasks,
          'oxygen': fetchOxygenTasks,
          'person_centred_task': fetchPersonCentredTasks,
          'physical_intervention': fetchPhysicalInterventionTasks,
          'pulse': fetchPulseTasks,
          're_position': fetchRepositionTasks,
          'spending_money': fetchSpendingMoneyTasks,
          'stool': fetchStoolTasks,
          'temperature': fetchTemperatureTasks,
          'visit': fetchVisitTasks,
          'weight': fetchWeightTasks,
          'follow_up': fetchFollowUpTasks
        };
        await refreshMap[taskToDelete.taskType]();
        setNotification({ show: true, message: 'Task deleted successfully.', type: 'success' });
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed' }));
        setNotification({ show: true, message: err?.error || 'Failed to delete task.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ show: true, message: 'Unexpected error while deleting.', type: 'error' });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setTaskToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setTaskToDelete(null);
  };

  const handleDeleteTrigger = async (triggerId) => {
    setDeletingTriggerId(triggerId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/behaviour-triggers/${triggerId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchBehaviourTriggers();
        setNotification({ show: true, message: 'Trigger deleted successfully.', type: 'success' });
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed' }));
        setNotification({ show: true, message: err?.error || 'Failed to delete trigger.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ show: true, message: 'Unexpected error while deleting trigger.', type: 'error' });
    } finally {
      setDeletingTriggerId(null);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#224fa6]"></div>
      </div>
    );
  }

  // Combine all tasks
  const bathingTasksWithType = (Array.isArray(bathingTasks) ? bathingTasks : []).map(t => ({ ...t, taskType: 'bathing' }));
  const behaviourTasksWithType = (Array.isArray(behaviourTasks) ? behaviourTasks : []).map(t => ({ ...t, taskType: 'behaviour' }));
  const bloodTestTasksWithType = (Array.isArray(bloodTestTasks) ? bloodTestTasks : []).map(t => ({ ...t, taskType: 'bloodtest' }));
  const bloodPressureTasksWithType = (Array.isArray(bloodPressureTasks) ? bloodPressureTasks : []).map(t => ({ ...t, taskType: 'blood_pressure' }));
  const comfortCheckTasksWithType = (Array.isArray(comfortCheckTasks) ? comfortCheckTasks : []).map(t => ({ ...t, taskType: 'comfort_check' }));
  const communicationNotesTasksWithType = (Array.isArray(communicationNotesTasks) ? communicationNotesTasks : []).map(t => ({ ...t, taskType: 'communication_notes' }));
  const familyPhotoMessageTasksWithType = (Array.isArray(familyPhotoMessageTasks) ? familyPhotoMessageTasks : []).map(t => ({ ...t, taskType: 'family_photo_message' }));
  const foodDrinkTasksWithType = (Array.isArray(foodDrinkTasks) ? foodDrinkTasks : []).map(t => ({ ...t, taskType: 'food_drink' }));
  const generalSupportTasksWithType = (Array.isArray(generalSupportTasks) ? generalSupportTasks : []).map(t => ({ ...t, taskType: 'general_support' }));
  const houseKeepingTasksWithType = (Array.isArray(houseKeepingTasks) ? houseKeepingTasks : []).map(t => ({ ...t, taskType: 'house_keeping' }));
  const incidentFallTasksWithType = (Array.isArray(incidentFallTasks) ? incidentFallTasks : []).map(t => ({ ...t, taskType: 'incident_fall' }));
  const followUpTasksWithType = (Array.isArray(followUpTasks) ? followUpTasks : []).map(t => ({ ...t, taskType: 'follow_up' }));
  const medicinePrnTasksWithType = (Array.isArray(medicinePrnTasks) ? medicinePrnTasks : []).map(t => ({ ...t, taskType: 'medicine_prn' }));
  const muacTasksWithType = (Array.isArray(muacTasks) ? muacTasks : []).map(t => ({ ...t, taskType: 'muac' }));
  const observationTasksWithType = (Array.isArray(observationTasks) ? observationTasks : []).map(t => ({ ...t, taskType: 'observation' }));
  const oneToOneTasksWithType = (Array.isArray(oneToOneTasks) ? oneToOneTasks : []).map(t => ({ ...t, taskType: 'one_to_one' }));
  const oralCareTasksWithType = (Array.isArray(oralCareTasks) ? oralCareTasks : []).map(t => ({ ...t, taskType: 'oral_care' }));
  const oxygenTasksWithType = (Array.isArray(oxygenTasks) ? oxygenTasks : []).map(t => ({ ...t, taskType: 'oxygen' }));
  const personCentredTasksWithType = (Array.isArray(personCentredTasks) ? personCentredTasks : []).map(t => ({ ...t, taskType: 'person_centred_task' }));
  const physicalInterventionTasksWithType = (Array.isArray(physicalInterventionTasks) ? physicalInterventionTasks : []).map(t => ({ ...t, taskType: 'physical_intervention' }));
  const pulseTasksWithType = (Array.isArray(pulseTasks) ? pulseTasks : []).map(t => ({ ...t, taskType: 'pulse' }));
  const repositionTasksWithType = (Array.isArray(repositionTasks) ? repositionTasks : []).map(t => ({ ...t, taskType: 're_position' }));
  const spendingMoneyTasksWithType = (Array.isArray(spendingMoneyTasks) ? spendingMoneyTasks : []).map(t => ({ ...t, taskType: 'spending_money' }));
  const stoolTasksWithType = (Array.isArray(stoolTasks) ? stoolTasks : []).map(t => ({ ...t, taskType: 'stool' }));
  const temperatureTasksWithType = (Array.isArray(temperatureTasks) ? temperatureTasks : []).map(t => ({ ...t, taskType: 'temperature' }));
  const visitTasksWithType = (Array.isArray(visitTasks) ? visitTasks : []).map(t => ({ ...t, taskType: 'visit' }));
  const weightTasksWithType = (Array.isArray(weightTasks) ? weightTasks : []).map(t => ({ ...t, taskType: 'weight' }));
  const encouragementTasksWithType = (Array.isArray(encouragementTasks) ? encouragementTasks : []).map(t => ({ ...t, taskType: 'encouragement' }));

  const allTasks = [
    ...bathingTasksWithType, 
    ...behaviourTasksWithType,
    ...bloodTestTasksWithType,
    ...bloodPressureTasksWithType,
    ...comfortCheckTasksWithType,
    ...communicationNotesTasksWithType,
    ...encouragementTasksWithType,
    ...familyPhotoMessageTasksWithType,
    ...foodDrinkTasksWithType,
    ...generalSupportTasksWithType,
    ...houseKeepingTasksWithType,
    ...incidentFallTasksWithType,
    ...medicinePrnTasksWithType,
    ...muacTasksWithType,
    ...observationTasksWithType,
    ...oneToOneTasksWithType,
    ...oralCareTasksWithType,
    ...oxygenTasksWithType,
    ...personCentredTasksWithType,
    ...physicalInterventionTasksWithType,
    ...pulseTasksWithType,
    ...repositionTasksWithType,
    ...spendingMoneyTasksWithType,
    ...stoolTasksWithType,
    ...temperatureTasksWithType,
    ...visitTasksWithType,
    ...weightTasksWithType,
    ...followUpTasksWithType
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  const filteredTasks = allTasks.filter((t) => {
    if (filterTaskType !== 'ALL' && filterTaskType !== t.taskType) return false;
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    const userName = `${t.serviceSeeker?.firstName} ${t.serviceSeeker?.lastName}`.toLowerCase();
    return userName.includes(q) || t.bathingType?.toLowerCase().includes(q) || t.type?.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / pageSize));
  const pageSafe = Math.min(currentPage, totalPages);
  const startIdx = (pageSafe - 1) * pageSize;
  const pagedTasks = filteredTasks.slice(startIdx, startIdx + pageSize);

  const getTaskTypeInfo = (taskTypeId) => {
    return TASK_TYPES.find(t => t.id === taskTypeId) || { name: taskTypeId, icon: '📋', color: 'gray' };
  };

  const getTaskIcon = (taskType) => {
    const info = getTaskTypeInfo(taskType);
    return info.icon;
  };

  const getTaskColor = (taskType) => {
    const info = getTaskTypeInfo(taskType);
    return COLOR_CLASSES[info.color] || COLOR_CLASSES.gray;
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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Daily Tasks</h1>
                <p className="text-gray-600">Record and manage daily care tasks</p>
              </div>
              <button onClick={openAddTask} className="bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200">
                Add Task
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">{allTasks.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Today</p>
                  <p className="text-2xl font-bold text-gray-900">{allTasks.filter(t => new Date(t.date).toDateString() === new Date().toDateString()).length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">This Week</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Task Types</p>
                  <p className="text-2xl font-bold text-gray-900">{TASK_TYPES.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  <input value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} placeholder="Search by service user or task type" className="pl-10 pr-4 py-3 w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-gray-50 focus:bg-white text-gray-900" />
                </div>
              </div>
              <div>
                <select value={filterTaskType} onChange={(e)=>setFilterTaskType(e.target.value)} className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#224fa6] focus:border-transparent bg-gray-50 focus:bg-white text-gray-900">
                  <option value="ALL">All Task Types</option>
                  {TASK_TYPES.filter(t => ENABLED_TASKS.includes(t.id)).map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-[1]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Task Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Service User</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pagedTasks.length === 0 ? (
                    <tr>
                      <td className="px-6 py-10 text-gray-500 text-center" colSpan={5}>
                        No daily tasks recorded yet. Click &quot;Add Task&quot; to get started.
                      </td>
                    </tr>
                  ) : (
                    pagedTasks.map((task, idx) => {
                      const taskInfo = getTaskTypeInfo(task.taskType);
                      const emotionEmoji = task.emotion === 'HAPPY' ? '😊' : task.emotion === 'SAD' ? '😢' : '😐';
                      let subInfo = '';
                      if (task.taskType === 'bathing') subInfo = task.bathingType;
                      else if (task.taskType === 'behaviour') subInfo = task.type;
                      else if (task.taskType === 'bloodtest') subInfo = task.when;
                      else if (task.taskType === 'blood_pressure') subInfo = `${task.systolicPressure}/${task.diastolicPressure} mmHg`;
                      else if (task.taskType === 'comfort_check') subInfo = 'Comfort Check';
                      else if (task.taskType === 'communication_notes') subInfo = 'Communication';
                      else if (task.taskType === 'encouragement') subInfo = task.encouragement?.substring(0, 40) + '...';
                      else if (task.taskType === 'family_photo_message') subInfo = task.description ? task.description.substring(0, 30) + '...' : 'Family Photo';
                      else if (task.taskType === 'food_drink') subInfo = task.time ? task.time.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : 'Meal';
                      else if (task.taskType === 'general_support') subInfo = task.supportList?.name || 'Support';
                      else if (task.taskType === 'house_keeping') subInfo = task.task ? (task.task.length > 30 ? task.task.substring(0, 30) + '...' : task.task) : 'Cleaning';
                      else if (task.taskType === 'incident_fall') subInfo = task.incidentType?.type || 'Incident';
                      else if (task.taskType === 'medicine_prn') subInfo = task.medicineName || 'Medicine';
                      else if (task.taskType === 'muac') subInfo = `${task.muacInCm} cm`;
                      else if (task.taskType === 'observation') subInfo = 'Observation';
                      else if (task.taskType === 'one_to_one') subInfo = task.duration || 'Session';
                      else if (task.taskType === 'oral_care') subInfo = task.oralCare?.replace(/_/g, ' ');
                      else if (task.taskType === 'oxygen') subInfo = task.quantity || 'Oxygen';
                      else if (task.taskType === 'person_centred_task') subInfo = task.taskName?.name || 'Person Centred';
                      else if (task.taskType === 'physical_intervention') subInfo = task.location || 'Physical Intervention';
                      else if (task.taskType === 'pulse') subInfo = `${task.pulseRate} bpm`;
                      else if (task.taskType === 're_position') subInfo = task.position?.replace(/_/g, ' ');
                      else if (task.taskType === 'spending_money') subInfo = `£${task.amount?.toFixed(2)}`;
                      else if (task.taskType === 'stool') subInfo = task.type?.replace(/_/g, ' ').substring(0, 30) + '...';
                      else if (task.taskType === 'temperature') subInfo = `${task.temperatureInC}°C`;
                      else if (task.taskType === 'visit') subInfo = `${task.visitType} - ${task.name}`;
                      else if (task.taskType === 'weight') subInfo = `${task.weight} kg`;
                      else if (task.taskType === 'follow_up') subInfo = task.name;
                      return (
                        <tr key={`${task.taskType}-${task.id}`} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className={`w-10 h-10 rounded-lg ${COLOR_CLASSES[taskInfo.color]} flex items-center justify-center text-white text-xl mr-3`}>
                                {taskInfo.icon}
                              </div>
                              <div>
                                <span className="font-medium text-gray-900 block">{taskInfo.name}</span>
                                <span className="text-xs text-gray-500">{subInfo?.replace(/_/g, ' ')}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              {task.serviceSeeker?.photoUrl ? (
                                <img src={task.serviceSeeker.photoUrl} alt={`${task.serviceSeeker.firstName} ${task.serviceSeeker.lastName}`} className="w-10 h-10 rounded-full object-cover border-2 border-gray-200" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#224fa6] to-[#3270e9] flex items-center justify-center text-white font-semibold text-sm border-2 border-gray-200">
                                  {task.serviceSeeker ? `${task.serviceSeeker.firstName?.[0]}${task.serviceSeeker.lastName?.[0]}` : 'SU'}
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-gray-900">{task.serviceSeeker ? `${task.serviceSeeker.firstName} ${task.serviceSeeker.lastName}` : '-'}</div>
                                {task.serviceSeeker?.preferredName && (
                                  <div className="text-xs text-gray-500">{task.serviceSeeker.preferredName}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            <div>{new Date(task.date).toLocaleDateString()}</div>
                            <div className="text-xs text-gray-500">{task.time}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              {task.taskType === 'behaviour' ? (
                                <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700">
                                  {task.trigger?.name || 'Recorded'}
                                </span>
                              ) : task.completed ? (
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  task.completed === 'YES' ? 'bg-green-100 text-green-700' : 
                                  task.completed === 'NO' ? 'bg-red-100 text-red-700' : 
                                  task.completed === 'ATTEMPTED' ? 'bg-yellow-100 text-yellow-700' : 
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {task.completed?.replace(/_/g, ' ')}
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                                  Recorded
                                </span>
                              )}
                              <span className="text-lg">{emotionEmoji}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end space-x-2">
                              <button title="View" onClick={() => handleView(task)} className="p-2 rounded-lg text-gray-700 hover:bg-gray-50">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                              </button>
                              <button title="Edit" onClick={() => handleEdit(task)} className="p-2 rounded-lg text-[#224fa6] hover:bg-blue-50">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                              </button>
                              <button title="Delete" onClick={() => handleDeleteClick(task)} className="p-2 rounded-lg text-red-600 hover:bg-red-50">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <div className="text-sm text-gray-600">
                Showing <span className="font-medium text-gray-900">{Math.min(filteredTasks.length, startIdx + 1)}</span>-
                <span className="font-medium text-gray-900">{Math.min(filteredTasks.length, startIdx + pagedTasks.length)}</span> of
                <span className="font-medium text-gray-900"> {filteredTasks.length}</span>
              </div>
              <div className="flex items-center space-x-2">
                <select value={pageSize} onChange={(e)=>{ setPageSize(parseInt(e.target.value)||10); setCurrentPage(1); }} className="px-2 py-1 border rounded">
                  {[10,20,50].map(n => (<option key={n} value={n}>{n} / page</option>))}
                </select>
                <button onClick={()=> setCurrentPage(p => Math.max(1, p-1))} disabled={pageSafe===1} className={`px-3 py-1 rounded border ${pageSafe===1? 'text-gray-400 bg-gray-50' : 'text-gray-700 bg-white hover:bg-gray-50'}`}>Prev</button>
                <span className="text-sm text-gray-700">Page {pageSafe} / {totalPages}</span>
                <button onClick={()=> setCurrentPage(p => Math.min(totalPages, p+1))} disabled={pageSafe===totalPages} className={`px-3 py-1 rounded border ${pageSafe===totalPages? 'text-gray-400 bg-gray-50' : 'text-gray-700 bg-white hover:bg-gray-50'}`}>Next</button>
              </div>
            </div>
          </div>

          {/* Task Type Selection Modal */}
          {showTaskTypeModal && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-6 max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Select Task Type</h2>
                  <button onClick={()=>setShowTaskTypeModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
                </div>
                <p className="text-gray-600 mb-6">Choose the type of daily task you want to record</p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {TASK_TYPES.map(taskType => {
                    const isEnabled = ENABLED_TASKS.includes(taskType.id);
                    return (
                      <button
                        key={taskType.id}
                        onClick={() => selectTaskType(taskType.id)}
                        disabled={!isEnabled}
                        className={`group relative p-6 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-white hover:to-gray-50 rounded-xl border-2 transition-all duration-200 ${
                          isEnabled
                            ? 'border-gray-200 hover:border-[#224fa6] hover:shadow-lg cursor-pointer' 
                            : 'border-gray-100 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className={`w-16 h-16 ${COLOR_CLASSES[taskType.color]} rounded-xl flex items-center justify-center text-3xl mx-auto mb-3 ${isEnabled ? 'group-hover:scale-110' : ''} transition-transform`}>
                          {taskType.icon}
                        </div>
                        <p className="text-sm font-medium text-gray-900 text-center">{taskType.name}</p>
                        {!isEnabled && (
                          <span className="absolute top-2 right-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Coming Soon</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Bathing Task Modal */}
          {showModal && selectedTaskType === 'bathing' && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-6 my-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-2xl mr-3">
                      🛁
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">Bathing Task</h2>
                  </div>
                  <button onClick={()=>setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
                </div>
                <BathingTaskForm
                  formData={bathingForm}
                  setFormData={setBathingForm}
                  serviceUsers={serviceUsers}
                  isSubmitting={isSubmitting}
                  onSubmit={handleBathingSubmit}
                  onCancel={()=>setShowModal(false)}
                  editing={editing}
                />
              </div>
            </div>
          )}

          {/* Behaviour Task Modal */}
          {showModal && selectedTaskType === 'behaviour' && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-6 my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center text-2xl mr-3">
                      👤
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">Behaviour Task</h2>
                  </div>
                  <button onClick={()=>setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
                </div>
                <BehaviourTaskForm
                  formData={behaviourForm}
                  setFormData={setBehaviourForm}
                  serviceUsers={serviceUsers}
                  behaviourTriggers={behaviourTriggers}
                  isSubmitting={isSubmitting}
                  onSubmit={handleBehaviourSubmit}
                  onCancel={()=>setShowModal(false)}
                  onAddTrigger={()=>setShowTriggerModal(true)}
                  onManageTriggers={()=>setShowManageTriggersModal(true)}
                  editing={editing}
                />
              </div>
            </div>
          )}

          {/* Blood Test Modal */}
          {showModal && selectedTaskType === 'bloodtest' && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-6 my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center text-2xl mr-3">
                      💉
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">Blood Test</h2>
                  </div>
                  <button onClick={()=>setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
                </div>
                <BloodTestTaskForm
                  formData={bloodTestForm}
                  setFormData={setBloodTestForm}
                  serviceUsers={serviceUsers}
                  isSubmitting={isSubmitting}
                  onSubmit={handleBloodTestSubmit}
                  onCancel={()=>setShowModal(false)}
                  editing={editing}
                />
              </div>
            </div>
          )}

          {/* Blood Pressure Modal */}
          {showModal && selectedTaskType === 'blood_pressure' && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-6 my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center text-2xl mr-3">
                      🩺
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">Blood Pressure</h2>
                  </div>
                  <button onClick={()=>setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
                </div>
                <BloodPressureTaskForm
                  formData={bloodPressureForm}
                  setFormData={setBloodPressureForm}
                  serviceUsers={serviceUsers}
                  isSubmitting={isSubmitting}
                  onSubmit={handleBloodPressureSubmit}
                  onCancel={()=>setShowModal(false)}
                  editing={editing}
                />
              </div>
            </div>
          )}

          {/* Comfort Check Modal */}
          {showModal && selectedTaskType === 'comfort_check' && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-6 my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-2xl mr-3">
                      🛏️
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">Comfort Check</h2>
                  </div>
                  <button onClick={()=>setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
                </div>
                <ComfortCheckTaskForm
                  formData={comfortCheckForm}
                  setFormData={setComfortCheckForm}
                  serviceUsers={serviceUsers}
                  isSubmitting={isSubmitting}
                  onSubmit={handleComfortCheckSubmit}
                  onCancel={()=>setShowModal(false)}
                  editing={editing}
                />
              </div>
            </div>
          )}

          {/* Communication Notes Modal */}
          {showModal && selectedTaskType === 'communication_notes' && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-2xl mr-3">
                      📝
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">Communication Notes</h2>
                  </div>
                  <button onClick={()=>setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
                </div>
                <CommunicationNotesTaskForm
                  formData={communicationNotesForm}
                  setFormData={setCommunicationNotesForm}
                  serviceUsers={serviceUsers}
                  isSubmitting={isSubmitting}
                  onSubmit={handleCommunicationNotesSubmit}
                  onCancel={()=>setShowModal(false)}
                  editing={editing}
                />
              </div>
            </div>
          )}

          {showModal && selectedTaskType === 'encouragement' && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center text-2xl mr-3">
                      💪
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">Encouragement</h2>
                  </div>
                  <button onClick={()=>setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
                </div>
                <EncouragementTaskForm
                  formData={encouragementForm}
                  setFormData={setEncouragementForm}
                  serviceSeekers={serviceUsers}
                  isSubmitting={isSubmitting}
                  onSubmit={handleEncouragementSubmit}
                  editing={editing}
                />
              </div>
            </div>
          )}

          {/* Add Trigger Modal */}
          {showTriggerModal && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/40 flex items-center justify-center z-[60] p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Add New Trigger</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Trigger Name *</label>
                    <input 
                      type="text"
                      required
                      value={newTrigger.name} 
                      onChange={(e)=>setNewTrigger({...newTrigger, name:e.target.value})}
                      placeholder="e.g., Loud noises"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Definition</label>
                    <textarea 
                      rows={3}
                      value={newTrigger.define} 
                      onChange={(e)=>setNewTrigger({...newTrigger, define:e.target.value})}
                      placeholder="Define this trigger..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-2">
                    <button 
                      type="button" 
                      onClick={()=>{setShowTriggerModal(false); setNewTrigger({name:'', define:''});}}
                      disabled={isAddingTrigger}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      onClick={handleAddTrigger}
                      disabled={isAddingTrigger}
                      className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 flex items-center justify-center min-w-[120px]"
                    >
                      {isAddingTrigger ? (
                        <>
                          <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Adding...
                        </>
                      ) : 'Add Trigger'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showModal && selectedTaskType === 'family_photo_message' && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center text-2xl mr-3">
                      📷
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">Family Photo/Message</h2>
                  </div>
                  <button onClick={()=>setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
                </div>
                <FamilyPhotoMessageTaskForm
                  formData={familyPhotoMessageForm}
                  setFormData={setFamilyPhotoMessageForm}
                  serviceUsers={serviceUsers}
                  isSubmitting={isSubmitting}
                  onSubmit={handleFamilyPhotoMessageSubmit}
                  onCancel={()=>setShowModal(false)}
                  editing={editing}
                />
              </div>
            </div>
          )}

          {showModal && selectedTaskType === 'food_drink' && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-2xl mr-3">
                      🍽️
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">Food/Drink</h2>
                  </div>
                  <button onClick={()=>setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
                </div>
                <FoodDrinkTaskForm
                  formData={foodDrinkForm}
                  setFormData={setFoodDrinkForm}
                  serviceUsers={serviceUsers}
                  isSubmitting={isSubmitting}
                  onSubmit={handleFoodDrinkSubmit}
                  onCancel={()=>setShowModal(false)}
                  editing={editing}
                />
              </div>
            </div>
          )}

          {showModal && selectedTaskType === 'general_support' && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center text-2xl mr-3">
                      🤝
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">General Support</h2>
                  </div>
                  <button onClick={()=>setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
                </div>
                <GeneralSupportTaskForm
                  formData={generalSupportForm}
                  setFormData={setGeneralSupportForm}
                  serviceUsers={serviceUsers}
                  supportLists={supportLists}
                  isSubmitting={isSubmitting}
                  onSubmit={handleGeneralSupportSubmit}
                  onCancel={()=>setShowModal(false)}
                  onManageSupportLists={()=>setShowSupportListModal(true)}
                  editing={editing}
                />
              </div>
            </div>
          )}

          {showModal && selectedTaskType === 'house_keeping' && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-500 rounded-xl flex items-center justify-center text-2xl mr-3">
                      🧹
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">House Keeping</h2>
                  </div>
                  <button onClick={()=>setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
                </div>
                <HouseKeepingTaskForm
                  formData={houseKeepingForm}
                  setFormData={setHouseKeepingForm}
                  serviceUsers={serviceUsers}
                  isSubmitting={isSubmitting}
                  onSubmit={handleHouseKeepingSubmit}
                  onCancel={()=>setShowModal(false)}
                  editing={editing}
                />
              </div>
            </div>
          )}

          {showModal && selectedTaskType === 'incident_fall' && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-6 my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center text-2xl mr-3">
                      ⚠️
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">Incident/Fall</h2>
                  </div>
                  <button onClick={()=>setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
                </div>
                <IncidentFallTaskForm
                  formData={incidentFallForm}
                  setFormData={setIncidentFallForm}
                  serviceUsers={serviceUsers}
                  incidentTypes={incidentTypes}
                  incidentLocations={incidentLocations}
                  staffUsers={staffUsers}
                  isSubmitting={isSubmitting}
                  onSubmit={handleIncidentFallSubmit}
                  onCancel={()=>setShowModal(false)}
                  onManageIncidentTypes={()=>setShowIncidentTypesModal(true)}
                  onManageLocations={()=>setShowIncidentLocationsModal(true)}
                  editing={editing}
                />
              </div>
            </div>
          )}

          {showModal && selectedTaskType === 'follow_up' && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center text-2xl mr-3">
                      🔄
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">Follow Up</h2>
                  </div>
                  <button onClick={()=>setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
                </div>
                <FollowUpTaskForm
                  formData={followUpForm}
                  setFormData={setFollowUpForm}
                  serviceUsers={serviceUsers}
                  isSubmitting={isSubmitting}
                  onSubmit={handleFollowUpSubmit}
                  onCancel={()=>setShowModal(false)}
                  editing={editing}
                />
              </div>
            </div>
          )}

          {showModal && selectedTaskType === 'medicine_prn' && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center text-2xl mr-3">
                      💊
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">Medicine PRN</h2>
                  </div>
                  <button onClick={()=>setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
                </div>
                <MedicinePrnTaskForm
                  formData={medicinePrnForm}
                  setFormData={setMedicinePrnForm}
                  serviceSeekers={serviceUsers}
                  staffUsers={staffUsers}
                  isSubmitting={isSubmitting}
                  onSubmit={handleMedicinePrnSubmit}
                />
              </div>
            </div>
          )}

          {showModal && selectedTaskType === 'muac' && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-2xl mr-3">
                      📏
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">MUAC</h2>
                  </div>
                  <button onClick={()=>setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
                </div>
                <MuacTaskForm
                  formData={muacForm}
                  setFormData={setMuacForm}
                  serviceSeekers={serviceUsers}
                  isSubmitting={isSubmitting}
                  onSubmit={handleMuacSubmit}
                />
              </div>
            </div>
          )}

          {showModal && selectedTaskType === 'observation' && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center text-2xl mr-3">
                      👁️
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">Observation</h2>
                  </div>
                  <button onClick={()=>setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
                </div>
                <ObservationTaskForm
                  formData={observationForm}
                  setFormData={setObservationForm}
                  serviceSeekers={serviceUsers}
                  isSubmitting={isSubmitting}
                  onSubmit={handleObservationSubmit}
                />
              </div>
            </div>
          )}

          {showModal && selectedTaskType === 'one_to_one' && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-2xl mr-3">
                      👥
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">One to One</h2>
                  </div>
                  <button onClick={()=>setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
                </div>
                <OneToOneTaskForm
                  formData={oneToOneForm}
                  setFormData={setOneToOneForm}
                  serviceSeekers={serviceUsers}
                  isSubmitting={isSubmitting}
                  onSubmit={handleOneToOneSubmit}
                />
              </div>
            </div>
          )}

          {showModal && selectedTaskType === 'oral_care' && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center text-2xl mr-3">
                      🦷
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">Oral Care</h2>
                  </div>
                  <button onClick={()=>setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
                </div>
                <OralCareTaskForm
                  formData={oralCareForm}
                  setFormData={setOralCareForm}
                  serviceSeekers={serviceUsers}
                  isSubmitting={isSubmitting}
                  onSubmit={handleOralCareSubmit}
                />
              </div>
            </div>
          )}

          {showModal && selectedTaskType === 'oxygen' && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-2xl mr-3">
                      💨
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">Oxygen</h2>
                  </div>
                  <button onClick={()=>setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
                </div>
                <OxygenTaskForm
                  formData={oxygenForm}
                  setFormData={setOxygenForm}
                  serviceSeekers={serviceUsers}
                  isSubmitting={isSubmitting}
                  onSubmit={handleOxygenSubmit}
                />
              </div>
            </div>
          )}

          {showModal && selectedTaskType === 'person_centred_task' && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center text-2xl mr-3">
                      ❤️
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">Person Centred Task</h2>
                  </div>
                  <button onClick={()=>setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
                </div>
                <PersonCentredTaskForm
                  formData={personCentredForm}
                  setFormData={setPersonCentredForm}
                  serviceSeekers={serviceUsers}
                  personCentredTaskNames={personCentredTaskNames}
                  isSubmitting={isSubmitting}
                  isAddingTaskName={isAddingPersonCentredTaskName}
                  onSubmit={handlePersonCentredSubmit}
                  onAddTaskName={handleAddPersonCentredTaskName}
                  onManageTaskNames={() => setShowPersonCentredTaskNamesModal(true)}
                />
              </div>
            </div>
          )}

          {showModal && selectedTaskType === 'physical_intervention' && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center text-2xl mr-3">
                      🚨
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">Physical Intervention</h2>
                  </div>
                  <button onClick={()=>setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
                </div>
                <PhysicalInterventionTaskForm
                  formData={physicalInterventionForm}
                  setFormData={setPhysicalInterventionForm}
                  serviceSeekers={serviceUsers}
                  isSubmitting={isSubmitting}
                  onSubmit={handlePhysicalInterventionSubmit}
                  editing={editing}
                />
              </div>
            </div>
          )}

          {showModal && selectedTaskType === 'pulse' && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center text-2xl mr-3">
                      ❤️‍🩹
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">Pulse</h2>
                  </div>
                  <button onClick={()=>setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
                </div>
                <PulseTaskForm
                  formData={pulseForm}
                  setFormData={setPulseForm}
                  serviceSeekers={serviceUsers}
                  isSubmitting={isSubmitting}
                  onSubmit={handlePulseSubmit}
                  editing={editing}
                />
              </div>
            </div>
          )}

          {showModal && selectedTaskType === 're_position' && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center text-2xl mr-3">
                      🔄
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">Re-position</h2>
                  </div>
                  <button onClick={()=>setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
                </div>
                <RepositionTaskForm
                  formData={repositionForm}
                  setFormData={setRepositionForm}
                  serviceSeekers={serviceUsers}
                  isSubmitting={isSubmitting}
                  onSubmit={handleRepositionSubmit}
                  editing={editing}
                />
              </div>
            </div>
          )}

          {showModal && selectedTaskType === 'spending_money' && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-2xl mr-3">
                      💰
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">Spending/Money</h2>
                  </div>
                  <button onClick={()=>setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
                </div>
                <SpendingMoneyTaskForm
                  formData={spendingMoneyForm}
                  setFormData={setSpendingMoneyForm}
                  serviceSeekers={serviceUsers}
                  isSubmitting={isSubmitting}
                  onSubmit={handleSpendingMoneySubmit}
                  editing={editing}
                />
              </div>
            </div>
          )}

          {showModal && selectedTaskType === 'stool' && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-amber-700 rounded-xl flex items-center justify-center text-2xl mr-3">
                      🚽
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">Stool</h2>
                  </div>
                  <button onClick={()=>setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
                </div>
                <StoolTaskForm
                  formData={stoolForm}
                  setFormData={setStoolForm}
                  serviceSeekers={serviceUsers}
                  isSubmitting={isSubmitting}
                  onSubmit={handleStoolSubmit}
                  editing={editing}
                />
              </div>
            </div>
          )}

          {showModal && selectedTaskType === 'temperature' && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center text-2xl mr-3">
                      🌡️
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">Temperature</h2>
                  </div>
                  <button onClick={()=>setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
                </div>
                <TemperatureTaskForm
                  formData={temperatureForm}
                  setFormData={setTemperatureForm}
                  serviceSeekers={serviceUsers}
                  isSubmitting={isSubmitting}
                  onSubmit={handleTemperatureSubmit}
                  editing={editing}
                />
              </div>
            </div>
          )}

          {showModal && selectedTaskType === 'visit' && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center text-2xl mr-3">
                      👥
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">Visit</h2>
                  </div>
                  <button onClick={()=>setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
                </div>
                <VisitTaskForm
                  formData={visitForm}
                  setFormData={setVisitForm}
                  serviceSeekers={serviceUsers}
                  isSubmitting={isSubmitting}
                  onSubmit={handleVisitSubmit}
                  editing={editing}
                />
              </div>
            </div>
          )}

          {showModal && selectedTaskType === 'weight' && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-2xl mr-3">
                      ⚖️
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">Weight</h2>
                  </div>
                  <button onClick={()=>setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
                </div>
                <WeightTaskForm
                  formData={weightForm}
                  setFormData={setWeightForm}
                  serviceSeekers={serviceUsers}
                  isSubmitting={isSubmitting}
                  onSubmit={handleWeightSubmit}
                  editing={editing}
                />
              </div>
            </div>
          )}

          {/* View Modal */}
          {showViewModal && viewData && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-6 my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className={`w-12 h-12 ${
                      viewData.taskType === 'bathing' ? 'bg-blue-500' : 
                      viewData.taskType === 'behaviour' ? 'bg-purple-500' :
                      viewData.taskType === 'bloodtest' ? 'bg-red-500' :
                      viewData.taskType === 'blood_pressure' ? 'bg-red-500' :
                      viewData.taskType === 'comfort_check' ? 'bg-green-500' :
                      viewData.taskType === 'communication_notes' ? 'bg-blue-500' :
                      viewData.taskType === 'encouragement' ? 'bg-yellow-500' :
                      viewData.taskType === 'family_photo_message' ? 'bg-pink-500' :
                      viewData.taskType === 'food_drink' ? 'bg-orange-500' :
                      viewData.taskType === 'general_support' ? 'bg-teal-500' :
                      viewData.taskType === 'house_keeping' ? 'bg-gray-500' :
                      viewData.taskType === 'incident_fall' ? 'bg-red-500' :
                      viewData.taskType === 'medicine_prn' ? 'bg-red-500' :
                      viewData.taskType === 'muac' ? 'bg-blue-500' :
                      viewData.taskType === 'observation' ? 'bg-purple-500' :
                      viewData.taskType === 'one_to_one' ? 'bg-green-500' :
                      viewData.taskType === 'oral_care' ? 'bg-cyan-500' :
                      viewData.taskType === 'oxygen' ? 'bg-blue-500' :
                      viewData.taskType === 'person_centred_task' ? 'bg-pink-500' :
                      viewData.taskType === 'physical_intervention' ? 'bg-red-500' :
                      viewData.taskType === 'pulse' ? 'bg-red-500' :
                      viewData.taskType === 're_position' ? 'bg-indigo-500' :
                      viewData.taskType === 'spending_money' ? 'bg-green-500' :
                      viewData.taskType === 'stool' ? 'bg-amber-700' :
                      viewData.taskType === 'temperature' ? 'bg-red-500' :
                      viewData.taskType === 'visit' ? 'bg-purple-500' :
                      viewData.taskType === 'weight' ? 'bg-green-500' :
                      viewData.taskType === 'follow_up' ? 'bg-indigo-500' :
                      'bg-gray-500'
                    } rounded-xl flex items-center justify-center text-2xl mr-3`}>
                      {viewData.taskType === 'bathing' ? '🛁' : 
                       viewData.taskType === 'behaviour' ? '👤' :
                       viewData.taskType === 'bloodtest' ? '💉' :
                       viewData.taskType === 'blood_pressure' ? '🩺' :
                       viewData.taskType === 'comfort_check' ? '🛏️' :
                       viewData.taskType === 'communication_notes' ? '📝' :
                       viewData.taskType === 'encouragement' ? '💪' :
                       viewData.taskType === 'family_photo_message' ? '📷' :
                       viewData.taskType === 'food_drink' ? '🍽️' :
                       viewData.taskType === 'general_support' ? '🤝' :
                       viewData.taskType === 'house_keeping' ? '🧹' :
                       viewData.taskType === 'incident_fall' ? '⚠️' :
                       viewData.taskType === 'medicine_prn' ? '💊' :
                       viewData.taskType === 'muac' ? '📏' :
                       viewData.taskType === 'observation' ? '👁️' :
                       viewData.taskType === 'one_to_one' ? '👥' :
                       viewData.taskType === 'oral_care' ? '🦷' :
                       viewData.taskType === 'oxygen' ? '💨' :
                       viewData.taskType === 'person_centred_task' ? '❤️' :
                       viewData.taskType === 'physical_intervention' ? '🚨' :
                       viewData.taskType === 'pulse' ? '❤️‍🩹' :
                       viewData.taskType === 're_position' ? '🔄' :
                       viewData.taskType === 'spending_money' ? '💰' :
                       viewData.taskType === 'stool' ? '🚽' :
                       viewData.taskType === 'temperature' ? '🌡️' :
                       viewData.taskType === 'visit' ? '👥' :
                       viewData.taskType === 'weight' ? '⚖️' :
                       viewData.taskType === 'follow_up' ? '🔄' :
                       '❓'}
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">
                      {viewData.taskType === 'bathing' ? 'Bathing' : 
                       viewData.taskType === 'behaviour' ? 'Behaviour' :
                       viewData.taskType === 'bloodtest' ? 'Blood Test' :
                       viewData.taskType === 'blood_pressure' ? 'Blood Pressure' :
                       viewData.taskType === 'comfort_check' ? 'Comfort Check' :
                       viewData.taskType === 'communication_notes' ? 'Communication Notes' :
                       viewData.taskType === 'encouragement' ? 'Encouragement' :
                       viewData.taskType === 'family_photo_message' ? 'Family Photo/Message' :
                       viewData.taskType === 'food_drink' ? 'Food/Drink' :
                       viewData.taskType === 'general_support' ? 'General Support' :
                       viewData.taskType === 'house_keeping' ? 'House Keeping' :
                       viewData.taskType === 'incident_fall' ? 'Incident/Fall' :
                       viewData.taskType === 'medicine_prn' ? 'Medicine PRN' :
                       viewData.taskType === 'muac' ? 'MUAC' :
                       viewData.taskType === 'observation' ? 'Observation' :
                       viewData.taskType === 'one_to_one' ? 'One to One' :
                       viewData.taskType === 'oral_care' ? 'Oral Care' :
                       viewData.taskType === 'oxygen' ? 'Oxygen' :
                       viewData.taskType === 'person_centred_task' ? 'Person Centred Task' :
                       viewData.taskType === 'physical_intervention' ? 'Physical Intervention' :
                       viewData.taskType === 'pulse' ? 'Pulse' :
                       viewData.taskType === 're_position' ? 'Re-position' :
                       viewData.taskType === 'spending_money' ? 'Spending/Money' :
                       viewData.taskType === 'stool' ? 'Stool' :
                       viewData.taskType === 'temperature' ? 'Temperature' :
                       viewData.taskType === 'visit' ? 'Visit' :
                       viewData.taskType === 'weight' ? 'Weight' :
                       viewData.taskType === 'follow_up' ? 'Follow Up' :
                       'Task'} Task Details
                    </h2>
                  </div>
                  <button onClick={()=>setShowViewModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
                </div>
                {viewData.taskType === 'bathing' ? (
                  <BathingTaskView data={viewData} onClose={()=>setShowViewModal(false)} />
                ) : viewData.taskType === 'behaviour' ? (
                  <BehaviourTaskView data={viewData} onClose={()=>setShowViewModal(false)} />
                ) : viewData.taskType === 'bloodtest' ? (
                  <BloodTestTaskView task={viewData} onClose={()=>setShowViewModal(false)} />
                ) : viewData.taskType === 'blood_pressure' ? (
                  <BloodPressureTaskView task={viewData} onClose={()=>setShowViewModal(false)} />
                ) : viewData.taskType === 'comfort_check' ? (
                  <ComfortCheckTaskView task={viewData} onClose={()=>setShowViewModal(false)} />
                ) : viewData.taskType === 'communication_notes' ? (
                  <CommunicationNotesTaskView task={viewData} onClose={()=>setShowViewModal(false)} />
                ) : viewData.taskType === 'encouragement' ? (
                  <EncouragementTaskView task={viewData} />
                ) : viewData.taskType === 'family_photo_message' ? (
                  <FamilyPhotoMessageTaskView task={viewData} onClose={()=>setShowViewModal(false)} />
                ) : viewData.taskType === 'food_drink' ? (
                  <FoodDrinkTaskView task={viewData} onClose={()=>setShowViewModal(false)} />
                ) : viewData.taskType === 'general_support' ? (
                  <GeneralSupportTaskView task={viewData} onClose={()=>setShowViewModal(false)} />
                ) : viewData.taskType === 'house_keeping' ? (
                  <HouseKeepingTaskView task={viewData} onClose={()=>setShowViewModal(false)} />
                ) : viewData.taskType === 'incident_fall' ? (
                  <IncidentFallTaskView task={viewData} onClose={()=>setShowViewModal(false)} />
                ) : viewData.taskType === 'follow_up' ? (
                  <FollowUpTaskView task={viewData} onClose={()=>setShowViewModal(false)} />
                ) : viewData.taskType === 'medicine_prn' ? (
                  <MedicinePrnTaskView task={viewData} />
                ) : viewData.taskType === 'muac' ? (
                  <MuacTaskView task={viewData} />
                ) : viewData.taskType === 'observation' ? (
                  <ObservationTaskView task={viewData} />
                ) : viewData.taskType === 'one_to_one' ? (
                  <OneToOneTaskView task={viewData} />
                ) : viewData.taskType === 'oral_care' ? (
                  <OralCareTaskView task={viewData} />
                ) : viewData.taskType === 'oxygen' ? (
                  <OxygenTaskView task={viewData} />
                ) : viewData.taskType === 'person_centred_task' ? (
                  <PersonCentredTaskView task={viewData} />
                ) : viewData.taskType === 'physical_intervention' ? (
                  <PhysicalInterventionTaskView task={viewData} />
                ) : viewData.taskType === 'pulse' ? (
                  <PulseTaskView task={viewData} />
                ) : viewData.taskType === 're_position' ? (
                  <RepositionTaskView task={viewData} />
                ) : viewData.taskType === 'spending_money' ? (
                  <SpendingMoneyTaskView task={viewData} />
                ) : viewData.taskType === 'stool' ? (
                  <StoolTaskView task={viewData} />
                ) : viewData.taskType === 'temperature' ? (
                  <TemperatureTaskView task={viewData} />
                ) : viewData.taskType === 'visit' ? (
                  <VisitTaskView task={viewData} />
                ) : viewData.taskType === 'weight' ? (
                  <WeightTaskView task={viewData} />
                ) : null}
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
                <div className="p-6">
                  <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete Task</h3>
                  <p className="text-sm text-gray-600 text-center mb-6">
                    Are you sure you want to delete this {taskToDelete?.taskType} task for <span className="font-medium text-gray-900">{taskToDelete?.serviceSeeker ? `${taskToDelete.serviceSeeker.firstName} ${taskToDelete.serviceSeeker.lastName}` : 'this service user'}</span>? This action cannot be undone.
                  </p>
                  <div className="flex space-x-3">
                    <button onClick={handleDeleteCancel} disabled={isDeleting} className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50">Cancel</button>
                    <button onClick={handleDeleteConfirm} disabled={isDeleting} className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center">
                      {isDeleting ? (
                        <>
                          <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Deleting...
                        </>
                      ) : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Manage Triggers Modal */}
          {showManageTriggersModal && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/40 flex items-center justify-center z-[60] p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-semibold text-gray-900">Manage Behaviour Triggers</h3>
                  <button onClick={()=>setShowManageTriggersModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
                </div>
                <div className="space-y-3">
                  {Array.isArray(behaviourTriggers) && behaviourTriggers.map(trigger => (
                    <div key={trigger.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{trigger.name}</p>
                        {trigger.define && (
                          <p className="text-sm text-gray-600 mt-1">{trigger.define}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteTrigger(trigger.id)}
                        disabled={deletingTriggerId === trigger.id}
                        className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[40px]"
                        title="Delete Trigger"
                      >
                        {deletingTriggerId === trigger.id ? (
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        )}
                      </button>
                    </div>
                  ))}
                  {(!behaviourTriggers || behaviourTriggers.length === 0) && (
                    <p className="text-center text-gray-500 py-8">No triggers available. Add triggers using the &quot;+ Add&quot; button in the form.</p>
                  )}
                </div>
                <div className="flex justify-end mt-6 pt-4 border-t">
                  <button onClick={()=>setShowManageTriggersModal(false)} className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white hover:shadow-lg transition-all">
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Manage Support Types Modal */}
          {showSupportListModal && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/40 flex items-center justify-center z-[60] p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-semibold text-gray-900">Manage Support Types</h3>
                  <button onClick={()=>setShowSupportListModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
                </div>

                {/* Add New Support Type */}
                <div className="mb-6 p-4 bg-gradient-to-r from-teal-50 to-teal-100 rounded-xl">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Add New Support Type</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newSupportList}
                      onChange={(e) => setNewSupportList(e.target.value)}
                      placeholder="Support type name..."
                      disabled={isAddingSupportList}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSupportList()}
                    />
                    <button
                      onClick={handleAddSupportList}
                      disabled={isAddingSupportList || !newSupportList.trim()}
                      className="px-4 py-2 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center min-w-[100px]"
                    >
                      {isAddingSupportList ? (
                        <>
                          <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Adding...
                        </>
                      ) : '+ Add'}
                    </button>
                  </div>
                </div>

                {/* Support List Items */}
                <div className="space-y-3">
                  {Array.isArray(supportLists) && supportLists.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.name}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteSupportList(item.id)}
                        disabled={deletingSupportListId === item.id}
                        className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[40px]"
                        title="Delete Support Type"
                      >
                        {deletingSupportListId === item.id ? (
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        )}
                      </button>
                    </div>
                  ))}
                  {(!supportLists || supportLists.length === 0) && (
                    <p className="text-center text-gray-500 py-8">No support types available. Add one using the form above.</p>
                  )}
                </div>
                <div className="flex justify-end mt-6 pt-4 border-t">
                  <button onClick={()=>setShowSupportListModal(false)} className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white hover:shadow-lg transition-all">
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Manage Incident Types Modal */}
          {showIncidentTypesModal && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/40 flex items-center justify-center z-[60] p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-semibold text-gray-900">Manage Incident Types</h3>
                  <button onClick={()=>setShowIncidentTypesModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
                </div>

                {/* Add New Incident Type */}
                <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Add New Incident Type</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newIncidentType}
                      onChange={(e) => setNewIncidentType(e.target.value)}
                      placeholder="Incident type..."
                      disabled={isAddingIncidentType}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddIncidentType()}
                    />
                    <button
                      onClick={handleAddIncidentType}
                      disabled={isAddingIncidentType || !newIncidentType.trim()}
                      className="px-4 py-2 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center min-w-[100px]"
                    >
                      {isAddingIncidentType ? (
                        <>
                          <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Adding...
                        </>
                      ) : '+ Add'}
                    </button>
                  </div>
                </div>

                {/* Incident Types List */}
                <div className="space-y-3">
                  {Array.isArray(incidentTypes) && incidentTypes.map(type => (
                    <div key={type.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{type.type}</p>
                        {!type.canEdit && (
                          <p className="text-xs text-gray-500 mt-1">Default (cannot be deleted)</p>
                        )}
                      </div>
                      {type.canEdit && (
                        <button
                          onClick={() => handleDeleteIncidentType(type.id)}
                          disabled={deletingIncidentTypeId === type.id}
                          className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[40px]"
                          title="Delete Incident Type"
                        >
                          {deletingIncidentTypeId === type.id ? (
                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                  {(!incidentTypes || incidentTypes.length === 0) && (
                    <p className="text-center text-gray-500 py-8">No incident types available.</p>
                  )}
                </div>
                <div className="flex justify-end mt-6 pt-4 border-t">
                  <button onClick={()=>setShowIncidentTypesModal(false)} className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white hover:shadow-lg transition-all">
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Manage Incident Locations Modal */}
          {showIncidentLocationsModal && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/40 flex items-center justify-center z-[60] p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-semibold text-gray-900">Manage Incident Locations</h3>
                  <button onClick={()=>setShowIncidentLocationsModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
                </div>

                {/* Add New Location */}
                <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Add New Location</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newIncidentLocation}
                      onChange={(e) => setNewIncidentLocation(e.target.value)}
                      placeholder="Location name..."
                      disabled={isAddingIncidentLocation}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#224fa6] focus:border-transparent"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddIncidentLocation()}
                    />
                    <button
                      onClick={handleAddIncidentLocation}
                      disabled={isAddingIncidentLocation || !newIncidentLocation.trim()}
                      className="px-4 py-2 bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center min-w-[100px]"
                    >
                      {isAddingIncidentLocation ? (
                        <>
                          <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Adding...
                        </>
                      ) : '+ Add'}
                    </button>
                  </div>
                </div>

                {/* Locations List */}
                <div className="space-y-3">
                  {Array.isArray(incidentLocations) && incidentLocations.map(loc => (
                    <div key={loc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{loc.name}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteIncidentLocation(loc.id)}
                        disabled={deletingIncidentLocationId === loc.id}
                        className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[40px]"
                        title="Delete Location"
                      >
                        {deletingIncidentLocationId === loc.id ? (
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        )}
                      </button>
                    </div>
                  ))}
                  {(!incidentLocations || incidentLocations.length === 0) && (
                    <p className="text-center text-gray-500 py-8">No locations available. Add one using the form above.</p>
                  )}
                </div>
                <div className="flex justify-end mt-6 pt-4 border-t">
                  <button onClick={()=>setShowIncidentLocationsModal(false)} className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#224fa6] to-[#3270e9] text-white hover:shadow-lg transition-all">
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notification */}
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

