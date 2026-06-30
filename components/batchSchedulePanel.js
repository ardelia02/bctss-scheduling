/* ================================================================
   BATCH SCHEDULE PANEL RENDER
   ================================================================ */
const renderBatchSchedulePanel = () => {
  const panel = document.getElementById('batchSchedulePanel');
  if (!panel) return;

  const bid = AppState.selectedBatch;
  if (bid === 'all') {
    panel.classList.add('hidden');
    return;
  }

  const batch       = getBatch(bid);
  const batchEvents = AppState.events
    .filter(e => (e.batchIds || []).includes(bid))
    .sort((a, b) => (a.date || '').localeCompare(b.date || '') || a.startTime.localeCompare(b.startTime));

  panel.classList.remove('hidden');

  const rows = batchEvents.map((ev, i) => {
    const lesson    = getLesson(ev.lessonId);
    const crNames   = (ev.classroomIds || []).map(id => getClassroom(id).name).join(', ');
    const trainers  = getEventTrainersText(ev);
    const color     = batch.colorHex || (EVENT_COLORS[batch.colorIndex % EVENT_COLORS.length] || EVENT_COLORS[0] || "#cccccc");
    return `
      <tr class="${ev.status === 'cancelled' ? 'cancelled' : ''}">
        <td class="seq-num">${i + 1}</td>
        <td style="font-weight:600">${fmtDate(ev.date)}</td>
        <td style="white-space:nowrap;color:var(--gray-600)">${fmtTime(ev.startTime)} – ${fmtTime(ev.endTime)}</td>
        <td>
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;
            background:${color};margin-right:7px;vertical-align:middle;flex-shrink:0"></span>
          <strong>${escapeHTML(getEventDisplayName(ev, lesson))}</strong>
        </td>
        <td>${crNames || '—'}</td>
        <td>${trainers || '—'}</td>
        <td>
          <button class="btn btn-ghost btn-sm view-ev-btn" data-evid="${ev.id}"
            style="padding:3px 10px;font-size:11.5px">View</button>
        </td>
      </tr>`;
  }).join('');

  panel.innerHTML = `
    <div class="batch-panel-header">
      <div>
        <div class="batch-panel-title">
          📋 ${batch.name || 'Batch'} — Lesson Schedule
        </div>
        <div class="batch-panel-sub">
          ${batchEvents.length} lesson${batchEvents.length !== 1 ? 's' : ''} scheduled ·
          ${batch.students || 0} trainees ·
          ${fmtDate(batch.startDate)} – ${fmtDate(batch.endDate)}
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:16px;">
        <button class="btn btn-secondary btn-sm" onclick="exportBatchScheduleCSV('${bid}')">Export CSV</button>
        <input type="text" id="batchLessonSearch" placeholder="Search course title..." 
          style="padding:6px 12px; border:1px solid var(--border); border-radius:6px; font-size:13px; width:200px;"
          onkeyup="
            const q = this.value.toLowerCase();
            document.querySelectorAll('.batch-lesson-table tbody tr').forEach(tr => {
              const name = tr.querySelector('td:nth-child(4) strong')?.textContent.toLowerCase() || '';
              tr.style.display = name.includes(q) ? '' : 'none';
            });
          ">
        <span class="card-badge">${batchEvents.length} lessons</span>
      </div>
    </div>
    ${
      batchEvents.length === 0
      ? `<div class="empty-state" style="padding:32px">
           <p>No lessons scheduled for this batch yet. Use the Schedule Lesson form to add some.</p>
         </div>`
      : `<div style="overflow-x:auto">
           <table class="batch-lesson-table">
             <thead>
               <tr>
                 <th>#</th><th>Date</th><th>Time</th>
                 <th>Lesson</th><th>Classroom</th><th>Trainer(s)</th><th></th>
               </tr>
             </thead>
             <tbody>${rows}</tbody>
           </table>
         </div>`
    }`;
};

window.exportBatchScheduleCSV = (batchId) => {
  const batch = getBatch(batchId);
  const events = AppState.events
    .filter(e => (e.batchIds || []).includes(batchId) && e.status !== 'cancelled')
    .sort((a, b) => (a.date || '').localeCompare(b.date || '') || a.startTime.localeCompare(b.startTime));

  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "No,Date,Time,Lesson,Classroom,Trainer(s)\n";

  events.forEach((ev, i) => {
    const date = fmtDate(ev.date);
    const time = `${fmtTime(ev.startTime)} - ${fmtTime(ev.endTime)}`;
    const lesson = getEventDisplayName(ev, getLesson(ev.lessonId)).replace(/"/g, '""');
    const classrooms = ((ev.classroomIds || []).map(id => getClassroom(id).name).join(', ')).replace(/"/g, '""');
    const trainers = (getEventTrainersText(ev)).replace(/"/g, '""');

    csvContent += `"${i+1}","${date}","${time}","${lesson}","${classrooms}","${trainers}"\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Schedule_${batch.name || 'Batch'}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};



// --- Auto-generated globals for Vite migration ---
window.buildTimeGridAndEvents = buildTimeGridAndEvents;
window.renderBatchSchedulePanel = renderBatchSchedulePanel;
window.createDayCell = createDayCell;
window.isUpdatingFilter = isUpdatingFilter;
window.renderDayCalendar = renderDayCalendar;
