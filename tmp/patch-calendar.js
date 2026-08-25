const fs = require('fs');

const manageRotaFile = 'e:\\project_1\\new-beeru\\src\\app\\admin\\manage-rota\\page.js';
let content = fs.readFileSync(manageRotaFile, 'utf8');

content = content.replace(
  '<div className="flex-1 flex flex-col lg:ml-64">',
  '<div className="flex-1 min-w-0 flex flex-col lg:ml-64">'
);

const timeSlotLogicRegex = /const getShiftsForTimeSlot[\s\S]*?const isInTimeRange = shiftStartsInSlot \|\| shiftOverlapsSlot;\s*if \(!isInTimeRange\) return false;/;
const newFunctionLogic = `const processLanes = (shiftsForDay) => {
    const lanes = [];
    const result = [];
    shiftsForDay.forEach(shift => {
      const [startH, startM] = shift.startTime.split(':').map(Number);
      let [endH, endM] = shift.endTime.split(':').map(Number);
      let startMins = startH * 60 + startM;
      let endMins = endH * 60 + endM;
      if (endMins <= startMins) endMins += 24 * 60;
      let laneIdx = 0;
      while (true) {
        const lane = lanes[laneIdx] || [];
        if (!lane.some(s => Math.max(startMins, s.start) < Math.min(endMins, s.end))) {
          lanes[laneIdx] = [...lane, { start: startMins, end: endMins }];
          result.push({ ...shift, _lane: laneIdx, _start: startMins, _end: endMins });
          break;
        }
        laneIdx++;
      }
    });
    return result;
  };

  const getShiftsForDate = (date) => {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    const matchingShifts = shifts.filter(shift => {`;
content = content.replace(timeSlotLogicRegex, newFunctionLogic);

const calendarRegex = /\{\/\* Calendar Grid \*\/\}[\s\S]*?(?=\{\/\* Create\/Edit Shift Modal \*\/\})/;
const newCalendarLogic = `{/* Calendar Grid */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 mb-8 mx-auto w-full">
            <div className="overflow-x-auto pb-4">
              <div style={{ width: '3800px' }} className="relative bg-white">
                {/* Header */}
                <div className="flex border-b border-gray-200 bg-gray-100 sticky top-0 z-30">
                  <div className="w-[120px] flex-shrink-0 border-r border-gray-200 p-3 font-semibold text-gray-700 sticky left-0 bg-gray-100 z-40">
                    Day / Time
                  </div>
                  {hours.map(hour => (
                    <div key={hour} className="flex-1 border-r border-gray-200 p-3 text-center">
                      <div className="font-semibold text-gray-900">
                        {hour.toString().padStart(2, '0')}:00
                      </div>
                    </div>
                  ))}
                </div>

                {/* Day Rows */}
                {weekDays.map((day, idx) => {
                  const dayShifts = getShiftsForDate(day);
                  const processedShifts = processLanes(dayShifts);
                  const maxLanes = processedShifts.length > 0 ? Math.max(...processedShifts.map(s => s._lane)) + 1 : 1;
                  const rowHeight = Math.max(80, maxLanes * 70 + 20);

                  return (
                    <div key={idx} className="flex relative border-b border-gray-200 group" style={{ height: \`\${rowHeight}px\` }}>
                      
                      {/* Fixed Day Label */}
                      <div className="w-[120px] flex-shrink-0 border-r border-gray-200 bg-gray-50 sticky left-0 z-20 flex flex-col justify-center items-center text-center p-2 border-b-white">
                        <div className="font-semibold text-gray-900">
                          {day.toLocaleDateString('en-GB', { weekday: 'short' })}
                        </div>
                        <div className="text-sm text-gray-600">
                          {day.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>

                      {/* Hour slots background */}
                      <div className="flex flex-1 relative">
                        {hours.map(hour => (
                          <div key={hour} className="flex-1 border-r border-gray-100 bg-white group-hover:bg-gray-50/50 transition-colors"></div>
                        ))}

                        {/* Absolute positioned shifts */}
                        {processedShifts.map((shift, shiftIdx) => {
                          const totalMins = 24 * 60;
                          const startPerc = (shift._start / totalMins) * 100;
                          const durationMins = Math.min(totalMins, shift._end - shift._start);
                          const widthPerc = (durationMins / totalMins) * 100;
                          const topPos = shift._lane * 70 + 10;
                          const colorVariants = [
                            'from-blue-50 to-blue-100 border-blue-500',
                            'from-purple-50 to-purple-100 border-purple-500',
                            'from-green-50 to-green-100 border-green-500',
                            'from-yellow-50 to-yellow-100 border-yellow-500',
                            'from-pink-50 to-pink-100 border-pink-500',
                          ];
                          const colorClass = colorVariants[shiftIdx % colorVariants.length];

                          return (
                              <div
                                key={\`shift-\${shift.id}-\${shiftIdx}\`}
                                onClick={() => handleShiftClick && handleShiftClick(shift)}
                                className={\`absolute p-2 rounded-lg bg-gradient-to-r \${colorClass} border-l-4 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-sm overflow-hidden z-10 flex flex-col justify-center\`}
                                style={{
                                    left: \`\${startPerc}%\`,
                                    width: \`\${widthPerc}%\`,
                                    top: \`\${topPos}px\`,
                                    height: '60px',
                                }}
                                title={\`Shift: \${shift.serviceSeeker?.preferredName || shift.serviceSeeker?.firstName} \${shift.serviceSeeker?.lastName} - \${shift.startTime} to \${shift.endTime}\`}
                              >
                                  <div className="font-semibold text-sm text-gray-900 truncate flex items-center gap-1">
                                      {shift.serviceSeeker?.firstName} {shift.serviceSeeker?.lastName}
                                      {shift.timeCritical && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse ml-1"></span>}
                                  </div>
                                  <div className="text-xs text-gray-700 truncate">
                                      {shift.startTime} - {shift.endTime} | {shift.shiftType?.name}
                                  </div>
                              </div>
                          );
                        })}
                      </div>

                    </div>
                );
              })}
              </div>
            </div>
          </div>
        </main>
      </div>
`;
content = content.replace(calendarRegex, newCalendarLogic);
fs.writeFileSync(manageRotaFile, content);

