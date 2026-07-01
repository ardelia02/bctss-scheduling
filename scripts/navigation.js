/* ================================================================
   6. NAVIGATION
   ================================================================ */

/** Switch the active view panel */
const switchView = (viewId) => {
  AppState.activeView = viewId;

  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.view === viewId);
  });

  // Show correct view
  document.querySelectorAll('.view').forEach(el => {
    el.classList.toggle('active', el.id === `view-${viewId}`);
  });

  // Update breadcrumb
  const labels = {
    dashboard: 'Dashboard',
    calendar:  'Calendar',
    schedule:  'Schedule Lesson',
    batches:   'Batches',
    admins:    'Our Admins',
    trainers:  'Trainers',
    classrooms:'Classrooms',
    lessons:   'Lessons Management',
    matrix:    'Authorisation Matrix',
    assistant: 'Scheduling Assistant',
    'trainer-dashboard': 'Trainer Dashboard',
    'trainer-schedule': 'My Schedule',
    'trainer-understudy': 'Understudy Portal',
  };
  document.getElementById('breadcrumb').textContent = labels[viewId] || viewId;

  // Render view-specific content
  // Functions are looked up via window.* to ensure they are resolved at
  // call time (not bundle-parse time), avoiding load-order ReferenceErrors.
  const renderers = {
    dashboard:            () => window.renderDashboard(),
    calendar:             () => window.renderCalendar(),
    schedule:             () => window.renderScheduleForm(),
    batches:              () => window.renderBatches(),
    admins:               () => window.renderAdmins(),
    trainers:             () => window.renderTrainers(),
    classrooms:           () => window.renderClassrooms(),
    lessons:              () => window.renderLessons(),
    matrix:               () => window.renderMatrix(),
    assistant:            () => window.renderAssistant(),
    'trainer-dashboard':  () => window.renderTrainerPortal(),
    'trainer-schedule':   () => window.renderTrainerPortal(),
    'trainer-understudy': () => window.renderTrainerPortal(),
  };
  if (renderers[viewId]) renderers[viewId]();
};



// --- Auto-generated globals for Vite migration ---
window.switchView = switchView;
