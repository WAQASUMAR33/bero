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
import BathingTaskView from './components/BathingTaskView';
import BehaviourTaskView from './components/BehaviourTaskView';

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

const ENABLED_TASKS = ['bathing', 'behaviour', 'bloodtest', 'blood_pressure', 'comfort_check', 'communication_notes'];

export default function DailyTasksPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bathingTasks, setBathingTasks] = useState([]);
  const [behaviourTasks, setBehaviourTasks] = useState([]);
  const [bloodTestTasks, setBloodTestTasks] = useState([]);
  const [bloodPressureTasks, setBloodPressureTasks] = useState([]);
  const [comfortCheckTasks, setComfortCheckTasks] = useState([]);
  const [communicationNotesTasks, setCommunicationNotesTasks] = useState([]);
  const [behaviourTriggers, setBehaviourTriggers] = useState([]);
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [newTrigger, setNewTrigger] = useState({ name: '', define: '' });
  const [isAddingTrigger, setIsAddingTrigger] = useState(false);
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

  useEffect(() => { 
    if (user) {
      fetchBathingTasks();
      fetchBehaviourTasks();
      fetchBloodTestTasks();
      fetchBloodPressureTasks();
      fetchComfortCheckTasks();
      fetchCommunicationNotesTasks();
      fetchBehaviourTriggers();
      fetchServiceUsers();
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
      const endpoint = task.taskType === 'bathing' ? 'bathing-tasks' : 'behaviour-tasks';
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
        serviceSeekerId: task.serviceSeekerId,
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
      const endpoint = taskToDelete.taskType === 'bathing' ? 'bathing-tasks' : 'behaviour-tasks';
      const res = await fetch(`/api/${endpoint}/${taskToDelete.id}`, { 
        method: 'DELETE', 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (res.ok) {
        if (taskToDelete.taskType === 'bathing') {
          await fetchBathingTasks();
        } else {
          await fetchBehaviourTasks();
        }
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
  const allTasks = [...bathingTasksWithType, ...behaviourTasksWithType].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
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
                      const subInfo = task.taskType === 'bathing' ? task.bathingType : task.type;
                      return (
                        <tr key={task.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors`}>
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
                              {task.taskType === 'bathing' ? (
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  task.completed === 'YES' ? 'bg-green-100 text-green-700' : 
                                  task.completed === 'NO' ? 'bg-red-100 text-red-700' : 
                                  task.completed === 'ATTEMPTED' ? 'bg-yellow-100 text-yellow-700' : 
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {task.completed?.replace(/_/g, ' ')}
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700">
                                  {task.trigger?.name || 'Recorded'}
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
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-6 my-8">
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
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-6 my-8">
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
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 my-8">
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

          {/* View Modal */}
          {showViewModal && viewData && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-6 my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className={`w-12 h-12 ${viewData.taskType === 'bathing' ? 'bg-blue-500' : 'bg-purple-500'} rounded-xl flex items-center justify-center text-2xl mr-3`}>
                      {viewData.taskType === 'bathing' ? '🛁' : '👤'}
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">{viewData.taskType === 'bathing' ? 'Bathing' : 'Behaviour'} Task Details</h2>
                  </div>
                  <button onClick={()=>setShowViewModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
                </div>
                {viewData.taskType === 'bathing' ? (
                  <BathingTaskView data={viewData} onClose={()=>setShowViewModal(false)} />
                ) : (
                  <BehaviourTaskView data={viewData} onClose={()=>setShowViewModal(false)} />
                )}
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

