/* ================================================================
   7. DASHBOARD RENDER
   ================================================================ */
const renderDashboard = () => {
  const today = todayStr();
  const todayEvents = AppState.events.filter(e => e.date === today);

  // Metric cards
  const busyClassroomsToday = new Set(todayEvents.flatMap(e => e.classroomIds || [])).size;
  const busyTrainersToday   = new Set(todayEvents.flatMap(e => e.trainerIds || [])).size;

  const metrics = [
    {
      label: 'Total Classrooms', value: AppState.classrooms.length,
      sub: `${busyClassroomsToday} in use today`,
      color: '#6366f1', bg: '#eef2ff',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
               <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
               <polyline points="9 22 9 12 15 12 15 22"></polyline>
             </svg>`,
    },
    {
      label: 'Available Classrooms', value: AppState.classrooms.length - busyClassroomsToday,
      sub: 'Free right now',
      color: '#10b981', bg: '#d1fae5',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
               <polyline points="20 6 9 17 4 12"></polyline>
             </svg>`,
    },
    {
      label: 'Total Trainers', value: AppState.trainers.length,
      sub: `${busyTrainersToday} assigned today`,
      color: '#8b5cf6', bg: '#ede9fe',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
               <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
               <circle cx="9" cy="7" r="4"></circle>
               <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
               <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
             </svg>`,
    },
    {
      label: 'Trainers Available', value: AppState.trainers.length - busyTrainersToday,
      sub: 'Today',
      color: '#f59e0b', bg: '#fef3c7',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
               <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
               <circle cx="12" cy="7" r="4"></circle>
             </svg>`,
    },
    {
      label: 'Scheduled Lessons', value: AppState.events.length,
      sub: `${todayEvents.length} today`,
      color: '#06b6d4', bg: '#cffafe',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
               <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
               <line x1="16" y1="2" x2="16" y2="6"></line>
               <line x1="8" y1="2" x2="8" y2="6"></line>
               <line x1="3" y1="10" x2="21" y2="10"></line>
             </svg>`,
    },
    {
      label: 'Active Batches', value: AppState.batches.length,
      sub: 'Running programmes',
      color: '#f43f5e', bg: '#ffe4e6',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
               <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
               <circle cx="9" cy="7" r="4"></circle>
             </svg>`,
    },
  ];

  const metricsGrid = document.getElementById('metricsGrid');
  metricsGrid.innerHTML = metrics.map(m => `
    <div class="metric-card" style="--metric-color:${m.color};--metric-bg:${m.bg}">
      <div class="metric-icon">${m.icon}</div>
      <div class="metric-content">
        <div class="metric-value">${m.value}</div>
        <div class="metric-label">${m.label}</div>
        <div class="metric-sub">${m.sub}</div>
      </div>
    </div>
  `).join('');

  // Today's schedule
  const todayCont = document.getElementById('todaySchedule');
  const todayCount = document.getElementById('todayCount');
  todayCount.textContent = `${todayEvents.length} lesson${todayEvents.length !== 1 ? 's' : ''}`;

  if (todayEvents.length === 0) {
    todayCont.innerHTML = `
      <div class="empty-state-small">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2"></rect>
          <line x1="3" y1="10" x2="21" y2="10"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="16" y1="2" x2="16" y2="6"></line>
        </svg>
        <p>No lessons scheduled for today</p>
      </div>`;
  } else {
    todayCont.innerHTML = todayEvents.sort((a,b) => a.startTime.localeCompare(b.startTime)).map(ev => {
      const lesson    = getLesson(ev.lessonId);
      const batches   = (ev.batchIds || []).map(id => getBatch(id)).filter(Boolean);
      const batch     = batches[0] || {};
      const batchNames = batches.map(b => b.name).join(', ') || 'Unknown';
      const classrooms = (ev.classroomIds || []).map(id => getClassroom(id).name).join(', ');
      const trainers  = getEventTrainersText(ev);
      const color     = batch.colorHex || (EVENT_COLORS[batch.colorIndex % EVENT_COLORS.length] || EVENT_COLORS[0] || "#cccccc");
      return `
        <div class="lesson-row ${ev.status === 'cancelled' ? 'cancelled' : ''}" data-evid="${ev.id}" style="cursor:pointer" title="Click for details">
          <div class="lesson-row-color" style="background:${color}"></div>
          <div class="lesson-row-info">
            <div class="lesson-row-name">${escapeHTML(getEventDisplayName(ev, lesson))}</div>
            <div class="lesson-row-meta">${classrooms} · ${trainers}</div>
          </div>
          <div class="lesson-row-time">${fmtTime(ev.startTime)} – ${fmtTime(ev.endTime)}</div>
        </div>`;
    }).join('');
  }

  // Active batches
  const batchList = document.getElementById('activeBatchesList');
  if (AppState.batches.length === 0) {
    batchList.innerHTML = '<p class="hint-text" style="padding:8px 0">No batches created yet.</p>';
  } else {
    batchList.innerHTML = AppState.batches.map(b => {
      const count = AppState.events.filter(e => (e.batchIds || []).includes(b.id)).length;
      return `
        <div class="resource-item">
          <div class="resource-dot" style="background:var(--brand-500)"></div>
          <div style="flex:1">
            <div style="font-weight:700;font-size:13px">${escapeHTML(b.name)}</div>
            <div style="font-size:11px;color:var(--gray-400)">${count} lessons · ${b.students} trainees</div>
          </div>
        </div>`;
    }).join('');
  }

  // Classroom utilisation (today)
  const crUtil = document.getElementById('classroomUtilisation');
  const busyCRs = new Set(todayEvents.flatMap(e => e.classroomIds || []));
  crUtil.innerHTML = AppState.classrooms.map(c => {
    const busy = busyCRs.has(c.id);
    return `
      <div class="util-item">
        <div class="util-header">
          <span>${escapeHTML(c.name)}</span>
          <span style="color:${busy ? 'var(--danger)' : 'var(--success)'}">
            ${busy ? 'Occupied' : 'Free'}
          </span>
        </div>
        <div class="util-bar-bg">
          <div class="util-bar ${busy ? '' : 'free'}" style="width:${busy ? 100 : 0}%"></div>
        </div>
      </div>`;
  }).join('');

  // Trainer availability (today)
  const trAvail = document.getElementById('trainerAvailability');
  const busyTrs = new Set(todayEvents.flatMap(e => e.trainerIds || []));
  trAvail.innerHTML = AppState.trainers.map(t => {
    const busy = busyTrs.has(t.id);
    return `
      <div class="util-item">
        <div class="util-header">
          <span>${escapeHTML(t.name)}</span>
          <span style="color:${busy ? 'var(--warning)' : 'var(--success)'}">
            ${busy ? 'Assigned' : 'Available'}
          </span>
        </div>
        <div class="util-bar-bg">
          <div class="util-bar ${busy ? '' : 'free'}" style="width:${busy ? 100 : 0}%"></div>
        </div>
      </div>`;
  }).join('');

  // Upcoming lessons (next 7 days)
  const upcoming = document.getElementById('upcomingLessons');
  const todayDate = new Date();
  const in7 = new Date(); in7.setDate(todayDate.getDate() + 7);
  const upcomingEvs = AppState.events
    .filter(e => {
      const d = safeDate(e.date || 0);
      return d >= todayDate && d <= in7;
    })
    .sort((a,b) => (a.date || '').localeCompare(b.date || '') || a.startTime.localeCompare(b.startTime))
    .slice(0, 6);

  if (upcomingEvs.length === 0) {
    upcoming.innerHTML = '<p class="hint-text" style="padding:8px 0">No upcoming lessons in the next 7 days.</p>';
  } else {
    upcoming.innerHTML = upcomingEvs.map(ev => {
      const batches = (ev.batchIds || []).map(id => getBatch(id)).filter(Boolean);
      const batch = batches[0] || {};
      const batchNames = batches.map(b => b.name).join(', ') || '?';
      const color = batch.colorHex || (EVENT_COLORS[batch.colorIndex % EVENT_COLORS.length] || EVENT_COLORS[0] || "#cccccc");
      return `
        <div class="resource-item" data-evid="${ev.id}" style="cursor:pointer">
          <div class="resource-dot" style="background:${color}"></div>
          <div style="flex:1;min-width:0">
            <div style="font-weight:700;font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
              ${escapeHTML(getEventDisplayName(ev, getLesson(ev.lessonId)))}
            </div>
            <div style="font-size:11px;color:var(--gray-400)">${fmtDate(ev.date)} · ${fmtTime(ev.startTime)}</div>
          </div>
        </div>`;
    }).join('');
  }

  // ===== ALERTS: Unallocated / Declined Classes =====
  const unallocatedEvs = AppState.events.filter(e =>
    e.unallocated && e.status !== 'cancelled' && safeDate(e.date || 0) >= new Date(todayStr())
  );
  const coverPendingEvs = AppState.events.filter(e =>
    e.coverRequested && e.status !== 'cancelled' && safeDate(e.date || 0) >= new Date(todayStr())
  );

  let alertHtml = '';
  if (unallocatedEvs.length > 0) {
    alertHtml += `<div style="background:rgba(239,68,68,0.08); border:1px solid var(--danger); border-radius:10px; padding:14px 18px; margin-bottom:12px;">
      <div style="font-size:13px; font-weight:700; color:var(--danger); margin-bottom:8px;">⚠️ ${unallocatedEvs.length} Unallocated Class${unallocatedEvs.length > 1 ? 'es' : ''} — Trainer Declined / Removed</div>
      ${unallocatedEvs.map(e => {
        const lesson = getLesson(e.lessonId);
        const batchNames = (e.batchIds || []).map(id => (getBatch(id)||{}).name).filter(Boolean).join(', ') || '?';
        return `<div tabindex="0" role="button" style="font-size:12px; color:var(--gray-700); margin-bottom:4px; cursor:pointer;" onclick="showEventDetail('${e.id}')">
          📅 ${fmtDate(e.date)} ${fmtTime(e.startTime)} — ${lesson ? lesson.name : '?'} (${batchNames})
        </div>`;
      }).join('')}
    </div>`;
  }
  if (coverPendingEvs.length > 0) {
    alertHtml += `<div style="background:rgba(234,179,8,0.08); border:1px solid var(--warning); border-radius:10px; padding:14px 18px; margin-bottom:12px;">
      <div style="font-size:13px; font-weight:700; color:#92400e; margin-bottom:8px;">🔄 ${coverPendingEvs.length} Cover Request${coverPendingEvs.length > 1 ? 's' : ''} Pending</div>
      ${coverPendingEvs.map(e => {
        const lesson = getLesson(e.lessonId); const batch = getBatch(e.batchId);
        return `<div style="font-size:12px; color:var(--gray-700); margin-bottom:4px; cursor:pointer;" onclick="showEventDetail('${e.id}')">
          📅 ${fmtDate(e.date)} ${fmtTime(e.startTime)} — ${lesson ? lesson.name : '?'} (${batch ? batch.name : '?'})
        </div>`;
      }).join('')}
    </div>`;
  }

  const alertsPanel = document.getElementById('dashboardAlerts');
  if (alertsPanel) alertsPanel.innerHTML = alertHtml;
};



// --- Auto-generated globals for Vite migration ---
window.renderDashboard = renderDashboard;
