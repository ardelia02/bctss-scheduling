/* ================================================================
   9. SCHEDULE FORM RENDER & LOGIC
   ================================================================ */
const FormDOM = {
  _cache: {},
  get: function(id) {
    if (!this._cache[id]) this._cache[id] = document.getElementById(id);
    return this._cache[id];
  }
};
const fillScheduleForm = (date, start, end) => {
  window.switchView('schedule');
  setTimeout(() => {
    const d = FormDOM.get('formDate');
    const s = FormDOM.get('formStartTime');
    const e = FormDOM.get('formEndTime');
    if (d) d.value = date;
    if (s) s.value = start;
    if (e) e.value = end;
    
    if (d) d.dispatchEvent(new Event('change'));
    if (s) s.dispatchEvent(new Event('change'));
    if (e) e.dispatchEvent(new Event('change'));
    
    updateFormAssistant();
  }, 10);
};

const renderScheduleForm = () => {
  populateFormDropdowns();
  FormDOM.get('scheduleForm').reset();
  FormDOM.get('availabilityPanel').style.display = 'none';
  FormDOM.get('conflictAlerts').innerHTML = '';
  FormDOM.get('trainerSelectDropdown').innerHTML =
    '<div style="padding:12px; color:var(--gray-400); font-size:13px;">Select a lesson first</div>';
  FormDOM.get('trainerSelectLabel').textContent = 'Select Trainers...';
  FormDOM.get('formAssistantBody').innerHTML =
    '<p class="assistant-hint">Select a lesson to get smart suggestions.</p>';
  AppState.editingEventId = null;
};

const populateFormDropdowns = () => {
  // Batch multi-select
  const batchContainer = FormDOM.get('batchSelectDropdown');
  if (batchContainer) {
    batchContainer.innerHTML = AppState.batches
      .filter(b => b.status === 'active' || b.status === 'upcoming')
      .map(b => `
        <label class="trainer-check-item">
          <input type="checkbox" name="batchIds" value="${b.id}">
          ${escapeHTML(b.name)}
        </label>
      `).join('');
    
    // Add change listeners to update the label and assistant
    batchContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        const checked = Array.from(batchContainer.querySelectorAll('input:checked')).map(el => el.parentNode.textContent.trim());
        FormDOM.get('batchSelectLabel').textContent = checked.length > 0 ? checked.join(', ') : 'Select Batches...';
        updateFormAssistant();
      });
    });
  }

  // Topic dropdown
  const topicSel = FormDOM.get('formTopic');
  if (topicSel) {
    topicSel.innerHTML = '<option value="">— Select Topic —</option>' +
      (AppState.topics || []).map(t =>
        `<option value="${t.id}">${escapeHTML(t.name)}</option>`
      ).join('');
  }

  // Module dropdown (empty initially until topic is selected)
  const lessonSel = FormDOM.get('formLesson');
  if (lessonSel) {
    lessonSel.innerHTML = '<option value="">— Select Module —</option>';
  }

  // Classroom multi-select
  const classroomContainer = FormDOM.get('classroomSelectDropdown');
  if (classroomContainer) {
    classroomContainer.innerHTML = AppState.classrooms.map(c => `
      <label class="trainer-check-item" data-crid="${c.id}">
        <input type="checkbox" name="classroomIds" value="${c.id}">
        ${escapeHTML(c.name)} (${c.capacity} pax)
      </label>
    `).join('');

    classroomContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        const checked = Array.from(classroomContainer.querySelectorAll('input:checked')).map(el => el.parentNode.textContent.trim().split(' (')[0]);
        FormDOM.get('classroomSelectLabel').textContent = checked.length > 0 ? checked.join(', ') : 'Select Classrooms...';
      });
    });
  }
};

