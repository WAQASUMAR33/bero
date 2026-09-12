/**
 * Utility to calculate evaluation status and lifecycle for Support Plans and Risk Assessment Forms.
 * 
 * Business Rule:
 * - A form is Completed when at least 1 record exists.
 * - Completed forms start GREEN (up to date).
 * - After 1 month from creation (if no evaluation) or after 1 month from the latest evaluation,
 *   the form turns RED (overdue for evaluation).
 * - Once evaluated, it turns GREEN again for 1 month from that evaluation date.
 */

/**
 * Safely adds 1 calendar month to a given date, handling end-of-month bounds.
 * (e.g., Jan 31 + 1 month => Feb 28 / Feb 29)
 */
export function addOneMonth(dateInput) {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return new Date();
  
  const originalDay = d.getDate();
  d.setMonth(d.getMonth() + 1);
  
  // If the day changed due to month rollover (e.g. Feb 30 -> Mar 2), clamp to end of month
  if (d.getDate() !== originalDay) {
    d.setDate(0);
  }
  return d;
}

/**
 * Calculates evaluation status for a single record (Outcome or Risk Assessment).
 * 
 * @param {Object} record - The outcome or risk assessment record.
 * @returns {Object} Status details
 */
export function getEvaluationStatus(record) {
  if (!record) {
    return {
      status: 'NOT_COMPLETED',
      label: 'Not Completed',
      sublabel: 'No records created',
      color: 'gray',
      isOverdue: false,
      isEvaluated: false,
      evaluationsCount: 0,
    };
  }

  // Extract evaluations from record (Support plans use record.data.evaluations, Risk assessments use record.extra.evaluations)
  const evals = Array.isArray(record.data?.evaluations)
    ? record.data.evaluations
    : Array.isArray(record.extra?.evaluations)
    ? record.extra.evaluations
    : [];

  let latestEvalTimestamp = null;
  let latestEvalDateStr = null;

  if (evals.length > 0) {
    evals.forEach(ev => {
      const dateVal = ev.date || ev.createdAt;
      if (dateVal) {
        const t = new Date(dateVal).getTime();
        if (!isNaN(t) && (latestEvalTimestamp === null || t > latestEvalTimestamp)) {
          latestEvalTimestamp = t;
          latestEvalDateStr = dateVal;
        }
      }
    });
  }

  const isEvaluated = latestEvalTimestamp !== null;
  let refTimestamp = latestEvalTimestamp;
  let refDateStr = latestEvalDateStr;

  // If no evaluation has been performed yet, reference is creation or lastAssessed date
  if (!isEvaluated) {
    const initialDate = record.lastAssessed || record.createdAt || record.updatedAt;
    if (initialDate) {
      const t = new Date(initialDate).getTime();
      if (!isNaN(t)) {
        refTimestamp = t;
        refDateStr = initialDate;
      }
    }
  }

  // Fallback if no valid date found
  if (!refTimestamp) {
    return {
      status: 'GREEN',
      label: 'Completed',
      sublabel: 'Up to date',
      color: 'green',
      isOverdue: false,
      isEvaluated: false,
      evaluationsCount: evals.length,
      dueDate: null,
      refDate: null,
    };
  }

  const refDate = new Date(refTimestamp);
  const dueDate = addOneMonth(refDate);
  const now = new Date();

  // Overdue check
  const isOverdue = now.getTime() > dueDate.getTime();
  const diffMs = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (isOverdue) {
    const daysOverdue = Math.max(1, Math.abs(diffDays));
    return {
      status: 'RED',
      label: isEvaluated ? 'Evaluation Overdue' : 'Needs Evaluation',
      sublabel: `${daysOverdue} day${daysOverdue === 1 ? '' : 's'} overdue`,
      color: 'red',
      isOverdue: true,
      isEvaluated,
      daysDiff: -daysOverdue,
      refDate,
      refDateStr,
      dueDate,
      evaluationsCount: evals.length,
    };
  }

  const daysRemaining = Math.max(0, diffDays);
  return {
    status: 'GREEN',
    label: isEvaluated ? 'Evaluated (Up to date)' : 'Completed (Up to date)',
    sublabel: daysRemaining === 0 ? 'Evaluation due today' : `Due in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`,
    color: 'green',
    isOverdue: false,
    isEvaluated,
    daysDiff: daysRemaining,
    refDate,
    refDateStr,
    dueDate,
    evaluationsCount: evals.length,
  };
}

/**
 * Helper to get the most recent activity timestamp for a record,
 * taking into account its evaluations, lastAssessed, updatedAt, and createdAt.
 */
export function getRecordLatestTimestamp(record) {
  if (!record) return 0;
  let latestTime = 0;

  const evals = Array.isArray(record.data?.evaluations)
    ? record.data.evaluations
    : Array.isArray(record.extra?.evaluations)
    ? record.extra.evaluations
    : [];

  evals.forEach(ev => {
    const dateVal = ev.date || ev.createdAt;
    if (dateVal) {
      const t = new Date(dateVal).getTime();
      if (!isNaN(t) && t > latestTime) latestTime = t;
    }
  });

  const baseDate = record.lastAssessed || record.updatedAt || record.createdAt;
  if (baseDate) {
    const t = new Date(baseDate).getTime();
    if (!isNaN(t) && t > latestTime) {
      latestTime = t;
    }
  }

  return latestTime;
}

/**
 * Calculates overall status for a category based on all its records.
 * The active/most recent record determines if the category is Green or Red.
 * 
 * @param {Array} categoryRecords - Array of records for this category.
 * @returns {Object} Overall category status
 */
export function getCategoryOverallStatus(categoryRecords) {
  if (!Array.isArray(categoryRecords) || categoryRecords.length === 0) {
    return {
      status: 'NOT_COMPLETED',
      label: 'Not Started',
      sublabel: 'No entry created',
      color: 'gray',
      isOverdue: false,
      isEvaluated: false,
      recordCount: 0,
      latestRecord: null,
    };
  }

  // Sort by latest activity timestamp descending (most recently evaluated / created first)
  const sorted = [...categoryRecords].sort((a, b) => {
    const timeA = getRecordLatestTimestamp(a);
    const timeB = getRecordLatestTimestamp(b);
    return timeB - timeA;
  });

  const latestRecord = sorted[0];
  const evalStatus = getEvaluationStatus(latestRecord);

  return {
    ...evalStatus,
    recordCount: categoryRecords.length,
    latestRecord,
  };
}
