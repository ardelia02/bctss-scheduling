/* ================================================================
   11. TRAINERS RENDER
   ================================================================ */
const renderTrainers = () => {
  const grid = document.getElementById('trainersGrid');
  const avatarColors = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b'];

  grid.innerHTML = AppState.trainers.map((t, i) => {
    const authorisedLessons = Object.entries(AppState.authMatrix)
      .filter(([, tids]) => tids.includes(t.id))
      .map(([lid]) => getLesson(lid).name)
      .filter(Boolean);

    const todayEvs = AppState.events.filter(ev =>
      ev.date === todayStr() && (ev.trainerIds || []).includes(t.id) && ev.status !== 'cancelled'
    );

    let monthMins = 0;
    AppState.events.forEach(e => {
      if ((e.trainerIds || []).includes(t.id) && e.status !== 'cancelled' && isCurrentMonth(e.date || '')) {
        monthMins += timeToMin(e.endTime) - timeToMin(e.startTime);
      }
    });
    const monthHrs = Math.round((monthMins / 60) * 10) / 10;

    // Upcoming unavailability for this trainer
    const upcomingUnavail = (AppState.unavailabilities || [])
      .filter(u => u.trainerId === t.id && u.date >= todayStr())
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .slice(0, 2);

    const unavailHtml = upcomingUnavail.length > 0 ? `
      <div style="margin-top:8px; font-size:11px; color:var(--gray-500); border-top:1px solid var(--border); padding-top:8px;">
        <div style="font-weight:600; margin-bottom:4px; color:var(--gray-600);">Upcoming Leave/Unavailability:</div>
        ${upcomingUnavail.map(u => `<div style="margin-bottom:2px;">🚫 ${fmtDate(u.date)} ${fmtTime(u.startTime)}–${fmtTime(u.endTime)} — ${escapeHTML(u.reason)}</div>`).join('')}
      </div>` : '';

    const todayHtml = todayEvs.length > 0 ? `📅 ${todayEvs.length} lesson(s) today` : '✅ Available today';
    
    // Convert unavail array to raw data for onclick binding
    const uData = encodeURIComponent(JSON.stringify(upcomingUnavail));

    return `
      <div tabindex=\"0\" role=\"button\" class="trainer-card" style="cursor:pointer; transition:all 0.2s;" onclick="editTrainer('${t.id}', '${monthHrs}', '${todayHtml}', '${uData}')">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div class="trainer-avatar" style="background:${avatarColors[i % avatarColors.length]}">${escapeHTML(t.initials)}</div>
            <div>
              <div class="trainer-name" style="margin-bottom:2px;">${escapeHTML(t.name)}</div>
              <div style="font-size:12px; color:var(--gray-500); margin-bottom:4px;">${t.type || 'Full Time'}</div>
              <div style="font-size:12px; color:var(--brand-600); font-weight:500;">⏳ ${monthHrs} hrs this month</div>
            </div>
          </div>
          <div style="display:flex; flex-direction:column; gap:4px; align-items:flex-end;">
            <button class="btn btn-ghost btn-sm import-trainer-btn" data-tid="${t.id}" style="padding:4px 8px; font-size:11px;" onclick="event.stopPropagation();" title="Import Outlook Calendar">Import ICS</button>
            <button class="btn btn-ghost btn-sm leave-requests-btn" style="padding:4px 8px; font-size:11px; color:var(--gray-600);" onclick="event.stopPropagation(); showTrainerLeaveRequests('${t.id}', '${uData}')">Leaves (${upcomingUnavail.length})</button>
            <button class="btn btn-ghost btn-sm analytics-btn" style="padding:4px 8px; font-size:11px; color:var(--brand-600);" onclick="event.stopPropagation(); openTrainerAnalytics('${t.id}')">Analytics</button>
          </div>
        </div>
      </div>`;
  }).join('');
};

