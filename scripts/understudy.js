/* ================================================================
   20.5 UNDERSTUDY LOGIC
   ================================================================ */

window.renderUnderstudyOpportunities = (lessonId) => {
  const list = document.getElementById('understudyOpportunitiesList');
  if (!list) return;
  if (!lessonId) {
    list.innerHTML = '';
    return;
  }
  
  const tId = AppState.currentTrainerId;
  if (!tId) return;

  const today = todayStr();
  const opportunities = AppState.events.filter(ev => 
    ev.lessonId === lessonId && 
    ev.date >= today &&
    ev.trainerIds && ev.trainerIds.length > 0 &&
    !ev.trainerIds.includes(tId) && 
    !(ev.understudyIds && ev.understudyIds.includes(tId))
  ).sort((a,b) => (a.date || '').localeCompare(b.date || '') || a.startTime.localeCompare(b.startTime));

  if (opportunities.length === 0) {
    list.innerHTML = `<p class="empty-state">No upcoming classes available to understudy for this module.</p>`;
    return;
  }

  list.innerHTML = opportunities.map(ev => {
    const trainers = getEventTrainersText(ev);
    
    // Check if a request already exists
    const existingReq = AppState.understudyRequests.find(req => req.eventId === ev.id && req.fromTrainerId === tId);
    
    let actionHtml = '';
    if (existingReq) {
      if (existingReq.status === 'pending') actionHtml = `<span style="font-size:12px; font-weight:600; padding:4px 8px; border-radius:6px; background:rgba(234,179,8,0.15); color:#92400e;">Requested</span>`;
      else if (existingReq.status === 'accepted') actionHtml = `<span style="font-size:12px; font-weight:600; padding:4px 8px; border-radius:6px; background:rgba(16,185,129,0.15); color:var(--success);">Accepted</span>`;
      else if (existingReq.status === 'rejected') actionHtml = `<span style="font-size:12px; font-weight:600; padding:4px 8px; border-radius:6px; background:rgba(239,68,68,0.15); color:var(--danger);">Declined</span>`;
    } else {
      actionHtml = `<button class="btn btn-primary btn-sm" onclick="sendUnderstudyRequest('${ev.id}', '${ev.trainerIds[0]}')">Request to Understudy</button>`;
    }

    return `
      <div style="background:var(--gray-50); border:1px solid var(--border); border-radius:12px; padding:12px 16px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:13px; font-weight:600; color:var(--gray-900); margin-bottom:2px;">📅 ${fmtDate(ev.date)}</div>
          <div style="font-size:13px; color:var(--gray-600);">⏰ ${fmtTime(ev.startTime)} – ${fmtTime(ev.endTime)}</div>
          <div style="font-size:12px; color:var(--gray-500); margin-top:4px;">Taught by: ${trainers}</div>
        </div>
        <div>${actionHtml}</div>
      </div>
    `;
  }).join('');
};

window.sendUnderstudyRequest = (eventId, toTrainerId) => {
  const tId = AppState.currentTrainerId;
  if (!tId) return;
  
  const ev = AppState.events.find(e => e.id === eventId);
  if (!ev) return;
  
  // Check if trainer is already busy during this time
  const avail = getAvailability(ev.date, ev.startTime, ev.endTime);
  const trainerAvail = avail.trainers.find(t => t.id === tId);
  if (!trainerAvail || !trainerAvail.available || trainerAvail.warning) {
    window.showToast('You are already scheduled or busy during this class time. Cannot understudy.', 'danger');
    return;
  }

  AppState.understudyRequests.push({
    id: 'req' + uid(),
    fromTrainerId: tId,
    toTrainerId: toTrainerId,
    eventId: eventId,
    status: 'pending',
    createdAt: new Date().toISOString()
  });
  window.saveState();
  window.showToast('Understudy request sent!', 'success');
  
  // Re-render
  const lessonId = document.getElementById('understudyModuleSelect').value;
  renderUnderstudyOpportunities(lessonId);
  window.renderTrainerPortal();
};

window.approveUnderstudyRequest = (reqId) => {
  const req = AppState.understudyRequests.find(r => r.id === reqId);
  if (!req) return;
  
  const ev = AppState.events.find(e => e.id === req.eventId);
  if (ev) {
    if (!ev.understudyIds) ev.understudyIds = [];
    if (!ev.understudyIds.includes(req.fromTrainerId)) {
      ev.understudyIds.push(req.fromTrainerId);
    }
  }
  
  req.status = 'accepted';
  window.saveState();
  window.showToast('Understudy request approved!', 'success');
  window.renderTrainerPortal();
};

window.rejectUnderstudyRequest = (reqId) => {
  const req = AppState.understudyRequests.find(r => r.id === reqId);
  if (!req) return;
  req.status = 'rejected';
  window.saveState();
  window.showToast('Understudy request declined.', 'success');
  window.renderTrainerPortal();
};

window.cancelUnderstudyRequest = (reqId) => {
  const idx = AppState.understudyRequests.findIndex(r => r.id === reqId);
  if (idx !== -1) {
    AppState.understudyRequests.splice(idx, 1);
    window.saveState();
    window.showToast('Request canceled.', 'success');
    
    const lessonId = document.getElementById('understudyModuleSelect').value;
    if (lessonId) renderUnderstudyOpportunities(lessonId);
    window.renderTrainerPortal();
  }
};


