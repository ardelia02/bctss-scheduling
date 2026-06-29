/* ================================================================
   16. VIEW SWITCHER
   ================================================================ */
const renderBatches = () => {
  const grid = document.getElementById('batchesGrid');
  
  const filteredBatches = AppState.batches.filter(b => {
    if (AppState.batchStatusFilter === 'all') return true;
    return (b.status || 'active') === AppState.batchStatusFilter;
  });

  if (filteredBatches.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
        </svg>
        <h4>No Batches Found</h4>
        <p>Try changing the status filter or create a new training batch.</p>
      </div>`;
    return;
  }

  const batchColors = [
    'linear-gradient(90deg,#6366f1,#8b5cf6)',
    'linear-gradient(90deg,#06b6d4,#6366f1)',
    'linear-gradient(90deg,#10b981,#06b6d4)',
    'linear-gradient(90deg,#f59e0b,#f43f5e)',
  ];

  grid.innerHTML = filteredBatches.map((b, i) => {
    const count       = AppState.events.filter(e => (e.batchIds || []).includes(b.id)).length;
    const start       = safeDate(b.startDate);
    const end         = safeDate(b.endDate);
    const total       = (end - start) / (1000 * 60 * 60 * 24);
    const elapsed     = Math.min((new Date() - start) / (1000 * 60 * 60 * 24), total);
    const progress    = total > 0 ? Math.max(0, Math.min(100, (elapsed / total) * 100)) : 0;
    const color       = b.colorHex || (EVENT_COLORS[b.colorIndex % EVENT_COLORS.length] || EVENT_COLORS[0] || "#cccccc");
    
    // Status badges
    let statusBadge = '';
    if (b.status === 'active') statusBadge = '<span class="status-badge status-active">Active</span>';
    else if (b.status === 'upcoming') statusBadge = '<span class="status-badge status-upcoming">Upcoming</span>';
    else if (b.status === 'completed') statusBadge = '<span class="status-badge status-completed">Completed</span>';
    else statusBadge = '<span class="status-badge status-active">Active</span>';

    return `
      <div class="batch-card" style="--batch-color:${color}">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div class="batch-name">${escapeHTML(b.name)}</div>
          <button class="btn btn-ghost btn-sm edit-batch-btn" data-bid="${b.id}" style="padding:2px 6px; font-size:10px;">Edit</button>
        </div>
        <div style="display:flex; align-items:center; gap:8px; margin-top:2px;">
          <div class="batch-dates">${fmtDate(b.startDate)} – ${fmtDate(b.endDate)}</div>
          ${statusBadge}
        </div>
        <div class="batch-stats">
          <div class="batch-stat">
            <div class="batch-stat-value">${b.students}</div>
            <div class="batch-stat-label">Trainees</div>
          </div>
          <div class="batch-stat">
            <div class="batch-stat-value">${count}</div>
            <div class="batch-stat-label">Lessons Scheduled</div>
          </div>
        </div>
        <div class="batch-progress">
          <div class="batch-progress-fill" style="width:${progress.toFixed(0)}%"></div>
        </div>
        <div style="font-size:11px;color:var(--gray-400);margin-top:6px">${progress.toFixed(0)}% programme elapsed</div>
      </div>`;
  }).join('');
};

const renderBatchColorGrid = (selectedColor) => {
  const grid = document.getElementById('batchColorGrid');
  if (!grid) return;
  
  // Initialize grid and event listener once
  if (grid.children.length === 0) {
    grid.innerHTML = PRESET_COLORS.map(c => `
      <div class="color-swatch" 
           style="background-color: ${c}; width: 24px; height: 24px; border-radius: 4px; cursor: pointer; border: 2px solid transparent;"
           data-color="${c}">
      </div>
    `).join('');
    
    // Event delegation on the parent grid
    grid.addEventListener('click', (e) => {
      const swatch = e.target.closest('.color-swatch');
      if (!swatch) return;
      const col = swatch.dataset.color;
      document.getElementById('batchColor').value = col;
      
      // Update selection visual state efficiently without re-rendering HTML
      grid.querySelectorAll('.color-swatch').forEach(s => {
        const isSelected = s === swatch;
        s.classList.toggle('selected', isSelected);
        s.style.border = isSelected ? '2px solid var(--gray-900)' : '2px solid transparent';
      });
    });
  }
  
  // Update initial selected state from arguments
  grid.querySelectorAll('.color-swatch').forEach(s => {
    const isSelected = s.dataset.color === selectedColor;
    s.classList.toggle('selected', isSelected);
    s.style.border = isSelected ? '2px solid var(--gray-900)' : '2px solid transparent';
  });
};

/** Create or Edit a batch */
const saveBatch = (e) => {
  e.preventDefault();
  const id       = document.getElementById('batchId').value;
  const name     = document.getElementById('batchName').value.trim();
  const start    = document.getElementById('batchStart').value;
  const end      = document.getElementById('batchEnd').value;
  const students = parseInt(document.getElementById('batchStudents').value, 10);
  const status   = document.getElementById('batchStatus').value;
  const color    = document.getElementById('batchColor').value;
  const homeroom = document.getElementById('batchHomeroom').value;

  const mentorIds = [...document.querySelectorAll('input[name="batchMentorIds"]:checked')].map(el => el.value);

  if (!name || !start || isNaN(students)) {
    showToast('Please fill in all required batch fields.', 'warning');
    return;
  }
  if (students < 0) {
    showToast('Number of trainees cannot be negative.', 'warning');
    return;
  }
  if (end && new Date(end) <= new Date(start)) {
    showToast('End date must be after start date.', 'warning');
    return;
  }

  if (id) {
    const b = getBatch(id);
    if (b) {
      b.name = name;
      b.startDate = start;
      b.endDate = end;
      b.students = students;
      b.status = status;
      b.mentorIds = mentorIds;
      b.colorHex = color;
      b.homeroom = homeroom;
      showToast(`Batch "${name}" updated!`, 'success');
    }
  } else {
    const batch = { id: `b${uid()}`, name, startDate: start, endDate: end, students, status, mentorIds, colorHex: color, homeroom };
    AppState.batches.push(batch);
    showToast(`Batch "${name}" created!`, 'success');
  }

  closeModal('batchModal');
  renderBatches();
};

const buildHomeroomDropdown = (selectedId = '') => {
  const sel = document.getElementById('batchHomeroom');
  if (!sel) return;
  sel.innerHTML = '<option value="">None</option>' + AppState.classrooms.map(c => 
    `<option value="${c.id}" ${c.id === selectedId ? 'selected' : ''}>${escapeHTML(c.name)}</option>`
  ).join('');
};

/** Build mentor checkbox list for batch modal */
const buildBatchMentorDropdown = (preSelected = []) => {
  const container = document.getElementById('mentorSelectDropdown');
  const label = document.getElementById('mentorSelectLabel');
  
  const optionsHtml = AppState.trainers.map(t => {
    const isChecked = preSelected.includes(t.id);
    return `
      <label class="custom-option">
        <input type="checkbox" name="batchMentorIds" value="${t.id}" ${isChecked ? 'checked' : ''} onchange="updateBatchMentorLabel()">
        <span class="custom-option-name">${escapeHTML(t.name)}</span>
      </label>`;
  }).join('');
  
  container.innerHTML = optionsHtml;
  updateBatchMentorLabel();
};

const updateBatchMentorLabel = () => {
  const checked = [...document.querySelectorAll('input[name="batchMentorIds"]:checked')];
  const label = document.getElementById('mentorSelectLabel');
  if (checked.length === 0) {
    label.textContent = 'Select Mentors...';
  } else if (checked.length === 1) {
    label.textContent = checked[0].nextElementSibling.textContent;
  } else {
    label.textContent = `${checked.length} Mentors Selected`;
  }
};

/* ================================================================
   ADMINS RENDER
   ================================================================ */
const renderAdmins = () => {
  const grid = document.getElementById('adminsGrid');
  if (!grid) return;
  const avatarColors = ['#f43f5e','#8b5cf6','#10b981','#f59e0b','#6366f1'];

  grid.innerHTML = AppState.admins.map((a, i) => {
    return `
      <div class="trainer-card">
        <div class="trainer-avatar" style="background:${avatarColors[i % avatarColors.length]}">${a.name.substring(0, 2).toUpperCase()}</div>
        <div class="trainer-info">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div class="trainer-name">${escapeHTML(a.name)}</div>
            <button class="btn btn-ghost btn-sm edit-admin-btn" data-aid="${a.id}" style="padding:2px 6px; font-size:10px;">Edit</button>
          </div>
          <div class="trainer-meta">Admin Profile</div>
        </div>
      </div>
    `;
  }).join('');
};



// --- Auto-generated globals for Vite migration ---
window.buildHomeroomDropdown = buildHomeroomDropdown;
window.renderBatches = renderBatches;
window.updateBatchMentorLabel = updateBatchMentorLabel;
window.renderBatchColorGrid = renderBatchColorGrid;
window.renderAdmins = renderAdmins;
window.buildBatchMentorDropdown = buildBatchMentorDropdown;
window.saveBatch = saveBatch;