window.openTrainerAnalytics = (trainerId) => {
  const t = getTrainer(trainerId);
  if (!t) return;
  document.getElementById('trainerAnalyticsModalTitle').textContent = `Analytics: ${escapeHTML(t.name)}`;
  
  const trainerEvents = AppState.events.filter(e => 
    (e.trainerIds || []).includes(trainerId) || (e.understudyIds || []).includes(trainerId)
  );

  const monthSelect = document.getElementById('adminTrainerStatsMonthSelect');
  if (monthSelect) {
    monthSelect.dataset.trainerId = trainerId;
    const months = new Set();
    trainerEvents.forEach(e => {
      if (e.status !== 'cancelled' && e.date) {
        months.add(e.date.substring(0, 7));
      }
    });
    const sortedMonths = Array.from(months).sort().reverse();
    const currentSelection = todayStr().substring(0, 7);
    
    monthSelect.innerHTML = `<option value="all">All Time</option>` + sortedMonths.map(m => {
      const d = new Date(m + '-01');
      const label = d.toLocaleDateString('en-SG', { month: 'short', year: 'numeric' });
      return `<option value="${m}">${label}</option>`;
    }).join('');
    
    if (monthSelect.querySelector(`option[value="${currentSelection}"]`)) {
      monthSelect.value = currentSelection;
    } else if (sortedMonths.length > 0) {
      monthSelect.value = sortedMonths[0];
    } else {
      monthSelect.value = 'all';
    }
  }
  
  window.renderAdminTrainerStats(trainerId, monthSelect ? monthSelect.value : 'all');
  openModal('trainerAnalyticsModal');
};

window.renderAdminTrainerStats = (trainerId, monthStr) => {
  const trainerEvents = AppState.events.filter(e => 
    (e.trainerIds || []).includes(trainerId) || (e.understudyIds || []).includes(trainerId)
  );
  
  let totalMins = 0;
  const moduleCounts = {};
  
  trainerEvents.forEach(e => {
    if (e.status !== 'cancelled' && e.date) {
      const eMonth = e.date.substring(0, 7);
      if (monthStr === 'all' || eMonth === monthStr) {
        const mins = timeToMin(e.endTime) - timeToMin(e.startTime);
        totalMins += mins;
        if (!moduleCounts[e.lessonId]) moduleCounts[e.lessonId] = { count: 0, mins: 0 };
        moduleCounts[e.lessonId].count += 1;
        moduleCounts[e.lessonId].mins += mins;
      }
    }
  });
  
  const hrs = Math.round((totalMins / 60) * 10) / 10;
  
  let breakdownHtml = '';
  const sortedModules = Object.keys(moduleCounts).sort((a,b) => moduleCounts[b].mins - moduleCounts[a].mins);
  if (sortedModules.length > 0) {
    breakdownHtml = sortedModules.map(lessonId => {
      const lesson = getLesson(lessonId);
      const m = moduleCounts[lessonId];
      const mHrs = Math.round((m.mins / 60) * 10) / 10;
      return `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; background:#fff; border:1px solid var(--border); border-radius:8px;">
          <div>
            <div style="font-size:13px; font-weight:600; color:var(--gray-900);">${lesson ? lesson.name : 'Unknown Module'}</div>
            <div style="font-size:12px; color:var(--gray-500);">${m.count} lesson${m.count !== 1 ? 's' : ''}</div>
          </div>
          <div style="font-size:14px; font-weight:700; color:var(--brand-600);">${mHrs} hrs</div>
        </div>
      `;
    }).join('');
  } else {
    breakdownHtml = `<div class="empty-state" style="padding:16px;">No modules taught in this period.</div>`;
  }
  
  document.getElementById('adminTrainerStatsContent').innerHTML = `
    <div style="display:flex; gap:20px; margin-bottom:16px;">
      <div style="text-align:center; padding:16px; background:var(--brand-50); border-radius:12px; flex:1;">
        <div style="font-size:32px; font-weight:700; color:var(--brand-600);">${hrs}</div>
        <div style="font-size:13px; color:var(--gray-500); font-weight:500;">Total Teaching Hours</div>
      </div>
    </div>
    <div style="font-size:13px; font-weight:600; color:var(--gray-700); margin-bottom:8px;">Module Breakdown</div>
    <div style="display:flex; flex-direction:column; gap:8px; max-height: 250px; overflow-y:auto; padding-right:4px;">
      ${breakdownHtml}
    </div>
  `;
};

