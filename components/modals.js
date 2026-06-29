/* ================================================================
   16. EVENT DETAIL MODAL
   ================================================================ */
let currentDetailEventId = null;

const showEventDetail = (eventId) => {
  let ev = AppState.events.find(e => e.id === eventId);
  if (!ev) {
    const unavail = (AppState.unavailabilities || []).find(u => u.id === eventId);
    if (unavail) {
      if (AppState.currentRole === 'trainer' && unavail.trainerId === AppState.currentTrainerId) {
        document.getElementById('unavailabilityForm').reset();
        document.getElementById('unavailabilityId').value = unavail.id;
        document.getElementById('unavailType').value = unavail.type || 'busy';
        document.getElementById('unavailDate').value = unavail.date;
        document.getElementById('unavailEndDate').value = '';
        document.getElementById('unavailStartTime').value = unavail.startTime;
        document.getElementById('unavailEndTime').value = unavail.endTime;
        document.getElementById('unavailReason').value = unavail.reason;
        document.getElementById('unavailabilityModalTitle').textContent = 'Edit Leave/Busy Entry';
        
        const delBtn = document.getElementById('deleteUnavailabilityBtn');
        if (delBtn) {
          delBtn.style.display = 'inline-flex';
          delBtn.onclick = () => { deleteUnavailability(unavail.id); closeModal('unavailabilityModal'); };
        }
        
        openModal('unavailabilityModal');
      }
      return;
    }
    return;
  }

  currentDetailEventId = eventId;
  const lesson    = getLesson(ev.lessonId);
  const crNames   = (ev.classroomIds || []).map(id => (getClassroom(id) || {}).name).filter(Boolean).join(', ');
  const batchNames = (ev.batchIds || []).map(id => (getBatch(id) || {}).name).filter(Boolean).join(', ');
  const trainers  = getEventTrainersText(ev);
  const color     = '#3b82f6'; // Generic color for event details

  document.getElementById('eventDetailTitle').textContent = (lesson && lesson.name) ? lesson.name : 'Lesson Details';

  const adminName = ev.scheduledBy ? ((AppState.admins.find(a => a.id === ev.scheduledBy) || {}).name || ev.scheduledBy) : '—';

  document.getElementById('eventDetailBody').innerHTML = `
    <div style="height:5px;background:${color};border-radius:4px;margin-bottom:20px"></div>
    ${ev.unallocated ? `<div style="background:rgba(239,68,68,0.1); border:1px solid var(--danger); border-radius:8px; padding:10px 14px; margin-bottom:16px; font-size:13px; color:var(--danger); font-weight:600;">⚠️ Unallocated — No trainer assigned. Please reallocate.</div>` : ''}
    ${ev.coverRequested ? `<div style="background:rgba(234,179,8,0.1); border:1px solid var(--warning); border-radius:8px; padding:10px 14px; margin-bottom:16px; font-size:13px; color:#92400e; font-weight:600;">🔄 Cover Requested</div>` : ''}
    <div class="event-detail-grid">
      <div class="event-detail-item">
        <div class="event-detail-label">Batches</div>
        <div class="event-detail-value">${batchNames || '—'}</div>
      </div>
      <div class="event-detail-item">
        <div class="event-detail-label">Module</div>
        <div class="event-detail-value">${lesson ? lesson.name : '—'}</div>
      </div>
      <div class="event-detail-item">
        <div class="event-detail-label">Date</div>
        <div class="event-detail-value">${fmtDate(ev.date)}</div>
      </div>
      <div class="event-detail-item">
        <div class="event-detail-label">Time</div>
        <div class="event-detail-value">${fmtTime(ev.startTime)} – ${fmtTime(ev.endTime)}</div>
      </div>
      <div class="event-detail-item">
        <div class="event-detail-label">Classroom(s)</div>
        <div class="event-detail-value">${crNames || '—'}</div>
      </div>
      <div class="event-detail-item">
        <div class="event-detail-label">Trainer(s)</div>
        <div class="event-detail-value">${trainers || '—'}</div>
      </div>
      <div class="event-detail-item">
        <div class="event-detail-label">Scheduled By</div>
        <div class="event-detail-value">${adminName}</div>
      </div>
    </div>`;

  const cancelBtn     = document.getElementById('cancelEventBtn');
  const deleteBtn     = document.getElementById('deleteEventBtn');
  const requestCoverBtn = document.getElementById('requestCoverBtn');
  const declineBtn    = document.getElementById('declineClassBtn');
  const editBtn       = document.getElementById('editEventBtn');
  
  const isOwner = AppState.currentRole === 'admin' && ev.scheduledBy === AppState.currentAdminId;
  const isAdmin = AppState.currentRole === 'admin';
  const isTrainerOnEvent = AppState.currentRole === 'trainer' && (ev.trainerIds || []).includes(AppState.currentTrainerId);

  if (ev.status === 'cancelled') {
    cancelBtn.style.display = 'none';
    requestCoverBtn.style.display = 'none';
    if (declineBtn) declineBtn.style.display = 'none';
    if (deleteBtn) deleteBtn.style.display = isOwner ? 'inline-flex' : 'none';
    if (editBtn) editBtn.style.display = 'none';
  } else {
    cancelBtn.style.display = isOwner ? 'inline-flex' : 'none';
    if (deleteBtn) deleteBtn.style.display = isOwner ? 'inline-flex' : 'none';
    if (editBtn) editBtn.style.display = isAdmin ? 'inline-flex' : 'none';
    
    // Decline Class button — trainers only, for their own future lessons
    if (declineBtn) {
      const isFuture = safeDate(ev.date) >= new Date(todayStr());
      declineBtn.style.display = (isTrainerOnEvent && isFuture) ? 'inline-flex' : 'none';
    }
    
    // Show Request Cover button if admin or trainer teaching this lesson
    if (AppState.currentRole === 'admin' || isTrainerOnEvent) {
      requestCoverBtn.style.display = 'inline-flex';
      if (ev.coverRequested) {
        requestCoverBtn.innerHTML = 'Cover Requested';
        requestCoverBtn.disabled = true;
        requestCoverBtn.style.opacity = '0.5';
      } else {
        requestCoverBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px"><path d="M17 2.1l4 4-4 4"/><path d="M3 12.2v-2a4 4 0 0 1 4-4h12.8M7 21.9l-4-4 4-4"/><path d="M21 11.8v2a4 4 0 0 1-4 4H4.2"/></svg>Request Cover';
        requestCoverBtn.disabled = false;
        requestCoverBtn.style.opacity = '1';
      }
    } else {
      requestCoverBtn.style.display = 'none';
    }
  }
  
  openModal('eventDetailModal');
};

