/* ================================================================
   1. SEED DATA – Pre-populated resources and sample schedule
   ================================================================ */



/* ================================================================
   2. APPLICATION STATE
   ================================================================ */
const loadState = () => {
  const saved = localStorage.getItem('bctss_schedule_state');
  if (saved) {
    try {
      let jsonString = saved;
      // If it doesn't look like JSON (starts with {), assume it's base64 encoded
      if (!saved.startsWith('{')) {
        jsonString = decodeBase64(saved);
      }
      const parsed = JSON.parse(jsonString);
      // Validate structural integrity of the parsed state
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('State is not a valid object dictionary.');
      }
      
      // Ensure required collections are arrays
      const collections = ['admins', 'classrooms', 'trainers', 'topics', 'lessons', 'batches', 'events'];
      for (const key of collections) {
        if (parsed[key] && !Array.isArray(parsed[key])) {
          throw new Error(`State corruption: expected array for ${key}`);
        }
      }
      
      return parsed;
    } catch (e) {
      // Optionally notify user
      if (typeof showToast === 'function') {
        setTimeout(() => window.showToast('Local storage corrupted. Default data loaded.', 'danger'), 1000);
      }
    }
  }
  return null;
};

const savedState = loadState();

const AppState = {
  admins:     savedState && savedState.admins ? savedState.admins : (SEED_DATA.admins ? [...SEED_DATA.admins] : []),
  classrooms: savedState && savedState.classrooms ? savedState.classrooms : [...SEED_DATA.classrooms],
  trainers:   savedState && savedState.trainers ? savedState.trainers : [...SEED_DATA.trainers],
  topics:     savedState && savedState.topics ? savedState.topics : [...SEED_DATA.topics],
  lessons:    savedState && savedState.lessons ? savedState.lessons : [...SEED_DATA.lessons],
  unavailabilities: savedState && savedState.unavailabilities ? savedState.unavailabilities : [],
  authMatrix: savedState && savedState.authMatrix ? savedState.authMatrix : Object.assign({}, SEED_DATA.authMatrix),
  batches:    savedState && savedState.batches ? savedState.batches : [...SEED_DATA.batches],
  events:     savedState && savedState.events ? savedState.events : [...SEED_DATA.events],
  coverRequests: savedState && savedState.coverRequests ? savedState.coverRequests : [],
  understudyRequests: savedState && savedState.understudyRequests ? savedState.understudyRequests : [],

  activeView:    'dashboard',
  calendarView:  'month',           // 'month' | 'week'
  calendarDate:  new Date('2026-06-10T00:00:00'),        // current anchor date for calendar
  selectedBatch: 'all',             // 'all' or a batch ID – filters calendar view
  batchStatusFilter: 'active',      // 'all' | 'active' | 'upcoming' | 'completed'

  currentRole: 'admin',             // 'admin' | 'trainer'
  currentTrainerId: null,
  currentAdminId: null,

  // Drag-drop state
  draggingEventId: null,
  dragTarget: null,

  // Edit state
  editingEventId: null,
};

/* ================================================================
   3. PERSISTENCE — save/load state to localStorage
   ================================================================ */
function saveState() {
  try {
    const jsonState = JSON.stringify({
      admins:           AppState.admins,
      classrooms:       AppState.classrooms,
      trainers:         AppState.trainers,
      topics:           AppState.topics,
      lessons:          AppState.lessons,
      authMatrix:       AppState.authMatrix,
      batches:          AppState.batches,
      events:           AppState.events,
      unavailabilities: AppState.unavailabilities || []
    });
    localStorage.setItem('bctss_schedule_state', encodeBase64(jsonState));
  } catch (err) {
    if (typeof showToast === 'function') {
      window.showToast('Failed to save data. Storage quota exceeded.', 'danger');
    }
  }
}
window.saveState = saveState;

// Data Migration: Ensure all lessons have topicId and prerequisiteIds
AppState.lessons.forEach(l => {
  if (!l.topicId) l.topicId = 'top1'; // Default to General
  if (!l.prerequisiteIds) l.prerequisiteIds = [];
});
saveState();

// Ensure all events have an owner and understudyIds
AppState.events.forEach(ev => {
  if (!ev.understudyIds) ev.understudyIds = [];
  if (AppState.admins && AppState.admins.length > 0 && !ev.scheduledBy) {
    const randAdmin = AppState.admins[Math.floor(Math.random() * AppState.admins.length)];
    ev.scheduledBy = randAdmin.id;
  }
});



// --- Auto-generated globals for Vite migration ---
window.savedState  = savedState;
window.AppState    = AppState;
window.loadState   = loadState;
window.SEED_DATA   = SEED_DATA;
