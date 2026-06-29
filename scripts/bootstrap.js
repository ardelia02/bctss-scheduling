/* ================================================================
   23. BOOTSTRAP / INITIALISE
   ================================================================ */
const populateTimeDropdowns = () => {
  let options = '<option value="">— Select Time —</option>';
  for (let m = 8 * 60; m <= 22 * 60; m += 15) {
    const hh = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    const val = `${hh}:${mm}`;
    options += `<option value="${val}">${val}</option>`;
  }
  const ids = ['formStartTime', 'formEndTime', 'unavailStartTime', 'unavailEndTime'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = options;
  });
};

const init = () => {
  populateTimeDropdowns();
  updateTopbarDate();
  initDragDrop();
  initEventListeners();
  
  // Global Keyboard Accessibility Handler
  document.body.addEventListener('keydown', (e) => {
    // Trigger click on Enter or Space for elements acting as buttons
    if (e.key === 'Enter' || e.key === ' ') {
      const el = e.target;
      const isCustomButton = el.getAttribute('role') === 'button' || el.getAttribute('tabindex') === '0';
      const isNative = el.tagName === 'BUTTON' || el.tagName === 'A' || el.tagName === 'INPUT';
      
      if (isCustomButton && !isNative) {
        e.preventDefault(); // Prevent default scroll for Space
        el.click();
      }
    }
  });

  document.getElementById('loginSplash').style.display = 'flex';
  document.getElementById('appContainer').style.display = 'none';
  document.getElementById('roleSwitcher').style.display = 'none';

  // Populate Admin Dropdown
  const adminSel = document.getElementById('splashAdminSelect');
  if (adminSel && AppState.admins) {
    adminSel.innerHTML = '<option value="">— Select your profile —</option>' + 
      AppState.admins.map(a => `<option value="${a.id}">${escapeHTML(a.name)}</option>`).join('');
  }

  // Import Schedule Confirm
  document.getElementById('confirmImportBtn').addEventListener('click', async () => {
    if (!currentImportTrainerId) return;
    
    const fileInput = document.querySelector('#importScheduleModal input[type="file"]');
    if (!fileInput.value) {
      alert('Please select a file to import.');
      return;
    }
    
    // Generate mock Outlook event for tomorrow 9-11am
    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    const dateStr = tmr.toISOString().split('T')[0];
    
    await window.API.createEvent({
      id: 'ev' + Date.now() + Math.floor(Math.random()*1000),
      lessonId: 'external',
      externalName: 'Outlook: Management Meeting',
      batchId: null,
      date: dateStr,
      startTime: '09:00',
      endTime: '11:00',
      classroomIds: [],
      trainerIds: [currentImportTrainerId],
      status: 'scheduled',
      isCovering: false
    });
    
    closeModal('importScheduleModal');
    fileInput.value = '';
    showToast('Calendar imported successfully!', 'success');
    renderTrainers();
    if (AppState.activeView === 'calendar') renderCalendar();
  });
};

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

window.addEventListener('beforeunload', saveState);


// --- Auto-generated globals for Vite migration ---
window.updateTopbarDate = updateTopbarDate;
window.navigateCalendar = navigateCalendar;
window.initEventListeners = initEventListeners;
window.populateTimeDropdowns = populateTimeDropdowns;
window.init = init;