/** Build trainer custom dropdown list based on selected lesson */
const buildTrainerDropdown = (lessonId, preSelected = []) => {
  const container = FormDOM.get('trainerSelectDropdown');
  const label = FormDOM.get('trainerSelectLabel');
  
  if (!lessonId) {
    container.innerHTML = '<div style="padding:12px; color:var(--gray-400); font-size:13px;">Select a lesson first</div>';
    label.textContent = 'Select Trainers...';
    return;
  }

  const date      = FormDOM.get('formDate').value;
  const startTime = FormDOM.get('formStartTime').value;
  const endTime   = FormDOM.get('formEndTime').value;

  const authorised = (AppState.authMatrix[lessonId] || []);
  
  // Create checkboxes for authorised trainers
  const optionsHtml = AppState.trainers
    .filter(t => !t.hidden && authorised.includes(t.id)) // Only show authorised and non-hidden trainers
    .map(t => {
      let isOccupied = false;
      let badgeHtml = '';
      if (date && startTime && endTime) {
        const avail = getAvailability(date, startTime, endTime, AppState.editingEventId);
        const tAvail = avail.trainers.find(x => x.id === t.id);
        if (!tAvail.available) {
          isOccupied = true;
          badgeHtml = '<span class="custom-option-badge occupied">Occupied</span>';
        } else if (tAvail.warning) {
          badgeHtml = `<span class="custom-option-badge" style="background:#fef3c7;color:#b45309;border:1px solid #fde68a;">⚠️ ${tAvail.warning.type.toUpperCase()}</span>`;
        }
      }
      
      const isChecked = preSelected.includes(t.id) && !isOccupied; // don't pre-select if occupied
      
      return `
        <label class="custom-option ${isOccupied ? 'disabled' : ''}">
          <input type="checkbox" name="trainerIds" value="${t.id}" ${isChecked ? 'checked' : ''} ${isOccupied ? 'disabled' : ''} onchange="updateTrainerSelectLabel()">
          <span class="custom-option-name">${escapeHTML(t.name)}</span>
          ${badgeHtml}
        </label>
      `;
    }).join('');

  container.innerHTML = optionsHtml || '<div style="padding:12px; color:var(--gray-400); font-size:13px;">No trainers authorised</div>';
  updateTrainerSelectLabel();
};

const updateTrainerSelectLabel = () => {
  const checked = [...document.querySelectorAll('input[name="trainerIds"]:checked')];
  const label = FormDOM.get('trainerSelectLabel');
  if (checked.length === 0) {
    label.textContent = 'Select Trainers...';
  } else if (checked.length === 1) {
    label.textContent = checked[0].nextElementSibling.textContent;
  } else {
    label.textContent = `${checked.length} Trainers Selected`;
  }
};

/** Collect selected trainer IDs from dropdown */
const getSelectedTrainerIds = () =>
  [...document.querySelectorAll('input[name="trainerIds"]:checked')].map(el => el.value);

/** Collect selected classroom IDs from checkboxes */
const getSelectedClassroomIds = () =>
  [...document.querySelectorAll('input[name="classroomIds"]:checked')].map(el => el.value);

/** Run availability check and show panel */
const checkAvailability = () => {
  const date      = FormDOM.get('formDate').value;
  const startTime = FormDOM.get('formStartTime').value;
  const endTime   = FormDOM.get('formEndTime').value;

  if (!date || !startTime || !endTime) {
    window.showToast('Please fill in date and time fields first.', 'warning');
    return;
  }
  if (timeToMin(startTime) >= timeToMin(endTime)) {
    window.showToast('End time must be after start time.', 'warning');
    return;
  }

  const panel = FormDOM.get('availabilityPanel');
  panel.style.display = 'block';

  const avail = getAvailability(date, startTime, endTime, AppState.editingEventId);

  // Classroom list
  const crList = FormDOM.get('classroomAvailList');
  crList.innerHTML = avail.classrooms.map(c => `
    <div class="avail-item ${c.available ? 'ok' : 'bad'}">
      <span class="avail-icon">${c.available ? '✓' : '✗'}</span>
      <span>${escapeHTML(c.name)} (${c.capacity} pax)</span>
      ${!c.available ? '<span class="avail-note">(Occupied)</span>' : ''}
    </div>`).join('');

  // Precompute trainer hours for sorting
  const trainerHours = {};
  AppState.events.forEach(e => {
    if (e.status !== 'cancelled' && e.date) {
      const mins = timeToMin(e.endTime) - timeToMin(e.startTime);
      (e.trainerIds || []).forEach(tid => {
        trainerHours[tid] = (trainerHours[tid] || 0) + mins;
      });
      (e.understudyIds || []).forEach(tid => {
        trainerHours[tid] = (trainerHours[tid] || 0) + mins;
      });
    }
  });
  
  const getHrs = (tId) => Number(((trainerHours[tId] || 0) / 60).toFixed(1));

  // Trainer list
  const lessonId     = FormDOM.get('formLesson').value;
  const authTrainerIds = AppState.authMatrix[lessonId] || [];
  const trList       = FormDOM.get('trainerAvailList');
  
  const filteredTrainers = avail.trainers.filter(t => !lessonId || authTrainerIds.includes(t.id));
  
  // Sort: Available first, then by lowest scheduled hours
  filteredTrainers.sort((a, b) => {
    if (a.available === b.available) {
      return getHrs(a.id) - getHrs(b.id);
    }
    return a.available ? -1 : 1;
  });

  trList.innerHTML   = filteredTrainers.map(t => `
      <div class="avail-item ${t.available ? 'ok' : 'bad'}">
        <span class="avail-icon">${t.available ? '✓' : '✗'}</span>
        <span>${escapeHTML(t.name)} <span style="font-size:11px; color:var(--gray-500)">(${getHrs(t.id)} hrs scheduled)</span></span>
        ${!t.available ? '<span class="avail-note">(Teaching another class)</span>' : ''}
      </div>`).join('') || '<p class="hint-text">Select a lesson to see authorised trainers.</p>';
};

