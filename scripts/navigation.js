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
  const renderers = {
    dashboard:  renderDashboard,
    calendar:   renderCalendar,
    schedule:   renderScheduleForm,
    batches:    renderBatches,
    admins:     renderAdmins,
    trainers:   renderTrainers,
    classrooms: renderClassrooms,
    lessons:    renderLessons,
    matrix:     renderMatrix,
    assistant:  renderAssistant,
    'trainer-dashboard': renderTrainerPortal,
    'trainer-schedule':  renderTrainerPortal,
    'trainer-understudy': renderTrainerPortal,
  };
  if (renderers[viewId]) renderers[viewId]();
};



// --- Auto-generated globals for Vite migration ---
window.switchView = switchView;