/** Build trainer courses custom dropdown list */
const buildTrainerCoursesDropdown = (preSelected = []) => {
  const container = document.getElementById('trainerCoursesSelectDropdown');
  const label = document.getElementById('trainerCoursesSelectLabel');
  
  const optionsHtml = AppState.lessons.map(l => {
    const isChecked = preSelected.includes(l.id);
    return `
      <label class="custom-option">
        <input type="checkbox" name="trainerCourseIds" value="${l.id}" ${isChecked ? 'checked' : ''} onchange="updateTrainerCoursesLabel()">
        <span class="custom-option-name">${l.name}</span>
      </label>`;
  }).join('');
  
  container.innerHTML = optionsHtml;
  updateTrainerCoursesLabel();
};

const updateTrainerCoursesLabel = () => {
  const checked = [...document.querySelectorAll('input[name="trainerCourseIds"]:checked')];
  const label = document.getElementById('trainerCoursesSelectLabel');
  if (checked.length === 0) {
    label.textContent = 'Select Courses...';
  } else if (checked.length === 1) {
    label.textContent = checked[0].nextElementSibling.textContent;
  } else {
    label.textContent = `${checked.length} Courses Selected`;
  }
};

/** Create or Edit an Admin */
const saveAdmin = (e) => {
  e.preventDefault();
  const id       = document.getElementById('adminId').value;
  const name     = document.getElementById('adminName').value.trim();
  const password = document.getElementById('adminPassword').value.trim();

  if (!name || (!id && !password)) {
    showToast('Name and password are required for new admins.', 'warning');
    return;
  }

  const p = password ? hashPassword(password) : Promise.resolve(null);
  
  p.then(hashedPwd => {
    if (id) {
      const a = AppState.admins.find(adm => adm.id === id);
      if (a) {
        a.name = name;
        if (hashedPwd) a.password = hashedPwd;
        showToast(`Admin "${name}" updated!`, 'success');
      }
    } else {
      const newId = `ad${uid()}`;
      AppState.admins.push({ id: newId, name, password: hashedPwd });
      showToast(`Admin "${name}" added!`, 'success');
    }

    closeModal('adminModal');
    renderAdmins();
    
    // Also update splash login dropdown just in case
    const adminSel = document.getElementById('splashAdminSelect');
    if (adminSel) {
      adminSel.innerHTML = '<option value="">— Select your profile —</option>' + 
        AppState.admins.map(a => `<option value="${a.id}">${escapeHTML(a.name)}</option>`).join('');
    }
  });
};

/** Create or Edit a trainer */
const saveTrainer = (e) => {
  e.preventDefault();
  const id       = document.getElementById('trainerId').value;
  const name     = document.getElementById('trainerName').value.trim();
  const initials = document.getElementById('trainerInitials').value.trim().toUpperCase();
  const type     = document.getElementById('trainerType').value;
  const courseIds= [...document.querySelectorAll('input[name="trainerCourseIds"]:checked')].map(el => el.value);

  if (!name || !initials) {
    showToast('Name and initials are required.', 'warning');
    return;
  }

  let tId = id;
  if (id) {
    const t = getTrainer(id);
    if (t) {
      t.name = name;
      t.initials = initials;
      t.type = type;
      showToast(`Trainer "${name}" updated!`, 'success');
    }
  } else {
    tId = `tr${uid()}`;
    const trainer = { id: tId, name, initials, type };
    AppState.trainers.push(trainer);
    showToast(`Trainer "${name}" added!`, 'success');
  }

  // Update auth matrix for this trainer
  AppState.lessons.forEach(l => {
    if (!AppState.authMatrix[l.id]) AppState.authMatrix[l.id] = [];
    const authArray = AppState.authMatrix[l.id];
    const isChecked = courseIds.includes(l.id);
    
    if (isChecked && !authArray.includes(tId)) {
      authArray.push(tId);
    } else if (!isChecked && authArray.includes(tId)) {
      AppState.authMatrix[l.id] = authArray.filter(t => t !== tId);
    }
  });

  closeModal('trainerModal');
  renderTrainers();
  renderMatrix(); // re-render authorization matrix to include new trainer
};