/** Validate and save a scheduled lesson */
const saveSchedule = (e) => {
  e.preventDefault();

  const batchIds = Array.from(document.querySelectorAll('#batchSelectDropdown input[type="checkbox"]:checked')).map(cb => cb.value);
  const lessonId    = FormDOM.get('formLesson').value;
  const date        = FormDOM.get('formDate').value;
  const startTime   = FormDOM.get('formStartTime').value;
  const endTime     = FormDOM.get('formEndTime').value;
  const classroomIds= getSelectedClassroomIds();
  const trainerIds  = getSelectedTrainerIds();
  const isCovering  = FormDOM.get('formIsCovering').checked;

  // Basic validation
  const errors = [];
  if (batchIds.length === 0) errors.push('Please select at least one batch.');
  if (!lessonId)       errors.push('Please select a lesson.');
  if (!date)           errors.push('Please enter a date.');
  if (!startTime)      errors.push('Please enter a start time.');
  if (!endTime)        errors.push('Please enter an end time.');
  if (classroomIds.length === 0) errors.push('Please select at least one classroom.');
  if (trainerIds.length === 0) errors.push('Please select at least one trainer.');

  if (startTime && endTime && timeToMin(startTime) >= timeToMin(endTime)) {
    errors.push('End time must be strictly after start time. (Events spanning midnight must be split into two days).');
  }

  const selectedBatches = batchIds.map(id => getBatch(id)).filter(Boolean);
  const totalStudents = selectedBatches.reduce((sum, b) => sum + (b.students || 0), 0);
  
  const selectedClassrooms = classroomIds.map(id => getClassroom(id)).filter(Boolean);
  const totalCapacity = selectedClassrooms.reduce((sum, c) => sum + (c.capacity || 0), 0);

  if (totalStudents > totalCapacity) {
    errors.push(`Total trainees (${totalStudents}) exceeds combined classroom capacity (${totalCapacity}).`);
  }

  const submitBtn = document.querySelector('#scheduleForm button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  const alertsEl = FormDOM.get('conflictAlerts');
  alertsEl.innerHTML = '';

  if (errors.length > 0) {
    if (submitBtn) submitBtn.disabled = false;
    alertsEl.innerHTML = errors.map(err =>
      `<div class="conflict-alert error">⚠ ${escapeHTML(err)}</div>`
    ).join('');
    return;
  }

  // Prerequisite validation
  const lessonObj = getLesson(lessonId);
  if (lessonObj.prerequisiteIds && lessonObj.prerequisiteIds.length > 0) {
    for (const prereqId of lessonObj.prerequisiteIds) {
      const prereqObj = getLesson(prereqId);
      const hasCompletedPrereq = AppState.events.some(e => {
        if (!batchIds.some(bid => (e.batchIds || []).includes(bid)) || e.lessonId !== prereqId || e.status === 'cancelled') return false;
        const evDate = e.date + 'T' + e.startTime;
        const newDate = date + 'T' + startTime;
        return evDate <= newDate;
      });
      if (!hasCompletedPrereq) {
        if (submitBtn) submitBtn.disabled = false;
        alertsEl.innerHTML = `<div class="conflict-alert error">⚠ Prerequisite Lesson "${escapeHTML(prereqObj.name)}" must be scheduled for this batch BEFORE this lesson.</div>`;
        return;
      }
    }
  }

  // Conflict detection
  const { classroomConflicts, trainerConflicts, batchConflicts } = detectConflicts(
    date, startTime, endTime, classroomIds, trainerIds, batchIds, AppState.editingEventId
  );

  if (classroomConflicts.length > 0 || trainerConflicts.length > 0 || batchConflicts.length > 0) {
    if (submitBtn) submitBtn.disabled = false;
    const conflictMsgs = [];

    classroomConflicts.forEach(ev => {
      const crNames = (ev.classroomIds || []).map(id => getClassroom(id).name).join(', ');
      conflictMsgs.push(`<div class="conflict-alert error">
        🏫 <strong>Classroom Conflict:</strong> ${crNames} is already booked on ${fmtDate(ev.date)},
        ${fmtTime(ev.startTime)} – ${fmtTime(ev.endTime)} 
        (${escapeHTML(getLesson(ev.lessonId).name)}).
      </div>`);
    });

    trainerConflicts.forEach(({ trainerId, event: ev, unavailability: u }) => {
      const tr = getTrainer(trainerId);
      if (ev) {
        conflictMsgs.push(`<div class="conflict-alert error">
          👤 <strong>Trainer Conflict:</strong> ${tr.name} is unavailable on ${fmtDate(ev.date)},
          ${fmtTime(ev.startTime)} – ${fmtTime(ev.endTime)} 
          (teaching ${escapeHTML(getLesson(ev.lessonId).name)}).
        </div>`);
      } else if (u) {
        conflictMsgs.push(`<div class="conflict-alert error">
          👤 <strong>Trainer Conflict:</strong> ${tr.name} is on leave/unavailable on ${fmtDate(u.date)},
          ${fmtTime(u.startTime)} – ${fmtTime(u.endTime)} 
          (${escapeHTML(u.reason)}).
        </div>`);
      }
    });

    batchConflicts.forEach(ev => {
      const bNames = (ev.batchIds || []).map(id => getBatch(id).name).join(', ');
      conflictMsgs.push(`<div class="conflict-alert error">
        🎓 <strong>Batch Conflict:</strong> Trainees in ${bNames} are already scheduled on ${fmtDate(ev.date)},
        ${fmtTime(ev.startTime)} – ${fmtTime(ev.endTime)} 
        (learning ${escapeHTML(getLesson(ev.lessonId).name)}).
      </div>`);
    });

    alertsEl.innerHTML = conflictMsgs.join('');
    return;
  }

  // All clear – save event
  const eventObj = {
    id:          AppState.editingEventId || `ev${uid()}`,
    batchIds, lessonId, date, startTime, endTime, classroomIds, trainerIds, status: 'scheduled', isCovering,
    scheduledBy: AppState.editingEventId 
      ? ((AppState.events.find(e => e.id === AppState.editingEventId) || {}).scheduledBy || AppState.currentAdminId)
      : AppState.currentAdminId
  };

  if (AppState.editingEventId) {
    const idx = AppState.events.findIndex(e => e.id === AppState.editingEventId);
    if (idx !== -1) AppState.events[idx] = eventObj;
    AppState.editingEventId = null;
  } else {
    AppState.events.push(eventObj);
  }

  if (submitBtn) submitBtn.disabled = false;

  window.saveState();
  if (PUBLIC_HOLIDAYS.includes(date)) {
    window.showToast(`Warning: ${escapeHTML(getLesson(lessonId).name)} scheduled on a Public Holiday!`, 'warning');
  } else {
    window.showToast(`Lesson scheduled: ${escapeHTML(getLesson(lessonId).name)}`, 'success');
  }
  
  // Clear time and trainer/classroom selections, but keep date, lesson, batch
  FormDOM.get('formStartTime').value = '';
  FormDOM.get('formEndTime').value = '';
  document.querySelectorAll('input[name="classroomIds"]').forEach(cb => cb.checked = false);
  document.querySelectorAll('input[name="trainerIds"]').forEach(cb => cb.checked = false);
  FormDOM.get('conflictAlerts').innerHTML = '';
  
  updateTrainerSelectLabel();
  updateFormAssistant();
};



// --- Auto-generated globals for Vite migration ---
window.getSelectedTrainerIds = getSelectedTrainerIds;
window.populateFormDropdowns = populateFormDropdowns;
window.buildTrainerDropdown = buildTrainerDropdown;
window.renderScheduleForm = renderScheduleForm;
window.saveSchedule = saveSchedule;
window.getSelectedClassroomIds = getSelectedClassroomIds;
window.checkAvailability = checkAvailability;
window.updateTrainerSelectLabel = updateTrainerSelectLabel;
window.fillScheduleForm = fillScheduleForm;
