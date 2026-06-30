/* ================================================================
   4. LOOKUP HELPERS
   ================================================================ */
// Helper functions
const getLesson    = (id) => {
  if (id === 'external') return { name: 'Imported Calendar Event', durationHours: 0 };
  return AppState.lessons.find(l => l.id === id) || {};
};
const getBatch     = (id) => AppState.batches.find(b => b.id === id) || {};
const getClassroom = (id) => AppState.classrooms.find(c => c.id === id) || {};
const getTrainer   = (id) => AppState.trainers.find(t => t.id === id) || {};
const getEventTrainersText = (ev) => {
  const main = (ev.trainerIds || []).map(t => (getTrainer(t)||{}).name).filter(Boolean);
  const under = (ev.understudyIds || []).map(t => `Understudy: ${(getTrainer(t)||{}).name}`).filter(Boolean);
  return [...main, ...under].join(', ');
};

const getEventDisplayName = (ev, lesson) => {
  let name = ev.externalName || (lesson ? lesson.name : 'Unknown Lesson');
  if (ev.status === 'cancelled') name = `[Cancelled] ${name}`;
  if (ev.isCovering) name = `[Covering] ${name}`;
  return name;
};

function saveState() {
  try {
    const jsonState = JSON.stringify({
      admins: AppState.admins,
      classrooms: AppState.classrooms,
      trainers: AppState.trainers,
      topics: AppState.topics,
      lessons: AppState.lessons,
      authMatrix: AppState.authMatrix,
      batches: AppState.batches,
      events: AppState.events,
      unavailabilities: AppState.unavailabilities || []
    });
    localStorage.setItem('bctss_schedule_state', encodeBase64(jsonState));
  } catch (err) {
    if (typeof showToast === 'function') {
      showToast('Failed to save data. Storage quota exceeded.', 'danger');
    }
  }
};

const authorisedTrainers = (lessonId) =>
  (AppState.authMatrix[lessonId] || []).map(tid => getTrainer(tid)).filter(t => t.id);



// --- Auto-generated globals for Vite migration ---
window.getLesson = getLesson;
window.getTrainer = getTrainer;
window.getEventDisplayName = getEventDisplayName;
window.authorisedTrainers = authorisedTrainers;
window.saveState = saveState;
window.getClassroom = getClassroom;
window.getEventTrainersText = getEventTrainersText;
window.getBatch = getBatch;
