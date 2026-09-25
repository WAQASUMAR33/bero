/**
 * Support Plan / Outcomes Categories
 * Shared between OutcomesForm (Support Plans) and RiskAssessmentsForm (Linking Risk Assessments into Support Plans)
 */

export const SUPPORT_PLAN_CATEGORIES = [
  { key: 'ABOUT_ME', title: 'About me', icon: '', tag: 'Personal' },
  { key: 'PHYSICAL_HEALTH', title: 'My Physical Health', icon: '', tag: 'Clinical' },
  { key: 'MENTAL_HEALTH', title: 'Mental Health', icon: '', tag: 'Clinical' },
  { key: 'COMMUNICATION', title: 'Communication', icon: '', tag: 'Care' },
  { key: 'ORAL_CARE', title: 'My Oral Care', icon: '', tag: 'Personal Care' },
  { key: 'SKIN_INTEGRITY', title: 'Skin Integrity', icon: '', tag: 'Clinical' },
  { key: 'MEDICATION', title: 'Medication', icon: '', tag: 'Clinical' },
  { key: 'NUTRITION_HYDRATION', title: 'Nutrition & Hydration', icon: '', tag: 'Nutrition' },
  { key: 'CONTINENCE_CARE', title: 'Continence Care', icon: '', tag: 'Personal Care' },
  { key: 'MOBILITY', title: 'Mobility', icon: '', tag: 'Physical' },
  { key: 'MY_NEEDS_SUPPORT', title: 'My Needs/Support', icon: '', tag: 'Care' },
  { key: 'DECISION_MAKING', title: 'Decision making', icon: '', tag: 'Legal/Consent' },
  { key: 'EMOTIONAL_SUPPORT', title: 'Emotional Support', icon: '', tag: 'Wellbeing' },
  { key: 'RIGHTS_CONSENT_CAPACITY', title: 'Rights, Consent and Capacity', icon: '', tag: 'Legal/Consent' },
  { key: 'MEDICAL_CONDITIONS_DIAGNOSIS', title: 'Medical Conditions and Diagnosis', icon: '', tag: 'Clinical' },
  { key: 'PERSONAL_CARE', title: 'Personal Care', icon: '', tag: 'Personal Care' },
  { key: 'SLEEP', title: 'Sleep', icon: '', tag: 'Wellbeing' },
  { key: 'BREATHING', title: 'Breathing', icon: '', tag: 'Clinical' },
  { key: 'ALTERED_STATES_OF_CONSCIOUSNESS', title: 'Altered States of Consciousness', icon: '', tag: 'Clinical' },
  { key: 'LIFE_HISTORY', title: 'Life History', icon: '', tag: 'Personal' },
  { key: 'RELIGION_AND_CULTURE', title: 'Religion and Culture', icon: '', tag: 'Personal' },
  { key: 'SEXUALITY_AND_GENDER', title: 'Sexuality and Gender', icon: '', tag: 'Personal' },
  { key: 'PSYCHOLOGICAL_MENTAL_HEALTH', title: 'Psychological & Mental Health', icon: '', tag: 'Clinical' },
  { key: 'POSITIVE_BEHAVIOUR_SUPPORT', title: 'Positive Behaviour Support', icon: '', tag: 'Behaviour' },
  { key: 'PERSONAL_RELATIONSHIPS', title: 'Personal Relationships', icon: '', tag: 'Social' },
  { key: 'HOBBIES_AND_INTERESTS', title: 'Hobbies and Interests', icon: '', tag: 'Social' },
  { key: 'EDUCATION_AND_EMPLOYMENT', title: 'Education and Employment', icon: '', tag: 'Social' },
  { key: 'SMOKING', title: 'Smoking', icon: '', tag: 'Lifestyle' },
  { key: 'ALCOHOL_INTAKE', title: 'Alcohol Intake', icon: '', tag: 'Lifestyle' },
  { key: 'SUBSTANCE_MISUSE', title: 'Substance Misuse', icon: '', tag: 'Lifestyle' },
  { key: 'COMMUNICATION_RECORDS', title: 'Communication Records', icon: '', tag: 'Communication' },
];

export function getSupportPlanTitle(categoryKey) {
  const found = SUPPORT_PLAN_CATEGORIES.find(c => c.key === categoryKey);
  return found ? found.title : categoryKey;
}

export function getSupportPlanCategory(categoryKey) {
  return SUPPORT_PLAN_CATEGORIES.find(c => c.key === categoryKey) || null;
}
