/* ================================================================
   17. DRAG & DROP
   ================================================================ */
let dragEventId    = null;
let dragTargetDate = null;
let dragTargetHour = null;
let dragTargetMin  = 0;    // minute offset within hour (for time-grid week view)
let pendingDrop    = null;

const initDragDrop = () => {
  // Use event delegation on the whole document
  document.addEventListener('dragstart', (e) => {
    const evEl = e.target.closest('[data-evid]');
    if (!evEl) return;
    
    dragEventId = evEl.dataset.evid;
    const ev = AppState.events.find(x => x.id === dragEventId);
    if (!ev) return;
    
    // Prevent dragging if admin doesn't own it
    if (AppState.loggedInAs === 'admin' && ev.scheduledBy !== AppState.currentAdminId) {
      e.preventDefault();
      window.showToast("You can only move lessons you scheduled.", 'warning');
      return;
    }
    
    evEl.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dragEventId);
  });

  document.addEventListener('dragend', (e) => {
    document.querySelectorAll('[data-evid].dragging').forEach(el => el.classList.remove('dragging'));
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    dragTargetMin = 0;
  });

  document.addEventListener('dragover', (e) => {
    // Month calendar day cells
    const cell = e.target.closest('.cal-day');
    if (cell && dragEventId) {
      e.preventDefault();
      document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
      cell.classList.add('drag-over');
      dragTargetDate = cell.dataset.date;
      dragTargetHour = null;
      dragTargetMin  = 0;
    }

    // Time-grid week view day columns (new)
    const wkCol = e.target.closest('.wk-day-col');
    if (wkCol && dragEventId) {
      e.preventDefault();
      document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
      wkCol.classList.add('drag-over');
      dragTargetDate = wkCol.dataset.date;
      const HOUR_H   = 64; const START_H = 7;
      const wkBodyEl = document.getElementById('wkBody');
      const rect     = wkCol.getBoundingClientRect();
      const relY     = e.clientY - rect.top + (wkBodyEl ? wkBodyEl.scrollTop : 0);
      const totalMin = Math.round(relY / HOUR_H * 60 / 30) * 30 + START_H * 60;
      dragTargetHour = Math.floor(totalMin / 60);
      dragTargetMin  = totalMin % 60;
    }
  });

  document.addEventListener('dragleave', (e) => {
    const cell = e.target.closest('.cal-day, .week-cell');
    if (cell) cell.classList.remove('drag-over');
  });

  document.addEventListener('drop', (e) => {
    e.preventDefault();
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));

    if (!dragEventId || !dragTargetDate) return;

    const ev = AppState.events.find(x => x.id === dragEventId);
    if (!ev) return;

    // If dropped on same date, do nothing
    if (ev.date === dragTargetDate && !dragTargetHour) { dragEventId = null; return; }

    // Calculate new times
    let newStartTime = ev.startTime;
    let newEndTime   = ev.endTime;

    if (dragTargetHour !== null) {
      const dur      = timeToMin(ev.endTime) - timeToMin(ev.startTime);
      const newStart = dragTargetHour * 60 + dragTargetMin; // 30-min snap precision
      newStartTime = `${String(Math.floor(newStart/60)).padStart(2,'0')}:${String(newStart%60).padStart(2,'0')}`;
      const newEnd = newStart + dur;
      newEndTime   = `${String(Math.floor(newEnd/60)).padStart(2,'0')}:${String(newEnd%60).padStart(2,'0')}`;
    }

    // Conflict check
    const { classroomConflicts, trainerConflicts } = detectConflicts(
      dragTargetDate, newStartTime, newEndTime, ev.classroomIds, ev.trainerIds, ev.id
    );

    pendingDrop = { id: dragEventId, date: dragTargetDate, startTime: newStartTime, endTime: newEndTime };

    const lesson    = getLesson(ev.lessonId);
    const crNames   = (ev.classroomIds || []).map(id => getClassroom(id).name).join(', ');

    let bodyHtml = `
      <p style="margin-bottom:12px;font-size:13.5px">
        Move <strong>${escapeHTML(lesson.name)}</strong> to
        <strong>${fmtDate(dragTargetDate)}</strong>,
        ${fmtTime(newStartTime)} – ${fmtTime(newEndTime)}?
      </p>`;

    if (classroomConflicts.length > 0 || trainerConflicts.length > 0) {
      bodyHtml += '<div style="margin-bottom:12px">';
      classroomConflicts.forEach(cev => {
        bodyHtml += `<div class="conflict-alert warning">⚠ ${crNames} is already booked at this time.</div>`;
      });
      trainerConflicts.forEach(({ trainerId }) => {
        bodyHtml += `<div class="conflict-alert warning">⚠ ${getTrainer(trainerId).name} is unavailable at this time.</div>`;
      });
      bodyHtml += `<p style="font-size:12.5px;color:var(--gray-500);margin-top:8px">Moving anyway will create conflicts.</p></div>`;
      document.getElementById('confirmDragBtn').style.display = 'none'; // Block if conflicts
    } else {
      document.getElementById('confirmDragBtn').style.display = '';
    }

    document.getElementById('dragConfirmBody').innerHTML = bodyHtml;
    window.openModal('dragConfirmModal');

    dragEventId    = null;
    dragTargetDate = null;
    dragTargetHour = null;
  });
};

const confirmDrop = () => {
  if (!pendingDrop) return;
  const ev = AppState.events.find(x => x.id === pendingDrop.id);
  if (ev) {
    ev.date      = pendingDrop.date;
    ev.startTime = pendingDrop.startTime;
    ev.endTime   = pendingDrop.endTime;
  }
  pendingDrop = null;
  window.closeModal('dragConfirmModal');
  window.showToast('Lesson rescheduled!', 'success');
  window.renderCalendar();
};



// --- Auto-generated globals for Vite migration ---
window.pendingDrop = pendingDrop;
window.dragTargetMin = dragTargetMin;
window.dragTargetDate = dragTargetDate;
window.confirmDrop = confirmDrop;
window.dragTargetHour = dragTargetHour;
window.dragEventId = dragEventId;
window.initDragDrop = initDragDrop;