const myRotaFile = 'e:\\project_1\\new-beeru\\src\\app\\admin\\my-rota\\page.js';
let contentMy = fs.readFileSync(myRotaFile, 'utf8');

contentMy = contentMy.replace(
  '<div className="flex-1 flex flex-col lg:ml-64">',
  '<div className="flex-1 min-w-0 flex flex-col lg:ml-64">'
);

const timeSlotMyRegex = /const getShiftsForTimeSlot[\s\S]*?const isInTimeRange = hour >= shiftStartHour && hour < shiftEndHour;\s*if \(!isInTimeRange\) return false;/;
contentMy = contentMy.replace(timeSlotMyRegex, newFunctionLogic);

const calendarMyRegex = /\{\/\* Calendar Grid \*\/\}[\s\S]*?(?=\{\/\* Notification \*\/\})/;
const newCalendarMyLogic = `{/* Calendar Grid */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 mb-8 mx-auto w-full">
            <div className="overflow-x-auto pb-4">
              <div style={{ width: '3800px' }} className="relative bg-white">
                {/* Header */}
                <div className="flex border-b border-gray-200 bg-gray-100 sticky top-0 z-30">
                  <div className="w-[120px] flex-shrink-0 border-r border-gray-200 p-3 font-semibold text-gray-700 sticky left-0 bg-gray-100 z-40">
                    Day / Time
                  </div>
                  {hours.map(hour => (
                    <div key={hour} className="flex-1 border-r border-gray-200 p-3 text-center">
                      <div className="font-semibold text-gray-900">
                        {hour.toString().padStart(2, '0')}:00
                      </div>
                    </div>
                  ))}
                </div>

                {/* Day Rows */}
                {weekDays.map((day, idx) => {
                  const dayShifts = getShiftsForDate(day);
                  const processedShifts = processLanes(dayShifts);
                  const maxLanes = processedShifts.length > 0 ? Math.max(...processedShifts.map(s => s._lane)) + 1 : 1;
                  const rowHeight = Math.max(80, maxLanes * 70 + 20);

                  return (
                    <div key={idx} className="flex relative border-b border-gray-200 group" style={{ height: \`\${rowHeight}px\` }}>
                      
                      {/* Fixed Day Label */}
                      <div className="w-[120px] flex-shrink-0 border-r border-gray-200 bg-gray-50 sticky left-0 z-20 flex flex-col justify-center items-center text-center p-2 border-b-white">
                        <div className="font-semibold text-gray-900">
                          {day.toLocaleDateString('en-GB', { weekday: 'short' })}
                        </div>
                        <div className="text-sm text-gray-600">
                          {day.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>

                      {/* Hour slots background */}
                      <div className="flex flex-1 relative">
                        {hours.map(hour => (
                          <div key={hour} className="flex-1 border-r border-gray-100 bg-white group-hover:bg-gray-50/50 transition-colors"></div>
                        ))}

                        {/* Absolute positioned shifts */}
                        {processedShifts.map((shift, shiftIdx) => {
                          const totalMins = 24 * 60;
                          const startPerc = (shift._start / totalMins) * 100;
                          const durationMins = Math.min(totalMins, shift._end - shift._start);
                          const widthPerc = (durationMins / totalMins) * 100;
                          const topPos = shift._lane * 70 + 10;
                          
                          return (
                              <div
                                key={\`shift-\${shift.id}-\${shiftIdx}\`}
                                className={\`absolute p-2 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500 hover:shadow-lg transition-all shadow-sm overflow-hidden z-10 flex flex-col justify-center\`}
                                style={{
                                    left: \`\${startPerc}%\`,
                                    width: \`\${widthPerc}%\`,
                                    top: \`\${topPos}px\`,
                                    height: '60px',
                                }}
                                title={\`\${shift.notesForCarers ? 'Notes: ' + shift.notesForCarers : ''}\`}
                              >
                                  <div className="font-semibold text-sm text-gray-900 truncate flex items-center gap-1">
                                      {shift.serviceSeeker?.firstName} {shift.serviceSeeker?.lastName}
                                      {shift.timeCritical && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse ml-1"></span>}
                                  </div>
                                  <div className="text-xs text-gray-700 truncate">
                                      {shift.startTime} - {shift.endTime} | {shift.shiftType?.name}
                                  </div>
                              </div>
                          );
                        })}
                      </div>

                    </div>
                );
              })}
              </div>
            </div>
          </div>
        </main>
      </div>
`;
contentMy = contentMy.replace(calendarMyRegex, newCalendarMyLogic);
fs.writeFileSync(myRotaFile, contentMy);
