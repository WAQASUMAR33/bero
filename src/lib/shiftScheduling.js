const RECURRENCE_DAY_MAP = {
  DAILY: 1,
  WEEK: 7,
  TWO_WEEK: 14,
  THREE_WEEK: 21,
  FOUR_WEEK: 28,
  FIVE_WEEK: 35,
  SIX_WEEK: 42,
  SEVEN_WEEK: 49,
  EIGHT_WEEK: 56,
  NINE_WEEK: 63,
  TEN_WEEK: 70,
  TWO_DAY: 2,
  THREE_DAY: 3,
  FOUR_DAY: 4,
  FIVE_DAY: 5,
  SIX_DAY: 6,
};

export function getRecurrenceIncrementDays(recurrence) {
  return RECURRENCE_DAY_MAP[recurrence] ?? 0;
}

export function generateOccurrences(fromDateInput, untilDateInput, recurrence, limit = 60) {
  if (!fromDateInput) return [];

  const occurrences = [];
  const fromDate = new Date(fromDateInput);
  if (Number.isNaN(fromDate.getTime())) return occurrences;

  const untilDate = untilDateInput ? new Date(untilDateInput) : null;
  const incrementDays = getRecurrenceIncrementDays(recurrence);

  let current = new Date(fromDate);
  let iterations = 0;

  while (iterations < limit) {
    const occurrence = new Date(current);
    occurrence.setHours(0, 0, 0, 0);
    occurrences.push(occurrence);

    if (!untilDate) break;

    if (!incrementDays) {
      // No recognised recurrence increment, only schedule the first occurrence
      break;
    }

    current.setDate(current.getDate() + incrementDays);
    if (current > untilDate) {
      break;
    }

    iterations += 1;
  }

  return occurrences;
}

export function parseTimeToMinutes(timeString) {
  if (!timeString) return null;
  const [hours, minutes] = timeString.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

export function normaliseTimeRange(startMinutes, endMinutes) {
  if (startMinutes === null || endMinutes === null) {
    return null;
  }

  let adjustedEnd = endMinutes;
  if (endMinutes <= startMinutes) {
    adjustedEnd = endMinutes + 24 * 60; // Overnight shift wraps to next day
  }

  return {
    start: startMinutes,
    end: adjustedEnd,
  };
}

export function doTimeRangesOverlap(rangeA, rangeB) {
  if (!rangeA || !rangeB) return false;
  return rangeA.start < rangeB.end && rangeB.start < rangeA.end;
}

export function buildShiftAssignmentData({ shiftId, userIds, fromDate, untilDate, recurrence }) {
  const occurrences = generateOccurrences(fromDate, untilDate, recurrence);
  if (!Array.isArray(userIds) || userIds.length === 0 || occurrences.length === 0) {
    return [];
  }

  const data = [];
  occurrences.forEach((occurrence) => {
    const date = new Date(occurrence);
    date.setHours(0, 0, 0, 0);
    userIds.forEach((userId) => {
      data.push({
        shiftId,
        userId,
        date,
      });
    });
  });

  return data;
}
