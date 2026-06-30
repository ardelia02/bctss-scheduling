/* ================================================================
   15. TRAINER PORTAL RENDER
   ================================================================ */

/** Renders the Next Lesson section for the trainer */
const renderTrainerNextLesson = (trainerEvents, lesson, crNames) => {
  const nextContainer = document.getElementById('trainerNextLesson');
  const next = trainerEvents.find(e => e.date && safeDate(e.date) >= new Date(todayStr()) && e.status !== 'cancelled');
  if (next) {
    nextContainer.innerHTML = `
      <div style="background:var(--brand-50); border: 1px solid var(--brand-200); border-radius:12px; padding:16px;">
        <h4 style="color:var(--brand-700); margin:0 0 8px;">${escapeHTML(getEventDisplayName(next, lesson))}</h4>
        <div style="font-size:14px; color:var(--gray-700); margin-bottom:4px;">📅 ${fmtDate(next.date)} • ${fmtTime(next.startTime)} – ${fmtTime(next.endTime)}</div>
        <div style="font-size:14px; color:var(--gray-700);">📍 ${crNames}</div>
      </div>
    `;
  } else {
    nextContainer.innerHTML = `<p class="empty-state">No upcoming lessons scheduled.</p>`;
  }
};

/** Renders the Trainer Cover Requests section */
const renderTrainerCoverRequestsSection = (t) => {
  const coverRequestsContainer = document.getElementById('trainerCoverRequests');
  if (!coverRequestsContainer) return;
  const coverRequests = AppState.events.filter(e => {
    if (!e.coverRequested || e.status === 'cancelled' || safeDate(e.date || 0) < new Date(todayStr())) return false;
    if (e.coverRequestedTo !== 'all' && e.coverRequestedTo !== t.id) return false;
    if ((e.trainerIds || []).includes(t.id)) return false;
    const authTrs = authorisedTrainers(e.lessonId);
    if (!authTrs.some(at => at.id === t.id)) return false;
    return true;
  });

  if (coverRequests.length > 0) {
    coverRequestsContainer.innerHTML = coverRequests.map(e => {
      const lesson = getLesson(e.lessonId);
      const batchNames  = (e.batchIds || []).map(id => (getBatch(id)||{}).name).filter(Boolean).join(', ');
      const crNames = (e.classroomIds || []).map(id => (getClassroom(id) || {}).name).filter(Boolean).join(', ');
      const requester = getTrainer(e.coverRequestedBy);
      const requesterName = requester ? requester.name : 'Unknown';
      const isDirected = e.coverRequestedTo === t.id;
      const requestedByStr = isDirected ? `<span style="color:var(--danger); font-weight:600;">${requesterName} (Direct Request to You)</span>` : requesterName;
      
      return `
        <div style="background:#fff; border:1px solid var(--border); border-left:4px solid var(--warning); border-radius:12px; padding:16px; margin-bottom:12px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <h4 style="margin:0 0 6px; font-size:15px;">${escapeHTML(getEventDisplayName(e, lesson))}</h4>
              <div style="font-size:13px; color:var(--gray-700); margin-bottom:3px;">📅 ${fmtDate(e.date || '')} • ${fmtTime(e.startTime)} – ${fmtTime(e.endTime)}</div>
              <div style="font-size:13px; color:var(--gray-700);">📍 ${crNames} • Batch: ${batchNames || '—'}</div>
              <div style="font-size:12px; color:var(--gray-500); margin-top:4px;">Requested by: ${requestedByStr}</div>
            </div>
            <div style="display:flex; gap:8px; flex-shrink:0; margin-left:12px;">
              <button class="btn btn-primary btn-sm" aria-label="Accept Cover Request" onclick="acceptCoverRequest('${e.id}')">Accept</button>
              ${isDirected ? `<button class="btn btn-ghost btn-sm" aria-label="Action" aria-label="Reject Cover Request" style="color:var(--danger)" onclick="rejectCoverRequest('${e.id}')">Reject</button>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  } else {
    coverRequestsContainer.innerHTML = `<p class="empty-state">No cover requests pending.</p>`;
  }
};
const renderTrainerPortal = () => {
  if (AppState.currentRole !== 'trainer' || !AppState.currentTrainerId) return;

  const t = getTrainer(AppState.currentTrainerId);
  document.getElementById('trainerPortalGreeting').textContent = `Welcome, ${escapeHTML(t.name)}`;

  const trainerEvents = AppState.events.filter(e => 
      (e.trainerIds || []).includes(t.id) || (e.understudyIds || []).includes(t.id)
    )
    .sort((a,b) => new Date(a.date || 0) - new Date(b.date || 0) || timeToMin(a.startTime) - timeToMin(b.startTime));

  const upcoming = trainerEvents.filter(e => safeDate(e.date || 0) >= new Date(todayStr()) && e.status !== 'cancelled');
  
  // Dashboard - Next Lesson
  const next = trainerEvents.find(e => e.date && safeDate(e.date || 0) >= new Date(todayStr()) && e.status !== 'cancelled');
  let lesson = null, crNames = '';
  if (next) {
    lesson = getLesson(next.lessonId);
    crNames = (next.classroomIds || []).map(id => (getClassroom(id) || {}).name).filter(Boolean).join(', ');
  }
  renderTrainerNextLesson(trainerEvents, lesson, crNames);
  // Dashboard - Stats
  let totalMins = 0;
  trainerEvents.forEach(e => {
    if (e.status !== 'cancelled' && isCurrentMonth(e.date || '')) {
      totalMins += timeToMin(e.endTime) - timeToMin(e.startTime);
    }
  });
  const hrs = Math.round((totalMins / 60) * 10) / 10;

  document.getElementById('trainerStats').innerHTML = `
    <div style="display:flex; gap:20px;">
      <div style="text-align:center; padding:16px; background:var(--gray-50); border-radius:12px; flex:1;">
        <div style="font-size:32px; font-weight:700; color:var(--brand-600);">${hrs}</div>
        <div style="font-size:13px; color:var(--gray-500); font-weight:500;">Teaching Hours (This Month)</div>
      </div>
    </div>
  `;

  // Cover Requests
  renderTrainerCoverRequestsSection(t);
  // My Sent Cover Requests (outgoing — I requested someone to cover for me)
  const myCoverContainer = document.getElementById('trainerMyCoverRequests');
  if (myCoverContainer) {
    const sentRequests = AppState.events.filter(e =>
      e.coverRequestedBy === t.id && (e.coverRequested || e.coverRejected) && safeDate(e.date || 0) >= new Date(todayStr())
    );
    if (sentRequests.length > 0) {
      myCoverContainer.innerHTML = sentRequests.map(e => {
        const lesson = getLesson(e.lessonId);
        const batchNames  = (e.batchIds || []).map(id => (getBatch(id)||{}).name).filter(Boolean).join(', ');
        const toName = e.coverRequestedTo === 'all' ? 'All authorised trainers' : (getTrainer(e.coverRequestedTo) || {}).name || 'Unknown';
        
        let statusHtml = '<span style="font-size:12px; font-weight:600; padding:4px 10px; border-radius:20px; background:rgba(234,179,8,0.15); color:#92400e;">⏳ Pending</span>';
        if (e.coverRejected) {
          statusHtml = '<span style="font-size:12px; font-weight:600; padding:4px 10px; border-radius:20px; background:rgba(239,68,68,0.15); color:var(--danger);">❌ Rejected</span>';
        }
        
        return `
          <div style="background:var(--gray-50); border:1px solid var(--border); border-radius:12px; padding:16px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <h4 style="margin:0 0 6px; font-size:14px;">${escapeHTML(getEventDisplayName(e, lesson))}</h4>
              <div style="font-size:13px; color:var(--gray-600);">📅 ${fmtDate(e.date)} • ${fmtTime(e.startTime)} – ${fmtTime(e.endTime)}</div>
              <div style="font-size:12px; color:var(--gray-500); margin-top:3px;">Sent to: ${toName}</div>
            </div>
            ${statusHtml}
          </div>
        `;
      }).join('');
    } else {
      myCoverContainer.innerHTML = `<p class="empty-state">No sent cover requests.</p>`;
    }
  }

  // Populate Understudy Module Select
  const understudySelect = document.getElementById('understudyModuleSelect');
  if (understudySelect && understudySelect.options.length <= 1) {
    understudySelect.innerHTML = '<option value="">— Select a Module —</option>' + 
      AppState.lessons.map(l => `<option value="${l.id}">${l.name}</option>`).join('');
  }

  // Understudy Inbox (Received Requests)
  const inboxContainer = document.getElementById('understudyInboxList');
  if (inboxContainer) {
    const inboxReqs = AppState.understudyRequests.filter(req => req.toTrainerId === t.id && req.status === 'pending');
    if (inboxReqs.length > 0) {
      inboxContainer.innerHTML = inboxReqs.map(req => {
        const ev = AppState.events.find(e => e.id === req.eventId);
        if (!ev) return '';
        const lesson = getLesson(ev.lessonId);
        const fromT = getTrainer(req.fromTrainerId);
        return `
          <div style="background:var(--gray-50); border:1px solid var(--border); border-radius:12px; padding:16px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <h4 style="margin:0 0 6px; font-size:14px; color:var(--brand-700);">${fromT ? fromT.name : 'Unknown'} wants to understudy</h4>
              <div style="font-size:13px; font-weight:600; color:var(--gray-900); margin-bottom:3px;">${escapeHTML(getEventDisplayName(ev, lesson))}</div>
              <div style="font-size:13px; color:var(--gray-600);">📅 ${fmtDate(ev.date)} • ${fmtTime(ev.startTime)} – ${fmtTime(ev.endTime)}</div>
            </div>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-ghost btn-sm" aria-label="Action" style="color:var(--danger)" onclick="rejectUnderstudyRequest('${req.id}')">Decline</button>
              <button class="btn btn-primary btn-sm" onclick="approveUnderstudyRequest('${req.id}')">Accept</button>
            </div>
          </div>
        `;
      }).join('');
    } else {
      inboxContainer.innerHTML = `<p class="empty-state">No pending understudy requests.</p>`;
    }
  }

  // Understudy Outbox (Sent Requests)
  const outboxContainer = document.getElementById('understudyOutboxList');
  if (outboxContainer) {
    const outboxReqs = AppState.understudyRequests.filter(req => req.fromTrainerId === t.id);
    if (outboxReqs.length > 0) {
      outboxContainer.innerHTML = outboxReqs.map(req => {
        const ev = AppState.events.find(e => e.id === req.eventId);
        if (!ev) return '';
        const lesson = getLesson(ev.lessonId);
        const toT = getTrainer(req.toTrainerId);
        
        let statusHtml = '<span style="font-size:12px; font-weight:600; padding:4px 10px; border-radius:20px; background:rgba(234,179,8,0.15); color:#92400e;">⏳ Pending</span>';
        if (req.status === 'accepted') statusHtml = '<span style="font-size:12px; font-weight:600; padding:4px 10px; border-radius:20px; background:rgba(16,185,129,0.15); color:var(--success);">✅ Accepted</span>';
        if (req.status === 'rejected') statusHtml = '<span style="font-size:12px; font-weight:600; padding:4px 10px; border-radius:20px; background:rgba(239,68,68,0.15); color:var(--danger);">❌ Declined</span>';
        
        return `
          <div style="background:var(--gray-50); border:1px solid var(--border); border-radius:12px; padding:16px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <h4 style="margin:0 0 6px; font-size:14px;">${escapeHTML(getEventDisplayName(ev, lesson))}</h4>
              <div style="font-size:13px; color:var(--gray-600);">📅 ${fmtDate(ev.date)} • ${fmtTime(ev.startTime)} – ${fmtTime(ev.endTime)}</div>
              <div style="font-size:12px; color:var(--gray-500); margin-top:3px;">Requested from: ${toT ? toT.name : 'Unknown'}</div>
            </div>
            <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
              ${statusHtml}
              ${req.status === 'pending' ? `<button class="btn btn-ghost btn-sm" aria-label="Action" style="color:var(--gray-500); padding:2px 8px;" onclick="cancelUnderstudyRequest('${req.id}')">Cancel</button>` : ''}
            </div>
          </div>
        `;
      }).join('');
    } else {
      outboxContainer.innerHTML = `<p class="empty-state">No sent requests.</p>`;
    }
  }

  // Schedule View (Calendar)
  const anchor = AppState.trainerCalendarDate || new Date();
  const from = safeDate(anchor);
  const dayOfWeek = from.getDay();
  from.setDate(from.getDate() - dayOfWeek);
  const to = new Date(from);
  to.setDate(to.getDate() + 6);
  
  const fromStr = from.toLocaleDateString('en-SG', { month: 'short', day: 'numeric' });
  const toStr   = to.toLocaleDateString('en-SG', { month: 'short', day: 'numeric', year: 'numeric' });
  document.getElementById('trainerSchedulePeriod').textContent = `${fromStr} – ${toStr}`;

  const unavailEvents = (AppState.unavailabilities || [])
    .filter(u => u.trainerId === t.id)
    .map(u => ({
      id: u.id,
      date: u.date,
      startTime: u.startTime,
      endTime: u.endTime,
      lessonId: null,
      externalName: u.type === 'leave' ? `[Leave] ${escapeHTML(u.reason)}` : `[${(u.type || 'busy').toUpperCase()}] ${escapeHTML(u.reason)}`,
      status: 'scheduled',
      trainerIds: [u.trainerId],
      classroomIds: [],
      isUnavailability: true
    }));

  window.renderReusableWeekGrid('trainerScheduleGrid', anchor, [...trainerEvents, ...unavailEvents]);
};

/** Save a new unavailability entry */
const saveUnavailability = async (e) => {
  e.preventDefault();
  const id      = document.getElementById('unavailabilityId').value;
  const type    = document.getElementById('unavailType').value;
  const date    = document.getElementById('unavailDate').value;
  const endDate = document.getElementById('unavailEndDate').value;
  const start   = document.getElementById('unavailStartTime').value;
  const end     = document.getElementById('unavailEndTime').value;
  const reason  = document.getElementById('unavailReason').value.trim() || type.toUpperCase();

  if (!date || !start || !end) {
    window.showToast('Please fill in Date, Start Time, and End Time.', 'warning');
    return;
  }

  if (!AppState.unavailabilities) AppState.unavailabilities = [];

  if (id) {
    // Only support single day edit for existing entries
    const entry = AppState.unavailabilities.find(u => u.id === id);
    if (entry) { entry.date = date; entry.startTime = start; entry.endTime = end; entry.reason = reason; entry.type = type; }
  } else {
    // Multi-day creation
    const startD = safeDate(date);
    const endD   = endDate ? safeDate(endDate) : safeDate(date);
    
    if (endD < startD) {
      window.showToast('End Date cannot be before Start Date.', 'warning');
      return;
    }

    // Loop through days and create an entry for each
    for (let d = safeDate(startD); d <= endD; d.setDate(d.getDate() + 1)) {
      const dStr = d.toISOString().split('T')[0];
      await window.API.createUnavailability({ 
        id: `ua${uid()}`, 
        trainerId: AppState.currentTrainerId, 
        type, 
        date: dStr, 
        startTime: start, 
        endTime: end, 
        reason 
      });
    }
  }

  window.saveState();
  window.closeModal('unavailabilityModal');
  window.showToast('Calendar updated!', 'success');
  renderTrainerPortal();
};

/** Delete an unavailability entry */
const deleteUnavailability = (id) => {
  if (!AppState.unavailabilities) return;
  AppState.unavailabilities = AppState.unavailabilities.filter(u => u.id !== id);
  window.saveState();
  window.showToast('Removed.', 'success');
  renderTrainerPortal();
};

/** Accept a cover request */
const acceptCoverRequest = (eventId) => {
  const ev = AppState.events.find(e => e.id === eventId);
  if (!ev) return;
  
  // Replace the requester with the current trainer
  const idx = ev.trainerIds.indexOf(ev.coverRequestedBy);
  if (idx !== -1) {
    ev.trainerIds[idx] = AppState.currentTrainerId;
  } else {
    ev.trainerIds.push(AppState.currentTrainerId);
  }
  
  ev.isCovering = true;
  ev.coverAccepted = true;
  ev.coverRequested = false;
  ev.coverRequestedBy = null;
  ev.coverRequestedTo = null;
  
  window.saveState();
  window.showToast('Cover request accepted!', 'success');
  renderTrainerPortal();
};

/** Reject a directed cover request — bounces back to original trainer */
const rejectCoverRequest = (eventId) => {
  const ev = AppState.events.find(e => e.id === eventId);
  if (!ev) return;

  const originalTrainerId = ev.coverRequestedBy;
  // Clear cover state so it bounces back as pending for original trainer
  ev.coverRequested = false;
  ev.coverRejectedBy = AppState.currentTrainerId;
  ev.coverRejected = true;

  window.saveState();
  window.showToast('Cover request rejected. The original trainer has been notified.', 'warning');
  renderTrainerPortal();
};

/** Trainer: Decline a future class (removes trainer from event, flags unallocated) */
const declineClass = (eventId) => {
  const ev = AppState.events.find(e => e.id === eventId);
  if (!ev) return;
  const tid = AppState.currentTrainerId;

  // Remove this trainer from the event
  ev.trainerIds = ev.trainerIds.filter(id => id !== tid);
  ev.unallocated = true; // flag for admin dashboard

  window.saveState();
  window.closeModal('eventDetailModal');
  window.showToast('You have declined this class. The admin will be notified to reallocate.', 'warning');
  renderTrainerPortal();
};

const navTrainerCalendar = (dir) => {
  const d = new Date(AppState.trainerCalendarDate || new Date());
  d.setDate(d.getDate() + dir * 7);
  AppState.trainerCalendarDate = d;
  renderTrainerPortal();
};



// --- Auto-generated globals for Vite migration ---
window.deleteUnavailability = deleteUnavailability;
window.saveUnavailability = saveUnavailability;
window.declineClass = declineClass;
window.acceptCoverRequest = acceptCoverRequest;
window.rejectCoverRequest = rejectCoverRequest;
window.renderTrainerCoverRequestsSection = renderTrainerCoverRequestsSection;
window.navTrainerCalendar = navTrainerCalendar;
window.renderTrainerNextLesson = renderTrainerNextLesson;
window.renderTrainerPortal = renderTrainerPortal;