const cancelEvent = () => {
  if (!currentDetailEventId) return;
  const ev = AppState.events.find(e => e.id === currentDetailEventId);
  if (ev) {
    ev.status = 'cancelled';
  }
  closeModal('eventDetailModal');
  showToast('Lesson cancelled.', 'warning');

  // Re-render current view
  const renderers = {
    dashboard: renderDashboard, calendar: renderCalendar,
    batches: renderBatches, trainers: renderTrainers, trainerPortal: renderTrainerPortal
  };
  if (renderers[AppState.activeView]) renderers[AppState.activeView]();
};

const editEvent = (eventId) => {
  const ev = AppState.events.find(e => e.id === eventId);
  if (!ev) return;
  
  closeModal('eventDetailModal');
  
  AppState.editingEventId = ev.id;
  switchView('schedule');
  
  document.querySelectorAll('#batchSelectDropdown input[type="checkbox"]').forEach(cb => {
    cb.checked = (ev.batchIds || []).includes(cb.value);
  });
  const checkedBatches = Array.from(document.querySelectorAll('#batchSelectDropdown input:checked')).map(el => el.parentNode.textContent.trim());
  document.getElementById('batchSelectLabel').textContent = checkedBatches.length > 0 ? checkedBatches.join(', ') : 'Select Batches...';

  const lesson = getLesson(ev.lessonId);
  if (lesson) {
    document.getElementById('formTopic').value = lesson.topicId;
    document.getElementById('formTopic').dispatchEvent(new Event('change'));
    setTimeout(() => {
      const formLesson = document.getElementById('formLesson');
      if (formLesson) {
        formLesson.value = ev.lessonId;
        formLesson.dispatchEvent(new Event('change'));
      }
    }, 10);
  }
  
  document.getElementById('formDate').value = ev.date;
  document.getElementById('formStartTime').value = ev.startTime;
  document.getElementById('formEndTime').value = ev.endTime;
  document.getElementById('formIsCovering').checked = ev.isCovering || false;

  setTimeout(() => {
    const formDate = document.getElementById('formDate');
    if (!formDate) return;
    formDate.dispatchEvent(new Event('change'));
    
    // Check classrooms
    document.querySelectorAll('#classroomSelectDropdown input[type="checkbox"]').forEach(cb => {
      cb.checked = (ev.classroomIds || []).includes(cb.value);
    });
    const checkedCr = Array.from(document.querySelectorAll('#classroomSelectDropdown input:checked')).map(el => el.parentNode.textContent.trim().split(' (')[0]);
    document.getElementById('classroomSelectLabel').textContent = checkedCr.length > 0 ? checkedCr.join(', ') : 'Select Classrooms...';
    
    // Check trainers
    buildTrainerDropdown(ev.lessonId, ev.trainerIds || []);
    
  }, 50);
};

const deleteEvent = () => {
  if (!currentDetailEventId) return;
  AppState.events = AppState.events.filter(e => e.id !== currentDetailEventId);
  closeModal('eventDetailModal');
  showToast('Lesson deleted.', 'success');

  // Re-render current view
  const renderers = {
    dashboard: renderDashboard, calendar: renderCalendar,
    batches: renderBatches, trainers: renderTrainers, trainerPortal: renderTrainerPortal
  };
  if (renderers[AppState.activeView]) renderers[AppState.activeView]();
};



// --- Auto-generated globals for Vite migration ---
window.currentDetailEventId = currentDetailEventId;
window.showEventDetail = showEventDetail;
window.cancelEvent = cancelEvent;
window.deleteEvent = deleteEvent;
window.editEvent = editEvent;
