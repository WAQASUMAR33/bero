import { prisma } from './prisma';

/**
 * Check if a date matches the frequency pattern
 */
function shouldCreateTaskForDate(schedule, targetDate) {
  const frequency = schedule.frequency;
  const scheduleDate = new Date(schedule.createdAt);
  scheduleDate.setHours(0, 0, 0, 0);
  
  const targetDateCopy = new Date(targetDate);
  targetDateCopy.setHours(0, 0, 0, 0);
  
  // If schedule was created after target date, don't create task
  if (scheduleDate > targetDateCopy) {
    return false;
  }
  
  switch (frequency) {
    case 'Daily':
      return true; // Create task every day (starting from the day it was created)
    
    case 'Weekly': {
      // Create task on the same day of week as when schedule was created
      const scheduleDayOfWeek = scheduleDate.getDay();
      const targetDayOfWeek = targetDateCopy.getDay();
      return scheduleDayOfWeek === targetDayOfWeek;
    }
    
    case 'Fortnightly': {
      // Create task every 2 weeks on the same day
      const daysDiff = Math.floor((targetDateCopy - scheduleDate) / (1000 * 60 * 60 * 24));
      return daysDiff >= 0 && daysDiff % 14 === 0;
    }
    
    case 'Every 3 weeks': {
      // Create task every 3 weeks on the same day
      const daysDiff = Math.floor((targetDateCopy - scheduleDate) / (1000 * 60 * 60 * 24));
      return daysDiff >= 0 && daysDiff % 21 === 0;
    }
    
    case 'Monthly': {
      // Create task on the same day of month (e.g., if created on 15th, create on 15th of each month)
      const scheduleDay = scheduleDate.getDate();
      const targetDay = targetDateCopy.getDate();
      return scheduleDay === targetDay;
    }
    
    case 'Quarterly': {
      // Create task every 3 months on the same day
      const scheduleMonth = scheduleDate.getMonth();
      const scheduleDay = scheduleDate.getDate();
      const targetMonth = targetDateCopy.getMonth();
      const targetDay = targetDateCopy.getDate();
      
      if (targetDay !== scheduleDay) return false;
      
      const monthsDiff = (targetDateCopy.getFullYear() - scheduleDate.getFullYear()) * 12 + (targetMonth - scheduleMonth);
      return monthsDiff >= 0 && monthsDiff % 3 === 0;
    }
    
    case 'Yearly': {
      // Create task on the same date each year
      const scheduleMonth = scheduleDate.getMonth();
      const scheduleDay = scheduleDate.getDate();
      const targetMonth = targetDateCopy.getMonth();
      const targetDay = targetDateCopy.getDate();
      return scheduleMonth === targetMonth && scheduleDay === targetDay;
    }
    
    case 'Rota Days': {
      // For rota days, we'd need to check against the rota schedule
      // For now, treat it as daily
      return true;
    }
    
    default:
      return false;
  }
}

/**
 * Generate encouragement tasks from schedules for a specific date
 * @param {number|number[]} serviceSeekerIds - Single ID or array of IDs
 * @param {Date} targetDate - The date to generate tasks for
 * @param {number} userId - User ID for createdBy/updatedBy
 * @returns {Promise<number>} Number of tasks created
 */
export async function generateEncouragementTasksFromSchedules(serviceSeekerIds, targetDate, userId = 1) {
  try {
    const targetDateStart = new Date(targetDate);
    targetDateStart.setHours(0, 0, 0, 0);
    
    const targetDateEnd = new Date(targetDateStart);
    targetDateEnd.setDate(targetDateEnd.getDate() + 1);
    
    // Get all active encouragement schedules for the service seeker(s)
    const scheduleWhere = Array.isArray(serviceSeekerIds) 
      ? { serviceSeekerId: { in: serviceSeekerIds } }
      : { serviceSeekerId: serviceSeekerIds };
    
    const schedules = await prisma.serviceSeekerEncouragementSchedule.findMany({
      where: scheduleWhere,
    });
    
    if (schedules.length === 0) {
      console.log(`[generateEncouragementTasks] No schedules found for service seeker(s): ${Array.isArray(serviceSeekerIds) ? serviceSeekerIds.join(', ') : serviceSeekerIds}`);
      return 0;
    }
    
    console.log(`[generateEncouragementTasks] Found ${schedules.length} schedule(s) for date ${targetDateStart.toISOString().split('T')[0]}`);
    
    // Check which tasks already exist for this date
    const existingTasks = await prisma.encouragementTask.findMany({
      where: {
        serviceSeekerId: Array.isArray(serviceSeekerIds) ? { in: serviceSeekerIds } : serviceSeekerIds,
        date: {
          gte: targetDateStart,
          lt: targetDateEnd,
        },
      },
      select: {
        serviceSeekerId: true,
        time: true,
      },
    });
    
    // Create a set of existing task keys (serviceSeekerId-time) for quick lookup
    const existingTaskKeys = new Set(
      existingTasks.map(t => `${t.serviceSeekerId}-${t.time}`)
    );
    
    let tasksCreated = 0;
    
    // Generate tasks from schedules
    for (const schedule of schedules) {
      // Check if this schedule should create a task for this date
      if (!shouldCreateTaskForDate(schedule, targetDateStart)) {
        continue;
      }
      
      const times = Array.isArray(schedule.times) ? schedule.times : [];
      
      for (const timeSlot of times) {
        if (!timeSlot.hour || !timeSlot.minute) continue;
        
        const timeString = `${String(timeSlot.hour).padStart(2, '0')}:${String(timeSlot.minute).padStart(2, '0')}`;
        const taskKey = `${schedule.serviceSeekerId}-${timeString}`;
        
        // Skip if task already exists
        if (existingTaskKeys.has(taskKey)) {
          continue;
        }
        
        try {
          // Parse pictureUrl from note if it exists
          let pictureUrl = null;
          if (schedule.pictureUrl) {
            pictureUrl = schedule.pictureUrl;
          }
          
          await prisma.encouragementTask.create({
            data: {
              serviceSeekerId: schedule.serviceSeekerId,
              date: targetDateStart,
              time: timeString,
              encouragement: schedule.encouragement || '',
              note: pictureUrl ? JSON.stringify({ pictureUrl }) : null,
              completed: 'NO',
              emotion: 'NEUTRAL',
              createdById: userId,
              updatedById: userId,
            },
          });
          
          tasksCreated++;
          existingTaskKeys.add(taskKey); // Add to set to prevent duplicates in same batch
          console.log(`[generateEncouragementTasks] Created task for service seeker ${schedule.serviceSeekerId} at ${timeString}`);
        } catch (error) {
          // Skip if task already exists (race condition)
          if (error.code !== 'P2002') {
            console.error('Error creating encouragement task from schedule:', error);
          }
        }
      }
    }
    
    console.log(`[generateEncouragementTasks] Created ${tasksCreated} task(s) for date ${targetDateStart.toISOString().split('T')[0]}`);
    return tasksCreated;
  } catch (error) {
    console.error('Error generating encouragement tasks from schedules:', error);
    return 0;
  }
}

