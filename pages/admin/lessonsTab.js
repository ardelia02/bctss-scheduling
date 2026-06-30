/* ================================================================
   10b. LESSONS VIEW
   ================================================================ */
const renderLessons = () => {
  const grid = document.getElementById('lessonsGrid');
  if (!grid) return;

  if (!AppState.topics || AppState.topics.length === 0) {
    grid.innerHTML = '<p class="empty-state">No topics found.</p>';
    return;
  }

  let html = '';
  AppState.topics.forEach(topic => {
    html += `
      <div class="topic-section" style="margin-bottom:32px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; padding-bottom:8px; border-bottom:2px solid var(--border);">
          <h2 style="margin:0; font-size:18px; color:var(--gray-900); font-weight:700;">${escapeHTML(topic.name)}</h2>
          <button class="btn btn-ghost btn-sm edit-topic-btn" data-tid="${topic.id}">Edit Topic</button>
        </div>
        <div style="display:flex; flex-direction:column; gap:12px;">
    `;
    
    const modules = AppState.lessons.filter(l => l.topicId === topic.id);
    if (modules.length === 0) {
      html += `<p style="font-size:13px; color:var(--gray-500);">No modules under this topic.</p>`;
    } else {
      html += modules.map(l => {
        const authTrs = (AppState.authMatrix[l.id] || []).map(id => getTrainer(id)).filter(Boolean);
        const dur = l.durationHours !== undefined ? l.durationHours : (l.durationMins / 60);
        return `
          <div class="lesson-card" tabindex="0" role="button" style="background:#fff; border:1px solid var(--border); border-radius:12px; padding:16px; box-shadow:0 1px 3px rgba(0,0,0,0.05); display:flex; justify-content:space-between; align-items:flex-start;">
            <div style="flex:1;">
              <h3 style="margin:0 0 6px 0; font-size:16px; color:var(--gray-900);">${l.name}</h3>
              <div style="display:flex; gap:16px; font-size:13px; color:var(--gray-600); margin-bottom:8px;">
                <span>⏱️ ${dur} hrs</span>
                ${(l.prerequisiteIds && l.prerequisiteIds.length > 0) ? `<span style="color:var(--brand-600);">↳ Prereqs: ${l.prerequisiteIds.map(pid => (getLesson(pid) || {}).name || 'Unknown').join(', ')}</span>` : ''}
              </div>
              <div style="font-size:12px; color:var(--gray-500); line-height:1.5;">
                <strong>Authorised Trainers (${authTrs.length}):</strong> ${authTrs.map(t => t.name).join(', ') || 'None'}
              </div>
              ${l.remarks ? `<div style="margin-top:8px; font-size:12px; color:var(--gray-600); background:var(--gray-50); padding:6px 10px; border-radius:6px; border-left:3px solid var(--gray-300);"><em>${l.remarks}</em></div>` : ''}
            </div>
            <button class="btn btn-ghost btn-sm edit-lesson-btn" data-id="${l.id}" style="margin-left:16px; flex-shrink:0;">Edit</button>
          </div>
        `;
      }).join('');
    }
    
    html += `
        </div>
      </div>
    `;
  });
  grid.innerHTML = html;
};

const buildLessonTrainerDropdown = (selectedIds = []) => {
  const dd = document.getElementById('lessonTrainerSelectDropdown');
  const label = document.getElementById('lessonTrainerSelectLabel');
  
  if (AppState.trainers.length === 0) {
    dd.innerHTML = '<div style="padding:12px;color:var(--gray-400);font-size:13px;">No trainers found</div>';
    label.textContent = 'Select Trainers...';
    return;
  }

  dd.innerHTML = AppState.trainers.map(t => {
    const isSel = selectedIds.includes(t.id);
    return `
      <label class="custom-option">
        <input type="checkbox" name="lessonTrainerIds" value="${t.id}" ${isSel ? 'checked' : ''} />
        <span class="custom-option-name">${escapeHTML(t.name)}</span>
      </label>
    `;
  }).join('');

  const updateLabel = () => {
    const checked = [...document.querySelectorAll('input[name="lessonTrainerIds"]:checked')];
    if (checked.length === 0) label.textContent = 'Select Trainers...';
    else if (checked.length === 1) label.textContent = '1 trainer selected';
    else label.textContent = `${checked.length} trainers selected`;
  };
  
  dd.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', updateLabel);
  });
  updateLabel();
};

