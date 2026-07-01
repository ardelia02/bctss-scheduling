/* ================================================================
   14. SCHEDULING ASSISTANT
   ================================================================ */
const renderAssistant = () => {
  // Populate topic dropdown
  const topicSel = document.getElementById('assistTopic');
  if (topicSel) {
    topicSel.innerHTML = '<option value="">— All Topics —</option>' +
      (AppState.topics || []).map(t => `<option value="${t.id}">${escapeHTML(t.name)}</option>`).join('');
    topicSel.onchange = () => {
      const lessonSel = document.getElementById('assistLesson');
      const tid = topicSel.value;
      const filtered = tid ? AppState.lessons.filter(l => l.topicId === tid) : AppState.lessons;
      lessonSel.innerHTML = '<option value="">— Select Module —</option>' +
        filtered.map(l => `<option value="${l.id}">${l.name}</option>`).join('');
    };
  }

  // Populate lesson dropdown (all modules initially)
  const sel = document.getElementById('assistLesson');
  sel.innerHTML = '<option value="">— Select Module —</option>' +
    AppState.lessons.map(l => `<option value="${l.id}">${l.name}</option>`).join('');

  document.getElementById('assistantResults').innerHTML = `
    <div class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
      <h4>No Results Yet</h4>
      <p>Select a module and date, then click "Find Available Slots"</p>
    </div>`;
};

