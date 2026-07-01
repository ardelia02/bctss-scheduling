import { db, doc, setDoc, onSnapshot, getDoc } from './firebase.js';

const AppState = {
  admins:     [],
  classrooms: [],
  trainers:   [],
  topics:     [],
  lessons:    [],
  unavailabilities: [],
  authMatrix: {},
  batches:    [],
  events:     [],
  coverRequests: [],
  understudyRequests: [],

  activeView:    'dashboard',
  calendarView:  'month',
  calendarDate:  new Date('2026-06-10T00:00:00'),
  selectedBatch: 'all',
  batchStatusFilter: 'active',

  currentRole: 'admin',
  currentTrainerId: null,
  currentAdminId: null,

  draggingEventId: null,
  dragTarget: null,
  editingEventId: null,
  currentDetailEventId:   null,
  currentModalClassroomId: null,
  currentImportTrainerId:  null,
};

window.AppState = AppState;

// Sync function - uploads entire state to Firestore
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
      unavailabilities: AppState.unavailabilities || [],
      coverRequests:    AppState.coverRequests || [],
      understudyRequests: AppState.understudyRequests || []
    });
    
    setDoc(doc(db, 'app', 'global_state'), { payload: jsonState })
      .catch(err => {
        console.error("Firestore Write Error:", err);
        if (typeof showToast === 'function') {
          window.showToast('Failed to save to cloud: ' + err.message, 'danger');
        }
        alert("CRITICAL: Failed to save to Firebase!\n\nError: " + err.message + "\n\nIf this says 'Missing or insufficient permissions', you need to update your Firestore Security Rules to allow read/write.");
      });
      
  } catch (err) {
    if (typeof showToast === 'function') {
      window.showToast('Failed to prepare data for cloud sync.', 'danger');
    }
  }
}
window.saveState = saveState;

// Initial Load & Real-time Listener
let initialLoadDone = false;

onSnapshot(doc(db, 'app', 'global_state'), (docSnap) => {
  if (docSnap.exists()) {
    const data = docSnap.data();
    if (data && data.payload) {
      try {
        const parsed = JSON.parse(data.payload);
        
        Object.assign(AppState, {
          admins: parsed.admins || [],
          classrooms: parsed.classrooms || [],
          trainers: parsed.trainers || [],
          topics: parsed.topics || [],
          lessons: parsed.lessons || [],
          unavailabilities: parsed.unavailabilities || [],
          authMatrix: parsed.authMatrix || {},
          batches: parsed.batches || [],
          events: parsed.events || [],
          coverRequests: parsed.coverRequests || [],
          understudyRequests: parsed.understudyRequests || []
        });

        // Force re-seed if the database is corrupted (empty admins)
        if (AppState.admins.length === 0 && window.SEED_DATA) {
          Object.assign(AppState, {
            admins: [...(window.SEED_DATA?.admins || [])],
            classrooms: [...(window.SEED_DATA?.classrooms || [])],
            trainers: [...(window.SEED_DATA?.trainers || [])],
            topics: [...(window.SEED_DATA?.topics || [])],
            lessons: [...(window.SEED_DATA?.lessons || [])],
            batches: [...(window.SEED_DATA?.batches || [])],
            events: [...(window.SEED_DATA?.events || [])],
            authMatrix: Object.assign({}, window.SEED_DATA?.authMatrix || {})
          });
          saveState(); // upload seed to cloud to fix corruption
        }

        // Trigger UI update
        if (typeof window.renderLoginDropdowns === 'function') {
          window.renderLoginDropdowns();
        }
        if (typeof window.switchView === 'function') {
          window.switchView(AppState.activeView);
        }
        
      } catch (e) {
        console.error("Failed to parse cloud state", e);
      }
    }
  } else {
    // Document doesn't exist yet (first ever run), seed it!
    if (!initialLoadDone) {
      Object.assign(AppState, {
        admins: [...(window.SEED_DATA?.admins || [])],
        classrooms: [...(window.SEED_DATA?.classrooms || [])],
        trainers: [...(window.SEED_DATA?.trainers || [])],
        topics: [...(window.SEED_DATA?.topics || [])],
        lessons: [...(window.SEED_DATA?.lessons || [])],
        batches: [...(window.SEED_DATA?.batches || [])],
        events: [...(window.SEED_DATA?.events || [])],
        authMatrix: Object.assign({}, window.SEED_DATA?.authMatrix || {})
      });
      saveState(); // upload seed to cloud
    }
  }
  
  if (!initialLoadDone) {
    initialLoadDone = true;
    if (typeof window.renderLoginDropdowns === 'function') {
      window.renderLoginDropdowns();
    }
    if (typeof window.switchView === 'function') {
      window.switchView(AppState.activeView);
    }
  }
}, (error) => {
  console.error("Firebase Snapshot Error:", error);
  alert("Database Error: " + error.message + "\n\nIf this says 'Missing or insufficient permissions', you need to go to your Firebase Console -> Firestore Database -> Rules, and set them to 'allow read, write: if true;'");
  
  // Fallback to local data so the app at least loads!
  if (!initialLoadDone) {
    initialLoadDone = true;
    Object.assign(AppState, {
      admins: [...(window.SEED_DATA?.admins || [])],
      classrooms: [...(window.SEED_DATA?.classrooms || [])],
      trainers: [...(window.SEED_DATA?.trainers || [])],
      topics: [...(window.SEED_DATA?.topics || [])],
      lessons: [...(window.SEED_DATA?.lessons || [])],
      batches: [...(window.SEED_DATA?.batches || [])],
      events: [...(window.SEED_DATA?.events || [])],
      authMatrix: Object.assign({}, window.SEED_DATA?.authMatrix || {})
    });
    if (typeof window.renderLoginDropdowns === 'function') {
      window.renderLoginDropdowns();
    }
    if (typeof window.switchView === 'function') {
      window.switchView(AppState.activeView);
    }
  }
});