const saveClassroom = (e) => {
  e.preventDefault();
  const id = document.getElementById('classroomId').value;
  const name = document.getElementById('classroomName').value.trim();
  const type = document.getElementById('classroomType').value.trim();
  const pax = parseInt(document.getElementById('classroomPax').value, 10) || 0;
  
  if (!name) {
    window.showToast('Please enter a classroom name.', 'warning');
    return;
  }
  if (pax <= 0) {
    window.showToast('Classroom capacity must be greater than 0.', 'warning');
    return;
  }
  
  if (id) {
    const c = AppState.classrooms.find(cr => cr.id === id);
    if (c) {
      c.name = name;
      c.type = type;
      c.pax = pax;
      c.capacity = pax;
      window.showToast(`Classroom "${name}" updated!`, 'success');
    }
  } else {
    const newId = `cr${uid()}`;
    AppState.classrooms.push({ id: newId, name, type, pax, capacity: pax });
    window.showToast(`Classroom "${name}" added!`, 'success');
  }
  
  window.closeModal('classroomAddModal');
  window.renderClassrooms();
  
  // Re-build any classroom dropdowns if needed
  const crCheckboxes = document.getElementById('classroomCheckboxes');
  if (crCheckboxes) {
    const existingIds = [...crCheckboxes.querySelectorAll('input:checked')].map(cb => cb.value);
    buildClassroomDropdown(existingIds);
  }
};

const updateLessonPrerequisiteLabel = () => {
  const container = document.getElementById('lessonPrerequisiteSelectDropdown');
  const label = document.getElementById('lessonPrerequisiteSelectLabel');
  if (!container || !label) return;
  const checked = [...container.querySelectorAll('input:checked')].map(cb => cb.nextElementSibling.textContent);
  label.textContent = checked.length > 0 ? checked.join(', ') : 'Select Prerequisites...';
};

const buildLessonPrerequisiteDropdown = (excludeId = null, selectedIds = []) => {
  const container = document.getElementById('lessonPrerequisiteSelectDropdown');
  if (!container) return;
  const safeSelectedIds = Array.isArray(selectedIds) ? selectedIds : (selectedIds ? [selectedIds] : []);
  
  const html = AppState.lessons.filter(l => l.id !== excludeId).map(l => {
    const isChecked = safeSelectedIds.includes(l.id);
    return `
      <label class="custom-option">
        <input type="checkbox" name="lessonPrerequisiteIds" value="${l.id}" ${isChecked ? 'checked' : ''} onchange="updateLessonPrerequisiteLabel()">
        <span class="custom-option-name">${l.name}</span>
      </label>`;
  }).join('');
  container.innerHTML = html || '<div style="padding:8px 12px;font-size:13px;color:var(--gray-500)">No other lessons available</div>';
  updateLessonPrerequisiteLabel();
};

const saveTopic = (e) => {
  e.preventDefault();
  const id = document.getElementById('topicId').value;
  const name = document.getElementById('topicName').value.trim();
  if (!name) return window.showToast('Please enter a topic name', 'warning');
  
  if (id) {
    const t = AppState.topics.find(x => x.id === id);
    if (t) t.name = name;
  } else {
    AppState.topics.push({ id: `top${uid()}`, name });
  }
  window.closeModal('topicModal');
  window.saveState();
  renderLessons();
  window.showToast('Topic saved!', 'success');
};

const saveLesson = (e) => {
  e.preventDefault();
  const id = document.getElementById('lessonId').value;
  const topicId = document.getElementById('lessonTopic').value;
  const name = document.getElementById('lessonName').value.trim();
  const duration = parseFloat(document.getElementById('lessonDuration').value) * 60;
  const prerequisiteIds = [...document.querySelectorAll('input[name="lessonPrerequisiteIds"]:checked')].map(el => el.value);
  const remarks = document.getElementById('lessonRemarks').value;
  
  const authorisedTrainerIds = [...document.querySelectorAll('input[name="lessonTrainerIds"]:checked')].map(el => el.value);

  if (!name || isNaN(duration) || !topicId) {
    window.showToast('Please fill in all required fields (Topic, Name, Duration).', 'warning');
    return;
  }
  if (duration <= 0) {
    window.showToast('Duration must be greater than 0.', 'warning');
    return;
  }

  let lessonId = id;
  if (id) {
    const l = getLesson(id);
    if (l) {
      l.topicId = topicId;
      l.name = name;
      l.durationMins = duration;
      delete l.durationHours; // ensure old durationHours doesn't override durationMins
      l.prerequisiteIds = prerequisiteIds;
      l.remarks = remarks || '';
      window.showToast(`Module "${name}" updated!`, 'success');
    }
  } else {
    lessonId = `ls${uid()}`;
    AppState.lessons.push({ id: lessonId, topicId, name, durationMins: duration, prerequisiteIds: prerequisiteIds, remarks: remarks || '' });
    window.showToast(`Module "${name}" created!`, 'success');
  }

  AppState.authMatrix[lessonId] = authorisedTrainerIds;
  
  window.closeModal('lessonModal');
  renderLessons();
};