const runAssistant = () => {
  const lessonId = document.getElementById('assistLesson').value;
  const date     = document.getElementById('assistDate').value;
  const duration = parseFloat(document.getElementById('assistDuration').value) || 3;

  if (!lessonId || !date) {
    window.showToast('Please select a lesson and date first.', 'warning');
    return;
  }

  const lesson  = getLesson(lessonId);
  const authTrs = authorisedTrainers(lessonId);

  // Suggest time slots: 8am – 6pm at 30-min intervals
  const durationMin = duration * 60;
  const slots = [];
  for (let startMin = 8 * 60; startMin + durationMin <= 18 * 60; startMin += 30) {
    const endMin   = startMin + durationMin;
    const startStr = `${String(Math.floor(startMin/60)).padStart(2,'0')}:${String(startMin%60).padStart(2,'0')}`;
    const endStr   = `${String(Math.floor(endMin/60)).padStart(2,'0')}:${String(endMin%60).padStart(2,'0')}`;

    const avail = getAvailability(date, startStr, endStr);
    const freeClassrooms = avail.classrooms.filter(c => c.available);
    const freeAuthTrainers = avail.trainers.filter(t =>
      t.available && authTrs.some(at => at.id === t.id)
    );

    if (freeClassrooms.length > 0 && freeAuthTrainers.length > 0) {
      slots.push({ startStr, endStr, freeClassrooms, freeAuthTrainers });
    }
  }

  const results = document.getElementById('assistantResults');

  if (slots.length === 0) {
    results.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h4>No Available Slots</h4>
        <p>No time slots available for "${escapeHTML(lesson.name)}" on ${fmtDate(date)}.<br>Try a different date or duration.</p>
      </div>`;
    return;
  }

  // Group: earliest slot + all available classrooms/trainers for the date
  const avail = getAvailability(date, '00:00', '23:59');
  const authTrainerAvail = avail.trainers.filter(t => authTrs.some(at => at.id === t.id));

  // Compute HTML for authorised trainers
  let authTrainerHtml = '';
  if (authTrainerAvail.length === 0) {
    authTrainerHtml = '<p class="hint-text">No authorised trainers found.</p>';
  } else {
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
    
    authTrainerAvail.sort((a, b) => {
      if (a.available === b.available) {
        return getHrs(a.id) - getHrs(b.id);
      }
      return a.available ? -1 : 1;
    });

    authTrainerHtml = authTrainerAvail.map(t => {
      let statusHtml = '';
      let itemClass = 'unavailable';
      let detail = '';
      if (t.available) {
        if (t.warning) {
          statusHtml = '<span>⚠️</span>';
          itemClass = 'warning';
          detail = '<span style="font-size:11px;opacity:.8;font-weight:600;color:#b45309;">(' + t.warning.type.toUpperCase() + ')</span>';
        } else {
          statusHtml = '<span>✓</span>';
          itemClass = 'available';
        }
      } else {
        statusHtml = '<span>✗</span>';
        detail = '<span style="font-size:11px;opacity:.7">(Occupied)</span>';
      }
      return `
      <div class="assist-item ${itemClass}">
        ${statusHtml}
        <span>${escapeHTML(t.name)} <span style="font-size:11px; color:var(--gray-500); margin-left:4px;">(${getHrs(t.id)} hrs)</span></span>
        ${detail}
      </div>`;
    }).join('');
  }

  results.innerHTML = `
    <div style="padding: 4px 0 16px">
      <h3 style="font-size:16px;font-weight:800;color:var(--gray-900);margin-bottom:4px">
        Results for: ${escapeHTML(lesson.name)}
      </h3>
      <p style="font-size:13px;color:var(--gray-500)">${fmtDate(date)} · ${duration}h duration · ${slots.length} available slot(s)</p>
    </div>

    <div class="result-section">
      <div class="result-section-title">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2.5">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 8 12 12 14 14"></polyline>
        </svg>
        Suggested Time Slots (earliest first)
      </div>
      ${slots.slice(0, 5).map((s, idx) => `
        <div class="suggest-slot" data-lessonid="${lessonId}" data-date="${date}" data-start="${s.startStr}" data-end="${s.endStr}">
          <div class="suggest-slot-time">
            ${idx === 0 ? '⭐ ' : ''}${fmtTime(s.startStr)} – ${fmtTime(s.endStr)}
          </div>
          <div class="suggest-slot-meta">
            ${s.freeClassrooms.length} classroom(s) · ${s.freeAuthTrainers.length} trainer(s) available
          </div>
        </div>`).join('')}
    </div>

    <div class="result-section">
      <div class="result-section-title">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        </svg>
        Classroom Availability
      </div>
      ${avail.classrooms.map(c => `
        <div class="assist-item ${c.available ? 'available' : 'unavailable'}">
          <span>${c.available ? '✓' : '✗'}</span>
          <span>${escapeHTML(c.name)}</span>
          ${!c.available ? '<span style="font-size:11px;opacity:.7">(Occupied)</span>' : ''}
        </div>`).join('')}
    </div>

    <div class="result-section">
      <div class="result-section-title">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        Authorised Trainer Availability
      </div>
      ${authTrainerHtml}
    </div>`;
};


/* ================================================================
   15. SCHEDULING ASSISTANT (inline form panel)
   ================================================================ */
const updateFormAssistant = () => {
  const batchIds  = Array.from(document.querySelectorAll('#batchSelectDropdown input[type="checkbox"]:checked')).map(cb => cb.value);
  const lessonId  = document.getElementById('formLesson').value;
  const date      = document.getElementById('formDate').value;
  const startTime = document.getElementById('formStartTime').value;
  const endTime   = document.getElementById('formEndTime').value;
  const body      = document.getElementById('formAssistantBody');

  if (!lessonId) {
    body.innerHTML = '<p class="assistant-hint">Select a lesson to get smart suggestions.</p>';
    return;
  }

  const lesson    = getLesson(lessonId);
  const authTrs   = authorisedTrainers(lessonId);

  let html = '';

  // 1. Lesson Progress / Chunking
  if (batchIds.length > 0) {
    batchIds.forEach(batchId => {
      const batch = getBatch(batchId);
      const scheduledEvents = AppState.events.filter(e => (e.batchIds || []).includes(batchId) && e.lessonId === lessonId && e.id !== AppState.editingEventId);
      let scheduledMins = 0;
      scheduledEvents.forEach(e => {
         scheduledMins += timeToMin(e.endTime) - timeToMin(e.startTime);
      });
      const scheduledHours = scheduledMins / 60;
      const totalHours = lesson.durationMins / 60;
      const remainingHours = Math.max(0, totalHours - scheduledHours);
      const progressPct = totalHours > 0 ? Math.min(100, (scheduledHours / totalHours) * 100) : 0;

      html += `<div class="assist-group" style="background:var(--brand-50); padding:12px; border-radius:var(--radius-md); border:1px solid var(--brand-100); margin-bottom: 8px;">
        <h5 style="color:var(--brand-600)">📊 Lesson Progress for ${batch.name}</h5>
        <div style="font-size:12.5px; margin-bottom: 6px; color:var(--gray-800);">
          <strong>${scheduledHours}h</strong> scheduled / <strong>${totalHours}h</strong> total
        </div>
        <div class="batch-progress" style="margin-top:4px; height:6px; background:rgba(255,255,255,0.6);">
          <div class="batch-progress-fill" style="width:${progressPct}%"></div>
        </div>
        <div style="font-size:11px; color:var(--brand-700); margin-top:6px; font-weight:500;">
          ${remainingHours > 0 ? `${remainingHours}h remaining to schedule` : '✅ Fully scheduled!'}
        </div>
      </div>`;
    });
  }

  html += `<div class="assist-group">
    <h5>Authorised Trainers</h5>
    ${authTrs.map(t => `<div class="assist-item available">✓ ${escapeHTML(t.name)}</div>`).join('') || '<p class="hint-text">None configured.</p>'}
  </div>`;

  if (date && startTime && endTime && timeToMin(startTime) < timeToMin(endTime)) {
    const avail = getAvailability(date, startTime, endTime, AppState.editingEventId);
    const freeRooms   = avail.classrooms.filter(c => c.available);
    const freeTrainers = avail.trainers.filter(t => t.available && authTrs.some(a => a.id === t.id));

    html += `<div class="assist-group">
      <h5>Available Classrooms</h5>
      ${avail.classrooms.map(c => `
        <div class="assist-item ${c.available ? 'available' : 'unavailable'}">
          ${c.available ? '✓' : '✗'} ${escapeHTML(c.name)}
        </div>`).join('')}
    </div>`;

    // Compute HTML for trainers side-panel
    let panelTrainerHtml = '';
    const trainerHoursPanel = {};
    AppState.events.forEach(e => {
      if (e.status !== 'cancelled' && e.date) {
        const mins = timeToMin(e.endTime) - timeToMin(e.startTime);
        (e.trainerIds || []).forEach(tid => {
          trainerHoursPanel[tid] = (trainerHoursPanel[tid] || 0) + mins;
        });
        (e.understudyIds || []).forEach(tid => {
          trainerHoursPanel[tid] = (trainerHoursPanel[tid] || 0) + mins;
        });
      }
    });
    
    const getHrsPanel = (tId) => Number(((trainerHoursPanel[tId] || 0) / 60).toFixed(1));
    
    const filteredTrainersPanel = avail.trainers.filter(t => authTrs.some(a => a.id === t.id));
    filteredTrainersPanel.sort((a, b) => {
      if (a.available === b.available) {
        return getHrsPanel(a.id) - getHrsPanel(b.id);
      }
      return a.available ? -1 : 1;
    });

    panelTrainerHtml = filteredTrainersPanel.map(t => {
      let statusHtml = '';
      let itemClass = 'unavailable';
      if (t.available) {
        if (t.warning) {
          statusHtml = '<span style="color:#b45309;font-weight:600;">⚠️ ' + t.warning.type.toUpperCase() + '</span>';
          itemClass = 'warning';
        } else {
          statusHtml = '✓';
          itemClass = 'available';
        }
      } else {
        statusHtml = '✗';
      }
      return `
      <div class="assist-item ${itemClass}">
        ${statusHtml} ${escapeHTML(t.name)} 
        <span style="font-size:11px; color:var(--gray-500); margin-left:4px;">(${getHrsPanel(t.id)} hrs)</span>
      </div>`;
    }).join('') || '<p class="hint-text">No authorised trainers.</p>';


    html += `<div class="assist-group">
      <h5>Available Trainers</h5>
      ${panelTrainerHtml}
    </div>`;

    // Earliest slot suggestion
    const durationMin = timeToMin(endTime) - timeToMin(startTime);
    const slotsToCheck = [];
    for (let m = 8*60; m + durationMin <= 18*60; m += 30) {
      const s = `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
      const en = `${String(Math.floor((m+durationMin)/60)).padStart(2,'0')}:${String((m+durationMin)%60).padStart(2,'0')}`;
      const a = getAvailability(date, s, en, AppState.editingEventId);
      if (a.classrooms.some(c=>c.available) && a.trainers.some(t=>t.available && authTrs.some(a=>a.id===t.id))) {
        slotsToCheck.push({ s, en });
        if (slotsToCheck.length >= 3) break;
      }
    }

    if (slotsToCheck.length > 0) {
      html += `<div class="assist-group">
        <h5>Earliest Available Slots</h5>
        ${slotsToCheck.map(sl => `
          <div class="suggest-slot" style="font-size:12px">
            <div class="suggest-slot-time">${fmtTime(sl.s)} – ${fmtTime(sl.en)}</div>
          </div>`).join('')}
      </div>`;
    }
  } else if (!date) {
    html += `<div class="assist-group">
      <h5>📅 Next Step</h5>
      <p style="font-size:12.5px;color:var(--gray-500)">Select a date to see real-time availability.</p>
    </div>`;
  }

  body.innerHTML = html;
  
  // Render daily view inside scheduling assistant
  const dateStr = document.getElementById('formDate').value;
  const dayViewContainer = document.getElementById('scheduleDayViewContainer');
  if (dayViewContainer) {
    if (dateStr) {
      dayViewContainer.style.display = 'block';
      const filteredEvents = batchIds.length > 0 ? AppState.events.filter(e => batchIds.some(bid => (e.batchIds || []).includes(bid))) : AppState.events;
      window.renderReusableWeekGrid('scheduleDayViewContainer', safeDate(dateStr), filteredEvents, null, 1);
    } else {
      dayViewContainer.style.display = 'none';
      dayViewContainer.innerHTML = '';
    }
  }
};



// --- Auto-generated globals for Vite migration ---
window.updateFormAssistant = updateFormAssistant;
window.runAssistant = runAssistant;
window.renderAssistant = renderAssistant;
