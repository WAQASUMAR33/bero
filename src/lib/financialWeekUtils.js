/**
 * Generates 52 weeks for a given year starting from the first Monday of January.
 * Matches the layout in Service User Finances.xlsx
 */
export function get52WeeksForYear(year = 2026) {
  // Find first Monday in January of year
  const jan1 = new Date(year, 0, 1);
  let dayOfWeek = jan1.getDay(); // 0 is Sunday, 1 is Monday
  let offsetToMonday = (8 - dayOfWeek) % 7;
  if (dayOfWeek === 1) offsetToMonday = 0;
  
  const firstMonday = new Date(year, 0, 1 + offsetToMonday);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weeks = [];
  for (let w = 1; w <= 52; w++) {
    const d = new Date(firstMonday);
    d.setDate(firstMonday.getDate() + (w - 1) * 7);

    const monthIndex = d.getMonth();
    const monthName = months[monthIndex];

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    weeks.push({
      weekNumber: w,
      monthName,
      monthIndex: monthIndex + 1,
      date: dateStr, // YYYY-MM-DD
      formattedDate: `${dd}/${mm}/${yyyy}`,
    });
  }

  return weeks;
}

export function getWeekInfoForDate(dateInput, year = 2026) {
  const target = new Date(dateInput);
  const y = target.getFullYear() || year;
  const weeks = get52WeeksForYear(y);
  const targetTime = target.getTime();

  for (let i = 0; i < weeks.length; i++) {
    const weekStart = new Date(weeks[i].date).getTime();
    const weekEnd = weekStart + 7 * 24 * 60 * 60 * 1000;
    if (targetTime >= weekStart && targetTime < weekEnd) {
      return weeks[i];
    }
  }

  if (targetTime < new Date(weeks[0].date).getTime()) return weeks[0];
  return weeks[weeks.length - 1];
}
